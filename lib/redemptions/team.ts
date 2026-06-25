import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import {
  rewards,
  people,
  ledger,
  teamRedemptions,
  teamRedemptionMembers,
  type TeamRedemption,
} from "@/lib/db/schema";
import { getAvailable } from "./service";
import { evenShares } from "./split";

/**
 * Team redemptions: several kids split a "team reward" evenly. A kid proposes
 * and picks teammates; each teammate opts in (their share is reserved while
 * pending); a parent then approves, deducting every member's share via a per-kid
 * `redeem` ledger row. Append-only ledger + snapshot-on-write, same as solo
 * redemptions. See SPEC.
 */

export class TeamRewardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeamRewardError";
  }
}
export class NotEnoughKidsError extends TeamRewardError {
  constructor(min: number) {
    super(`This reward needs at least ${min} kids.`);
    this.name = "NotEnoughKidsError";
  }
}
export class ShareUnaffordableError extends TeamRewardError {
  constructor() {
    super("Someone can't afford their share.");
    this.name = "ShareUnaffordableError";
  }
}
export class InvalidTeamStateError extends TeamRewardError {}
export class NotFoundError extends TeamRewardError {}

/** Propose a team redemption: reserves each member's even share immediately. */
export async function proposeTeamRedemption(
  db: Database,
  familyId: string,
  proposerId: string,
  rewardId: string,
  teammateIds: string[],
): Promise<TeamRedemption> {
  return db.transaction(async (tx) => {
    const [reward] = await tx
      .select()
      .from(rewards)
      .where(
        and(
          eq(rewards.familyId, familyId),
          eq(rewards.id, rewardId),
          eq(rewards.isActive, true),
        ),
      )
      .limit(1);
    if (!reward) throw new NotFoundError("Reward not found.");
    if (!reward.isTeam) throw new TeamRewardError("That isn't a team reward.");

    const kidRows = await tx
      .select({ id: people.id })
      .from(people)
      .where(and(eq(people.familyId, familyId), eq(people.role, "kid")));
    const kidSet = new Set(kidRows.map((r) => r.id));

    // Proposer first so they absorb any rounding remainder.
    const ids = [proposerId, ...teammateIds.filter((id) => id !== proposerId)]
      .filter((id, i, a) => a.indexOf(id) === i)
      .filter((id) => kidSet.has(id));
    if (!ids.includes(proposerId)) {
      throw new TeamRewardError("Only a kid can propose a team reward.");
    }
    if (ids.length < reward.minKids)
      throw new NotEnoughKidsError(reward.minKids);

    const shares = evenShares(reward.cost, ids.length);
    const proposerAvailable = await getAvailable(tx, familyId, proposerId);
    if (proposerAvailable < shares[0]) throw new ShareUnaffordableError();

    const [tr] = await tx
      .insert(teamRedemptions)
      .values({
        familyId,
        rewardId: reward.id,
        rewardName: reward.name,
        cost: reward.cost,
        proposedBy: proposerId,
        status: "proposed",
      })
      .returning();
    await tx.insert(teamRedemptionMembers).values(
      ids.map((personId, i) => ({
        teamRedemptionId: tr.id,
        personId,
        share: shares[i],
        status:
          personId === proposerId
            ? ("accepted" as const)
            : ("invited" as const),
      })),
    );
    return tr;
  });
}

