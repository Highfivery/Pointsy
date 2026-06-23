import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import {
  listChores,
  createChore,
  updateChore,
  toggleChoreActive,
  deleteChore,
  moveChore,
  listRewards,
  createReward,
  updateReward,
  moveReward,
} from "@/lib/catalog/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function newFamily(db: TestDb["db"], name = "Fam") {
  return registerFamily(db, {
    familyName: name,
    parentName: "Parent",
    email: `p.${name}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
}

describe("catalog service — chores", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("creates, lists, updates, toggles, and deletes chores", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);

    const made = await createChore(db, fam.familyId, {
      name: "Made bed",
      emoji: "🛏️",
      points: 5,
    });
    expect(made.sortOrder).toBe(0);
    expect(made.isActive).toBe(true);

    await createChore(db, fam.familyId, {
      name: "Dishes",
      emoji: "🍽️",
      points: 10,
    });
    let list = await listChores(db, fam.familyId);
    expect(list.map((c) => c.name)).toEqual(["Made bed", "Dishes"]);
    expect(list[1].sortOrder).toBe(1);

    await updateChore(db, fam.familyId, made.id, {
      name: "Make bed",
      emoji: "🛏️",
      points: 8,
    });
    await toggleChoreActive(db, fam.familyId, made.id, false);
    list = await listChores(db, fam.familyId);
    expect(list[0].name).toBe("Make bed");
    expect(list[0].points).toBe(8);
    expect(list[0].isActive).toBe(false);

    await deleteChore(db, fam.familyId, made.id);
    list = await listChores(db, fam.familyId);
    expect(list.map((c) => c.name)).toEqual(["Dishes"]);
  });

  it("reorders chores with move up/down", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const a = await createChore(db, fam.familyId, {
      name: "A",
      emoji: "🅰️",
      points: 1,
    });
    await createChore(db, fam.familyId, { name: "B", emoji: "🅱️", points: 2 });
    await createChore(db, fam.familyId, { name: "C", emoji: "🇨", points: 3 });

    await moveChore(db, fam.familyId, a.id, "down");
    expect((await listChores(db, fam.familyId)).map((c) => c.name)).toEqual([
      "B",
      "A",
      "C",
    ]);

    await moveChore(db, fam.familyId, a.id, "up");
    expect((await listChores(db, fam.familyId)).map((c) => c.name)).toEqual([
      "A",
      "B",
      "C",
    ]);

    // Moving the first item up is a no-op.
    await moveChore(db, fam.familyId, a.id, "up");
    expect((await listChores(db, fam.familyId)).map((c) => c.name)).toEqual([
      "A",
      "B",
      "C",
    ]);
  });

  it("keeps chores isolated per family", async () => {
    const { db } = ctx;
    const a = await newFamily(db, "A");
    const b = await newFamily(db, "B");
    await createChore(db, a.familyId, {
      name: "OnlyA",
      emoji: "🅰️",
      points: 1,
    });
    await createChore(db, b.familyId, {
      name: "OnlyB",
      emoji: "🅱️",
      points: 1,
    });

    expect((await listChores(db, a.familyId)).map((c) => c.name)).toEqual([
      "OnlyA",
    ]);
    expect((await listChores(db, b.familyId)).map((c) => c.name)).toEqual([
      "OnlyB",
    ]);
  });
});

describe("catalog service — rewards", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("creates rewards with cost and optional description, updates, reorders", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);

    const screen = await createReward(db, fam.familyId, {
      name: "Screen time",
      emoji: "📺",
      cost: 30,
      description: "30 minutes",
    });
    expect(screen.cost).toBe(30);
    expect(screen.description).toBe("30 minutes");

    const icecream = await createReward(db, fam.familyId, {
      name: "Ice cream",
      emoji: "🍦",
      cost: 50,
    });
    expect(icecream.description).toBeNull();

    await updateReward(db, fam.familyId, screen.id, {
      name: "Screen time",
      emoji: "📺",
      cost: 25,
    });
    await moveReward(db, fam.familyId, screen.id, "down");

    const list = await listRewards(db, fam.familyId);
    expect(list.map((r) => r.name)).toEqual(["Ice cream", "Screen time"]);
    expect(list.find((r) => r.name === "Screen time")?.cost).toBe(25);
  });
});
