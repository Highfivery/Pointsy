import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Flag, Gift, Trophy } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { listMilestones } from "@/lib/milestones/service";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import manage from "@/components/manage/manage.module.css";
import styles from "@/components/challenges/challenges.module.css";

export const metadata: Metadata = { title: "Milestones" };

const fmt = (n: number) => n.toLocaleString("en-US");

/** "1,000 points earned", "Every 500 new points", … */
function ruleLabel(
  target: number,
  repeats: boolean,
  startMode: "lifetime" | "from_now",
): string {
  const pts = startMode === "from_now" ? "new points" : "points earned";
  return repeats ? `Every ${fmt(target)} ${pts}` : `${fmt(target)} ${pts}`;
}

export default async function MilestonesPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const list = await listMilestones(getDb(), session.familyId);

  return (
    <main id="main" className={manage.main}>
      <ScreenHeader
        title="Milestones"
        intro="Big goals on the points kids earn over time. Spending points never sets them back."
      >
        <Link href="/manage/challenges" className={manage.headerLink}>
          <Trophy size={16} aria-hidden="true" />
          Challenges
        </Link>
      </ScreenHeader>

      {list.length === 0 ? (
        <p className={styles.empty}>
          No milestones yet. Add one, like “Earn 1,000 points → a special
          outing”.
        </p>
      ) : (
        <ul className={styles.list}>
          {list.map(({ milestone: m, kidNames, unlocked, owed }) => (
            <li key={m.id}>
              <Link href={`/manage/milestones/${m.id}`} className={styles.row}>
                <span className={styles.icon} aria-hidden="true">
                  <Flag size={20} />
                </span>
                <span className={styles.main}>
                  <span className={styles.name}>{m.title}</span>
                  <span className={styles.meta}>
                    {ruleLabel(m.target, m.repeats, m.startMode)}
                  </span>
                  <span className={styles.meta}>
                    <Gift size={12} aria-hidden="true" /> {m.reward}
                  </span>
                  <span className={styles.meta}>
                    {m.allKids ? "Every kid" : kidNames.join(", ") || "No kids"}
                    {unlocked > 0
                      ? ` · Reached ${unlocked}×${owed > 0 ? ` · ${owed} to hand out` : ""}`
                      : ""}
                  </span>
                </span>
                {m.isActive ? null : (
                  <span className={styles.end}>
                    <span className={styles.status} data-status="paused">
                      Paused
                    </span>
                  </span>
                )}
                <ChevronRight
                  size={18}
                  aria-hidden="true"
                  className={styles.chevron}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ManageNav section="milestones" />
    </main>
  );
}
