import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface InstallState {
  /** True once the store has read the client environment (SSR yields false). */
  ready: boolean;
  isIOS: boolean;
  /** Already running as an installed app — nothing to prompt. */
  isStandalone: boolean;
  /** Chromium fired `beforeinstallprompt`, so we can show a native prompt. */
  canPromptNative: boolean;
}

// A tiny module-level store: detect once, subscribe components via
// useSyncExternalStore (so there's no set-state-in-effect, and a late-mounting
// component still sees a `beforeinstallprompt` that fired earlier).
let deferred: BeforeInstallPromptEvent | null = null;
let isIOS = false;
let isStandalone = false;
let initialized = false;
const subscribers = new Set<() => void>();

const SERVER_SNAPSHOT: InstallState = {
  ready: false,
  isIOS: false,
  isStandalone: false,
  canPromptNative: false,
};
let snapshot: InstallState = SERVER_SNAPSHOT;

function rebuild() {
  snapshot = {
    ready: true,
    isIOS,
    isStandalone,
    canPromptNative: !!deferred,
  };
}

function notify() {
  rebuild();
  subscribers.forEach((cb) => cb());
}

function init() {
  if (initialized) return;
  initialized = true;
  isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
  rebuild();
}

function subscribe(cb: () => void) {
  init();
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/** Cross-platform "can we install this PWA, and how?" state. */
export function useInstall(): InstallState & {
  promptNative: () => Promise<void>;
} {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
  return {
    ...state,
    promptNative: async () => {
      if (!deferred) return;
      await deferred.prompt();
      deferred = null;
      notify();
    },
  };
}
