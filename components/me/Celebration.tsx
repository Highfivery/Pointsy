"use client";

import { useEffect, useState } from "react";
import styles from "./hype.module.css";

/**
 * Celebrates when the kid's balance has grown since they last saw the page
 * (tracked in localStorage): a centered "+N points!" card with confetti.
 * Non-blocking (taps pass through), auto-dismisses, and is disabled under
 * prefers-reduced-motion (the card still shows, just without the confetti/pop).
 */
export function Celebration({
  kidId,
  balance,
}: {
  kidId: string;
  balance: number;
}) {
  const [gain, setGain] = useState<number | null>(null);

  useEffect(() => {
    const key = `pointsy_seen_${kidId}`;
    const prevRaw = localStorage.getItem(key);
    localStorage.setItem(key, String(balance));
    if (prevRaw === null) return;
    const prev = Number(prevRaw);
    if (!Number.isNaN(prev) && balance > prev) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGain(balance - prev);
    }
  }, [kidId, balance]);

  useEffect(() => {
    if (gain === null) return;
    const timer = setTimeout(() => setGain(null), 3500);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGain(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
    };
  }, [gain]);

  if (gain === null) return null;

  return (
    <div className={styles.celebrate}>
      <div className={styles.confetti} aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <div className={styles.celebrateCard}>
        <span className={styles.celebrateEmoji} aria-hidden="true">
          🎉
        </span>
        <output className={styles.celebrateBig}>+{gain} points!</output>
        <p className={styles.celebrateSub}>Awesome work — keep it up!</p>
        <button
          type="button"
          className={styles.celebrateBtn}
          onClick={() => setGain(null)}
        >
          Yay!
        </button>
      </div>
    </div>
  );
}
