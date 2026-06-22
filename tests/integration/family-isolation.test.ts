import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { families, people, ledger } from "@/lib/db/schema";
import { createTestDb, type TestDb } from "../helpers/test-db";

/**
 * Tenant isolation is a first-class invariant (SPEC §9.2): a query scoped to
 * one family must never see another family's rows.
 */
describe("multi-tenant isolation", () => {
  let ctx: TestDb;

  beforeAll(async () => {
    ctx = await createTestDb();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it("scopes ledger reads and balance to a single family", async () => {
    const { db } = ctx;

    const [famA] = await db
      .insert(families)
      .values({ name: "Family A", code: "FAMA-1" })
      .returning();
    const [famB] = await db
      .insert(families)
      .values({ name: "Family B", code: "FAMB-1" })
      .returning();

    const [kidA] = await db
      .insert(people)
      .values({ familyId: famA.id, role: "kid", name: "Ann" })
      .returning();
    const [kidB] = await db
      .insert(people)
      .values({ familyId: famB.id, role: "kid", name: "Bo" })
      .returning();

    await db.insert(ledger).values([
      {
        familyId: famA.id,
        personId: kidA.id,
        amount: 10,
        type: "earn",
        reason: "Homework",
      },
      {
        familyId: famA.id,
        personId: kidA.id,
        amount: 5,
        type: "earn",
        reason: "Dishes",
      },
      {
        familyId: famB.id,
        personId: kidB.id,
        amount: 999,
        type: "earn",
        reason: "Other family",
      },
    ]);

    const aRows = await db
      .select()
      .from(ledger)
      .where(eq(ledger.familyId, famA.id));
    expect(aRows).toHaveLength(2);
    expect(aRows.every((r) => r.familyId === famA.id)).toBe(true);

    const [{ total }] = await db
      .select({
        total: sql<number>`coalesce(sum(${ledger.amount}), 0)::int`,
      })
      .from(ledger)
      .where(eq(ledger.familyId, famA.id));
    expect(total).toBe(15);
  });

  it("cascades deletes within a family only", async () => {
    const { db } = ctx;

    const [fam] = await db
      .insert(families)
      .values({ name: "Doomed", code: "DOOM-1" })
      .returning();
    const [kid] = await db
      .insert(people)
      .values({ familyId: fam.id, role: "kid", name: "Cy" })
      .returning();
    await db.insert(ledger).values({
      familyId: fam.id,
      personId: kid.id,
      amount: 7,
      type: "earn",
      reason: "x",
    });

    await db.delete(families).where(eq(families.id, fam.id));

    const orphans = await db
      .select()
      .from(ledger)
      .where(eq(ledger.familyId, fam.id));
    expect(orphans).toHaveLength(0);
  });
});
