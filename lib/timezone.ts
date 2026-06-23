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

/** Monday-start week containing a "YYYY-MM-DD" date, as a "YYYY-MM-DD" string. */
export function weekStart(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0=Sun..6=Sat
  const backToMonday = (dow + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - backToMonday);
  return dt.toISOString().slice(0, 10);
}
