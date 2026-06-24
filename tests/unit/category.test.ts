import { describe, it, expect } from "vitest";
import {
  CHORE_CATEGORIES,
  categoryLabel,
  categoryIcon,
  groupByCategory,
} from "@/lib/catalog/category";
import { addDays } from "@/lib/timezone";

describe("chore categories", () => {
  it("labels and icons fall back to Other for unknown keys", () => {
    expect(categoryLabel("pets")).toBe("Pets");
    expect(categoryLabel("nonsense")).toBe("Other");
    expect(categoryIcon("nonsense")).toBe("sparkles");
  });

  it("groups items in category order, dropping empties", () => {
    const items = [
      { id: "1", category: "pets" },
      { id: "2", category: "bedroom" },
      { id: "3", category: "pets" },
    ];
    const groups = groupByCategory(items);
    // bedroom precedes pets in CHORE_CATEGORIES order.
    expect(groups.map((g) => g.meta.key)).toEqual(["bedroom", "pets"]);
    expect(groups[1].items.map((i) => i.id)).toEqual(["1", "3"]);
    // every category key is real.
    const keys = new Set(CHORE_CATEGORIES.map((c) => c.key));
    expect(keys.has("other")).toBe(true);
  });
});

describe("addDays", () => {
  it("shifts a date string by whole days (DST-safe)", () => {
    expect(addDays("2026-03-01", 1)).toBe("2026-03-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});
