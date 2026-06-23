"use client";

import { useActionState, useEffect, useRef } from "react";
import { awardCustomAction, adjustPointsAction } from "@/app/actions/points";
import { Field } from "@/components/auth/Field";
import type { FormState } from "@/lib/validation/form";
import form from "@/components/auth/auth-form.module.css";
import styles from "./points.module.css";

const initial: FormState = {};

export function AwardExtras({ kidId }: { kidId: string }) {
  const [cState, cAction, cPending] = useActionState(
    awardCustomAction,
    initial,
  );
  const [aState, aAction, aPending] = useActionState(
    adjustPointsAction,
    initial,
  );
  const cRef = useRef<HTMLFormElement>(null);
  const aRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (cState.ok) cRef.current?.reset();
  }, [cState.ok]);
  useEffect(() => {
    if (aState.ok) aRef.current?.reset();
  }, [aState.ok]);

  return (
    <>
      <details className={styles.extra}>
        <summary className={styles.extraSummary}>Award custom points</summary>
        <form ref={cRef} action={cAction} className={form.form} noValidate>
          <input type="hidden" name="kidId" value={kidId} />
          <Field
            label="Points"
            name="amount"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            error={cState.fieldErrors?.amount}
            required
          />
          <Field
            label="Reason"
            name="reason"
            autoComplete="off"
            error={cState.fieldErrors?.reason}
            required
          />
          {cState.error ? (
            <p role="alert" className={form.formError}>
              {cState.error}
            </p>
          ) : null}
          <button type="submit" className={form.submit} disabled={cPending}>
            {cPending ? "Awarding…" : "Award points"}
          </button>
          {cState.ok ? <p className={styles.success}>Points awarded!</p> : null}
        </form>
      </details>

      <details className={styles.extra}>
        <summary className={styles.extraSummary}>Adjust points (+/−)</summary>
        <form ref={aRef} action={aAction} className={form.form} noValidate>
          <input type="hidden" name="kidId" value={kidId} />
          <Field
            label="Amount"
            name="amount"
            type="text"
            autoComplete="off"
            hint="Use a minus sign to subtract, e.g. -5"
            error={aState.fieldErrors?.amount}
            required
          />
          <Field
            label="Reason"
            name="reason"
            autoComplete="off"
            error={aState.fieldErrors?.reason}
            required
          />
          {aState.error ? (
            <p role="alert" className={form.formError}>
              {aState.error}
            </p>
          ) : null}
          <button type="submit" className={form.submit} disabled={aPending}>
            {aPending ? "Saving…" : "Apply adjustment"}
          </button>
          {aState.ok ? <p className={styles.success}>Adjusted.</p> : null}
        </form>
      </details>
    </>
  );
}
