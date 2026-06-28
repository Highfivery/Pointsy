import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createChore } from "@/lib/catalog/service";
import {
  awardChore,
  awardCustom,
  adjustPoints,
  changePoints,
  getBalance,
  getKidBalances,
  listFamilyActivity,
  listKidActivity,
} from "@/lib/points/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"], familyName = "Fam") {
  const fam = await registerFamily(db, {
    familyName,
    parentName: "Parent",
    email: `p.${familyName}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
  const kid = await addKid(db, fam.familyId, {
    name: "Ava",
    avatar: "cat",
    color: "#4338ca",
    pin: "1234",
  });
  return { fam, kid };
}

describe("points engine", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("awards chore points and reflects them in the balance", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Made bed",
      emoji: "bed",
      points: 5,
    });

    const entry = await awardChore(
      db,
      fam.familyId,
      kid.id,
      chore.id,
      fam.personId,
    );
    expect(entry.amount).toBe(5);
    expect(entry.type).toBe("earn");
    expect(entry.reason).toBe("Made bed"); // snapshot
    expect(entry.createdBy).toBe(fam.personId);

    await awardChore(db, fam.familyId, kid.id, chore.id, fam.personId);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(10);
  });

  it("awards custom points and adjusts (including below zero)", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);

    await awardCustom(
      db,
      fam.familyId,
      kid.id,
      20,
      "Helped a neighbour",
      fam.personId,
    );
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(20);

    await adjustPoints(
      db,
      fam.familyId,
      kid.id,
      -25,
      "Broke a rule",
      fam.personId,
    );
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(-5); // not floored
  });

  it("changePoints routes by direction: award is +earn, deduct is -adjust", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);

    const earn = await changePoints(
      db,
      fam.familyId,
      kid.id,
      "award",
      8,
      "Tidied room",
      fam.personId,
    );
    expect(earn.amount).toBe(8);
    expect(earn.type).toBe("earn");

    // Deduct takes a positive amount and stores it negative as an adjustment.
    const deduct = await changePoints(
      db,
      fam.familyId,
      kid.id,
      "deduct",
      5,
      "Late home",
      fam.personId,
    );
    expect(deduct.amount).toBe(-5);
    expect(deduct.type).toBe("adjust");

    expect(await getBalance(db, fam.familyId, kid.id)).toBe(3);
  });

  it("reports per-kid balances (zero for kids with no ledger)", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const kid2 = await addKid(db, fam.familyId, {
      name: "Bo",
      avatar: "dog",
      color: "#15803d",
      pin: "5678",
    });
    await awardCustom(db, fam.familyId, kid.id, 12, "x", fam.personId);

    const balances = await getKidBalances(db, fam.familyId);
    const byName = Object.fromEntries(balances.map((b) => [b.name, b.balance]));
    expect(byName).toEqual({ Ava: 12, Bo: 0 });
    expect(balances.find((b) => b.id === kid2.id)?.balance).toBe(0);
  });

  it("lists family and kid activity, most recent first", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    await awardCustom(db, fam.familyId, kid.id, 5, "First", fam.personId);
    await awardCustom(db, fam.familyId, kid.id, 7, "Second", fam.personId);

    const family = await listFamilyActivity(db, fam.familyId);
    expect(family[0].reason).toBe("Second");
    expect(family[0].kidName).toBe("Ava");
    expect(family).toHaveLength(2);

    const kidFeed = await listKidActivity(db, fam.familyId, kid.id);
    expect(kidFeed.map((e) => e.reason)).toEqual(["Second", "First"]);
  });

  it("keeps ledgers isolated per family", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");
    await awardCustom(db, a.fam.familyId, a.kid.id, 100, "x", a.fam.personId);

    expect(await getBalance(db, b.fam.familyId, b.kid.id)).toBe(0);
    expect(await listFamilyActivity(db, b.fam.familyId)).toHaveLength(0);
  });
});
