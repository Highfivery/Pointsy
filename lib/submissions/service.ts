import { and, eq, gte, inArray, sql, desc } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { chores, choreSubmissions, ledger, people } from "@/lib/db/schema";
import {
  localDate,
  localParts,
  weekStart,
  weekdayOf,
  zonedWallTimeToInstant,
} from "@/lib/timezone";
import type { LimitPeriod } from "@/lib/catalog/limit";
import {
  advanceRotationIfDone,
  getAssigneeIds,
  getAssigneesByChore,
} from "@/lib/chores/assignment";
import { getSubtasksByChore } from "@/lib/chores/subtasks";
import { eligibleFor } from "@/lib/chores/eligibility";
import { coreStreak } from "@/lib/chores/streak";
import {
  dayAllowed,
  hasLogWindow,
  hhmmToMinutes,
  nextOpenInstant,
  withinLogWindow,
  type LogWindow,
} from "@/lib/chores/window";

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
  categoryId: string;
  points: number;
  limitPeriod: LimitPeriod;
  limitCount: number;
  /** A daily "must-do" that counts toward the kid's core progress + streak. */
  isCore: boolean;
  /** This chore is the kid's to do (assignment/rotation allows it). */
  eligible: boolean;
  /** The kid already logged this at least once today (pending or approved). */
  loggedToday: boolean;
  /** Checklist the kid must complete before logging it. */
  subtasks: string[];
  /** Remaining claims in the current window, or null when unlimited. */
  remaining: number | null;
  canSubmit: boolean;
  reason: string | null;
  /** Time-of-day/day-of-week gate: "open" now, or "locked" until `opensAt`. */
  windowState: "open" | "locked";
  /** When a locked chore next opens (ISO instant), else null. */
  opensAt: string | null;
  /** When an open, time-bounded chore closes today (ISO instant), else null. */
  closesAt: string | null;
  /** This chore's logging-window weekday mask (Mon=0…Sun=6), for streak math. */
  logWindowDays: number | null;
}

/**
 * Stable comparator that sinks time-locked chores (the ones showing an "Unlocks
 * in" countdown) below the ones a kid can act on now, so the available chores
 * group at the top of a list (#123).
 */
export function lockedLast<T extends { windowState: "open" | "locked" }>(
  a: T,
  b: T,
): number {
  return (
    (a.windowState === "locked" ? 1 : 0) - (b.windowState === "locked" ? 1 : 0)
  );
}

/** Chores the kid has an active (pending/approved) submission for today. */
async function loggedTodaySet(
  db: Database,
  familyId: string,
  personId: string,
  today: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ choreId: choreSubmissions.choreId })
    .from(choreSubmissions)
    .where(
      and(
        eq(choreSubmissions.familyId, familyId),
        eq(choreSubmissions.personId, personId),
        inArray(choreSubmissions.status, ACTIVE),
        eq(choreSubmissions.localDate, today),
      ),
    );
  return new Set(rows.map((r) => r.choreId).filter((id): id is string => !!id));
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
  const { weekday, minutes } = localParts(timezone, now);
  const active = await db
    .select()
    .from(chores)
    .where(and(eq(chores.familyId, familyId), eq(chores.isActive, true)))
    .orderBy(chores.sortOrder, chores.createdAt);

  const assignees = await getAssigneesByChore(
    db,
    active.map((c) => c.id),
  );
  const subtasks = await getSubtasksByChore(
    db,
    active.map((c) => c.id),
  );
  const kids = await db
    .select({ id: people.id, name: people.name })
    .from(people)
    .where(and(eq(people.familyId, familyId), eq(people.role, "kid")));
  const nameById = new Map(kids.map((k) => [k.id, k.name]));
  const nameOf = (pid: string) => nameById.get(pid) ?? "Someone";
  const loggedToday = await loggedTodaySet(db, familyId, personId, today);

  const base = (c: (typeof active)[number]) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    description: c.description,
    categoryId: c.categoryId,
    points: c.points,
    limitPeriod: c.limitPeriod,
    limitCount: c.limitCount,
    isCore: c.isCore,
    loggedToday: loggedToday.has(c.id),
    subtasks: subtasks.get(c.id) ?? [],
    windowState: "open" as const,
    opensAt: null,
    closesAt: null,
    logWindowDays: c.logWindowDays,
  });

  const out: SubmittableChore[] = [];
  for (const c of active) {
    // Assignment first: a chore that isn't this kid's (or not their turn) is
    // shown locked with a reason, regardless of any per-chore limit.
    const elig = eligibleFor(
      {
        assignment: c.assignment,
        assigneeIds: assignees.get(c.id) ?? [],
        currentTurnPersonId: c.currentTurnPersonId,
      },
      personId,
      nameOf,
    );
    if (!elig.allowed) {
      out.push({
        ...base(c),
        eligible: false,
        remaining: null,
        canSubmit: false,
        reason: elig.reason,
      });
      continue;
    }

    // Logging window next: it's theirs, but the time-of-day/day-of-week gate may
    // hold it shut. Locked beats any limit state — show the countdown instead.
    const win: LogWindow = {
      days: c.logWindowDays,
      start: c.logWindowStart,
      end: c.logWindowEnd,
    };
    if (hasLogWindow(win) && !withinLogWindow(win, weekday, minutes)) {
      const next = nextOpenInstant(win, timezone, today, now);
      out.push({
        ...base(c),
        eligible: true,
        remaining: null,
        canSubmit: false,
        reason: null,
        windowState: "locked",
        opensAt: next?.toISOString() ?? null,
      });
      continue;
    }
    // Open and time-bounded → expose when it closes today (for a subtle hint).
    const endMin = hhmmToMinutes(win.end);
    const closesAt =
      endMin !== null
        ? zonedWallTimeToInstant(timezone, today, endMin).toISOString()
        : null;

    if (c.limitPeriod === "none") {
      out.push({
        ...base(c),
        eligible: true,
        remaining: null,
        canSubmit: true,
        reason: null,
        closesAt,
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
      ...base(c),
      eligible: true,
      remaining,
      canSubmit: remaining > 0,
      reason: remaining > 0 ? null : `Done ${unit}`,
      closesAt,
    });
  }
  return out;
}

