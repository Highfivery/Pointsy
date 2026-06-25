import { Trophy } from "lucide-react";
import type { ChallengeProgress } from "@/lib/challenges/service";
import type { ChallengeGoal } from "@/lib/db/schema";
import styles from "./kid-challenges.module.css";

const UNIT: Record<ChallengeGoal, string> = {
  points: "points",
  chore_count: "chores",
  core_days: "days",
};

/** Active challenges the kid is part of, with a live progress bar. */
export function KidChallenges({ items }: { items: ChallengeProgress[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="challenges-heading" className={styles.section}>
      <h2 id="challenges-heading" className={styles.heading}>
        <Trophy size={20} aria-hidden="true" />
        Challenges
      </h2>
      <ul className={styles.list}>
        {items.map((p) => {
          const done = p.awarded || p.complete;
          const shown = Math.min(p.value, p.target);
          return (
            <li
              key={p.challenge.id}
              className={styles.card}
              data-complete={done}
            >
              <div className={styles.top}>
                <span className={styles.name}>{p.challenge.title}</span>
                <span className={styles.bonus}>+{p.challenge.bonusPoints}</span>
              </div>
              {/* Decorative — the status line below states the numbers. */}
              <div className={styles.track} aria-hidden="true">
                <div
                  className={styles.fill}
                  data-complete={done}
                  style={{ width: `${p.pct}%` }}
                />
              </div>
              <p className={styles.status}>
                {p.awarded
                  ? "Done! Bonus earned 🎉"
                  : p.complete
                    ? "Complete! 🎉"
                    : `${shown} / ${p.target} ${UNIT[p.challenge.goalType]}`}
                {p.challenge.scope === "family" ? (
                  <span className={styles.team}> · Team</span>
                ) : null}
                {p.challenge.recurrence === "weekly" ? (
                  <span className={styles.team}> · Weekly</span>
                ) : null}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
