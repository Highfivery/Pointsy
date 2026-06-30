"use client";

import { useState } from "react";
import {
  Plus,
  ChevronDown,
  ListChecks,
  Lock,
  Check,
  Clock,
  Users,
  Flame,
} from "lucide-react";
import { IconByName } from "@/components/icons/registry";
import { submitChoreAction } from "@/app/actions/submissions";
import { formatChoreLimit } from "@/lib/catalog/limit";
import { openNowLabel, opensLabel } from "@/lib/chores/window-format";
import type { SubmittableChore } from "@/lib/submissions/service";
import { WindowCountdown } from "@/components/submit/WindowCountdown";
import styles from "@/app/submit/submit.module.css";

/**
 * One chore on the kid's Chores screen. Renders one of several ways:
 *  - locked (not theirs / not their turn) — muted with a friendly reason,
 *  - time-locked (outside its logging window) — muted, with a live countdown,
 *  - done (no claims left this window) — a green "done" card, not greyed out,
 *  - checklist — taps to expand; only logs once every step is ticked,
 *  - plain — logs on a single tap.
 */
export function SubmitChoreCard({
  chore,
  timezone,
}: {
  chore: SubmittableChore;
  timezone: string;
}) {
  const freq = formatChoreLimit(chore.limitPeriod, chore.limitCount);
  // Shared (total) chores show how many slots are left, to create the race.
  const sharedHint =
    chore.limitScope === "total" && chore.remaining !== null
      ? `First come · ${chore.remaining} left ${
          chore.limitPeriod === "week" ? "this week" : "today"
        }`
      : null;
  const hasChecklist = chore.subtasks.length > 0;
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<boolean[]>(() =>
    chore.subtasks.map(() => false),
  );
  const allDone = done.every(Boolean);

  // Not this kid's chore right now (assignment / whose-turn).
  if (!chore.eligible) {
    return (
      <li>
        <div className={styles.choreLocked}>
          <span className={styles.lockIcon} aria-hidden="true">
            <Lock size={20} />
          </span>
          <span className={styles.choreText}>
            <span className={styles.choreName}>{chore.name}</span>
            <span className={styles.lockReason}>{chore.reason}</span>
          </span>
          <span className={styles.chorePtsMuted}>{chore.points}</span>
        </div>
      </li>
    );
  }

  // Eligible, but outside its logging window — show when it reopens + a timer.
  if (chore.windowState === "locked") {
    const now = new Date();
    const label = chore.opensAt
      ? opensLabel(new Date(chore.opensAt), timezone, now)
      : "Locked right now";
    return (
      <li>
        <div className={styles.choreTimed}>
          <div className={styles.choreTimedHead}>
            <span className={styles.lockIcon} aria-hidden="true">
              <Clock size={20} />
            </span>
            <span className={styles.choreText}>
              <span className={styles.choreName}>{chore.name}</span>
              <span className={styles.lockReason}>{label}</span>
            </span>
            <span className={styles.chorePtsMuted}>+{chore.points}</span>
          </div>
          {chore.opensAt ? <WindowCountdown opensAt={chore.opensAt} /> : null}
        </div>
      </li>
    );
  }

  // Shared chore another kid already claimed — neutral, not the green "Done"
  // (the viewing kid didn't do it).
  if (chore.sharedTaken) {
    return (
      <li>
        <div className={styles.choreLocked}>
          <span className={styles.lockIcon} aria-hidden="true">
            <Users size={20} />
          </span>
          <span className={styles.choreText}>
            <span className={styles.choreName}>{chore.name}</span>
            <span className={styles.lockReason}>
              {chore.reason ?? "Already done"}
            </span>
          </span>
          <span className={styles.chorePtsMuted}>+{chore.points}</span>
        </div>
      </li>
    );
  }

  // Eligible but already done for now — celebrate it, don't grey it out.
  if (!chore.canSubmit) {
    return (
      <li>
        <div className={styles.choreDone}>
          <span className={styles.doneIcon} aria-hidden="true">
            <Check size={22} />
          </span>
          <span className={styles.choreText}>
            <span className={styles.choreName}>{chore.name}</span>
            <span className={styles.doneTag}>{chore.reason ?? "Done!"}</span>
          </span>
          <span className={styles.chorePtsMuted}>+{chore.points}</span>
        </div>
      </li>
    );
  }

  // Submittable, no checklist → single-tap log button.
  if (!hasChecklist) {
    return (
      <li>
        <form action={submitChoreAction}>
          <input type="hidden" name="choreId" value={chore.id} />
          <button type="submit" className={styles.chore}>
            <span className={styles.choreIcon} aria-hidden="true">
              <IconByName name={chore.emoji} size={24} />
            </span>
            <span className={styles.choreText}>
              <span className={styles.choreName}>{chore.name}</span>
              {chore.description ? (
                <span className={styles.choreDesc}>{chore.description}</span>
              ) : null}
              {sharedHint ? (
                <span className={styles.choreShared}>
                  <Flame size={12} aria-hidden="true" />
                  {sharedHint}
                </span>
              ) : chore.closesAt ? (
                <span className={styles.choreOpen}>
                  <Clock size={12} aria-hidden="true" />
                  {openNowLabel(new Date(chore.closesAt), timezone)}
                </span>
              ) : (
                <span className={styles.choreFreq}>{freq ?? "Anytime"}</span>
              )}
            </span>
            <span className={styles.chorePts}>
              <Plus size={14} aria-hidden="true" />
              {chore.points}
            </span>
          </button>
        </form>
      </li>
    );
  }

  // Checklist chore: tap to expand, tick every step, then log it.
  const doneCount = done.filter(Boolean).length;
  return (
    <li>
      <button
        type="button"
        className={styles.chore}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.choreIcon} aria-hidden="true">
          <IconByName name={chore.emoji} size={24} />
        </span>
        <span className={styles.choreText}>
          <span className={styles.choreName}>{chore.name}</span>
          <span className={styles.choreSteps}>
            <ListChecks size={14} aria-hidden="true" />
            {doneCount}/{chore.subtasks.length} steps
          </span>
        </span>
        <ChevronDown
          size={20}
          aria-hidden="true"
          className={open ? styles.chevronOpen : styles.chevron}
        />
      </button>

      {open ? (
        <div className={styles.checklist}>
          {chore.subtasks.map((step, i) => (
            <label key={i} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={done[i]}
                aria-label={step}
                onChange={() =>
                  setDone((prev) => prev.map((v, j) => (j === i ? !v : v)))
                }
              />
              <span>{step}</span>
            </label>
          ))}
          <form action={submitChoreAction}>
            <input type="hidden" name="choreId" value={chore.id} />
            <button type="submit" className={styles.logBtn} disabled={!allDone}>
              {allDone
                ? `Log it · +${chore.points}`
                : `Tick all ${chore.subtasks.length} steps`}
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
