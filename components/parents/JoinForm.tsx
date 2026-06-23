"use client";

import { useActionState } from "react";
import Link from "next/link";
import { joinFamilyAction } from "@/app/actions/parents";
import type { FormState } from "@/lib/validation/form";
import { Field } from "@/components/auth/Field";
import styles from "@/components/auth/auth-form.module.css";

const initialState: FormState = {};

export function JoinForm() {
  const [state, action, pending] = useActionState(
    joinFamilyAction,
    initialState,
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <Field
        label="Invite code"
        name="code"
        autoComplete="off"
        autoCapitalize="characters"
        error={state.fieldErrors?.code}
        required
      />
      <Field
        label="Your name"
        name="name"
        autoComplete="name"
        error={state.fieldErrors?.name}
        required
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={state.fieldErrors?.email}
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={state.fieldErrors?.password}
        required
      />

      <div className={styles.consent}>
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          aria-labelledby="consent-label"
        />
        <label
          id="consent-label"
          htmlFor="consent"
          className={styles.consentLabel}
        >
          I am a parent or guardian and agree to the{" "}
          <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </label>
      </div>
      {state.fieldErrors?.consent ? (
        <p role="alert" className={styles.error}>
          {state.fieldErrors.consent}
        </p>
      ) : null}

      {state.error ? (
        <p role="alert" className={styles.formError}>
          {state.error}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Joining…" : "Join family"}
      </button>
    </form>
  );
}
