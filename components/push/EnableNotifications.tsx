"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { subscribePushAction, unsubscribePushAction } from "@/app/actions/push";
import styles from "./push.module.css";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type Status = { supported: boolean; subscribed: boolean } | null;

export function EnableNotifications() {
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
    <div className={styles.wrap}>
      {status.subscribed ? (
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className={styles.off}
        >
          <BellOff size={18} aria-hidden="true" />
          {busy ? "Working…" : "Turn off notifications"}
        </button>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className={styles.on}
        >
          <Bell size={18} aria-hidden="true" />
          {busy ? "Working…" : "Enable notifications"}
        </button>
      )}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
