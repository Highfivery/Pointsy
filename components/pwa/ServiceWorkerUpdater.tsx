"use client";

import { useEffect } from "react";

/**
 * Keeps the installed PWA current. Serwist revisions its precache every build and
 * the SW uses skipWaiting + clientsClaim, but a running app keeps serving the old
 * bundle until something forces the new SW to take over and the page to reload.
 *
 * This:
 *  - checks for a newer service worker on load, on focus, and on an interval,
 *  - actively promotes any waiting/installed worker (postMessage + the SW's own
 *    skipWaiting), in case it didn't take over on its own,
 *  - reloads once the new worker takes control,
 * so each release reaches the installed app without a manual reinstall.
 *
 * (Note: iOS only refreshes a home-screen PWA's *icon* on reinstall — that part
 * can't be fixed from JS.)
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

    // Nudge a waiting/installed worker to activate immediately. The SW also calls
    // skipWaiting itself, but a worker that got stuck "waiting" won't — this
    // unsticks it.
    const promote = (reg: ServiceWorkerRegistration) => {
      reg.waiting?.postMessage({ type: "SKIP_WAITING" });
    };

    const watch = (reg: ServiceWorkerRegistration) => {
      promote(reg);
      reg.addEventListener("updatefound", () => {
        const next = reg.installing;
        next?.addEventListener("statechange", () => {
          if (next.state === "installed") promote(reg);
        });
      });
    };

    const check = () => {
      void sw
        .getRegistration()
        .then((reg) => {
          if (!reg) return;
          promote(reg);
          return reg.update();
        })
        .catch(() => {});
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    sw.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);
    void sw.ready.then(watch).catch(() => {});
    check();
    // Re-check periodically so a long-lived session still picks up a release.
    const interval = window.setInterval(check, 60_000);

    return () => {
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
