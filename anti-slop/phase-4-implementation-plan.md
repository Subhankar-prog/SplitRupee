# Phase 4 Implementation Plan: Trust, Brand Identity, Content Quality & Landing Page Redesign

- **Project**: SplitRupee (`D:\splitrupee`)
- **Mode**: Antislop **DURING** (`DESIGN.md` approved Light & Dark themes as foundation)
- **Baseline Tests**: **16 test files, 112 passing tests** (`tsc --noEmit`: 0 errors, `npm run build`: 23 pages clean)
- **Scope**: Workstreams A, B, C, and D organized into four sequential, approval-gated batches (**Batch A**, **Batch B**, **Batch C**, **Batch D**).

---

## 1. Phase 4 Findings Audit (F-04 to F-21)

Note: Findings already resolved in Phases 1 through 3 (`F-01`, `F-02`, `F-03`, `F-07`, `F-08`, `F-09`, `F-10`, `F-11`, `F-12`, `F-13`, `F-14`, `F-17`, `F-18`) remain frozen and are preserved as regressions checks only.

### F-04: Fabricated Press Testimonials & Endorsements
- **Current status**: **Confirmed** (Critical / Antislop Hard Gate `R-18`, `R-36`, `R-38`, `C-5`)
- **Exact affected files**:
  - `app/page.tsx` (lines 463-505)
- **Relevant component or section**: Landing page Section 5 (`{/* 5. PRESS & USER TESTIMONIALS */}`)
- **Current behavior**: Displays three 5-star review cards attributed to `Financial Times`, `Economic Times`, and `Tech In Asia` containing synthetic marketing quotes referencing SplitRupee ("Goa villa and Thar rental", "1-tap UPI settlement", "3BHK flat in Koramangala") and buzzwords ("effortlessly", "effortless"). No evidence of press coverage or real customer reviews exists in the repository.
- **Proposed correction**: Remove the fabricated press review block and star ratings entirely. In Batch A (coordinated with Batch B Section 9), replace it with verifiable product trust facts grounded in actual source behavior: non-custodial NPCI UPI deep linking (zero fund custody), paise-accurate settlement math (`lib/money.ts`, `lib/split.ts`, `lib/debt.ts`), offline-capable local queueing (`lib/offlineSync.ts`), and direct links to live interactive tools (`/calculator`) and transparent policies (`/terms`, `/privacy`, `/faq`). Unless the owner provides real, verifiable customer quotes, do not display a testimonial grid.
- **Expected visual or functional outcome**: Public landing page contains zero invented press attributions or unverified 5-star badges; credibility comes from verifiable product architecture and working tools.
- **Regression risks**: Removing the bottom band changes `/` page height and footer transition spacing; Batch B accounts for full section rhythm.
- **Required tests**: Public smoke test asserting absent fabricated publications (`Financial Times`, `Economic Times`, `Tech In Asia`), plus visual inspection at `320px-1440px`.

---

### F-05: Fake Contact Submission & Misleading Blog Links
- **Current status**: **Confirmed** (Critical / Antislop Hard Gate `R-24`, `R-26`, `R-36`, `C-2`)
- **Exact affected files**:
  - `app/contact/page.tsx` (lines 23-27, 58-84, 105-123)
  - `app/blog/page.tsx` (lines 6-37, 85-91)
- **Relevant component or section**: Contact form submit handler & success card; Blog article cards (`Read Guide` links).
- **Current behavior**:
  1. `app/contact/page.tsx` (`handleSubmit`, lines 23-27) runs only `setSent(true)` client-side without calling any API route or external handler (`app/api/` has no `/api/contact` endpoint), then tells users *"Message Received! Our team will review your note and get back to ... shortly"*. Additionally, lines 66 and 82 advertise *"Instant reply (10am - 8pm IST)"* and *"Response within 2 hours"*.
  2. `app/blog/page.tsx` lists 3 articles (`how-to-split-goa-trip-expenses`, `flatmate-rent-and-groceries-guide`, `upi-deep-linking-explained`), each defining a `slug` that is never used because `<Link href="/calculator">` on line 86 sends all 3 `"Read Guide"` links to `/calculator`.
