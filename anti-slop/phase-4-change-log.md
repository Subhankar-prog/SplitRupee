# Phase 4 Change Log

- **Project**: SplitRupee (`D:\splitrupee`)
- **Scope**: Workstreams A, B, C, and D (`F-04`, `F-05`, `F-06`, `F-15`, `F-16`, `F-19`, `F-20`, `F-21`)
- **Non-Modified Protected Areas**: Zero edits to `app/api/`, `prisma/`, `package.json`, auth/calculation math, UPI URI generation, or authenticated `/dashboard` and `/groups/[id]` layouts.

---

## 1. Files Created

| File | Category | Purpose |
|---|---|---|
| `lib/blogGuides.ts` | Workstream A (`F-05`) | Static typed guide data (`BLOG_GUIDES`, `getBlogGuideBySlug`) for the 3 SplitRupee guides (`how-to-split-goa-trip-expenses`, `flatmate-rent-and-groceries-guide`, `upi-deep-linking-explained`). |
| `app/blog/[slug]/page.tsx` | Workstream A (`F-05`) | Dedicated SSG guide article route with `generateStaticParams`, `generateMetadata`, `notFound()` fallback, and Back navigation. |
| `components/landing/ThemeScreenshot.tsx` | Workstream B | Eager Light/Dark screenshot component (`dark:hidden` / `hidden dark:block`) supporting optional responsive mobile showcase variants (`mobileLightSrc`, `mobileDarkSrc`) without hydration flash. |
| `public/images/showcase/*` (12 PNGs) | Workstream B | Real captured Light and Dark retina screenshots of SplitRupee (`hero-standing-light/dark.png`, `hero-standing-mobile-light/dark.png`, `group-passbook-light/dark.png`, `group-passbook-mobile-light/dark.png`, `expense-distribution-light/dark.png`, `upi-settle-light/dark.png`). |
| `lib/displayLabels.ts` | Workstream D (`F-20`, `F-21`) | Pure read-only UI formatters (`formatGroupType`, `formatSplitType`, `formatItineraryGroupType`, `isNepalDestination`) keeping internal DB enums and API contracts untouched. |
| `tests/blogGuides.test.ts` | Tests | Unit tests covering all 3 blog slugs, unknown slug null handling, and public `routeShell` matching for `/blog/[slug]`. |
| `tests/displayLabels.test.ts` | Tests | Unit tests verifying human-readable enum mapping and Nepal corridor matching without Indian city false positives. |
| `anti-slop/phase-4-implementation-plan.md` | Documentation | Phase 4 engineering, accessibility, and batch implementation plan. |
| `anti-slop/phase-4-landing-page-redesign-plan.md` | Documentation | Before/after structural blueprint for the Splitwise-inspired public landing page redesign. |
| `anti-slop/phase-4-risk-register.md` | Documentation | Business logic, UX, routing, accessibility, and regression risk register with post-implementation verification status. |
| `anti-slop/phase-4-change-log.md` | Documentation | File-by-file record of created, modified, and removed Phase 4 files. |
| `anti-slop/phase-4-implementation-report.md` | Documentation | Final Phase 4 completion, accuracy, accessibility, and verification report. |

---

## 2. Files Modified

