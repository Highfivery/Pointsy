"use client";

import { useState } from "react";
import { Plus, ChevronDown, ListChecks } from "lucide-react";
import { IconByName } from "@/components/icons/registry";
import { submitChoreAction } from "@/app/actions/submissions";
import { formatChoreLimit } from "@/lib/catalog/limit";
import type { SubmittableChore } from "@/lib/submissions/service";
import styles from "@/app/submit/submit.module.css";

/**
 * One chore on the kid's "Log a chore" screen. Plain chores log on tap; chores
 * with a checklist expand and only let the kid log once every step is ticked.
 * Locked chores (not theirs / not their turn / limit reached) are shown disabled
 * with a reason.
 */
export function SubmitChoreCard({ chore }: { chore: SubmittableChore }) {
  const freq = formatChoreLimit(chore.limitPeriod, chore.limitCount);
  const hasChecklist = chore.subtasks.length > 0;
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<boolean[]>(() =>
    chore.subtasks.map(() => false),
  );
  const allDone = done.every(Boolean);

  // Locked, or no checklist → the existing single-tap button.
  if (!chore.canSubmit || !hasChecklist) {
    return (
      <li>
        <form action={submitChoreAction}>
          <input type="hidden" name="choreId" value={chore.id} />
          <button
            type="submit"
            className={styles.chore}
            disabled={!chore.canSubmit}
          >
            <span
              className={styles.choreIcon}
              aria-hidden="true"
              data-done={!chore.canSubmit}
            >
              <IconByName name={chore.emoji} size={24} />
            </span>
            <span className={styles.choreText}>
              <span className={styles.choreName}>{chore.name}</span>
              {chore.description ? (
                <span className={styles.choreDesc}>{chore.description}</span>
              ) : null}
              <span className={styles.choreFreq}>{freq ?? "Anytime"}</span>
              {!chore.canSubmit ? (
                <span className={styles.doneTag}>{chore.reason}</span>
              ) : null}
            </span>
            <span className={styles.chorePts}>
              {chore.canSubmit ? <Plus size={14} aria-hidden="true" /> : null}
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
