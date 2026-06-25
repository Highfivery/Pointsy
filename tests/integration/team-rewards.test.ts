import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createReward } from "@/lib/catalog/service";
import { awardCustom, getBalance } from "@/lib/points/service";
import {
  getAvailable,
  requestRedemption,
  InsufficientPointsError,
} from "@/lib/redemptions/service";
import {
  proposeTeamRedemption,
  respondTeamInvite,
  decideTeamRedemption,
  fulfillTeamRedemption,
  listTeamRedemptionsAwaitingApproval,
  listTeamRedemptionsAwaitingFulfillment,
  listTeamInvitesFor,
  listKidTeamRedemptions,
  NotEnoughKidsError,
  ShareUnaffordableError,
} from "@/lib/redemptions/team";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"], name = "Fam") {
  const fam = await registerFamily(db, {
    familyName: name,
    parentName: "Parent",
    email: `p.${name}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
  const kid = (n: string, pin: string) =>
    addKid(db, fam.familyId, { name: n, avatar: "cat", color: "#1", pin });
  const a = await kid("Ava", "1111");
  const b = await kid("Bo", "2222");
  const c = await kid("Cy", "3333");
  return { fam, a, b, c };
}

async function teamReward(db: TestDb["db"], familyId: string, cost = 30) {
  return createReward(db, familyId, {
    name: "Movie night",
    emoji: "tv",
    cost,
    isTeam: true,
    minKids: 2,
  });
}

describe("team rewards", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("splits evenly, reserves shares, then deducts each kid on approval", async () => {
    const { db } = ctx;
    const { fam, a, b, c } = await setup(db);
    for (const k of [a, b, c]) {
      await awardCustom(db, fam.familyId, k.id, 20, "seed", fam.personId);
    }
    const reward = await teamReward(db, fam.familyId, 30);

    const tr = await proposeTeamRedemption(db, fam.familyId, a.id, reward.id, [
      b.id,
      c.id,
    ]);
    // Each kid's 10-point share is reserved while it's pending.
    expect(await getAvailable(db, fam.familyId, a.id)).toBe(10);
    expect(await getAvailable(db, fam.familyId, b.id)).toBe(10);
    expect(await getBalance(db, fam.familyId, b.id)).toBe(20); // not yet spent

    // Bo has an invite; Ava (proposer) does not.
    expect(await listTeamInvitesFor(db, fam.familyId, b.id)).toHaveLength(1);
    expect(await listTeamInvitesFor(db, fam.familyId, a.id)).toHaveLength(0);

    await respondTeamInvite(db, fam.familyId, tr.id, b.id, true);
    await respondTeamInvite(db, fam.familyId, tr.id, c.id, true);

    const ready = await listTeamRedemptionsAwaitingApproval(db, fam.familyId);
    expect(ready).toHaveLength(1);
    expect(ready[0].members).toHaveLength(3);

    await decideTeamRedemption(db, fam.familyId, tr.id, "approved", fam.personId); // prettier-ignore
    for (const k of [a, b, c]) {
      expect(await getBalance(db, fam.familyId, k.id)).toBe(10); // 20 − 10 share
    }
  });

  it("a decline cancels the team-up and releases everyone's reserve", async () => {
    const { db } = ctx;
    const { fam, a, b } = await setup(db);
    await awardCustom(db, fam.familyId, a.id, 20, "seed", fam.personId);
    await awardCustom(db, fam.familyId, b.id, 20, "seed", fam.personId);
    const reward = await teamReward(db, fam.familyId, 30);

    const tr = await proposeTeamRedemption(db, fam.familyId, a.id, reward.id, [
      b.id,
    ]);
    expect(await getAvailable(db, fam.familyId, a.id)).toBe(5); // 20 − 15

    await respondTeamInvite(db, fam.familyId, tr.id, b.id, false); // decline
    expect(await getAvailable(db, fam.familyId, a.id)).toBe(20); // released
    expect(await listKidTeamRedemptions(db, fam.familyId, a.id)).toHaveLength(
      0,
    );
  });

  it("requires at least the reward's minimum kids", async () => {
    const { db } = ctx;
    const { fam, a } = await setup(db);
    await awardCustom(db, fam.familyId, a.id, 50, "seed", fam.personId);
    const reward = await teamReward(db, fam.familyId, 30);
    await expect(
      proposeTeamRedemption(db, fam.familyId, a.id, reward.id, []),
    ).rejects.toBeInstanceOf(NotEnoughKidsError);
  });

  it("won't let a kid accept a share they can't afford", async () => {
    const { db } = ctx;
    const { fam, a, b, c } = await setup(db);
    await awardCustom(db, fam.familyId, a.id, 20, "seed", fam.personId);
    await awardCustom(db, fam.familyId, c.id, 20, "seed", fam.personId);
    await awardCustom(db, fam.familyId, b.id, 5, "seed", fam.personId); // poor
    const reward = await teamReward(db, fam.familyId, 30); // 10 each

    const tr = await proposeTeamRedemption(db, fam.familyId, a.id, reward.id, [
      b.id,
      c.id,
    ]);
    await expect(
      respondTeamInvite(db, fam.familyId, tr.id, b.id, true),
    ).rejects.toBeInstanceOf(ShareUnaffordableError);
  });

  it("blocks solo redeem of a team-only reward but allows a both-reward", async () => {
    const { db } = ctx;
    const { fam, a } = await setup(db);
    await awardCustom(db, fam.familyId, a.id, 50, "x", fam.personId);

    const teamOnly = await createReward(db, fam.familyId, {
      name: "Big trip",
      emoji: "car",
      cost: 20,
      isTeam: true,
      minKids: 2,
    });
    await expect(
      requestRedemption(db, fam.familyId, a.id, teamOnly.id),
    ).rejects.toBeInstanceOf(InsufficientPointsError);

    const both = await createReward(db, fam.familyId, {
      name: "Game time",
      emoji: "gamepad",
      cost: 20,
      isTeam: true,
      minKids: 2,
      allowSolo: true,
    });
    const red = await requestRedemption(db, fam.familyId, a.id, both.id);
    expect(red.status).toBe("requested");
  });

  it("approved team redemptions await fulfilment, then can be delivered", async () => {
    const { db } = ctx;
    const { fam, a, b } = await setup(db);
    await awardCustom(db, fam.familyId, a.id, 20, "x", fam.personId);
    await awardCustom(db, fam.familyId, b.id, 20, "x", fam.personId);
    const reward = await teamReward(db, fam.familyId, 30);

    const tr = await proposeTeamRedemption(db, fam.familyId, a.id, reward.id, [
      b.id,
    ]);
    await respondTeamInvite(db, fam.familyId, tr.id, b.id, true);
    await decideTeamRedemption(db, fam.familyId, tr.id, "approved", fam.personId); // prettier-ignore

    expect(
      await listTeamRedemptionsAwaitingFulfillment(db, fam.familyId),
    ).toHaveLength(1);
    await fulfillTeamRedemption(db, fam.familyId, tr.id, fam.personId);
    expect(
      await listTeamRedemptionsAwaitingFulfillment(db, fam.familyId),
    ).toHaveLength(0);
  });

  it("isolates team redemptions by family", async () => {
    const { db } = ctx;
    const fa = await setup(db, "A");
    const fb = await setup(db, "B");
    for (const k of [fa.a, fa.b])
      await awardCustom(db, fa.fam.familyId, k.id, 20, "x", fa.fam.personId);
    const reward = await teamReward(db, fa.fam.familyId, 20);
    await proposeTeamRedemption(db, fa.fam.familyId, fa.a.id, reward.id, [
      fa.b.id,
    ]);

    // Family B sees nothing and B's balances are untouched.
    expect(
      await listTeamRedemptionsAwaitingApproval(db, fb.fam.familyId),
    ).toHaveLength(0);
    expect(await getAvailable(db, fb.fam.familyId, fb.a.id)).toBe(0);
  });
});
