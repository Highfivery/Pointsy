"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { subscribePushAction, unsubscribePushAction } from "@/app/actions/push";
import styles from "./push.module.css";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const COPY: Record<"parent" | "kid", string> = {
  parent: "Get a heads-up the moment your child requests a reward.",
  kid: "Get a heads-up when you earn points or a reward is approved.",
};

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type Status = { supported: boolean; subscribed: boolean } | null;

export function EnableNotifications({
  audience = "parent",
}: {
  audience?: "parent" | "kid";
}) {
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!supported) {
        if (active) setStatus({ supported: false, subscribed: false });
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      const existing = reg ? await reg.pushManager.getSubscription() : null;
      if (active) setStatus({ supported: true, subscribed: Boolean(existing) });
    })();
    return () => {
      active = false;
    };
  }, []);

  // Render only once we know the state, push is configured, and it's supported.
  if (!VAPID_PUBLIC_KEY || !status || !status.supported) return null;

  async function enable() {
    const key = VAPID_PUBLIC_KEY;
    if (!key) return;
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications are blocked in your browser settings.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const json = sub.toJSON();
      const res = await subscribePushAction({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      if (res.ok) setStatus({ supported: true, subscribed: true });
      else setError("Could not save the subscription.");
    } catch {
      setError("Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePushAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus({ supported: true, subscribed: false });
    } catch {
      setError("Could not turn off notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="notif-heading">
      <span className={styles.icon} aria-hidden="true">
        <Bell size={20} />
      </span>
      <div className={styles.body}>
        <h2 id="notif-heading" className={styles.title}>
          Notifications
        </h2>
        <p className={styles.desc}>{COPY[audience]}</p>
        {error ? (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        ) : null}
      </div>
      <div className={styles.action}>
        {status.subscribed ? (
          <>
            <span className={styles.statusOn}>
              <Check size={16} aria-hidden="true" />
              On
            </span>
            <button
              type="button"
              onClick={disable}
              disabled={busy}
              className={styles.linkBtn}
            >
              {busy ? "Working…" : "Turn off"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className={styles.enableBtn}
            aria-label="Enable notifications"
          >
            {busy ? "Working…" : "Enable"}
          </button>
        )}
      </div>
    </section>
  );
}
