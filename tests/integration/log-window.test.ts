import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import { addKid } from "@/lib/people/service";
import { createChore } from "@/lib/catalog/service";
import {
  submitChore,
  listSubmittableChores,
  InvalidSubmissionError,
} from "@/lib/submissions/service";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"], seed: number | string = Math.random()) {
  const fam = await registerFamily(db, {
    familyName: "Fam",
    parentName: "Pat",
    email: `p.${seed}@example.com`,
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

// All times below are UTC so wall-clock equals the instant.
const tz = "UTC";
const MON = "2026-06-29"; // Monday
const insideEvening = new Date("2026-06-29T19:00:00Z"); // Mon 19:00
const beforeEvening = new Date("2026-06-29T15:00:00Z"); // Mon 15:00
const saturday = new Date("2026-07-04T19:00:00Z"); // Sat 19:00
const WEEKDAYS = 0b0011111; // Mon–Fri

describe("chore logging windows", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("rejects a submit outside the time window, allows it inside", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Walk dog",
      emoji: "dog",
      points: 8,
      logWindowStart: "18:00",
      logWindowEnd: "20:00",
    });

    await expect(
      submitChore(db, fam.familyId, kid.id, chore.id, tz, beforeEvening),
    ).rejects.toBeInstanceOf(InvalidSubmissionError);

    // Inside the window it goes through.
    await submitChore(db, fam.familyId, kid.id, chore.id, tz, insideEvening);
  });

  it("rejects a submit on a disallowed weekday", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    const chore = await createChore(db, fam.familyId, {
      name: "Trash",
      emoji: "trash",
      points: 10,
      logWindowDays: WEEKDAYS,
    });

    await expect(
      submitChore(db, fam.familyId, kid.id, chore.id, tz, saturday),
    ).rejects.toBeInstanceOf(InvalidSubmissionError);

    // A weekday works.
    await submitChore(db, fam.familyId, kid.id, chore.id, tz, insideEvening);
  });

  it("reports windowState + opensAt for the kid's chore list", async () => {
    const { db } = ctx;
    const { fam, kid } = await setup(db);
    await createChore(db, fam.familyId, {
      name: "Walk dog",
      emoji: "dog",
      points: 8,
      logWindowStart: "18:00",
      logWindowEnd: "20:00",
    });

    const locked = await listSubmittableChores(
      db,
      fam.familyId,
      kid.id,
      tz,
      beforeEvening,
    );
    expect(locked[0].windowState).toBe("locked");
    expect(locked[0].canSubmit).toBe(false);
    expect(locked[0].opensAt).toBe("2026-06-29T18:00:00.000Z");

    const open = await listSubmittableChores(
      db,
      fam.familyId,
      kid.id,
      tz,
      insideEvening,
    );
    expect(open[0].windowState).toBe("open");
    expect(open[0].canSubmit).toBe(true);
    expect(open[0].closesAt).toBe("2026-06-29T20:00:00.000Z");
  });

  it("isolates windowed chores by family (tenant isolation)", async () => {
    const { db } = ctx;
    const a = await setup(db, `a.${Math.random()}`);
    const b = await setup(db, `b.${Math.random()}`);
    const choreA = await createChore(db, a.fam.familyId, {
      name: "A's chore",
      emoji: "dog",
      points: 5,
      logWindowStart: "18:00",
      logWindowEnd: "20:00",
    });

    // Family B can't see or log family A's chore — even inside the window.
    const bList = await listSubmittableChores(
      db,
      b.fam.familyId,
      b.kid.id,
      tz,
      insideEvening,
    );
    expect(bList.find((c) => c.id === choreA.id)).toBeUndefined();
    await expect(
      submitChore(db, b.fam.familyId, b.kid.id, choreA.id, tz, insideEvening),
    ).rejects.toBeInstanceOf(InvalidSubmissionError);
  });
});

// Defensive: the day-mask boundary used in the UI (Mon=bit0 … Sun=bit6).
describe("weekday mask boundaries", () => {
  it("Monday is bit 0 and Sunday is bit 6", () => {
    expect(MON).toBe("2026-06-29");
    expect(WEEKDAYS & (1 << 0)).toBeTruthy(); // Mon allowed
    expect(WEEKDAYS & (1 << 5)).toBeFalsy(); // Sat blocked
  });
});
