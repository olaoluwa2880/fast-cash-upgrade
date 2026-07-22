/* FastCredit — Firebase Cloud Messaging service worker.
   Handles push notifications when the app is backgrounded or closed.
   Loaded at the root scope so it can show system notifications for any page. */
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

const ready = fetch("/api/public/firebase-config", { cache: "no-store" })
  .then((r) => r.json())
  .then((cfg) => {
    firebase.initializeApp(cfg);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const data = payload.data || {};
      const title = data.title || payload.notification?.title || "FastCredit";
      const body = data.body || payload.notification?.body || "";
      self.registration.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: data.tag || undefined,
        data: { url: data.url || "/", ...data },
        vibrate: [120, 60, 120],
      });
    });
  })
  .catch(() => {});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if ("focus" in c) { try { await c.navigate(url); } catch {} return c.focus(); }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});

// keep the promise alive
self.__fcmReady = ready;
