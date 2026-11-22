import { PutBackButton } from "./PutBackButton";
import styles from "./points.module.css";

export interface ActivityRow {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
  kidName?: string;
  type?: "earn" | "redeem" | "adjust" | "bonus";
  /** This earn was put back (or reward refunded) — struck through. */
  reversed?: boolean;
  /** A paid-for solo reward a parent can refund (issue #189). */
  refundable?: boolean;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Presentational ledger feed. `showKid` includes the kid's name in the meta.
 * `undoKidName` (parent surfaces only) adds a "put back" button to earned
 * entries and a "refund" button to paid-for rewards, unless already undone.
 */
export function ActivityList({
  entries,
  showKid = false,
  undoKidName,
}: {
  entries: ActivityRow[];
  showKid?: boolean;
  undoKidName?: string;
}) {
  if (entries.length === 0) {
    return <p className={styles.empty}>No activity yet.</p>;
  }
  return (
    <ul className={styles.activity}>
      {entries.map((e) => (
        <li key={e.id} className={styles.activityRow}>
          <span className={styles.activityText}>
            <span
              className={
                e.reversed
                  ? styles.activityReasonReversed
                  : styles.activityReason
              }
            >
              {e.reason}
            </span>
            <span className={styles.activityMeta}>
              {e.reversed
                ? e.type === "redeem"
                  ? "Refunded · "
                  : "Put back · "
                : ""}
              {showKid && e.kidName ? `${e.kidName} · ` : ""}
              {formatDate(e.createdAt)}
            </span>
          </span>
          <span
            className={
              e.reversed
                ? styles.amountReversed
                : e.amount >= 0
                  ? styles.amountPos
                  : styles.amountNeg
            }
          >
            {e.amount >= 0 ? "+" : ""}
            {e.amount}
          </span>
          {undoKidName ? (
            (e.type === "earn" || e.refundable) && !e.reversed ? (
              <PutBackButton
                entryId={e.id}
                reason={e.reason}
                amount={e.amount}
                kidName={undoKidName}
                kind={e.type === "earn" ? "earn" : "refund"}
              />
            ) : (
              // Keep the amounts column-aligned on rows without a button.
              <span className={styles.undoSpacer} aria-hidden="true" />
            )
          ) : null}
        </li>
      ))}
    </ul>
  );
}
