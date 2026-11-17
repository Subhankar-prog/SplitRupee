# SplitRupee — Critical Sitemap Endpoint Fix Report

**Date**: November 17, 2026  
**Environment**: Production (`https://splitrupee.vercel.app`)  
**Deployment Commit**: `53edd14`  

---

## 1. Executive Summary & Root Cause Diagnosis

### The Issue Reported
- Production URL `https://splitrupee.vercel.app/sitemap.xml` rendered the SplitRupee dashboard HTML in client browsers instead of an XML document.
- Google Search Console reported an `HTTP 404 Not Found` when attempting to fetch `/sitemap.xml`.

### Root Cause Analysis
Two distinct mechanisms were responsible for the observed failure:

1. **Missing Dynamic Sitemap Endpoint on Server (404 in Search Console)**:
   - Following an earlier revert of unrelated changes, `app/sitemap.ts` and `app/robots.ts` were absent from the repository.
   - When Googlebot or Google Search Console fetched `https://splitrupee.vercel.app/sitemap.xml` directly over HTTP (without executing a client-side Service Worker), the Next.js server had no route definition for `/sitemap.xml` or `/robots.txt`, correctly returning `HTTP 404 Not Found`.

2. **Service Worker Navigation Fallback Interception (Dashboard Render in Browsers)**:
   - When human users or browser sessions visited `https://splitrupee.vercel.app/sitemap.xml`, the active Service Worker intercepted the request because Chrome classified it as an HTML page navigation request (`request.mode === "navigate"`).
   - In `public/sw.js`, the cache-matching logic included `await cache.match("/dashboard")` as an indiscriminate fallback for any navigation miss.
   - Because `/sitemap.xml` was not cached, the Service Worker served the cached `/dashboard` HTML shell, masking the server's 404 and displaying the dashboard instead of raw XML.

---

## 2. Changes Implemented

### A. Next.js Dynamic Sitemap (`app/sitemap.ts`)
Created `app/sitemap.ts` conforming strictly to the Next.js App Router `MetadataRoute.Sitemap` contract.
- Production Canonical Base URL: `https://splitrupee.vercel.app`
- Exactly 13 approved public marketing, tool, and guide URLs:
  1. `https://splitrupee.vercel.app/` (Priority 1.0, Daily)
  2. `https://splitrupee.vercel.app/calculator` (Priority 0.9, Weekly)
  3. `https://splitrupee.vercel.app/itinerary` (Priority 0.9, Weekly)
  4. `https://splitrupee.vercel.app/pro` (Priority 0.8, Weekly)
  5. `https://splitrupee.vercel.app/blog` (Priority 0.8, Weekly)
  6. `https://splitrupee.vercel.app/faq` (Priority 0.7, Monthly)
  7. `https://splitrupee.vercel.app/about` (Priority 0.7, Monthly)
  8. `https://splitrupee.vercel.app/contact` (Priority 0.7, Monthly)
  9. `https://splitrupee.vercel.app/privacy` (Priority 0.3, Yearly)
  10. `https://splitrupee.vercel.app/terms` (Priority 0.3, Yearly)
  11. `https://splitrupee.vercel.app/blog/how-to-split-goa-trip-expenses` (Priority 0.7, Monthly)
  12. `https://splitrupee.vercel.app/blog/flatmate-rent-and-groceries-guide` (Priority 0.7, Monthly)
  13. `https://splitrupee.vercel.app/blog/upi-deep-linking-explained` (Priority 0.7, Monthly)
