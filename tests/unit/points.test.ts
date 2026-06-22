import { describe, it, expect } from "vitest";
import {
  computeBalance,
  computeReserved,
  computeAvailable,
  canRequestRedemption,
  summarize,
} from "@/lib/domain/points";

describe("computeBalance", () => {
  it("sums signed amounts", () => {
    expect(
      computeBalance([{ amount: 10 }, { amount: 5 }, { amount: -3 }]),
    ).toBe(12);
  });

  it("returns 0 for an empty ledger", () => {
    expect(computeBalance([])).toBe(0);
  });

  it("can be negative (balances are not floored)", () => {
    expect(computeBalance([{ amount: 5 }, { amount: -20 }])).toBe(-15);
  });
});

describe("computeReserved", () => {
  it("only counts requested redemptions", () => {
    const reserved = computeReserved([
      { status: "requested", cost: 10 },
      { status: "approved", cost: 5 },
      { status: "denied", cost: 7 },
      { status: "requested", cost: 3 },
    ]);
    expect(reserved).toBe(13);
  });
});

describe("computeAvailable", () => {
  it("subtracts reserved from balance", () => {
    const entries = [{ amount: 50 }];
    const redemptions = [{ status: "requested" as const, cost: 20 }];
    expect(computeAvailable(entries, redemptions)).toBe(30);
  });
});

describe("canRequestRedemption", () => {
  it("allows when available covers the cost", () => {
    expect(canRequestRedemption(30, 30)).toBe(true);
    expect(canRequestRedemption(30, 10)).toBe(true);
  });

  it("rejects when cost exceeds available", () => {
    expect(canRequestRedemption(30, 31)).toBe(false);
  });

  it("rejects when available is negative", () => {
    expect(canRequestRedemption(-1, 0)).toBe(false);
  });
});

describe("summarize", () => {
  it("returns balance, reserved, and available together", () => {
    const summary = summarize(
      [{ amount: 100 }, { amount: -10 }],
      [{ status: "requested", cost: 25 }],
    );
    expect(summary).toEqual({ balance: 90, reserved: 25, available: 65 });
  });
});
