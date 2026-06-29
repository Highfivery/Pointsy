import { describe, it, expect } from "vitest";
import { localParts, weekdayOf, zonedWallTimeToInstant } from "@/lib/timezone";

describe("weekdayOf", () => {
  it("returns Mon=0 … Sun=6", () => {
    expect(weekdayOf("2026-06-29")).toBe(0); // Monday
    expect(weekdayOf("2026-07-04")).toBe(5); // Saturday
    expect(weekdayOf("2026-07-05")).toBe(6); // Sunday
  });
});

describe("localParts", () => {
  it("reads family-local weekday and minutes-since-midnight", () => {
    // 2026-06-29 22:00 UTC is 18:00 EDT (UTC-4) the same Monday.
    const at = new Date("2026-06-29T22:00:00Z");
    expect(localParts("America/New_York", at)).toEqual({
      weekday: 0,
      minutes: 18 * 60,
    });
  });

  it("can cross a date boundary backward into the previous weekday", () => {
    // 02:00 UTC Monday is 22:00 EDT the previous (Sunday) evening.
    const at = new Date("2026-06-29T02:00:00Z");
    expect(localParts("America/New_York", at)).toEqual({
      weekday: 6, // Sunday
      minutes: 22 * 60,
    });
  });
});

describe("zonedWallTimeToInstant", () => {
  it("resolves a summer (EDT) wall time", () => {
    const at = zonedWallTimeToInstant(
      "America/New_York",
      "2026-06-29",
      18 * 60,
    );
    expect(at.toISOString()).toBe("2026-06-29T22:00:00.000Z");
  });

  it("resolves a winter (EST) wall time — DST aware", () => {
    const at = zonedWallTimeToInstant(
      "America/New_York",
      "2026-01-15",
      18 * 60,
    );
    expect(at.toISOString()).toBe("2026-01-15T23:00:00.000Z");
  });

  it("round-trips with localParts", () => {
    const at = zonedWallTimeToInstant("Europe/London", "2026-03-30", 9 * 60);
    expect(localParts("Europe/London", at).minutes).toBe(9 * 60);
  });
});
