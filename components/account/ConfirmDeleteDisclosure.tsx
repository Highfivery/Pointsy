"use client";

import { useState, type ReactNode } from "react";
import { DangerDeleteForm } from "./DangerDeleteForm";
import type { FormState } from "@/lib/validation/form";

/**
 * A `<details>` whose destructive form only mounts once opened — so the
 * confirmation copy (which echoes the name being deleted) isn't in the DOM while
 * collapsed, keeping it out of the way of unrelated text queries.
 */
export function ConfirmDeleteDisclosure({
  summary,
  detailsClassName,
  summaryClassName,
  summaryAriaLabel,
  summaryTitle,
  panelClassName,
  action,
  confirmWord,
  buttonLabel,
  intro,
  hidden,
}: {
  summary: ReactNode;
  detailsClassName?: string;
  summaryClassName?: string;
  summaryAriaLabel?: string;
  summaryTitle?: string;
  panelClassName?: string;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  confirmWord: string;
  buttonLabel: string;
  intro: string;
  hidden?: { name: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className={detailsClassName}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary
        className={summaryClassName}
        aria-label={summaryAriaLabel}
        title={summaryTitle}
      >
        {summary}
      </summary>
      {open ? (
        <div className={panelClassName}>
          <DangerDeleteForm
            action={action}
            confirmWord={confirmWord}
            buttonLabel={buttonLabel}
            intro={intro}
            hidden={hidden}
          />
        </div>
      ) : null}
    </details>
  );
}
