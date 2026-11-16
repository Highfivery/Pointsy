/**
 * Pure milestone math (no I/O). A milestone unlocks when a kid's progress —
 * the points they've earned since the milestone started counting for them —
 * reaches the target. A repeatable milestone unlocks once for every full
 * `target` of progress.
 */

/** How many times a milestone has been reached for this much progress. */
export function unlockCount(
  progress: number,
  target: number,
  repeats: boolean,
): number {
  if (!Number.isFinite(progress) || target <= 0 || progress < target) return 0;
  return repeats ? Math.floor(progress / target) : 1;
}

export interface NextProgress {
  /** Points made toward the next unlock. */
  into: number;
  /** Points needed for one unlock (the target). */
  of: number;
  /** A one-time milestone that is already reached (no next unlock). */
  done: boolean;
}

/** Progress toward the *next* unlock, for progress bars. */
export function nextProgress(
  progress: number,
  target: number,
  repeats: boolean,
): NextProgress {
  const safe = Math.max(0, Math.floor(progress));
  if (target <= 0) return { into: 0, of: 0, done: true };
  if (!repeats) {
    return safe >= target
      ? { into: target, of: target, done: true }
      : { into: safe, of: target, done: false };
  }
  return { into: safe % target, of: target, done: false };
}
