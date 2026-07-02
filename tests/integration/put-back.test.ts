import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createChore } from "@/lib/catalog/service";
import {
  awardChore,
  awardCustom,
  adjustPoints,
  undoEarn,
  getBalance,
  getStreak,
  listFamilyActivity,
  listKidActivity,
  AlreadyReversedError,
  NotFoundError,
} from "@/lib/points/service";
import {
  submitChore,
  decideSubmission,
  listKidSubmissions,
  listSubmittableChores,
} from "@/lib/submissions/service";
import { createChallenge, listKidChallenges } from "@/lib/challenges/service";
import { ledger } from "@/lib/db/schema";
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

describe("put back a completed chore (#145)", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("reverses a direct award with a linked adjust row; the earn row is untouched", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Made bed",
      emoji: "🛏️",
      points: 5,
    });
    const earn = await awardChore(
      db,
      fam.familyId,
      kid.id,
      chore.id,
      fam.personId,
    );
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(5);

    const undone = await undoEarn(db, fam.familyId, earn.id, fam.personId);
    expect(undone).toEqual({
      kidId: kid.id,
      amount: 5,
      reason: "Made bed",
      choreId: chore.id,
    });
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(0);

    // Append-only: the earn row still exists unchanged; the reversal is a new
    // adjust row pointing back at it.
    const rows = await db
      .select()
      .from(ledger)
      .where(eq(ledger.familyId, fam.familyId));
    expect(rows).toHaveLength(2);
    const original = rows.find((r) => r.id === earn.id);
    expect(original?.amount).toBe(5);
    expect(original?.reversesId).toBeNull();
    const reversal = rows.find((r) => r.id !== earn.id);
    expect(reversal?.type).toBe("adjust");
    expect(reversal?.amount).toBe(-5);
    expect(reversal?.reversesId).toBe(earn.id);
    expect(reversal?.reason).toBe("Put back: Made bed");
    expect(reversal?.createdBy).toBe(fam.personId);
  });

  it("can only be put back once", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const earn = await awardCustom(
      db,
      fam.familyId,
      kid.id,
      10,
      "Helping",
      fam.personId,
    );

    await undoEarn(db, fam.familyId, earn.id, fam.personId);
    await expect(
      undoEarn(db, fam.familyId, earn.id, fam.personId),
    ).rejects.toBeInstanceOf(AlreadyReversedError);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(0);
  });

  it("rejects entries from another family (tenant isolation) and non-earn entries", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");
    const earn = await awardCustom(
      db,
      a.fam.familyId,
      a.kid.id,
      10,
      "x",
      a.fam.personId,
    );

    await expect(
      undoEarn(db, b.fam.familyId, earn.id, b.fam.personId),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await getBalance(db, a.fam.familyId, a.kid.id)).toBe(10);

    const adj = await adjustPoints(
      db,
      a.fam.familyId,
      a.kid.id,
      -3,
      "Oops",
      a.fam.personId,
    );
    await expect(
      undoEarn(db, a.fam.familyId, adj.id, a.fam.personId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("hides the reversal row from feeds and flags the earn as reversed", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const earn = await awardCustom(
      db,
      fam.familyId,
      kid.id,
      5,
      "First",
      fam.personId,
    );
    await awardCustom(db, fam.familyId, kid.id, 7, "Second", fam.personId);
    await undoEarn(db, fam.familyId, earn.id, fam.personId);

    const family = await listFamilyActivity(db, fam.familyId);
    expect(family).toHaveLength(2); // no −5 reversal row
    expect(family.find((e) => e.reason === "First")?.reversed).toBe(true);
    expect(family.find((e) => e.reason === "Second")?.reversed).toBe(false);

    const kidFeed = await listKidActivity(db, fam.familyId, kid.id);
    expect(kidFeed.map((e) => e.reason).sort()).toEqual(["First", "Second"]);
    expect(kidFeed.find((e) => e.reason === "First")?.reversed).toBe(true);
  });

  it("flips an approved submission back, so the chore is loggable again and the limit slot frees up", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Dishes",
      emoji: "🍽️",
      points: 4,
      isCore: true,
      limitPeriod: "day",
      limitCount: 1,
    });

    await submitChore(db, fam.familyId, kid.id, chore.id, TZ);
    const subs = await listKidSubmissions(db, fam.familyId, kid.id);
    await decideSubmission(
      db,
      fam.familyId,
      subs[0].id,
      "approved",
      fam.personId,
    );
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(4);

    let list = await listSubmittableChores(db, fam.familyId, kid.id, TZ);
    let row = list.find((c) => c.id === chore.id);
    expect(row?.loggedToday).toBe(true);
    expect(row?.canSubmit).toBe(false);

    // The approval linked the earn row to the submission.
    const [earn] = await db
      .select()
      .from(ledger)
      .where(eq(ledger.familyId, fam.familyId));
    expect(earn.submissionId).toBe(subs[0].id);

    await undoEarn(db, fam.familyId, earn.id, fam.personId);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(0);

    const after = await listKidSubmissions(db, fam.familyId, kid.id);
    expect(after[0].status).toBe("reversed");

    // Not complete any more: loggable again, daily limit slot released.
    list = await listSubmittableChores(db, fam.familyId, kid.id, TZ);
    row = list.find((c) => c.id === chore.id);
    expect(row?.loggedToday).toBe(false);
    expect(row?.canSubmit).toBe(true);

    // And the kid can complete it again for approval.
    await submitChore(db, fam.familyId, kid.id, chore.id, TZ);
    const again = await listKidSubmissions(db, fam.familyId, kid.id);
    expect(again.some((s) => s.status === "pending")).toBe(true);
  });

  it("removes the earn from points-challenge progress and the earn streak", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const today = localDate(TZ, new Date());
    await createChallenge(db, fam.familyId, {
      title: "Earn 10",
      scope: "kid",
      goalType: "points",
      goalTarget: 10,
      bonusPoints: 5,
      startsOn: addDays(today, -3),
      endsOn: addDays(today, 3),
    });
    const earn = await awardCustom(
      db,
      fam.familyId,
      kid.id,
      6,
      "Chores",
      fam.personId,
    );

    let [progress] = await listKidChallenges(db, fam.familyId, kid.id, TZ);
    expect(progress.value).toBe(6);
    expect(await getStreak(db, fam.familyId, kid.id, TZ)).toBe(1);

    await undoEarn(db, fam.familyId, earn.id, fam.personId);

    [progress] = await listKidChallenges(db, fam.familyId, kid.id, TZ);
    expect(progress.value).toBe(0);
    expect(await getStreak(db, fam.familyId, kid.id, TZ)).toBe(0);
  });

  it("removes an approved submission from chore-count challenge progress", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const today = localDate(TZ, new Date());
    await createChallenge(db, fam.familyId, {
      title: "Do 3 chores",
      scope: "kid",
      goalType: "chore_count",
      goalTarget: 3,
      bonusPoints: 5,
      startsOn: addDays(today, -3),
      endsOn: addDays(today, 3),
    });
    const chore = await createChore(db, fam.familyId, {
      name: "Sweep",
      emoji: "🧹",
      points: 2,
    });
    await submitChore(db, fam.familyId, kid.id, chore.id, TZ);
    const subs = await listKidSubmissions(db, fam.familyId, kid.id);
    await decideSubmission(
      db,
      fam.familyId,
      subs[0].id,
      "approved",
      fam.personId,
    );

    let [progress] = await listKidChallenges(db, fam.familyId, kid.id, TZ);
    expect(progress.value).toBe(1);

    const [earn] = await db
      .select()
      .from(ledger)
      .where(eq(ledger.familyId, fam.familyId));
    await undoEarn(db, fam.familyId, earn.id, fam.personId);

    [progress] = await listKidChallenges(db, fam.familyId, kid.id, TZ);
    expect(progress.value).toBe(0);
  });
});
