"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthState } from "@/app/actions/auth";
import { Field } from "./Field";
import styles from "./auth-form.module.css";

const initialState: AuthState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={action} className={styles.form} noValidate>
      <Field
        label="Family name"
        name="familyName"
        autoComplete="off"
        error={state.fieldErrors?.familyName}
        required
      />
      <Field
        label="Your name"
        name="parentName"
        autoComplete="name"
        error={state.fieldErrors?.parentName}
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
          <Link href="/privacy">Privacy Policy</Link>, including managing my
          children&rsquo;s profiles.
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
        {pending ? "Creating your family…" : "Create family"}
      </button>
    </form>
  );
}
