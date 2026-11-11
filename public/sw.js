// SplitRupee Production Service Worker (PWA Offline Engine v9)
const CACHE_NAME = "splitrupee-pwa-v9";
const RSC_CACHE_NAME = "splitrupee-rsc-v9";

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/dashboard",
  "/groups",
  "/expenses",
  "/activity",
  "/calculator",
  "/itinerary",
  "/profile",
  "/faq",
  "/pro",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/blog",
  "/login",
  "/signup",
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
          .filter((name) => name !== CACHE_NAME && name !== RSC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests cleanly
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle non-http requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Non-GET API mutations: let browser fail cleanly or execute normally
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

  // A. Static Assets (_next/static, fonts, icons, images): Stale-While-Revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
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

  // B. Next.js RSC Prefetch & Data Requests (?_rsc=... or RSC: 1 or /_next/data/...)
  // CRITICAL: Keep RSC Flight payloads in RSC_CACHE_NAME, NEVER in HTML CACHE_NAME under bare page URLs!
  const isRscRequest =
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/_next/data/") ||
    request.headers.get("rsc") === "1";

  if (isRscRequest) {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            const cloneNorm = networkRes.clone();
            caches.open(RSC_CACHE_NAME).then((rscCache) => {
              rscCache.put(request, clone);
              const norm = new URL(request.url);
              norm.searchParams.delete("_rsc");
              rscCache.put(norm.toString(), cloneNorm);
            });
          }
          return networkRes;
        })
        .catch(async () => {
          const rscCache = await caches.open(RSC_CACHE_NAME);
          const norm = new URL(request.url);
          norm.searchParams.delete("_rsc");
          const cached =
            (await rscCache.match(request)) ||
            (await rscCache.match(norm.toString()));
          if (cached) return cached;
          // Return network error so Next.js App Router gracefully triggers navigate fallback
          return Response.error();
        })
    );
    return;
  }

  // C. API Requests (/api/): Strict Network-Only, NEVER cache dynamic API responses in CacheStorage
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(async () => {
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

  // D. HTML Page Navigation (request.mode === "navigate"): Network-First + App-Shell Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          const ct = networkRes?.headers?.get("content-type") || "";
          if (networkRes && networkRes.status === 200 && ct.includes("text/html")) {
            const cacheCopy = networkRes.clone();
            const shellCopy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              const canonical = getCanonicalUrl(request.url);
              cache.put(canonical, cacheCopy);
              // Cache dynamic group & join shell templates so unvisited dynamic links load on refresh
              if (url.pathname.startsWith("/groups/") && url.pathname !== "/groups/") {
                cache.put("/__shell__/group", shellCopy);
              } else if (url.pathname.startsWith("/join/") && url.pathname !== "/join/") {
                cache.put("/__shell__/join", shellCopy);
              }
            });
          }
          return networkRes;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const canonical = getCanonicalUrl(request.url);
          const cachedPage =
            (await cache.match(canonical)) ||
            (await cache.match(url.pathname)) ||
            (url.pathname.startsWith("/groups/") ? await cache.match("/__shell__/group") : null) ||
            (url.pathname.startsWith("/join/") ? await cache.match("/__shell__/join") : null) ||
            (await cache.match("/offline"));

          if (cachedPage) return cachedPage;

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
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(request)) || Response.error();
    })
  );
});
