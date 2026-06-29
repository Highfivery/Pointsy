import { describe, it, expect } from "vitest";
import {
  countdownText,
  countdownAria,
  formatClock,
  openNowLabel,
  opensLabel,
} from "@/lib/chores/window-format";

const tz = "UTC";

describe("formatClock", () => {
  it("renders a 12-hour wall-clock time", () => {
    expect(formatClock(tz, new Date("2026-06-29T18:00:00Z"))).toBe("6:00 PM");
    expect(formatClock(tz, new Date("2026-06-29T09:05:00Z"))).toBe("9:05 AM");
  });
});

describe("countdownText", () => {
  it("formats days, hours, minutes", () => {
    expect(countdownText((2 * 1440 + 4 * 60) * 60_000)).toBe("2d 4h");
    expect(countdownText((2 * 60 + 14) * 60_000)).toBe("2h 14m");
    expect(countdownText(9 * 60_000)).toBe("9m");
    expect(countdownText(0)).toBe("now");
  });
});

describe("countdownAria", () => {
  it("spells out the units with correct pluralisation", () => {
    expect(countdownAria((1 * 1440 + 1 * 60) * 60_000)).toBe("1 day 1 hour");
    expect(countdownAria((2 * 60 + 14) * 60_000)).toBe("2 hours 14 minutes");
    expect(countdownAria(1 * 60_000)).toBe("1 minute");
  });
});

describe("opensLabel", () => {
  const now = new Date("2026-06-29T15:00:00Z"); // Monday
  it("says today when it opens later today", () => {
    expect(opensLabel(new Date("2026-06-29T18:00:00Z"), tz, now)).toBe(
      "Opens today at 6:00 PM",
    );
  });
  it("says tomorrow when it opens the next day", () => {
    expect(opensLabel(new Date("2026-06-30T07:00:00Z"), tz, now)).toBe(
      "Opens tomorrow at 7:00 AM",
    );
  });
  it("names the weekday when it's further out", () => {
    expect(opensLabel(new Date("2026-07-04T09:00:00Z"), tz, now)).toBe(
      "Opens Saturday at 9:00 AM",
    );
  });
});

describe("openNowLabel", () => {
  it("notes the closing time", () => {
    expect(openNowLabel(new Date("2026-06-29T20:00:00Z"), tz)).toBe(
      "Open now · closes 8:00 PM",
    );
  });
});