- **Proposed correction**:
  1. **Contact Form (respecting backend non-modification gate)**: Because adding a backend endpoint requires explicit owner approval under Phase 4 rules, default Batch A Option 1 replaces the fake `"Message Received!"` state with a validated, honest **Direct Channel Composer**: validate Name, Email, Topic, and Message client-side, then offer working one-click `mailto:pandasubhankar24@gmail.com?subject=...&body=...` and `https://wa.me/916372466462?text=...` dispatch links plus a "Copy Message" fallback, while removing SLA guarantees (`"2 hours"`, `"Instant reply"`) unless verified. *(Alternative Option 2, gated on explicit approval: build a real `POST /api/contact` handler persisted in DB or SMTP.)*
  2. **Blog Guides**: Build real, readable guide content mapped to each existing `slug` (either via a client-safe article reader route `/blog/[slug]` or dedicated expandable guide view/anchor on `/blog`), preserving factual SplitRupee guidance (equal/exact/percentage splitting, recurring flatmate expenses, NPCI `upi://pay` deep links) with links to `/calculator` as a complementary tool rather than a silent redirect.
- **Expected visual or functional outcome**: Every user-submitted form performs an honest, transparent action; every blog link opens its actual named guide.
- **Regression risks**: Ensuring `app/blog/[slug]/page.tsx` (if added) is registered cleanly in `lib/routeShell.ts` (already safe because `isPublicRoute` checks exact public paths: note that `app/blog/[slug]` MUST be added to `PUBLIC_ROUTES` or prefix-matched in `lib/routeShell.ts` so logged-out readers are not redirected to `/login`!).
- **Required tests**: Unit test for `getShellMode("/blog/how-to-split-goa-trip-expenses", false) === "public"`; Playwright verification of Contact validation, honest handoff links, and all 3 Blog guide routes/views returning HTTP 200 without auth redirect.

---

### F-06: Contradictory Pricing, Trial Claims & Unbacked Pro Features
- **Current status**: **Confirmed** (High / Antislop Hard Gate `R-36`, `R-38`, `R-05`)
- **Exact affected files**:
  - `app/page.tsx` (lines 167, 340-460)
  - `app/pro/page.tsx` (lines 20-200)
  - Related minor copy alignment: `components/ProfileSettingsModal.tsx` (line 544), `components/WhatsAppReminderModal.tsx` (lines 139-141), `components/Navbar.tsx` (line 1113), `app/profile/page.tsx` (lines 278-285)
- **Relevant component or section**: Landing Pro showcase + 20-item checklist; `/pro` pricing card, trial CTA, and 6-card feature grid; Free vs Pro UI badges.
- **Current behavior (verified against codebase)**:
  - `prisma/schema.prisma` line 52 stores only `isPro Boolean @default(false)`. There is **no trial end date, no subscription table, and no checkout/payment API** anywhere under `app/api/`.
  - Yet `app/page.tsx:369` and `app/pro/page.tsx:150` advertise `"Start 14-Day Free Trial"` linking directly to `/signup` (which registers a free `isPro: false` account).
  - `app/page.tsx:167` claims `"100% Free forever"` right above the `₹49/month` Pro banner without clarifying "Core features are free forever; optional Pro tools are billed separately."
  - `app/pro/page.tsx:124` stamps `"Most Popular"` on the single Pro card displayed.
  - Feature accuracy mismatches against actual code:
    - **Actually Pro-gated in code**: AI Receipt OCR (`app/api/expenses/scan-receipt/route.ts:29`, `components/AddExpenseModal.tsx:312,979,1038`) and Automated Recurring Expenses (`components/RecurringExpensesModal.tsx:197`).
    - **Actually available Free in code today** (wrongly sold as Pro-only on `/pro` or `/`): Multi-currency selection (`lib/currencies.ts` has **127** currencies with **static `rateToINR` baselines**, not "live forex rates", and `AddExpenseModal` allows any user to use them), CSV & PDF exports (`lib/export.ts`; note **no `.xlsx` Excel binary exporter** exists), `/dashboard` `Expense Distribution` charts, WhatsApp reminder drawer (`WhatsAppReminderModal.tsx` is accessible to group members, only carrying a cosmetic `PRO` pill), and unlimited groups/expenses with zero ads.
