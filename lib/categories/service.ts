import { and, asc, eq, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { choreCategories, chores, type ChoreCategory } from "@/lib/db/schema";
import { DEFAULT_CHORE_CATEGORIES } from "@/lib/catalog/category";

/**
 * Per-family chore categories. The `chore_categories` table is the source of
 * truth; chores reference a category by id. All functions take an explicit `db`
 * (testable with PGlite) and are scoped by `familyId`.
 */

/** Thrown when deleting a non-empty category without a place to move its chores. */
export class CategoryInUseError extends Error {}
/** Thrown when trying to remove a family's only remaining category. */
export class LastCategoryError extends Error {}

export interface CategoryInput {
  name: string;
  icon: string;
}

export type MoveDirection = "up" | "down";

/** Seed a new family with the default category set (call inside the register tx). */
export async function seedDefaultCategories(
  db: Database,
  familyId: string,
): Promise<void> {
  await db.insert(choreCategories).values(
    DEFAULT_CHORE_CATEGORIES.map((c, i) => ({
      familyId,
      name: c.name,
      icon: c.icon,
      sortOrder: i,
    })),
  );
}

export async function listCategories(
  db: Database,
  familyId: string,
): Promise<ChoreCategory[]> {
  return db
    .select()
    .from(choreCategories)
    .where(eq(choreCategories.familyId, familyId))
    .orderBy(asc(choreCategories.sortOrder), asc(choreCategories.createdAt));
}

export interface CategoryWithCount extends ChoreCategory {
  /** How many chores (active or hidden) currently sit in this category. */
  choreCount: number;
}

/** Categories with their chore counts, for the management screen. */
export async function listCategoriesWithCounts(
  db: Database,
  familyId: string,
): Promise<CategoryWithCount[]> {
  return db
    .select({
      id: choreCategories.id,
      familyId: choreCategories.familyId,
      name: choreCategories.name,
      icon: choreCategories.icon,
      sortOrder: choreCategories.sortOrder,
      createdAt: choreCategories.createdAt,
      choreCount: sql<number>`count(${chores.id})::int`,
    })
    .from(choreCategories)
    .leftJoin(chores, eq(chores.categoryId, choreCategories.id))
    .where(eq(choreCategories.familyId, familyId))
    .groupBy(choreCategories.id)
    .orderBy(asc(choreCategories.sortOrder), asc(choreCategories.createdAt));
}

export async function createCategory(
  db: Database,
  familyId: string,
  input: CategoryInput,
): Promise<ChoreCategory> {
  const existing = await listCategories(db, familyId);
  const [row] = await db
    .insert(choreCategories)
    .values({
      familyId,
      name: input.name.trim(),
      icon: input.icon,
      sortOrder: existing.length,
    })
    .returning();
  return row;
}

export async function updateCategory(
  db: Database,
  familyId: string,
  id: string,
  input: CategoryInput,
): Promise<void> {
  await db
    .update(choreCategories)
    .set({ name: input.name.trim(), icon: input.icon })
    .where(
      and(eq(choreCategories.familyId, familyId), eq(choreCategories.id, id)),
    );
}

export async function moveCategory(
  db: Database,
  familyId: string,
  id: string,
  direction: MoveDirection,
): Promise<void> {
  const items = await listCategories(db, familyId);
  const idx = items.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;

  const a = items[idx];
  const b = items[swapIdx];
  await db.transaction(async (tx) => {
    await tx
      .update(choreCategories)
      .set({ sortOrder: b.sortOrder })
      .where(
        and(
          eq(choreCategories.familyId, familyId),
          eq(choreCategories.id, a.id),
        ),
      );
    await tx
      .update(choreCategories)
      .set({ sortOrder: a.sortOrder })
      .where(
        and(
          eq(choreCategories.familyId, familyId),
          eq(choreCategories.id, b.id),
        ),
      );
  });
}

/** Number of chores currently assigned to a category. */
async function choreCountFor(
  db: Database,
  familyId: string,
  categoryId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chores)
    .where(
      and(eq(chores.familyId, familyId), eq(chores.categoryId, categoryId)),
    );
  return row?.count ?? 0;
}

/**
 * Delete a category. If chores still use it, they are moved to `reassignToId`
 * (which must be another category in this family) in the same transaction.
 * Throws {@link LastCategoryError} for a family's only category, and
 * {@link CategoryInUseError} when it's non-empty and no valid target is given.
 */
export async function deleteCategory(
  db: Database,
  familyId: string,
  id: string,
  reassignToId?: string,
): Promise<void> {
  const items = await listCategories(db, familyId);
  if (!items.some((c) => c.id === id)) return;
  if (items.length <= 1) {
    throw new LastCategoryError("A family needs at least one category.");
  }

  const count = await choreCountFor(db, familyId, id);
  if (count === 0) {
    await db
      .delete(choreCategories)
      .where(
        and(eq(choreCategories.familyId, familyId), eq(choreCategories.id, id)),
      );
    return;
  }

  const validTarget =
    reassignToId &&
    reassignToId !== id &&
    items.some((c) => c.id === reassignToId);
  if (!validTarget) {
    throw new CategoryInUseError(
      "Choose another category to move these chores to.",
    );
  }

  await db.transaction(async (tx) => {
    await tx
      .update(chores)
      .set({ categoryId: reassignToId })
      .where(and(eq(chores.familyId, familyId), eq(chores.categoryId, id)));
    await tx
      .delete(choreCategories)
      .where(
        and(eq(choreCategories.familyId, familyId), eq(choreCategories.id, id)),
      );
  });
}
