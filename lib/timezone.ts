/** Timezone helpers (pure, Intl-based — safe on server and client). */

export function isValidTimezone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length === 0) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimezone(tz: unknown): string {
  return isValidTimezone(tz) ? tz : "UTC";
}

/** The family-local calendar date ("YYYY-MM-DD") for an instant in a timezone. */
export function localDate(timezone: string, at: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: isValidTimezone(timezone) ? timezone : "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** Shift a "YYYY-MM-DD" date by `n` whole days (UTC math; DST-safe). */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/** Monday-start week containing a "YYYY-MM-DD" date, as a "YYYY-MM-DD" string. */
export function weekStart(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0=Sun..6=Sat
  const backToMonday = (dow + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - backToMonday);
  return dt.toISOString().slice(0, 10);
}

/** Weekday of a "YYYY-MM-DD" date as Mon=0 … Sun=6 (matches the day-mask bits). */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/**
 * The family-local weekday (Mon=0…Sun=6) and minutes-since-midnight (0–1439) for
 * an instant — used to evaluate a chore's logging window against wall-clock time.
 */
export function localParts(
  timezone: string,
  at: Date,
): { weekday: number; minutes: number } {
  const tz = isValidTimezone(timezone) ? timezone : "UTC";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);
  const minutes = (get("hour") % 24) * 60 + get("minute");
  return { weekday: weekdayOf(localDate(tz, at)), minutes };
}

/** The UTC offset (minutes east of UTC) a timezone is at for a given instant. */
function offsetMinutes(tz: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return (asUtc - at.getTime()) / 60000;
}

/**
 * The absolute instant of a family-local wall-clock time ("YYYY-MM-DD" +
 * minutes-since-midnight) in a timezone — the inverse of {@link localParts}.
 * DST-safe: refines once against the offset at the resolved instant.
 */
export function zonedWallTimeToInstant(
  timezone: string,
  date: string,
  minutes: number,
): Date {
  const tz = isValidTimezone(timezone) ? timezone : "UTC";
  const [y, m, d] = date.split("-").map(Number);
  const utcGuess = Date.UTC(
    y,
    m - 1,
    d,
    Math.floor(minutes / 60),
    minutes % 60,
  );
  const off1 = offsetMinutes(tz, new Date(utcGuess));
  let instant = utcGuess - off1 * 60000;
  const off2 = offsetMinutes(tz, new Date(instant));
  if (off2 !== off1) instant = utcGuess - off2 * 60000;
  return new Date(instant);
}
