"use client";

import { useActionState } from "react";
import {
  updateKidAction,
  setKidPinAction,
  toggleKidActiveAction,
} from "@/app/actions/people";
import { Field } from "@/components/auth/Field";
import { IconPicker } from "@/components/icons/IconPicker";
import { IconByName } from "@/components/icons/registry";
import { AVATAR_ICON_KEYS } from "@/lib/icons";
import type { FormState } from "@/lib/validation/form";
import { COLOR_OPTIONS } from "./options";
import form from "@/components/auth/auth-form.module.css";
import styles from "./manage.module.css";

export interface KidCardData {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isActive: boolean;
}

const initialState: FormState = {};

export function KidCard({ kid }: { kid: KidCardData }) {
  const [editState, editAction, editPending] = useActionState(
    updateKidAction,
    initialState,
  );
  const [pinState, pinAction, pinPending] = useActionState(
    setKidPinAction,
    initialState,
  );

  return (
    <section className={styles.card} aria-label={`Manage ${kid.name}`}>
      <div className={styles.kidHead}>
        <span className={styles.avatar} style={{ background: kid.color }}>
          <IconByName name={kid.avatar} size={26} />
        </span>
        <span className={styles.kidName}>{kid.name}</span>
        {!kid.isActive ? (
          <span className={styles.inactive}>Inactive</span>
        ) : null}
      </div>

      <details className={styles.disclosure}>
        <summary className={styles.summary}>Edit profile</summary>
        <form action={editAction} className={form.form} noValidate>
          <input type="hidden" name="kidId" value={kid.id} />
          <Field
            label="Name"
            name="name"
            defaultValue={kid.name}
            error={editState.fieldErrors?.name}
            required
          />
          <IconPicker
            name="avatar"
            label="Avatar"
            options={AVATAR_ICON_KEYS}
            defaultValue={kid.avatar}
          />
          <div className={form.field}>
            <label htmlFor={`color-${kid.id}`} className={form.label}>
              Color
            </label>
            <select
              id={`color-${kid.id}`}
              name="color"
              defaultValue={kid.color}
              className={styles.select}
            >
              {COLOR_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={form.submit} disabled={editPending}>
            {editPending ? "Saving…" : "Save changes"}
          </button>
          {editState.ok ? <p className={styles.success}>Saved.</p> : null}
        </form>
      </details>

      <details className={styles.disclosure}>
        <summary className={styles.summary}>Reset PIN</summary>
        <form action={pinAction} className={form.form} noValidate>
          <input type="hidden" name="kidId" value={kid.id} />
          <Field
            label="New 4-digit PIN"
            name="pin"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            error={pinState.fieldErrors?.pin}
            required
          />
          <button type="submit" className={form.submit} disabled={pinPending}>
            {pinPending ? "Saving…" : "Set new PIN"}
          </button>
          {pinState.ok ? <p className={styles.success}>PIN updated.</p> : null}
        </form>
      </details>

      <form action={toggleKidActiveAction} className={styles.disclosure}>
        <input type="hidden" name="kidId" value={kid.id} />
        <input
          type="hidden"
          name="isActive"
          value={(!kid.isActive).toString()}
        />
        <button type="submit" className={styles.secondaryBtn}>
          {kid.isActive ? "Deactivate" : "Reactivate"}
        </button>
      </form>
    </section>
  );
}
