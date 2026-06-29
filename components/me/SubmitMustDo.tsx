"use client";

import { useEffect, useRef } from "react";
import { CircleCheck, Clock } from "lucide-react";
import { IconByName } from "@/components/icons/registry";
import { submitChoreAction } from "@/app/actions/submissions";
import { opensLabel } from "@/lib/chores/window-format";
import { WindowCountdown } from "@/components/submit/WindowCountdown";
import sheet from "@/components/redeem/redeem-confirm.module.css";
import styles from "@/app/me/me.module.css";

export interface MustDo {
  id: string;
  name: string;
  emoji: string;
  points: number;
  windowState: "open" | "locked";
  opensAt: string | null;
}

/**
 * A "today's must-do" row the kid can tap to log as done — but, like requesting
 * a reward, it asks for confirmation in a bottom sheet first (the same dialog
 * pattern as RedeemButton) so a stray tap never logs a chore by accident.
 *
 * When the chore is time-locked (outside its logging window) the row isn't
 * tappable — it shows when it opens and a live countdown instead.
 */
export function SubmitMustDo({
  chore,
  timezone,
}: {
  chore: MustDo;
  timezone: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // Tap on the backdrop (the dialog itself, not its content) closes it.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  if (chore.windowState === "locked") {
    const label = chore.opensAt
      ? opensLabel(new Date(chore.opensAt), timezone, new Date())
      : "Locked right now";
    return (
      <li>
        <div className={styles.todoLocked}>
          <div className={styles.todoLockedHead}>
            <span className={styles.todoIcon} aria-hidden="true">
              <Clock size={20} />
            </span>
            <span className={styles.todoLockedText}>
              <span className={styles.todoName}>{chore.name}</span>
              <span className={styles.todoLockedReason}>{label}</span>
            </span>
            <span className={styles.todoPts}>+{chore.points}</span>
          </div>
          {chore.opensAt ? <WindowCountdown opensAt={chore.opensAt} /> : null}
        </div>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        className={styles.todoBtn}
        onClick={() => requestAnimationFrame(() => ref.current?.showModal())}
      >
        <span className={styles.todoIcon} aria-hidden="true">
          <IconByName name={chore.emoji} size={20} />
        </span>
        <span className={styles.todoName}>{chore.name}</span>
        <span className={styles.todoPts}>+{chore.points}</span>
        <CircleCheck
          size={20}
          className={styles.todoCheck}
          aria-hidden="true"
        />
      </button>

      <dialog
        ref={ref}
        className={sheet.sheet}
        aria-label={`Log ${chore.name}`}
      >
        <p className={sheet.sheetTitle}>Did you finish {chore.name}?</p>
        <p className={sheet.sheetBody}>
          A grown-up will check it, then you get +{chore.points} points.
        </p>
        <form action={submitChoreAction}>
          <input type="hidden" name="choreId" value={chore.id} />
          <button
            type="submit"
            className={sheet.confirmBtn}
            onClick={() => ref.current?.close()}
          >
            Yes, I did it! 🎉
          </button>
        </form>
        <button
          type="button"
          className={sheet.cancelBtn}
          onClick={() => ref.current?.close()}
        >
          Not yet
        </button>
      </dialog>
    </li>
  );
}
