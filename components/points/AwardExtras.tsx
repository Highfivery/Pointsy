"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { changePointsAction } from "@/app/actions/points";
import { Field } from "@/components/auth/Field";
import type { FormState } from "@/lib/validation/form";
import form from "@/components/auth/auth-form.module.css";
import styles from "./points.module.css";

const initial: FormState = {};

/**
 * Manual points control for a kid: award a custom amount or take points away.
 * A segmented toggle picks the direction so the parent always types a plain
 * positive number — no minus-sign guesswork — and the submit button restates
 * exactly what will happen.
 */
export function AwardExtras({
  kidId,
  initialMode = "award",
}: {
  kidId: string;
  initialMode?: "award" | "deduct";
}) {
  const [state, action, pending] = useActionState(changePointsAction, initial);
  const [mode, setMode] = useState<"award" | "deduct">(initialMode);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  const isDeduct = mode === "deduct";

  return (
    <section
      className={styles.manualCard}
      aria-labelledby="manual-points-title"
    >
      <h2 id="manual-points-title" className={styles.sectionTitle}>
        Award or deduct points
      </h2>
      <form ref={ref} action={action} className={form.form} noValidate>
        <input type="hidden" name="kidId" value={kidId} />
        <input type="hidden" name="direction" value={mode} />

        <fieldset className={styles.segment}>
          <legend className="sr-only">Choose award or deduct</legend>
          <button
            type="button"
            className={isDeduct ? styles.segBtn : styles.segBtnAward}
            aria-pressed={!isDeduct}
            onClick={() => setMode("award")}
          >
            <Plus size={16} aria-hidden="true" />
            Award
          </button>
          <button
            type="button"
            className={isDeduct ? styles.segBtnDeduct : styles.segBtn}
            aria-pressed={isDeduct}
            onClick={() => setMode("deduct")}
          >
            <Minus size={16} aria-hidden="true" />
            Deduct
          </button>
        </fieldset>

        <Field
          label="Points"
          name="amount"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          error={state.fieldErrors?.amount}
          required
        />
        <Field
          label="Reason"
          name="reason"
          autoComplete="off"
          error={state.fieldErrors?.reason}
          required
        />
        {state.error ? (
          <p role="alert" className={form.formError}>
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          className={isDeduct ? styles.deductSubmit : form.submit}
          disabled={pending}
        >
          {pending
            ? isDeduct
              ? "Deducting…"
              : "Awarding…"
            : isDeduct
              ? "Deduct points"
              : "Award points"}
        </button>
        {state.ok && state.direction === mode ? (
          <p className={styles.success}>
            {isDeduct ? "Points deducted." : "Points awarded!"}
          </p>
        ) : null}
      </form>
    </section>
  );
}
