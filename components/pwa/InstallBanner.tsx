"use client";

import { useState, useSyncExternalStore } from "react";
import { Smartphone, X } from "lucide-react";
import { useInstall } from "./useInstall";
import { InstallGuide } from "./InstallGuide";
import styles from "./install.module.css";

const DISMISS_KEY = "pointsy_install_dismissed";

/** Read the "dismissed" flag from localStorage without a set-state-in-effect. */
function useDismissed(): [boolean, () => void] {
  const dismissed = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => localStorage.getItem(DISMISS_KEY) === "1",
    () => true, // hidden during SSR / first paint
  );
  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    window.dispatchEvent(new Event("storage"));
  };
  return [dismissed, dismiss];
}

/**
 * A dismissible "Install Pointsy" banner for non-installed visitors. On
 * Chromium it triggers the native install prompt; on iOS it opens the guide.
 * Hidden when already installed, when unsupported, or once dismissed.
 */
export function InstallBanner() {
  const { ready, isIOS, isStandalone, canPromptNative, promptNative } =
    useInstall();
  const [dismissed, dismiss] = useDismissed();
  const [guide, setGuide] = useState(false);

  if (!ready || isStandalone || dismissed) return null;
  if (!canPromptNative && !isIOS) return null;

  return (
    <>
      <div className={styles.banner}>
        <span className={styles.bannerIcon} aria-hidden="true">
          <Smartphone size={20} />
        </span>
        <span className={styles.bannerText}>
          <b>Install Pointsy</b> for one-tap access on your home screen.
        </span>
        <button
          type="button"
          className={styles.bannerBtn}
          onClick={() => (canPromptNative ? promptNative() : setGuide(true))}
        >
          Install
        </button>
        <button
          type="button"
          className={styles.bannerClose}
          onClick={dismiss}
          aria-label="Dismiss install prompt"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {guide ? <InstallGuide onClose={() => setGuide(false)} /> : null}
    </>
  );
}
