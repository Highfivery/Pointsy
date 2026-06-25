import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import styles from "./ui.module.css";

export type IconButtonVariant = "default" | "accent" | "danger" | "ghost";

const VARIANT: Record<IconButtonVariant, string> = {
  default: "",
  accent: styles.accent,
  danger: styles.danger,
  ghost: styles.ghost,
};

function classes(variant: IconButtonVariant, className?: string): string {
  return [styles.iconBtn, VARIANT[variant], className ?? ""]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = {
  /** Accessible name AND desktop hover tooltip. Required. */
  label: string;
  variant?: IconButtonVariant;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "aria-label" | "title">;

/** Icon-only button with a built-in label/tooltip. Safe inside server forms. */
export function IconButton({
  label,
  variant = "default",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={classes(variant, className)}
    >
      {children}
    </button>
  );
}

type LinkProps = {
  label: string;
  href: string;
  variant?: IconButtonVariant;
  children: ReactNode;
} & Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "href" | "aria-label" | "title"
>;

/** Icon-only link styled identically to {@link IconButton}. */
export function IconLink({
  label,
  href,
  variant = "default",
  className,
  children,
  ...rest
}: LinkProps) {
  return (
    <Link
      {...rest}
      href={href}
      aria-label={label}
      title={label}
      className={classes(variant, className)}
    >
      {children}
    </Link>
  );
}
