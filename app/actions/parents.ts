"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireParent, createSession } from "@/lib/auth/session";
import { rememberFamily } from "@/lib/auth/device";
import { EmailTakenError } from "@/lib/auth/register";
import {
  createParentInvite,
  revokeParentInvite,
  removeParent,
  redeemParentInvite,
  NotOwnerError,
  CannotRemoveParentError,
  InviteInvalidError,
} from "@/lib/parents/service";
import { joinFamilySchema } from "@/lib/validation/schemas";
import { toFieldErrors, type FormState } from "@/lib/validation/form";

const idSchema = z.string().uuid();

export interface InviteState {
  code?: string;
  expiresAt?: string;
  error?: string;
}

/** Any parent can create a one-time invite code (shown once). */
export async function createParentInviteAction(): Promise<InviteState> {
  const session = await requireParent();
  const { code, expiresAt } = await createParentInvite(
    getDb(),
    session.familyId,
    session.personId,
  );
  revalidatePath("/manage/parents");
  return { code, expiresAt: expiresAt.toISOString() };
}

export async function revokeParentInviteAction(
  formData: FormData,
): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("inviteId"));
  if (!id.success) return;
  await revokeParentInvite(getDb(), session.familyId, id.data);
  revalidatePath("/manage/parents");
}

/** Deactivate a co-parent. Owner-only; guard errors surface as a message. */
export async function removeParentAction(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("parentId"));
  if (!id.success) return { error: "Something went wrong." };
  try {
    await removeParent(getDb(), session.familyId, session.personId, id.data);
  } catch (err) {
    if (
      err instanceof NotOwnerError ||
      err instanceof CannotRemoveParentError
    ) {
      return { error: err.message };
    }
    throw err;
  }
  revalidatePath("/manage/parents");
  return {};
}

/** Public: a co-parent redeems an invite by creating their own login. */
export async function joinFamilyAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = joinFamilySchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    const result = await redeemParentInvite(getDb(), {
      code: parsed.data.code,
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    await createSession({
      familyId: result.familyId,
      personId: result.personId,
      role: "parent",
    });
    await rememberFamily(result.familyId);
  } catch (err) {
    if (err instanceof InviteInvalidError) {
      return { fieldErrors: { code: err.message } };
    }
    if (err instanceof EmailTakenError) {
      return { fieldErrors: { email: err.message } };
    }
    throw err;
  }

  // Outside try/catch: redirect() throws a control-flow signal by design.
  redirect("/dashboard");
}
