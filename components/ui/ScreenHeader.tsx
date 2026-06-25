import type { ReactNode } from "react";
import styles from "./ui.module.css";

/** Standard page header — title plus optional intro line. */
export function ScreenHeader({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {intro ? <p className={styles.intro}>{intro}</p> : null}
      {children}
    </header>
  );
}
