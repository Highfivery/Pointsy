"use client";

import { useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import styles from "./pin-pad.module.css";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** How long the wrong-attempt flash (red dots + shake) runs before clearing. */
const ERROR_FLASH_MS = 450;

/**
 * A tap-friendly numeric PIN pad. Collects digits into a hidden input named
 * `name`, shows fill-dots, and (when autoSubmit) submits the enclosing form on
 * the last digit.
 *
 * On a wrong attempt, bump `errorNonce` (a value that changes on *every* failed
 * try, even when the message text repeats): the dots flash red and shake, then
 * clear themselves so the next try visibly starts from an empty pad.
 */
export function PinPad({
  length = 4,
  name = "pin",
  label = "Enter your PIN",
  autoSubmit = false,
  disabled = false,
  errorNonce = 0,
}: {
  length?: number;
  name?: string;
  label?: string;
  autoSubmit?: boolean;
  disabled?: boolean;
  errorNonce?: number;
}) {
  const [pin, setPin] = useState("");
  const [clearedNonce, setClearedNonce] = useState(0);
  const padRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  // A fresh failed attempt is one whose nonce we haven't yet flashed-and-cleared.
  // Deriving this during render (rather than setState-in-effect) keeps the red
  // flash in lockstep with the incoming error signal.
  const errored = errorNonce !== 0 && errorNonce !== clearedNonce;

  // The hidden input is uncontrolled and set imperatively so its value is
  // current when requestSubmit() serializes the form (React hasn't re-rendered
  // yet at that point).
  function commit(next: string) {
    setPin(next);
    if (hiddenRef.current) hiddenRef.current.value = next;
  }

  // Hold the red flash + shake briefly, then wipe the dots so it's unmistakable
  // the entry was rejected and the pad is ready for a retry.
  useEffect(() => {
    if (!errored) return;
    const t = setTimeout(() => {
      setClearedNonce(errorNonce);
      commit("");
    }, ERROR_FLASH_MS);
    return () => clearTimeout(t);
  }, [errored, errorNonce]);

  function append(digit: string) {
    if (disabled || errored || pin.length >= length) return;
    const next = pin + digit;
    commit(next);
    if (autoSubmit && next.length === length) {
      padRef.current?.closest("form")?.requestSubmit();
    }
  }

  function backspace() {
    if (!disabled && !errored) commit(pin.slice(0, -1));
  }

  const full = pin.length >= length;

  return (
    <div ref={padRef} className={styles.pad}>
      <input ref={hiddenRef} type="hidden" name={name} />
      <p className={styles.label}>{label}</p>
      {/* SVG circles, not styled HTML elements — they render identically on
          every device (empty CSS-sized <span>s could collapse to nothing on
          real iOS). */}
      <svg
        className={errored ? `${styles.dots} ${styles.dotsError}` : styles.dots}
        viewBox={`0 0 ${length * 32 - 14} 18`}
        aria-hidden="true"
      >
        {Array.from({ length }).map((_, i) => (
          <circle
            key={i}
            cx={9 + i * 32}
            cy={9}
            r={9}
            className={
              errored
                ? styles.dotError
                : i < pin.length
                  ? styles.dotFilled
                  : styles.dot
            }
          />
        ))}
      </svg>
      <output className="sr-only">
        {pin.length} of {length} digits entered
      </output>
      <div className={styles.keys}>
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={styles.key}
            disabled={disabled || errored || full}
            onClick={() => append(k)}
          >
            {k}
          </button>
        ))}
        <span aria-hidden="true" />
        <button
          type="button"
          className={styles.key}
          disabled={disabled || errored || full}
          onClick={() => append("0")}
        >
          0
        </button>
        <button
          type="button"
          className={styles.keyAux}
          onClick={backspace}
          disabled={disabled || errored || pin.length === 0}
          aria-label="Delete last digit"
        >
          <Delete size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
