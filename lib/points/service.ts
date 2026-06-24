import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { ledger, chores, people, type LedgerEntry } from "@/lib/db/schema";
import { getPersonById } from "@/lib/db/queries";
import { addDays, localDate } from "@/lib/timezone";
import { advanceRotationIfDone } from "@/lib/chores/assignment";

/**
 * The points engine. The `ledger` is append-only and the single source of
 * truth: a kid's balance is SUM(amount). Corrections are new `adjust` rows —
 * rows are never updated or deleted. All functions take an explicit `db` and
 * are scoped by `familyId`.
 */

class NotFoundError extends Error {}

async function assertKid(db: Database, familyId: string, kidId: string) {
  const kid = await getPersonById(db, familyId, kidId);
  if (!kid || kid.role !== "kid") throw new NotFoundError("Child not found");
  return kid;
}

/** Award the points for a catalog chore (one-tap). Snapshots the chore name. */
export async function awardChore(
  db: Database,
  familyId: string,
  kidId: string,
  choreId: string,
  awardedBy: string,
): Promise<LedgerEntry> {
  await assertKid(db, familyId, kidId);
  const [chore] = await db
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
  if (!chore) throw new NotFoundError("Chore not found");

  const [row] = await db
    .insert(ledger)
    .values({
      familyId,
      personId: kidId,
      amount: chore.points,
      type: "earn",
      reason: chore.name,
      choreId: chore.id,
      createdBy: awardedBy,
    })
    .returning();
  await advanceRotationIfDone(db, familyId, chore.id, kidId);
  return row;
}

/** Award a custom positive amount with a reason. */
export async function awardCustom(
  db: Database,
  familyId: string,
  kidId: string,
  amount: number,
  reason: string,
  awardedBy: string,
): Promise<LedgerEntry> {
  await assertKid(db, familyId, kidId);
  const [row] = await db
    .insert(ledger)
    .values({
      familyId,
      personId: kidId,
      amount,
      type: "earn",
      reason: reason.trim(),
      createdBy: awardedBy,
    })
    .returning();
  return row;
}

/** Manual correction (positive or negative). Recorded as an `adjust` row. */
export async function adjustPoints(
  db: Database,
  familyId: string,
  kidId: string,
  amount: number,
  reason: string,
  awardedBy: string,
): Promise<LedgerEntry> {
  await assertKid(db, familyId, kidId);
  const [row] = await db
    .insert(ledger)
    .values({
      familyId,
      personId: kidId,
      amount,
      type: "adjust",
      reason: reason.trim(),
      createdBy: awardedBy,
    })
    .returning();
  return row;
}

/** A single kid's balance = SUM(ledger.amount). May be negative. */
export async function getBalance(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${ledger.amount}), 0)::int`,
    })
    .from(ledger)
    .where(and(eq(ledger.familyId, familyId), eq(ledger.personId, kidId)));
  return row?.total ?? 0;
}

export interface KidBalance {
  id: string;
  name: string;
  avatar: string;
  color: string;
  balance: number;
}

/** Active kids with their balances, in display order. */
export async function getKidBalances(
  db: Database,
  familyId: string,
): Promise<KidBalance[]> {
  return db
    .select({
      id: people.id,
      name: people.name,
      avatar: people.avatar,
      color: people.color,
      balance: sql<number>`coalesce(sum(${ledger.amount}), 0)::int`,
    })
    .from(people)
    .leftJoin(ledger, eq(ledger.personId, people.id))
    .where(
      and(
        eq(people.familyId, familyId),
        eq(people.role, "kid"),
        eq(people.isActive, true),
      ),
    )
    .groupBy(people.id)
    .orderBy(people.sortOrder, people.createdAt);
}

export interface ActivityEntry {
  id: string;
  amount: number;
  type: "earn" | "redeem" | "adjust";
  reason: string;
  createdAt: Date;
  kidName: string;
}

/** Family-wide recent activity (most recent first). */
export async function listFamilyActivity(
  db: Database,
  familyId: string,
  limit = 30,
): Promise<ActivityEntry[]> {
  return db
    .select({
      id: ledger.id,
      amount: ledger.amount,
      type: ledger.type,
      reason: ledger.reason,
      createdAt: ledger.createdAt,
      kidName: people.name,
    })
    .from(ledger)
    .innerJoin(people, eq(people.id, ledger.personId))
    .where(eq(ledger.familyId, familyId))
    .orderBy(desc(ledger.createdAt))
    .limit(limit);
}

/**
 * Chore IDs this kid has been awarded most often (most → least), for the
 * "Most used" shortcut row on the award screen.
 */
export async function mostUsedChoreIds(
  db: Database,
  familyId: string,
  kidId: string,
  limit = 6,
): Promise<string[]> {
  const rows = await db
    .select({ choreId: ledger.choreId, n: sql<number>`count(*)::int` })
    .from(ledger)
    .where(
      and(
        eq(ledger.familyId, familyId),
        eq(ledger.personId, kidId),
        eq(ledger.type, "earn"),
        isNotNull(ledger.choreId),
      ),
    )
    .groupBy(ledger.choreId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  return rows.map((r) => r.choreId).filter((id): id is string => Boolean(id));
}

/**
 * Consecutive family-local days the kid has earned points, counting back from
 * today (or yesterday, so a streak isn't "lost" before the day is over). 0 if
 * no earning today or yesterday.
 */
export async function getStreak(
  db: Database,
  familyId: string,
  kidId: string,
  timezone: string,
): Promise<number> {
  const rows = await db
    .select({ createdAt: ledger.createdAt })
    .from(ledger)
    .where(
      and(
        eq(ledger.familyId, familyId),
        eq(ledger.personId, kidId),
        eq(ledger.type, "earn"),
      ),
    );
  if (rows.length === 0) return 0;

  const days = new Set(rows.map((r) => localDate(timezone, r.createdAt)));
  const today = localDate(timezone, new Date());
  let cursor = days.has(today) ? today : addDays(today, -1);
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** One kid's recent activity (most recent first). */
export async function listKidActivity(
  db: Database,
  familyId: string,
  kidId: string,
  limit = 30,
): Promise<LedgerEntry[]> {
  return db
    .select()
    .from(ledger)
    .where(and(eq(ledger.familyId, familyId), eq(ledger.personId, kidId)))
    .orderBy(desc(ledger.createdAt))
    .limit(limit);
}
