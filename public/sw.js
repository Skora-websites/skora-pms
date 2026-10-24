/* SkoraCare Service Worker (PWA)
 *
 * - Caches the app shell (manifest, icons, login + offline fallback) for
 *   instant startup
 * - Handles Web Push notifications for the SOS emergency dispatch
 * - Network-first for everything else (the app is live, not offline), with
 *   the branded /offline page as the navigation fallback
 */
const CACHE_NAME = "skoracare-shell-v1";
const SHELL = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/login",
  "/offline",
];

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

// Network-first: cache for the static shell assets, branded offline page
// for failed navigations, straight to the network for everything else.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Skip non-GET and cross-origin (e.g. API calls must always hit the server).
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  if (SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Cache-first for hashed build assets (immutable per content hash): the
  // shell pages and the /offline fallback must render STYLED with no network.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/offline").then((fallback) => fallback ?? Response.error())
      )
    );
  }
  // Everything else (RSC payloads, assets) goes straight to the network.
});

/** Web Push notification → show the SOS alert even when the app is closed. */
self.addEventListener("push", (event) => {
  let data = { title: "SkoraCare", body: "New notification", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore malformed payload */
  }
  // `critical` marks emergency dispatch: the alert must not auto-dismiss and
  // the device must buzz even in silent-ish contexts.
  const critical = data.critical === true;
  event.waitUntil(
    self.registration
      .showNotification(data.title, {
        body: data.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png",
        tag: data.tag || "skoracare",
        requireInteraction: critical,
        vibrate: critical ? [200, 100, 200, 100, 200] : [100],
        actions: [{ action: "open", title: "Open" }],
        data: { url: data.url || "/" },
      })
      .catch(() => {})
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Any action button (or the body itself) opens the payload URL; a plain
  // "close" action just dismisses.
  if (event.action && event.action !== "open") return;
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
