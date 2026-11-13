# Phase 4 Risk Register & Regression Prevention Strategy

- **Scope**: Workstreams A, B, C, and D (`F-04` through `F-21`) in `D:\splitrupee`.
- **Test Baseline**: **16 test files, 112 passing tests** (must remain >= 112 passing with zero weakened assertions).

---

## 1. Business Logic Risks

| ID | Risk Description | Affected Files | Likelihood / Impact | Prevention & Mitigation |
|---|---|---|---|---|
| **BL-01** | Inaccurate Free vs Pro changes accidentally disable existing free features (exports, 127 currencies) or bypass existing `isPro` checks in AI OCR / Recurring bills. | `app/pro/page.tsx`, `app/page.tsx`, `components/AddExpenseModal.tsx`, `components/RecurringExpensesModal.tsx`, `app/api/expenses/scan-receipt/route.ts` | Medium / High | **Never alter backend enforcement or modal `isPro` guards.** Limit Batch A changes strictly to marketing copy, badges, and accurate documentation of what is already Free vs Pro. |
| **BL-02** | Modifying `lib/offlineSync.ts` activity log text (removing `\u2014` in `Pending sync` strings) breaks `tests/offlineSync.test.ts`. | `lib/offlineSync.ts`, `tests/offlineSync.test.ts` | Medium / Medium | Inspect `tests/offlineSync.test.ts` before editing `lib/offlineSync.ts:366,375`; update copy cleanly (`- Pending sync` or `(Pending sync)`) and run `vitest run` immediately after. |
| **BL-03** | Adjusting raw enum rendering (`TRIP`, `EQUAL`) changes submitted API payloads or Prisma writes. | `app/expenses/page.tsx`, `app/groups/page.tsx`, `app/itinerary/page.tsx` | Low / High | Add pure read-only display helpers (`formatGroupType(g.type)`, `formatSplitType(exp.splitType)`) applied solely in JSX text output; keep state values, `<option value="TRIP">`, and fetch payloads identical. |
| **BL-04** | Updating Nepal border readiness copy breaks destination-specific Nepal transit tests. | `app/itinerary/page.tsx`, `lib/destinationGroundEngine.ts` | Medium / High | Leave `lib/destinationGroundEngine.ts`, `lib/irctcData.ts`, and `lib/localGroundData.ts` untouched; gate the JSX readiness card and WhatsApp bulletin in `app/itinerary/page.tsx` cleanly using explicit destination checks. Verify `tests/destinationGroundEngine.test.ts` (14 tests) passes after Batch D. |

---

## 2. UX & Functional Risks

| ID | Risk Description | Affected Files | Likelihood / Impact | Prevention & Mitigation |
|---|---|---|---|---|
| **UX-01** | Logged-in users visiting `/` see layout flash or broken redirect after landing page redesign. | `app/page.tsx` | Low / High | Preserve the exact `useUser()` + `router.replace("/dashboard")` guard and loading state at the top of `app/page.tsx` before rendering public landing sections. Verify in Playwright with an active session cookie. |
| **UX-02** | Contact form honest composer confuses users if "Send via Email" or "Open WhatsApp" does not clearly summarize what happens next. | `app/contact/page.tsx` | Medium / Medium | Display inline validation errors on incomplete fields, show clear preview copy + both explicit channel actions (`Open Email Draft`, `Open WhatsApp Support`) and a `Copy Message` fallback with visible confirmation. Never show fake `"Message Received"` server claims. |
| **UX-03** | Mobile bottom padding or header height causes content overlap on logged-out pages or sticky public header overflow at `320px`. | `components/Navbar.tsx`, `app/page.tsx`, `app/globals.css` | Medium / Medium | Constrain all flex containers with `min-w-0`, keep `h-11` (`44px`) touch targets cleanly spaced in mobile header, and run `scrollWidth <= innerWidth` assertions across `320px`, `375px`, `430px`. |
| **UX-04** | Replacing `confirm()` in `/itinerary` breaks async deletion state or leaves orphan modal focus traps. | `app/itinerary/page.tsx` | Medium / Medium | Reuse `useDialogAccessibility` from `components/ui/primitives.tsx` matching `DeleteExpenseModal.tsx`, supporting `Escape` close, backdrop click close, focus restoration, and loading lock during delete. |

