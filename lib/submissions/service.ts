import { and, eq, gte, inArray, sql, desc } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { chores, choreSubmissions, ledger, people } from "@/lib/db/schema";
import { localDate, weekStart } from "@/lib/timezone";
import type { LimitPeriod } from "@/lib/catalog/limit";

export class LimitReachedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LimitReachedError";
  }
}

export class InvalidSubmissionError extends Error {
  constructor(message = "That chore isn't available.") {
    super(message);
    this.name = "InvalidSubmissionError";
  }
}

/** Pending + approved both hold a slot toward a chore's limit. */
const ACTIVE = ["pending", "approved"] as const;

/** A kid's pending+approved claims for a chore within its limit window. */
async function usedInWindow(
  db: Database,
  familyId: string,
  personId: string,
  choreId: string,
  period: LimitPeriod,
  today: string,
): Promise<number> {
  const conds = [
    eq(choreSubmissions.familyId, familyId),
    eq(choreSubmissions.personId, personId),
    eq(choreSubmissions.choreId, choreId),
    inArray(choreSubmissions.status, ACTIVE),
  ];
  if (period === "day") {
    conds.push(eq(choreSubmissions.localDate, today));
  } else if (period === "week") {
    conds.push(gte(choreSubmissions.localDate, weekStart(today)));
  }
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(choreSubmissions)
    .where(and(...conds));
  return row?.n ?? 0;
}

export interface SubmittableChore {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  points: number;
  limitPeriod: LimitPeriod;
  limitCount: number;
  /** Remaining claims in the current window, or null when unlimited. */
  remaining: number | null;
  canSubmit: boolean;
  reason: string | null;
}

/** Active chores a kid can log, with per-chore availability for today/this week. */
export async function listSubmittableChores(
  db: Database,
  familyId: string,
  personId: string,
  timezone: string,
  now: Date = new Date(),
): Promise<SubmittableChore[]> {
  const today = localDate(timezone, now);
  const active = await db
    .select()
    .from(chores)
    .where(and(eq(chores.familyId, familyId), eq(chores.isActive, true)))
    .orderBy(chores.sortOrder, chores.createdAt);

  const out: SubmittableChore[] = [];
  for (const c of active) {
    if (c.limitPeriod === "none") {
      out.push({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        description: c.description,
        points: c.points,
        limitPeriod: "none",
        limitCount: c.limitCount,
        remaining: null,
        canSubmit: true,
        reason: null,
      });
      continue;
    }
    const used = await usedInWindow(
      db,
      familyId,
      personId,
      c.id,
      c.limitPeriod,
      today,
    );
    const remaining = Math.max(0, c.limitCount - used);
    const unit = c.limitPeriod === "day" ? "today" : "this week";
    out.push({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      description: c.description,
      points: c.points,
      limitPeriod: c.limitPeriod,
      limitCount: c.limitCount,
      remaining,
      canSubmit: remaining > 0,
      reason: remaining > 0 ? null : `Done ${unit}`,
    });
  }
  return out;
}

/** Kid logs a completed chore (pending). Enforces the per-chore limit. */
export async function submitChore(
  db: Database,
  familyId: string,
  personId: string,
  choreId: string,
  timezone: string,
  now: Date = new Date(),
): Promise<void> {
  const today = localDate(timezone, now);
  await db.transaction(async (tx) => {
    const [chore] = await tx
      .select()
      .from(chores)
      .where(
        and(
          eq(chores.familyId, familyId),
          eq(chores.id, choreId),
          eq(chores.isActive, true),
        ),
      )
      .limit(1);
    if (!chore) throw new InvalidSubmissionError();

    if (chore.limitPeriod !== "none") {
      const used = await usedInWindow(
        tx,
        familyId,
        personId,
        choreId,
        chore.limitPeriod,
        today,
      );
      if (used >= chore.limitCount) {
        throw new LimitReachedError(
          chore.limitPeriod === "day"
            ? "You've already logged this today."
            : "You've already logged this this week.",
        );
      }
    }

    await tx.insert(choreSubmissions).values({
      familyId,
      personId,
      choreId,
      choreName: chore.name,
      points: chore.points,
      status: "pending",
      localDate: today,
    });
  });
}

