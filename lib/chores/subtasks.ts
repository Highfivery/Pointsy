import { asc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { choreSubtasks } from "@/lib/db/schema";

/** A chore's checklist titles, in order. */
export async function getSubtasks(
  db: Database,
  choreId: string,
): Promise<string[]> {
  const rows = await db
    .select({ title: choreSubtasks.title })
    .from(choreSubtasks)
    .where(eq(choreSubtasks.choreId, choreId))
    .orderBy(asc(choreSubtasks.position));
  return rows.map((r) => r.title);
}

/** Checklist titles for many chores at once, keyed by chore id. */
export async function getSubtasksByChore(
  db: Database,
  choreIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (choreIds.length === 0) return map;
  const rows = await db
    .select({ choreId: choreSubtasks.choreId, title: choreSubtasks.title })
    .from(choreSubtasks)
    .where(inArray(choreSubtasks.choreId, choreIds))
    .orderBy(asc(choreSubtasks.position));
  for (const r of rows) {
    const list = map.get(r.choreId) ?? [];
    list.push(r.title);
    map.set(r.choreId, list);
  }
  return map;
}

/** Replace a chore's checklist with `titles` (blank lines are dropped). */
export async function replaceSubtasks(
  db: Database,
  choreId: string,
  titles: string[],
): Promise<void> {
  await db.delete(choreSubtasks).where(eq(choreSubtasks.choreId, choreId));
  const clean = titles.map((t) => t.trim()).filter(Boolean);
  if (clean.length > 0) {
    await db
      .insert(choreSubtasks)
      .values(clean.map((title, position) => ({ choreId, title, position })));
  }
}
