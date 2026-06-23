"use client";

import { useActionState } from "react";
import { setMyPinAction } from "@/app/actions/people";
import { Field } from "@/components/auth/Field";
import type { FormState } from "@/lib/validation/form";
import form from "@/components/auth/auth-form.module.css";
import styles from "./account.module.css";

const initialState: FormState = {};

export function SetPinForm({ hasPin }: { hasPin: boolean }) {
  const [state, action, pending] = useActionState(setMyPinAction, initialState);

  return (
    <form action={action} className={form.form} noValidate>
      <Field
        label={hasPin ? "New PIN" : "4-digit PIN"}
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        hint="Lets you sign in fast from the profile picker on a shared device."
        error={state.fieldErrors?.pin}
        required
      />
      <button type="submit" className={form.submit} disabled={pending}>
        {pending ? "Saving…" : hasPin ? "Update PIN" : "Set PIN"}
      </button>
      {state.ok ? <p className={styles.success}>PIN saved.</p> : null}
    </form>
  );
}
