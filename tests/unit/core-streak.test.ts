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
});
