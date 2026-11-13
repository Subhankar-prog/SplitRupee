# Phase 4 Landing Page Redesign Plan (`/` & Public Chrome)

- **Scope**: Public logged-out landing experience (`app/page.tsx`), public logged-out navigation (`components/Navbar.tsx`), and footer (`components/Footer.tsx`).
- **Structural Inspiration**: `https://secure.splitwise.com/` (layout clarity, calm editorial cadence, use-case-led hero pairing a concise statement + real product preview, plain-language explanation of group mechanics, and clean Pro vs Free separation).
- **Identity Lock**: Preserve SplitRupee's frozen Light (`#F5F5EF` / `#FFFFFF` / `#28734D` / `#D9A86C`) and Dark (`#141E19` / `#24342B` / `#91D2A4` / `#E5BA6B`) design tokens, `Manrope` headings/numerals, and `Inter` body text. Strictly **zero modifications** to authenticated `/dashboard` or internal group pages.

---

## 1. Current Landing Page Audit

| Area | Current Behavior (`app/page.tsx`, `Navbar.tsx`, `Footer.tsx`) | Antislop / UX Diagnosis |
|---|---|---|
| **Public Navbar (`Navbar.tsx`)** | `Features` (`/#features`), `Calculator` (`/calculator`), `Itinerary` (`/itinerary`), `Pro` (`/pro`), `FAQ` (`/faq`), Theme toggle, `Log In`, `Sign Up`. Compact mobile burger drawer mirrors these. | Missing a direct `Resources` entry/link to `/blog` and `/about` from top navigation; desktop nav separates `Log In` (hidden under `sm`) and `Sign Up`; fulfills functional routing well once organized into cleaner top-level labels (`Product`, `Features`, `Pro`, `Resources`, `Log In`, `Sign Up`). |
| **Hero (`app/page.tsx:66-174`)** | Centered text column with `<Sparkles>` capsule badge ("The Modern Split Tracker for India"), underlined H1, 4 pill buttons with emojis (`🌴`, `🏠`, `💖`, `🍕`), paragraph, 2 CTAs with `ArrowRight`, and checkmark strip ("100% Free forever"). No visual preview above the fold on desktop. | Stacked AI template signals: eyebrow badge + sparkle icon, emoji labels, underlined span decoration, wide centered vertical stack with empty horizontal flanks on `1280px`/`1440px`, and no immediate visual anchor showing what SplitRupee actually looks like. |
| **Core Features (`app/page.tsx:177-338`)** | 2x2 grid of four nearly identical white boxes (rounded icon tile + heading + paragraph + dark inset mockup box). | Copy-paste box uniformity (`R-14`). Every capability sits inside the exact same card geometry, creating visual fatigue rather than guiding the reader through a product workflow. |
| **Pro Showcase (`app/page.tsx:341-406`)** | Single large bordered card promoting `₹49/month`, `"Start 14-Day Free Trial"` (`F-06`), `"100+ live forex"`, and `"Excel ledgers"`. | Claims unimplemented features and a non-existent 14-day trial (`F-06`); links to `/signup` which creates a free account. |
| **Checklist Grid (`app/page.tsx:409-461`)** | 4-column grid of 20 miniature pill-border boxes (`"The whole nine yards"`), mixing Free & Pro items at small scale. | Dense mosaic of uniform boxes hard to scan quickly on mobile (`grid-cols-2` truncates text with `truncate`). Fails cleanly comparing what Free includes vs what Pro adds. |
| **Testimonials (`app/page.tsx:464-505`)** | 3-card row attributing fabricated 5-star reviews to `Financial Times`, `Economic Times`, `Tech In Asia`. | Critical trust violation (`F-04`, `R-18`, `R-36`). Must be removed completely. |
| **Footer (`components/Footer.tsx`)** | 4 columns (`Brand` + 2 pill badges incl. `<Sparkles> Smart Bill OCR`, `SplitRupee`, `Account`, `Resources`) plus bottom legal/attribution row. | Generally well-linked, though left column carries redundant capsule pills and col-2 shows a tiny `Free` pill. Tightening spacing and removing decorative badges improves clarity. |

