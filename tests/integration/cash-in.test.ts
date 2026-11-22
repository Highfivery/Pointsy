import { describe, it, expect, beforeEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import {
  createReward,
  updateReward,
  toggleRewardActive,
} from "@/lib/catalog/service";
import {
  adjustPoints,
  awardCustom,
  getBalance,
  listKidActivity,
} from "@/lib/points/service";
import {
  cashInReward,
  refundRedemption,
  requestRedemption,
  decideRedemption,
  cancelRedemption,
  getAvailable,
  listAwaitingFulfillment,
  listCashInRewards,
  InsufficientPointsError,
  TeamOnlyRewardError,
  AlreadyRefundedError,
} from "@/lib/redemptions/service";
import { proposeTeamRedemption } from "@/lib/redemptions/team";
import { getEarnedPoints } from "@/lib/milestones/service";
import { ledger, redemptions } from "@/lib/db/schema";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"], name = "Fam", points = 100) {
  const fam = await registerFamily(db, {
    familyName: name,
    parentName: "Parent",
    email: `p.${name}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
  const kid = await addKid(db, fam.familyId, {
    name: "Ava",
    avatar: "cat",
    color: "#4338ca",
    pin: "1234",
  });
  const reward = await createReward(db, fam.familyId, {
    name: "Ice cream",
    emoji: "icecream",
    cost: 40,
  });
  if (points > 0) {
    await awardCustom(db, fam.familyId, kid.id, points, "seed", fam.personId);
  }
  return { fam, kid, reward };
}

async function redemptionRows(db: TestDb["db"], kidId: string) {
  return db.select().from(redemptions).where(eq(redemptions.personId, kidId));
}

describe("parent cash-in (#189)", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("deducts at once and records a delivered, snapshotted redemption", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    const { redemption, fromRequest } = await cashInReward(
      db,
      fam.familyId,
      kid.id,
      reward.id,
      fam.personId,
      { handedOver: true },
    );
    expect(fromRequest).toBe(false);
    expect(redemption).toMatchObject({
      status: "fulfilled",
      rewardName: "Ice cream",
      cost: 40,
      decidedBy: fam.personId,
      fulfilledBy: fam.personId,
    });
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(60);

    const [top] = await listKidActivity(db, fam.familyId, kid.id, 1);
    expect(top).toMatchObject({
      type: "redeem",
      reason: "Ice cream",
      amount: -40,
      redemptionId: redemption.id,
    });
    // Spending never touches earned points (milestones).
    expect(await getEarnedPoints(db, fam.familyId, kid.id)).toBe(100);
    expect(await listAwaitingFulfillment(db, fam.familyId)).toHaveLength(0);
  });

  it("can leave it for later delivery (Awaiting delivery)", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    const { redemption } = await cashInReward(
      db,
      fam.familyId,
      kid.id,
      reward.id,
      fam.personId,
      { handedOver: false },
    );
    expect(redemption.status).toBe("approved");
    const awaiting = await listAwaitingFulfillment(db, fam.familyId);
    expect(awaiting.map((a) => a.id)).toEqual([redemption.id]);
  });

  it("blocks a reward the kid can't afford, and any cash-in while in the red", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db, "Fam", 30);
    await expect(
      cashInReward(db, fam.familyId, kid.id, reward.id, fam.personId, {
        handedOver: true,
      }),
    ).rejects.toBeInstanceOf(InsufficientPointsError);

    const cheap = await createReward(db, fam.familyId, {
      name: "Sticker",
      emoji: "star",
      cost: 1,
    });
    await adjustPoints(db, fam.familyId, kid.id, -50, "oops", fam.personId);
    await expect(
      cashInReward(db, fam.familyId, kid.id, cheap.id, fam.personId, {
        handedOver: true,
      }),
    ).rejects.toBeInstanceOf(InsufficientPointsError);
    expect(await redemptionRows(db, kid.id)).toHaveLength(0);

    const list = await listCashInRewards(db, fam.familyId, kid.id);
    const sticker = list.rewards.find((r) => r.id === cheap.id);
    // −20 available: needs 21 to afford a 1-point reward.
    expect(sticker).toMatchObject({ affordable: false, moreNeeded: 21 });
  });

  it("counts other reserved points: requests and team-up shares", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db, "Fam", 60);
    const teammate = await addKid(db, fam.familyId, {
      name: "Ben",
      avatar: "dog",
      color: "#111111",
      pin: "1234",
    });
    await awardCustom(db, fam.familyId, teammate.id, 60, "seed", fam.personId);
    const team = await createReward(db, fam.familyId, {
      name: "Movie night",
      emoji: "film",
      cost: 40,
      isTeam: true,
      minKids: 2,
    });
    await proposeTeamRedemption(db, fam.familyId, kid.id, team.id, [
      teammate.id,
    ]);
    // 60 − 20 share reserved = 40 available: exactly enough.
    expect(await getAvailable(db, fam.familyId, kid.id)).toBe(40);
    await cashInReward(db, fam.familyId, kid.id, reward.id, fam.personId, {
      handedOver: true,
    });
    expect(await getAvailable(db, fam.familyId, kid.id)).toBe(0);
  });

  it("approves the kid's own pending request instead of charging twice", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    const req = await requestRedemption(db, fam.familyId, kid.id, reward.id);
    // The parent raises the price after the kid asked: the request-time cost
    // still applies (snapshot on write).
    await updateReward(db, fam.familyId, reward.id, {
      name: "Ice cream",
      emoji: "icecream",
      cost: 90,
    });
    const { redemption, fromRequest } = await cashInReward(
      db,
      fam.familyId,
      kid.id,
      reward.id,
      fam.personId,
      { handedOver: true },
    );
    expect(fromRequest).toBe(true);
    expect(redemption.id).toBe(req.id);
    expect(redemption.status).toBe("fulfilled");
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(60);
    expect(await redemptionRows(db, kid.id)).toHaveLength(1);
  });

  it("never deducts twice when a cash-in races the dashboard Approve", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    const req = await requestRedemption(db, fam.familyId, kid.id, reward.id);
    const results = await Promise.allSettled([
      decideRedemption(db, fam.familyId, req.id, "approved", fam.personId),
      cashInReward(db, fam.familyId, kid.id, reward.id, fam.personId, {
        handedOver: true,
      }),
    ]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const redeems = await db
      .select()
      .from(ledger)
      .where(and(eq(ledger.personId, kid.id), eq(ledger.type, "redeem")));
    // At most one charge for the request; a second, separate cash-in is only
    // allowed if it was affordable on its own (100 − 40 = 60 ≥ 40).
    const forRequest = redeems.filter((r) => r.redemptionId === req.id);
    expect(forRequest).toHaveLength(1);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(
      100 - 40 * redeems.length,
    );
  });

  it("two parents approving the same request charge only once", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    const req = await requestRedemption(db, fam.familyId, kid.id, reward.id);
    const results = await Promise.allSettled([
      decideRedemption(db, fam.familyId, req.id, "approved", fam.personId),
      decideRedemption(db, fam.familyId, req.id, "approved", fam.personId),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(60);
  });

  it("a kid cancelling while a parent approves can't leave a charge behind", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    const req = await requestRedemption(db, fam.familyId, kid.id, reward.id);
    await cancelRedemption(db, fam.familyId, req.id, kid.id);
    await expect(
      decideRedemption(db, fam.familyId, req.id, "approved", fam.personId),
    ).rejects.toThrow();
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(100);
  });

  it("two cash-ins with points for only one: one wins", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db, "Fam", 50);
    const results = await Promise.allSettled([
      cashInReward(db, fam.familyId, kid.id, reward.id, fam.personId, {
        handedOver: true,
      }),
      cashInReward(db, fam.familyId, kid.id, reward.id, fam.personId, {
        handedOver: true,
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(10);
  });

  it("rejects team-only, inactive, and another kid's personal rewards", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const other = await addKid(db, fam.familyId, {
      name: "Ben",
      avatar: "dog",
      color: "#111111",
      pin: "1234",
    });
    const teamOnly = await createReward(db, fam.familyId, {
      name: "Theme park",
      emoji: "ticket",
      cost: 10,
      isTeam: true,
      minKids: 2,
    });
    const soloOk = await createReward(db, fam.familyId, {
      name: "Board game",
      emoji: "dice",
      cost: 10,
      isTeam: true,
      minKids: 2,
      allowSolo: true,
    });
    const bens = await createReward(db, fam.familyId, {
      name: "Ben's bike",
      emoji: "bike",
      cost: 10,
      assignedToKidId: other.id,
    });
    const off = await createReward(db, fam.familyId, {
      name: "Old reward",
      emoji: "star",
      cost: 10,
    });
    await toggleRewardActive(db, fam.familyId, off.id, false);

    const go = (rewardId: string) =>
      cashInReward(db, fam.familyId, kid.id, rewardId, fam.personId, {
        handedOver: true,
      });
    await expect(go(teamOnly.id)).rejects.toBeInstanceOf(TeamOnlyRewardError);
    await expect(go(bens.id)).rejects.toThrow();
    await expect(go(off.id)).rejects.toThrow();
    await expect(go(soloOk.id)).resolves.toBeTruthy();

    const ids = (await listCashInRewards(db, fam.familyId, kid.id)).rewards.map(
      (r) => r.id,
    );
    expect(ids).toContain(soloOk.id);
    expect(ids).not.toContain(teamOnly.id);
    expect(ids).not.toContain(bens.id);
    expect(ids).not.toContain(off.id);
  });

  it("a kid can't request another kid's personal reward either", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const other = await addKid(db, fam.familyId, {
      name: "Ben",
      avatar: "dog",
      color: "#111111",
      pin: "1234",
    });
    const bens = await createReward(db, fam.familyId, {
      name: "Ben's bike",
      emoji: "bike",
      cost: 10,
      assignedToKidId: other.id,
    });
    await expect(
      requestRedemption(db, fam.familyId, kid.id, bens.id),
    ).rejects.toThrow();
  });

  it("refunds a reward once, with a linked adjust, and clears delivery", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    const { redemption } = await cashInReward(
      db,
      fam.familyId,
      kid.id,
      reward.id,
      fam.personId,
      { handedOver: false },
    );
    const [entry] = await listKidActivity(db, fam.familyId, kid.id, 1);

    const result = await refundRedemption(
      db,
      fam.familyId,
      entry.id,
      fam.personId,
    );
    expect(result).toMatchObject({ kidId: kid.id, amount: 40 });
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(100);
    expect(await getEarnedPoints(db, fam.familyId, kid.id)).toBe(100);
    expect(await listAwaitingFulfillment(db, fam.familyId)).toHaveLength(0);
    const [row] = await redemptionRows(db, kid.id);
    expect(row.id).toBe(redemption.id);
    expect(row.status).toBe("refunded");

    // The redeem row is untouched and now flagged; the refund row is hidden.
    const feed = await listKidActivity(db, fam.familyId, kid.id, 5);
    expect(feed.find((e) => e.id === entry.id)).toMatchObject({
      amount: -40,
      reversed: true,
    });
    expect(feed.some((e) => e.reason.startsWith("Refund:"))).toBe(false);

    await expect(
      refundRedemption(db, fam.familyId, entry.id, fam.personId),
    ).rejects.toBeInstanceOf(AlreadyRefundedError);
  });

  it("only refunds solo reward rows, not earns or deductions", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const [seed] = await listKidActivity(db, fam.familyId, kid.id, 1);
    await expect(
      refundRedemption(db, fam.familyId, seed.id, fam.personId),
    ).rejects.toThrow();
  });

  it("isolates families (tenant isolation)", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");

    // B can't cash in A's reward for its own kid, or anything for A's kid.
    await expect(
      cashInReward(db, b.fam.familyId, b.kid.id, a.reward.id, b.fam.personId, {
        handedOver: true,
      }),
    ).rejects.toThrow();
    await expect(
      cashInReward(db, b.fam.familyId, a.kid.id, b.reward.id, b.fam.personId, {
        handedOver: true,
      }),
    ).rejects.toThrow();

    await cashInReward(
      db,
      a.fam.familyId,
      a.kid.id,
      a.reward.id,
      a.fam.personId,
      {
        handedOver: true,
      },
    );
    const [aEntry] = await listKidActivity(db, a.fam.familyId, a.kid.id, 1);
    await expect(
      refundRedemption(db, b.fam.familyId, aEntry.id, b.fam.personId),
    ).rejects.toThrow();
    expect(await getBalance(db, a.fam.familyId, a.kid.id)).toBe(60);
    expect(
      (await listCashInRewards(db, b.fam.familyId, a.kid.id)).rewards.map(
        (r) => r.id,
      ),
    ).not.toContain(a.reward.id);
  });
});
