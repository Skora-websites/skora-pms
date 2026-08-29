/* SkoraCare Service Worker (PWA)
 *
 * - Caches the app shell (manifest, icons, login page) for instant startup
 * - Handles Web Push notifications for the SOS emergency dispatch
 * - Network-first for everything else (the app is live, not offline)
 */
const CACHE_NAME = "skoracare-shell-v1";
const SHELL = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first: only fall back to cache for the static shell assets.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Skip non-GET and cross-origin (e.g. API calls must always hit the server).
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  if (SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
  // Everything else (pages, RSC, assets) goes straight to the network.
});

/** Web Push notification → show the SOS alert even when the app is closed. */
self.addEventListener("push", (event) => {
  let data = { title: "SkoraCare", body: "New notification", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore malformed payload */
  }
  event.waitUntil(
    self.registration
      .showNotification(data.title, {
        body: data.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: data.tag || "skoracare",
        data: { url: data.url || "/" },
      })
      .catch(() => {})
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus() && client.navigate(url);
      }
      return self.clients.openWindow(url);
    })
  );
});
