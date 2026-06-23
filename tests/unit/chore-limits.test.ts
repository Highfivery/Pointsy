import { describe, it, expect } from "vitest";
import { formatChoreLimit } from "@/lib/catalog/limit";
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
