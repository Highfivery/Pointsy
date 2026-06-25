"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import styles from "./ui.module.css";

export interface BottomNavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** Render in the accent color even when inactive (e.g. an "Add" action). */
  accent?: boolean;
}

/**
 * Fixed bottom navigation shared by the kid screens and the manage screens.
 * Pages that mount it must reserve bottom padding (see `--nav-offset`).
 */
export function BottomNav({
  items,
  label = "Sections",
}: {
  items: readonly BottomNavItem[];
  label?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={styles.bar} aria-label={label}>
      <div className={styles.barInner}>
        {items.map(({ href, label, Icon, accent }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={styles.tab}
              data-active={active}
              data-accent={accent && !active ? true : undefined}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={24} aria-hidden="true" />
              <span className={styles.label}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
