"use client";

import { useEffect, useRef } from "react";
import { X, Check } from "lucide-react";
import styles from "./install.module.css";

/** iOS share-sheet glyph (a box with an upward arrow). */
function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15V3M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

function PlusSquareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

/** The iOS "Add to Home Screen" walkthrough — iOS can't trigger install itself. */
export function InstallGuide({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    const onBackdrop = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", onBackdrop);
    return () => dialog.removeEventListener("click", onBackdrop);
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      onClose={onClose}
      aria-label="Add Pointsy to your home screen"
    >
      <button
        type="button"
        className={styles.close}
        onClick={() => ref.current?.close()}
        aria-label="Close"
      >
        <X size={18} aria-hidden="true" />
      </button>
      <h2 className={styles.title}>Add Pointsy to your home screen</h2>
      <p className={styles.intro}>
        It works just like an app — no App Store, no download.
      </p>
      <ol className={styles.steps}>
        <li className={styles.step}>
          <span className={styles.num}>1</span>
          <span className={styles.stepText}>
            Tap the <b>Share</b> button in the toolbar
          </span>
          <span className={styles.glyph}>
            <ShareIcon />
          </span>
        </li>
        <li className={styles.step}>
          <span className={styles.num}>2</span>
          <span className={styles.stepText}>
            Choose <b>Add to Home Screen</b>
            <span className={styles.tip}>
              Don’t see it? Tap <b>Show More</b> or scroll the list.
            </span>
          </span>
          <span className={styles.glyph}>
            <PlusSquareIcon />
          </span>
        </li>
        <li className={styles.step}>
          <span className={styles.num}>3</span>
          <span className={styles.stepText}>
            Tap <b>Add</b> — you’re done! 🎉
          </span>
          <span className={`${styles.glyph} ${styles.glyphDone}`}>
            <Check size={16} aria-hidden="true" />
          </span>
        </li>
      </ol>
    </dialog>
  );
}
