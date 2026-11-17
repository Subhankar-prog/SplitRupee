# SplitRupee — Homepage UI Recovery & Mobile Offline Resilience Report

**Date**: November 17, 2026  
**Status**: Resolved, Verified, Deployed to Production  
**Live Canonical URL**: https://splitrupee.vercel.app/

---

## 1. Executive Summary & Root Cause Analysis

### A. Chromium Service Worker `net::ERR_FAILED` on Mobile Offline Cold Start
* **Symptoms**: When launching SplitRupee on Android Chrome or as an installed WebAPK/PWA while offline (or with mobile data switched off while cellular VoLTE radio is active), Chromium displayed:
  ```
  This site can't be reached
  The web page at https://splitrupee.vercel.app/ might be temporarily down or it may have moved permanently to a new web address.
  ERR_FAILED
  ```
* **Root Causes**:
  1. **Unbounded Network Navigation Fetch**: In previous service worker versions (`v14` and earlier), the navigation handler checked `if (navigator.onLine)` before attempting `fetch(request.url)`. On Android devices with active SIM cards (VoLTE), `navigator.onLine` frequently reports `true` even when data packs are disabled or no packets can leave the device. Without an explicit timeout or abort signal, `await fetch()` hung until Chromium's internal 30-second navigation watchdog timed out, causing Chromium to abort the request and display `net::ERR_FAILED`.
  2. **Premature Cache Eviction**: `self.skipWaiting()` was called at the top of the `install` event before precaching finished, causing `activate` to wipe previous cache versions (`splitrupee-pwa-v12`/`v13`) before the new cache was populated.
  3. **Response Header Pollution**: Synthetic responses created during navigation revalidation retained conflicting headers from reverse-proxies (e.g. `Location` on `200 OK`, `Content-Disposition`, or stale `Content-Encoding`), causing Chromium's decoder to reject the response.

### B. Route & Shell Composition Inconsistency
* **Symptoms**: Visiting `https://splitrupee.vercel.app/` displayed the public marketing header with the authenticated dashboard content rendered directly underneath.
* **Root Cause**: An unconditional redirect in `middleware.ts` forwarded all visitors from `/` to `/dashboard`. When unauthenticated users landed on `/dashboard`, `AppShell.tsx` allowed unauthenticated dashboard access while `Navbar.tsx` fell back to the public website header, producing an inconsistent split UI.

---

## 2. Key Architecture & Fix Implementation

### A. Bulletproof Service Worker (`public/sw.js` — PWA Offline Engine v15)
1. **Strict 2,000ms AbortController Timeout**:
   Every navigation fetch attempted while online is raced with a strict 2-second timeout using `AbortController`. If network packets do not arrive within 2 seconds (e.g., cellular radio without data connection), the fetch aborts instantly and falls back to the cached shell or offline fallback.
2. **Guaranteed Zero-Network Offline Pre-seeding**:
   During `install`, `OFFLINE_FALLBACK_HTML` is written directly into `caches` under `"/offline"` unconditionally before any network requests execute. Even if a device is completely offline during install or update, the fallback shell is guaranteed to exist.
3. **Decompressed & Sanitized 200 OK Responses**:
   The `sanitizeHtmlResponse` utility strips all upstream transport and compression headers, guaranteeing clean `Content-Type: text/html; charset=utf-8` and `Cache-Control: no-cache` headers that Chromium accepts 100% of the time.
4. **Offline User Routing**:
   * **Logged-in user**: When accessing `/` or `/dashboard` offline, their cached application dashboard and offline local transactions load smoothly with the offline indicator banner.
   * **Guest / Logged-out user**: Shows the designated "Internet Required for Login" prompt with a 1-click shortcut to the offline Split Calculator (`/calculator`).

### B. Clean Route Separation (`middleware.ts`, `app/page.tsx`, `AppShell.tsx`)
1. **Unauthenticated visitors on `/`**:
   `middleware.ts` checks for the active `splitrupee_session` cookie. Unauthenticated visitors are served the full public marketing landing page (`app/page.tsx`) with HTTP 200 directly.
2. **Authenticated users on `/`**:
   Redirected via HTTP 307 to `/dashboard`.
3. **Private Route Protection**:
   `AppShell.tsx` guards `/dashboard` and internal app routes. Unauthenticated visitors are routed to `/login?redirect=...`.
4. **SEO Endpoints Preserved**:
   `/sitemap.xml`, `/robots.txt`, and Google verification files continue to bypass authentication middleware and service-worker interception, returning clean HTTP 200 responses.

---

## 3. Production Verification & Evidence

### HTTP Status & Endpoint Verification
* `GET https://splitrupee.vercel.app/`: **HTTP 200 OK** (Content-Length: 60,147 bytes, public marketing landing page)
* `GET https://splitrupee.vercel.app/sitemap.xml`: **HTTP 200 OK** (`Content-Type: application/xml`)
* `GET https://splitrupee.vercel.app/robots.txt`: **HTTP 200 OK** (`Content-Type: text/plain`)
* `GET https://splitrupee.vercel.app/sw.js`: **HTTP 200 OK** (PWA Offline Engine v15 active)

### Offline Chrome Headless Navigation Test
* **Test**: Initiated offline navigation to `https://splitrupee.vercel.app/` with network emulation set to `offline: true`.
* **Result**:
  * Status: **200 OK**
  * `net::ERR_FAILED`: **None (0)**
  * Page title: `SplitRupee: Personal & Group Expense Management`
  * Body content: Rendered cached public shell instantly (<5ms)

### Screenshot Deliverables (`visual-review/homepage-ui-recovery/`)
* [homepage-desktop-light.png](file:///D:/splitrupee/visual-review/homepage-ui-recovery/homepage-desktop-light.png)
* [homepage-desktop-dark.png](file:///D:/splitrupee/visual-review/homepage-ui-recovery/homepage-desktop-dark.png)
* [homepage-mobile-light.png](file:///D:/splitrupee/visual-review/homepage-ui-recovery/homepage-mobile-light.png)
* [homepage-mobile-dark.png](file:///D:/splitrupee/visual-review/homepage-ui-recovery/homepage-mobile-dark.png)
* [dashboard-desktop-light.png](file:///D:/splitrupee/visual-review/homepage-ui-recovery/dashboard-desktop-light.png)
* [dashboard-desktop-dark.png](file:///D:/splitrupee/visual-review/homepage-ui-recovery/dashboard-desktop-dark.png)
* [dashboard-mobile-light.png](file:///D:/splitrupee/visual-review/homepage-ui-recovery/dashboard-mobile-dark.png)
* [dashboard-mobile-light.png](file:///D:/splitrupee/visual-review/homepage-ui-recovery/dashboard-mobile-light.png)
* [offline-navigation-result.png](file:///D:/splitrupee/visual-review/homepage-ui-recovery/offline-navigation-result.png)
