/** Pure helpers for chore claim limits (no I/O — safe in client components). */

export type LimitPeriod = "none" | "day" | "week";
export type LimitScope = "per_kid" | "total";

/**
 * Human label for a chore's claim limit, or null when unlimited. Pass `scope`
 * (parent catalog view) to clarify whether the count is per kid ("… each") or a
 * shared family-wide total ("… · shared"); omit it for the kid's own view.
 */
export function formatChoreLimit(
  period: LimitPeriod,
  count: number,
  scope?: LimitScope,
): string | null {
  if (period === "none") return null;
  const unit = period === "day" ? "day" : "week";
  const base = count === 1 ? `Once a ${unit}` : `${count}× per ${unit}`;
  if (scope === "per_kid") return `${base} each`;
  if (scope === "total") return `${base} · shared`;
  return base;
}

const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_MASK = 0b0011111; // Mon–Fri (bit 0 = Mon)
const WEEKENDS_MASK = 0b1100000; // Sat–Sun

/** "6 PM" / "6:30 PM"; pass false to drop the meridiem (for range starts). */
function clock(hhmm: string, withMeridiem = true): string {
  const [h, m] = hhmm.split(":").map(Number);
  const mer = h < 12 ? "AM" : "PM";
  const h12 = ((h + 11) % 12) + 1;
  const core = m === 0 ? `${h12}` : `${h12}:${String(m).padStart(2, "0")}`;
  return withMeridiem ? `${core} ${mer}` : core;
}

const meridiem = (hhmm: string) =>
  Number(hhmm.split(":")[0]) < 12 ? "AM" : "PM";

/**
 * Compact summary of a chore's logging window for a catalog card, e.g.
 * "Weekdays, 6–8 PM" / "Tue, Fri" / "Until 8 PM". Returns null when no window
 * is set. Days mask: bit 0 = Mon … bit 6 = Sun (null = every day).
 */
export function formatLogWindowSummary(
  days: number | null,
  start: string | null,
  end: string | null,
): string | null {
  let dayLabel: string | null = null;
  if (days !== null) {
    if (days === WEEKDAYS_MASK) dayLabel = "Weekdays";
    else if (days === WEEKENDS_MASK) dayLabel = "Weekends";
    else {
      const picked = DAY_ABBR.filter((_, i) => (days & (1 << i)) !== 0);
      dayLabel = picked.length > 0 ? picked.join(", ") : null;
    }
  }

  let timeLabel: string | null = null;
  if (start && end) {
    timeLabel =
      meridiem(start) === meridiem(end)
        ? `${clock(start, false)}–${clock(end)}`
        : `${clock(start)}–${clock(end)}`;
  } else if (start) {
    timeLabel = `From ${clock(start)}`;
  } else if (end) {
    timeLabel = `Until ${clock(end)}`;
  }

  if (dayLabel && timeLabel) return `${dayLabel}, ${timeLabel}`;
  return dayLabel ?? timeLabel ?? null;
}
