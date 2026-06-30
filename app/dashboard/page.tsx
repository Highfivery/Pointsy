import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  LogOut,
  Users,
  Plus,
  Minus,
  Check,
  X,
  PackageCheck,
  Download,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { getDb } from "@/lib/db/client";
import { getPersonById } from "@/lib/db/queries";
import { getKidBalances } from "@/lib/points/service";
import {
  listPendingRedemptions,
  listAwaitingFulfillment,
} from "@/lib/redemptions/service";
import {
  decideRedemptionAction,
  fulfillRedemptionAction,
} from "@/app/actions/redemptions";
import { listPendingSubmissions } from "@/lib/submissions/service";
import { decideSubmissionAction } from "@/app/actions/submissions";
import {
  listTeamRedemptionsAwaitingApproval,
  listTeamRedemptionsAwaitingFulfillment,
} from "@/lib/redemptions/team";
import { decideTeamAction, fulfillTeamAction } from "@/app/actions/team";
import { listChallengeApprovals } from "@/lib/challenges/service";
import { decideChallengeAwardAction } from "@/app/actions/challenges";
import { IconByName } from "@/components/icons/registry";
import { Chip } from "@/components/ui/Chip";
import { ConfirmDeleteDisclosure } from "@/components/account/ConfirmDeleteDisclosure";
import { deleteFamilyAction } from "@/app/actions/family";
import danger from "@/components/account/danger.module.css";
import { SetPinForm } from "@/components/account/SetPinForm";
import { EnableNotifications } from "@/components/push/EnableNotifications";
import { FamilyTimezone } from "@/components/family/FamilyTimezone";
import { DashboardNav } from "@/components/manage/DashboardNav";
import { families } from "@/lib/db/schema";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, session.familyId))
    .limit(1);
  const me = await getPersonById(db, session.familyId, session.personId);
  if (!family || !me) redirect("/sign-in");

  const [
    kids,
    pending,
    awaiting,
    choreSubs,
    teamReady,
    teamAwaiting,
    challengeApprovals,
  ] = await Promise.all([
    getKidBalances(db, session.familyId),
    listPendingRedemptions(db, session.familyId),
    listAwaitingFulfillment(db, session.familyId),
    listPendingSubmissions(db, session.familyId),
    listTeamRedemptionsAwaitingApproval(db, session.familyId),
    listTeamRedemptionsAwaitingFulfillment(db, session.familyId),
    listChallengeApprovals(db, session.familyId),
  ]);

  return (
    <main id="main" className={styles.main}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Welcome back</p>
          <h1 className={styles.title}>{me.name}</h1>
        </div>
        <form action={signOutAction}>
          <button type="submit" className={styles.signOut}>
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </form>
      </header>

      {pending.length > 0 ? (
        <section aria-labelledby="pending-heading">
          <h2 id="pending-heading" className={styles.sectionTitle}>
            Pending approvals
          </h2>
          <ul className={styles.queueList}>
            {pending.map((p) => (
              <li key={p.id} className={styles.queueCard}>
                <span
                  className={styles.kidAvatar}
                  style={{ background: p.color }}
                >
                  <IconByName name={p.avatar} size={22} />
                </span>
                <span className={styles.queueText}>
                  <span className={styles.queueTitle}>
                    {p.kidName} wants {p.rewardName}
                  </span>
                  <span className={styles.queueMeta}>{p.cost} pts</span>
                </span>
                <form
                  action={decideRedemptionAction}
                  className={styles.queueActions}
                >
                  <input type="hidden" name="redemptionId" value={p.id} />
                  <button
                    type="submit"
                    name="decision"
                    value="approved"
                    className={styles.approveBtn}
                    aria-label={`Approve ${p.rewardName} for ${p.kidName}`}
                  >
                    <Check size={16} aria-hidden="true" />
                    Approve
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="denied"
                    className={styles.denyBtn}
                    aria-label={`Deny ${p.rewardName} for ${p.kidName}`}
                  >
                    <X size={16} aria-hidden="true" />
                    Deny
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {teamReady.length > 0 ? (
        <section aria-labelledby="team-approvals-heading">
          <h2 id="team-approvals-heading" className={styles.sectionTitle}>
            Team-up approvals
          </h2>
          <ul className={styles.queueList}>
            {teamReady.map((t) => (
              <li key={t.id} className={styles.queueCard}>
                <span
                  className={styles.kidAvatar}
                  style={{ background: "var(--color-primary)" }}
                >
                  <Users size={20} aria-hidden="true" />
                </span>
                <span className={styles.queueText}>
                  <span className={styles.queueTitle}>{t.rewardName}</span>
                  <span className={styles.queueMeta}>
                    {t.cost} pts ·{" "}
                    {t.members.map((m) => `${m.name} ${m.share}`).join(", ")}
                  </span>
                </span>
                <form action={decideTeamAction} className={styles.queueActions}>
                  <input type="hidden" name="teamRedemptionId" value={t.id} />
                  <button
                    type="submit"
                    name="decision"
                    value="approved"
                    className={styles.approveBtn}
                    aria-label={`Approve ${t.rewardName} team-up`}
                  >
                    <Check size={16} aria-hidden="true" />
                    Approve
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="denied"
                    className={styles.denyBtn}
                    aria-label={`Deny ${t.rewardName} team-up`}
                  >
                    <X size={16} aria-hidden="true" />
                    Deny
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {choreSubs.length > 0 ? (
        <section aria-labelledby="chore-approvals-heading">
          <h2 id="chore-approvals-heading" className={styles.sectionTitle}>
            Chore approvals
          </h2>
          <ul className={styles.queueList}>
            {choreSubs.map((s) => (
              <li key={s.id} className={styles.queueCard}>
                <span
                  className={styles.kidAvatar}
                  style={{ background: s.color }}
                >
                  <IconByName name={s.avatar} size={22} />
                </span>
                <span className={styles.queueText}>
                  <span className={styles.queueTitle}>
                    {s.kidName} did {s.choreName}
                  </span>
                  <span className={styles.queueMeta}>
                    +{s.points} pts
                    {s.limitScope === "total" ? (
                      <Chip variant="accent">
                        <Users size={12} aria-hidden="true" />
                        Shared
                      </Chip>
                    ) : s.isCore ? (
                      <Chip variant="neutral">Core</Chip>
                    ) : null}
                  </span>
                </span>
                <form
                  action={decideSubmissionAction}
                  className={styles.queueActions}
                >
                  <input type="hidden" name="submissionId" value={s.id} />
                  <button
                    type="submit"
                    name="decision"
                    value="approved"
                    className={styles.approveBtn}
                    aria-label={`Approve ${s.choreName} for ${s.kidName}`}
                  >
                    <Check size={16} aria-hidden="true" />
                    Approve
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="rejected"
                    className={styles.denyBtn}
                    aria-label={`Reject ${s.choreName} for ${s.kidName}`}
                  >
                    <X size={16} aria-hidden="true" />
                    Reject
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {challengeApprovals.length > 0 ? (
        <section aria-labelledby="challenge-approvals-heading">
          <h2 id="challenge-approvals-heading" className={styles.sectionTitle}>
            Challenge approvals
          </h2>
          <ul className={styles.queueList}>
            {challengeApprovals.map((c) => (
              <li key={c.awardId} className={styles.queueCard}>
                <span
                  className={styles.kidAvatar}
                  style={{ background: c.color }}
                >
                  <IconByName name={c.avatar} size={22} />
                </span>
                <span className={styles.queueText}>
                  <span className={styles.queueTitle}>
                    {c.kidName} finished {c.challengeTitle}
                  </span>
                  <span className={styles.queueMeta}>+{c.bonusPoints} pts</span>
                </span>
                <form
                  action={decideChallengeAwardAction}
                  className={styles.queueActions}
                >
                  <input type="hidden" name="awardId" value={c.awardId} />
                  <button
                    type="submit"
                    name="decision"
                    value="approved"
                    className={styles.approveBtn}
                    aria-label={`Approve ${c.challengeTitle} for ${c.kidName}`}
                  >
                    <Check size={16} aria-hidden="true" />
                    Approve
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="denied"
                    className={styles.denyBtn}
                    aria-label={`Deny ${c.challengeTitle} for ${c.kidName}`}
                  >
                    <X size={16} aria-hidden="true" />
                    Deny
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="kids-heading">
        <h2 id="kids-heading" className={styles.sectionTitle}>
          Your kids
        </h2>
        {kids.length > 0 ? (
          <ul className={styles.kidList}>
            {kids.map((k) => (
              <li key={k.id} className={styles.kidCard}>
                <Link
                  href={`/award/${k.id}`}
                  className={styles.kidIdentity}
                  aria-label={`Manage ${k.name}'s points`}
                >
                  <span
                    className={styles.kidAvatar}
                    style={{ background: k.color }}
                  >
                    <IconByName name={k.avatar} size={24} />
                  </span>
                  <span className={styles.kidInfo}>
                    <span className={styles.kidCardName}>{k.name}</span>
                    <span
                      className={
                        k.balance < 0 ? styles.kidBalanceNeg : styles.kidBalance
                      }
                    >
                      {k.balance} pts
                    </span>
                  </span>
                </Link>
                <div className={styles.kidActions}>
                  <Link
                    href={`/award/${k.id}`}
                    className={styles.awardChip}
                    aria-label={`Award points to ${k.name}`}
                  >
                    <Plus size={16} aria-hidden="true" />
                    Award
                  </Link>
                  <Link
                    href={`/award/${k.id}?mode=deduct`}
                    className={styles.deductChip}
                    aria-label={`Deduct points from ${k.name}`}
                  >
                    <Minus size={16} aria-hidden="true" />
                    Deduct
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>
            <Link href="/manage/kids">Add your kids</Link> to start awarding
            points.
          </p>
        )}
      </section>

      {awaiting.length > 0 ? (
        <section aria-labelledby="awaiting-heading">
          <h2 id="awaiting-heading" className={styles.sectionTitle}>
            Awaiting delivery
          </h2>
          <ul className={styles.queueList}>
            {awaiting.map((a) => (
              <li key={a.id} className={styles.queueCard}>
                <span
                  className={styles.kidAvatar}
                  style={{ background: a.color }}
                >
                  <IconByName name={a.avatar} size={22} />
                </span>
                <span className={styles.queueText}>
                  <span className={styles.queueTitle}>
                    {a.kidName} · {a.rewardName}
                  </span>
                  <span className={styles.queueMeta}>
                    {a.cost} pts · approved
                  </span>
                </span>
                <form action={fulfillRedemptionAction}>
                  <input type="hidden" name="redemptionId" value={a.id} />
                  <button type="submit" className={styles.deliverBtn}>
                    <PackageCheck size={16} aria-hidden="true" />
                    Delivered
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {teamAwaiting.length > 0 ? (
        <section aria-labelledby="team-awaiting-heading">
          <h2 id="team-awaiting-heading" className={styles.sectionTitle}>
            Team rewards to hand out
          </h2>
          <ul className={styles.queueList}>
            {teamAwaiting.map((t) => (
              <li key={t.id} className={styles.queueCard}>
                <span
                  className={styles.kidAvatar}
                  style={{ background: "var(--color-primary)" }}
                >
                  <Users size={20} aria-hidden="true" />
                </span>
                <span className={styles.queueText}>
                  <span className={styles.queueTitle}>{t.rewardName}</span>
                  <span className={styles.queueMeta}>
                    {t.members.map((m) => m.name).join(" & ")} · approved
                  </span>
                </span>
                <form action={fulfillTeamAction}>
                  <input type="hidden" name="teamRedemptionId" value={t.id} />
                  <button type="submit" className={styles.deliverBtn}>
                    <PackageCheck size={16} aria-hidden="true" />
                    Delivered
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.card} aria-labelledby="family-heading">
        <h2 id="family-heading" className={styles.cardTitle}>
          {family.name}
        </h2>
        <p className={styles.muted}>
          Kids sign in at the <Link href="/enter">PIN sign-in page</Link> —
          share this code so a new device can join:
        </p>
        <p className={styles.code}>{family.code}</p>
        <details className={styles.pinDetails}>
          <summary className={styles.pinSummary}>
            {me.pinHash
              ? "Change your sign-in PIN"
              : "Set a sign-in PIN for yourself"}
          </summary>
          <p className={styles.muted}>
            Adds you to the profile picker so you can sign in with a PIN on a
            shared device. You can still use email + password anytime.
          </p>
          <SetPinForm hasPin={!!me.pinHash} />
        </details>
        <details className={styles.pinDetails}>
          <summary className={styles.pinSummary}>Family time zone</summary>
          <FamilyTimezone current={family.timezone} />
        </details>
      </section>

      <section
        className={`${styles.card} ${danger.zone}`}
        aria-labelledby="data-heading"
      >
        <h2 id="data-heading" className={styles.cardTitle}>
          Your data
        </h2>
        <p className={styles.muted}>
          Download everything in your family as a JSON file, or permanently
          delete it. Your export never includes passwords or PINs.
        </p>
        <a href="/api/family/export" className={danger.exportLink} download>
          <Download size={16} aria-hidden="true" />
          Export your data (JSON)
        </a>
        {family.ownerId === session.personId ? (
          <ConfirmDeleteDisclosure
            detailsClassName={styles.pinDetails}
            summaryClassName={`${styles.pinSummary} ${danger.zoneTitle}`}
            summary="Delete this family"
            action={deleteFamilyAction}
            confirmWord={family.name}
            buttonLabel="Delete family forever"
            intro={`This permanently deletes ${family.name} — every parent, child, chore, reward, and all points history. This can’t be undone.`}
          />
        ) : null}
      </section>

      <EnableNotifications audience="parent" />

      <DashboardNav />
    </main>
  );
}
