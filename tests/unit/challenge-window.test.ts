import { describe, it, expect } from "vitest";
import { currentWindow } from "@/lib/challenges/service";

const span = (recurrence: "none" | "weekly") => ({
  startsOn: "2026-03-01",
  endsOn: "2026-03-31",
  recurrence,
});

describe("currentWindow", () => {
  it("one-off → the whole span with an empty key", () => {
    expect(currentWindow(span("none"), "2026-03-15")).toEqual({
      start: "2026-03-01",
      end: "2026-03-31",
      key: "",
    });
  });

  it("returns null when today is outside the span", () => {
    expect(currentWindow(span("none"), "2026-04-01")).toBeNull();
    expect(currentWindow(span("weekly"), "2026-02-28")).toBeNull();
  });

  it("weekly → the Mon–Sun week containing today, keyed by week start", () => {
    // 2026-03-04 is a Wednesday; its week is Mon 03-02 … Sun 03-08.
    expect(currentWindow(span("weekly"), "2026-03-04")).toEqual({
      start: "2026-03-02",
      end: "2026-03-08",
      key: "2026-03-02",
    });
  });

  it("weekly → clamps the window to the challenge span", () => {
    const tight = {
      startsOn: "2026-03-04",
      endsOn: "2026-03-06",
      recurrence: "weekly" as const,
    };
    expect(currentWindow(tight, "2026-03-04")).toEqual({
      start: "2026-03-04", // clamped up from Mon 03-02
      end: "2026-03-06", // clamped down from Sun 03-08
      key: "2026-03-02",
    });
  });

  it("weekly → different weeks get different keys", () => {
    const a = currentWindow(span("weekly"), "2026-03-04");
    const b = currentWindow(span("weekly"), "2026-03-11");
    expect(a?.key).toBe("2026-03-02");
    expect(b?.key).toBe("2026-03-09");
  });
});