- **Proposed correction**:
  1. Remove `"Start 14-Day Free Trial"` from `/` and `/pro`. Replace CTA copy with an honest state based on current product readiness (e.g., `"Create Free Account"` for core free features, and clearly mark Pro self-serve checkout as not yet enabled or link to `/contact` / account upgrade inquiry until billing is integrated (pending user decision in Section 5).
  2. Remove `"Most Popular"` ribbon from the single Pro pricing card on `/pro`.
  3. Clarify Free vs Pro comparison table on both `/` (Section 8) and `/pro`:
     - **Free Plan (`₹0`)**: Unlimited groups & expenses, equal/exact/percentage splits, graph debt simplification, 1-tap NPCI UPI links & QR codes, 127 baseline currency conversions, CSV & printable PDF ledger export, offline queue sync, category distribution overview.
     - **Pro (`isPro` accounts: currently AI OCR & Recurring Automation enabled in code)**: Gemini-powered Receipt Scanner (`AddExpenseModal`), Automated Monthly/Weekly Recurring Expenses (`RecurringExpensesModal`).
     - Remove unimplemented claims (`"Export to Excel"`, `"Live Forex rates"`, `"14-Day Free Trial"`, and artificial `"PRO"` badge on `WhatsAppReminderModal.tsx` unless backend-gated).
- **Expected visual or functional outcome**: Pricing, Free vs Pro comparison, and feature matrices on `/`, `/pro`, and account settings match actual implemented enforcement in the codebase.
- **Regression risks**: Do NOT modify `isPro` checks in `scan-receipt/route.ts` or `RecurringExpensesModal.tsx`: only align marketing copy and UI badges to match existing behavior.
- **Required tests**: Smoke check verifying `/` and `/pro` contain no `"14-Day Free Trial"`, `"Most Popular"`, or `"Excel"` claims, and checking both Monthly (`₹49`) / Yearly (`₹499`) toggle contrast and keyboard operation on `/pro`.

---

### F-15: PWA Icons & Manifest Alignment
- **Current status**: **Confirmed** (Medium / Antislop `R-01`, `R-02`, `R-16`, `R-20`, `R-23`)
- **Exact affected files**:
  - `public/manifest.json` (lines 1-19)
  - `public/icon.svg` (lines 1-18)
  - `app/layout.tsx` (lines 26-49, metadata & viewport)
- **Relevant component or section**: PWA web manifest, app icon SVG, HTML metadata title.
- **Current behavior**:
  - `public/manifest.json` uses dark slate `"background_color": "#020617"`, neon `"theme_color": "#10b981"`, an em dash `"name": "SplitRupee: Indian Split Expenses & Travel"`, and `"effortlessly"` in `description`.
  - `public/icon.svg` draws an outdated neon `#020617` -> `#0f172a` card with `#10b981 -> #14b8a6 -> #06b6d4` cyan-emerald gradient and raw Arial `<text>` glyph `₹`, mismatched with SplitRupee's forest green (`#28734D`) and warm ivory (`#F5F5EF`) identity (`DESIGN.md`).
  - `app/layout.tsx:27` uses an em dash in `<title>`: `"SplitRupee: Personal & Group Expense Management"`.
- **Proposed correction** *(subject to R-23 asset confirmation before editing)*:
  - Update `public/manifest.json`: clean title without em dash (`"SplitRupee: Group Expenses & UPI Settlements"`), remove `"effortlessly"`, align `"background_color": "#F5F5EF"` and `"theme_color": "#28734D"`.
  - Redesign `public/icon.svg` (keeping `sizes="any"` SVG + optional `192x192` / `512x512` PNG if requested) using SplitRupee's frozen forest green `#28734D` surface, subtle `#D9A86C` warm gold accent or clean crisp `#F5F7F3` crisp geometric `₹` mark matching the topbar logo container (`rounded-xl bg-[var(--brand-primary)]`).
  - Verify `public/sw.js` precaches/handles `/icon.svg` and `/manifest.json` without breaking PWA installability.
- **Expected visual or functional outcome**: Installed PWA splash screen, browser favicon, and tab title reflect SplitRupee's cohesive forest-and-ivory identity instead of the retired neon-slate theme.
- **Regression risks**: Changing `manifest.json` or `icon.svg` paths could break browser install prompts if `sizes`/`type`/`src` become invalid; keeping `/icon.svg` path and valid SVG geometry preserves existing `layout.tsx` and manifest links cleanly.
- **Required tests**: JSON validation of `public/manifest.json`, SVG XML well-formedness check, HTTP 200 fetch of `/manifest.json` and `/icon.svg` in Playwright, plus inspecting icon rendering on `/`.

---

### F-16: Generic AI-Style Visual Patterns (Public Pages & Chrome)
- **Current status**: **Confirmed** (Medium / Antislop Purpose-Gate `R-01`, `R-04`, `R-07`, `R-08`, `R-09`, `R-14`)
- **Exact affected files**:
  - `app/page.tsx` (eyebrow `<Sparkles>` capsule badge, `ArrowRight` on CTAs, uniform 2x2 feature cards + uniform 20-tile checklist)
  - `app/pro/page.tsx` (`Sparkles` import, crown eyebrow pill, `ArrowRight`, identical 6-card grid)
  - `app/about/page.tsx`, `app/blog/page.tsx`, `app/contact/page.tsx`, `app/faq/page.tsx`, `app/calculator/page.tsx` (repetitive eyebrow capsule pills above H1s, `Sparkles` icons, `ArrowRight` defaults)
  - `components/Footer.tsx` (lines 23-32: decorative capsule badges `"UPI Enabled"` and `<Sparkles> Smart Bill OCR`)
  - `components/auth/AuthLayout.tsx` (lines 18-27: full-screen dot-grid radial pattern)
  - `app/dashboard/page.tsx` (line 32: unused `Sparkles` import from Phase 3)
  - *(Note: check `MovieTrailerItineraryLoader.tsx` & internal `AddExpenseModal`/`RecurringExpensesModal` `Sparkles` strictly for purpose vs AI decoration)*
- **Relevant component or section**: Public route page headers, feature grids, footer badges, auth backdrop pattern.
- **Current behavior**: Every public page (`about`, `blog`, `contact`, `faq`, `calculator`, `pro`, `/`) opens identically with a centered pill badge above an oversized underlined headline, followed by uniform icon-box cards and arrows on buttons. `Footer.tsx` renders an ornate pill pair under the brand tagline including `<Sparkles> Smart Bill OCR`. `AuthLayout.tsx` renders a repeating 24px dot-grid over all auth screens.
- **Proposed correction**:
  1. Remove repetitive `Sparkles` icons and decorative eyebrow capsules across public marketing pages (`/` hero, `about`, `blog`, `contact`, `faq`, `calculator`).
  2. Replace `ArrowRight` on secondary/static buttons where navigation direction is not needed; reserve crisp directional affordances strictly where moving through a workflow step adds clarity.
  3. Break uniform card grids on `/` (Batch B) and `/pro` (Batch A/C) into editorial sections with asymmetric text + realistic preview pairings, hairline dividers, and varied density.
  4. Replace `AuthLayout.tsx` generic dot-grid background with subtle tonal canvas framing (`bg-[var(--bg-canvas)]`) so auth cards sit cleanly on warm ivory / deep forest surfaces without "blueprint" texture (`R-07`).
  5. Simplify `Footer.tsx` left column by removing the decorative `Sparkles` badge pill and organizing clean scannable links.
- **Expected visual or functional outcome**: Pages read as an intentional editorial fintech product (SplitRupee) rather than an AI SaaS template.
- **Regression risks**: Checking `AuthLayout` spacing ensures `/login`, `/signup`, `/forgot-password`, and `/reset-password` preserve mobile/desktop centering and focus visibility.
- **Required tests**: Playwright responsive check across `/`, `/pro`, `/about`, `/blog`, `/contact`, `/faq`, `/calculator`, `/login`, and `/signup` in Light & Dark modes.

---

### F-19: Unused Legacy Components, Duplicate Assets & Dead Code
- **Current status**: **Confirmed** (Medium / Antislop Quality Lock `R-01`, `R-10`, `R-19`)
- **Exact affected files**:
  - `components/Dashboard.tsx` (353 lines, zero imports anywhere; uses retired dark glassmorphism `backdrop-blur-xl` + `#38bdf8`/`#f472b6`)
  - `components/auth/TravelAuthBackground.tsx` (473 lines, zero imports anywhere; heavy canvas loop)
  - `components/CinematicItineraryLoader.tsx` (only imported by nothing; internally imports `AbstractTravelCanvas.tsx`)
  - `components/AbstractTravelCanvas.tsx` (only imported by `CinematicItineraryLoader.tsx`)
  - `components/auth/GoogleAuthButton.tsx` (44 lines, zero imports; `ReferenceAuthCard.tsx` duplicates the Google SVG button markup at lines 494-518 & 776-802)
  - Unused imports verified in code: `Sparkles` in `app/dashboard/page.tsx:32`, `Calculator`/`Sparkles` or unused icons across public pages (`blog` imports unused `Calendar`, `pro` imports unused `Sparkles`, `Star`, `faq` imports unused `Sparkles`, `Smartphone`, `ShieldCheck`, `Zap`, `Users`, `ArrowRight`, `Search`, `contact` imports unused `Sparkles`, `Phone`, `about` imports unused `Users`, `Heart`, `Globe`, `calculator` imports unused `Percent`, `Receipt`, `ArrowRight`, `Share2`, `Sparkles`, `Footer` imports `Sparkles`).
- **Verification of zero dynamic/PWA/runtime dependencies**: Checked all files across `app/`, `components/`, `lib/`, `tests/`, and `public/sw.js`. None use dynamic `require()` or lazy `import()` for `Dashboard.tsx`, `TravelAuthBackground.tsx`, `CinematicItineraryLoader.tsx`, `AbstractTravelCanvas.tsx`, or `GoogleAuthButton.tsx`.
- **Proposed correction**:
  1. Safely delete dead legacy components (`Dashboard.tsx`, `TravelAuthBackground.tsx`) and (upon user confirmation in Batch C) deprecated loader pair (`CinematicItineraryLoader.tsx`, `AbstractTravelCanvas.tsx` since `/itinerary` exclusively uses `MovieTrailerItineraryLoader.tsx`).
  2. Refactor `ReferenceAuthCard.tsx` to import and reuse `GoogleAuthButton.tsx` (passing `tabIndex` prop if needed for toggle accessibility), eliminating duplicated SVG/button markup while keeping identical appearance and `tabIndex` behavior.
  3. Prune unused icon imports across `app/` and `components/`.
- **Expected visual or functional outcome**: Cleaner bundle/repo footprint, zero retired neon-glass dead components, zero duplicated Google auth button code.
- **Regression risks**: Removing `CinematicItineraryLoader` could fail only if external bookmarks/imports existed (none found). Reusing `GoogleAuthButton` inside `ReferenceAuthCard` MUST preserve `tabIndex={isToggled ? -1 : 0}` / `{isToggled ? 0 : -1}` keyboard isolation between login/signup panes!
- **Required tests**: `npm run typecheck`, `npm run build`, `npm test`, and Playwright keyboard `Tab` focus test on `/login` and `/signup`.

---

### F-20: Copywriting & Accessibility Refinements
- **Current status**: **Partially Resolved** (Low priority badge overall, with **Hard-Gate sub-items under `R-02` and `R-39`**)
  - *Already fixed in Phases 1-3*: Auth label/focus accessibility, Contact `htmlFor` bindings, modal focus traps, Add/Edit/ManageGroup/Calculator primary control `htmlFor` links (`calc-bill-amount`, `calc-num-people`, `faq-search`), Dashboard/Group hierarchy.
  - *Still Open (Confirmed)*:
    1. **UI Em Dashes (`—`) (`R-02`)**:
       - `app/layout.tsx:27` (`metadata.title`), `public/manifest.json:2` (`name`)
       - `app/about/page.tsx:39`, `app/blog/page.tsx:10`, `app/offline/page.tsx:210`
       - `app/itinerary/page.tsx:474`, `1643-1651` (train class select labels)
       - `components/AddExpenseModal.tsx:314`, `components/ManageGroupModal.tsx:692,720`, `components/TravelCopilotChat.tsx:115,117,166,216`
       - `lib/offlineSync.ts:366,375` (queued offline activity details string shown in Activity feed)
       *(Note: `app/expenses/page.tsx:355` fallback `"—"` when exchange rate missing -> replace with `"N/A"` or `"-"`; leave internal prompt format tokens or regexes cleanly scoped without breaking tests.)*
    2. **Buzzwords & Generic CTAs (`R-15`, `R-16`)**:
       - `"Get Started Free"` (`app/about/page.tsx:90`)
       - `"effortlessly"` (`app/page.tsx:183,477`, `public/manifest.json:4`), `"frictionless"` (`app/about/page.tsx:26`), `"Supercharge your group budgeting with Pro Power"` (`app/pro/page.tsx:68-70`)
    3. **Raw Enums Shown Directly in UI (`C-1`)**:
       - `app/expenses/page.tsx:337`: renders `{exp.splitType}` (`EQUAL`, `EXACT`, `PERCENTAGE`) -> format cleanly via helper (`Equal`, `Exact`, `Percent`)
       - `app/groups/page.tsx:303`: renders `{g.type}` (`TRIP`, `HOME`, `COUPLE`, `OTHER`) -> format cleanly (`Trip`, `Home`, `Couple`, `Shared`)
       - `app/itinerary/page.tsx:2011,2277,2911`: renders `{form.groupType}`, `{g.type}` -> format cleanly
    4. **Remaining Unlinked `<label>` Tags (`R-39`)**:
       - `app/itinerary/page.tsx`: 15 form `<label>` tags (`lines 1356, 1377, 1398, 1419, 1440, 1469, 1505, 1532, 1614, 1661, 1705, 1768, 1788, 3045`) missing matching `htmlFor` + `id` attributes on controls/selects.
       - Check `app/contact/page.tsx:164` (`ThemeSelect` uses `aria-labelledby="contact-topic-label"` which is good; keep consistent).
       - `app/page.tsx:91`: category tabs on landing page missing `role="tablist"` / `role="tab"` + `aria-selected` or `aria-pressed` semantics.
- **Proposed correction**: Create lightweight display label formatters (`formatGroupType`, `formatSplitType`) in `lib/` (without modifying backend enums or DB), replace remaining UI em dashes and AI buzzwords, link the remaining unlinked labels in `app/itinerary/page.tsx`, and add proper `aria-pressed` / `tablist` semantics on landing use-case selectors.
- **Expected visual or functional outcome**: Zero raw `EQUAL`/`TRIP` enums exposed in UI, zero em dashes in visible UI copy, every form input programmatically associated with a label.
- **Regression risks**: Do NOT modify underlying enum values stored in Prisma or submitted to APIs (`TRIP`, `EQUAL`, etc.), and check `tests/offlineSync.test.ts` before changing `lib/offlineSync.ts:366,375`!
- **Required tests**: Check `tests/offlineSync.test.ts` assertions, add unit tests for display formatters, verify Axe/Playwright label association & em-dash scan = 0 across public/app TSX.

---

### F-21: Miscellaneous UX & Placeholder Content Issues
- **Current status**: **Confirmed** (Low / Antislop `R-04`, `R-06`, `R-23`, `R-38`)
- **Exact affected files**:
  - **Decorative Emojis**: `app/page.tsx:57-60` (`🌴`, `🏠`, `💖`, `🍕`), `app/calculator/page.tsx:72` (`🧾`), `app/profile/page.tsx:214` & `components/ProfileSettingsModal.tsx:221` (`🎉`), `app/itinerary/page.tsx:567,589,595` (`✨`, `📢`), `components/TravelCopilotChat.tsx:65,67,115,166,216` (`💚`, `✏️`, `📡`). *(Keep country flag data in `lib/currencies.ts` & optional WhatsApp message template readability in `WhatsAppReminderModal.tsx` where external chat users expect WhatsApp formatting, or replace UI-button/toast emojis with Lucide icons.)*
  - **Hardcoded Nepal Border Advice on All Trips**: `app/itinerary/page.tsx` lines 589, 595, and 2173-2181 display *"Indian ₹100/₹200 notes accepted; ₹500 prohibited in Nepal"* and *"Mountain transit operating at safe 20-35 km/h"* even when planning beach/city trips like Goa, Mumbai, or Jaipur. Note that `app/groups/[id]/page.tsx` does **not** currently show this Nepal border card directly (only links to itinerary).
  - **Dummy / Placeholder Names**:
    - `app/contact/page.tsx:138` (`placeholder="Aarav Sharma"`, `aarav@example.com`), `components/AddMemberModal.tsx:280` (`placeholder="e.g. Rahul Sharma"`): replace with neutral illustrative hints (`"Your full name"`, `"name@example.com"`, `"e.g. Friend's full name"`).
    - `components/GoogleAuthModal.tsx:32` (`Aarav Sharma` simulated picker entry): review whether to neutralize label as a clearly indicated demo profile option without disturbing Google mock flow.
    - `app/page.tsx` & `app/faq/page.tsx` (`Diya`, `Kabir`, `Aarav`): in Batch B landing previews & FAQ, label example scenarios transparently as sample ledger illustrations (no fake persona avatars).
  - **Tiny Micro-Labels (`text-[9px]`)**: 12 occurrences (`AddExpenseModal.tsx:980`, `ManageGroupModal.tsx:630`, `Navbar.tsx:436,789,838,914,956,1009,1113`, `ProfileSettingsModal.tsx:540`, `RecurringExpensesModal.tsx:266,486`, `WhatsAppReminderModal.tsx:139`) -> raise badge/timestamp floor to `text-[11px]` (`text-xs` where room permits; compact unread counter badges cleanly sized `text-[10px]` min `18px` circle).
  - **Native `confirm()` Dialog**: `app/itinerary/page.tsx:970` (`if (!confirm("Are you sure you want to delete this saved itinerary?")) return;`) -> replace with accessible in-app confirmation modal matching `DeleteExpenseModal` / `ExitGroupModal` (`role="alertdialog"` / `useDialogAccessibility`, `Escape` close, focus return).
- **Expected visual or functional outcome**: Clean, adult fintech tone without scattered emojis, context-accurate itinerary advisories, readable badges >= `11px`, and keyboard-accessible itinerary deletion confirmation.
- **Regression risks**: Do not alter Nepal itinerary logic for genuine Nepal queries in `destinationGroundEngine.ts`, `irctcData.ts`, or `localGroundData.ts` (those pass existing 14 tests in `tests/destinationGroundEngine.test.ts`!). Only scope the UI readiness banner in `app/itinerary/page.tsx:589,595,2149-2182` conditionally based on destination terrain/country.
- **Required tests**: Existing 14 `destinationGroundEngine.test.ts` tests remain 100% green; Playwright check on `/itinerary` (non-Nepal vs Nepal readiness card + delete confirmation dialog keyboard Escape & Confirm).

---

## 2. Batch-Wise Implementation Plan

Each batch is strictly scoped and pauses for explicit user review and approval before moving forward.

### Batch A: Trust & Product Accuracy (`F-04`, `F-05`, `F-06`)
- **Files**: `app/contact/page.tsx`, `app/blog/page.tsx` (plus `app/blog/[slug]/page.tsx` if routed guides selected), `lib/routeShell.ts` (if adding `/blog/[slug]`), `app/pro/page.tsx`, `app/page.tsx` (removing F-04 press quotes + F-06 `"14-Day Free Trial"` / inaccurate Pro bullets right away if done standalone before Batch B, OR coordinated seamlessly), `components/ProfileSettingsModal.tsx`, `components/WhatsAppReminderModal.tsx`.
- **Execution steps**:
  1. Replace fake Contact submission with validated direct dispatch options (`mailto:` + WhatsApp deep link + message copy), removing unverified response-time SLAs.
  2. Fix Blog `"Read Guide"` destinations so each of the 3 guides opens full factual reading content instead of routing to `/calculator`.
  3. Reconcile Pro vs Free claims across `/pro`, `/`, and UI badges: remove `"14-Day Free Trial"`, `"Most Popular"`, `"Excel"` binary claim, and `"Live forex"` overclaim; document actual Free features (`127 baseline currencies`, CSV/PDF exports, unlimited groups, UPI settlements) vs actual `isPro`-gated features (`AI Receipt OCR`, `Automated Recurring Expenses`), plus clarify current billing/upgrade availability.
- **Checkpoint A**: Run `typecheck`, `test`, `build`, verify `/contact`, `/blog`, `/pro`, and `/` trust accuracy before requesting Batch B go-ahead.

### Batch B: Public Landing Page Redesign (Splitwise-Inspired Structure, SplitRupee Identity)
- **Files**: `app/page.tsx`, `components/Navbar.tsx` (logged-out public desktop & mobile header only), `components/Footer.tsx`, optional dedicated landing showcase subcomponents under `components/landing/` (strictly unused by `/dashboard`).
- **Strictly Untouched**: `/dashboard`, `/groups`, `/expenses`, `/activity`, `/profile`, and all Phase 1-3 authenticated internals.
- **Execution steps**:
  1. Redesign logged-out desktop & mobile header links cleanly (`Product` / `#how-it-works`, `Features` / `#features`, `Pro` / `/pro`, `Resources` -> `/calculator`, `/faq`, `/blog`, plus `Log In` and `Sign Up`). Preserve authenticated navbar behavior untouched.
  2. Implement the 10-section public landing architecture detailed in `anti-slop/phase-4-landing-page-redesign-plan.md`, using only verified F-04/F-05/F-06 facts and approved Light & Dark tokens.
  3. Refactor `Footer.tsx` to a crisp, organized public/legal layout removing decorative `Sparkles` pill noise.
- **Checkpoint B**: Run Playwright visual sweep across `320px`, `375px`, `430px`, `768px`, `1280px`, `1440px` in both Light and Dark modes, confirm logged-in `/` -> `/dashboard` redirect and `/dashboard` layout unchanged, and inspect screenshots before requesting Batch C approval.

### Batch C: Brand Consistency & Code Cleanup (`F-15`, `F-16`, `F-19`)
- **Files**: `public/manifest.json`, `public/icon.svg`, `components/auth/AuthLayout.tsx`, `components/auth/ReferenceAuthCard.tsx`, public pages (`app/about/page.tsx`, `app/calculator/page.tsx`, `app/contact/page.tsx`, `app/blog/page.tsx`, `app/faq/page.tsx`, `app/pro/page.tsx`), plus removal of dead legacy files (`components/Dashboard.tsx`, `components/auth/TravelAuthBackground.tsx`, and optional `CinematicItineraryLoader.tsx` + `AbstractTravelCanvas.tsx` after final confirmation) and unused imports across touched files.
- **Execution steps**:
  1. Update `public/icon.svg` and `public/manifest.json` after explicit user approval of icon/manifest direction (`R-23`).
  2. Strip AI template decoration (dot grid in `AuthLayout.tsx`, eyebrow `<Sparkles>` pills across public subpages, unnecessary button arrows).
  3. Consolidate `ReferenceAuthCard.tsx` onto `GoogleAuthButton.tsx` and delete verified-unused components.
- **Checkpoint C**: Verify PWA manifest, SVG icon render, `tsc --noEmit`, `npm test`, `npm run build`, and auth flow keyboard navigation before Batch D.

### Batch D: Content Quality & Accessibility (`F-20`, `F-21`)
- **Files**: `lib/displayLabels.ts` *(new small formatting helper)*, `app/layout.tsx`, `app/about/page.tsx`, `app/blog/page.tsx`, `app/offline/page.tsx`, `app/expenses/page.tsx`, `app/groups/page.tsx`, `app/calculator/page.tsx`, `app/profile/page.tsx`, `app/itinerary/page.tsx`, `app/contact/page.tsx`, `components/AddMemberModal.tsx`, `components/AddExpenseModal.tsx`, `components/ManageGroupModal.tsx`, `components/ProfileSettingsModal.tsx`, `components/RecurringExpensesModal.tsx`, `components/WhatsAppReminderModal.tsx`, `components/Navbar.tsx`, `components/TravelCopilotChat.tsx`, `lib/offlineSync.ts` *(coordinate with `tests/offlineSync.test.ts`!)*.
- **Execution steps**:
  1. Replace remaining UI em dashes (`—`) and buzzwords (`effortlessly`, `Supercharge`, `Pro Power`).
  2. Map raw enums (`TRIP`, `HOME`, `COUPLE`, `EQUAL`, `EXACT`, `PERCENTAGE`) through clean human-readable display formatters.
  3. Associate all remaining `<label>` elements with `htmlFor` / `id` in `app/itinerary/page.tsx`.
  4. Replace hardcoded Nepal border bulletin in `app/itinerary/page.tsx` for non-Nepal destinations, replace native `confirm()` with an accessible modal dialog, remove decorative UI emojis, clean dummy placeholders, and raise `text-[9px]` micro-labels to at least `11px` (`10px` only inside compact numeric counters).
- **Checkpoint D**: Final validation across full matrix, WCAG contrast audit, keyboard audit, and screenshot sign-off.

---

## 3. Global Validation Strategy

Every batch runs its relevant subset, and final sign-off requires the full gate:
1. **Static & Build Checks**:
   - `npm run typecheck` (`0` errors)
   - `npm test` (baseline **16 files / 112 passing tests**, plus new targeted unit tests for Batch A/D formatters & routeShell rules; zero weakened existing assertions)
   - `npm run build` (`prisma generate && next build`, exit `0`)
2. **Functional & Interactive Smoke Tests (Playwright)**:
   - Public routes HTTP 200 & console-error-free: `/`, `/pro`, `/about`, `/blog`, `/contact`, `/faq`, `/calculator`, `/terms`, `/privacy`, `/login`, `/signup`
   - Logged-in `/` redirect to `/dashboard` still immediate; `/dashboard` layout visually diffed to confirm zero unintended changes
   - Contact form validation + honest handoff dispatch links
   - Blog guide navigation + Back link
   - `/pro` billing cycle `Monthly` / `Yearly` switch & keyboard operability
   - `/manifest.json` & `/icon.svg` load cleanly with matching tokens
   - Keyboard Tab/Shift+Tab focus order and visible focus rings on public header, hero tabs, mobile menu drawer (`Escape` closes), modals, and itinerary delete confirmation dialog
3. **Responsive & Theme Matrix (Light & Dark Modes)**:
   - Viewports: `320px`, `375px`, `430px`, `768px`, `1280px`, `1440px`
   - Zero horizontal overflow (`scrollWidth <= innerWidth + 1`)
   - WCAG AA text (`>= 4.5:1`, large `>= 3.0:1`) and non-text (`>= 3.0:1`) programmatic check on any adjusted styles.

---

## 4. Decisions Requiring User Input Before Execution

1. **Batch A: Contact Form (`F-05`)**: Keep strictly frontend with honest `mailto:` + WhatsApp composer + copy fallback (preserving backend API freeze), **or** approve adding a real `POST /api/contact` backend endpoint (requires exception to "Do not modify backend APIs")?
2. **Batch A: Blog Guides (`F-05`)**: Should the 3 Blog articles open on dedicated sub-routes `/blog/[slug]` (extending `lib/routeShell.ts` public prefix) or expand cleanly inside `/blog`?
3. **Batch A: Pro Upgrade CTA (`F-06`)**: Since no live payment/checkout integration or trial timer exists yet, how should primary upgrade CTAs read on `/pro` and `/`? Recommended: show Free vs Pro transparently, remove "14-Day Free Trial", and route Pro inquiries to an honest "Request Pro Access / Contact" action or waitlist note until checkout is built.
4. **Batch B: Product Showcase Imagery (`R-23` & Section 5)**: Should Section 2/5 on the redesigned landing page use live interactive component previews/constructed authentic UI frames rendered from SplitRupee's real design tokens, or static captured PNG screenshots of the actual `/dashboard` & `/groups/[id]` views we built in Phase 3?
5. **Batch C: PWA Icon & Legacy Loader (`F-15`, `F-19`, `R-23`)**: Approve redesigning `public/icon.svg` to the `#28734D` forest + `#F5F7F3` crisp `₹` emblem, and confirm whether `CinematicItineraryLoader.tsx` + `AbstractTravelCanvas.tsx` (no longer used by `/itinerary`) may be removed alongside `Dashboard.tsx` and `TravelAuthBackground.tsx`.