/** A teammate accepts or declines an invite. Declining cancels the whole thing. */
export async function respondTeamInvite(
  db: Database,
  familyId: string,
  teamRedemptionId: string,
  kidId: string,
  accept: boolean,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [tr] = await tx
      .select()
      .from(teamRedemptions)
      .where(
        and(
          eq(teamRedemptions.familyId, familyId),
          eq(teamRedemptions.id, teamRedemptionId),
          eq(teamRedemptions.status, "proposed"),
        ),
      )
      .limit(1);
    if (!tr) throw new InvalidTeamStateError("This team-up is no longer open.");

    const [member] = await tx
      .select()
      .from(teamRedemptionMembers)
      .where(
        and(
          eq(teamRedemptionMembers.teamRedemptionId, teamRedemptionId),
          eq(teamRedemptionMembers.personId, kidId),
          eq(teamRedemptionMembers.status, "invited"),
        ),
      )
      .limit(1);
    if (!member) throw new InvalidTeamStateError("Nothing to respond to.");

    if (!accept) {
      await tx
        .update(teamRedemptionMembers)
        .set({ status: "declined" })
        .where(eq(teamRedemptionMembers.id, member.id));
      await tx
        .update(teamRedemptions)
        .set({ status: "cancelled", decidedAt: new Date() })
        .where(eq(teamRedemptions.id, tr.id));
      return;
    }

    // Their share is already reserved, so available ≥ 0 means they can cover it.
    const available = await getAvailable(tx, familyId, kidId);
    if (available < 0) throw new ShareUnaffordableError();
    await tx
      .update(teamRedemptionMembers)
      .set({ status: "accepted" })
      .where(eq(teamRedemptionMembers.id, member.id));
  });
}

/** The proposer calls off a still-pending team-up. */
export async function cancelTeamRedemption(
  db: Database,
  familyId: string,
  id: string,
  kidId: string,
): Promise<void> {
  await db
    .update(teamRedemptions)
    .set({ status: "cancelled", decidedAt: new Date() })
    .where(
      and(
        eq(teamRedemptions.familyId, familyId),
        eq(teamRedemptions.id, id),
        eq(teamRedemptions.proposedBy, kidId),
        eq(teamRedemptions.status, "proposed"),
      ),
    );
}

/** Parent approves (deduct each share) or denies (release) a team redemption. */
export async function decideTeamRedemption(
  db: Database,
  familyId: string,
  id: string,
  decision: "approved" | "denied",
  decidedBy: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [tr] = await tx
      .select()
      .from(teamRedemptions)
      .where(
        and(
          eq(teamRedemptions.familyId, familyId),
          eq(teamRedemptions.id, id),
          eq(teamRedemptions.status, "proposed"),
        ),
      )
      .limit(1);
    if (!tr) throw new InvalidTeamStateError("This team-up isn't pending.");

    if (decision === "approved") {
      const members = await tx
        .select()
        .from(teamRedemptionMembers)
        .where(eq(teamRedemptionMembers.teamRedemptionId, id));
      if (members.some((m) => m.status !== "accepted")) {
        throw new InvalidTeamStateError("Everyone needs to opt in first.");
      }
      for (const m of members) {
        const available = await getAvailable(tx, familyId, m.personId);
        if (available < 0) throw new ShareUnaffordableError();
      }
      for (const m of members) {
        await tx.insert(ledger).values({
          familyId,
          personId: m.personId,
          amount: -m.share,
          type: "redeem",
          reason: tr.rewardName,
          rewardId: tr.rewardId,
          createdBy: decidedBy,
        });
      }
    }
    await tx
      .update(teamRedemptions)
      .set({
        status: decision,
        decidedBy,
        decidedAt: new Date(),
      })
      .where(eq(teamRedemptions.id, tr.id));
  });
}

/** Mark an approved team redemption delivered (no ledger effect). */
export async function fulfillTeamRedemption(
  db: Database,
  familyId: string,
  id: string,
  fulfilledBy: string,
): Promise<void> {
  await db
    .update(teamRedemptions)
    .set({ status: "fulfilled", fulfilledBy, fulfilledAt: new Date() })
    .where(
      and(
        eq(teamRedemptions.familyId, familyId),
        eq(teamRedemptions.id, id),
        eq(teamRedemptions.status, "approved"),
      ),
    );
}

/* ----------------------------------------------------------------- views */

export interface TeamMemberView {
  personId: string;
  name: string;
  avatar: string;
  color: string;
  share: number;
  status: "invited" | "accepted" | "declined";
}

