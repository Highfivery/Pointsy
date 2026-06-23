"use server";

import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import {
  saveSubscription,
  deleteSubscriptionByEndpoint,
} from "@/lib/push/service";

const subSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export async function subscribePushAction(
  input: unknown,
): Promise<{ ok: boolean }> {
  const session = await requireSession();
  const parsed = subSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  await saveSubscription(
    getDb(),
    session.familyId,
    session.personId,
    parsed.data,
  );
  return { ok: true };
}

export async function unsubscribePushAction(
  endpoint: unknown,
): Promise<{ ok: boolean }> {
  await requireSession();
  const parsed = z.string().url().safeParse(endpoint);
  if (!parsed.success) return { ok: false };

  await deleteSubscriptionByEndpoint(getDb(), parsed.data);
  return { ok: true };
}
