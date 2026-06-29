import { describe, it, expect } from "vitest";
import { coreStreak } from "@/lib/chores/streak";

const today = "2026-06-24";

function days(...pairs: [string, number][]) {
  return new Map(pairs);
}

describe("coreStreak", () => {
  it("is 0 when there are no core chores", () => {
    expect(coreStreak(days([today, 3]), 0, today)).toBe(0);
  });

  it("counts today when every core chore is done", () => {
    expect(coreStreak(days([today, 2]), 2, today)).toBe(1);
  });

  it("does not count a partially-done today, but keeps the prior streak", () => {
    // Today incomplete (1/2) → fall back to yesterday, which was complete.
    const map = days([today, 1], ["2026-06-23", 2], ["2026-06-22", 2]);
    expect(coreStreak(map, 2, today)).toBe(2);
  });

  it("breaks the streak on the first incomplete day", () => {
    const map = days(
      [today, 2],
      ["2026-06-23", 2],
      ["2026-06-22", 1], // incomplete → stop
      ["2026-06-21", 2],
    );
    expect(coreStreak(map, 2, today)).toBe(2);
  });

  it("is 0 when neither today nor yesterday is complete", () => {
    expect(coreStreak(days(["2026-06-22", 2]), 2, today)).toBe(0);
  });

  it("treats more-than-required as complete", () => {
    expect(coreStreak(days([today, 5]), 3, today)).toBe(1);
  });

  describe("per-day expected counts (day-restricted core chores)", () => {
    // today = 2026-06-24 is a Wednesday. A chore that's expected only on some
    // days contributes a varying daily target.
    it("doesn't break the streak across a day that expects nothing", () => {
      // Expect 1 on Wed/Mon, 0 on Tue (a day the chore isn't loggable).
      const expectedOn = (d: string) => (d === "2026-06-23" ? 0 : 1); // Tue expects nothing
      const map = days(
        [today, 1], // Wed done
        // 2026-06-23 (Tue) skipped — nothing due
        ["2026-06-22", 1], // Mon done
      );
      expect(coreStreak(map, expectedOn, today)).toBe(2);
    });

    it("a skipped day doesn't add to the streak count", () => {
      const expectedOn = (d: string) => (d === today ? 0 : 1);
      // Today expects nothing; yesterday + day before were done.
      const map = days(["2026-06-23", 1], ["2026-06-22", 1]);
      expect(coreStreak(map, expectedOn, today)).toBe(2);
    });

    it("still breaks on a genuine miss", () => {
      const expectedOn = () => 1;
      const map = days([today, 1], ["2026-06-23", 0], ["2026-06-22", 1]);
      // Yesterday expected 1 but did 0 → miss → streak is just today.
      expect(coreStreak(map, expectedOn, today)).toBe(1);
    });
  });
});
