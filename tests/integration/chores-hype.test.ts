import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import {
  createChore,
  listChores,
  setChorePinned,
  createReward,
} from "@/lib/catalog/service";
import { mostUsedChoreIds, getStreak } from "@/lib/points/service";
import { getKidGoal, setKidGoal } from "@/lib/redemptions/service";
import { ledger } from "@/lib/db/schema";
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

describe("chore categories, pins, most-used, streak, goals", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("persists a chore category and keeps it tenant-isolated", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");

    const chore = await createChore(db, a.fam.familyId, {
      name: "Feed the dog",
      emoji: "paw",
      points: 5,
      category: "pets",
    });
    expect(chore.category).toBe("pets");

    expect(await listChores(db, b.fam.familyId)).toHaveLength(0);
    const mine = await listChores(db, a.fam.familyId);
    expect(mine[0]?.category).toBe("pets");
  });

  it("defaults category to other and toggles pinned within the family", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");
    const chore = await createChore(db, a.fam.familyId, {
      name: "Tidy",
      emoji: "tidy",
      points: 2,
    });
    expect(chore.category).toBe("other");
    expect(chore.pinned).toBe(false);

    // A foreign family can't pin our chore.
    await setChorePinned(db, b.fam.familyId, chore.id, true);
    expect((await listChores(db, a.fam.familyId))[0]?.pinned).toBe(false);

    await setChorePinned(db, a.fam.familyId, chore.id, true);
    expect((await listChores(db, a.fam.familyId))[0]?.pinned).toBe(true);
  });

  it("ranks most-used chores by how often they were awarded", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const dishes = await createChore(db, fam.familyId, {
      name: "Dishes",
      emoji: "dishes",
      points: 3,
    });
    const bed = await createChore(db, fam.familyId, {
      name: "Bed",
      emoji: "bed",
      points: 1,
    });
    const earn = (choreId: string) =>
      db.insert(ledger).values({
        familyId: fam.familyId,
        personId: kid.id,
        amount: 1,
        type: "earn",
        reason: "x",
        choreId,
        createdBy: fam.personId,
      });
    await earn(bed.id);
    await earn(dishes.id);
    await earn(dishes.id);

    expect(await mostUsedChoreIds(db, fam.familyId, kid.id, 6)).toEqual([
      dishes.id,
      bed.id,
    ]);
  });

  it("counts a consecutive-day earning streak (gaps reset it)", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const day = 86_400_000;
    const at = (offset: number) => new Date(Date.now() - offset * day);
    const earn = (when: Date) =>
      db.insert(ledger).values({
        familyId: fam.familyId,
        personId: kid.id,
        amount: 1,
        type: "earn",
        reason: "x",
        createdAt: when,
        createdBy: fam.personId,
      });
    await earn(at(0)); // today
    await earn(at(1)); // yesterday
    await earn(at(4)); // older, gap in between

    expect(await getStreak(db, fam.familyId, kid.id, "UTC")).toBe(2);
  });

  it("sets, reads and clears a savings goal (foreign rewards rejected)", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");
    const reward = await createReward(db, a.fam.familyId, {
      name: "Movie night",
      emoji: "movie",
      cost: 20,
    });
    await db.insert(ledger).values({
      familyId: a.fam.familyId,
      personId: a.kid.id,
      amount: 10,
      type: "earn",
      reason: "x",
      createdBy: a.fam.personId,
    });

    await setKidGoal(db, a.fam.familyId, a.kid.id, reward.id);
    const goal = await getKidGoal(db, a.fam.familyId, a.kid.id);
    expect(goal?.reward.name).toBe("Movie night");
    expect(goal?.pct).toBe(50);
    expect(goal?.moreNeeded).toBe(10);

    // A foreign family's kid can't target our reward.
    await expect(
      setKidGoal(db, b.fam.familyId, b.kid.id, reward.id),
    ).rejects.toThrow();

    await setKidGoal(db, a.fam.familyId, a.kid.id, null);
    expect(await getKidGoal(db, a.fam.familyId, a.kid.id)).toBeNull();
  });
});
