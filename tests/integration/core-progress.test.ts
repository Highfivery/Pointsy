import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createChore } from "@/lib/catalog/service";
import {
  listSubmittableChores,
  submitChore,
  getCoreStreak,
} from "@/lib/submissions/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"], familyName = "Fam") {
  const fam = await registerFamily(db, {
    familyName,
    parentName: "Parent",
    email: `p.${familyName}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
  const kid = await addKid(db, fam.familyId, {
    name: "Robin",
    avatar: "cat",
    color: "#1",
    pin: "1234",
  });
  return { fam, kid };
}

describe("core-chore progress + streak", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("flags core chores and tracks loggedToday once submitted", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const core = await createChore(db, fam.familyId, {
      name: "Brush teeth",
      emoji: "sparkles",
      points: 5,
      isCore: true,
      limitPeriod: "day",
      limitCount: 1,
    });
    await createChore(db, fam.familyId, {
      name: "Extra credit",
      emoji: "star",
      points: 3,
      isCore: false,
    });

    let view = await listSubmittableChores(db, fam.familyId, kid.id, "UTC");
    const before = view.find((c) => c.id === core.id)!;
    expect(before.isCore).toBe(true);
    expect(before.eligible).toBe(true);
    expect(before.loggedToday).toBe(false);
    expect(view.find((c) => c.name === "Extra credit")!.isCore).toBe(false);

    await submitChore(db, fam.familyId, kid.id, core.id, "UTC");

    view = await listSubmittableChores(db, fam.familyId, kid.id, "UTC");
    const after = view.find((c) => c.id === core.id)!;
    expect(after.loggedToday).toBe(true);
    expect(after.canSubmit).toBe(false); // 1/day reached
    expect(after.reason).toBe("Done today");
  });

  it("counts the streak only once every core chore is logged today", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const a = await createChore(db, fam.familyId, {
      name: "Make bed",
      emoji: "bed",
      points: 5,
      isCore: true,
      limitPeriod: "day",
      limitCount: 1,
    });
    const b = await createChore(db, fam.familyId, {
      name: "Feed dog",
      emoji: "dog",
      points: 5,
      isCore: true,
      limitPeriod: "day",
      limitCount: 1,
    });
    const coreIds = [a.id, b.id];

    expect(await getCoreStreak(db, fam.familyId, kid.id, "UTC", coreIds)).toBe(
      0,
    );

    await submitChore(db, fam.familyId, kid.id, a.id, "UTC");
    // Only 1 of 2 done today → today incomplete, no prior days → 0.
    expect(await getCoreStreak(db, fam.familyId, kid.id, "UTC", coreIds)).toBe(
      0,
    );

    await submitChore(db, fam.familyId, kid.id, b.id, "UTC");
    // Both done today → streak of 1.
    expect(await getCoreStreak(db, fam.familyId, kid.id, "UTC", coreIds)).toBe(
      1,
    );
  });

  it("returns a 0 streak when there are no core chores", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    expect(await getCoreStreak(db, fam.familyId, kid.id, "UTC", [])).toBe(0);
  });
});
