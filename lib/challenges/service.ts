import { and, eq, gt, gte, lte, inArray, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import {
  challenges,
  challengeParticipants,
  challengeAwards,
  choreSubmissions,
  ledger,
  people,
  type Challenge,
  type ChallengeScope,
  type ChallengeGoal,
  type ChallengeRecurrence,
} from "@/lib/db/schema";
import { localDate, weekStart, addDays } from "@/lib/timezone";
import { listSubmittableChores } from "@/lib/submissions/service";

/**
 * Challenges: time-boxed goals a parent sets. Progress is derived (never stored)
 * from the ledger and chore submissions; the bonus is paid out exactly once per
 * kid via an idempotent `challenge_awards` row + a `bonus` ledger entry. Family
 * challenges award every participating kid the full bonus. See SPEC.
 */

const ACTIVE_SUBMISSION = ["pending", "approved"] as const;

export interface ChallengeInput {
  title: string;
  description?: string | null;
  scope: ChallengeScope;
  goalType: ChallengeGoal;
  goalTarget: number;
  bonusPoints: number;
  recurrence?: ChallengeRecurrence;
  /** Pay the bonus automatically (default) or hold it for a parent to confirm. */
  autoAward?: boolean;
  startsOn: string;
  /** Null/undefined ⇒ no end (only valid for weekly challenges). */
  endsOn?: string | null;
  /** Participating kids; empty ⇒ the whole family. */
  kidIds?: string[];
}

/** All kid ids in the family (used to resolve "everyone" participation). */
async function familyKidIds(db: Database, familyId: string): Promise<string[]> {
  const rows = await db
    .select({ id: people.id })
    .from(people)
    .where(and(eq(people.familyId, familyId), eq(people.role, "kid")));
  return rows.map((r) => r.id);
}

/** Explicit participants, or all kids when none were chosen. */
export async function participantKidIds(
  db: Database,
  familyId: string,
  challengeId: string,
): Promise<string[]> {
  const rows = await db
    .select({ personId: challengeParticipants.personId })
    .from(challengeParticipants)
    .where(eq(challengeParticipants.challengeId, challengeId));
  if (rows.length > 0) return rows.map((r) => r.personId);
  return familyKidIds(db, familyId);
}

async function replaceParticipants(
  db: Database,
  familyId: string,
  challengeId: string,
  kidIds: string[] | undefined,
) {
  await db
    .delete(challengeParticipants)
    .where(eq(challengeParticipants.challengeId, challengeId));
  if (!kidIds || kidIds.length === 0) return;
  const allowed = new Set(await familyKidIds(db, familyId));
  const clean = [...new Set(kidIds)].filter((id) => allowed.has(id));
  if (clean.length === 0) return;
  await db
    .insert(challengeParticipants)
    .values(clean.map((personId) => ({ challengeId, personId })));
}

export async function createChallenge(
  db: Database,
  familyId: string,
  input: ChallengeInput,
  createdBy?: string,
): Promise<Challenge> {
  const [row] = await db
    .insert(challenges)
    .values({
      familyId,
      title: input.title,
      description: input.description ?? null,
      scope: input.scope,
      goalType: input.goalType,
      goalTarget: input.goalTarget,
      bonusPoints: input.bonusPoints,
      recurrence: input.recurrence ?? "none",
      autoAward: input.autoAward ?? true,
      startsOn: input.startsOn,
      endsOn: input.endsOn ?? null,
      createdBy: createdBy ?? null,
    })
    .returning();
  await replaceParticipants(db, familyId, row.id, input.kidIds);
  return row;
}

export async function updateChallenge(
  db: Database,
  familyId: string,
  id: string,
  input: ChallengeInput,
): Promise<void> {
  await db
    .update(challenges)
    .set({
      title: input.title,
      description: input.description ?? null,
      scope: input.scope,
      goalType: input.goalType,
      goalTarget: input.goalTarget,
      bonusPoints: input.bonusPoints,
      recurrence: input.recurrence ?? "none",
      autoAward: input.autoAward ?? true,
      startsOn: input.startsOn,
      endsOn: input.endsOn ?? null,
    })
    .where(and(eq(challenges.familyId, familyId), eq(challenges.id, id)));
  await replaceParticipants(db, familyId, id, input.kidIds);
}

export async function setChallengeActive(
  db: Database,
  familyId: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  await db
    .update(challenges)
    .set({ isActive })
    .where(and(eq(challenges.familyId, familyId), eq(challenges.id, id)));
}

export async function deleteChallenge(
  db: Database,
  familyId: string,
  id: string,
): Promise<void> {
  await db
    .delete(challenges)
    .where(and(eq(challenges.familyId, familyId), eq(challenges.id, id)));
}

export async function getChallenge(
  db: Database,
  familyId: string,
  id: string,
): Promise<Challenge | null> {
  const [row] = await db
    .select()
    .from(challenges)
    .where(and(eq(challenges.familyId, familyId), eq(challenges.id, id)))
    .limit(1);
  return row ?? null;
}

export function listChallenges(
  db: Database,
  familyId: string,
): Promise<Challenge[]> {
  return db
    .select()
    .from(challenges)
    .where(eq(challenges.familyId, familyId))
    .orderBy(challenges.startsOn, challenges.createdAt);
}

/* --------------------------------------------------------------- progress */

/** Sum of points *earned* (chores/custom, not bonuses) by kids within window. */
async function earnedPoints(
  db: Database,
  familyId: string,
  kidIds: string[],
  timezone: string,
  startsOn: string,
  endsOn: string,
): Promise<number> {
  if (kidIds.length === 0) return 0;
  const rows = await db
    .select({ amount: ledger.amount, createdAt: ledger.createdAt })
    .from(ledger)
    .where(
      and(
        eq(ledger.familyId, familyId),
        inArray(ledger.personId, kidIds),
        eq(ledger.type, "earn"),
        gt(ledger.amount, 0),
      ),
    );
  let sum = 0;
  for (const r of rows) {
    const d = localDate(timezone, r.createdAt);
    if (d >= startsOn && d <= endsOn) sum += r.amount;
  }
  return sum;
}

/** Count of approved chore submissions by kids within window. */
async function choreCount(
  db: Database,
  familyId: string,
  kidIds: string[],
  startsOn: string,
  endsOn: string,
): Promise<number> {
  if (kidIds.length === 0) return 0;
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(choreSubmissions)
    .where(
      and(
        eq(choreSubmissions.familyId, familyId),
        inArray(choreSubmissions.personId, kidIds),
        eq(choreSubmissions.status, "approved"),
        gte(choreSubmissions.localDate, startsOn),
        lte(choreSubmissions.localDate, endsOn),
      ),
    );
  return row?.n ?? 0;
}

/** Family-local dates within window on which a kid did all their core chores. */
async function coreCompleteDays(
  db: Database,
  familyId: string,
  kidId: string,
  timezone: string,
  startsOn: string,
  endsOn: string,
  now: Date,
): Promise<Set<string>> {
  const submittable = await listSubmittableChores(
    db,
    familyId,
    kidId,
    timezone,
    now,
  );
  const coreIds = submittable
    .filter((c) => c.isCore && c.eligible)
    .map((c) => c.id);
  if (coreIds.length === 0) return new Set();

  const rows = await db
    .selectDistinct({
      localDate: choreSubmissions.localDate,
      choreId: choreSubmissions.choreId,
    })
    .from(choreSubmissions)
    .where(
      and(
        eq(choreSubmissions.familyId, familyId),
        eq(choreSubmissions.personId, kidId),
        inArray(choreSubmissions.status, ACTIVE_SUBMISSION),
        inArray(choreSubmissions.choreId, coreIds),
        gte(choreSubmissions.localDate, startsOn),
        lte(choreSubmissions.localDate, endsOn),
      ),
    );
  const byDay = new Map<string, number>();
  for (const r of rows) {
    byDay.set(r.localDate, (byDay.get(r.localDate) ?? 0) + 1);
  }
  const done = new Set<string>();
  for (const [day, n] of byDay) {
    if (n >= coreIds.length) done.add(day);
  }
  return done;
}

/** The active scoring window + idempotency key for a challenge on `today`, or
 *  null if the challenge isn't running today. One-off → its whole span (key "");
 *  weekly → the current Mon–Sun week clamped to the span (key = week start). */
export interface ChallengeWindow {
  start: string;
  end: string;
  key: string;
}

export function currentWindow(
  challenge: Pick<Challenge, "startsOn" | "endsOn" | "recurrence">,
  today: string,
): ChallengeWindow | null {
  if (today < challenge.startsOn) return null;
  if (challenge.endsOn && today > challenge.endsOn) return null;
  if (challenge.recurrence === "weekly") {
    const ws = weekStart(today);
    const we = addDays(ws, 6);
    return {
      start: ws < challenge.startsOn ? challenge.startsOn : ws,
      end: challenge.endsOn && we > challenge.endsOn ? challenge.endsOn : we,
      key: ws,
    };
  }
  // One-off challenges always have an end date (enforced at validation).
  return { start: challenge.startsOn, end: challenge.endsOn ?? today, key: "" };
}

/** The progress value for a challenge over a window, across participating kids. */
export async function challengeValue(
  db: Database,
  familyId: string,
  challenge: Challenge,
  kidIds: string[],
  window: ChallengeWindow,
  timezone: string,
  now: Date,
): Promise<number> {
  const { goalType } = challenge;
  const { start, end } = window;
  if (goalType === "points") {
    return earnedPoints(db, familyId, kidIds, timezone, start, end);
  }
  if (goalType === "chore_count") {
    return choreCount(db, familyId, kidIds, start, end);
  }
  // core_days: per-kid = the kid's complete days; family = days *everyone* did.
  const sets = await Promise.all(
    kidIds.map((id) =>
      coreCompleteDays(db, familyId, id, timezone, start, end, now),
    ),
  );
  if (sets.length === 0) return 0;
  if (challenge.scope === "kid") {
    return sets[0]?.size ?? 0;
  }
  // Family: intersection — days every participant completed their core chores.
  const [first, ...rest] = sets;
  let inter = first ?? new Set<string>();
  for (const s of rest) inter = new Set([...inter].filter((d) => s.has(d)));
  return inter.size;
}

export interface ChallengeProgress {
  challenge: Challenge;
  value: number;
  target: number;
  pct: number;
  complete: boolean;
  /** This kid has already been paid the bonus (kid views only). */
  awarded: boolean;
  /** Met, but the bonus is waiting on a parent to confirm. */
  pendingApproval: boolean;
}

function pct(value: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((value / target) * 100)));
}

