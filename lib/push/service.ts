import { and, eq } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { pushSubscriptions, people } from "@/lib/db/schema";

export interface SendableSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Upsert a Web Push subscription for a person (keyed by endpoint). */
export async function saveSubscription(
  db: Database,
  familyId: string,
  personId: string,
  sub: SendableSubscription,
): Promise<void> {
  await db
    .insert(pushSubscriptions)
    .values({
      familyId,
      personId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { familyId, personId, p256dh: sub.p256dh, auth: sub.auth },
    });
}

export async function deleteSubscriptionByEndpoint(
  db: Database,
  endpoint: string,
): Promise<void> {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function listSubscriptionsForPerson(
  db: Database,
  familyId: string,
  personId: string,
): Promise<SendableSubscription[]> {
  return db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.familyId, familyId),
        eq(pushSubscriptions.personId, personId),
      ),
    );
}

/** All parents' subscriptions in a family (for approval requests). */
export async function listSubscriptionsForParents(
  db: Database,
  familyId: string,
): Promise<SendableSubscription[]> {
  return db
    .select({
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(people, eq(people.id, pushSubscriptions.personId))
    .where(
      and(eq(pushSubscriptions.familyId, familyId), eq(people.role, "parent")),
    );
}
