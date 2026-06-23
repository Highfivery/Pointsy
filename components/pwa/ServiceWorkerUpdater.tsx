"use client";

import { useEffect } from "react";

/**
 * Keeps the installed PWA current. Serwist revisions its precache every build
 * and the SW uses skipWaiting + clientsClaim, but a running app keeps serving
 * the old bundle until it's reloaded. This checks for a newer service worker on
 * load and whenever the app regains focus, and reloads once the new one takes
 * control — so each release reaches the installed app automatically.
 */
export function ServiceWorkerUpdater() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const sw = navigator.serviceWorker;
    let reloading = false;
    // Only reload on an *update* (a controller already exists), never on the
    // very first install — that would reload immediately after first load.
    const hadController = Boolean(sw.controller);

    const onControllerChange = () => {
      if (reloading || !hadController) return;
      reloading = true;
      window.location.reload();
    };

    const checkForUpdate = () => {
      void sw
        .getRegistration()
        .then((reg) => reg?.update())
        .catch(() => {});
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    sw.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);
    checkForUpdate();

    return () => {
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
