// Client-side helper to request permission, obtain an FCM token, and register it.
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";
import { registerPushToken } from "./push.functions";

type Cfg = {
  apiKey: string; authDomain: string; projectId: string; storageBucket: string;
  messagingSenderId: string; appId: string; vapidKey: string;
};

let cfgPromise: Promise<Cfg> | null = null;
function loadConfig(): Promise<Cfg> {
  if (!cfgPromise) {
    cfgPromise = fetch("/api/public/firebase-config", { cache: "no-store" }).then((r) => r.json());
  }
  return cfgPromise;
}

let appInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return null;
  const cfg = await loadConfig();
  if (!cfg.apiKey || !cfg.projectId) return null;
  if (!appInstance) {
    appInstance = getApps()[0] ?? initializeApp(cfg);
  }
  if (!messagingInstance) {
    messagingInstance = getMessaging(appInstance);
  }
  return messagingInstance;
}

export function canUseWebPush(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function currentPermission(): NotificationPermission | "unsupported" {
  if (!canUseWebPush()) return "unsupported";
  return Notification.permission;
}

export async function enablePushNotifications(): Promise<{ ok: boolean; reason?: string }> {
  if (!canUseWebPush()) return { ok: false, reason: "unsupported" };
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: perm };

  const messaging = await getMessagingInstance();
  if (!messaging) return { ok: false, reason: "unsupported" };
  const cfg = await loadConfig();

  // Ensure our messaging SW is registered at root scope.
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  const token = await getToken(messaging, {
    vapidKey: cfg.vapidKey,
    serviceWorkerRegistration: reg,
  });
  if (!token) return { ok: false, reason: "no-token" };

  await registerPushToken({
    data: { token, platform: "web", userAgent: navigator.userAgent },
  });

  // Foreground messages: also show system notification via SW so it appears in the tray.
  onMessage(messaging, (payload) => {
    const d = (payload.data ?? {}) as Record<string, string>;
    const title = d.title || payload.notification?.title || "FastCredit";
    const body = d.body || payload.notification?.body || "";
    try {
      reg.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { url: d.url || "/" },
        tag: d.tag,
      });
    } catch {}
  });

  return { ok: true };
}
