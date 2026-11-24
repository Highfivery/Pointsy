"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { IconByName } from "@/components/icons/registry";
import { Chip } from "@/components/ui/Chip";
import { formatNameList } from "@/lib/domain/names";
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

/** One kid's cash-in view (from listCashInRewards). */
export interface KidCashIn {
  available: number;
  rewards: CashInOption[];
}

export interface CashInRecipient {
  id: string;
  name: string;
}

/** Whether one kid can have one reward right now, and why not. */
type KidStatus =
  | { kid: CashInRecipient; ok: true; pending: boolean; available: number }
  | { kid: CashInRecipient; ok: false; why: string };

function statusFor(
  kid: CashInRecipient,
  rewardId: string,
  byKid: Record<string, KidCashIn>,
): KidStatus {
  const view = byKid[kid.id];
  const option = view?.rewards.find((r) => r.id === rewardId);
  if (!view || !option) return { kid, ok: false, why: "not available to them" };
  if (!option.affordable) {
    return { kid, ok: false, why: `needs ${option.moreNeeded} more` };
  }
  return { kid, ok: true, pending: option.pending, available: view.available };
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
 * With "Also give to" picks, each picked kid gets the reward and pays its full
 * cost. The sheet names who will get it and who is skipped (and why) before
 * any points move; the server re-checks every kid.
 *
 * A reward no one can have stays focusable (aria-disabled, not disabled) so
 * screen-reader users still hear why it's blocked.
 */
export function CashInBoard({
  recipients,
  rewards,
  cashInByKid,
}: {
  /** The screen's kid first, then any "Also give to" picks. */
  recipients: CashInRecipient[];
  /** The screen kid's rewards: the board's cards. */
  rewards: CashInOption[];
  cashInByKid: Record<string, KidCashIn>;
}) {
  const kidName = recipients[0]?.name ?? "";
  const available = cashInByKid[recipients[0]?.id ?? ""]?.available ?? 0;
  const shared = recipients.length > 1;
  const statuses = (rewardId: string) =>
    recipients.map((k) => statusFor(k, rewardId, cashInByKid));
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
    if (!statuses(r.id).some((st) => st.ok)) return;
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
        {shared
          ? `Tap a reward to hand it to ${formatNameList(recipients.map((k) => k.name))} now. Each pays the full cost.`
          : `Tap a reward to hand it to ${kidName} now. ${
              available < 0
                ? `${kidName} is at ${available} points, so rewards are locked until they earn back to zero.`
                : `${available} points available.`
            }`}
      </p>

      <div className={styles.choreGrid}>
        {rewards.map((r) => {
          const st = statuses(r.id);
          const okCount = st.filter((x) => x.ok).length;
          const usable = okCount > 0;
          const label = usable
            ? `Cash in ${r.name} for ${r.cost} points${shared ? " each" : ""}${
                shared && okCount < st.length
                  ? `, ${okCount} of ${st.length} can have it`
                  : ""
              }${!shared && r.pending ? `, ${kidName} asked for this` : ""}`
            : shared
              ? `${r.name}, ${r.cost} points, nobody picked can have it`
              : `${r.name}, ${r.cost} points, needs ${r.moreNeeded} more`;
          return (
            <button
              key={r.id}
              type="button"
              className={usable ? styles.rewardBtn : styles.rewardBtnLocked}
              aria-disabled={usable ? undefined : true}
              aria-label={label}
              onClick={(e) => open(r, e.currentTarget)}
            >
              <span className={styles.choreIcon}>
                <IconByName name={r.emoji} size={24} />
              </span>
              <span className={styles.choreName}>{r.name}</span>
              {!shared && r.pending ? (
                <Chip variant="accent">
                  <Clock size={12} aria-hidden="true" />
                  Asked for this
                </Chip>
              ) : null}
              {usable ? (
                <>
                  <span className={styles.rewardCost}>
                    −{r.cost}
                    {shared ? " each" : ""}
                  </span>
                  {shared && okCount < st.length ? (
                    <span className={styles.rewardNeeds}>
                      {okCount} of {st.length} can
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <span className={styles.rewardCostLocked}>{r.cost} pts</span>
                  <span className={styles.rewardNeeds}>
                    {shared
                      ? "Nobody picked can"
                      : `Needs ${r.moreNeeded} more`}
                  </span>
                </>
              )}
            </button>
          );
        })}
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
        {selected
          ? (() => {
              const st = statuses(selected.id);
              const getting = st.filter((x) => x.ok);
              const names = formatNameList(getting.map((x) => x.kid.name));
              return (
                <form action={action} className={styles.cashInForm}>
                  {/* Everyone picked: the server re-checks each kid and
                      names anyone skipped in the result. */}
                  {st.map((x) => (
                    <input
                      key={x.kid.id}
                      type="hidden"
                      name="kidId"
                      value={x.kid.id}
                    />
                  ))}
                  <input type="hidden" name="rewardId" value={selected.id} />
                  <p id={titleId} className={sheet.sheetTitle}>
                    Cash in {selected.name} for {names}?
                  </p>
                  {shared ? (
                    <ul id={bodyId} className={styles.cashInWho}>
                      {st.map((x) => (
                        <li
                          key={x.kid.id}
                          className={
                            x.ok ? styles.cashInWhoOk : styles.cashInWhoSkip
                          }
                        >
                          <span className={styles.cashInWhoName}>
                            {x.kid.name}
                          </span>
                          <span>
                            {x.ok
                              ? x.pending
                                ? `asked for this · approves it`
                                : `−${selected.cost} of ${x.available}`
                              : `skipped · ${x.why}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p id={bodyId} className={sheet.sheetBody}>
                      {selected.pending
                        ? `${kidName} already asked for this. It’ll be approved and take ${selected.cost} points.`
                        : `Takes ${selected.cost} of ${kidName}’s ${available} available points.`}
                    </p>
                  )}
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
                    {pending
                      ? "Cashing in…"
                      : getting.length > 1
                        ? `Cash in for ${selected.cost} points each`
                        : `Cash in for ${selected.cost} points`}
                  </button>
                  <button
                    type="button"
                    className={sheet.cancelBtn}
                    onClick={() => dialogRef.current?.close()}
                  >
                    Cancel
                  </button>
                </form>
              );
            })()
          : null}
      </dialog>
    </>
  );
}
