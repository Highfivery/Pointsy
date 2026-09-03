import { describe, it, expect } from "vitest";
import { formatNameList } from "@/lib/domain/names";

describe("formatNameList", () => {
  it("names one or two recipients in full", () => {
    expect(formatNameList(["Robin"])).toBe("Robin");
    expect(formatNameList(["Robin", "Andy"])).toBe("Robin and Andy");
  });

  it("lists up to three, then falls back to a count to stay short", () => {
    expect(formatNameList(["Robin", "Andy", "Sky"])).toBe(
      "Robin, Andy and Sky",
    );
    expect(formatNameList(["Robin", "Andy", "Sky", "Kit"])).toBe("4 kids");
    expect(formatNameList(["Robin", "Andy", "Sky"], 2)).toBe("3 kids");
  });

  it("ignores blank names and handles an empty list", () => {
    expect(formatNameList([])).toBe("");
    expect(formatNameList(["Robin", "  "])).toBe("Robin");
    expect(formatNameList(["   "])).toBe("");
  });
});
