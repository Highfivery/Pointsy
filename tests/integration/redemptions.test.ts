import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createReward } from "@/lib/catalog/service";
import { awardCustom, adjustPoints, getBalance } from "@/lib/points/service";
import {
  getAvailable,
  requestRedemption,
  cancelRedemption,
  decideRedemption,
  fulfillRedemption,
  listRedeemableRewards,
  listKidRedemptions,
  listPendingRedemptions,
  listAwaitingFulfillment,
  InsufficientPointsError,
} from "@/lib/redemptions/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"], name = "Fam") {
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
    name: "Screen time",
    emoji: "tv",
    cost: 5,
  });
  await awardCustom(db, fam.familyId, kid.id, 10, "seed", fam.personId);
  return { fam, kid, reward };
}

describe("redemptions", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("blocks redemption when the kid's balance is negative", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    await adjustPoints(db, fam.familyId, kid.id, -25, "penalty", fam.personId);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(-15);

    await expect(
      requestRedemption(db, fam.familyId, kid.id, reward.id),
    ).rejects.toBeInstanceOf(InsufficientPointsError);
  });

  it("reserves points on request without deducting them", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    expect(await getAvailable(db, fam.familyId, kid.id)).toBe(10);

    const red = await requestRedemption(db, fam.familyId, kid.id, reward.id);
    expect(red.status).toBe("requested");
    expect(red.cost).toBe(5);
    expect(red.rewardName).toBe("Screen time"); // snapshot

    expect(await getBalance(db, fam.familyId, kid.id)).toBe(10); // not deducted
    expect(await getAvailable(db, fam.familyId, kid.id)).toBe(5); // reserved
  });

  it("deducts points on approval", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    const red = await requestRedemption(db, fam.familyId, kid.id, reward.id);
    await decideRedemption(db, fam.familyId, red.id, "approved", fam.personId);

    expect(await getBalance(db, fam.familyId, kid.id)).toBe(5);
    const [r] = await listKidRedemptions(db, fam.familyId, kid.id);
    expect(r.status).toBe("approved");
  });

  it("releases the reserve on deny and on cancel", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);

    const denied = await requestRedemption(db, fam.familyId, kid.id, reward.id);
    await decideRedemption(db, fam.familyId, denied.id, "denied", fam.personId);
    expect(await getAvailable(db, fam.familyId, kid.id)).toBe(10);

    const cancelled = await requestRedemption(
      db,
      fam.familyId,
      kid.id,
      reward.id,
    );
    await cancelRedemption(db, fam.familyId, cancelled.id, kid.id);
    expect(await getAvailable(db, fam.familyId, kid.id)).toBe(10);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(10);
  });

  it("rejects an unaffordable request", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const pricey = await createReward(db, fam.familyId, {
      name: "Big toy",
      emoji: "gift",
      cost: 50,
    });
    await expect(
      requestRedemption(db, fam.familyId, kid.id, pricey.id),
    ).rejects.toBeInstanceOf(InsufficientPointsError);
  });

  it("marks an approved redemption as fulfilled", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    const red = await requestRedemption(db, fam.familyId, kid.id, reward.id);
    await decideRedemption(db, fam.familyId, red.id, "approved", fam.personId);
    await fulfillRedemption(db, fam.familyId, red.id, fam.personId);

    const [r] = await listKidRedemptions(db, fam.familyId, kid.id);
    expect(r.status).toBe("fulfilled");
    expect(await listAwaitingFulfillment(db, fam.familyId)).toHaveLength(0);
  });

  it("flags affordability and feeds the parent queues", async () => {
    const { db } = ctx;
    const { fam, kid, reward } = await setup(db);
    await createReward(db, fam.familyId, {
      name: "Big toy",
      emoji: "gift",
      cost: 50,
    });

    const { available, rewards } = await listRedeemableRewards(
      db,
      fam.familyId,
      kid.id,
    );
    expect(available).toBe(10);
    const byName = Object.fromEntries(rewards.map((r) => [r.name, r]));
    expect(byName["Screen time"].affordable).toBe(true);
    expect(byName["Big toy"].affordable).toBe(false);
    expect(byName["Big toy"].moreNeeded).toBe(40);

    const red = await requestRedemption(db, fam.familyId, kid.id, reward.id);
    const pending = await listPendingRedemptions(db, fam.familyId);
    expect(pending).toHaveLength(1);
    expect(pending[0].kidName).toBe("Ava");

    await decideRedemption(db, fam.familyId, red.id, "approved", fam.personId);
    expect(await listPendingRedemptions(db, fam.familyId)).toHaveLength(0);
    expect(await listAwaitingFulfillment(db, fam.familyId)).toHaveLength(1);
  });

  it("keeps redemptions isolated per family", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");
    await requestRedemption(db, a.fam.familyId, a.kid.id, a.reward.id);

    expect(await listPendingRedemptions(db, b.fam.familyId)).toHaveLength(0);
    expect(await getAvailable(db, b.fam.familyId, b.kid.id)).toBe(10);
  });
});
