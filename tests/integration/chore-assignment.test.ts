import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createChore, updateChore, getChore } from "@/lib/catalog/service";
import { awardChore } from "@/lib/points/service";
import { getAssigneeIds } from "@/lib/chores/assignment";
import { listSubmittableChores } from "@/lib/submissions/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"], familyName = "Fam") {
  const fam = await registerFamily(db, {
    familyName,
    parentName: "Parent",
    email: `p.${familyName}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
  const robin = await addKid(db, fam.familyId, {
    name: "Robin",
    avatar: "cat",
    color: "#1",
    pin: "1234",
  });
  const sky = await addKid(db, fam.familyId, {
    name: "Sky",
    avatar: "dog",
    color: "#2",
    pin: "1234",
  });
  return { fam, robin, sky };
}

describe("chore assignment & rotation", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("persists specific assignees and locks the chore for other kids", async () => {
    const { db } = ctx;
    const { fam, robin, sky } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Robin's job",
      emoji: "star",
      points: 5,
      assignment: "specific",
      kidIds: [robin.id],
    });
    expect(await getAssigneeIds(db, chore.id)).toEqual([robin.id]);

    const forRobin = await listSubmittableChores(
      db,
      fam.familyId,
      robin.id,
      "UTC",
    );
    const forSky = await listSubmittableChores(db, fam.familyId, sky.id, "UTC");
    expect(forRobin.find((c) => c.id === chore.id)?.canSubmit).toBe(true);
    const skyView = forSky.find((c) => c.id === chore.id);
    expect(skyView?.canSubmit).toBe(false);
    expect(skyView?.reason).toBe("Not your chore");
  });

  it("ignores assignees from another family (tenant isolation)", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");
    const chore = await createChore(db, a.fam.familyId, {
      name: "Mine",
      emoji: "star",
      points: 1,
      assignment: "specific",
      kidIds: [a.robin.id, b.robin.id], // b.robin is foreign — must be dropped
    });
    expect(await getAssigneeIds(db, chore.id)).toEqual([a.robin.id]);
  });

  it("rotates only when the current-turn kid completes it", async () => {
    const { db } = ctx;
    const { fam, robin, sky } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Dishes",
      emoji: "dishes",
      points: 3,
      assignment: "rotating",
      kidIds: [robin.id, sky.id],
    });
    expect(
      (await getChore(db, fam.familyId, chore.id))?.currentTurnPersonId,
    ).toBe(robin.id);

    // Off-turn award (Sky) does NOT advance the turn.
    await awardChore(db, fam.familyId, sky.id, chore.id, fam.personId);
    expect(
      (await getChore(db, fam.familyId, chore.id))?.currentTurnPersonId,
    ).toBe(robin.id);

    // Current-turn kid (Robin) completes it → advances to Sky.
    await awardChore(db, fam.familyId, robin.id, chore.id, fam.personId);
    expect(
      (await getChore(db, fam.familyId, chore.id))?.currentTurnPersonId,
    ).toBe(sky.id);
    // …and wraps back to Robin.
    await awardChore(db, fam.familyId, sky.id, chore.id, fam.personId);
    expect(
      (await getChore(db, fam.familyId, chore.id))?.currentTurnPersonId,
    ).toBe(robin.id);
  });

  it("locks a rotating chore for whoever isn't up, naming the current kid", async () => {
    const { db } = ctx;
    const { fam, robin, sky } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Trash",
      emoji: "trash",
      points: 2,
      assignment: "rotating",
      kidIds: [robin.id, sky.id],
    });
    const forSky = await listSubmittableChores(db, fam.familyId, sky.id, "UTC");
    const view = forSky.find((c) => c.id === chore.id);
    expect(view?.canSubmit).toBe(false);
    expect(view?.reason).toBe("Robin's turn");
  });

  it("clearing assignment removes assignees and the turn", async () => {
    const { db } = ctx;
    const { fam, robin } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Bed",
      emoji: "bed",
      points: 1,
      assignment: "rotating",
      kidIds: [robin.id],
    });
    await updateChore(db, fam.familyId, chore.id, {
      name: "Bed",
      emoji: "bed",
      points: 1,
      assignment: "everyone",
    });
    expect(await getAssigneeIds(db, chore.id)).toEqual([]);
    expect(
      (await getChore(db, fam.familyId, chore.id))?.currentTurnPersonId,
    ).toBeNull();
  });
});
