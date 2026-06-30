import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createChore, getChore } from "@/lib/catalog/service";
import {
  submitChore,
  listSubmittableChores,
  listPendingSubmissions,
  decideSubmission,
  LimitReachedError,
} from "@/lib/submissions/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"]) {
  const fam = await registerFamily(db, {
    familyName: "Fam",
    parentName: "Pat",
    email: `p.${Math.random()}@example.com`,
    password: "supersecret1",
  });
  const ava = await addKid(db, fam.familyId, {
    name: "Ava",
    avatar: "cat",
    color: "#111111",
    pin: "1234",
  });
  const bo = await addKid(db, fam.familyId, {
    name: "Bo",
    avatar: "dog",
    color: "#222222",
    pin: "5678",
  });
  return { fam, ava, bo };
}

const tz = "UTC";
const choreOf = (chores: Awaited<ReturnType<typeof listSubmittableChores>>) =>
  chores[0];

describe("shared (total) chore limits", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("is first come, first served — once claimed it's gone for the others", async () => {
    const { db } = ctx;
    const { fam, ava, bo } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Empty dishwasher",
      emoji: "dishwasher",
      points: 6,
      limitPeriod: "day",
      limitCount: 1,
      limitScope: "total",
    });

    // Ava grabs it first.
    await submitChore(db, fam.familyId, ava.id, chore.id, tz);

    // Bo can no longer log it.
    await expect(
      submitChore(db, fam.familyId, bo.id, chore.id, tz),
    ).rejects.toBeInstanceOf(LimitReachedError);

    // Bo's screen shows it taken, naming who got it; Ava's shows her own done.
    const boView = choreOf(
      await listSubmittableChores(db, fam.familyId, bo.id, tz),
    );
    expect(boView.canSubmit).toBe(false);
    expect(boView.sharedTaken).toBe(true);
    expect(boView.reason).toBe("Ava got it first");

    const avaView = choreOf(
      await listSubmittableChores(db, fam.familyId, ava.id, tz),
    );
    expect(avaView.canSubmit).toBe(false);
    expect(avaView.sharedTaken).toBe(false); // her own "Done", not "taken"
  });

  it("frees the slot again when the parent rejects the claim", async () => {
    const { db } = ctx;
    const { fam, ava, bo } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Walk dog",
      emoji: "dog",
      points: 5,
      limitPeriod: "day",
      limitCount: 1,
      limitScope: "total",
    });

    await submitChore(db, fam.familyId, ava.id, chore.id, tz);
    const [pending] = await listPendingSubmissions(db, fam.familyId);
    await decideSubmission(
      db,
      fam.familyId,
      pending.id,
      "rejected",
      fam.personId,
    );

    // Slot is free — Bo can now claim it.
    await submitChore(db, fam.familyId, bo.id, chore.id, tz);
    const boView = choreOf(
      await listSubmittableChores(db, fam.familyId, bo.id, tz),
    );
    expect(boView.canSubmit).toBe(false); // Bo now holds the only slot
    expect(boView.sharedTaken).toBe(false);
  });

  it("allows multiple slots until the shared total is reached", async () => {
    const { db } = ctx;
    const { fam, ava, bo } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Tidy lounge",
      emoji: "broom",
      points: 4,
      limitPeriod: "day",
      limitCount: 2,
      limitScope: "total",
    });

    await submitChore(db, fam.familyId, ava.id, chore.id, tz); // 1/2
    await submitChore(db, fam.familyId, bo.id, chore.id, tz); // 2/2
    // Cap reached — a third (even from Ava, pure first-come) is blocked.
    await expect(
      submitChore(db, fam.familyId, ava.id, chore.id, tz),
    ).rejects.toBeInstanceOf(LimitReachedError);
  });

  it("per-kid limits stay independent per kid", async () => {
    const { db } = ctx;
    const { fam, ava, bo } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Make bed",
      emoji: "bed",
      points: 3,
      limitPeriod: "day",
      limitCount: 1,
      limitScope: "per_kid",
    });

    await submitChore(db, fam.familyId, ava.id, chore.id, tz);
    // Bo is unaffected by Ava's claim.
    await submitChore(db, fam.familyId, bo.id, chore.id, tz);
    // But Ava can't go again.
    await expect(
      submitChore(db, fam.familyId, ava.id, chore.id, tz),
    ).rejects.toBeInstanceOf(LimitReachedError);
  });

  it("forces a shared chore to be non-core (mutually exclusive)", async () => {
    const { db } = ctx;
    const { fam } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Shared core?",
      emoji: "broom",
      points: 2,
      isCore: true,
      limitPeriod: "day",
      limitCount: 1,
      limitScope: "total",
    });
    const saved = await getChore(db, fam.familyId, chore.id);
    expect(saved?.isCore).toBe(false);
    expect(saved?.limitScope).toBe("total");
  });

  it("isolates shared chores by family (tenant isolation)", async () => {
    const { db } = ctx;
    const a = await setup(db);
    const b = await setup(db);
    const choreA = await createChore(db, a.fam.familyId, {
      name: "A's shared chore",
      emoji: "dog",
      points: 5,
      limitPeriod: "day",
      limitCount: 1,
      limitScope: "total",
    });
    // Family B's kid can't log family A's chore.
    await expect(
      submitChore(db, b.fam.familyId, b.ava.id, choreA.id, tz),
    ).rejects.toThrow();
    const bList = await listSubmittableChores(db, b.fam.familyId, b.ava.id, tz);
    expect(bList.find((c) => c.id === choreA.id)).toBeUndefined();
  });
});
