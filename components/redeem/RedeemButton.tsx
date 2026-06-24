"use client";

import { useEffect, useRef } from "react";
import { requestRedemptionAction } from "@/app/actions/redemptions";
import styles from "./redeem-confirm.module.css";

/**
 * Wraps a reward as a tappable button that asks for confirmation in a bottom
 * sheet before requesting it — so a stray tap never spends points. Uses a native
 * <dialog> (backdrop, Esc, focus trap for free). Card content is passed as
 * children so each surface keeps its own styling.
 */
export function RedeemButton({
  rewardId,
  name,
  cost,
  className,
  children,
}: {
  rewardId: string;
  name: string;
  cost: number;
  className?: string;
  children: React.ReactNode;
}) {
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
        className={className}
        onClick={() => {
          // Open on the next frame so the dialog doesn't intercept the very
          // click that opened it (a webkit hit-test race).
          requestAnimationFrame(() => ref.current?.showModal());
        }}
      >
        {children}
      </button>

      <dialog ref={ref} className={styles.sheet} aria-label={`Request ${name}`}>
        <p className={styles.sheetTitle}>Request {name}?</p>
        <p className={styles.sheetBody}>
          This uses {cost} points, and a grown-up has to approve it. Only ask if
          you really want it.
        </p>
        <form action={requestRedemptionAction}>
          <input type="hidden" name="rewardId" value={rewardId} />
          <button
            type="submit"
            className={styles.confirmBtn}
            onClick={() => ref.current?.close()}
          >
            Yes, request it
          </button>
        </form>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => ref.current?.close()}
        >
          Not yet
        </button>
      </dialog>
    </>
  );
}
