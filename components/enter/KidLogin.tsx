"use client";

import { useActionState, useEffect, useState } from "react";
import {
  lookupFamilyAction,
  kidSignInAction,
  type KidSignInState,
} from "@/app/actions/kid-login";
import type { FamilyLookup, PickerMember } from "@/lib/people/service";
import { Field } from "@/components/auth/Field";
import form from "@/components/auth/auth-form.module.css";
import styles from "./enter.module.css";

const STORAGE_KEY = "pointsy.familyCode";
const pinInitial: KidSignInState = {};

export function KidLogin() {
  const [family, setFamily] = useState<FamilyLookup | null>(null);
  const [selected, setSelected] = useState<PickerMember | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinState, pinAction, pinPending] = useActionState(
    kidSignInAction,
    pinInitial,
  );

  // Auto-load a remembered family on this device.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    let active = true;
    lookupFamilyAction(saved).then((result) => {
      if (!active) return;
      if (result) setFamily(result);
      else window.localStorage.removeItem(STORAGE_KEY);
    });
    return () => {
      active = false;
    };
  }, []);

  async function resolveCode(raw: string) {
    setLoading(true);
    setCodeError(null);
    const result = await lookupFamilyAction(raw);
    setLoading(false);
    if (!result) {
      setCodeError("We couldn't find a family with that code.");
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, raw.trim().toUpperCase());
    setFamily(result);
  }

  function forgetFamily() {
    window.localStorage.removeItem(STORAGE_KEY);
    setFamily(null);
    setSelected(null);
    setCode("");
  }

  // 1. Family code entry
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
            aria-hidden="true"
          >
            {selected.avatar}
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
          No profiles yet — ask a parent to add you.
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
                  aria-hidden="true"
                >
                  {m.avatar}
                </span>
                <span className={styles.profileName}>{m.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={forgetFamily} className={styles.textBtn}>
        Use a different family code
      </button>
    </div>
  );
}