---

## 2. Current vs Proposed Section Order

| Order | Current `app/page.tsx` | Proposed New Structure (`/` Public Experience) |
|---|---|---|
| **1** | Logged-out `Navbar` (`Features`, `Calculator`, `Itinerary`, `Pro`, `FAQ`) | **Section 1: Navigation**: Brand mark (`₹ SplitRupee`), `Product` (`/#how-it-works`), `Features` (`/#features`), `Pro` (`/pro`), `Resources` (`/calculator`, `/blog`, `/faq`, `/about`), Theme toggle, `Log In`, `Sign Up`. |
| **2** | Centered Hero + `<Sparkles>` eyebrow + emoji tabs + `100% Free forever` strip | **Section 2: Asymmetric Split Hero**: Headline + clear supporting copy + Primary CTA (`Create free account` -> `/signup`) & Secondary CTA (`Try Split Calculator` -> `/calculator`) + calm 2-line factual summary on left; realistic interactive SplitRupee Group Balance & UPI preview frame on right (Desktop) / cleanly stacked below CTAs (Mobile). |
| **3** | *(Merged clumsily inside Hero tabs)* | **Section 3: Use Cases Band**: Dedicated interactive selector & contextual breakdown for existing group types: `Trips`, `Flatmates`, `Friends`, `Couples`, `Dinners & Events` with crisp scenario ledger examples (zero emojis, Lucide icons only where functional). |
| **4** | *(Absent: jumped straight to 2x2 boxes)* | **Section 4: How SplitRupee Works**: Editorial 5-step horizontal/numbered progression reflecting the exact implemented workflow: (1) Create a group & share invite code, (2) Add expenses (equal, exact rupee, or percentage), (3) Track live group balances, (4) Simplify debts into minimal transfers, (5) Settle up via 1-tap UPI or QR. |
| **5** | Inline mini-boxes buried inside 2x2 cards | **Section 5: Product Showcase**: High-clarity SplitRupee interface showcase featuring the real group passbook ledger, minimal transfer queue, and UPI QR/deep-link sheet layout using exact `DESIGN.md` Light & Dark surfaces. |
| **6** | 2x2 identical feature cards (`Features`) | **Section 6: Feature Presentation (Editorial Alternating Rows)**: Distinct alternating text + detail bands covering Graph Debt Simplification, Non-Custodial 1-Tap UPI Settlements, Ghost Member Phone Linking, and Offline Sync Queueing, eliminating identical boxed cards. |
| **7** | `Get even more with PRO` with `"14-Day Free Trial"` & `"Excel"` claims | **Section 7: SplitRupee Pro**: Calm gold-bordered editorial band accurately explaining implemented Pro tools (AI Receipt Scanner in Add Expense, Automated Recurring Bills for flatmates/rent) with transparent pricing/status and an honest `/pro` exploration link (no trial fiction). |
| **8** | 20-tile uniform checklist grid (`The whole nine yards`) | **Section 8: Free vs Pro Comparison**: Crisp, responsive 2-column comparison table (clean hairline dividers, mobile stacked or scannable table) contrasting Core Free tools (`₹0`) with Pro Add-ons strictly from `F-06` verified capabilities. |
| **9** | Fabricated Press Reviews (`Financial Times`, etc.) | **Section 9: Trust & Product Proof (No Fake Testimonials)**: Verifiable transparency block highlighting SplitRupee's factual foundations (non-custodial architecture, exact paise arithmetic, open interactive Bill Calculator trial with zero signup, and direct links to `/terms`, `/privacy`, `/faq`, `/contact`). |
| **10** | 4-col Footer with `<Sparkles>` & `Smart Bill OCR` capsule pills | **Section 10: Compact Footer**: Organized 4-column link architecture (`Brand + clean tagline`, `Product`, `Tools & Guides`, `Company & Legal`) preserving all existing footer links cleanly without decorative pills. |

