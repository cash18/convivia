/* Convivia — PWA: installazione + notifiche push. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Convivia", body: "", path: "/", tag: "convivia" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      if (parsed && typeof parsed === "object") {
        payload = { ...payload, ...parsed };
      }
    }
  } catch {
    try {
      const t = event.data?.text();
      if (t) payload.body = t;
    } catch {
      /* ignore */
    }
  }

  const openPath = typeof payload.path === "string" && payload.path.startsWith("/") ? payload.path : "/";

  event.waitUntil(
    self.registration.showNotification(String(payload.title), {
      body: String(payload.body || ""),
      icon: "/pwa-icon/192",
      badge: "/pwa-icon/192",
      tag: String(payload.tag || "convivia"),
      data: { path: openPath },
      lang: "it",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.path || "/";
  const url = new URL(path, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
