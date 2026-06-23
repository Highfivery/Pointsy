"use client";

import { useRef, useState } from "react";
import { Delete } from "lucide-react";
import styles from "./pin-pad.module.css";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * A tap-friendly numeric PIN pad. Collects digits into a hidden input named
 * `name`, shows fill-dots, and (when autoSubmit) submits the enclosing form on
 * the last digit. Remount it (via a `key`) to clear after a wrong attempt.
 */
export function PinPad({
  length = 4,
  name = "pin",
  label = "Enter your PIN",
  autoSubmit = false,
  disabled = false,
}: {
  length?: number;
  name?: string;
  label?: string;
  autoSubmit?: boolean;
  disabled?: boolean;
}) {
  const [pin, setPin] = useState("");
  const padRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  // The hidden input is uncontrolled and set imperatively so its value is
  // current when requestSubmit() serializes the form (React hasn't re-rendered
  // yet at that point).
  function commit(next: string) {
    setPin(next);
    if (hiddenRef.current) hiddenRef.current.value = next;
  }

  function append(digit: string) {
    if (disabled || pin.length >= length) return;
    const next = pin + digit;
    commit(next);
    if (autoSubmit && next.length === length) {
      padRef.current?.closest("form")?.requestSubmit();
    }
  }

  function backspace() {
    if (!disabled) commit(pin.slice(0, -1));
  }

  return (
    <div ref={padRef} className={styles.pad}>
      <input ref={hiddenRef} type="hidden" name={name} />
      <p className={styles.label}>{label}</p>
      <output
        className={styles.dots}
        aria-label={`${pin.length} of ${length} digits entered`}
      >
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={i < pin.length ? styles.dotFilled : styles.dot}
          />
        ))}
      </output>
      <div className={styles.keys}>
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={styles.key}
            disabled={disabled || pin.length >= length}
            onClick={() => append(k)}
          >
            {k}
          </button>
        ))}
        <span aria-hidden="true" />
        <button
          type="button"
          className={styles.key}
          disabled={disabled || pin.length >= length}
          onClick={() => append("0")}
        >
          0
        </button>
        <button
          type="button"
          className={styles.keyAux}
          onClick={backspace}
          disabled={disabled || pin.length === 0}
          aria-label="Delete last digit"
        >
          <Delete size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
