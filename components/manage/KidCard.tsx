"use client";

import { useActionState } from "react";
import { Pencil, KeyRound, Power } from "lucide-react";
import {
  updateKidAction,
  setKidPinAction,
  toggleKidActiveAction,
} from "@/app/actions/people";
import { Field } from "@/components/auth/Field";
import { IconPicker } from "@/components/icons/IconPicker";
import { IconByName } from "@/components/icons/registry";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Chip } from "@/components/ui/Chip";
import { AVATAR_ICON_KEYS } from "@/lib/icons";
import type { FormState } from "@/lib/validation/form";
import { COLOR_OPTIONS } from "./options";
import form from "@/components/auth/auth-form.module.css";
import ui from "@/components/ui/ui.module.css";
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
    <Card aria-label={`Manage ${kid.name}`}>
      <div className={styles.kidHead}>
        <span className={styles.avatar} style={{ background: kid.color }}>
          <IconByName name={kid.avatar} size={26} />
        </span>
        <span className={styles.kidName}>{kid.name}</span>
        {!kid.isActive ? <Chip variant="warning">Inactive</Chip> : null}
      </div>

      <div className={ui.actionRow}>
        <details className={ui.actionDisclosure}>
          <summary
            className={`${ui.iconBtn} ${ui.iconSummary}`}
            aria-label={`Edit ${kid.name}’s profile`}
            title="Edit profile"
          >
            <Pencil size={18} aria-hidden="true" />
          </summary>
          <form
            action={editAction}
            className={`${form.form} ${ui.actionPanel}`}
            noValidate
          >
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
            <button
              type="submit"
              className={form.submit}
              disabled={editPending}
            >
              {editPending ? "Saving…" : "Save changes"}
            </button>
            {editState.ok ? <p className={styles.success}>Saved.</p> : null}
          </form>
        </details>

        <details className={ui.actionDisclosure}>
          <summary
            className={`${ui.iconBtn} ${ui.iconSummary}`}
            aria-label={`Reset ${kid.name}’s PIN`}
            title="Reset PIN"
          >
            <KeyRound size={18} aria-hidden="true" />
          </summary>
          <form
            action={pinAction}
            className={`${form.form} ${ui.actionPanel}`}
            noValidate
          >
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
            {pinState.ok ? (
              <p className={styles.success}>PIN updated.</p>
            ) : null}
          </form>
        </details>

        <form
          action={toggleKidActiveAction}
          className={`${ui.inlineForm} ${ui.pushRight}`}
        >
          <input type="hidden" name="kidId" value={kid.id} />
          <input
            type="hidden"
            name="isActive"
            value={(!kid.isActive).toString()}
          />
          <IconButton
            type="submit"
            variant={kid.isActive ? "default" : "accent"}
            label={
              kid.isActive ? `Deactivate ${kid.name}` : `Reactivate ${kid.name}`
            }
          >
            <Power size={18} aria-hidden="true" />
          </IconButton>
        </form>
      </div>
    </Card>
  );
}
