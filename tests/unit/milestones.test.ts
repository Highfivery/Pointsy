import { describe, expect, it } from "vitest";
import { nextProgress, unlockCount } from "@/lib/domain/milestones";

describe("unlockCount", () => {
  it("is zero below the target", () => {
    expect(unlockCount(0, 500, false)).toBe(0);
    expect(unlockCount(499, 500, true)).toBe(0);
  });

  it("unlocks a one-time milestone exactly once", () => {
    expect(unlockCount(500, 500, false)).toBe(1);
    expect(unlockCount(5000, 500, false)).toBe(1);
  });

  it("unlocks a repeatable milestone once per full target", () => {
    expect(unlockCount(500, 500, true)).toBe(1);
    expect(unlockCount(1499, 500, true)).toBe(2);
    expect(unlockCount(1500, 500, true)).toBe(3);
  });

  it("treats negative progress and bad targets as nothing reached", () => {
    expect(unlockCount(-200, 500, true)).toBe(0);
    expect(unlockCount(1000, 0, true)).toBe(0);
    expect(unlockCount(Number.NaN, 10, true)).toBe(0);
  });
});

describe("nextProgress", () => {
  it("counts toward a one-time target and stops when done", () => {
    expect(nextProgress(120, 500, false)).toEqual({
      into: 120,
      of: 500,
      done: false,
    });
    expect(nextProgress(900, 500, false)).toEqual({
      into: 500,
      of: 500,
      done: true,
    });
  });

  it("wraps for a repeatable target", () => {
    expect(nextProgress(1250, 500, true)).toEqual({
      into: 250,
      of: 500,
      done: false,
    });
    expect(nextProgress(1000, 500, true)).toEqual({
      into: 0,
      of: 500,
      done: false,
    });
  });

  it("clamps negative progress to zero", () => {
    expect(nextProgress(-40, 100, true).into).toBe(0);
    expect(nextProgress(-40, 100, false).into).toBe(0);
  });

  it("handles a zero target safely", () => {
    expect(nextProgress(10, 0, true)).toEqual({ into: 0, of: 0, done: true });
  });
});
