"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireParent } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation/schemas";
import { toFieldErrors, type FormState } from "@/lib/validation/form";
import {
  createCategory,
  updateCategory,
  moveCategory,
  deleteCategory,
  CategoryInUseError,
  LastCategoryError,
  type MoveDirection,
} from "@/lib/categories/service";

const idSchema = z.string().uuid();
const directionSchema = z.enum(["up", "down"]);

/** Categories drive grouping on the chores, award, and submit screens. */
function revalidateCategories() {
  revalidatePath("/manage/categories");
  revalidatePath("/manage/chores");
  revalidatePath("/manage/chores/new");
}

function parseCategory(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon"),
  });
}

export async function createCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const parsed = parseCategory(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  await createCategory(getDb(), session.familyId, parsed.data);
  revalidateCategories();
  return { ok: true };
}

export type InlineCategoryResult =
  | { ok: true; category: { id: string; name: string } }
  | { ok: false; error: string };

/**
 * Create a category from inside the chore editor (issue #182), without leaving
 * the page, so a half-filled chore isn't lost. Returns the new row so the
 * editor can add it to its select and pick it.
 */
export async function createCategoryInlineAction(
  name: string,
): Promise<InlineCategoryResult> {
  const session = await requireParent();
  const parsed = categorySchema.safeParse({ name, icon: "sparkles" });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Enter a category name.",
    };
  }
  const row = await createCategory(getDb(), session.familyId, parsed.data);
  revalidateCategories();
  return { ok: true, category: { id: row.id, name: row.name } };
}

export async function updateCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Could not find that category." };
  const parsed = parseCategory(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  await updateCategory(getDb(), session.familyId, id.data, parsed.data);
  revalidateCategories();
  return { ok: true };
}

export async function moveCategoryAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("id"));
  const direction = directionSchema.safeParse(formData.get("direction"));
  if (!id.success || !direction.success) return;

  const dir: MoveDirection = direction.data;
  await moveCategory(getDb(), session.familyId, id.data, dir);
  revalidateCategories();
}

export async function deleteCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { error: "Could not find that category." };
  const rawTarget = formData.get("reassignTo");
  const reassignTo =
    typeof rawTarget === "string" && idSchema.safeParse(rawTarget).success
      ? rawTarget
      : undefined;

  try {
    await deleteCategory(getDb(), session.familyId, id.data, reassignTo);
  } catch (err) {
    if (err instanceof LastCategoryError) {
      return {
        error: "Keep at least one category — families always need one.",
      };
    }
    if (err instanceof CategoryInUseError) {
      return { error: "Choose where to move this category's chores first." };
    }
    return { error: "Could not delete that category. Please try again." };
  }
  revalidateCategories();
  return { ok: true };
}
