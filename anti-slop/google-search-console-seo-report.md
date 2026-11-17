# Google Search Console & Technical SEO Implementation Report

**Application**: SplitRupee  
**Production Domain**: https://splitrupee.vercel.app/  
**Status**: Ready for Manual Google Search Console Verification & Sitemap Submission  
**Build & Test Gate**: All 23 test suites passed (169/169 tests), TypeScript clean (`tsc --noEmit`), Next.js production build succeeded with static generation of `/sitemap.xml` and `/robots.txt`.

---

## 1. Summary of Changes

A complete production-grade technical SEO, canonical metadata, and indexing safety architecture was established for SplitRupee. Public marketing and utility pages are fully discoverable and indexable with rich OpenGraph and Twitter cards, while private financial ledgers, member groups, and authentication flows are protected with multi-layered `noindex, nofollow, nocache` safeguards.

### Files Modified & Created

| File | Change Type | Purpose |
| :--- | :--- | :--- |
| `app/layout.tsx` | Modified | Root layout metadata, canonical base, Google verification env support, OpenGraph, Twitter card, and JSON-LD schemas (`WebSite`, `Organization`, `SoftwareApplication`). |
| `app/sitemap.ts` | Created | Dynamic XML Sitemap generator serving only public canonical URLs at `/sitemap.xml`. |
| `app/robots.ts` | Created | Next.js Robots.txt configuration allowing public routes and disallowing private user routes at `/robots.txt`. |
| `.env.example` | Modified | Added `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` documentation for manual GSC setup. |
| `app/about/page.tsx` | Modified | Added canonical metadata, OpenGraph, and Twitter tags for About page. |
| `app/privacy/page.tsx` | Modified | Added canonical metadata, OpenGraph, and Twitter tags for Privacy Policy. |
| `app/terms/page.tsx` | Modified | Added canonical metadata, OpenGraph, and Twitter tags for Terms of Service. |
| `app/blog/page.tsx` | Modified | Enhanced metadata with canonical URL, OpenGraph, and Twitter tags. |
| `app/blog/[slug]/page.tsx` | Modified | Enhanced dynamic article metadata and added JSON-LD `BlogPosting` schema. |
| `app/calculator/layout.tsx` | Created | Public tool metadata, canonical `/calculator`, OpenGraph, Twitter. |
| `app/itinerary/layout.tsx` | Created | Public tool metadata, canonical `/itinerary`, OpenGraph, Twitter. |
| `app/pro/layout.tsx` | Created | Public pricing metadata, canonical `/pro`, OpenGraph, Twitter. |
| `app/faq/layout.tsx` | Created | Public FAQ metadata, canonical `/faq`, OpenGraph, Twitter. |
| `app/contact/layout.tsx` | Created | Public Contact metadata, canonical `/contact`, OpenGraph, Twitter. |
| `app/dashboard/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on user dashboard. |
| `app/groups/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on groups & group detail ledgers. |
| `app/expenses/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on expenses. |
| `app/activity/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on audit trail / activity feed. |
| `app/profile/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on user profile & settings. |
| `app/join/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on invite links (`/join/[code]`). |
| `app/login/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on login flow. |
| `app/signup/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on signup flow. |
| `app/forgot-password/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on password recovery. |
| `app/reset-password/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on token reset. |
| `app/offline/layout.tsx` | Created | **Indexing Safety**: `noindex, nofollow, nocache` on PWA offline fallback. |
| `tests/seoTechnical.test.ts` | Created | Automated unit test suite covering sitemap completeness, robots rules, metadata integrity, and indexing safeguards. |

---

## 2. Dynamic XML Sitemap (`/sitemap.xml`)

Generated dynamically via `app/sitemap.ts` at `https://splitrupee.vercel.app/sitemap.xml`.

### Included Canonical URLs (13 Public Pages)

