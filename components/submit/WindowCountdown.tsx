"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hourglass } from "lucide-react";
import { countdownText, countdownAria } from "@/lib/chores/window-format";
import styles from "@/app/submit/submit.module.css";

/**
 * Live "Unlocks in 2h 14m" countdown for a time-locked chore. Cosmetic only —
 * the server re-checks the window on submit — so when it reaches zero we just
 * refresh the route to pick up the now-open state. The visible text ticks; the
 * spoken label is on the value (no aria-live, so it doesn't announce each tick).
 */
export function WindowCountdown({ opensAt }: { opensAt: string }) {
  const router = useRouter();
  const target = new Date(opensAt).getTime();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, target - Date.now()),
  );

  useEffect(() => {
    const tick = () => {
      const left = target - Date.now();
      setRemaining(Math.max(0, left));
      if (left <= 0) router.refresh();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, router]);

  return (
    <div className={styles.countdown}>
      <Hourglass size={18} aria-hidden="true" />
      <span className={styles.countdownLabel} aria-hidden="true">
        Unlocks in
      </span>
      <span
        className={styles.countdownValue}
        aria-label={`Unlocks in ${countdownAria(remaining)}`}
      >
        {countdownText(remaining)}
      </span>
    </div>
  );
}
