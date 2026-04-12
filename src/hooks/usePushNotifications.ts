/**
 * Хук для Web Push уведомлений в PWA СтарКидс.
 */
import { useState, useEffect, useCallback } from "react";
import func2url from "../../backend/func2url.json";

const PUSH_URL = (func2url as Record<string, string>)["push-notify"];

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get_public_key" }),
  });
  const data = await res.json();
  return data.public_key || "";
}

async function saveSubscription(sub: PushSubscription, parentId?: number, childId?: number) {
  const json = sub.toJSON();
  await fetch(PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "subscribe",
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      parent_id: parentId ?? null,
      child_id: childId ?? null,
      user_agent: navigator.userAgent,
    }),
  });
}

export type PushStatus = "unsupported" | "denied" | "granted" | "default" | "loading";

export function usePushNotifications(opts?: { parentId?: number; childId?: number }) {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checking, setChecking] = useState(true);

  const isSupported = typeof window !== "undefined" &&
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  const isTelegram = () => {
    const d = window.Telegram?.WebApp?.initData;
    return typeof d === "string" && d.length > 0;
  };

  useEffect(() => {
    if (isTelegram() || !isSupported) {
      setStatus("unsupported");
      setChecking(false);
      return;
    }
    setStatus(Notification.permission as PushStatus);

    navigator.serviceWorker.getRegistration("/sw.js").then(async (reg) => {
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      setStatus(permission as PushStatus);
      if (permission !== "granted") return false;

      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) { console.error("[push] no vapid key"); return false; }

      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await saveSubscription(sub, opts?.parentId, opts?.childId);
      setIsSubscribed(true);
      return true;
    } catch (e) {
      console.error("[push] subscribe error:", e);
      return false;
    }
  }, [opts?.parentId, opts?.childId]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(PUSH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsubscribe", endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (e) {
      console.error("[push] unsubscribe error:", e);
    }
  }, []);

  return { status, isSubscribed, isSupported, checking, subscribe, unsubscribe };
}
