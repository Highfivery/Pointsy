import type { ReactNode } from "react";
import styles from "./ui.module.css";

export type ChipVariant =
  "accent" | "neutral" | "muted" | "warning" | "danger" | "success";

const VARIANT: Record<ChipVariant, string> = {
  accent: styles.chipAccent,
  neutral: styles.chipNeutral,
  muted: styles.chipMuted,
  warning: styles.chipWarning,
  danger: styles.chipDanger,
  success: styles.chipSuccess,
};

/** Small pill label — points values, status tags, counts. */
export function Chip({
  variant = "neutral",
  className,
  children,
}: {
  variant?: ChipVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={[styles.chip, VARIANT[variant], className ?? ""].join(" ")}
    >
      {children}
    </span>
  );
}
