import { IconByName } from "@/components/icons/registry";
import { RedeemButton } from "@/components/redeem/RedeemButton";
import type { GoalProgress } from "@/lib/redemptions/service";
import hype from "./hype.module.css";
import styles from "./special.module.css";

/** A cheer that scales with how close the kid is — small wins feel like wins. */
function cheer(pct: number, moreNeeded: number): string {
  if (moreNeeded === 0) return "You saved enough — go claim it! 🎉";
  if (pct >= 75) return "So close — almost there! 💪";
  if (pct >= 50) return "Over halfway! Keep going! 🚀";
  if (pct >= 25) return "Great start — keep it up! ⭐";
  return "Let's save up for this! ✨";
}

/**
 * "Just for you" — rewards a parent set aside for this kid, shown as bright,
 * encouraging progress cards (closest first) to pull them toward the goal. When
 * they've saved enough it flips to a celebratory claim button.
 */
export function KidRewardGoals({ rewards }: { rewards: GoalProgress[] }) {
  if (rewards.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="just-for-you">
      <h2 id="just-for-you" className={hype.shelfTitle}>
        🎯 Just for you
      </h2>
      <ul className={styles.list}>
        {rewards.map((g) => {
          const ready = g.moreNeeded === 0;
          const have = Math.max(0, g.available);
          return (
            <li
              key={g.reward.id}
              className={ready ? `${styles.card} ${styles.ready}` : styles.card}
            >
              <div className={styles.top}>
                <Ring pct={g.pct} emoji={g.reward.emoji} ready={ready} />
                <div className={styles.info}>
                  <span className={styles.name}>{g.reward.name}</span>
                  <span className={styles.cheer}>
                    {cheer(g.pct, g.moreNeeded)}
                  </span>
                </div>
              </div>

              <progress
                className={hype.bar}
                value={have}
                max={g.reward.cost}
                aria-label={`${have} of ${g.reward.cost} points toward ${g.reward.name}`}
              />

              <div className={styles.foot}>
                <span className={styles.count}>
                  {have} / {g.reward.cost} pts
                </span>
                {ready ? (
                  <RedeemButton
                    rewardId={g.reward.id}
                    name={g.reward.name}
                    cost={g.reward.cost}
                    className={styles.claim}
                  >
                    Claim it!
                  </RedeemButton>
                ) : (
                  <span className={styles.toGo}>{g.moreNeeded} to go</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Ring({
  pct,
  emoji,
  ready,
}: {
  pct: number;
  emoji: string;
  ready: boolean;
}) {
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  return (
    <div className={hype.ringWrap} aria-hidden="true">
      <svg viewBox="0 0 72 72" className={hype.ring}>
        <circle cx="36" cy="36" r={r} className={hype.ringTrack} />
        <circle
          cx="36"
          cy="36"
          r={r}
          className={ready ? styles.ringFillReady : hype.ringFill}
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 36 36)"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.ringIcon}>
        <IconByName name={emoji} size={26} />
      </span>
    </div>
  );
}
