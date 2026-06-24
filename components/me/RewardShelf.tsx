import { requestRedemptionAction } from "@/app/actions/redemptions";
import { IconByName } from "@/components/icons/registry";
import styles from "./hype.module.css";

export interface ShelfReward {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  moreNeeded: number;
}

/**
 * The kid's reward motivators: a shelf of rewards they can grab right now, and
 * the single closest reward with a progress bar to pull them forward.
 */
export function RewardShelf({
  available,
  affordable,
  nextUp,
}: {
  available: number;
  affordable: ShelfReward[];
  nextUp: ShelfReward | null;
}) {
  if (affordable.length === 0 && !nextUp) return null;

  return (
    <>
      {affordable.length > 0 ? (
        <section className={styles.shelf} aria-labelledby="redeem-now">
          <h2 id="redeem-now" className={styles.shelfTitle}>
            🎉 You can get these now!
          </h2>
          <ul className={styles.shelfRow}>
            {affordable.map((r) => (
              <li key={r.id}>
                <form action={requestRedemptionAction}>
                  <input type="hidden" name="rewardId" value={r.id} />
                  <button type="submit" className={styles.shelfCard}>
                    <span className={styles.shelfIcon}>
                      <IconByName name={r.emoji} size={28} />
                    </span>
                    <span className={styles.shelfName}>{r.name}</span>
                    <span className={styles.shelfCost}>{r.cost} pts</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {nextUp ? (
        <section className={styles.almost} aria-labelledby="almost-there">
          <h2 id="almost-there" className={styles.shelfTitle}>
            Almost there!
          </h2>
          <div className={styles.almostCard}>
            <span className={styles.shelfIcon}>
              <IconByName name={nextUp.emoji} size={28} />
            </span>
            <div className={styles.almostText}>
              <span className={styles.shelfName}>{nextUp.name}</span>
              <span className={styles.almostNeed}>
                {nextUp.moreNeeded} more point
                {nextUp.moreNeeded === 1 ? "" : "s"} to go!
              </span>
              <progress
                className={styles.bar}
                value={Math.max(0, available)}
                max={nextUp.cost}
                aria-label={`${Math.max(0, available)} of ${nextUp.cost} points toward ${nextUp.name}`}
              />
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