---

## 3. Accessibility Risks

| ID | Risk Description | Affected Files | Likelihood / Impact | Prevention & Mitigation |
|---|---|---|---|---|
| **A11Y-01** | New hero, use-case switcher, or Pro comparison badges fall below WCAG AA (`4.5:1` text / `3.0:1` UI) in either Light or Dark mode. | `app/page.tsx`, `app/pro/page.tsx`, `components/Footer.tsx` | Medium / High | Use strictly approved CSS tokens (`--brand-primary`, `--brand-ink`, `--accent-gold-ink` instead of gold fill for small text, `--text-primary`, `--text-secondary`, `--border-strong`), and validate rendered pairs programmatically in both themes. |
| **A11Y-02** | Keyboard navigation breaks on custom interactive tabs (`Use Cases`), public `Resources` dropdown (if added), or `GoogleAuthButton` when toggling between Login/Signup panes. | `app/page.tsx`, `components/Navbar.tsx`, `components/auth/ReferenceAuthCard.tsx`, `components/auth/GoogleAuthButton.tsx` | High / High | Use native `<button type="button">` with `aria-pressed` / proper `role="tablist"` + arrow/Enter support; ensure `GoogleAuthButton` accepts `tabIndex` so hidden auth panel stays out of tab order (`tabIndex={-1}`); ensure any nav dropdown closes on `Escape` and `Blur`/outside click. |
| **A11Y-03** | Raising `text-[9px]` micro-labels to `text-[11px]` causes badge wrapping inside compact Navbar or modal headers on `320px`. | `components/Navbar.tsx`, `components/ManageGroupModal.tsx`, `components/RecurringExpensesModal.tsx`, `components/WhatsAppReminderModal.tsx` | Medium / Low | Adjust line-height/padding cleanly (`px-2 py-0.5 leading-none`) and test `Navbar` on `320px` Light & Dark modes. |

---

## 4. Routing & Navigation Risks

| ID | Risk Description | Affected Files | Likelihood / Impact | Prevention & Mitigation |
|---|---|---|---|---|
| **RT-01** | Adding `/blog/[slug]` (if chosen) falls outside `PUBLIC_ROUTES` in `lib/routeShell.ts`, unexpectedly redirecting logged-out readers to `/login`. | `lib/routeShell.ts`, `app/blog/[slug]/page.tsx` | High / High | Inspect `lib/routeShell.ts` before adding any subroute; update `getShellMode` so `/blog/*` resolves to `"public"` and add unit tests covering `/blog` and `/blog/<slug>`. |
| **RT-02** | Anchor links (`/#features`, `/#how-it-works`) fail to scroll smoothly or fail when clicked from `/pro` or `/faq`. | `components/Navbar.tsx`, `app/page.tsx` | Low / Medium | Verify exact matching `id="features"` and `id="how-it-works"` exist on `app/page.tsx` sections and add `scroll-mt-20` so sticky top navbar does not cover section headings. |
| **RT-03** | Deleting `CinematicItineraryLoader.tsx`, `AbstractTravelCanvas.tsx`, `Dashboard.tsx`, or `TravelAuthBackground.tsx` breaks an overlooked import or test. | `components/` | Low / High | Grep across entire workspace (`app/`, `components/`, `lib/`, `tests/`, `public/`), delete one logical group at a time in Batch C, then immediately run `npm run typecheck && npm test && npm run build`. |
| **RT-04** | Editing `public/manifest.json` or `public/icon.svg` breaks PWA manifest registration or `/sw.js` precaching. | `public/manifest.json`, `public/icon.svg`, `public/sw.js` | Low / Medium | Keep exact filename `/icon.svg` and `/manifest.json`, validate JSON syntax, keep valid SVG `viewBox` & MIME structure, and test HTTP 200 load in Playwright + check `public/sw.js` references. |