/** Active challenges a kid takes part in, with their (or the family's) progress. */
export async function listKidChallenges(
  db: Database,
  familyId: string,
  kidId: string,
  timezone: string,
  now: Date = new Date(),
): Promise<ChallengeProgress[]> {
  const today = localDate(timezone, now);
  const all = await db
    .select()
    .from(challenges)
    .where(
      and(eq(challenges.familyId, familyId), eq(challenges.isActive, true)),
    )
    .orderBy(challenges.endsOn);

  const awardedRows = await db
    .select({
      challengeId: challengeAwards.challengeId,
      periodKey: challengeAwards.periodKey,
      status: challengeAwards.status,
    })
    .from(challengeAwards)
    .where(eq(challengeAwards.personId, kidId));
  const paid = new Set(
    awardedRows
      .filter((r) => r.status === "paid")
      .map((r) => `${r.challengeId}:${r.periodKey}`),
  );
  const pending = new Set(
    awardedRows
      .filter((r) => r.status === "pending")
      .map((r) => `${r.challengeId}:${r.periodKey}`),
  );

  const out: ChallengeProgress[] = [];
  for (const c of all) {
    const window = currentWindow(c, today);
    if (!window) continue;
    const parts = await participantKidIds(db, familyId, c.id);
    if (!parts.includes(kidId)) continue;
    const kids = c.scope === "family" ? parts : [kidId];
    const value = await challengeValue(
      db,
      familyId,
      c,
      kids,
      window,
      timezone,
      now,
    );
    out.push({
      challenge: c,
      value,
      target: c.goalTarget,
      pct: pct(value, c.goalTarget),
      complete: value >= c.goalTarget,
      awarded: paid.has(`${c.id}:${window.key}`),
      pendingApproval: pending.has(`${c.id}:${window.key}`),
    });
  }
  return out;
}

