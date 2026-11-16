import { and, asc, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import {
  ledger,
  milestoneParticipants,
  milestoneUnlocks,
  milestones,
  people,
  type Milestone,
  type MilestoneStart,
} from "@/lib/db/schema";
import { notReversed } from "@/lib/points/service";
import { nextProgress, unlockCount } from "@/lib/domain/milestones";

/**
 * Milestones (issue #181): long-term goals on the points a kid has *earned*,
 * which spending never lowers. Progress is derived from the ledger (never
 * stored). Each time a kid reaches a milestone, one `milestone_unlocks` row is
 * written (seq 1, 2, 3… for repeatables) with the title and reward snapshotted.
 * Unlocks are never revoked. Every function is scoped by the session's
 * `familyId`.
 */

/** Ledger types that count as "earned". Redeems and deductions never count. */
const EARNED_TYPES = ["earn", "bonus"] as const;

export class MilestoneLockedError extends Error {
  constructor() {
    super(
      "This milestone has already been reached, so its points and repeat setting are locked.",
    );
    this.name = "MilestoneLockedError";
  }
}

export interface MilestoneInput {
  title: string;
  reward: string;
  target: number;
  repeats: boolean;
  startMode: MilestoneStart;
  /** True ⇒ every kid, including ones added later. */
  allKids: boolean;
  /** The picked kids when `allKids` is false. */
  kidIds: string[];
}

export interface NewUnlock {
  unlockId: string;
  milestoneId: string;
  personId: string;
  kidName: string;
  title: string;
  reward: string;
  seq: number;
}

/* ---------------------------------------------------------- earned points */

/**
 * Points a kid has earned (earn + bonus rows that were not put back), from
 * `since` on, or ever when `since` is null.
 */
export async function getEarnedPoints(
  db: Database,
  familyId: string,
  personId: string,
  since: Date | null = null,
): Promise<number> {
  const conds = [
    eq(ledger.familyId, familyId),
    eq(ledger.personId, personId),
    inArray(ledger.type, [...EARNED_TYPES]),
    notReversed(),
  ];
  if (since) conds.push(gte(ledger.createdAt, since));
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${ledger.amount}), 0)::int` })
    .from(ledger)
    .where(and(...conds));
  return row?.total ?? 0;
}

/** Lifetime-earned points for every active kid in the family, by kid id. */
export async function getLifetimeEarnedByKid(
  db: Database,
  familyId: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      personId: ledger.personId,
      total: sql<number>`coalesce(sum(${ledger.amount}), 0)::int`,
    })
    .from(ledger)
    .where(
      and(
        eq(ledger.familyId, familyId),
        inArray(ledger.type, [...EARNED_TYPES]),
        notReversed(),
      ),
    )
    .groupBy(ledger.personId);
  return new Map(rows.map((r) => [r.personId, r.total]));
}

/* ------------------------------------------------------------------ kids */

async function activeKidIds(db: Database, familyId: string): Promise<string[]> {
  const rows = await db
    .select({ id: people.id })
    .from(people)
    .where(
      and(
        eq(people.familyId, familyId),
        eq(people.role, "kid"),
        eq(people.isActive, true),
      ),
    );
  return rows.map((r) => r.id);
}

/**
 * Bring the participant rows in line with the picked kids. Rows are never
 * deleted: unticking sets `isActive` false and re-ticking flips it back, so a
 * returning kid keeps their original `countedFrom` and unlock history.
 */
async function syncParticipants(
  db: Database,
  familyId: string,
  milestone: Pick<Milestone, "id" | "createdAt">,
  kidIds: string[],
  /** Were these kids already covered (an "all kids" milestone)? Then they
   *  keep counting from the milestone's start, not from now. */
  wasAllKids: boolean,
): Promise<void> {
  const allowed = new Set(await activeKidIds(db, familyId));
  const picked = [...new Set(kidIds)].filter((id) => allowed.has(id));
  const existing = await db
    .select({
      id: milestoneParticipants.id,
      personId: milestoneParticipants.personId,
    })
    .from(milestoneParticipants)
    .where(
      and(
        eq(milestoneParticipants.familyId, familyId),
        eq(milestoneParticipants.milestoneId, milestone.id),
      ),
    );
  const have = new Set(existing.map((e) => e.personId));

  await db
    .update(milestoneParticipants)
    .set({ isActive: false })
    .where(
      and(
        eq(milestoneParticipants.familyId, familyId),
        eq(milestoneParticipants.milestoneId, milestone.id),
      ),
    );
  if (picked.length > 0) {
    await db
      .update(milestoneParticipants)
      .set({ isActive: true })
      .where(
        and(
          eq(milestoneParticipants.familyId, familyId),
          eq(milestoneParticipants.milestoneId, milestone.id),
          inArray(milestoneParticipants.personId, picked),
        ),
      );
  }
  const fresh = picked.filter((id) => !have.has(id));
  if (fresh.length > 0) {
    const countedFrom = wasAllKids ? milestone.createdAt : new Date();
    await db.insert(milestoneParticipants).values(
      fresh.map((personId) => ({
        familyId,
        milestoneId: milestone.id,
        personId,
        countedFrom,
      })),
    );
  }
}

/* ------------------------------------------------------------------ CRUD */

export async function createMilestone(
  db: Database,
  familyId: string,
  input: MilestoneInput,
  createdBy?: string,
): Promise<Milestone> {
  const [row] = await db
    .insert(milestones)
    .values({
      familyId,
      title: input.title,
      reward: input.reward,
      target: input.target,
      repeats: input.repeats,
      startMode: input.startMode,
      allKids: input.allKids,
      createdBy: createdBy ?? null,
    })
    .returning();
  if (!input.allKids) {
    await syncParticipants(db, familyId, row, input.kidIds, false);
  }
  return row;
}

export async function getMilestone(
  db: Database,
  familyId: string,
  id: string,
): Promise<Milestone | null> {
  const [row] = await db
    .select()
    .from(milestones)
    .where(and(eq(milestones.familyId, familyId), eq(milestones.id, id)))
    .limit(1);
  return row ?? null;
}

/** Kids explicitly picked (and still ticked) for a milestone. */
export async function activeParticipantIds(
  db: Database,
  familyId: string,
  milestoneId: string,
): Promise<string[]> {
  const rows = await db
    .select({ personId: milestoneParticipants.personId })
    .from(milestoneParticipants)
    .where(
      and(
        eq(milestoneParticipants.familyId, familyId),
        eq(milestoneParticipants.milestoneId, milestoneId),
        eq(milestoneParticipants.isActive, true),
      ),
    );
  return rows.map((r) => r.personId);
}

async function unlockCountFor(
  db: Database,
  familyId: string,
  milestoneId: string,
): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(milestoneUnlocks)
    .where(
      and(
        eq(milestoneUnlocks.familyId, familyId),
        eq(milestoneUnlocks.milestoneId, milestoneId),
      ),
    );
  return row?.n ?? 0;
}

/** Whether the points target and repeat setting can still change. */
export async function isMilestoneLocked(
  db: Database,
  familyId: string,
  milestoneId: string,
): Promise<boolean> {
  return (await unlockCountFor(db, familyId, milestoneId)) > 0;
}

/**
 * Update a milestone. The start mode never changes after creation. Once any
 * kid has reached it, the target and repeat setting are locked too: changing
 * them would re-number past unlocks (a lower target would unlock many at once,
 * a higher one would stall progress).
 */
export async function updateMilestone(
  db: Database,
  familyId: string,
  id: string,
  input: MilestoneInput,
): Promise<void> {
  const current = await getMilestone(db, familyId, id);
  if (!current) return;
  const changesRule =
    current.target !== input.target || current.repeats !== input.repeats;
  if (changesRule && (await isMilestoneLocked(db, familyId, id))) {
    throw new MilestoneLockedError();
  }
  await db
    .update(milestones)
    .set({
      title: input.title,
      reward: input.reward,
      target: input.target,
      repeats: input.repeats,
      allKids: input.allKids,
    })
    .where(and(eq(milestones.familyId, familyId), eq(milestones.id, id)));
  if (!input.allKids) {
    await syncParticipants(
      db,
      familyId,
      current,
      input.kidIds,
      current.allKids,
    );
  }
}

export async function setMilestoneActive(
  db: Database,
  familyId: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  await db
    .update(milestones)
    .set({ isActive })
    .where(and(eq(milestones.familyId, familyId), eq(milestones.id, id)));
}

/** Delete a milestone. Its unlocks stay (milestone_id set null), so a reward
 *  that is still owed keeps showing on the dashboard. */
export async function deleteMilestone(
  db: Database,
  familyId: string,
  id: string,
): Promise<void> {
  await db
    .delete(milestones)
    .where(and(eq(milestones.familyId, familyId), eq(milestones.id, id)));
}

/* ------------------------------------------------------------ evaluation */

interface Coverage {
  milestone: Milestone;
  /** Count points from here on (null ⇒ every point ever). */
  since: Date | null;
}

/** Active milestones that cover this kid, with where each starts counting. */
async function coveringMilestones(
  db: Database,
  familyId: string,
  personId: string,
): Promise<Coverage[]> {
  const rows = await db
    .select({
      milestone: milestones,
      countedFrom: milestoneParticipants.countedFrom,
      participantActive: milestoneParticipants.isActive,
    })
    .from(milestones)
    .leftJoin(
      milestoneParticipants,
      and(
        eq(milestoneParticipants.milestoneId, milestones.id),
        eq(milestoneParticipants.personId, personId),
      ),
    )
    .where(
      and(eq(milestones.familyId, familyId), eq(milestones.isActive, true)),
    );
  const out: Coverage[] = [];
  for (const r of rows) {
    const covered = r.milestone.allKids || r.participantActive === true;
    if (!covered) continue;
    out.push({
      milestone: r.milestone,
      since:
        r.milestone.startMode === "lifetime"
          ? null
          : (r.countedFrom ?? r.milestone.createdAt),
    });
  }
  return out;
}

async function maxSeqByMilestone(
  db: Database,
  familyId: string,
  personId: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      milestoneId: milestoneUnlocks.milestoneId,
      max: sql<number>`max(${milestoneUnlocks.seq})::int`,
    })
    .from(milestoneUnlocks)
    .where(
      and(
        eq(milestoneUnlocks.familyId, familyId),
        eq(milestoneUnlocks.personId, personId),
      ),
    )
    .groupBy(milestoneUnlocks.milestoneId);
  const map = new Map<string, number>();
  for (const r of rows) if (r.milestoneId) map.set(r.milestoneId, r.max);
  return map;
}

/** Earned points per distinct start time, so each sum runs once. */
async function earnedSinceCache(
  db: Database,
  familyId: string,
  personId: string,
) {
  const cache = new Map<string, number>();
  return async (since: Date | null) => {
    const key = since ? since.toISOString() : "ever";
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const total = await getEarnedPoints(db, familyId, personId, since);
    cache.set(key, total);
    return total;
  };
}

/**
 * Re-check a kid's milestones and record any newly reached ones. Idempotent and
 * safe under races: a duplicate (milestone, kid, seq) insert is ignored. Skips
 * kids who are deactivated or not in this family.
 */
export async function evaluateMilestones(
  db: Database,
  familyId: string,
  personId: string,
): Promise<NewUnlock[]> {
  const [kid] = await db
    .select({ name: people.name })
    .from(people)
    .where(
      and(
        eq(people.familyId, familyId),
        eq(people.id, personId),
        eq(people.role, "kid"),
        eq(people.isActive, true),
      ),
    )
    .limit(1);
  if (!kid) return [];

  const covering = await coveringMilestones(db, familyId, personId);
  if (covering.length === 0) return [];
  const maxSeq = await maxSeqByMilestone(db, familyId, personId);
  const earned = await earnedSinceCache(db, familyId, personId);

  const unlocked: NewUnlock[] = [];
  for (const { milestone: m, since } of covering) {
    const progress = await earned(since);
    const count = unlockCount(progress, m.target, m.repeats);
    const from = (maxSeq.get(m.id) ?? 0) + 1;
    if (count < from) continue;
    const values = [];
    for (let seq = from; seq <= count; seq++) {
      values.push({
        familyId,
        milestoneId: m.id,
        personId,
        seq,
        title: m.title,
        reward: m.reward,
        points: m.target * seq,
      });
    }
    const inserted = await db
      .insert(milestoneUnlocks)
      .values(values)
      .onConflictDoNothing()
      .returning({ id: milestoneUnlocks.id, seq: milestoneUnlocks.seq });
    for (const row of inserted) {
      unlocked.push({
        unlockId: row.id,
        milestoneId: m.id,
        personId,
        kidName: kid.name,
        title: m.title,
        reward: m.reward,
        seq: row.seq,
      });
    }
  }
  return unlocked;
}

/** Re-check every active kid in the family (after a create, edit or resume). */
export async function evaluateMilestonesForFamily(
  db: Database,
  familyId: string,
): Promise<NewUnlock[]> {
  const out: NewUnlock[] = [];
  for (const id of await activeKidIds(db, familyId)) {
    out.push(...(await evaluateMilestones(db, familyId, id)));
  }
  return out;
}

/* ----------------------------------------------------------------- reads */

export interface MilestoneSummary {
  milestone: Milestone;
  /** Names of the kids it covers (all active kids for an "all kids" one). */
  kidNames: string[];
  unlocked: number;
  /** Unlocked but not yet handed out. */
  owed: number;
}

/** Every milestone in the family (newest first) with unlock counts. */
export async function listMilestones(
  db: Database,
  familyId: string,
): Promise<MilestoneSummary[]> {
  const list = await db
    .select()
    .from(milestones)
    .where(eq(milestones.familyId, familyId))
    .orderBy(desc(milestones.createdAt));
  if (list.length === 0) return [];

  const ids = list.map((m) => m.id);
  const [counts, parts, kids] = await Promise.all([
    db
      .select({
        milestoneId: milestoneUnlocks.milestoneId,
        unlocked: sql<number>`count(*)::int`,
        owed: sql<number>`count(*) filter (where ${milestoneUnlocks.fulfilledAt} is null)::int`,
      })
      .from(milestoneUnlocks)
      .where(
        and(
          eq(milestoneUnlocks.familyId, familyId),
          inArray(milestoneUnlocks.milestoneId, ids),
        ),
      )
      .groupBy(milestoneUnlocks.milestoneId),
    db
      .select({
        milestoneId: milestoneParticipants.milestoneId,
        personId: milestoneParticipants.personId,
      })
      .from(milestoneParticipants)
      .where(
        and(
          eq(milestoneParticipants.familyId, familyId),
          eq(milestoneParticipants.isActive, true),
          inArray(milestoneParticipants.milestoneId, ids),
        ),
      ),
    db
      .select({ id: people.id, name: people.name })
      .from(people)
      .where(
        and(
          eq(people.familyId, familyId),
          eq(people.role, "kid"),
          eq(people.isActive, true),
        ),
      )
      .orderBy(asc(people.sortOrder), asc(people.createdAt)),
  ]);
  const countBy = new Map(counts.map((c) => [c.milestoneId, c]));
  const nameBy = new Map(kids.map((k) => [k.id, k.name]));

  return list.map((m) => {
    const c = countBy.get(m.id);
    const kidNames = m.allKids
      ? kids.map((k) => k.name)
      : parts
          .filter((p) => p.milestoneId === m.id)
          .map((p) => nameBy.get(p.personId))
          .filter((n): n is string => Boolean(n));
    return {
      milestone: m,
      kidNames,
      unlocked: c?.unlocked ?? 0,
      owed: c?.owed ?? 0,
    };
  });
}

export interface KidMilestone {
  id: string;
  title: string;
  reward: string;
  target: number;
  repeats: boolean;
  /** Points made toward the next unlock, and the points one unlock needs. */
  into: number;
  of: number;
  /** A one-time milestone already reached. */
  done: boolean;
  /** Times this kid has reached it. */
  unlocked: number;
}

export interface KidOwedReward {
  id: string;
  /** Null when the milestone was deleted after it was reached. */
  milestoneId: string | null;
  title: string;
  reward: string;
  unlockedAt: Date;
}

export interface KidMilestones {
  lifetime: number;
  items: KidMilestone[];
  /** Reached but not yet handed out (incl. ones whose milestone was deleted). */
  owed: KidOwedReward[];
}

/** What the kid's home screen shows: lifetime total, progress, owed rewards. */
export async function listKidMilestones(
  db: Database,
  familyId: string,
  personId: string,
): Promise<KidMilestones> {
  const [covering, lifetime, unlockRows] = await Promise.all([
    coveringMilestones(db, familyId, personId),
    getEarnedPoints(db, familyId, personId, null),
    db
      .select({
        id: milestoneUnlocks.id,
        milestoneId: milestoneUnlocks.milestoneId,
        title: milestoneUnlocks.title,
        reward: milestoneUnlocks.reward,
        unlockedAt: milestoneUnlocks.unlockedAt,
        fulfilledAt: milestoneUnlocks.fulfilledAt,
      })
      .from(milestoneUnlocks)
      .where(
        and(
          eq(milestoneUnlocks.familyId, familyId),
          eq(milestoneUnlocks.personId, personId),
        ),
      )
      .orderBy(asc(milestoneUnlocks.unlockedAt)),
  ]);
  const earned = await earnedSinceCache(db, familyId, personId);

  const items: KidMilestone[] = [];
  for (const { milestone: m, since } of covering) {
    const progress = since ? await earned(since) : lifetime;
    const next = nextProgress(progress, m.target, m.repeats);
    items.push({
      id: m.id,
      title: m.title,
      reward: m.reward,
      target: m.target,
      repeats: m.repeats,
      into: next.into,
      of: next.of,
      done: next.done,
      unlocked: unlockRows.filter((u) => u.milestoneId === m.id).length,
    });
  }
  return {
    lifetime,
    items,
    owed: unlockRows
      .filter((u) => u.fulfilledAt === null)
      .map((u) => ({
        id: u.id,
        milestoneId: u.milestoneId,
        title: u.title,
        reward: u.reward,
        unlockedAt: u.unlockedAt,
      })),
  };
}

export interface OwedUnlock {
  id: string;
  kidName: string;
  avatar: string;
  color: string;
  title: string;
  reward: string;
  unlockedAt: Date;
}

/** Rewards kids have reached that a parent hasn't handed out yet. */
export async function listOwedUnlocks(
  db: Database,
  familyId: string,
): Promise<OwedUnlock[]> {
  return db
    .select({
      id: milestoneUnlocks.id,
      kidName: people.name,
      avatar: people.avatar,
      color: people.color,
      title: milestoneUnlocks.title,
      reward: milestoneUnlocks.reward,
      unlockedAt: milestoneUnlocks.unlockedAt,
    })
    .from(milestoneUnlocks)
    .innerJoin(people, eq(people.id, milestoneUnlocks.personId))
    .where(
      and(
        eq(milestoneUnlocks.familyId, familyId),
        eq(people.familyId, familyId),
        isNull(milestoneUnlocks.fulfilledAt),
      ),
    )
    .orderBy(asc(milestoneUnlocks.unlockedAt));
}

/** Mark an unlocked reward as handed out. Returns false if not found/already done. */
export async function fulfillUnlock(
  db: Database,
  familyId: string,
  unlockId: string,
  fulfilledBy: string,
  now: Date = new Date(),
): Promise<boolean> {
  const rows = await db
    .update(milestoneUnlocks)
    .set({ fulfilledAt: now, fulfilledBy })
    .where(
      and(
        eq(milestoneUnlocks.familyId, familyId),
        eq(milestoneUnlocks.id, unlockId),
        isNull(milestoneUnlocks.fulfilledAt),
      ),
    )
    .returning({ id: milestoneUnlocks.id });
  return rows.length > 0;
}
