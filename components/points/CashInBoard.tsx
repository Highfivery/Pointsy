"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { IconByName } from "@/components/icons/registry";
import { Chip } from "@/components/ui/Chip";
import {
  cashInRewardAction,
  type CashInState,
} from "@/app/actions/redemptions";
import sheet from "@/components/redeem/redeem-confirm.module.css";
import form from "@/components/auth/auth-form.module.css";
import styles from "./points.module.css";

export interface CashInOption {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  affordable: boolean;
  moreNeeded: number;
  /** The kid already asked for it; cashing in approves that request. */
  pending: boolean;
}

const initial: CashInState = {};

/**
 * Deduct mode's reward board (issue #189): a parent taps a reward to hand it to
 * the kid on the spot. One shared confirm sheet asks before any points move and
 * offers "I'm handing it over now" (ticked) — untick it to send the reward to
 * Awaiting delivery instead. The sheet stays open while saving so an error
 * shows where the parent is looking; on success it closes, announces the
 * result, and returns focus to the card that opened it.
 *
 * A reward the kid can't afford stays focusable (aria-disabled, not disabled)
 * so screen-reader users still hear why it's blocked.
 */
export function CashInBoard({
  kidId,
  kidName,
  available,
  rewards,
}: {
  kidId: string;
  kidName: string;
  available: number;
  rewards: CashInOption[];
}) {
  const [state, action, pending] = useActionState(cashInRewardAction, initial);
  const [selected, setSelected] = useState<CashInOption | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const bodyId = useId();
  const handOverId = useId();
  // The result already on screen when the sheet opened: anything newer is
  // this attempt's outcome (so an old error never shows on a new reward).
  const [stateAtOpen, setStateAtOpen] = useState<CashInState>(initial);
  // The success we already closed the sheet for (don't re-close / re-focus).
  const closedFor = useRef<CashInState>(initial);

  // Backdrop tap closes the sheet (Esc is built in), as in RedeemButton.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  // Close on success and hand focus back to the card that opened the sheet.
  useEffect(() => {
    if (!state.ok || state === closedFor.current) return;
    closedFor.current = state;
    dialogRef.current?.close();
    opener.current?.focus();
  }, [state]);

  function open(r: CashInOption, button: HTMLButtonElement) {
    if (!r.affordable) return;
    opener.current = button;
    setSelected(r);
    setStateAtOpen(state);
    // Next frame so the opening tap isn't caught by the dialog (webkit race).
    requestAnimationFrame(() => dialogRef.current?.showModal());
  }

  const fresh = state !== stateAtOpen;
  const showError = Boolean(state.error) && fresh && !pending;

  if (rewards.length === 0) {
    return (
      <p className={styles.empty}>
        No rewards {kidName} can cash in yet.{" "}
        <Link href="/manage/rewards">Add a reward</Link>.
      </p>
    );
  }

  return (
    <>
      <p className={styles.cashInIntro}>
        Tap a reward to hand it to {kidName} now.{" "}
        {available < 0
          ? `${kidName} is at ${available} points, so rewards are locked until they earn back to zero.`
          : `${available} points available.`}
      </p>

      <div className={styles.choreGrid}>
        {rewards.map((r) => (
          <button
            key={r.id}
            type="button"
            className={r.affordable ? styles.rewardBtn : styles.rewardBtnLocked}
            aria-disabled={r.affordable ? undefined : true}
            aria-label={
              r.affordable
                ? `Cash in ${r.name} for ${r.cost} points${r.pending ? `, ${kidName} asked for this` : ""}`
                : `${r.name}, ${r.cost} points, needs ${r.moreNeeded} more`
            }
            onClick={(e) => open(r, e.currentTarget)}
          >
            <span className={styles.choreIcon}>
              <IconByName name={r.emoji} size={24} />
            </span>
            <span className={styles.choreName}>{r.name}</span>
            {r.pending ? (
              <Chip variant="accent">
                <Clock size={12} aria-hidden="true" />
                Asked for this
              </Chip>
            ) : null}
            {r.affordable ? (
              <span className={styles.rewardCost}>−{r.cost}</span>
            ) : (
              <>
                <span className={styles.rewardCostLocked}>{r.cost} pts</span>
                <span className={styles.rewardNeeds}>
                  Needs {r.moreNeeded} more
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Outside the sheet, so the result is announced after it closes. */}
      <output className={styles.cashInResult}>
        {state.ok ? state.message : ""}
      </output>

      <dialog
        ref={dialogRef}
        className={sheet.sheet}
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        {selected ? (
          <form action={action} className={styles.cashInForm}>
            <input type="hidden" name="kidId" value={kidId} />
            <input type="hidden" name="rewardId" value={selected.id} />
            <p id={titleId} className={sheet.sheetTitle}>
              Cash in {selected.name} for {kidName}?
            </p>
            <p id={bodyId} className={sheet.sheetBody}>
              {selected.pending
                ? `${kidName} already asked for this. It’ll be approved and take ${selected.cost} points.`
                : `Takes ${selected.cost} of ${kidName}’s ${available} available points.`}
            </p>
            <label htmlFor={handOverId} className={styles.handOverRow}>
              <input
                id={handOverId}
                type="checkbox"
                name="handedOver"
                defaultChecked
                key={selected.id}
                aria-label="I’m handing it over now"
              />
              <span>
                <span className={styles.handOverLabel}>
                  I&rsquo;m handing it over now
                </span>
                <span className={styles.handOverHint}>
                  Untick to add it to Awaiting delivery for later.
                </span>
              </span>
            </label>
            {showError ? (
              <p role="alert" className={form.formError}>
                {state.error}
              </p>
            ) : null}
            <button
              type="submit"
              className={sheet.confirmBtn}
              disabled={pending}
            >
              {pending ? "Cashing in…" : `Cash in for ${selected.cost} points`}
            </button>
            <button
              type="button"
              className={sheet.cancelBtn}
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </button>
          </form>
        ) : null}
      </dialog>
    </>
  );
}
