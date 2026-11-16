import { Flag, Gift } from "lucide-react";
import type { KidMilestones as KidMilestonesData } from "@/lib/milestones/service";
import styles from "./kid-milestones.module.css";

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * The kid's long-term goals (issue #181): progress to each milestone's next
 * unlock, and rewards reached but not yet handed out. The lifetime-earned total
 * itself lives in the points card at the top of the screen.
 */
export function KidMilestones({ data }: { data: KidMilestonesData }) {
  // A reached one-time milestone whose reward is still owed already has its
  // own "reward ready" card, so don't show it twice.
  const owedFor = new Set(data.owed.map((o) => o.milestoneId));
  const items = data.items.filter((m) => !(m.done && owedFor.has(m.id)));
  if (items.length === 0 && data.owed.length === 0) return null;

  return (
    <section aria-labelledby="milestones-heading" className={styles.section}>
      <div className={styles.head}>
        <h2 id="milestones-heading" className={styles.heading}>
          <Flag size={20} aria-hidden="true" />
          Milestones
        </h2>
      </div>

      {data.owed.length > 0 ? (
        <ul className={styles.list}>
          {data.owed.map((o) => (
            <li key={o.id} className={styles.card} data-ready="true">
              <div className={styles.top}>
                <span className={styles.name}>
                  <Gift size={18} aria-hidden="true" /> {o.reward}
                </span>
              </div>
              <p className={styles.status}>
                You reached {o.title}! A grown-up will hand it out.
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((m) => {
            const pct = m.of > 0 ? Math.min(100, (m.into / m.of) * 100) : 0;
            return (
              <li key={m.id} className={styles.card}>
                <div className={styles.top}>
                  <span className={styles.name}>{m.title}</span>
                  <span className={styles.reward}>{m.reward}</span>
                </div>
                {/* SVG, not empty sized divs: those can fail to paint on iOS.
                    Decorative — the status line states the numbers. */}
                <svg
                  className={styles.track}
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <rect
                    className={styles.trackBg}
                    width="100"
                    height="10"
                    rx="5"
                  />
                  {pct > 0 ? (
                    <rect
                      className={m.done ? styles.fillDone : styles.fill}
                      width={pct}
                      height="10"
                      rx="5"
                    />
                  ) : null}
                </svg>
                <p className={styles.status}>
                  {m.done
                    ? "Reached! 🎉"
                    : `${fmt(m.into)} / ${fmt(m.of)} points`}
                  {m.repeats ? (
                    <span className={styles.extra}>
                      {" "}
                      · Repeats
                      {m.unlocked > 0 ? ` · Reached ${m.unlocked}×` : ""}
                    </span>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
