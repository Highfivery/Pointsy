"use client";

import { useEffect, useState } from "react";
import styles from "./hype.module.css";

/**
 * Celebrates when the kid's balance has grown since they last saw the page
 * (tracked in localStorage). Confetti is CSS-driven and disabled under
 * prefers-reduced-motion; the "+N" toast is announced politely.
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
      // One-shot reaction to a balance increase detected against localStorage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGain(balance - prev);
      const t = setTimeout(() => setGain(null), 2800);
      return () => clearTimeout(t);
    }
  }, [kidId, balance]);

  if (gain === null) return null;

  return (
    <div className={styles.celebrate}>
      <div className={styles.confetti} aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <output className={styles.celebrateToast}>🎉 +{gain} points!</output>
    </div>
  );
}
