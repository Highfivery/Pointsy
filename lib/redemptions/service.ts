import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import {
  redemptions,
  rewards,
  ledger,
  people,
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
class NotFoundError extends Error {}
class InvalidStateError extends Error {}

async function assertKid(db: Database, familyId: string, kidId: string) {
  const kid = await getPersonById(db, familyId, kidId);
  if (!kid || kid.role !== "kid") throw new NotFoundError("Child not found");
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
  return row?.reserved ?? 0;
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
    if (!reward) throw new NotFoundError("Reward not found");

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
    const [r] = await tx
      .select()
      .from(redemptions)
      .where(
        and(
          eq(redemptions.familyId, familyId),
          eq(redemptions.id, redemptionId),
          eq(redemptions.status, "requested"),
        ),
      )
      .limit(1);
    if (!r) throw new InvalidStateError("Redemption is not pending");

    if (decision === "approved") {
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
    await tx
      .update(redemptions)
      .set({
        status: decision,
        decidedBy,
        decidedAt: new Date(),
        note: note?.trim() || null,
      })
      .where(eq(redemptions.id, r.id));
    return r;
  });
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
}

/** Active rewards with affordability, plus the kid's available points. */
export async function listRedeemableRewards(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<{ available: number; rewards: RedeemableReward[] }> {
  const available = await getAvailable(db, familyId, kidId);
  const rows = await db
    .select()
    .from(rewards)
    .where(and(eq(rewards.familyId, familyId), eq(rewards.isActive, true)))
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
    })),
  };
}

export interface GoalProgress {
  reward: { id: string; name: string; emoji: string; cost: number };
  available: number;
  moreNeeded: number;
  /** 0–100, clamped. */
  pct: number;
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

  const available = await getAvailable(db, familyId, kidId);
  const pct =
    reward.cost > 0
      ? Math.min(100, Math.max(0, Math.round((available / reward.cost) * 100)))
      : 100;
  return {
    reward: {
      id: reward.id,
      name: reward.name,
      emoji: reward.emoji,
      cost: reward.cost,
    },
    available,
    moreNeeded: Math.max(0, reward.cost - available),
    pct,
  };
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
    if (!reward) throw new NotFoundError("Reward not found");
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
