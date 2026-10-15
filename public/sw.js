// SplitRupee Production Service Worker (PWA Offline Engine v4)
const CACHE_NAME = "splitrupee-pwa-v4";

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/dashboard",
  "/manifest.json",
  "/icon.svg"
];

// Helper: Normalize URL by stripping _t timestamp cache-busters
function getCanonicalUrl(urlString) {
  try {
    const u = new URL(urlString);
    u.searchParams.delete("_t");
    return u.toString();
  } catch {
    return urlString;
  }
}

// 1. Install & Precache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Fetch each resource with error isolation (so a single failed fetch doesn't abort install)
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload" });
            if (res && res.status === 200) {
              await cache.put(url, res);
            }
          } catch (e) {
            console.warn("[SW] Precache failed for:", url, e);
          }
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate & Clean Up Old Caches & Claim Clients Immediately
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

// 3. Fetch Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // When a mutation (POST, PUT, DELETE, PATCH) happens, invalidate cached API responses immediately
  if (request.method !== "GET") {
    if (url.pathname.startsWith("/api/")) {
      event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
          const keys = await cache.keys();
          return Promise.all(
            keys
              .filter((key) => new URL(key.url).pathname.startsWith("/api/"))
              .map((key) => cache.delete(key))
          );
        })
      );
    }
    return;
  }

  // Handle Chrome extension or non-http requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // A. Static Assets (_next/static, fonts, icons, images): Cache-First / Stale-While-Revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          // In background, revalidate if online
          fetch(request)
            .then((networkRes) => {
              if (networkRes && networkRes.status === 200) {
                cache.put(request, networkRes);
              }
            })
            .catch(() => {});
          return cached;
        }

        try {
          const networkRes = await fetch(request);
          if (networkRes && networkRes.status === 200) {
            cache.put(request, networkRes.clone());
          }
          return networkRes;
        } catch {
          return cached || new Response("", { status: 404 });
        }
      })
    );
    return;
  }

  // B. API Requests (/api/): Network-First with Normalized Offline Fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const canonicalUrl = getCanonicalUrl(request.url);
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Store under both the requested URL and the canonical (sans _t) URL
              cache.put(canonicalUrl, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed: Look up canonical URL or requested URL in cache
          const canonicalUrl = getCanonicalUrl(request.url);
          const cachedResponse = (await caches.match(canonicalUrl)) || (await caches.match(request));
          if (cachedResponse) {
            return cachedResponse;
          }

          return new Response(
            JSON.stringify({
              ok: false,
              offline: true,
              message: "Network unavailable. SplitRupee offline mode is active."
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          );
        })
    );
    return;
  }

  // C. HTML Page Navigation (request.mode === "navigate"): Network-First with Offline Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              // Also cache under pathname
              cache.put(url.pathname, responseClone.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline navigation fallback:
          // 1. Exact URL match
          let cached = await caches.match(request);
          if (cached) return cached;

          // 2. Pathname match (e.g. /dashboard or /groups)
          cached = await caches.match(url.pathname);
          if (cached) return cached;

          // 3. Fallback to cached /dashboard, /offline, or root /
          const fallback =
            (await caches.match("/dashboard")) ||
            (await caches.match("/offline")) ||
            (await caches.match("/"));

          if (fallback) return fallback;

          return new Response(
            "<!DOCTYPE html><html><head><title>SplitRupee Offline</title></head><body style='background:#020617;color:#fff;font-family:sans-serif;text-align:center;padding:50px;'><h2>You are offline</h2><p>Please connect to the internet or reload once online.</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // D. Default fallback for other GET requests
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
