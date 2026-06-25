"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ListTodo, Gift } from "lucide-react";
import styles from "./kid-tabs.module.css";

const TABS = [
  { href: "/me", label: "Home", Icon: House },
  { href: "/submit", label: "Chores", Icon: ListTodo },
  { href: "/redeem", label: "Rewards", Icon: Gift },
] as const;

/** Fixed bottom navigation for the kid's three screens. */
export function KidTabBar() {
  const pathname = usePathname();
  return (
    <nav className={styles.bar} aria-label="Sections">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={styles.tab}
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={24} aria-hidden="true" />
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
