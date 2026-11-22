import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import {
  redemptions,
  rewards,
  ledger,
  people,
  teamRedemptions,
  teamRedemptionMembers,
  type Redemption,
} from "@/lib/db/schema";
import { getPersonById } from "@/lib/db/queries";
import { getBalance } from "@/lib/points/service";

/**
 * Redemptions: kids request rewards (points are *reserved* while pending),
 * parents approve (points deducted via a `redeem` ledger row) or deny (reserve
 * released), and later mark approved redemptions delivered. See SPEC §4.6/§4.7.
 *
 *   reserved  = SUM(cost of `requested` redemptions)
 *   available = balance − reserved
 */

export class InsufficientPointsError extends Error {
  constructor() {
    super("Not enough points available.");
    this.name = "InsufficientPointsError";
  }
}
/** The kid already has this exact reward waiting for a parent's decision. */
export class DuplicateRequestError extends Error {
  constructor() {
    super("You already asked for this — it's waiting for a grown-up.");
    this.name = "DuplicateRequestError";
  }
}
/** The reward, kid, or entry isn't in this family (or isn't usable). */
export class RedemptionNotFoundError extends Error {}
/** The request was already decided — e.g. another parent got there first. */
export class RedemptionStateError extends Error {}

async function assertKid(db: Database, familyId: string, kidId: string) {
  const kid = await getPersonById(db, familyId, kidId);
  if (!kid || kid.role !== "kid")
    throw new RedemptionNotFoundError("Child not found");
  return kid;
}

export async function getReserved(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<number> {
  const [row] = await db
    .select({
      reserved: sql<number>`coalesce(sum(${redemptions.cost}), 0)::int`,
    })
    .from(redemptions)
    .where(
      and(
        eq(redemptions.familyId, familyId),
        eq(redemptions.personId, kidId),
        eq(redemptions.status, "requested"),
      ),
    );
  // A kid's share of any still-proposed team redemption is reserved too (unless
  // they've declined it).
  const [teamRow] = await db
    .select({
      reserved: sql<number>`coalesce(sum(${teamRedemptionMembers.share}), 0)::int`,
    })
    .from(teamRedemptionMembers)
    .innerJoin(
      teamRedemptions,
      eq(teamRedemptions.id, teamRedemptionMembers.teamRedemptionId),
    )
    .where(
      and(
        eq(teamRedemptions.familyId, familyId),
        eq(teamRedemptionMembers.personId, kidId),
        eq(teamRedemptions.status, "proposed"),
        ne(teamRedemptionMembers.status, "declined"),
      ),
    );
  return (row?.reserved ?? 0) + (teamRow?.reserved ?? 0);
}

/**
 * How many points the kid has reserved *per reward*, from their own still-pending
 * (`requested`) solo redemptions. Used to reason about a specific goal reward:
 * the points a kid has committed to reward R shouldn't count against their
 * progress toward R (they've saved enough — it's just waiting for approval).
 */
async function reservedByReward(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      rewardId: redemptions.rewardId,
      reserved: sql<number>`coalesce(sum(${redemptions.cost}), 0)::int`,
    })
    .from(redemptions)
    .where(
      and(
        eq(redemptions.familyId, familyId),
        eq(redemptions.personId, kidId),
        eq(redemptions.status, "requested"),
      ),
    )
    .groupBy(redemptions.rewardId);
  const map = new Map<string, number>();
  for (const r of rows) if (r.rewardId) map.set(r.rewardId, r.reserved);
  return map;
}