- Strictly excludes all private, authenticated routes (`/dashboard`, `/groups`, `/expenses`, `/activity`, `/profile`, `/join/`, `/api/*`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/offline`).

### B. Robots Configuration (`app/robots.ts`)
Created `app/robots.ts` returning `MetadataRoute.Robots`:
- Explicitly allows all public marketing, tool, and blog routes.
- Disallows all internal, private, and API routes (`/api/`, `/dashboard/`, `/groups/`, `/expenses/`, `/activity/`, `/profile/`, `/join/`, auth routes, `/offline`).
- Designates `sitemap: https://splitrupee.vercel.app/sitemap.xml`.

### C. Middleware Safeguards (`middleware.ts`)
Added an explicit bypass at the entry of `middleware.ts`:
```ts
if (
  pathname === "/sitemap.xml" ||
  pathname === "/robots.txt" ||
  pathname.startsWith("/google")
) {
  return NextResponse.next();
}
```
Ensures public crawler endpoints and Google Search Console verification files are never rewritten or redirected.

### D. Service Worker Passthrough (`public/sw.js`)
1. **Direct Network Passthrough**:
   Added a top-level bypass in the Service Worker `fetch` event handler before any navigation or caching logic:
   ```javascript
   if (
     url.pathname === "/sitemap.xml" ||
     url.pathname === "/robots.txt" ||
     url.pathname.startsWith("/google") ||
     url.pathname.endsWith(".xml") ||
     url.pathname.endsWith(".txt")
   ) {
     return; // Bypasses SW completely; browser fetches straight from network
   }
   ```
2. **Eliminated False Fallback**:
   Constrained the `/dashboard` fallback cache match so it only triggers for `/` and `/dashboard`, preventing non-app URLs from receiving the dashboard shell.
3. **Cache Version Bump**:
   Bumped cache version to `splitrupee-pwa-v14` so any stale browser caches are automatically purged.

---

## 3. Production HTTP Verification Evidence

All tests were performed via live HTTP requests to `https://splitrupee.vercel.app`:

### 1. `https://splitrupee.vercel.app/sitemap.xml`
```http
HTTP/1.1 200 OK
Content-Type: application/xml
Content-Length: 2298
Server: Vercel
X-Matched-Path: /sitemap.xml
X-Vercel-Cache: PRERENDER

<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://splitrupee.vercel.app/</loc>
<lastmod>2026-11-17T05:19:17.605Z</lastmod>
<changefreq>daily</changefreq>
<priority>1</priority>
</url>
... (13 total approved public URLs) ...
</urlset>
```
- **Status**: `200 OK`
- **Content-Type**: `application/xml`
- **Body**: Valid XML beginning with XML declaration and `<urlset>`. Exactly 13 URLs. No dashboard HTML.

### 2. `https://splitrupee.vercel.app/robots.txt`
```http
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 1085
Server: Vercel
X-Matched-Path: /robots.txt
X-Vercel-Cache: PRERENDER

User-Agent: *
Allow: /
...
Disallow: /api/
Disallow: /dashboard
...
Sitemap: https://splitrupee.vercel.app/sitemap.xml
```
- **Status**: `200 OK`
- **Content-Type**: `text/plain`
- **Sitemap Directive**: Present and points to canonical `/sitemap.xml`.

### 3. `https://splitrupee.vercel.app/google70dcc860ce3c9f26.html`
```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 53
Server: Vercel
X-Matched-Path: /google70dcc860ce3c9f26.html

google-site-verification: google70dcc860ce3c9f26.html
```
- **Status**: `200 OK`
- **Body**: Intact verification token.

### 4. `https://splitrupee.vercel.app/`
```http
HTTP/1.1 307 Temporary Redirect
Location: /dashboard
```
- **Status**: `307 Temporary Redirect` to `/dashboard`.

### 5. `https://splitrupee.vercel.app/dashboard`
```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```
- **Status**: `200 OK`
- Functional guest/user dashboard rendered properly.

---

## 4. Test & Build Suite Results

- `npm run typecheck` (`tsc --noEmit`): **Passed with 0 errors**.
- `npm test` (`vitest run`): **22 test files passed, 142 tests passed (100%)**.
- `npm run build` (`next build`): **Prisma generation, schema sync, static generation (29/29 routes including `/sitemap.xml` and `/robots.txt`) succeeded**.

---

## 5. UI & Business Logic Invariance

- **Zero UI Changes**: No styles, CSS files, component templates, dashboard layouts, modals, or color tokens were modified.
- **Zero Auth Changes**: Session tokens, login, signup, user context, and permission boundaries remain identical.
- **Zero Static Conflict**: No static conflicting files were placed in `public/`.