1. `https://splitrupee.vercel.app/` (Priority: 1.0, Change Frequency: `daily`)
2. `https://splitrupee.vercel.app/calculator` (Priority: 0.9, Change Frequency: `weekly`)
3. `https://splitrupee.vercel.app/itinerary` (Priority: 0.9, Change Frequency: `weekly`)
4. `https://splitrupee.vercel.app/pro` (Priority: 0.8, Change Frequency: `weekly`)
5. `https://splitrupee.vercel.app/blog` (Priority: 0.8, Change Frequency: `weekly`)
6. `https://splitrupee.vercel.app/faq` (Priority: 0.7, Change Frequency: `monthly`)
7. `https://splitrupee.vercel.app/about` (Priority: 0.7, Change Frequency: `monthly`)
8. `https://splitrupee.vercel.app/contact` (Priority: 0.7, Change Frequency: `monthly`)
9. `https://splitrupee.vercel.app/blog/how-to-split-goa-trip-expenses` (Priority: 0.7, Change Frequency: `monthly`)
10. `https://splitrupee.vercel.app/blog/flatmate-rent-and-groceries-guide` (Priority: 0.7, Change Frequency: `monthly`)
11. `https://splitrupee.vercel.app/blog/upi-deep-linking-explained` (Priority: 0.7, Change Frequency: `monthly`)
12. `https://splitrupee.vercel.app/privacy` (Priority: 0.3, Change Frequency: `yearly`)
13. `https://splitrupee.vercel.app/terms` (Priority: 0.3, Change Frequency: `yearly`)

