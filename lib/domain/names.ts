/**
 * Pure name-list formatting for recipient copy ("Award points to Robin and
 * Andy"). No I/O — unit tested.
 */

/**
 * Join names for a sentence: `Robin`, `Robin and Andy`,
 * `Robin, Andy and Sky` — and beyond `max` names the count instead
 * (`4 kids`), so buttons and hints stay short on mobile.
 */
export function formatNameList(names: readonly string[], max = 3): string {
  const list = names.filter((n) => n.trim().length > 0);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length > max) return `${list.length} kids`;
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}