---

## 5. Content Accuracy & Previous-Phase Regression Risks

| ID | Risk Description | Affected Files | Likelihood / Impact | Prevention & Mitigation |
|---|---|---|---|---|
| **CT-01** | Landing page redesign introduces invented metrics (`"10,000+ groups"`), unverified currency/export capabilities, or re-introduces em dashes (`\u2014`). | `app/page.tsx`, `app/pro/page.tsx`, `app/blog/*`, `app/about/page.tsx` | Medium / High | Run automated grep check for `\u2014`, `"14-Day"`, `"Most Popular"`, `"Excel"`, `"Financial Times"`, and unverified percentages after every batch. |
| **CT-02** | Shared public/authenticated `Navbar.tsx` or `globals.css` edits regress Phases 1-3 work (`/dashboard`, `/groups/[id]`, Light/Dark modals, focus rings). | `components/Navbar.tsx`, `app/globals.css` | Medium / High | Do **not** alter CSS design tokens in `globals.css` or the `isAppRoute` branch in `Navbar.tsx`. Run Playwright verification against both `/` (public) and `/dashboard` + `/groups/[id]` (authenticated) after Batches B and C. |

---

## 6. Post-Implementation Verification Status

| ID | Verification Outcome | Evidence |
|---|---|---|
| **BL-01** | Verified preserved | Zero edits to `app/api/expenses/scan-receipt/route.ts`, `prisma/schema.prisma`, or `RecurringExpensesModal.tsx` `isPro` checks. |
| **BL-02** | Verified green | `lib/offlineSync.ts` updated without em dashes; full `npm test` suite passes including `tests/offlineSync.test.ts`. |
| **BL-03** | Verified preserved | `lib/displayLabels.ts` formats JSX display text only; backend enums (`TRIP`, `HOME`, `COUPLE`, `OTHER`, `EQUAL`, `EXACT`, `PERCENTAGE`) unchanged. |
| **BL-04** | Verified green | `isNepalDestination` gates the itinerary border readiness banner cleanly; `tests/destinationGroundEngine.test.ts` remains passing. |
| **UX-01** | Verified in Playwright | Authenticated `/` redirects cleanly to `/dashboard` with zero layout overflow. |
| **UX-02** | Verified in Playwright | `/contact` enforces validation, preserves `?topic=pro` preselection, and builds direct `mailto:` / `wa.me` / clipboard drafts without fake server confirmation. |
| **UX-03** | Verified in Playwright | Zero horizontal overflow (`scrollWidth <= innerWidth + 1`) across `320px`, `375px`, `430px`, `768px`, `1280px`, `1440px` in Light & Dark modes. |
| **UX-04** | Verified implemented | `/itinerary` saved-trip delete replaces native `confirm()` with `role="alertdialog"` wired to `useDialogAccessibility` (`Escape` and backdrop close). |
| **A11Y-01 / A11Y-02 / A11Y-03** | Verified | Strict `DESIGN.md` tokens preserved, `GoogleAuthButton` honors `tabIndex` isolation, micro-labels raised above `9px`, and landmarks/keyboard `Tab` order verified. |
| **RT-01 / RT-02 / RT-03 / RT-04** | Verified | All 3 `/blog/[slug]` SSG routes resolve HTTP 200 in public shell, unknown slug returns 404, unused legacy files deleted with `tsc --noEmit` green, and `/manifest.json` + `/icon.svg` serve HTTP 200. |
| **CT-01 / CT-02** | Verified | Automated scans confirm zero UI em dashes, zero fabricated press quotes/trial claims, and `git diff --name-only app/api prisma package.json` is empty. |

