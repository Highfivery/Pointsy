import { describe, it, expect } from "vitest";
import { lockedLast } from "@/lib/submissions/service";

type Item = { id: string; windowState: "open" | "locked" };

describe("lockedLast", () => {
  it("sinks time-locked items below available ones, stably", () => {
    const items: Item[] = [
      { id: "a", windowState: "locked" },
      { id: "b", windowState: "open" },
      { id: "c", windowState: "locked" },
      { id: "d", windowState: "open" },
    ];
    expect(
      items
        .slice()
        .sort(lockedLast)
        .map((i) => i.id),
    ).toEqual([
      "b",
      "d", // open ones keep their relative order
      "a",
      "c", // locked ones keep their relative order
    ]);
  });

  it("is a no-op when nothing is locked", () => {
    const items: Item[] = [
      { id: "a", windowState: "open" },
      { id: "b", windowState: "open" },
    ];
    expect(
      items
        .slice()
        .sort(lockedLast)
        .map((i) => i.id),
    ).toEqual(["a", "b"]);
  });
});
