import { describe, it, expect } from "vitest";
import { formatChoreLimit, formatLogWindowSummary } from "@/lib/catalog/limit";
import {
  isValidTimezone,
  normalizeTimezone,
  localDate,
  weekStart,
} from "@/lib/timezone";

describe("formatChoreLimit", () => {
  it("formats each period/count", () => {
    expect(formatChoreLimit("none", 1)).toBeNull();
    expect(formatChoreLimit("day", 1)).toBe("Once a day");
    expect(formatChoreLimit("day", 3)).toBe("3× per day");
    expect(formatChoreLimit("week", 1)).toBe("Once a week");
    expect(formatChoreLimit("week", 2)).toBe("2× per week");
  });
});

describe("formatLogWindowSummary", () => {
  const WEEKDAYS = 0b0011111; // Mon–Fri
  const WEEKENDS = 0b1100000; // Sat–Sun
  const TUE_FRI = (1 << 1) | (1 << 4);

  it("returns null when no window is set", () => {
    expect(formatLogWindowSummary(null, null, null)).toBeNull();
  });

  it("names the weekday presets", () => {
    expect(formatLogWindowSummary(WEEKDAYS, null, null)).toBe("Weekdays");
    expect(formatLogWindowSummary(WEEKENDS, null, null)).toBe("Weekends");
  });

  it("abbreviates a specific set of days", () => {
    expect(formatLogWindowSummary(TUE_FRI, null, null)).toBe("Tue, Fri");
  });

  it("formats time-only windows", () => {
    expect(formatLogWindowSummary(null, "18:00", "20:00")).toBe("6–8 PM");
    expect(formatLogWindowSummary(null, "18:00", null)).toBe("From 6 PM");
    expect(formatLogWindowSummary(null, null, "20:00")).toBe("Until 8 PM");
  });

  it("keeps both meridiems when the range crosses noon, and minutes when set", () => {
    expect(formatLogWindowSummary(null, "08:00", "14:00")).toBe("8 AM–2 PM");
    expect(formatLogWindowSummary(null, "18:30", "20:00")).toBe("6:30–8 PM");
  });

  it("combines days and time", () => {
    expect(formatLogWindowSummary(WEEKDAYS, "18:00", "20:00")).toBe(
      "Weekdays, 6–8 PM",
    );
    expect(formatLogWindowSummary(TUE_FRI, null, "17:00")).toBe(
      "Tue, Fri, Until 5 PM",
    );
  });
});

describe("timezone helpers", () => {
  it("validates and normalizes zones", () => {
    expect(isValidTimezone("America/New_York")).toBe(true);
    expect(isValidTimezone("Not/AZone")).toBe(false);
    expect(isValidTimezone(42)).toBe(false);
    expect(normalizeTimezone("Europe/London")).toBe("Europe/London");
    expect(normalizeTimezone("bogus")).toBe("UTC");
    expect(normalizeTimezone(null)).toBe("UTC");
  });

  it("computes the family-local date for an instant", () => {
    // 03:00 UTC on Jan 1 is still Dec 31 in New York (UTC-5).
    const at = new Date("2026-01-01T03:00:00Z");
    expect(localDate("America/New_York", at)).toBe("2025-12-31");
    expect(localDate("UTC", at)).toBe("2026-01-01");
  });

  it("computes the Monday-start week", () => {
    expect(weekStart("2026-06-24")).toBe("2026-06-22"); // Wed → Mon
    expect(weekStart("2026-06-22")).toBe("2026-06-22"); // Mon → same
    expect(weekStart("2026-06-21")).toBe("2026-06-15"); // Sun → prev Mon
  });
});
