import { describe, it, expect } from "vitest";
import {
  dayAllowed,
  hasLogWindow,
  hhmmToMinutes,
  nextOpenInstant,
  withinLogWindow,
  type LogWindow,
} from "@/lib/chores/window";

const NONE: LogWindow = { days: null, start: null, end: null };
// Mon=0 … Sun=6
const WEEKDAYS = 0b0011111; // Mon–Fri
const SATURDAY = 0b0100000;

describe("hasLogWindow", () => {
  it("is false when nothing is set", () => {
    expect(hasLogWindow(NONE)).toBe(false);
  });
  it("is true when any field is set", () => {
    expect(hasLogWindow({ ...NONE, start: "18:00" })).toBe(true);
    expect(hasLogWindow({ ...NONE, days: WEEKDAYS })).toBe(true);
  });
});

describe("hhmmToMinutes", () => {
  it("parses HH:MM into minutes", () => {
    expect(hhmmToMinutes("00:00")).toBe(0);
    expect(hhmmToMinutes("18:30")).toBe(1110);
    expect(hhmmToMinutes(null)).toBe(null);
  });
});

describe("dayAllowed", () => {
  it("allows every day when mask is null", () => {
    expect(dayAllowed(null, 0)).toBe(true);
    expect(dayAllowed(null, 6)).toBe(true);
  });
  it("respects the weekday bits", () => {
    expect(dayAllowed(WEEKDAYS, 0)).toBe(true); // Mon
    expect(dayAllowed(WEEKDAYS, 4)).toBe(true); // Fri
    expect(dayAllowed(WEEKDAYS, 5)).toBe(false); // Sat
    expect(dayAllowed(WEEKDAYS, 6)).toBe(false); // Sun
  });
});

describe("withinLogWindow", () => {
  it("is always open with no restriction", () => {
    expect(withinLogWindow(NONE, 2, 600)).toBe(true);
  });

  it("honours an opening bound (after)", () => {
    const w = { days: null, start: "18:00", end: null };
    expect(withinLogWindow(w, 2, 17 * 60 + 59)).toBe(false);
    expect(withinLogWindow(w, 2, 18 * 60)).toBe(true);
    expect(withinLogWindow(w, 2, 23 * 60)).toBe(true);
  });

  it("honours a closing bound (before), exclusive of the end", () => {
    const w = { days: null, start: null, end: "20:00" };
    expect(withinLogWindow(w, 2, 19 * 60 + 59)).toBe(true);
    expect(withinLogWindow(w, 2, 20 * 60)).toBe(false);
  });

  it("honours a between window", () => {
    const w = { days: null, start: "18:00", end: "20:00" };
    expect(withinLogWindow(w, 2, 17 * 60)).toBe(false);
    expect(withinLogWindow(w, 2, 18 * 60)).toBe(true);
    expect(withinLogWindow(w, 2, 19 * 60)).toBe(true);
    expect(withinLogWindow(w, 2, 20 * 60)).toBe(false);
  });

  it("locks out a disallowed weekday regardless of time", () => {
    const w = { days: WEEKDAYS, start: null, end: null };
    expect(withinLogWindow(w, 4, 600)).toBe(true); // Fri
    expect(withinLogWindow(w, 5, 600)).toBe(false); // Sat
  });
});

describe("nextOpenInstant", () => {
  // A fixed UTC instant: 2026-06-29 (Mon) 22:00 UTC. Using UTC timezone keeps
  // wall-clock == UTC so assertions are easy to reason about.
  const tz = "UTC";

  it("returns null when there's no window", () => {
    expect(nextOpenInstant(NONE, tz, "2026-06-29", new Date())).toBe(null);
  });

  it("returns today's open when before it", () => {
    const now = new Date("2026-06-29T15:00:00Z"); // Mon 15:00
    const w = { days: null, start: "18:00", end: "20:00" };
    const next = nextOpenInstant(w, tz, "2026-06-29", now);
    expect(next?.toISOString()).toBe("2026-06-29T18:00:00.000Z");
  });

  it("rolls to tomorrow when past today's close", () => {
    const now = new Date("2026-06-29T21:00:00Z"); // Mon 21:00, after 20:00
    const w = { days: null, start: "18:00", end: "20:00" };
    const next = nextOpenInstant(w, tz, "2026-06-29", now);
    expect(next?.toISOString()).toBe("2026-06-30T18:00:00.000Z");
  });

  it("skips disallowed weekdays to the next allowed day", () => {
    // Mon 2026-06-29; Saturday-only window → next open is Sat 2026-07-04 09:00.
    const now = new Date("2026-06-29T10:00:00Z");
    const w = { days: SATURDAY, start: "09:00", end: "12:00" };
    const next = nextOpenInstant(w, tz, "2026-06-29", now);
    expect(next?.toISOString()).toBe("2026-07-04T09:00:00.000Z");
  });

  it("opens at local midnight when there's no opening bound", () => {
    const now = new Date("2026-06-29T21:00:00Z"); // after the 20:00 close
    const w = { days: null, start: null, end: "20:00" };
    const next = nextOpenInstant(w, tz, "2026-06-29", now);
    expect(next?.toISOString()).toBe("2026-06-30T00:00:00.000Z");
  });
});
