import { describe, it, expect, beforeEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { registerFamily } from "@/lib/auth/register";
import { addKid, setKidActive } from "@/lib/people/service";
import { awardCustom, adjustPoints, undoEarn } from "@/lib/points/service";
import { ledger, milestoneUnlocks } from "@/lib/db/schema";
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
  setMilestoneActive,
  evaluateMilestones,
  evaluateMilestonesForFamily,
  getEarnedPoints,
  listKidMilestones,
  listMilestones,
  listOwedUnlocks,
  fulfillUnlock,
  activeParticipantIds,
  MilestoneLockedError,
  type MilestoneInput,
} from "@/lib/milestones/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

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

const base: MilestoneInput = {
  title: "Big saver",
  reward: "Special outing",
  target: 100,
  repeats: false,
  startMode: "lifetime",
  allKids: true,
  kidIds: [],
};

/** Insert an earn row dated in the past (before a milestone was created). */
async function earnAt(
  db: TestDb["db"],
  familyId: string,
  personId: string,
  amount: number,
  createdAt: Date,
) {
  await db.insert(ledger).values({
    familyId,
    personId,
    amount,
    type: "earn",
    reason: "old",
    createdAt,
  });
}

describe("milestones", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("counts earned points only: spending and deductions never lower it", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    await awardCustom(db, fam.familyId, kid.id, 80, "chores", fam.personId);
    await db.insert(ledger).values({
      familyId: fam.familyId,
      personId: kid.id,
      amount: -50,
      type: "redeem",
      reason: "Ice cream",
    });
    await adjustPoints(db, fam.familyId, kid.id, -20, "oops", fam.personId);
    expect(await getEarnedPoints(db, fam.familyId, kid.id)).toBe(80);
  });

  it("drops a put-back earn from the earned total", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const a = await awardCustom(
      db,
      fam.familyId,
      kid.id,
      30,
      "a",
      fam.personId,
    );
    await awardCustom(db, fam.familyId, kid.id, 20, "b", fam.personId);
    await undoEarn(db, fam.familyId, a.id, fam.personId);
    expect(await getEarnedPoints(db, fam.familyId, kid.id)).toBe(20);
  });

  it("unlocks a one-time milestone once, with a snapshot, even after spending", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const m = await createMilestone(db, fam.familyId, base, fam.personId);

    await awardCustom(db, fam.familyId, kid.id, 60, "a", fam.personId);
    expect(await evaluateMilestones(db, fam.familyId, kid.id)).toHaveLength(0);

    await db.insert(ledger).values({
      familyId: fam.familyId,
      personId: kid.id,
      amount: -60,
      type: "redeem",
      reason: "spent it all",
    });
    await awardCustom(db, fam.familyId, kid.id, 40, "b", fam.personId);
    const won = await evaluateMilestones(db, fam.familyId, kid.id);
    expect(won).toHaveLength(1);
    expect(won[0]).toMatchObject({
      milestoneId: m.id,
      kidName: "Robin",
      reward: "Special outing",
      seq: 1,
    });

    await awardCustom(db, fam.familyId, kid.id, 500, "c", fam.personId);
    expect(await evaluateMilestones(db, fam.familyId, kid.id)).toHaveLength(0);

    // Renaming later doesn't rewrite what was unlocked.
    await updateMilestone(db, fam.familyId, m.id, {
      ...base,
      title: "Renamed",
      reward: "Something else",
    });
    const owed = await listOwedUnlocks(db, fam.familyId);
    expect(owed).toHaveLength(1);
    expect(owed[0]).toMatchObject({
      title: "Big saver",
      reward: "Special outing",
    });
  });

  it("unlocks a repeatable milestone once per full target, idempotently", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    await createMilestone(db, fam.familyId, {
      ...base,
      target: 500,
      repeats: true,
    });
    await awardCustom(db, fam.familyId, kid.id, 1500, "a", fam.personId);

    const won = await evaluateMilestones(db, fam.familyId, kid.id);
    expect(won.map((w) => w.seq)).toEqual([1, 2, 3]);
    expect(await evaluateMilestones(db, fam.familyId, kid.id)).toHaveLength(0);

    await awardCustom(db, fam.familyId, kid.id, 499, "b", fam.personId);
    expect(await evaluateMilestones(db, fam.familyId, kid.id)).toHaveLength(0);
    await awardCustom(db, fam.familyId, kid.id, 1, "c", fam.personId);
    expect(
      (await evaluateMilestones(db, fam.familyId, kid.id)).map((w) => w.seq),
    ).toEqual([4]);

    const view = await listKidMilestones(db, fam.familyId, kid.id);
    expect(view.lifetime).toBe(2000);
    expect(view.items[0]).toMatchObject({ unlocked: 4, into: 0, of: 500 });
    expect(view.owed).toHaveLength(4);
  });

  it("never double-unlocks when two evaluations race", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    await createMilestone(db, fam.familyId, { ...base, repeats: true });
    await awardCustom(db, fam.familyId, kid.id, 300, "a", fam.personId);
    const [a, b] = await Promise.all([
      evaluateMilestones(db, fam.familyId, kid.id),
      evaluateMilestones(db, fam.familyId, kid.id),
    ]);
    expect(a.length + b.length).toBe(3);
    const rows = await db
      .select()
      .from(milestoneUnlocks)
      .where(eq(milestoneUnlocks.personId, kid.id));
    expect(rows).toHaveLength(3);
  });

  it("a 'from now on' milestone ignores points earned before it", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    await earnAt(
      db,
      fam.familyId,
      kid.id,
      900,
      new Date(Date.now() - 3600_000),
    );
    await createMilestone(db, fam.familyId, { ...base, startMode: "from_now" });
    expect(await evaluateMilestones(db, fam.familyId, kid.id)).toHaveLength(0);

    await awardCustom(db, fam.familyId, kid.id, 100, "new", fam.personId);
    expect(await evaluateMilestones(db, fam.familyId, kid.id)).toHaveLength(1);
  });

  it("a put-back of an old earn does not hurt 'from now on' progress", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const old = await awardCustom(
      db,
      fam.familyId,
      kid.id,
      50,
      "old",
      fam.personId,
    );
    await db
      .update(ledger)
      .set({ createdAt: new Date(Date.now() - 3600_000) })
      .where(eq(ledger.id, old.id));
    await createMilestone(db, fam.familyId, { ...base, startMode: "from_now" });
    await undoEarn(db, fam.familyId, old.id, fam.personId);
    // The put-back row is an `adjust`, so it never counts against new earns.
    await awardCustom(db, fam.familyId, kid.id, 100, "new", fam.personId);
    expect(await evaluateMilestones(db, fam.familyId, kid.id)).toHaveLength(1);
  });

  it("only covers picked kids, and a re-ticked kid keeps their history", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const other = await addKid(db, fam.familyId, {
      name: "Sam",
      avatar: "dog",
      color: "#2",
      pin: "1234",
    });
    const input = {
      ...base,
      repeats: true,
      startMode: "from_now" as const,
      allKids: false,
      kidIds: [kid.id],
    };
    const m = await createMilestone(db, fam.familyId, input);
    await awardCustom(db, fam.familyId, kid.id, 250, "a", fam.personId);
    await awardCustom(db, fam.familyId, other.id, 250, "a", fam.personId);
    expect(await evaluateMilestones(db, fam.familyId, kid.id)).toHaveLength(2);
    expect(await evaluateMilestones(db, fam.familyId, other.id)).toHaveLength(
      0,
    );

    // Untick, then re-tick: still counted from the original start, so the next
    // unlock is #3 at 300 — not a fresh count from zero.
    await updateMilestone(db, fam.familyId, m.id, {
      ...input,
      kidIds: [other.id],
    });
    expect(await activeParticipantIds(db, fam.familyId, m.id)).toEqual([
      other.id,
    ]);
    await updateMilestone(db, fam.familyId, m.id, {
      ...input,
      kidIds: [kid.id, other.id],
    });
    await awardCustom(db, fam.familyId, kid.id, 50, "b", fam.personId);
    expect(
      (await evaluateMilestones(db, fam.familyId, kid.id)).map((w) => w.seq),
    ).toEqual([3]);
  });

  it("covers kids added after an 'all kids' milestone was created", async () => {
    const { db } = ctx;
    const { fam } = await setup(db);
    await createMilestone(db, fam.familyId, base);
    const late = await addKid(db, fam.familyId, {
      name: "Late",
      avatar: "dog",
      color: "#2",
      pin: "1234",
    });
    await awardCustom(db, fam.familyId, late.id, 100, "a", fam.personId);
    expect(await evaluateMilestones(db, fam.familyId, late.id)).toHaveLength(1);
  });

  it("locks the target and repeat setting after the first unlock", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const m = await createMilestone(db, fam.familyId, base);
    // Before any unlock, the target can change freely.
    await updateMilestone(db, fam.familyId, m.id, { ...base, target: 200 });
    await awardCustom(db, fam.familyId, kid.id, 200, "a", fam.personId);
    await evaluateMilestones(db, fam.familyId, kid.id);
    await expect(
      updateMilestone(db, fam.familyId, m.id, { ...base, target: 50 }),
    ).rejects.toBeInstanceOf(MilestoneLockedError);
    await expect(
      updateMilestone(db, fam.familyId, m.id, {
        ...base,
        target: 200,
        repeats: true,
      }),
    ).rejects.toBeInstanceOf(MilestoneLockedError);
    // Wording changes are still fine.
    await updateMilestone(db, fam.familyId, m.id, {
      ...base,
      target: 200,
      title: "New name",
    });
  });

  it("a paused milestone unlocks nothing until resumed", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const m = await createMilestone(db, fam.familyId, base);
    await setMilestoneActive(db, fam.familyId, m.id, false);
    await awardCustom(db, fam.familyId, kid.id, 100, "a", fam.personId);
    expect(await evaluateMilestones(db, fam.familyId, kid.id)).toHaveLength(0);
    await setMilestoneActive(db, fam.familyId, m.id, true);
    expect(await evaluateMilestonesForFamily(db, fam.familyId)).toHaveLength(1);
  });

  it("skips deactivated kids", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    await createMilestone(db, fam.familyId, base);
    await awardCustom(db, fam.familyId, kid.id, 100, "a", fam.personId);
    await setKidActive(db, fam.familyId, kid.id, false);
    expect(await evaluateMilestones(db, fam.familyId, kid.id)).toHaveLength(0);
  });

  it("fulfils an unlock once, and owed rewards survive deleting the milestone", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const m = await createMilestone(db, fam.familyId, {
      ...base,
      repeats: true,
    });
    await awardCustom(db, fam.familyId, kid.id, 200, "a", fam.personId);
    const [first, second] = await evaluateMilestones(db, fam.familyId, kid.id);

    expect(
      await fulfillUnlock(db, fam.familyId, first.unlockId, fam.personId),
    ).toBe(true);
    expect(
      await fulfillUnlock(db, fam.familyId, first.unlockId, fam.personId),
    ).toBe(false);

    await deleteMilestone(db, fam.familyId, m.id);
    const owed = await listOwedUnlocks(db, fam.familyId);
    expect(owed.map((o) => o.id)).toEqual([second.unlockId]);
    expect(await listMilestones(db, fam.familyId)).toHaveLength(0);
    expect(
      (await listKidMilestones(db, fam.familyId, kid.id)).owed,
    ).toHaveLength(1);
  });

  it("isolates families (tenant isolation)", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");
    const m = await createMilestone(db, a.fam.familyId, base);
    await awardCustom(db, a.fam.familyId, a.kid.id, 100, "a", a.fam.personId);
    const [unlock] = await evaluateMilestones(db, a.fam.familyId, a.kid.id);

    // Family B sees nothing and can't touch family A's rows.
    expect(await listMilestones(db, b.fam.familyId)).toHaveLength(0);
    expect(await listOwedUnlocks(db, b.fam.familyId)).toHaveLength(0);
    expect(
      await fulfillUnlock(db, b.fam.familyId, unlock.unlockId, b.fam.personId),
    ).toBe(false);
    await updateMilestone(db, b.fam.familyId, m.id, {
      ...base,
      title: "Hacked",
    });
    await setMilestoneActive(db, b.fam.familyId, m.id, false);
    await deleteMilestone(db, b.fam.familyId, m.id);
    const [still] = await listMilestones(db, a.fam.familyId);
    expect(still.milestone).toMatchObject({
      title: "Big saver",
      isActive: true,
    });

    // Family A's kid can't be evaluated under family B, and B can't pick A's kid.
    expect(await evaluateMilestones(db, b.fam.familyId, a.kid.id)).toHaveLength(
      0,
    );
    const mb = await createMilestone(db, b.fam.familyId, {
      ...base,
      allKids: false,
      kidIds: [a.kid.id, b.kid.id],
    });
    expect(await activeParticipantIds(db, b.fam.familyId, mb.id)).toEqual([
      b.kid.id,
    ]);

    // B's earned total ignores A's ledger.
    expect(await getEarnedPoints(db, b.fam.familyId, a.kid.id)).toBe(0);
    const aRows = await db
      .select()
      .from(milestoneUnlocks)
      .where(
        and(
          eq(milestoneUnlocks.familyId, a.fam.familyId),
          eq(milestoneUnlocks.personId, a.kid.id),
        ),
      );
    expect(aRows[0].fulfilledAt).toBeNull();
  });
});
