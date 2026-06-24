/**
 * Chore category metadata (pure — safe in client components). `icon` values are
 * keys in the shared icon registry, used for the section header glyphs.
 */
import type { ChoreCategory } from "@/lib/db/schema";

export interface CategoryMeta {
  key: ChoreCategory;
  label: string;
  icon: string;
}

export const CHORE_CATEGORIES: readonly CategoryMeta[] = [
  { key: "bedroom", label: "Bedroom", icon: "bed" },
  { key: "bathroom", label: "Bathroom", icon: "bath" },
  { key: "kitchen", label: "Kitchen", icon: "cook" },
  { key: "home", label: "Around the home", icon: "tidy" },
  { key: "outdoor", label: "Outdoor", icon: "yard" },
  { key: "pets", label: "Pets", icon: "paw" },
  { key: "school", label: "School", icon: "study" },
  { key: "selfcare", label: "Self-care", icon: "shower" },
  { key: "other", label: "Other", icon: "sparkles" },
];

export const CHORE_CATEGORY_KEYS: readonly ChoreCategory[] =
  CHORE_CATEGORIES.map((c) => c.key);

const BY_KEY = new Map(CHORE_CATEGORIES.map((c) => [c.key, c]));

export function categoryLabel(key: string): string {
  return BY_KEY.get(key as ChoreCategory)?.label ?? "Other";
}

export function categoryIcon(key: string): string {
  return BY_KEY.get(key as ChoreCategory)?.icon ?? "sparkles";
}

/**
 * Group items that carry a `category` into category order, dropping empty
 * groups. Order within a group is preserved from the input.
 */
export function groupByCategory<T extends { category: string }>(
  items: readonly T[],
): { meta: CategoryMeta; items: T[] }[] {
  return CHORE_CATEGORIES.map((meta) => ({
    meta,
    items: items.filter((i) => i.category === meta.key),
  })).filter((g) => g.items.length > 0);
}
