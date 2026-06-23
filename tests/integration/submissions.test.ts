import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createChore } from "@/lib/catalog/service";
import { getBalance } from "@/lib/points/service";
import {
  submitChore,
  cancelSubmission,
  decideSubmission,
  listSubmittableChores,
  listPendingSubmissions,
  getPendingPoints,
  LimitReachedError,
  InvalidSubmissionError,
} from "@/lib/submissions/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"]) {
  const fam = await registerFamily(db, {
    familyName: "Fam",
    parentName: "Pat",
    email: `p.${Math.random()}@example.com`,
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

describe("chore submissions", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("submit → pending; approve → ledger earn + balance", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Make bed",
      emoji: "bed",
      points: 5,
    });

    await submitChore(db, fam.familyId, kid.id, chore.id, "UTC");
    expect(await getPendingPoints(db, fam.familyId, kid.id)).toBe(5);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(0);

    const pend = await listPendingSubmissions(db, fam.familyId);
    expect(pend).toHaveLength(1);
    await decideSubmission(
      db,
      fam.familyId,
      pend[0].id,
      "approved",
      fam.personId,
    );

    expect(await getBalance(db, fam.familyId, kid.id)).toBe(5);
    expect(await getPendingPoints(db, fam.familyId, kid.id)).toBe(0);
  });

  it("reject adds no points", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Tidy",
      emoji: "tidy",
      points: 8,
    });
    await submitChore(db, fam.familyId, kid.id, chore.id, "UTC");
    const [p] = await listPendingSubmissions(db, fam.familyId);
    await decideSubmission(db, fam.familyId, p.id, "rejected", fam.personId);
    expect(await getBalance(db, fam.familyId, kid.id)).toBe(0);
    expect(await getPendingPoints(db, fam.familyId, kid.id)).toBe(0);
  });

  it("enforces a daily limit; cancel frees the slot", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Bed",
      emoji: "bed",
      points: 5,
      limitPeriod: "day",
      limitCount: 1,
    });

    await submitChore(db, fam.familyId, kid.id, chore.id, "UTC");
    await expect(
      submitChore(db, fam.familyId, kid.id, chore.id, "UTC"),
    ).rejects.toBeInstanceOf(LimitReachedError);

    const list = await listSubmittableChores(db, fam.familyId, kid.id, "UTC");
    expect(list.find((c) => c.id === chore.id)?.canSubmit).toBe(false);

    const [p] = await listPendingSubmissions(db, fam.familyId);
    await cancelSubmission(db, fam.familyId, kid.id, p.id);

    const list2 = await listSubmittableChores(db, fam.familyId, kid.id, "UTC");
    expect(list2.find((c) => c.id === chore.id)?.canSubmit).toBe(true);
    await submitChore(db, fam.familyId, kid.id, chore.id, "UTC"); // ok again
  });

  it("approved claims still count toward the limit", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Bed",
      emoji: "bed",
      points: 5,
      limitPeriod: "day",
      limitCount: 1,
    });
    await submitChore(db, fam.familyId, kid.id, chore.id, "UTC");
    const [p] = await listPendingSubmissions(db, fam.familyId);
    await decideSubmission(db, fam.familyId, p.id, "approved", fam.personId);
    await expect(
      submitChore(db, fam.familyId, kid.id, chore.id, "UTC"),
    ).rejects.toBeInstanceOf(LimitReachedError);
  });

  it("keeps submissions scoped to their family", async () => {
    const { db } = ctx;
    const a = await setup(db);
    const b = await setup(db);
    const chore = await createChore(db, a.fam.familyId, {
      name: "Bed",
      emoji: "bed",
      points: 5,
    });
    await submitChore(db, a.fam.familyId, a.kid.id, chore.id, "UTC");
    const [p] = await listPendingSubmissions(db, a.fam.familyId);

    // Family B can't decide family A's submission.
    await expect(
      decideSubmission(db, b.fam.familyId, p.id, "approved", b.fam.personId),
    ).rejects.toBeInstanceOf(InvalidSubmissionError);
    expect(await listPendingSubmissions(db, b.fam.familyId)).toHaveLength(0);
  });
});
