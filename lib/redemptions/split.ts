/**
 * Split a cost evenly across `n` kids. Shares are whole points that sum exactly
 * to the cost — the first `cost % n` kids pay one extra point so nothing is lost
 * to rounding. e.g. evenShares(10, 3) → [4, 3, 3].
 */
export function evenShares(cost: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(cost / n);
  const remainder = cost - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}
