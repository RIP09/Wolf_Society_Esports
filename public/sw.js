/* Wolf Society Esports — push notification + PWA install service worker (free, unlimited). */
const CACHE = "wse-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Pre-cache the shell so the installed app opens instantly offline.
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["/", "/logo.svg"]))
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
        ),
    ]),
  );
});

/* Network-first with cache fallback: always serve fresh content when online,
   and the last good copy when offline. */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(event.request, copy))
            .catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((hit) => hit || caches.match("/")),
      ),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Wolf Society Esports", body: "", url: "/news" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    // non-JSON payload — keep defaults
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Wolf Society Esports", {
      body: data.body || "",
      icon: "/logo.svg",
      badge: "/logo.svg",
      data: { url: data.url || "/news" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/news";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
