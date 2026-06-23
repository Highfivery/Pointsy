import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { ledger, chores, people, type LedgerEntry } from "@/lib/db/schema";
import { getPersonById } from "@/lib/db/queries";

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
