// SplitRupee Production Service Worker (PWA Offline Engine)
const CACHE_NAME = "splitrupee-pwa-v1";

const PRECACHE_URLS = [
  "/",
  "/login",
  "/dashboard",
  "/groups",
  "/expenses",
  "/itinerary",
  "/manifest.json",
  "/icon.svg"
];

// 1. Install & Precache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate & Clean Up Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Strategy: Network-First with Offline Cache Fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST, PUT, DELETE)
  if (request.method !== "GET") {
    return;
  }

  // Handle Chrome extension or non-http requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Static Assets (_next/static, fonts, icons): Stale-While-Revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // HTML Page Navigation & API Data: Network-First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Only cache valid 200 responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed (User is offline)
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If it was a navigation request, return cached dashboard or root
        if (request.mode === "navigate") {
          const fallback = (await caches.match("/dashboard")) || (await caches.match("/"));
          if (fallback) return fallback;
        }

        return new Response(
          JSON.stringify({
            ok: false,
            offline: true,
            message: "You are currently offline. SplitRupee cached mode is active."
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" }
          }
        );
      })
  );
});
