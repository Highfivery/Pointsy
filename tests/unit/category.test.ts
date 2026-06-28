import { describe, it, expect } from "vitest";
import {
  DEFAULT_CHORE_CATEGORIES,
  groupByCategory,
  type CategoryMeta,
} from "@/lib/catalog/category";
import { addDays } from "@/lib/timezone";

describe("chore categories", () => {
  it("ships a non-empty default starter set with an 'Other' catch-all", () => {
    expect(DEFAULT_CHORE_CATEGORIES.length).toBeGreaterThan(0);
    expect(DEFAULT_CHORE_CATEGORIES.some((c) => c.name === "Other")).toBe(true);
    // Every default carries an icon key for the section glyph.
    expect(DEFAULT_CHORE_CATEGORIES.every((c) => c.icon.length > 0)).toBe(true);
  });

  it("groups items into the family's category order, dropping empties", () => {
    const categories: CategoryMeta[] = [
      { id: "bed", name: "Bedroom", icon: "bed" },
      { id: "pets", name: "Pets", icon: "paw" },
      { id: "yard", name: "Outdoor", icon: "yard" }, // no items → dropped
    ];
    const items = [
      { id: "1", categoryId: "pets" },
      { id: "2", categoryId: "bed" },
      { id: "3", categoryId: "pets" },
    ];
    const groups = groupByCategory(items, categories);
    // Order follows the categories list, and the empty Outdoor group is dropped.
    expect(groups.map((g) => g.meta.id)).toEqual(["bed", "pets"]);
    expect(groups[1].items.map((i) => i.id)).toEqual(["1", "3"]);
  });
});

describe("addDays", () => {
  it("shifts a date string by whole days (DST-safe)", () => {
    expect(addDays("2026-03-01", 1)).toBe("2026-03-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});
