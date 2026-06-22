/**
 * Pure points/redemption logic. No I/O — trivially unit-testable.
 *
 * Balance is derived from the append-only ledger (SPEC §4.7):
 *   balance   = SUM(ledger.amount)            // signed; may be negative
 *   reserved  = SUM(cost of `requested` redemptions)
 *   available = balance − reserved            // what a kid can spend now
 */

export interface AmountLike {
  amount: number;
}

export interface RedemptionLike {
  status: "requested" | "approved" | "fulfilled" | "denied" | "cancelled";
  cost: number;
}

/** Sum of all ledger entries for a person. May be negative. */
export function computeBalance(entries: readonly AmountLike[]): number {
  return entries.reduce((sum, e) => sum + e.amount, 0);
}

/** Points held by still-pending redemption requests. */
export function computeReserved(
  redemptions: readonly RedemptionLike[],
): number {
  return redemptions
    .filter((r) => r.status === "requested")
    .reduce((sum, r) => sum + r.cost, 0);
}

/** Spendable points right now = balance − reserved. */
export function computeAvailable(
  entries: readonly AmountLike[],
  redemptions: readonly RedemptionLike[],
): number {
  return computeBalance(entries) - computeReserved(redemptions);
}

/**
 * Whether a kid may request a redemption costing `cost`.
 * Disallowed when available is negative or insufficient.
 */
export function canRequestRedemption(available: number, cost: number): boolean {
  return available >= 0 && cost >= 0 && cost <= available;
}

export interface PointsSummary {
  balance: number;
  reserved: number;
  available: number;
}

export function summarize(
  entries: readonly AmountLike[],
  redemptions: readonly RedemptionLike[],
): PointsSummary {
  const balance = computeBalance(entries);
  const reserved = computeReserved(redemptions);
  return { balance, reserved, available: balance - reserved };
}
