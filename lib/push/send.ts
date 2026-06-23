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

/** Push is a graceful no-op until the VAPID keys are configured. */
export function isPushConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    env.VAPID_PRIVATE_KEY &&
    env.VAPID_SUBJECT,
  );
}

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return false;
  webpush.setVapidDetails(subject, pub, priv);
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
