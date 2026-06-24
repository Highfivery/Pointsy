import { setGoalAction } from "@/app/actions/redemptions";
import { IconByName } from "@/components/icons/registry";
import type { GoalProgress } from "@/lib/redemptions/service";
import styles from "./hype.module.css";

export interface GoalRewardOption {
  id: string;
  name: string;
  cost: number;
}

/**
 * The kid's savings goal: a progress ring toward the reward they chose, or a
 * picker to set one. Clearing/changing posts the kid-only setGoalAction.
 */
export function KidGoal({
  goal,
  rewardOptions,
}: {
  goal: GoalProgress | null;
  rewardOptions: GoalRewardOption[];
}) {
  if (rewardOptions.length === 0) return null;

  return (
    <section className={styles.goal} aria-labelledby="goal-title">
      <h2 id="goal-title" className={styles.shelfTitle}>
        My goal
      </h2>
      {goal ? (
        <div className={styles.goalRow}>
          <GoalRing pct={goal.pct} emoji={goal.reward.emoji} />
          <div className={styles.goalText}>
            <span className={styles.shelfName}>{goal.reward.name}</span>
            <span className={styles.almostNeed}>
              {goal.moreNeeded === 0
                ? "You have enough — go get it! 🎉"
                : `${goal.moreNeeded} to go · ${goal.available}/${goal.reward.cost}`}
            </span>
            <form action={setGoalAction}>
              <input type="hidden" name="rewardId" value="" />
              <button type="submit" className={styles.goalClear}>
                Clear goal
              </button>
            </form>
          </div>
        </div>
      ) : (
        <form action={setGoalAction} className={styles.goalPicker}>
          <label htmlFor="goal-reward" className={styles.goalLabel}>
            Pick a reward to save toward
          </label>
          <div className={styles.goalPickRow}>
            <select
              id="goal-reward"
              name="rewardId"
              className={styles.goalSelect}
            >
              {rewardOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.cost})
                </option>
              ))}
            </select>
            <button type="submit" className={styles.goalSet}>
              Set goal
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function GoalRing({ pct, emoji }: { pct: number; emoji: string }) {
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  const dash = (clamped / 100) * circumference;
  return (
    <div className={styles.ringWrap} aria-hidden="true">
      <svg viewBox="0 0 72 72" className={styles.ring}>
        <circle cx="36" cy="36" r={r} className={styles.ringTrack} />
        <circle
          cx="36"
          cy="36"
          r={r}
          className={styles.ringFill}
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 36 36)"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.ringIcon}>
        <IconByName name={emoji} size={24} />
      </span>
    </div>
  );
}
