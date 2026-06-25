"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireParent } from "@/lib/auth/session";
import { choreSchema, rewardSchema } from "@/lib/validation/schemas";
import { toFieldErrors, type FormState } from "@/lib/validation/form";
import {
  createChore,
  updateChore,
  toggleChoreActive,
  setChorePinned,
  deleteChore,
  moveChore,
  createReward,
  updateReward,
  toggleRewardActive,
  deleteReward,
  moveReward,
  type MoveDirection,
} from "@/lib/catalog/service";

const idSchema = z.string().uuid();
const kindSchema = z.enum(["chore", "reward"]);
const directionSchema = z.enum(["up", "down"]);
const PATHS = { chore: "/manage/chores", reward: "/manage/rewards" } as const;

function parseChore(formData: FormData) {
  return choreSchema.safeParse({
    name: formData.get("name"),
    emoji: formData.get("emoji"),
    points: formData.get("points"),
    category: formData.get("category") ?? "other",
    description: formData.get("description") || undefined,
    isCore: formData.get("isCore"),
    assignment: formData.get("assignment") ?? "everyone",
    kidIds: formData.getAll("kidIds"),
    subtasks: formData.getAll("subtasks"),
    limitPeriod: formData.get("limitPeriod") ?? "none",
    limitCount: formData.get("limitCount") ?? 1,
  });
}

/** Create or update a chore from the full-page editor, then return to the list. */
export async function saveChoreAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const parsed = parseChore(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const rawId = formData.get("id");
  if (typeof rawId === "string" && rawId.length > 0) {
    const id = idSchema.safeParse(rawId);
    if (!id.success) return { error: "Could not find that chore." };
    await updateChore(getDb(), session.familyId, id.data, parsed.data);
  } else {
    await createChore(getDb(), session.familyId, parsed.data);
  }
  revalidatePath("/manage/chores");
  redirect("/manage/chores");
}

/** Hide/show a chore from the editor (stays on the page). */
export async function setChoreHiddenAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await toggleChoreActive(
    getDb(),
    session.familyId,
    id.data,
    formData.get("isActive") === "true",
  );
  revalidatePath("/manage/chores");
}

/** Delete a chore from the editor, then return to the list. */
export async function deleteChoreAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("id"));
  if (id.success) {
    await deleteChore(getDb(), session.familyId, id.data);
    revalidatePath("/manage/chores");
  }
  redirect("/manage/chores");
}

/** Pin/unpin a chore so it surfaces first on the award screen. */
export async function toggleChorePinnedAction(
  formData: FormData,
): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await setChorePinned(
    getDb(),
    session.familyId,
    id.data,
    formData.get("pinned") === "true",
  );
  revalidatePath("/manage/chores");
}

function parseReward(formData: FormData) {
  return rewardSchema.safeParse({
    name: formData.get("name"),
    emoji: formData.get("emoji"),
    cost: formData.get("cost"),
    description: formData.get("description") || undefined,
    isTeam: formData.get("isTeam") ?? false,
    minKids: formData.get("minKids") ?? 2,
    allowSolo: formData.get("allowSolo") ?? false,
  });
}

export async function createCatalogItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const kind = kindSchema.safeParse(formData.get("kind"));
  if (!kind.success) return { error: "Unknown item type." };

  if (kind.data === "chore") {
    const parsed = parseChore(formData);
    if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
    await createChore(getDb(), session.familyId, parsed.data);
  } else {
    const parsed = parseReward(formData);
    if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
    await createReward(getDb(), session.familyId, parsed.data);
  }
  revalidatePath(PATHS[kind.data]);
  return { ok: true };
}

export async function updateCatalogItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const kind = kindSchema.safeParse(formData.get("kind"));
  const id = idSchema.safeParse(formData.get("id"));
  if (!kind.success) return { error: "Unknown item type." };
  if (!id.success) return { error: "Could not find that item." };

  if (kind.data === "chore") {
    const parsed = parseChore(formData);
    if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
    await updateChore(getDb(), session.familyId, id.data, parsed.data);
  } else {
    const parsed = parseReward(formData);
    if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
    await updateReward(getDb(), session.familyId, id.data, parsed.data);
  }
  revalidatePath(PATHS[kind.data]);
  return { ok: true };
}

export async function toggleCatalogItemActiveAction(
  formData: FormData,
): Promise<void> {
  const session = await requireParent();
  const kind = kindSchema.safeParse(formData.get("kind"));
  const id = idSchema.safeParse(formData.get("id"));
  if (!kind.success || !id.success) return;
  const isActive = formData.get("isActive") === "true";

  if (kind.data === "chore") {
    await toggleChoreActive(getDb(), session.familyId, id.data, isActive);
  } else {
    await toggleRewardActive(getDb(), session.familyId, id.data, isActive);
  }
  revalidatePath(PATHS[kind.data]);
}

export async function moveCatalogItemAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const kind = kindSchema.safeParse(formData.get("kind"));
  const id = idSchema.safeParse(formData.get("id"));
  const direction = directionSchema.safeParse(formData.get("direction"));
  if (!kind.success || !id.success || !direction.success) return;

  const dir: MoveDirection = direction.data;
  if (kind.data === "chore") {
    await moveChore(getDb(), session.familyId, id.data, dir);
  } else {
    await moveReward(getDb(), session.familyId, id.data, dir);
  }
  revalidatePath(PATHS[kind.data]);
}

export async function deleteCatalogItemAction(
  formData: FormData,
): Promise<void> {
  const session = await requireParent();
  const kind = kindSchema.safeParse(formData.get("kind"));
  const id = idSchema.safeParse(formData.get("id"));
  if (!kind.success || !id.success) return;

  if (kind.data === "chore") {
    await deleteChore(getDb(), session.familyId, id.data);
  } else {
    await deleteReward(getDb(), session.familyId, id.data);
  }
  revalidatePath(PATHS[kind.data]);
}
