"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import styles from "./site-header.module.css";

/** Primary marketing nav — section anchors resolve to the homepage from any
 * page (e.g. `/#how`), so the header works on `/privacy` and `/terms` too. */
const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#why", label: "Why Pointsy" },
  { href: "/#features", label: "Features" },
  { href: "/compare", label: "Compare" },
  { href: "/#faq", label: "FAQ" },
];

/**
 * Sticky, glassy site header for the marketing and legal surfaces. Gives every
 * public page a way home (the logo) and a path to sign in / sign up. The app's
 * authenticated screens use their own `ScreenHeader` instead.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Pointsy home">
          <Logo size={28} />
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link href="/sign-in" className={styles.signIn}>
            Parent sign in
          </Link>
          <Link href="/sign-up" className={styles.cta}>
            Create your family
          </Link>
        </div>

        <button
          type="button"
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
        </button>
      </div>

      {open ? (
        <div className={styles.menu} id="site-menu">
          <nav className={styles.menuNav} aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.menuLink}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.menuActions}>
            <Link
              href="/sign-in"
              className={styles.menuSignIn}
              onClick={() => setOpen(false)}
            >
              Parent sign in
            </Link>
            <Link
              href="/sign-up"
              className={styles.cta}
              onClick={() => setOpen(false)}
            >
              Create your family
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
