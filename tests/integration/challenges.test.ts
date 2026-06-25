import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createChore } from "@/lib/catalog/service";
import { awardCustom, getBalance } from "@/lib/points/service";
import {
  submitChore,
  decideSubmission,
  listKidSubmissions,
} from "@/lib/submissions/service";
import {
  createChallenge,
  evaluateChallenges,
  listKidChallenges,
} from "@/lib/challenges/service";
import { localDate, addDays } from "@/lib/timezone";
import { createTestDb, type TestDb } from "../helpers/test-db";

const TZ = "UTC";

async function setup(db: TestDb["db"], name = "Fam") {
  const fam = await registerFamily(db, {
    familyName: name,
    parentName: "Parent",
    email: `p.${name}.${Math.random()}@example.com`,
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

// A window that brackets "now" (for ledger-time-based goals like points).
function windowAroundToday() {
  const today = localDate(TZ, new Date());
  return { startsOn: addDays(today, -3), endsOn: addDays(today, 3) };
}

describe("challenges", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("awards a points challenge once the target is reached, and only once", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const win = windowAroundToday();
    await createChallenge(db, fam.familyId, {
      title: "Big week",
      scope: "kid",
      goalType: "points",
      goalTarget: 50,
      bonusPoints: 10,
      ...win,
    });

    await awardCustom(db, fam.familyId, kid.id, 40, "chores", fam.personId);
    expect(
      (await evaluateChallenges(db, fam.familyId, kid.id, TZ)).length,
    ).toBe(0); // 40 < 50

    await awardCustom(db, fam.familyId, kid.id, 20, "more", fam.personId);
    const wins = await evaluateChallenges(db, fam.familyId, kid.id, TZ);
    expect(wins).toHaveLength(1);
    expect(wins[0].bonusPoints).toBe(10);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(70); // 60 + 10 bonus

    // Idempotent — no second payout.
    expect(
      (await evaluateChallenges(db, fam.familyId, kid.id, TZ)).length,
    ).toBe(0);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(70);
  });

  it("does not award a challenge whose window has passed", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const today = localDate(TZ, new Date());
    await createChallenge(db, fam.familyId, {
      title: "Last week",
      scope: "kid",
      goalType: "points",
      goalTarget: 10,
      bonusPoints: 5,
      startsOn: addDays(today, -10),
      endsOn: addDays(today, -3),
    });
    await awardCustom(db, fam.familyId, kid.id, 50, "chores", fam.personId);
    expect(
      (await evaluateChallenges(db, fam.familyId, kid.id, TZ)).length,
    ).toBe(0);
  });

  it("counts approved chores for a chore_count challenge", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const day = new Date("2026-03-10T12:00:00Z");
    const chore = await createChore(db, fam.familyId, {
      name: "Dishes",
      emoji: "utensils",
      points: 5,
    });
    await createChallenge(db, fam.familyId, {
      title: "Helper",
      scope: "kid",
      goalType: "chore_count",
      goalTarget: 2,
      bonusPoints: 15,
      startsOn: "2026-03-01",
      endsOn: "2026-03-31",
    });

    // Two submissions, both approved (only approved ones count).
    for (let i = 0; i < 2; i++) {
      await submitChore(db, fam.familyId, kid.id, chore.id, TZ, day);
    }
    const subs = await listKidSubmissions(db, fam.familyId, kid.id, 10);
    for (const s of subs) {
      await decideSubmission(db, fam.familyId, s.id, "approved", fam.personId, day); // prettier-ignore
    }

    const wins = await evaluateChallenges(db, fam.familyId, kid.id, TZ, day);
    expect(wins).toHaveLength(1);
    expect(wins[0].bonusPoints).toBe(15);
  });

  it("counts complete core-chore days for a core_days challenge", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const core = await createChore(db, fam.familyId, {
      name: "Teeth",
      emoji: "sparkles",
      points: 5,
      isCore: true,
      limitPeriod: "day",
      limitCount: 1,
    });
    await createChallenge(db, fam.familyId, {
      title: "Consistency",
      scope: "kid",
      goalType: "core_days",
      goalTarget: 2,
      bonusPoints: 20,
      startsOn: "2026-04-01",
      endsOn: "2026-04-30",
    });

    const d1 = new Date("2026-04-10T12:00:00Z");
    const d2 = new Date("2026-04-11T12:00:00Z");
    await submitChore(db, fam.familyId, kid.id, core.id, TZ, d1);
    expect(
      (await evaluateChallenges(db, fam.familyId, kid.id, TZ, d1)).length,
    ).toBe(0); // 1 day < 2
    await submitChore(db, fam.familyId, kid.id, core.id, TZ, d2);
    const wins = await evaluateChallenges(db, fam.familyId, kid.id, TZ, d2);
    expect(wins).toHaveLength(1);
  });

  it("pays every kid the full bonus when a family challenge is met", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const kid2 = await addKid(db, fam.familyId, {
      name: "Sky",
      avatar: "dog",
      color: "#2",
      pin: "2345",
    });
    const win = windowAroundToday();
    await createChallenge(db, fam.familyId, {
      title: "Team effort",
      scope: "family",
      goalType: "points",
      goalTarget: 50,
      bonusPoints: 10,
      ...win,
    });

    await awardCustom(db, fam.familyId, kid.id, 30, "a", fam.personId);
    await awardCustom(db, fam.familyId, kid2.id, 30, "b", fam.personId);
    // Either kid earning triggers the family payout to both.
    const wins = await evaluateChallenges(db, fam.familyId, kid.id, TZ);
    const paid = new Set(wins.map((w) => w.personId));
    expect(paid.has(kid.id)).toBe(true);
    expect(paid.has(kid2.id)).toBe(true);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(40);
    expect(await getBalance(db, fam.familyId, kid2.id)).toBe(40);
  });

  it("isolates challenges by family", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");
    const win = windowAroundToday();
    await createChallenge(db, b.fam.familyId, {
      title: "B's goal",
      scope: "kid",
      goalType: "points",
      goalTarget: 10,
      bonusPoints: 99,
      ...win,
    });
    // A's kid earns a lot; B's challenge must be untouched.
    await awardCustom(db, a.fam.familyId, a.kid.id, 500, "x", a.fam.personId);
    await evaluateChallenges(db, a.fam.familyId, a.kid.id, TZ);
    const bProgress = await listKidChallenges(db, b.fam.familyId, b.kid.id, TZ);
    expect(bProgress[0]?.value ?? 0).toBe(0);
    expect(bProgress[0]?.awarded).toBe(false);
    expect(await getBalance(db, b.fam.familyId, b.kid.id)).toBe(0);
  });
});