---

## 3. Section-by-Section Redesign & Content Preservation Mapping

| Proposed Section | Before / After Layout Description | Existing Factual Content Preserved |
|---|---|---|
| **1. Navigation** | **Before**: 5 flat links (`Features`, `Calculator`, `Itinerary`, `Pro`, `FAQ`), theme buttons, `Log In` hidden below `sm`, `Sign Up`. **After**: Clean single-row bar on `md+` with `SplitRupee` logo (left), `Product` (`/#how-it-works`), `Features` (`/#features`), `Pro` (`/pro`), interactive accessible `Resources` menu or concise inline links (`Calculator`, `Guides`, `FAQ`) linking to `/calculator`, `/blog`, `/faq`, `/about`, and right-aligned `Theme`, `Log In`, `Sign Up`. Mobile uses 44px Menu toggle drawer with grouped destinations and visible `Log In` + `Sign Up`. *(Authenticated `isAppRoute` header/sidebar untouched.)* | All existing public routes remain directly accessible in 1-2 taps; `/itinerary`, `/calculator`, `/faq`, `/pro`, `/login`, `/signup` retained. |
| **2. Hero** | **Before**: Narrow single-column centered text (`max-w-4xl`), `<Sparkles>` badge above headline, underlined accent, emoji buttons, zero product visual above fold. **After**: 12-column asymmetric layout (`max-w-6xl`, 6 cols copy + 6 cols product preview on `lg+`, crisp stack on `<=768px`). Strong Manrope headline (*"Clear shared expenses for Indian trips, flats, and friends"*), calm 2-sentence explanation citing real capabilities (equal/exact/percentage splits, debt simplification, 1-tap UPI), primary `"Create free account"` CTA (`/signup`), secondary `"Try Bill Calculator"` CTA (`/calculator`), and concise plain-text trust facts (*"Non-custodial ledger · No bank login needed · Offline queue ready"*). Right side renders a crisp framed SplitRupee group ledger & settlement card preview using real token surfaces (or verified Phase 3 screenshot if approved). | Preserves `/` -> `/dashboard` redirect for logged-in users (`useEffect` lines 40-54 untouched), CTA paths `/signup` and `/calculator`, and all real SplitRupee hero concepts (Goa/flat/dinner expense tracking, bill attachment, debt minimization, GPay/PhonePe/Paytm UPI settle). |
| **3. Use Cases** | **Before**: Small tab strip crammed between headline and subtitle in Hero. **After**: Standalone calm horizontal band below the Hero with accessible tablist (`Trips`, `Flatmates`, `Friends`, `Couples`, `Dinners`) displaying scenario context, split example (e.g., villa/car/fuel, monthly rent/electricity/Wi-Fi, date nights, restaurant group tab), and matching example breakdown without emojis. | Preserves all 4 original scenarios (`Trips`, `Flatmates`, `Couples`, `Dinners & Friends`) and adds `Friends` explicitly as requested, keeping realistic Indian examples. |
| **4. How It Works** | **Before**: Not present as a dedicated flow. **After**: Five clean hairline-separated steps (zero card-box bloat): `1. Create a group` -> `2. Add expenses` -> `3. Track balances` -> `4. Simplify debts` -> `5. Settle up via UPI`. Each step maps directly to implemented routes/modals (`/groups`, `AddExpenseModal`, `buildLedger`, `debt.ts`, `SettleUpModal`). | Preserves and surfaces real app workflow instead of forcing a 3-step AI template. |
| **5. Product Showcase** | **Before**: Four disconnected tiny mockups buried inside feature boxes. **After**: One intentional large showcase band with clear tab/view switcher or crisp paired view showing (a) `Member Passbook & Transfers` (showing minimized obligations) and (b) `UPI Settle Up Sheet` (`upi://pay` link + dynamic QR + cash settle option), rendered with actual token surfaces (`#FFFFFF` / `#24342B`, tabular INR numerals). | Preserves Friend Balances (`Diya`, `Kabir`, tabular `₹`), Active Group status examples (`Goa`, `Koramangala`), Split Breakdown (`Equally`, `Exact ₹`, `By %`), and UPI preview (`Google Pay`, `PhonePe`, `Paytm / QR`). |
| **6. Feature Presentation** | **Before**: 2x2 grid of 4 identical elevated cards. **After**: Asymmetric editorial rows separated by `1px solid var(--border-subtle)` dividers: Row A (Smart Debt Simplification & Graph Minimization + WhatsApp invite codes & QR joining), Row B (Flexible Equal/Exact/Percentage Splits + Receipt Photo Attachment & Ghost Member Phone Linking + Real-Time & Offline Queue Sync). Notice clean typography-led layout with purposeful compact inline examples rather than nested card walls. | Retains 100% of factual feature copy (`graph debt minimization`, `WhatsApp invite links & QR`, `Equal/Exact/Percent`, `Receipt photos`, `Ghost members`, `Offline sync`). |
| **7. SplitRupee Pro** | **Before**: Gold-bordered banner claiming `14-Day Free Trial`, `live forex`, `Excel`. **After**: Balanced editorial Pro callout accurately describing implemented Pro capabilities (`AI Receipt Scanner` via Gemini & `Automated Recurring Expenses` for rent/maid/Wi-Fi) and pricing disclosure consistent with Batch A decision (`₹49/month` or `₹499/year`, no fake trial, CTA `"View Pro details"` -> `/pro`). | Preserves `/pro` link, smart receipt scanning concept (`Smart Receipt Scanner` detection UI example cleanly labeled as sample receipt breakdown), and `₹49`/`₹499` tiers (if billing roadmap copy approved). |
| **8. Free vs Pro Comparison** | **Before**: 20 uniform checklist chips mixing free/pro icons cleanly truncated inside small tiles. **After**: Crisp 2-column comparison layout (Free `₹0` vs Pro `Add-On`) with semantic `Check` rows on clean borders: accurate attribution of 127 baseline currencies, CSV/PDF statement exports, unlimited groups/expenses, real-time sync, tax/GST calculator, and debt simplification under **Free**; Receipt OCR and Automated Recurring Expenses under **Pro**. | Keeps every genuine feature from the 20-item checklist while correcting `F-06` Free/Pro classification errors. |
| **9. Social Proof / Trust Proof** | **Before**: 3 fabricated press quote boxes (`Financial Times`, `Economic Times`, `Tech In Asia`). **After**: Honest, verifiable **Built for Transparency** section highlighting 3 provable guarantees (`Non-Custodial Ledger` per `/terms`, `Paise-Exact Split Verification` via `/calculator`, `Exportable Statements Anytime` in CSV & PDF) alongside direct action links to `/calculator`, `/faq`, and `/privacy`. | Removes fabricated quotes (`F-04`) without leaving an awkward blank gap; elevates real trust proof. |
| **10. Footer** | **Before**: Left column + 3 link columns + 2 pill badges + bottom copyright. **After**: Clean, grounded 4-column layout removing the two `<Sparkles>`/`UPI` capsule pills under tagline, organizing links logically (`Product`, `Resources`, `Account`, `Legal`), keeping `© {year} SplitRupee` + India attribution clean (`<Heart>` replaced or kept subtle without visual clutter) and accessible link targets. | Preserves every single footer route (`/about`, `/calculator`, `/pro`, `/blog`, `/login`, `/signup`, `/forgot-password`, `/dashboard`, `/activity`, `/faq`, `/contact`, `/terms`, `/privacy`). |