/**
 * The kid's "all core chores done" streak — consecutive days every core chore
 * they're responsible for was logged. `coreChores` are the core chores currently
 * eligible to this kid (derive from `listSubmittableChores`); each carries its
 * logging-window day mask so a weekday-only chore is only expected on the days
 * it's actually loggable.
 */
export async function getCoreStreak(
  db: Database,
  familyId: string,
  personId: string,
  timezone: string,
  coreChores: { id: string; days: number | null }[],
  now: Date = new Date(),
): Promise<number> {
  if (coreChores.length === 0) return 0;
  const rows = await db
    .selectDistinct({
      localDate: choreSubmissions.localDate,
      choreId: choreSubmissions.choreId,
    })
    .from(choreSubmissions)
    .where(
      and(
        eq(choreSubmissions.familyId, familyId),
        eq(choreSubmissions.personId, personId),
        inArray(choreSubmissions.status, ACTIVE),
        inArray(
          choreSubmissions.choreId,
          coreChores.map((c) => c.id),
        ),
      ),
    );
  const doneByDay = new Map<string, number>();
  for (const r of rows) {
    doneByDay.set(r.localDate, (doneByDay.get(r.localDate) ?? 0) + 1);
  }
  // How many core chores are actually loggable on a given local date.
  const expectedOn = (date: string) => {
    const wd = weekdayOf(date);
    return coreChores.filter((c) => dayAllowed(c.days, wd)).length;
  };
  return coreStreak(doneByDay, expectedOn, localDate(timezone, now));
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

    // Assignment guard — a kid can't log a chore that isn't theirs / their turn.
    const elig = eligibleFor(
      {
        assignment: chore.assignment,
        assigneeIds: await getAssigneeIds(tx, choreId),
        currentTurnPersonId: chore.currentTurnPersonId,
      },
      personId,
      () => "",
    );
    if (!elig.allowed) {
      throw new InvalidSubmissionError(
        "This chore isn't yours to log right now.",
      );
    }

    // Logging-window guard — server-authoritative, so a fast/skewed client clock
    // can't log a chore before it opens.
    const win: LogWindow = {
      days: chore.logWindowDays,
      start: chore.logWindowStart,
      end: chore.logWindowEnd,
    };
    if (hasLogWindow(win)) {
      const { weekday, minutes } = localParts(timezone, now);
      if (!withinLogWindow(win, weekday, minutes)) {
        throw new InvalidSubmissionError(
          "That chore can't be logged right now.",
        );
      }
    }

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
      if (s.choreId) {
        await advanceRotationIfDone(tx, familyId, s.choreId, s.personId);
      }
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