/* ------------------------------------------------------------- auto-award */

/**
 * Record a kid completing a challenge once per period (idempotent). Auto-award
 * challenges pay the bonus immediately ("paid"); otherwise it's held "pending" a
 * parent's confirmation. Returns true if newly recorded.
 */
async function awardBonus(
  db: Database,
  familyId: string,
  challenge: Challenge,
  kidId: string,
  periodKey: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const claimed = await tx
      .insert(challengeAwards)
      .values({
        challengeId: challenge.id,
        personId: kidId,
        periodKey,
        status: challenge.autoAward ? "paid" : "pending",
      })
      .onConflictDoNothing()
      .returning({ id: challengeAwards.id });
    if (claimed.length === 0) return false; // already recorded

    if (challenge.autoAward) {
      await tx.insert(ledger).values({
        familyId,
        personId: kidId,
        amount: challenge.bonusPoints,
        type: "bonus",
        reason: `Challenge: ${challenge.title}`,
        createdBy: challenge.createdBy ?? null,
      });
    }
    return true;
  });
}

export interface ChallengeWin {
  challengeId: string;
  title: string;
  personId: string;
  bonusPoints: number;
}

/**
 * Re-check a kid's active challenges after they earn points / log a chore and
 * pay out any newly-completed bonus. Family challenges pay every participant.
 * Idempotent — safe to call from multiple earning paths.
 */