| File | Workstream / Finding | Summary of Changes |
|---|---|---|
| `app/page.tsx` | Workstreams A, B, C, D (`F-04`, `F-06`, `F-16`, `F-20`, `F-21`) | Preserved logged-in `/` -> `/dashboard` redirect guard; redesigned public landing page with split Hero + responsive standing capture, interactive 5-tab Use Cases with sample ledger breakdown, 5-step `#how-it-works` flow, interactive 3-tab real product showcase in a framed canvas stage with unclipped Light/Dark/mobile assets, editorial `#features`, SplitRupee Pro callout (`"Available by request"`) + Free vs Pro comparison table, improved body/table/caption typography readability, and verifiable non-custodial trust section removing fabricated press quotes, `"14-Day Free Trial"`, unfinalized commercial prices, `"Excel"`, emojis, and buzzwords. |
| `components/Navbar.tsx` | Workstreams B, D (`F-21`) | Updated logged-out `!isAppRoute` header (`Product`, `Features`, `Pro`, `Resources` menu with `Escape`/outside-click close) and mobile menu links while leaving authenticated `isAppRoute` chrome untouched; raised remaining `text-[9px]` micro-labels cleanly. |
| `components/Footer.tsx` | Workstreams B, C (`F-16`) | Reorganized into clean 4-column public footer removing decorative `<Sparkles>` pill badges and marketing tag fluff. |
| `app/blog/page.tsx` | Workstreams A, C, D (`F-05`, `F-16`, `F-20`) | Wired all 3 `"Read Guide"` links to `/blog/${post.slug}` instead of `/calculator`; improved card description & metadata typography readability; removed `<Sparkles>` eyebrow pill, unused `Calendar` import, and UI em dashes. |
| `app/blog/[slug]/page.tsx` | Workstreams A, D (`F-05`) | Dedicated SSG guide article reader with improved body/list line height (`leading-7`) and clear readable CTA box. |
| `app/contact/page.tsx` | Workstreams A, C, D (`F-05`, `F-16`, `F-21`) | Replaced fake `setSent(true)` (`"Message Received!"`) submission and unverified `"2 hours"`/`"Instant reply"` claims with validation and a compact local draft preview building direct `mailto:` (`pandasubhankar24@gmail.com`), `https://wa.me/916372466462` (`+91 6372466462`), and single-line `Open Email App` / `Open WhatsApp` / `Copy Draft` buttons; wired Suspense `?topic=pro` preselection, clean readable form labels without tiny uppercase styling, and neutral placeholders. |
| `app/pro/page.tsx` | Workstreams A, C (`F-06`, `F-16`) | Removed `"14-Day Free Trial"`, `"Most Popular"`, Monthly/Yearly billing toggle, `Save 15%`, unfinalized commercial prices (`₹49`/`₹499`), `"Excel"`, `"Live Forex"`, `"Supercharge"`, and `"Pro Power"`; presented `"Available by request"` with `"Pro access is currently available by request. Pricing and billing details will be confirmed before activation."` and `"Request Pro Access"` -> `/contact?topic=pro`, aligned strictly to `isPro` enforcement with improved card and table readability. |
| `components/WhatsAppReminderModal.tsx` | Workstreams A, D (`F-06`, `F-21`) | Removed cosmetic `PRO` pill (`Sparkles` badge) from Free WhatsApp reminder drawer and raised micro-label sizing. |
| `components/ProfileSettingsModal.tsx` | Workstreams A, D (`F-06`, `F-21`) | Aligned Pro description copy to `"AI Receipt OCR & recurring bills"`, removed decorative `🎉` emoji, and raised `text-[9px]` micro-labels. |
| `app/about/page.tsx` | Workstreams C, D (`F-16`, `F-20`) | Removed `<Sparkles>` eyebrow capsule, redundant arrow icons, `"frictionless"`/`"Get Started Free"` buzzwords, unused icon imports, and UI em dashes. |
| `app/faq/page.tsx` | Workstream C (`F-16`, `F-19`) | Cleaned eyebrow capsule styling and removed unused icon imports. |
| `app/calculator/page.tsx` | Workstreams C, D (`F-16`, `F-21`) | Removed `🧾` emoji, `<Sparkles>` eyebrow pill, unused icon imports, and UI em dashes. |
| `app/forgot-password/page.tsx` | Workstream C (`F-16`) | Removed template decorative badge/arrow styling and refined copy clarity. |
| `app/dashboard/page.tsx` | Workstream C (`F-19`) | Removed unused `Sparkles` import left over from Phase 3 cleanup without changing dashboard layout or behavior. |
| `app/layout.tsx` | Workstreams C, D (`F-15`, `F-20`) | Cleaned `metadata.title` to remove UI em dash. |
| `public/manifest.json` | Workstreams C, D (`F-15`, `F-20`) | Aligned `"theme_color": "#28734D"`, `"background_color": "#F5F5EF"`, `"name"`, and `"description"` to frozen `DESIGN.md` tokens and removed em dash / `"effortlessly"`. |
| `public/icon.svg` | Workstream C (`F-15`) | Replaced neon-slate/cyan-gradient SVG and raw system text glyph with a forest green `#28734D` rounded tile and crisp vector `#F5F7F3` Rupee mark. |
| `components/auth/AuthLayout.tsx` | Workstream C (`F-16`) | Removed repeating 24px dot-grid radial pattern so auth screens sit cleanly on `--bg-canvas`. |
| `components/auth/GoogleAuthButton.tsx` | Workstream C (`F-19`) | Added optional `tabIndex` prop so both panes inside `ReferenceAuthCard` can reuse one shared component cleanly. |
| `components/auth/ReferenceAuthCard.tsx` | Workstreams C, D (`F-19`, `F-21`) | Replaced duplicated Google OAuth button markup in login and signup panels with `GoogleAuthButton`; raised `text-[9.5px]` helper label to `text-[11px]`. |
| `app/groups/page.tsx` | Workstream D (`F-20`) | Formatted raw `{g.type}` enum display cleanly via `formatGroupType(g.type)`. |
| `app/expenses/page.tsx` | Workstream D (`F-20`) | Formatted raw `{exp.splitType}` enum display cleanly via `formatSplitType(exp.splitType)` and removed fallback em dash. |
| `app/profile/page.tsx` | Workstream D (`F-21`) | Removed decorative `🎉` emoji in profile feedback copy. |
| `app/offline/page.tsx` | Workstream D (`F-20`) | Removed UI em dashes in offline recovery copy. |
| `lib/offlineSync.ts` | Workstream D (`F-20`) | Removed UI em dashes in offline activity description strings without altering queue behavior or breaking `offlineSync.test.ts`. |
| `app/itinerary/page.tsx` | Workstream D (`F-20`, `F-21`) | Formatted `{form.groupType}` / `{g.type}` via `formatItineraryGroupType` / `formatGroupType`, associated remaining `<label>` elements via `htmlFor`/`id`, replaced UI em dashes (`3A: 3 Tier AC` etc.) and emojis (`✨`, `📢`), gated Nepal border & INR 500 currency advisory behind `isNepalDestination(...)`, and replaced native `confirm()` with an accessible `role="alertdialog"` confirmation modal (`useDialogAccessibility`). |
| `components/AddMemberModal.tsx` | Workstream D (`F-21`) | Replaced dummy placeholder `"e.g. Rahul Sharma"` with `"e.g. Friend's full name"`. |
| `components/AddExpenseModal.tsx` | Workstream D (`F-20`, `F-21`) | Removed UI em dash and raised `text-[9px]` micro-label. |
| `components/ManageGroupModal.tsx` | Workstream D (`F-20`, `F-21`) | Removed UI em dashes and raised `text-[9px]` micro-label. |
| `components/RecurringExpensesModal.tsx` | Workstream D (`F-21`) | Raised `text-[9px]` micro-labels cleanly. |
| `components/TravelCopilotChat.tsx` | Workstream D (`F-20`, `F-21`) | Removed decorative status emojis (`💚`, `✏️`, `📡`) and UI em dashes cleanly. |

---

## 3. Files Removed (`F-19`)

Verified zero remaining imports across `app/`, `components/`, `lib/`, `tests/`, and `public/` prior to deletion:
- `components/Dashboard.tsx` (retired legacy dark glassmorphic dashboard unused by `app/dashboard/page.tsx`)
- `components/auth/TravelAuthBackground.tsx` (unused canvas particle backdrop)
- `components/CinematicItineraryLoader.tsx` (unused deprecated itinerary loader; `/itinerary` uses `MovieTrailerItineraryLoader.tsx`)
- `components/AbstractTravelCanvas.tsx` (unused canvas subcomponent imported only by `CinematicItineraryLoader.tsx`)

