"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireParent } from "@/lib/auth/session";
import { addKid, updateKid, setPin, setKidActive } from "@/lib/people/service";
import {
  addKidSchema,
  updateKidSchema,
  pinSchema,
} from "@/lib/validation/schemas";
import { toFieldErrors, type FormState } from "@/lib/validation/form";

const MANAGE_PATH = "/manage/kids";
const idSchema = z.string().uuid();

export async function addKidAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const parsed = addKidSchema.safeParse({
    name: formData.get("name"),
    avatar: formData.get("avatar"),
    color: formData.get("color"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  await addKid(getDb(), session.familyId, parsed.data);
  revalidatePath(MANAGE_PATH);
  return { ok: true };
}

export async function updateKidAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("kidId"));
  const parsed = updateKidSchema.safeParse({
    name: formData.get("name"),
    avatar: formData.get("avatar"),
    color: formData.get("color"),
  });
  if (!id.success) return { error: "Could not find that child." };
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  await updateKid(getDb(), session.familyId, id.data, parsed.data);
  revalidatePath(MANAGE_PATH);
  return { ok: true };
}

export async function setKidPinAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("kidId"));
  const pin = pinSchema.safeParse(formData.get("pin"));
  if (!id.success) return { error: "Could not find that child." };
  if (!pin.success)
    return { fieldErrors: { pin: pin.error.issues[0].message } };

  await setPin(getDb(), session.familyId, id.data, pin.data);
  revalidatePath(MANAGE_PATH);
  return { ok: true };
}

/** Direct form action (no UI state) for the active/inactive toggle. */
export async function toggleKidActiveAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("kidId"));
  if (!id.success) return;
  const isActive = formData.get("isActive") === "true";
  await setKidActive(getDb(), session.familyId, id.data, isActive);
  revalidatePath(MANAGE_PATH);
}
