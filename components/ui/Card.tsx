import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./ui.module.css";

type CardProps<T extends ElementType> = {
  /** Element to render — defaults to <section>. */
  as?: T;
  /** Frosted-glass surface that sits on the page gradient. */
  glass?: boolean;
  /** Adds hover/press affordance (use for tappable cards). */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/**
 * The single, shared surface used by every card across Pointsy. Polymorphic so
 * it can be a <section>, <article>, <li>, or an <a>/Link for tappable cards.
 */
export function Card<T extends ElementType = "section">({
  as,
  glass,
  interactive,
  className,
  children,
  ...rest
}: CardProps<T>) {
  const Tag = (as ?? "section") as ElementType;
  const cls = [
    styles.card,
    glass ? styles.glass : "",
    interactive ? styles.interactive : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
