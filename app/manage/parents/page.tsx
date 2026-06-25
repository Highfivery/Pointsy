import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Crown } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listParents, listPendingInvites } from "@/lib/parents/service";
import { revokeParentInviteAction } from "@/app/actions/parents";
import { InviteParent } from "@/components/parents/InviteParent";
import { RemoveParentButton } from "@/components/parents/RemoveParentButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import styles from "@/components/parents/parents.module.css";

export const metadata: Metadata = { title: "Parents" };

function hoursUntil(date: Date): number {
  return Math.max(0, Math.round((date.getTime() - Date.now()) / 3_600_000));
}

export default async function ManageParentsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const [parents, invites] = await Promise.all([
    listParents(db, session.familyId),
    listPendingInvites(db, session.familyId),
  ]);
  const iAmOwner =
    parents.find((p) => p.id === session.personId)?.isOwner ?? false;

  return (
    <main id="main" className={styles.main}>
      <ScreenHeader
        title="Parents"
        intro="Co-parents share this dashboard — they can award points, approve redemptions, and manage kids."
      />

      <section aria-labelledby="parents-heading">
        <h2 id="parents-heading" className={styles.sectionTitle}>
          Grown-ups
        </h2>
        <ul className={styles.list}>
          {parents.map((p) => (
            <li key={p.id} className={styles.row}>
              <span className={styles.rowText}>
                <span className={styles.rowName}>
                  <span className={styles.name}>{p.name}</span>
                  {p.id === session.personId ? (
                    <span className={styles.badge}>You</span>
                  ) : null}
                  {p.isOwner ? (
                    <span className={styles.ownerBadge}>
                      <Crown size={12} aria-hidden="true" />
                      Owner
                    </span>
                  ) : null}
                </span>
                {p.email ? (
                  <span className={styles.rowEmail}>{p.email}</span>
                ) : null}
              </span>
              {iAmOwner && !p.isOwner ? (
                <RemoveParentButton parentId={p.id} name={p.name} />
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="invite-heading">
        <h2 id="invite-heading" className={styles.sectionTitle}>
          Invite a co-parent
        </h2>
        <InviteParent />

        {invites.length > 0 ? (
          <ul className={styles.inviteList}>
            {invites.map((inv) => (
              <li key={inv.id} className={styles.inviteRow}>
                <span className={styles.inviteMeta}>
                  Pending invite · expires in ~{hoursUntil(inv.expiresAt)}h
                </span>
                <form action={revokeParentInviteAction}>
                  <input type="hidden" name="inviteId" value={inv.id} />
                  <button type="submit" className={styles.revoke}>
                    Revoke
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <ManageNav section="parents" />
    </main>
  );
}
