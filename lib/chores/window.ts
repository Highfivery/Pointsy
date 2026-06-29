/**
 * Pure logic for a chore's "logging window" — the days and times a kid may
 * self-log it (parents can still award it manually any time). No I/O, so it's
 * unit-tested directly. Times are family-local wall-clock; the caller resolves
 * the family timezone (see {@link localParts}, {@link zonedWallTimeToInstant}).
 */
import { addDays, weekdayOf, zonedWallTimeToInstant } from "@/lib/timezone";

export interface LogWindow {
  /** 7-bit weekday mask, bit 0 = Mon … bit 6 = Sun. null = every day. */
  days: number | null;
  /** "HH:MM" 24h open time; null = no opening bound. */
  start: string | null;
  /** "HH:MM" 24h close time (exclusive); null = no closing bound. */
  end: string | null;
}

/** Whether this chore restricts logging at all (otherwise it's always open). */
export function hasLogWindow(w: LogWindow): boolean {
  return w.days !== null || w.start !== null || w.end !== null;
}

/** Minutes since midnight for a "HH:MM" string, or null when not set. */
export function hhmmToMinutes(value: string | null): number | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/** Is `weekday` (Mon=0…Sun=6) permitted by a day mask? */
export function dayAllowed(days: number | null, weekday: number): boolean {
  if (days === null) return true;
  return (days & (1 << weekday)) !== 0;
}

/**
 * Whether the chore may be logged at a given family-local weekday + minutes.
 * The close time is exclusive — a "closes 20:00" window allows up to 19:59.
 */
export function withinLogWindow(
  w: LogWindow,
  weekday: number,
  minutes: number,
): boolean {
  if (!dayAllowed(w.days, weekday)) return false;
  const start = hhmmToMinutes(w.start);
  const end = hhmmToMinutes(w.end);
  if (start !== null && minutes < start) return false;
  if (end !== null && minutes >= end) return false;
  return true;
}

/**
 * The next instant (≥ now) at which a *currently-closed* window opens, or null
 * when the chore has no window (always open). On a day with no opening bound the
 * window opens at local midnight. Scans up to a week ahead to wrap the day mask.
 */
export function nextOpenInstant(
  w: LogWindow,
  timezone: string,
  today: string,
  now: Date,
): Date | null {
  if (!hasLogWindow(w)) return null;
  const openMinute = hhmmToMinutes(w.start) ?? 0;
  for (let i = 0; i < 8; i += 1) {
    const date = addDays(today, i);
    if (!dayAllowed(w.days, weekdayOf(date))) continue;
    const instant = zonedWallTimeToInstant(timezone, date, openMinute);
    if (instant.getTime() >= now.getTime()) return instant;
  }
  return null;
}
