import "server-only";
import webpush from "web-push";
import { env } from "@/lib/env";
import type { Database } from "@/lib/db/types";
import {
  deleteSubscriptionByEndpoint,
  listSubscriptionsForParents,
  listSubscriptionsForPerson,
  type SendableSubscription,
} from "./service";

/** Push is a graceful no-op until the VAPID keypair is configured. */
export function isPushConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

/**
 * VAPID requires a contact "subject" (a URL/mailto sent to the browser's push
 * service). It's an operator contact, not user data, so we derive it from the
 * deployment URL automatically — nothing for the operator to configure, and no
 * personal address baked in. `VAPID_SUBJECT` can override it if ever needed.
 */
function vapidSubject(): string {
  if (env.VAPID_SUBJECT) return env.VAPID_SUBJECT;
  const url = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return url ? `https://${url}` : "https://pointsy.app";
}

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(vapidSubject(), pub, priv);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

async function sendToSubscriptions(
  db: Database,
  subs: SendableSubscription[],
  payload: PushPayload,
): Promise<void> {
  if (subs.length === 0 || !ensureConfigured()) return;
  const data = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await deleteSubscriptionByEndpoint(db, s.endpoint);
        }
      }
    }),
  );
}

/** Best-effort notify a single person. Never throws. */
export async function notifyPerson(
  db: Database,
  familyId: string,
  personId: string,
  payload: PushPayload,
): Promise<void> {
  if (!isPushConfigured()) return;
  try {
    const subs = await listSubscriptionsForPerson(db, familyId, personId);
    await sendToSubscriptions(db, subs, payload);
  } catch {
    /* push is best-effort */
  }
}

/** Best-effort notify all parents in a family. Never throws. */
export async function notifyParents(
  db: Database,
  familyId: string,
  payload: PushPayload,
): Promise<void> {
  if (!isPushConfigured()) return;
  try {
    const subs = await listSubscriptionsForParents(db, familyId);
    await sendToSubscriptions(db, subs, payload);
  } catch {
    /* push is best-effort */
  }
}
