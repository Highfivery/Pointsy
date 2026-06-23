import styles from "./points.module.css";

export interface ActivityRow {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
  kidName?: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Presentational ledger feed. `showKid` includes the kid's name in the meta. */
export function ActivityList({
  entries,
  showKid = false,
}: {
  entries: ActivityRow[];
  showKid?: boolean;
}) {
  if (entries.length === 0) {
    return <p className={styles.empty}>No activity yet.</p>;
  }
  return (
    <ul className={styles.activity}>
      {entries.map((e) => (
        <li key={e.id} className={styles.activityRow}>
          <span className={styles.activityText}>
            <span className={styles.activityReason}>{e.reason}</span>
            <span className={styles.activityMeta}>
              {showKid && e.kidName ? `${e.kidName} · ` : ""}
              {formatDate(e.createdAt)}
            </span>
          </span>
          <span className={e.amount >= 0 ? styles.amountPos : styles.amountNeg}>
            {e.amount >= 0 ? "+" : ""}
            {e.amount}
          </span>
        </li>
      ))}
    </ul>
  );
}
