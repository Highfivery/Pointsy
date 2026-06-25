import { addDays } from "@/lib/timezone";

/**
 * The kid's "all core chores done" streak: consecutive family-local days, ending
 * today (or yesterday, so a streak isn't "lost" before the day is over), on
 * which *every* core chore was logged.
 *
 * Pure so it can be unit-tested without a database. `doneByDay` maps a local
 * date (YYYY-MM-DD) to how many distinct core chores were logged that day;
 * `coreCount` is how many must be done to complete a day.
 */
export function coreStreak(
  doneByDay: Map<string, number>,
  coreCount: number,
  today: string,
): number {
  if (coreCount <= 0) return 0;
  const complete = (d: string) => (doneByDay.get(d) ?? 0) >= coreCount;

  let cursor = complete(today) ? today : addDays(today, -1);
  if (!complete(cursor)) return 0;

  let streak = 0;
  while (complete(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
