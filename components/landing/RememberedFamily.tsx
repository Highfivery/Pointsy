"use client";

import { useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
import styles from "./remembered.module.css";

const STORAGE_KEY = "pointsy.familyCode";

const subscribe = () => () => {};
const getSnapshot = () => window.localStorage.getItem(STORAGE_KEY);
const getServerSnapshot = () => null;

/**
 * On a device that has already signed in to a family, surface a prominent
 * shortcut straight to the profile picker. Reads localStorage via
 * useSyncExternalStore so it's hydration-safe and effect-free.
 */
export function RememberedFamily() {
  const code = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!code) return null;

  return (
    <a href="/enter" className={styles.continue}>
      Sign in to {code}
      <ArrowRight size={18} aria-hidden="true" />
    </a>
  );
}
