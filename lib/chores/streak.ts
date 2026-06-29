import { addDays } from "@/lib/timezone";

/**
 * The kid's "all core chores done" streak: consecutive family-local days, ending
 * today (or yesterday, so a streak isn't "lost" before the day is over), on
 * which *every* core chore expected that day was logged.
 *
 * Pure so it can be unit-tested without a database. `doneByDay` maps a local
 * date (YYYY-MM-DD) to how many distinct core chores were logged that day.
 * `expected` is how many must be done to complete a day — either a constant, or
 * a per-day function (a chore restricted to certain weekdays only counts on the
 * days it's actually loggable). A day that expects nothing is transparent: it
 * neither breaks nor adds to the streak.
 */
export function coreStreak(
  doneByDay: Map<string, number>,
  expected: number | ((date: string) => number),
  today: string,
): number {
  if (typeof expected === "number" && expected <= 0) return 0;
  const expectedOn = typeof expected === "number" ? () => expected : expected;

  const status = (d: string): "done" | "miss" | "skip" => {
    const need = expectedOn(d);
    if (need <= 0) return "skip";
    return (doneByDay.get(d) ?? 0) >= need ? "done" : "miss";
  };

  let cursor = status(today) === "miss" ? addDays(today, -1) : today;
  let streak = 0;
  // Walk backwards, skipping days with nothing due; stop at the first miss.
  // Bounded so an all-skip history can't loop forever.
  for (let guard = 0; guard < 366; guard += 1) {
    const s = status(cursor);
    if (s === "miss") break;
    if (s === "done") streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
