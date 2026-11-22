"use client";

import { useEffect, useRef } from "react";
import { Undo2 } from "lucide-react";
import { undoEarnAction } from "@/app/actions/points";
import { refundRewardAction } from "@/app/actions/redemptions";
import sheet from "@/components/redeem/redeem-confirm.module.css";
import styles from "./points.module.css";

/**
 * Undo control on an activity entry (parents only). For an earned entry it's
 * "Put back" (takes the points back); for a paid-for reward it's "Refund"
 * (gives the points back, issue #189). Confirms in a bottom sheet before
 * reversing, so a stray tap never moves points — same native <dialog> pattern
 * as RedeemButton (backdrop, Esc, focus trap for free).
 */
export function PutBackButton({
  entryId,
  reason,
  amount,
  kidName,
  kind = "earn",
}: {
  entryId: string;
  reason: string;
  amount: number;
  kidName: string;
  kind?: "earn" | "refund";
}) {
  const refund = kind === "refund";
  const points = Math.abs(amount);
  const ref = useRef<HTMLDialogElement>(null);

  // Close when the backdrop (the dialog element itself, not its content) is
  // tapped. Attached natively rather than via a JSX handler so it doesn't read
  // as a click handler on a non-interactive element; Esc-to-close is built in.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", onClick);
    return () => dialog.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles.undoBtn}
        aria-label={
          refund
            ? `Refund ${reason} for ${kidName}`
            : `Put back ${reason} for ${kidName}`
        }
        onClick={() => {
          // Open on the next frame so the dialog doesn't intercept the very
          // click that opened it (a webkit hit-test race).
          requestAnimationFrame(() => ref.current?.showModal());
        }}
      >
        <Undo2 size={18} aria-hidden="true" />
      </button>

      <dialog
        ref={ref}
        className={sheet.sheet}
        aria-label={refund ? `Refund ${reason}` : `Put back ${reason}`}
      >
        <p className={sheet.sheetTitle}>
          {refund ? `Refund ${reason}?` : `Put back ${reason}?`}
        </p>
        <p className={sheet.sheetBody}>
          {refund
            ? `Gives ${points} points back to ${kidName} and marks the reward as refunded.`
            : `Takes ${points} points back from ${kidName}, and it stops counting toward goals and challenges until it’s done and approved again.`}
        </p>
        <form action={refund ? refundRewardAction : undoEarnAction}>
          <input type="hidden" name="entryId" value={entryId} />
          <button
            type="submit"
            className={sheet.confirmBtn}
            onClick={() => ref.current?.close()}
          >
            {refund ? "Refund it" : "Put it back"}
          </button>
        </form>
        <button
          type="button"
          className={sheet.cancelBtn}
          onClick={() => ref.current?.close()}
        >
          Cancel
        </button>
      </dialog>
    </>
  );
}
