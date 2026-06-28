import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createReward } from "@/lib/catalog/service";
import {
  listKidAssignedRewards,
  listRedeemableRewards,
} from "@/lib/redemptions/service";
import { ledger } from "@/lib/db/schema";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"], familyName = "Fam") {
  const fam = await registerFamily(db, {
    familyName,
    parentName: "Parent",
    email: `p.${familyName}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
  const robin = await addKid(db, fam.familyId, {
    name: "Robin",
    avatar: "cat",
    color: "#4338ca",
    pin: "1234",
  });
  const sam = await addKid(db, fam.familyId, {
    name: "Sam",
    avatar: "dog",
    color: "#15803d",
    pin: "5678",
  });
  return { fam, robin, sam };
}

const give = (db: TestDb["db"], famId: string, kidId: string, n: number) =>
  db.insert(ledger).values({
    familyId: famId,
    personId: kidId,
    amount: n,
    type: "earn",
    reason: "x",
  });

describe("kid-specific rewards", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("shows an assigned reward only to that kid, with progress", async () => {
    const { db } = ctx;
    const { fam, robin, sam } = await setup(db);
    await give(db, fam.familyId, robin.id, 12);

    const reward = await createReward(db, fam.familyId, {
      name: "Bike ride",
      emoji: "bike",
      cost: 20,
      assignedToKidId: robin.id,
    });
    expect(reward.assignedToKidId).toBe(robin.id);

    // Robin sees it as a personal goal with progress.
    const robinGoals = await listKidAssignedRewards(db, fam.familyId, robin.id);
    expect(robinGoals).toHaveLength(1);
    expect(robinGoals[0].reward.name).toBe("Bike ride");
    expect(robinGoals[0].available).toBe(12);
    expect(robinGoals[0].moreNeeded).toBe(8);
    expect(robinGoals[0].pct).toBe(60); // 12/20

    // Sam has none.
    expect(await listKidAssignedRewards(db, fam.familyId, sam.id)).toHaveLength(
      0,
    );
  });

  it("hides another kid's assigned reward from the redeemable list", async () => {
    const { db } = ctx;
    const { fam, robin, sam } = await setup(db);
    await createReward(db, fam.familyId, {
      name: "Family movie",
      emoji: "movie",
      cost: 30,
    });
    await createReward(db, fam.familyId, {
      name: "Robin's skates",
      emoji: "footprints",
      cost: 50,
      assignedToKidId: robin.id,
    });

    const robinNames = (
      await listRedeemableRewards(db, fam.familyId, robin.id)
    ).rewards.map((r) => r.name);
    const samNames = (
      await listRedeemableRewards(db, fam.familyId, sam.id)
    ).rewards.map((r) => r.name);

    expect(robinNames).toEqual(
      expect.arrayContaining(["Family movie", "Robin's skates"]),
    );
    expect(samNames).toContain("Family movie");
    expect(samNames).not.toContain("Robin's skates");
  });

  it("ignores an assigned kid from another family (tenant isolation)", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");

    const reward = await createReward(db, a.fam.familyId, {
      name: "Sneaky",
      emoji: "gift",
      cost: 10,
      assignedToKidId: b.robin.id, // a kid in family B
    });
    // The foreign kid id is dropped — it becomes a normal family-wide reward.
    expect(reward.assignedToKidId).toBeNull();
  });

  it("celebrates once the kid has saved enough (moreNeeded 0)", async () => {
    const { db } = ctx;
    const { fam, robin } = await setup(db);
    await give(db, fam.familyId, robin.id, 25);
    await createReward(db, fam.familyId, {
      name: "Big toy",
      emoji: "gift",
      cost: 20,
      assignedToKidId: robin.id,
    });

    const [goal] = await listKidAssignedRewards(db, fam.familyId, robin.id);
    expect(goal.moreNeeded).toBe(0);
    expect(goal.pct).toBe(100);
  });
});
