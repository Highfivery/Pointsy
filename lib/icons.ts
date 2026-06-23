/**
 * Icon keys used for kid avatars and chore/reward icons. Stored as short
 * strings in the `people.avatar` and `chores.emoji` / `rewards.emoji` columns
 * and rendered via the Lucide registry in `components/icons/registry`.
 *
 * This module is pure data (no React/lucide) so it can be imported by
 * validation without bloating server bundles.
 */

export const AVATAR_ICON_KEYS = [
  "person",
  "smile",
  "cat",
  "dog",
  "rabbit",
  "bird",
  "fish",
  "paw",
  "rocket",
  "star",
  "heart",
  "crown",
  "ghost",
  "bug",
  "sun",
  "moon",
  "zap",
  "music",
  "sparkles",
  "apple",
  "flower",
] as const;

export const CHORE_ICON_KEYS = [
  "bed",
  "dishes",
  "trash",
  "book",
  "laundry",
  "car",
  "backpack",
  "homework",
  "plants",
  "yard",
  "alarm",
  "clean",
  "bath",
  "exercise",
  "pet",
  "star",
] as const;

export const REWARD_ICON_KEYS = [
  "gift",
  "tv",
  "icecream",
  "game",
  "candy",
  "ticket",
  "coins",
  "trophy",
  "bike",
  "popcorn",
  "movie",
  "party",
  "pizza",
  "cookie",
  "tent",
  "medal",
] as const;

export const DEFAULT_AVATAR_ICON = "smile";
/** Parents default to a neutral person icon (they don't pick an avatar). */
export const DEFAULT_PARENT_AVATAR_ICON = "person";
export const DEFAULT_CHORE_ICON = "star";
export const DEFAULT_REWARD_ICON = "gift";

/** All distinct keys across every set. */
export const ALL_ICON_KEYS: readonly string[] = Array.from(
  new Set([...AVATAR_ICON_KEYS, ...CHORE_ICON_KEYS, ...REWARD_ICON_KEYS]),
);

export function isIconKey(value: unknown): value is string {
  return typeof value === "string" && ALL_ICON_KEYS.includes(value);
}
