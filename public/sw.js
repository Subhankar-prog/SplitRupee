// SplitRupee Production Service Worker (PWA Offline Engine v7 - Zero-Stale-Cache Policy)
const CACHE_NAME = "splitrupee-pwa-v7";

const PRECACHE_URLS = [
  "/offline",
  "/manifest.json",
  "/icon.svg"
];

// Listen for message events (e.g. SKIP_WAITING from client)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

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

  // Handle non-http requests
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

  // B. Next.js RSC Prefetch & Data Requests (?_rsc=... or /_next/data/...)
  if (url.searchParams.has("_rsc") || url.pathname.startsWith("/_next/data/")) {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
              const norm = new URL(request.url);
              norm.searchParams.delete("_rsc");
              cache.put(norm.toString(), networkRes.clone());
            });
          }
          return networkRes;
        })
        .catch(async () => {
          const norm = new URL(request.url);
          norm.searchParams.delete("_rsc");
          const cached =
            (await caches.match(request)) ||
            (await caches.match(norm.toString()));
          if (cached) return cached;
          return new Response("", {
            status: 200,
            headers: { "Content-Type": "text/x-component" }
          });
        })
    );
    return;
  }

  // C. API Requests (/api/): Strict Network-Only, NEVER cache dynamic API responses in CacheStorage!
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .catch(async () => {
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

  // D. HTML Page Navigation (request.mode === "navigate"): Always Fresh from Network
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(async () => {
          // Fallback to offline page when completely disconnected from network
          const offlinePage = await caches.match("/offline");
          if (offlinePage) return offlinePage;

          return new Response(
            "<!DOCTYPE html><html><head><title>SplitRupee Offline</title></head><body style='background:#020617;color:#fff;font-family:sans-serif;text-align:center;padding:50px;'><h2>You are offline</h2><p>Please connect to the internet or reload once online.</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // E. Default fallback for other GET requests
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
