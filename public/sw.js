// SplitRupee Production Service Worker (PWA Offline Engine v11)
const CACHE_NAME = "splitrupee-pwa-v11";
const RSC_CACHE_NAME = "splitrupee-rsc-v11";

// Lean precache list: fast installation in <500ms on mobile connections
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/dashboard",
  "/login",
  "/calculator",
  "/manifest.json",
  "/icon.svg"
];

// Standalone fallback HTML shell when offline and cache miss occurs
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>SplitRupee</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { min-height: 100vh; background: #0b1120; color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 32px 24px; max-width: 440px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .icon-wrap { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 18px; background: rgba(234,179,8,0.12); border: 1px solid rgba(234,179,8,0.3); display: flex; align-items: center; justify-content: center; color: #eab308; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #fff; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 44px; border-radius: 12px; background: #10b981; color: #064e3b; font-weight: 700; font-size: 14px; border: none; cursor: pointer; text-decoration: none; margin-bottom: 10px; transition: opacity .15s; }
    .btn:hover { opacity: 0.9; }
    .btn-secondary { background: #334155; color: #f8fafc; font-weight: 600; margin-bottom: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
    </div>
    <h1 id="title">Offline Mode Active</h1>
    <p id="desc">You are currently offline. If you are already signed in, your cached data is available on the dashboard.</p>
    <button class="btn" onclick="window.location.reload()">Check Connection</button>
    <a class="btn btn-secondary" id="action-btn" href="/dashboard">Go to Dashboard</a>
  </div>
  <script>
    try {
      var user = localStorage.getItem('splitrupee_session_user');
      if (!user) {
        document.getElementById('title').innerText = 'Internet Required for Login';
        document.getElementById('desc').innerText = 'You are currently offline. SplitRupee requires an active internet connection to authenticate and sign you in. Once signed in, you can use SplitRupee completely offline.';
        document.getElementById('action-btn').innerText = 'Open Free Split Calculator';
        document.getElementById('action-btn').href = '/calculator';
      }
    } catch(e) {}
    window.addEventListener('online', function() { window.location.reload(); });
  </script>
</body>
</html>`;

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
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload" });
            if (res && (res.ok || res.status === 200)) {
              await cache.put(url, res);
            }
          } catch (e) {
            console.warn("[SW] Precache failed for:", url, e);
          }
        })
      );
    })
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

  // Non-GET API mutations: clean cached API keys and let request execute
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

  // Detect HTML Page Navigation Requests FIRST (mode === "navigate" OR destination === "document" OR text/html)
  const isNavigation =
    request.mode === "navigate" ||
    request.destination === "document" ||
    (request.headers.get("accept") && request.headers.get("accept").includes("text/html"));

  // -------------------------------------------------------------
  // STRATEGY A: HTML Page Navigation
  // -------------------------------------------------------------
  if (isNavigation) {
    event.respondWith(
      (async () => {
        const canonical = getCanonicalUrl(request.url);

        // 1. If device is offline, DO NOT call fetch()!
        // In Android Chromium, calling fetch() on a navigation request when offline aborts the pipeline with ERR_FAILED.
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          try {
            const cache = await caches.open(CACHE_NAME);
            const cachedPage =
              (await cache.match(canonical, { ignoreSearch: true })) ||
              (await cache.match(request, { ignoreSearch: true })) ||
              (await cache.match(url.pathname, { ignoreSearch: true })) ||
              (await cache.match("/", { ignoreSearch: true })) ||
              (await cache.match("/dashboard", { ignoreSearch: true })) ||
              (url.pathname.startsWith("/groups/") ? await cache.match("/__shell__/group", { ignoreSearch: true }) : null) ||
              (url.pathname.startsWith("/join/") ? await cache.match("/__shell__/join", { ignoreSearch: true }) : null) ||
              (await cache.match("/offline", { ignoreSearch: true }));

            if (cachedPage) return cachedPage;
          } catch (e) {
            console.warn("[SW] Cache lookup failed during offline navigation:", e);
          }

          // Safe 200 OK HTML fallback
          return new Response(OFFLINE_FALLBACK_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }

        // 2. Device is online: fetch using request.url with a 2-second timeout race
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const networkRes = await fetch(request.url, {
            signal: controller.signal,
            credentials: "same-origin",
          });
          clearTimeout(timeoutId);

          if (networkRes && networkRes.ok) {
            const ct = networkRes.headers.get("content-type") || "";
            if (ct.includes("text/html")) {
              const cacheCopy = networkRes.clone();
              const shellCopy = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(canonical, cacheCopy);
                if (url.pathname !== "/") {
                  cache.put(url.pathname, shellCopy.clone());
                }
                if (url.pathname.startsWith("/groups/") && url.pathname !== "/groups/") {
                  cache.put("/__shell__/group", shellCopy);
                } else if (url.pathname.startsWith("/join/") && url.pathname !== "/join/") {
                  cache.put("/__shell__/join", shellCopy);
                }
              }).catch(() => {});
            }
            return networkRes;
          }
        } catch (err) {
          // Network failed, timed out, or connection dropped: fallback below
        }

        // 3. Network failed or timed out: serve from cache
        try {
          const cache = await caches.open(CACHE_NAME);
          const cachedPage =
            (await cache.match(canonical, { ignoreSearch: true })) ||
            (await cache.match(request, { ignoreSearch: true })) ||
            (await cache.match(url.pathname, { ignoreSearch: true })) ||
            (await cache.match("/", { ignoreSearch: true })) ||
            (await cache.match("/dashboard", { ignoreSearch: true })) ||
            (url.pathname.startsWith("/groups/") ? await cache.match("/__shell__/group", { ignoreSearch: true }) : null) ||
            (url.pathname.startsWith("/join/") ? await cache.match("/__shell__/join", { ignoreSearch: true }) : null) ||
            (await cache.match("/offline", { ignoreSearch: true }));

          if (cachedPage) return cachedPage;
        } catch (e) {
          console.warn("[SW] Cache lookup failed during fallback:", e);
        }

        return new Response(OFFLINE_FALLBACK_HTML, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      })()
    );
    return;
  }

  // -------------------------------------------------------------
  // STRATEGY B: API Requests (/api/): Strict Network-Only, NEVER cache
  // -------------------------------------------------------------
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      (async () => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          return new Response(
            JSON.stringify({
              ok: false,
              offline: true,
              message: "Network unavailable. SplitRupee offline mode is active.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        try {
          return await fetch(request);
        } catch {
          return new Response(
            JSON.stringify({
              ok: false,
              offline: true,
              message: "Network unavailable. SplitRupee offline mode is active.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      })()
    );
    return;
  }

  // -------------------------------------------------------------
  // STRATEGY C: Next.js RSC Flight / Data (?_rsc=... or rsc: 1)
  // -------------------------------------------------------------
  const isRscRequest =
    url.searchParams.has("_rsc") ||
    url.pathname.startsWith("/_next/data/") ||
    request.headers.get("rsc") === "1";

  if (isRscRequest) {
    event.respondWith(
      (async () => {
        const rscCache = await caches.open(RSC_CACHE_NAME);
        const norm = new URL(request.url);
        norm.searchParams.delete("_rsc");

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          const cached =
            (await rscCache.match(request)) ||
            (await rscCache.match(norm.toString()));
          if (cached) return cached;
          return new Response("", {
            status: 200,
            headers: { "Content-Type": "text/x-component" },
          });
        }

        try {
          const networkRes = await fetch(request.url);
          if (networkRes && networkRes.ok) {
            const clone = networkRes.clone();
            const cloneNorm = networkRes.clone();
            rscCache.put(request, clone).catch(() => {});
            rscCache.put(norm.toString(), cloneNorm).catch(() => {});
          }
          return networkRes;
        } catch {
          const cached =
            (await rscCache.match(request)) ||
            (await rscCache.match(norm.toString()));
          if (cached) return cached;

          return new Response("", {
            status: 200,
            headers: { "Content-Type": "text/x-component" },
          });
        }
      })()
    );
    return;
  }

  // -------------------------------------------------------------
  // STRATEGY D: Static Assets (_next/static, images, fonts, css, js)
  // -------------------------------------------------------------
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
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) {
          if (typeof navigator !== "undefined" && navigator.onLine) {
            fetch(request.url)
              .then((res) => {
                if (res && res.ok) cache.put(request, res);
              })
              .catch(() => {});
          }
          return cached;
        }

        if (typeof navigator !== "undefined" && !navigator.onLine) {
          return new Response("", { status: 404 });
        }

        try {
          const networkRes = await fetch(request.url);
          if (networkRes && networkRes.ok) {
            cache.put(request, networkRes.clone());
          }
          return networkRes;
        } catch {
          return new Response("", { status: 404 });
        }
      })()
    );
    return;
  }

  // -------------------------------------------------------------
  // STRATEGY E: Safe Default Fallback
  // -------------------------------------------------------------
  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(request);
        if (match) return match;
      } catch {}
      return new Response("", { status: 404 });
    })()
  );
});