export async function evaluateChallenges(
  db: Database,
  familyId: string,
  personId: string,
  timezone: string,
  now: Date = new Date(),
): Promise<ChallengeWin[]> {
  const today = localDate(timezone, now);
  const active = await db
    .select()
    .from(challenges)
    .where(
      and(eq(challenges.familyId, familyId), eq(challenges.isActive, true)),
    );

  const wins: ChallengeWin[] = [];
  for (const c of active) {
    const window = currentWindow(c, today);
    if (!window) continue;
    const parts = await participantKidIds(db, familyId, c.id);
    if (!parts.includes(personId)) continue;

    if (c.scope === "kid") {
      const value = await challengeValue(db, familyId, c, [personId], window, timezone, now); // prettier-ignore
      if (value < c.goalTarget) continue;
      if (await awardBonus(db, familyId, c, personId, window.key)) {
        wins.push({
          challengeId: c.id,
          title: c.title,
          personId,
          bonusPoints: c.bonusPoints,
        });
      }
    } else {
      const value = await challengeValue(db, familyId, c, parts, window, timezone, now); // prettier-ignore
      if (value < c.goalTarget) continue;
      for (const kid of parts) {
        if (await awardBonus(db, familyId, c, kid, window.key)) {
          wins.push({
            challengeId: c.id,
            title: c.title,
            personId: kid,
            bonusPoints: c.bonusPoints,
          });
        }
      }
    }
  }
  return wins;
}

/* ------------------------------------------------------ parent approval */

export interface ChallengeApproval {
  awardId: string;
  challengeTitle: string;
  bonusPoints: number;
  kidName: string;
  avatar: string;
  color: string;
}

/** Completed challenges (on parent-confirm challenges) awaiting a decision. */
export async function listChallengeApprovals(
  db: Database,
  familyId: string,
): Promise<ChallengeApproval[]> {
  return db
    .select({
      awardId: challengeAwards.id,
      challengeTitle: challenges.title,
      bonusPoints: challenges.bonusPoints,
      kidName: people.name,
      avatar: people.avatar,
      color: people.color,
    })
    .from(challengeAwards)
    .innerJoin(challenges, eq(challenges.id, challengeAwards.challengeId))
    .innerJoin(people, eq(people.id, challengeAwards.personId))
    .where(
      and(
        eq(challenges.familyId, familyId),
        eq(challengeAwards.status, "pending"),
      ),
    )
    .orderBy(challengeAwards.awardedAt);
}

/** Approve (pay the held bonus) or deny a pending challenge completion. */
export async function decideChallengeAward(
  db: Database,
  familyId: string,
  awardId: string,
  decision: "approved" | "denied",
  decidedBy: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        personId: challengeAwards.personId,
        bonusPoints: challenges.bonusPoints,
        title: challenges.title,
      })
      .from(challengeAwards)
      .innerJoin(challenges, eq(challenges.id, challengeAwards.challengeId))
      .where(
        and(
          eq(challengeAwards.id, awardId),
          eq(challenges.familyId, familyId),
          eq(challengeAwards.status, "pending"),
        ),
      )
      .limit(1);
    if (!row) return;

    if (decision === "approved") {
      await tx
        .update(challengeAwards)
        .set({ status: "paid" })
        .where(eq(challengeAwards.id, awardId));
      await tx.insert(ledger).values({
        familyId,
        personId: row.personId,
        amount: row.bonusPoints,
        type: "bonus",
        reason: `Challenge: ${row.title}`,
        createdBy: decidedBy,
      });
    } else {
      await tx
        .update(challengeAwards)
        .set({ status: "denied" })
        .where(eq(challengeAwards.id, awardId));
    }
  });
}
