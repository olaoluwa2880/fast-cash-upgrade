/* FastCredit — Web Push service worker (FCM data messages).
   Deliberately framework-free: the `push` listener is registered synchronously
   so notifications are never missed while an SDK boots. Registered under its
   own scope so it never conflicts with the app's offline worker at "/". */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { data: { body: event.data ? event.data.text() : "" } };
  }
  const data = payload.data || payload || {};
  const notification = payload.notification || {};
  const title = data.title || notification.title || "FastCredit";
  const body = data.body || notification.body || "";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || undefined,
      renotify: !!data.tag,
      requireInteraction: false,
      data: { url: data.url || "/" },
      vibrate: [120, 60, 120],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if ("focus" in c) {
          try { await c.navigate(url); } catch {}
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })(),
  );
});