### Strictly Excluded Routes
- Private user financial data: `/dashboard`, `/groups`, `/groups/[id]`, `/expenses`, `/expenses/[id]`, `/activity`, `/profile`
- Authentication & invite endpoints: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/join/[code]`
- Service Worker fallback: `/offline`
- API routes: `/api/*`

---

## 3. Robots.txt Configuration (`/robots.txt`)

Generated dynamically via `app/robots.ts` at `https://splitrupee.vercel.app/robots.txt`.

### Rules Configured

```txt
User-Agent: *
Allow: /
Allow: /about
Allow: /calculator
Allow: /itinerary
Allow: /pro
Allow: /faq
Allow: /contact
Allow: /blog
Allow: /blog/
Allow: /privacy
Allow: /terms
Disallow: /api/
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /groups
Disallow: /groups/
Disallow: /expenses
Disallow: /expenses/
Disallow: /activity
Disallow: /activity/
Disallow: /profile
Disallow: /profile/
Disallow: /join/
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /offline

User-Agent: Googlebot
Allow: /
Allow: /about
Allow: /calculator
Allow: /itinerary
Allow: /pro
Allow: /faq
Allow: /contact
Allow: /blog
Allow: /blog/
Allow: /privacy
Allow: /terms
Disallow: /api/
Disallow: /dashboard
Disallow: /dashboard/
Disallow: /groups
Disallow: /groups/
Disallow: /expenses
Disallow: /expenses/
Disallow: /activity
Disallow: /activity/
Disallow: /profile
Disallow: /profile/
Disallow: /join/
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /offline

Sitemap: https://splitrupee.vercel.app/sitemap.xml
```

---

## 4. Metadata & SEO Implementation

### Homepage Metadata
- **Title**: `SplitRupee — Split Expenses, Manage Group Bills & Plan Trips`
- **Title Template**: `%s | SplitRupee` (applies clean brand suffix across all pages)
- **Description**: `Split expenses with friends, track shared bills, manage group settlements and plan trips with SplitRupee.`
- **Canonical URL**: `https://splitrupee.vercel.app/`
- **OpenGraph**: Type `website`, locale `en_IN`, title, description, and high-resolution hero showcase image (`1200x630`).
- **Twitter Card**: `summary_large_image` with full image and descriptive copy.

### Public Subpages
Every public page exports an explicit `alternates.canonical` pointing to its standard URL path, ensuring zero duplicate content penalties. Titles follow a consistent pattern: `<Primary Keyword / Benefit> — <Context> | SplitRupee`.

---

## 5. Search Engine Indexing Safety (Data Privacy Safeguards)

To ensure search engines never crawl or index private user financial balances, IOUs, member names, or phone numbers, private routes utilize dedicated layout-level metadata:

```ts
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};
```

This ensures that even if a private link is discovered:
1. Googlebot receives explicit HTTP/HTML instructions NOT to index the page (`noindex`).
2. Search engines will not follow links out of the private area (`nofollow`).
3. Google will not store a cached copy of personal balances (`nocache`, `noarchive`).
4. Google will not index receipt pictures or avatars (`noimageindex`).

Public pages inherit `robots: { index: true, follow: true }` from the root layout and are NOT affected by these private restrictions.

---

## 6. Structured Data (JSON-LD)

Implemented according to Schema.org standards without fabricating false reviews or artificial awards:

1. **`WebSite`** schema on root layout:
   - `@type`: `WebSite`
   - `@id`: `https://splitrupee.vercel.app/#website`
   - `name`: `SplitRupee`
   - `url`: `https://splitrupee.vercel.app`
   - `inLanguage`: `en-IN`

2. **`Organization`** schema on root layout:
   - `@type`: `Organization`
   - `@id`: `https://splitrupee.vercel.app/#organization`
   - `name`: `SplitRupee`
   - `url`: `https://splitrupee.vercel.app`
   - `logo`: `https://splitrupee.vercel.app/icon.svg`

3. **`SoftwareApplication`** schema on root layout:
   - `@type`: `SoftwareApplication`
   - `@id`: `https://splitrupee.vercel.app/#application`
   - `name`: `SplitRupee`
   - `applicationCategory`: `FinanceApplication`
   - `operatingSystem`: `Web, Android, iOS`
   - `offers`: Free tier (`price: "0"`, `priceCurrency: "INR"`)

4. **`BlogPosting`** schema on article pages (`/blog/[slug]`):
   - `@type`: `BlogPosting`
   - `headline`: Article title
   - `description`: Article summary
   - `mainEntityOfPage`: Article canonical URL
   - `publisher`: SplitRupee Organization

---

## 7. Instructions for Manual Google Search Console Verification

> **Note**: Search Console verification and sitemap submission must be performed manually by the site owner using Google Search Console. The application is completely wired and ready to render the verification tag.

### Step 1: Obtain HTML Tag from Google Search Console
1. Visit [Google Search Console](https://search.google.com/search-console).
2. Add a Property for `https://splitrupee.vercel.app/` (URL prefix).
3. Under **Other verification methods**, choose **HTML tag**.
4. Copy the verification code from the tag (the value inside `content="..."`, e.g. `google1234567890abcdef`).

### Step 2: Configure Environment Variable
In your Vercel Dashboard (or local `.env.local` for testing):
- Key: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- Value: `<your-verification-code>`
- Environment: Production, Preview, Development

Once redeployed with the variable set, Next.js automatically outputs:
```html
<meta name="google-site-verification" content="<your-verification-code>" />
```
*(If the environment variable is unset, the tag is omitted cleanly without rendering empty or placeholder values).*

### Step 3: Complete Verification in Search Console
1. Return to Google Search Console and click **Verify**.
2. Once verified, navigate to **Sitemaps** in the left sidebar.
3. Enter `sitemap.xml` in the **Add a new sitemap** input and click **Submit**.
4. Google will begin indexing the 13 canonical public pages.

---

## 8. Verification Results

- **Typecheck**: `npm run typecheck` passed cleanly (`tsc --noEmit`, exit code 0).
- **Unit Tests**: `vitest run` executed 23 test files (169 tests) with 100% pass rate.
  - Dedicated SEO test suite `tests/seoTechnical.test.ts` passed 27/27 assertions.
- **Production Build**: `npx next build` succeeded with code 0.
  - Route `/sitemap.xml` rendered as static XML.
  - Route `/robots.txt` rendered as static text.
  - All 29 pages generated and optimized cleanly.
