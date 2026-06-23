"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import { getDb } from "@/lib/db/client";
import { createSession, destroySession } from "@/lib/auth/session";
import {
  registerFamily,
  authenticateParent,
  EmailTakenError,
} from "@/lib/auth/register";
import { signUpSchema, signInSchema } from "@/lib/validation/schemas";

export interface AuthState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    familyName: formData.get("familyName"),
    parentName: formData.get("parentName"),
    email: formData.get("email"),
    password: formData.get("password"),
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    const result = await registerFamily(getDb(), parsed.data);
    await createSession({
      familyId: result.familyId,
      personId: result.personId,
      role: "parent",
    });
  } catch (err) {
    if (err instanceof EmailTakenError) {
      return { fieldErrors: { email: err.message } };
    }
    throw err;
  }

  // Outside try/catch: redirect() throws a control-flow signal by design.
  redirect("/dashboard");
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const parent = await authenticateParent(
    getDb(),
    parsed.data.email,
    parsed.data.password,
  );
  if (!parent) return { error: "Incorrect email or password." };

  await createSession({
    familyId: parent.familyId,
    personId: parent.id,
    role: "parent",
  });
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
