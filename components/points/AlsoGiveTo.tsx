"use client";

import { IconByName } from "@/components/icons/registry";
import styles from "./points.module.css";

export interface AwardKid {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

/**
 * Extra recipients for everything on the award screen — the custom
 * award/deduct form *and* the one-tap chores (issue #159). It sits above both
 * so its reach is obvious; picks used to live inside the chore board, where
 * they looked like they applied to the form above and didn't.
 */
export function AlsoGiveTo({
  kids,
  selected,
  onToggle,
  hint,
}: {
  kids: AwardKid[];
  selected: string[];
  onToggle: (id: string) => void;
  hint?: string;
}) {
  return (
    <fieldset className={styles.alsoCard}>
      {/* A floated legend is a normal block box, so it keeps the card's own
          look instead of straddling the top border. `.alsoBody` clears it. */}
      <legend className={styles.alsoLabel}>Also give to</legend>
      <div className={styles.alsoBody}>
        <div className={styles.chips}>
          {kids.map((k) => {
            const on = selected.includes(k.id);
            return (
              <button
                key={k.id}
                type="button"
                aria-pressed={on}
                className={on ? styles.chipOn : styles.chip}
                onClick={() => onToggle(k.id)}
              >
                <span
                  className={styles.chipAvatar}
                  style={{ background: k.color }}
                >
                  <IconByName name={k.avatar} size={16} />
                </span>
                {k.name}
              </button>
            );
          })}
        </div>
        {hint ? <p className={styles.alsoHint}>{hint}</p> : null}
      </div>
    </fieldset>
  );
}
