"use client";

import { useEffect, useState } from "react";

/**
 * Animates a number counting up to `value` on mount. SSR and the first client
 * render show the real value (so screen readers and no-JS get it immediately);
 * the visual count-up runs after hydration and is skipped under
 * prefers-reduced-motion.
 */
export function CountUp({
  value,
  durationMs = 800,
}: {
  value: number;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    // Already rendering the real value; only the visual count-up is optional.
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  return <>{display.toLocaleString()}</>;
}
