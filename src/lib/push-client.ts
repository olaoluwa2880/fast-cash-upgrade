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
  try {
    const inIframe = typeof window !== "undefined" && window.top !== window.self;
    if (inIframe) return { ok: false, reason: "Open the app in a real browser tab (not the preview) to enable notifications." };

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const inStandalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (isIos && !inStandalone) {
      return { ok: false, reason: "On iPhone, tap Share → Add to Home Screen, then open FastCredit from that icon to enable notifications." };
    }
    if (!canUseWebPush()) return { ok: false, reason: "This browser doesn't support push notifications." };

    const perm = await Notification.requestPermission();
    if (perm === "denied") return { ok: false, reason: "Notifications are blocked in your browser settings for this site." };
    if (perm !== "granted") return { ok: false, reason: perm };

    const cfg = await loadConfig();
    if (!cfg.vapidKey || !cfg.apiKey || !cfg.projectId) {
      return { ok: false, reason: "Push service isn't configured yet. Please contact support." };
    }

    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    const messaging = await getMessagingInstance();
    if (!messaging) return { ok: false, reason: "Messaging unsupported on this device." };

    const token = await getToken(messaging, {
      vapidKey: cfg.vapidKey,
      serviceWorkerRegistration: reg,
    });
    if (!token) return { ok: false, reason: "Couldn't obtain a device token." };

    await registerPushToken({
      data: { token, platform: "web", userAgent: navigator.userAgent },
    });

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
  } catch (e: any) {
    console.error("[push] enable failed", e);
    return { ok: false, reason: e?.message || "Unknown error enabling notifications" };
  }
}
