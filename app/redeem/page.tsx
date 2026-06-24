import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getPersonById } from "@/lib/db/queries";
import {
  listRedeemableRewards,
  listKidRedemptions,
} from "@/lib/redemptions/service";
import { cancelRedemptionAction } from "@/app/actions/redemptions";
import { IconByName } from "@/components/icons/registry";
import { RedeemButton } from "@/components/redeem/RedeemButton";
import styles from "./redeem.module.css";

export const metadata: Metadata = { title: "Redeem rewards" };

export default async function RedeemPage() {
  const session = await getSession();
  if (!session) redirect("/enter");
  if (session.role !== "kid") redirect("/dashboard");

  const db = getDb();
  const me = await getPersonById(db, session.familyId, session.personId);
  if (!me) redirect("/enter");

  const [{ available, rewards }, history] = await Promise.all([
    listRedeemableRewards(db, session.familyId, session.personId),
    listKidRedemptions(db, session.familyId, session.personId, 20),
  ]);
  const pending = history.filter((r) => r.status === "requested");

  return (
    <main id="main" className={styles.main}>
      <Link href="/me" className={styles.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back
      </Link>
      <h1 className={styles.title}>Rewards</h1>
      {available < 0 ? (
        <p className={styles.negative}>
          You&rsquo;re at {available} points. Earn {-available} to get back to
          zero, then you can spend!
        </p>
      ) : (
        <p className={styles.available}>{available} points to spend</p>
      )}

      {pending.length > 0 ? (
        <section aria-labelledby="pending-title">
          <h2 id="pending-title" className={styles.sectionTitle}>
            Waiting for a parent
          </h2>
          <ul className={styles.pendingList}>
            {pending.map((p) => (
              <li key={p.id} className={styles.pendingRow}>
                <span className={styles.pendingText}>
                  <span className={styles.pendingName}>{p.rewardName}</span>
                  <span className={styles.pendingMeta}>
                    {p.cost} pts · pending
                  </span>
                </span>
                <form action={cancelRedemptionAction}>
                  <input type="hidden" name="redemptionId" value={p.id} />
                  <button type="submit" className={styles.cancelBtn}>
                    Cancel
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="rewards-title">
        <h2 id="rewards-title" className={styles.sectionTitle}>
          Spend your points
        </h2>
        {rewards.length > 0 ? (
          <div className={styles.grid}>
            {rewards.map((r) =>
              r.affordable && available >= 0 ? (
                <RedeemButton
                  key={r.id}
                  rewardId={r.id}
                  name={r.name}
                  cost={r.cost}
                  className={styles.rewardBtn}
                >
                  <span className={styles.rewardIcon}>
                    <IconByName name={r.emoji} size={26} />
                  </span>
                  <span className={styles.rewardName}>{r.name}</span>
                  <span className={styles.rewardCost}>{r.cost} pts</span>
                  <span className={styles.redeemPill}>Redeem</span>
                </RedeemButton>
              ) : (
                <div key={r.id} className={styles.rewardLocked}>
                  <span className={styles.rewardIconLocked}>
                    <IconByName name={r.emoji} size={26} />
                  </span>
                  <span className={styles.rewardName}>{r.name}</span>
                  <span className={styles.rewardCost}>{r.cost} pts</span>
                  <span className={styles.lockedPill}>
                    <Lock size={14} aria-hidden="true" />
                    {r.moreNeeded} more
                  </span>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className={styles.empty}>No rewards yet — ask a parent!</p>
        )}
      </section>
    </main>
  );
}
