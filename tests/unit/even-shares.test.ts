import { describe, it, expect } from "vitest";
import { evenShares } from "@/lib/redemptions/split";

describe("evenShares", () => {
  it("divides evenly when it can", () => {
    expect(evenShares(9, 3)).toEqual([3, 3, 3]);
  });

  it("gives the remainder to the first kids and sums to the cost", () => {
    expect(evenShares(10, 3)).toEqual([4, 3, 3]);
    expect(evenShares(7, 2)).toEqual([4, 3]);
    for (const [cost, n] of [
      [10, 3],
      [7, 2],
      [100, 7],
      [1, 4],
    ] as const) {
      const shares = evenShares(cost, n);
      expect(shares).toHaveLength(n);
      expect(shares.reduce((a, b) => a + b, 0)).toBe(cost);
    }
  });

  it("handles one kid and zero cost", () => {
    expect(evenShares(10, 1)).toEqual([10]);
    expect(evenShares(0, 2)).toEqual([0, 0]);
  });

  it("returns nothing for zero kids", () => {
    expect(evenShares(10, 0)).toEqual([]);
  });
});
