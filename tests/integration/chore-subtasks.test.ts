import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createChore, updateChore } from "@/lib/catalog/service";
import { getSubtasks } from "@/lib/chores/subtasks";
import { listSubmittableChores } from "@/lib/submissions/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"], familyName = "Fam") {
  const fam = await registerFamily(db, {
    familyName,
    parentName: "Parent",
    email: `p.${familyName}.${Math.random()}@example.com`,
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

describe("chore subtasks (checklist)", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("persists a checklist (dropping blanks) and exposes it to the kid", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Full bathroom clean",
      emoji: "bath",
      points: 10,
      subtasks: ["Wipe counters", "Clean mirror", "   ", "Sweep floor"],
    });
    expect(await getSubtasks(db, chore.id)).toEqual([
      "Wipe counters",
      "Clean mirror",
      "Sweep floor",
    ]);

    const view = (
      await listSubmittableChores(db, fam.familyId, kid.id, "UTC")
    ).find((c) => c.id === chore.id);
    expect(view?.subtasks).toEqual([
      "Wipe counters",
      "Clean mirror",
      "Sweep floor",
    ]);
  });

  it("replaces the checklist on update and can clear it", async () => {
    const { db } = ctx;
    const { fam } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Bedroom",
      emoji: "bed",
      points: 5,
      subtasks: ["Make bed", "Tidy desk"],
    });
    await updateChore(db, fam.familyId, chore.id, {
      name: "Bedroom",
      emoji: "bed",
      points: 5,
      subtasks: ["Vacuum"],
    });
    expect(await getSubtasks(db, chore.id)).toEqual(["Vacuum"]);

    await updateChore(db, fam.familyId, chore.id, {
      name: "Bedroom",
      emoji: "bed",
      points: 5,
    });
    expect(await getSubtasks(db, chore.id)).toEqual([]);
  });
});
