import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import {
  saveSubscription,
  deleteSubscriptionByEndpoint,
  listSubscriptionsForPerson,
  listSubscriptionsForParents,
} from "@/lib/push/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function newFamily(db: TestDb["db"], name = "Fam") {
  return registerFamily(db, {
    familyName: name,
    parentName: "Parent",
    email: `p.${name}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
}

describe("push subscriptions", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("saves, upserts (by endpoint), lists, and deletes", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const kid = await addKid(db, fam.familyId, {
      name: "Ava",
      avatar: "cat",
      color: "#4338ca",
      pin: "1234",
    });

    await saveSubscription(db, fam.familyId, kid.id, {
      endpoint: "https://push.example/abc",
      p256dh: "k1",
      auth: "a1",
    });
    let subs = await listSubscriptionsForPerson(db, fam.familyId, kid.id);
    expect(subs).toHaveLength(1);
    expect(subs[0].endpoint).toBe("https://push.example/abc");

    // Same endpoint → updates in place (no duplicate).
    await saveSubscription(db, fam.familyId, kid.id, {
      endpoint: "https://push.example/abc",
      p256dh: "k2",
      auth: "a2",
    });
    subs = await listSubscriptionsForPerson(db, fam.familyId, kid.id);
    expect(subs).toHaveLength(1);
    expect(subs[0].p256dh).toBe("k2");

    await deleteSubscriptionByEndpoint(db, "https://push.example/abc");
    expect(
      await listSubscriptionsForPerson(db, fam.familyId, kid.id),
    ).toHaveLength(0);
  });

  it("lists only parents' subscriptions, scoped to the family", async () => {
    const { db } = ctx;
    const fam = await newFamily(db);
    const kid = await addKid(db, fam.familyId, {
      name: "Ava",
      avatar: "cat",
      color: "#4338ca",
      pin: "1234",
    });
    await saveSubscription(db, fam.familyId, fam.personId, {
      endpoint: "https://push.example/parent",
      p256dh: "x",
      auth: "y",
    });
    await saveSubscription(db, fam.familyId, kid.id, {
      endpoint: "https://push.example/kid",
      p256dh: "x",
      auth: "y",
    });

    const parents = await listSubscriptionsForParents(db, fam.familyId);
    expect(parents.map((s) => s.endpoint)).toEqual([
      "https://push.example/parent",
    ]);

    const other = await newFamily(db, "Other");
    expect(await listSubscriptionsForParents(db, other.familyId)).toHaveLength(
      0,
    );
  });
});
