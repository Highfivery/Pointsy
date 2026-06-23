"use client";

import { useActionState, useState } from "react";
import {
  lookupFamilyAction,
  forgetFamilyAction,
  kidSignInAction,
  type KidSignInState,
} from "@/app/actions/kid-login";
import type { FamilyLookup, PickerMember } from "@/lib/people/service";
import { Field } from "@/components/auth/Field";
import { IconByName } from "@/components/icons/registry";
import form from "@/components/auth/auth-form.module.css";
import styles from "./enter.module.css";

const pinInitial: KidSignInState = {};

/**
 * The family profile picker — used as the home screen for any device that's
 * already associated with a family (and at /enter for entering a code). Anyone
 * (parent or kid) taps their face and enters their PIN. The known family is
 * provided by the server from the device cookie, so there's no code to re-type.
 */
export function KidLogin({
  initialFamily = null,
}: {
  initialFamily?: FamilyLookup | null;
}) {
  const [family, setFamily] = useState<FamilyLookup | null>(initialFamily);
  const [selected, setSelected] = useState<PickerMember | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinState, pinAction, pinPending] = useActionState(
    kidSignInAction,
    pinInitial,
  );

  async function resolveCode(raw: string) {
    setLoading(true);
    setCodeError(null);
    const result = await lookupFamilyAction(raw);
    setLoading(false);
    if (!result) {
      setCodeError("We couldn't find a family with that code.");
      return;
    }
    setFamily(result);
  }

  async function forget() {
    await forgetFamilyAction();
    setFamily(null);
    setSelected(null);
    setCode("");
  }

  // 1. Family code entry (only when this device doesn't know a family yet)
  if (!family) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void resolveCode(code);
        }}
        className={form.form}
        noValidate
      >
        <div className={form.field}>
          <label
            id="family-code-label"
            htmlFor="family-code"
            className={form.label}
          >
            Family code
          </label>
          <input
            id="family-code"
            aria-labelledby="family-code-label"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            className={form.input}
            aria-invalid={codeError ? true : undefined}
            aria-describedby={codeError ? "code-err" : undefined}
            required
          />
          {codeError ? (
            <p id="code-err" role="alert" className={form.error}>
              {codeError}
            </p>
          ) : null}
        </div>
        <button type="submit" className={form.submit} disabled={loading}>
          {loading ? "Looking…" : "Continue"}
        </button>
        <a href="/sign-in" className={styles.textBtn}>
          Parent? Sign in with email &amp; password
        </a>
      </form>
    );
  }

  // 3. PIN entry for the chosen profile
  if (selected) {
    return (
      <div className={styles.pinStep}>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className={styles.textBtn}
        >
          ← Choose someone else
        </button>
        <div className={styles.who}>
          <span
            className={styles.bigAvatar}
            style={{ background: selected.color }}
          >
            <IconByName name={selected.avatar} size={40} />
          </span>
          <p className={styles.whoName}>Hi {selected.name}!</p>
        </div>
        <form action={pinAction} className={form.form} noValidate>
          <input type="hidden" name="familyId" value={family.familyId} />
          <input type="hidden" name="personId" value={selected.id} />
          <Field
            label="Enter your PIN"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            required
          />
          {pinState.error ? (
            <p role="alert" className={form.formError}>
              {pinState.error}
            </p>
          ) : null}
          <button type="submit" className={form.submit} disabled={pinPending}>
            {pinPending ? "Checking…" : "Let's go"}
          </button>
        </form>
      </div>
    );
  }

  // 2. Profile picker
  return (
    <div className={styles.picker}>
      <p className={styles.familyName}>{family.familyName}</p>
      {family.members.length === 0 ? (
        <p className={styles.empty}>
          No profiles yet. A parent can{" "}
          <a href="/sign-in">sign in with email &amp; password</a> to set up
          PINs.
        </p>
      ) : (
        <ul className={styles.grid}>
          {family.members.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className={styles.profileBtn}
                onClick={() => setSelected(m)}
              >
                <span
                  className={styles.bigAvatar}
                  style={{ background: m.color }}
                >
                  <IconByName name={m.avatar} size={40} />
                </span>
                <span className={styles.profileName}>{m.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.pickerFooter}>
        <a href="/sign-in" className={styles.textBtn}>
          Parent? Sign in with email &amp; password
        </a>
        <button
          type="button"
          onClick={() => void forget()}
          className={styles.textBtn}
        >
          Use a different family
        </button>
      </div>
    </div>
  );
}
