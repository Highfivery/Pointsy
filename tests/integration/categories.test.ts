import { describe, it, expect, beforeEach } from "vitest";
import { registerFamily } from "@/lib/auth/register";
import {
  listCategories,
  listCategoriesWithCounts,
  createCategory,
  updateCategory,
  moveCategory,
  deleteCategory,
  CategoryInUseError,
  LastCategoryError,
} from "@/lib/categories/service";
import { createChore, listChores, getChore } from "@/lib/catalog/service";
import { DEFAULT_CHORE_CATEGORIES } from "@/lib/catalog/category";
import { createTestDb, type TestDb } from "../helpers/test-db";

async function setup(db: TestDb["db"], familyName = "Fam") {
  const fam = await registerFamily(db, {
    familyName,
    parentName: "Parent",
    email: `p.${familyName}.${Math.random()}@example.com`,
    password: "supersecret1",
  });
  return fam;
}

describe("chore categories service", () => {
  let ctx: TestDb;
  beforeEach(async () => {
    ctx = await createTestDb();
  });

  it("seeds a new family with the default category set in order", async () => {
    const { db } = ctx;
    const fam = await setup(db);
    const cats = await listCategories(db, fam.familyId);
    expect(cats.map((c) => c.name)).toEqual(
      DEFAULT_CHORE_CATEGORIES.map((c) => c.name),
    );
    expect(cats.map((c) => c.sortOrder)).toEqual(
      DEFAULT_CHORE_CATEGORIES.map((_, i) => i),
    );
  });

  it("creates, renames, and reorders categories", async () => {
    const { db } = ctx;
    const fam = await setup(db);
    const before = await listCategories(db, fam.familyId);

    const created = await createCategory(db, fam.familyId, {
      name: "Garage",
      icon: "wrench",
    });
    expect(created.sortOrder).toBe(before.length); // appended last

    await updateCategory(db, fam.familyId, created.id, {
      name: "The Garage",
      icon: "car",
    });

    // Move it up one and confirm the swap with its previous neighbour.
    const list = await listCategories(db, fam.familyId);
    const lastTwo = list.slice(-2).map((c) => c.name);
    await moveCategory(db, fam.familyId, created.id, "up");
    const moved = await listCategories(db, fam.familyId);
    expect(moved.slice(-2).map((c) => c.name)).toEqual([
      "The Garage",
      lastTwo[0],
    ]);
  });

  it("reports chore counts per category", async () => {
    const { db } = ctx;
    const fam = await setup(db);
    const cats = await listCategories(db, fam.familyId);
    const pets = cats.find((c) => c.name === "Pets")!;

    await createChore(db, fam.familyId, {
      name: "Walk dog",
      emoji: "paw",
      points: 3,
      categoryId: pets.id,
    });
    await createChore(db, fam.familyId, {
      name: "Feed cat",
      emoji: "cat",
      points: 2,
      categoryId: pets.id,
    });

    const counts = await listCategoriesWithCounts(db, fam.familyId);
    expect(counts.find((c) => c.id === pets.id)?.choreCount).toBe(2);
    expect(counts.find((c) => c.name === "Bedroom")?.choreCount).toBe(0);
  });

  it("keeps categories isolated per family", async () => {
    const { db } = ctx;
    const a = await setup(db, "A");
    const b = await setup(db, "B");
    const aCats = await listCategories(db, a.familyId);
    const aPets = aCats.find((c) => c.name === "Pets")!;

    // B cannot rename or delete A's category.
    await updateCategory(db, b.familyId, aPets.id, {
      name: "Hacked",
      icon: "skull",
    });
    expect(
      (await listCategories(db, a.familyId)).find((c) => c.id === aPets.id)
        ?.name,
    ).toBe("Pets");

    await deleteCategory(db, b.familyId, aPets.id);
    expect(
      (await listCategories(db, a.familyId)).some((c) => c.id === aPets.id),
    ).toBe(true);
  });

  it("deletes an empty category but refuses the last one", async () => {
    const { db } = ctx;
    const fam = await setup(db);
    const cats = await listCategories(db, fam.familyId);
    const before = cats.length;

    await deleteCategory(db, fam.familyId, cats[0].id);
    expect(await listCategories(db, fam.familyId)).toHaveLength(before - 1);

    // Reduce to a single category, then the last delete is blocked.
    const remaining = await listCategories(db, fam.familyId);
    for (const c of remaining.slice(1)) {
      await deleteCategory(db, fam.familyId, c.id);
    }
    const [only] = await listCategories(db, fam.familyId);
    await expect(deleteCategory(db, fam.familyId, only.id)).rejects.toThrow(
      LastCategoryError,
    );
  });

  it("reassigns chores when deleting a non-empty category", async () => {
    const { db } = ctx;
    const fam = await setup(db);
    const cats = await listCategories(db, fam.familyId);
    const pets = cats.find((c) => c.name === "Pets")!;
    const home = cats.find((c) => c.name === "Around the home")!;

    const chore = await createChore(db, fam.familyId, {
      name: "Walk dog",
      emoji: "paw",
      points: 3,
      categoryId: pets.id,
    });

    // Without a target, a non-empty delete is refused.
    await expect(deleteCategory(db, fam.familyId, pets.id)).rejects.toThrow(
      CategoryInUseError,
    );

    // With a target, the chore is moved and the category removed atomically.
    await deleteCategory(db, fam.familyId, pets.id, home.id);
    expect(
      (await listCategories(db, fam.familyId)).some((c) => c.id === pets.id),
    ).toBe(false);
    expect((await getChore(db, fam.familyId, chore.id))?.categoryId).toBe(
      home.id,
    );
    // No chores were orphaned.
    expect((await listChores(db, fam.familyId)).length).toBe(1);
  });
});