/** Spendable points right now = balance − reserved. */
export async function getAvailable(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<number> {
  const balance = await getBalance(db, familyId, kidId);
  const reserved = await getReserved(db, familyId, kidId);
  return balance - reserved;
}

/** Request a reward. Reserves the cost; throws if it isn't affordable. */
export async function requestRedemption(
  db: Database,
  familyId: string,
  kidId: string,
  rewardId: string,
): Promise<Redemption> {
  return db.transaction(async (tx) => {
    await assertKid(tx, familyId, kidId);
    // Serialise all of this kid's redemption requests: two fast taps (or two
    // devices) would otherwise each read the balance before the other's reserve
    // landed and both pass the affordability check, over-reserving below zero.
    // Locking the kid's row makes the read-then-insert atomic per kid.
    await tx.execute(
      sql`select 1 from ${people} where ${people.id} = ${kidId} and ${people.familyId} = ${familyId} for update`,
    );
    const [reward] = await tx
      .select()
      .from(rewards)
      .where(
        and(
          eq(rewards.familyId, familyId),
          eq(rewards.id, rewardId),
          eq(rewards.isActive, true),
          // Family-wide, or this kid's own — never another kid's personal goal.
          or(
            isNull(rewards.assignedToKidId),
            eq(rewards.assignedToKidId, kidId),
          ),
        ),
      )
      .limit(1);
    if (!reward) throw new RedemptionNotFoundError("Reward not found");
    // A team-only reward can't be grabbed solo (the kid UI hides this anyway).
    if (reward.isTeam && !reward.allowSolo) throw new InsufficientPointsError();

    // One pending request per reward: a reward already waiting for a parent
    // can't be requested again (it stays reserved and shows as pending).
    const [dupe] = await tx
      .select({ id: redemptions.id })
      .from(redemptions)
      .where(
        and(
          eq(redemptions.familyId, familyId),
          eq(redemptions.personId, kidId),
          eq(redemptions.rewardId, reward.id),
          eq(redemptions.status, "requested"),
        ),
      )
      .limit(1);
    if (dupe) throw new DuplicateRequestError();

    const available = await getAvailable(tx, familyId, kidId);
    // A kid in the red can't redeem anything until they're back to zero.
    if (available < 0 || reward.cost > available) {
      throw new InsufficientPointsError();
    }

    const [row] = await tx
      .insert(redemptions)
      .values({
        familyId,
        personId: kidId,
        rewardId: reward.id,
        rewardName: reward.name,
        cost: reward.cost,
        status: "requested",
      })
      .returning();
    return row;
  });
}

/** Cancel a still-pending request. If `kidId` is given, restrict to own. */
export async function cancelRedemption(
  db: Database,
  familyId: string,
  redemptionId: string,
  kidId?: string,
): Promise<void> {
  const conds = [
    eq(redemptions.familyId, familyId),
    eq(redemptions.id, redemptionId),
    eq(redemptions.status, "requested"),
  ];
  if (kidId) conds.push(eq(redemptions.personId, kidId));
  await db
    .update(redemptions)
    .set({ status: "cancelled", decidedAt: new Date() })
    .where(and(...conds));
}

/**
 * Move one pending request to `approved` (deducting its request-time cost) or
 * `denied`, inside the caller's transaction. The status flip is conditional on
 * the row still being `requested`, so two decisions racing (two parents, or a
 * parent's cash-in against the dashboard Approve, or a kid cancelling) can
 * never both win and deduct twice — the loser gets null.
 */
async function settlePending(
  tx: Database,
  familyId: string,
  redemptionId: string,
  decision: "approved" | "denied",
  decidedBy: string,
  opts: { note?: string; handedOver?: boolean } = {},
): Promise<Redemption | null> {
  const now = new Date();
  const delivered = decision === "approved" && opts.handedOver === true;
  const [r] = await tx
    .update(redemptions)
    .set({
      status: delivered ? "fulfilled" : decision,
      decidedBy,
      decidedAt: now,
      note: opts.note?.trim() || null,
      ...(delivered ? { fulfilledBy: decidedBy, fulfilledAt: now } : {}),
    })
    .where(
      and(
        eq(redemptions.familyId, familyId),
        eq(redemptions.id, redemptionId),
        eq(redemptions.status, "requested"),
      ),
    )
    .returning();
  if (!r) return null;
  if (decision === "approved") {
    // Snapshot on write: charge what the kid asked for at request time.
    await tx.insert(ledger).values({
      familyId,
      personId: r.personId,
      amount: -r.cost,
      type: "redeem",
      reason: r.rewardName,
      rewardId: r.rewardId,
      redemptionId: r.id,
      createdBy: decidedBy,
    });
  }
  return r;
}

/** Approve (deduct points) or deny (release the reserve) a pending request. */
export async function decideRedemption(
  db: Database,
  familyId: string,
  redemptionId: string,
  decision: "approved" | "denied",
  decidedBy: string,
  note?: string,
): Promise<Redemption> {
  return db.transaction(async (tx) => {
    const r = await settlePending(tx, familyId, redemptionId, decision, decidedBy, { note }); // prettier-ignore
    if (!r) throw new RedemptionStateError("Redemption is not pending");
    return r;
  });
}

/** The reward can't be cashed in solo (a team-only reward). */
export class TeamOnlyRewardError extends Error {
  constructor() {
    super(
      "That's a team reward — kids team up for it from their Rewards screen.",
    );
    this.name = "TeamOnlyRewardError";
  }
}

export interface CashInResult {
  redemption: Redemption;
  /** True when it settled the kid's own pending request for this reward. */
  fromRequest: boolean;
}

/**
 * A parent hands a reward to a kid on the spot (issue #189): one step instead
 * of the kid requesting and the parent approving. Same rules as a kid request
 * (active, this kid's or family-wide, not team-only, affordable from
 * *available* points, never while in the red) and the same records — a
 * redemption with the reward snapshotted plus a `redeem` ledger row — so every
 * history, queue and balance treats it like an approved request.
 *
 * If the kid already asked for this reward, that request is approved instead
 * (charging its request-time cost) rather than creating a second one.
 * `handedOver` marks it delivered at once; otherwise it waits in "Awaiting
 * delivery" on the dashboard.
 */
export async function cashInReward(
  db: Database,
  familyId: string,
  kidId: string,
  rewardId: string,
  parentId: string,
  opts: { handedOver: boolean },
): Promise<CashInResult> {
  return db.transaction(async (tx) => {
    await assertKid(tx, familyId, kidId);
    // Same per-kid lock as requestRedemption, so a cash-in and a kid request
    // (or two parents) can't both pass the affordability check.
    await tx.execute(
      sql`select 1 from ${people} where ${people.id} = ${kidId} and ${people.familyId} = ${familyId} for update`,
    );
    const [reward] = await tx
      .select()
      .from(rewards)
      .where(
        and(
          eq(rewards.familyId, familyId),
          eq(rewards.id, rewardId),
          eq(rewards.isActive, true),
          or(
            isNull(rewards.assignedToKidId),
            eq(rewards.assignedToKidId, kidId),
          ),
        ),
      )
      .limit(1);
    if (!reward) throw new RedemptionNotFoundError("Reward not found");
    if (reward.isTeam && !reward.allowSolo) throw new TeamOnlyRewardError();

    const [pending] = await tx
      .select({ id: redemptions.id })
      .from(redemptions)
      .where(
        and(
          eq(redemptions.familyId, familyId),
          eq(redemptions.personId, kidId),
          eq(redemptions.rewardId, reward.id),
          eq(redemptions.status, "requested"),
        ),
      )
      .orderBy(redemptions.requestedAt)
      .limit(1);
    if (pending) {
      // Already reserved when the kid asked — approve it exactly like the
      // dashboard does (no second affordability check, request-time cost).
      const r = await settlePending(tx, familyId, pending.id, "approved", parentId, { handedOver: opts.handedOver }); // prettier-ignore
      if (r) return { redemption: r, fromRequest: true };
      // Lost a race with another decision on that request: fall through and
      // treat this as a fresh cash-in, checked against current points.
    }

    const available = await getAvailable(tx, familyId, kidId);
    if (available < 0 || reward.cost > available) {
      throw new InsufficientPointsError();
    }

    const now = new Date();
    const [row] = await tx
      .insert(redemptions)
      .values({
        familyId,
        personId: kidId,
        rewardId: reward.id,
        rewardName: reward.name,
        cost: reward.cost,
        status: opts.handedOver ? "fulfilled" : "approved",
        requestedAt: now,
        decidedBy: parentId,
        decidedAt: now,
        ...(opts.handedOver ? { fulfilledBy: parentId, fulfilledAt: now } : {}),
      })
      .returning();
    await tx.insert(ledger).values({
      familyId,
      personId: kidId,
      amount: -reward.cost,
      type: "redeem",
      reason: reward.name,
      rewardId: reward.id,
      redemptionId: row.id,
      createdBy: parentId,
    });
    return { redemption: row, fromRequest: false };
  });
}

/** This reward was already refunded. */
export class AlreadyRefundedError extends Error {
  constructor() {
    super("That reward was already refunded.");
    this.name = "AlreadyRefundedError";
  }
}

export interface RefundResult {
  kidId: string;
  rewardName: string;
  amount: number;
}

/**
 * Undo a reward that was paid for (a mistaken cash-in, or a reward that fell
 * through). Writes a linked positive `adjust` row — the `redeem` row is never
 * touched (append-only ledger) — and marks the redemption `refunded`, which
 * also takes it out of "Awaiting delivery". An `adjust` never counts as earned,
 * so milestones and lifetime totals are unaffected. Solo redemptions only:
 * team-up rows have no redemption to settle.
 */
export async function refundRedemption(
  db: Database,
  familyId: string,
  entryId: string,
  refundedBy: string,
): Promise<RefundResult> {
  return db.transaction(async (tx) => {
    const [entry] = await tx
      .select()
      .from(ledger)
      .where(
        and(
          eq(ledger.familyId, familyId),
          eq(ledger.id, entryId),
          eq(ledger.type, "redeem"),
        ),
      )
      .limit(1)
      .for("update");
    if (!entry || !entry.redemptionId) {
      throw new RedemptionNotFoundError("Reward entry not found");
    }
    const [existing] = await tx
      .select({ id: ledger.id })
      .from(ledger)
      .where(eq(ledger.reversesId, entry.id))
      .limit(1);
    if (existing) throw new AlreadyRefundedError();

    await tx.insert(ledger).values({
      familyId,
      personId: entry.personId,
      amount: -entry.amount,
      type: "adjust",
      reason: `Refund: ${entry.reason}`,
      rewardId: entry.rewardId,
      redemptionId: entry.redemptionId,
      reversesId: entry.id,
      createdBy: refundedBy,
    });
    await tx
      .update(redemptions)
      .set({ status: "refunded" })
      .where(
        and(
          eq(redemptions.familyId, familyId),
          eq(redemptions.id, entry.redemptionId),
          inArray(redemptions.status, ["approved", "fulfilled"]),
        ),
      );
    return {
      kidId: entry.personId,
      rewardName: entry.reason,
      amount: -entry.amount,
    };
  });
}

export interface CashInReward {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  affordable: boolean;
  moreNeeded: number;
  /** The kid already asked for it — cashing in approves that request. */
  pending: boolean;
}

/**
 * Rewards a parent can cash in for this kid: active, family-wide or theirs,
 * and redeemable solo. A reward the kid already requested counts as
 * affordable (its points are already set aside), matching how it's approved.
 */
export async function listCashInRewards(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<{ available: number; rewards: CashInReward[] }> {
  const { available, rewards: list } = await listRedeemableRewards(
    db,
    familyId,
    kidId,
  );
  return {
    available,
    rewards: list
      .filter((r) => !r.isTeam || r.allowSolo)
      .map((r) => {
        const affordable = r.pending || (available >= 0 && r.cost <= available);
        return {
          id: r.id,
          name: r.name,
          emoji: r.emoji,
          cost: r.cost,
          affordable,
          moreNeeded: affordable ? 0 : Math.max(0, r.cost - available),
          pending: r.pending,
        };
      }),
  };
}

/** Mark an approved redemption as delivered (no ledger effect). */
export async function fulfillRedemption(
  db: Database,
  familyId: string,
  redemptionId: string,
  fulfilledBy: string,
): Promise<void> {
  await db
    .update(redemptions)
    .set({ status: "fulfilled", fulfilledBy, fulfilledAt: new Date() })
    .where(
      and(
        eq(redemptions.familyId, familyId),
        eq(redemptions.id, redemptionId),
        eq(redemptions.status, "approved"),
      ),
    );
}

export interface RedeemableReward {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  description: string | null;
  affordable: boolean;
  moreNeeded: number;
  isTeam: boolean;
  minKids: number;
  allowSolo: boolean;
  /** The kid already has a pending request for this reward. */
  pending: boolean;
}

/** Active rewards with affordability, plus the kid's available points. */
export async function listRedeemableRewards(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<{ available: number; rewards: RedeemableReward[] }> {
  const [available, pendingByReward] = await Promise.all([
    getAvailable(db, familyId, kidId),
    reservedByReward(db, familyId, kidId),
  ]);
  const rows = await db
    .select()
    .from(rewards)
    .where(
      and(
        eq(rewards.familyId, familyId),
        eq(rewards.isActive, true),
        // Family-wide rewards plus this kid's own — never another kid's.
        or(isNull(rewards.assignedToKidId), eq(rewards.assignedToKidId, kidId)),
      ),
    )
    .orderBy(rewards.sortOrder, rewards.createdAt);

  return {
    available,
    rewards: rows.map((r) => ({
      id: r.id,
      name: r.name,
      emoji: r.emoji,
      cost: r.cost,
      description: r.description,
      affordable: available >= r.cost,
      moreNeeded: Math.max(0, r.cost - available),
      isTeam: r.isTeam,
      minKids: r.minKids,
      allowSolo: r.allowSolo,
      pending: pendingByReward.has(r.id),
    })),
  };
}

export interface GoalProgress {
  reward: { id: string; name: string; emoji: string; cost: number };
  /** Points saved toward *this* reward = balance − points reserved for others. */
  saved: number;
  moreNeeded: number;
  /** 0–100, clamped. */
  pct: number;
  /** This reward is already requested and waiting for a parent's decision. */
  pending: boolean;
}

/**
 * Progress toward one reward. Points the kid has reserved for *other* pending
 * rewards are subtracted (they're spoken for); points reserved for *this* reward
 * are not (they've saved enough — the request is just waiting), so requesting a
 * reward never makes its own bar collapse.
 */
function goalProgress(
  reward: { id: string; name: string; emoji: string; cost: number },
  balance: number,
  totalReserved: number,
  reservedForThis: number,
): GoalProgress {
  const reservedForOthers = totalReserved - reservedForThis;
  // Capped at the cost: progress past 100% is meaningless, and it keeps the
  // "saved / cost" readout sane when the kid has more than the reward costs.
  const saved = Math.min(reward.cost, Math.max(0, balance - reservedForOthers));
  const pct =
    reward.cost > 0
      ? Math.min(100, Math.max(0, Math.round((saved / reward.cost) * 100)))
      : 100;
  return {
    reward,
    saved,
    moreNeeded: Math.max(0, reward.cost - saved),
    pct,
    pending: reservedForThis > 0,
  };
}

/** The kid's chosen savings-goal reward and progress toward it (null if none). */
export async function getKidGoal(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<GoalProgress | null> {
  const kid = await getPersonById(db, familyId, kidId);
  if (!kid?.goalRewardId) return null;
  const [reward] = await db
    .select()
    .from(rewards)
    .where(
      and(
        eq(rewards.familyId, familyId),
        eq(rewards.id, kid.goalRewardId),
        eq(rewards.isActive, true),
      ),
    )
    .limit(1);
  if (!reward) return null;

  const [balance, totalReserved, pendingByReward] = await Promise.all([
    getBalance(db, familyId, kidId),
    getReserved(db, familyId, kidId),
    reservedByReward(db, familyId, kidId),
  ]);
  return goalProgress(
    {
      id: reward.id,
      name: reward.name,
      emoji: reward.emoji,
      cost: reward.cost,
    },
    balance,
    totalReserved,
    pendingByReward.get(reward.id) ?? 0,
  );
}

/**
 * Rewards a parent set aside just for this kid, each with the kid's progress
 * toward it — closest-to-reach first, so the dashboard can lead with the most
 * motivating one. Empty if none are assigned.
 */
export async function listKidAssignedRewards(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<GoalProgress[]> {
  const rows = await db
    .select()
    .from(rewards)
    .where(
      and(
        eq(rewards.familyId, familyId),
        eq(rewards.isActive, true),
        eq(rewards.assignedToKidId, kidId),
      ),
    )
    .orderBy(rewards.sortOrder, rewards.createdAt);
  if (rows.length === 0) return [];

  const [balance, totalReserved, pendingByReward] = await Promise.all([
    getBalance(db, familyId, kidId),
    getReserved(db, familyId, kidId),
    reservedByReward(db, familyId, kidId),
  ]);
  return (
    rows
      .map((reward) =>
        goalProgress(
          {
            id: reward.id,
            name: reward.name,
            emoji: reward.emoji,
            cost: reward.cost,
          },
          balance,
          totalReserved,
          pendingByReward.get(reward.id) ?? 0,
        ),
      )
      // Ready-to-claim and in-progress first; anything already pending sinks below
      // them (it needs no action from the kid), but stays visible as a reminder.
      .sort((a, b) => {
        if (a.pending !== b.pending) return a.pending ? 1 : -1;
        return b.pct - a.pct;
      })
  );
}

/** Set (or clear, with null) the kid's savings-goal reward. */
export async function setKidGoal(
  db: Database,
  familyId: string,
  kidId: string,
  rewardId: string | null,
): Promise<void> {
  await assertKid(db, familyId, kidId);
  if (rewardId) {
    const [reward] = await db
      .select({ id: rewards.id })
      .from(rewards)
      .where(and(eq(rewards.familyId, familyId), eq(rewards.id, rewardId)))
      .limit(1);
    if (!reward) throw new RedemptionNotFoundError("Reward not found");
  }
  await db
    .update(people)
    .set({ goalRewardId: rewardId })
    .where(and(eq(people.familyId, familyId), eq(people.id, kidId)));
}

export async function listKidRedemptions(
  db: Database,
  familyId: string,
  kidId: string,
  limit = 20,
): Promise<Redemption[]> {
  return db
    .select()
    .from(redemptions)
    .where(
      and(eq(redemptions.familyId, familyId), eq(redemptions.personId, kidId)),
    )
    .orderBy(desc(redemptions.requestedAt))
    .limit(limit);
}

export interface QueueEntry {
  id: string;
  rewardName: string;
  cost: number;
  requestedAt: Date;
  kidName: string;
  avatar: string;
  color: string;
}

function queueByStatus(
  db: Database,
  familyId: string,
  status: "requested" | "approved",
) {
  return db
    .select({
      id: redemptions.id,
      rewardName: redemptions.rewardName,
      cost: redemptions.cost,
      requestedAt: redemptions.requestedAt,
      kidName: people.name,
      avatar: people.avatar,
      color: people.color,
    })
    .from(redemptions)
    .innerJoin(people, eq(people.id, redemptions.personId))
    .where(
      and(eq(redemptions.familyId, familyId), eq(redemptions.status, status)),
    )
    .orderBy(redemptions.requestedAt);
}

/** Pending requests awaiting a parent decision. */
export function listPendingRedemptions(
  db: Database,
  familyId: string,
): Promise<QueueEntry[]> {
  return queueByStatus(db, familyId, "requested");
}

/** Approved redemptions not yet marked delivered. */
export function listAwaitingFulfillment(
  db: Database,
  familyId: string,
): Promise<QueueEntry[]> {
  return queueByStatus(db, familyId, "approved");
}
