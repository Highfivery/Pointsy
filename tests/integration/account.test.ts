import { describe, it, expect, beforeEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { deleteKid } from "@/lib/people/service";
import { createChore } from "@/lib/catalog/service";
import {
  submitChore,
  listPendingSubmissions,
  decideSubmission,
} from "@/lib/submissions/service";
import { exportFamilyData, deleteFamily } from "@/lib/family/account";
import { getPersonById } from "@/lib/db/queries";
import { getBalance } from "@/lib/points/service";
import { ledger, choreSubmissions, people, families } from "@/lib/db/schema";
import { createTestDb, type TestDb } from "../helpers/test-db";

const tz = "UTC";

async function setup(db: TestDb["db"], seed: number | string = Math.random()) {
  const fam = await registerFamily(db, {
    familyName: "Marsh",
    parentName: "Pat",
    email: `p.${seed}@example.com`,
    password: "supersecret1",
  });
  const kid = await addKid(db, fam.familyId, {
    name: "Ava",
    avatar: "cat",
    color: "#111111",
    pin: "1234",
  });
  return { fam, kid };
}

/** Give a kid an approved submission (→ a ledger row) so we can prove cascade. */
async function giveKidActivity(
  db: TestDb["db"],
  familyId: string,
  personId: string,
) {
  const chore = await createChore(db, familyId, {
    name: "Make bed",
    emoji: "bed",
    points: 5,
  });
  await submitChore(db, familyId, personId, chore.id, tz);
  const [pending] = await listPendingSubmissions(db, familyId);
  await decideSubmission(db, familyId, pending.id, "approved", personId);
}

describe("data export", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("includes the family's data but never secrets", async () => {
    const { db } = ctx;
    const { fam } = await setup(db);
    const data = await exportFamilyData(db, fam.familyId);

    expect(data.family?.id).toBe(fam.familyId);
    expect(data.people).toHaveLength(2); // parent + kid
    for (const p of data.people) {
      expect("passwordHash" in p).toBe(false);
      expect("pinHash" in p).toBe(false);
      expect("pinFailedAttempts" in p).toBe(false);
    }
    const raw = JSON.stringify(data);
    expect(raw).not.toMatch(/passwordHash|pinHash|password_hash|pin_hash/);
  });

  it("is scoped to the requesting family (tenant isolation)", async () => {
    const { db } = ctx;
    const a = await setup(db, `a.${Math.random()}`);
    await setup(db, `b.${Math.random()}`);
    const data = await exportFamilyData(db, a.fam.familyId);
    expect(data.people.every((p) => p.name === "Pat" || p.name === "Ava")).toBe(
      true,
    );
    expect(data.family?.id).toBe(a.fam.familyId);
  });
});

describe("delete a kid", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("removes the kid and cascades their data", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    await giveKidActivity(db, fam.familyId, kid.id);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(5);

    const ok = await deleteKid(db, fam.familyId, kid.id);
    expect(ok).toBe(true);

    expect(await getPersonById(db, fam.familyId, kid.id)).toBeUndefined();
    const ledgerRows = await db
      .select()
      .from(ledger)
      .where(eq(ledger.personId, kid.id));
    expect(ledgerRows).toHaveLength(0);
    const subs = await db
      .select()
      .from(choreSubmissions)
      .where(eq(choreSubmissions.personId, kid.id));
    expect(subs).toHaveLength(0);
  });

  it("won't delete a kid from another family, or a parent", async () => {
    const { db } = ctx;
    const a = await setup(db, `a.${Math.random()}`);
    const b = await setup(db, `b.${Math.random()}`);

    // Wrong family can't delete A's kid.
    expect(await deleteKid(db, b.fam.familyId, a.kid.id)).toBe(false);
    expect(await getPersonById(db, a.fam.familyId, a.kid.id)).toBeDefined();

    // A parent isn't a kid — the role guard blocks it.
    expect(await deleteKid(db, a.fam.familyId, a.fam.personId)).toBe(false);
    expect(
      await getPersonById(db, a.fam.familyId, a.fam.personId),
    ).toBeDefined();
  });
});

describe("delete a family", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("removes the whole family and leaves others intact", async () => {
    const { db } = ctx;
    const a = await setup(db, `a.${Math.random()}`);
    const b = await setup(db, `b.${Math.random()}`);
    await giveKidActivity(db, a.fam.familyId, a.kid.id);

    await deleteFamily(db, a.fam.familyId);

    // Family A is gone, including its people and ledger.
    expect(
      await db.select().from(families).where(eq(families.id, a.fam.familyId)),
    ).toHaveLength(0);
    expect(
      await db.select().from(people).where(eq(people.familyId, a.fam.familyId)),
    ).toHaveLength(0);
    expect(
      await db.select().from(ledger).where(eq(ledger.familyId, a.fam.familyId)),
    ).toHaveLength(0);

    // Family B is untouched.
    expect(
      await db
        .select()
        .from(people)
        .where(
          and(eq(people.familyId, b.fam.familyId), eq(people.id, b.kid.id)),
        ),
    ).toHaveLength(1);
  });
});
