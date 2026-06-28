/**
 * Chore-category helpers. Categories are now per-family rows in the
 * `chore_categories` table (see `lib/categories/service.ts`); the constant
 * below is just the starter set seeded for a brand-new family. Grouping and
 * labels read from each family's own categories, passed in by the caller.
 */

export interface DefaultCategory {
  name: string;
  icon: string;
}

/** The starter set every new family is seeded with (array order = display order). */
export const DEFAULT_CHORE_CATEGORIES: readonly DefaultCategory[] = [
  { name: "Bedroom", icon: "bed" },
  { name: "Bathroom", icon: "bath" },
  { name: "Kitchen", icon: "cook" },
  { name: "Around the home", icon: "tidy" },
  { name: "Outdoor", icon: "yard" },
  { name: "Pets", icon: "paw" },
  { name: "School", icon: "study" },
  { name: "Self-care", icon: "shower" },
  { name: "Other", icon: "sparkles" },
];

/** Minimal shape needed to render or group by a category (a `ChoreCategory` row fits). */
export interface CategoryMeta {
  id: string;
  name: string;
  icon: string;
}

/**
 * Group items that carry a `categoryId` into the family's category order,
 * dropping empty groups. Order within a group is preserved from the input.
 */
export function groupByCategory<T extends { categoryId: string }>(
  items: readonly T[],
  categories: readonly CategoryMeta[],
): { meta: CategoryMeta; items: T[] }[] {
  return categories
    .map((meta) => ({
      meta,
      items: items.filter((i) => i.categoryId === meta.id),
    }))
    .filter((g) => g.items.length > 0);
}