export interface TeamRedemptionView {
  id: string;
  rewardName: string;
  cost: number;
  status: TeamRedemption["status"];
  proposedBy: string;
  createdAt: Date;
  members: TeamMemberView[];
}

async function buildViews(
  db: Database,
  rows: TeamRedemption[],
): Promise<TeamRedemptionView[]> {
  if (rows.length === 0) return [];
  const memberRows = await db
    .select({
      teamRedemptionId: teamRedemptionMembers.teamRedemptionId,
      personId: teamRedemptionMembers.personId,
      share: teamRedemptionMembers.share,
      status: teamRedemptionMembers.status,
      name: people.name,
      avatar: people.avatar,
      color: people.color,
    })
    .from(teamRedemptionMembers)
    .innerJoin(people, eq(people.id, teamRedemptionMembers.personId))
    .where(
      inArray(
        teamRedemptionMembers.teamRedemptionId,
        rows.map((r) => r.id),
      ),
    );
  const byTr = new Map<string, TeamMemberView[]>();
  for (const m of memberRows) {
    const list = byTr.get(m.teamRedemptionId) ?? [];
    list.push({
      personId: m.personId,
      name: m.name,
      avatar: m.avatar,
      color: m.color,
      share: m.share,
      status: m.status,
    });
    byTr.set(m.teamRedemptionId, list);
  }
  return rows.map((r) => ({
    id: r.id,
    rewardName: r.rewardName,
    cost: r.cost,
    status: r.status,
    proposedBy: r.proposedBy,
    createdAt: r.createdAt,
    members: byTr.get(r.id) ?? [],
  }));
}

/** Active team-ups (proposed or approved) a kid is part of. */
export async function listKidTeamRedemptions(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<TeamRedemptionView[]> {
  const mine = await db
    .selectDistinct({ id: teamRedemptionMembers.teamRedemptionId })
    .from(teamRedemptionMembers)
    .where(eq(teamRedemptionMembers.personId, kidId));
  const ids = mine.map((m) => m.id);
  if (ids.length === 0) return [];
  const rows = await db
    .select()
    .from(teamRedemptions)
    .where(
      and(
        eq(teamRedemptions.familyId, familyId),
        inArray(teamRedemptions.id, ids),
        inArray(teamRedemptions.status, ["proposed", "approved"]),
      ),
    )
    .orderBy(desc(teamRedemptions.createdAt));
  return buildViews(db, rows);
}

/** Open invites awaiting this kid's yes/no. */
export async function listTeamInvitesFor(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<TeamRedemptionView[]> {
  const invited = await db
    .select({ id: teamRedemptionMembers.teamRedemptionId })
    .from(teamRedemptionMembers)
    .where(
      and(
        eq(teamRedemptionMembers.personId, kidId),
        eq(teamRedemptionMembers.status, "invited"),
      ),
    );
  const ids = invited.map((m) => m.id);
  if (ids.length === 0) return [];
  const rows = await db
    .select()
    .from(teamRedemptions)
    .where(
      and(
        eq(teamRedemptions.familyId, familyId),
        inArray(teamRedemptions.id, ids),
        eq(teamRedemptions.status, "proposed"),
      ),
    )
    .orderBy(desc(teamRedemptions.createdAt));
  return buildViews(db, rows);
}

/** Team redemptions ready for a parent to approve (everyone has opted in). */
export async function listTeamRedemptionsAwaitingApproval(
  db: Database,
  familyId: string,
): Promise<TeamRedemptionView[]> {
  const rows = await db
    .select()
    .from(teamRedemptions)
    .where(
      and(
        eq(teamRedemptions.familyId, familyId),
        eq(teamRedemptions.status, "proposed"),
      ),
    )
    .orderBy(teamRedemptions.createdAt);
  const views = await buildViews(db, rows);
  // Only those where every member has accepted are actionable.
  return views.filter((v) => v.members.every((m) => m.status === "accepted"));
}
