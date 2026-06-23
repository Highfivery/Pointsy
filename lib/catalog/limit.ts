/** Pure helpers for chore claim limits (no I/O — safe in client components). */

export type LimitPeriod = "none" | "day" | "week";

/** Human label for a chore's claim limit, or null when unlimited. */
export function formatChoreLimit(
  period: LimitPeriod,
  count: number,
): string | null {
  if (period === "none") return null;
  const unit = period === "day" ? "day" : "week";
  return count === 1 ? `Once a ${unit}` : `${count}× per ${unit}`;
}