---

## 4. Component Reuse & Isolation Strategy

| Component / Asset | Strategy | Rationale |
|---|---|---|
| `components/Navbar.tsx` | **Modify logged-out branch only** (`!isAppRoute`) | Preserves Phase 2/3 authenticated header, bell dropdown, quick `+ Add Expense`, and user menu 100% untouched. |
| `components/Footer.tsx` | **Modify directly** | Footer only renders on `!isAppRoute` public pages (`components/AppShell.tsx:116-125`). Zero effect on authenticated views. |
| `app/page.tsx` | **Redesign cleanly** | Keep existing logged-in `router.replace("/dashboard")` guard (lines 40-54) intact. |
| `components/landing/*` *(new optional subcomponents)* | **Create scoped landing modules** (e.g., `HeroLedgerPreview.tsx`, `UseCaseSwitcher.tsx`, `ComparisonTable.tsx`) | Keeps `app/page.tsx` concise and readable without touching `components/ui/primitives.tsx` or authenticated dashboard cards. |
| Authenticated internals (`app/dashboard`, `app/groups`, `Sidebar`, modals) | **Untouched** | Strictly protects Phases 1-3 stability. |

---

## 5. Responsive Breakpoint Plan

| Breakpoint Group | Widths Tested | Planned Layout Behavior |
|---|---|---|
| **Mobile** | `320px`, `375px`, `430px` | Single-column flow (`px-4`), header hamburger menu with 44px targets and visible `Sign Up` action, hero headline (`clamp`/stepped `text-3xl`) stacked cleanly above full-width primary/secondary CTAs (`min-h-[44px]`), followed immediately by interactive ledger preview card (constrained `w-full overflow-hidden`, zero horizontal bleed). Use-case selector wraps smoothly (`flex-wrap gap-2`) or scrolls accessibly with `min-h-[44px]`. Workflow steps stack vertically with crisp left numeral rail. Free vs Pro renders as two full-width stacked comparison blocks (`Free` first, then `Pro`) rather than cramped 2-column truncation. |
| **Tablet / Small Laptop** | `768px` | Top nav shows crisp horizontal links (`md:flex`) without crowding; Hero transitions cleanly (`max-w-3xl` stacked OR `md:grid-cols-12` balanced with spacious padding so preview never squeezes below `320px`); Feature editorial rows stack cleanly below `lg` (`md:grid-cols-1` or wide 2-col where legible) while Free vs Pro renders cleanly side-by-side (`md:grid-cols-2`); Footer keeps `grid-cols-2 md:grid-cols-4` with balanced spacing. |
| **Desktop / Wide** | `1280px`, `1440px` | Constrained content rail (`max-w-6xl mx-auto px-6`) prevents stretched line lengths on `1440px`. Asymmetric 12-column Hero (`lg:col-span-6` / `lg:col-span-6`) with clear breathing room; generous alternating vertical spacing (`py-16 lg:py-24`) between major sections; editorial feature rows alternate text-left/visual-right and visual-left/text-right cleanly with hairline dividers rather than uniform boxes. |

---

## 6. Visual Validation & Screenshot Matrix (`Batch B`)

All screenshots will be captured via Playwright against a production build (`npm run build && npm run start`) and saved to `D:\splitrupee\visual-review\phase-4\`:

- `landing-1440x900-light.png` & `landing-1440x900-dark.png` (above-the-fold + full page)
- `landing-1280x800-light.png` & `landing-1280x800-dark.png`
- `landing-768x1024-light.png` & `landing-768x1024-dark.png`
- `landing-430x932-light.png`
- `landing-375x812-light.png` & `landing-375x812-dark.png` (plus open mobile public menu state)
- `landing-320x720-light.png` & `landing-320x720-dark.png` (verifying `scrollWidth <= innerWidth`)
- Public subpage smoke captures (`pro-1280-light`, `contact-375-light`, `blog-1280-dark`) plus `/dashboard` confirmation check proving zero authenticated visual regression.