/** Kid withdraws their own still-pending submission. */
export async function cancelSubmission(
  db: Database,
  familyId: string,
  personId: string,
  id: string,
): Promise<void> {
  await db
    .update(choreSubmissions)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(choreSubmissions.id, id),
        eq(choreSubmissions.familyId, familyId),
        eq(choreSubmissions.personId, personId),
        eq(choreSubmissions.status, "pending"),
      ),
    );
}

export interface DecidedSubmission {
  personId: string;
  choreName: string;
  points: number;
}

/** Parent approves (→ ledger earn row) or rejects a pending submission. */
export async function decideSubmission(
  db: Database,
  familyId: string,
  id: string,
  decision: "approved" | "rejected",
  decidedBy: string,
  now: Date = new Date(),
): Promise<DecidedSubmission> {
  return db.transaction(async (tx) => {
    const [s] = await tx
      .select()
      .from(choreSubmissions)
      .where(
        and(
          eq(choreSubmissions.id, id),
          eq(choreSubmissions.familyId, familyId),
          eq(choreSubmissions.status, "pending"),
        ),
      )
      .limit(1);
    if (!s)
      throw new InvalidSubmissionError("That submission is no longer pending.");

    if (decision === "approved") {
      await tx.insert(ledger).values({
        familyId,
        personId: s.personId,
        amount: s.points,
        type: "earn",
        reason: s.choreName,
        choreId: s.choreId,
        createdBy: decidedBy,
      });
    }
    await tx
      .update(choreSubmissions)
      .set({ status: decision, decidedBy, decidedAt: now })
      .where(eq(choreSubmissions.id, s.id));

    return { personId: s.personId, choreName: s.choreName, points: s.points };
  });
}

export interface PendingSubmission {
  id: string;
  kidName: string;
  avatar: string;
  color: string;
  choreName: string;
  points: number;
  createdAt: Date;
}

/** Pending submissions across the family (the parent approval queue). */
export async function listPendingSubmissions(
  db: Database,
  familyId: string,
): Promise<PendingSubmission[]> {
  return db
    .select({
      id: choreSubmissions.id,
      kidName: people.name,
      avatar: people.avatar,
      color: people.color,
      choreName: choreSubmissions.choreName,
      points: choreSubmissions.points,
      createdAt: choreSubmissions.createdAt,
    })
    .from(choreSubmissions)
    .innerJoin(people, eq(people.id, choreSubmissions.personId))
    .where(
      and(
        eq(choreSubmissions.familyId, familyId),
        eq(choreSubmissions.status, "pending"),
      ),
    )
    .orderBy(choreSubmissions.createdAt);
}

export interface KidSubmission {
  id: string;
  choreName: string;
  points: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: Date;
}

/** A kid's own recent submissions (newest first). */
export async function listKidSubmissions(
  db: Database,
  familyId: string,
  personId: string,
  limit = 20,
): Promise<KidSubmission[]> {
  return db
    .select({
      id: choreSubmissions.id,
      choreName: choreSubmissions.choreName,
      points: choreSubmissions.points,
      status: choreSubmissions.status,
      createdAt: choreSubmissions.createdAt,
    })
    .from(choreSubmissions)
    .where(
      and(
        eq(choreSubmissions.familyId, familyId),
        eq(choreSubmissions.personId, personId),
      ),
    )
    .orderBy(desc(choreSubmissions.createdAt))
    .limit(limit);
}

/** Sum of a kid's pending (awaiting-approval) points. */
export async function getPendingPoints(
  db: Database,
  familyId: string,
  personId: string,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${choreSubmissions.points}), 0)::int`,
    })
    .from(choreSubmissions)
    .where(
      and(
        eq(choreSubmissions.familyId, familyId),
        eq(choreSubmissions.personId, personId),
        eq(choreSubmissions.status, "pending"),
      ),
    );
  return row?.total ?? 0;
}
