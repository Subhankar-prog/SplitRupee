# Phase 5: Responsive Content Visibility Audit & Implementation Plan

## 1. Executive Summary
An automated and manual responsive audit was conducted across all 17 public and authenticated routes at 10 viewport widths (320px, 360px, 375px, 390px, 430px, 480px, 768px, 1024px, 1280px, 1440px) under both Light and Dark themes.

A total of 410 content clipping/truncation occurrences were identified across 8 core layouts, primarily driven by four shared root causes:
1. Hardcoded `truncate` on names, descriptions, and emails instead of natural multiline text wrapping.
2. Rigid pixel constraints (e.g. `max-w-[110px]`, `max-w-[130px]`, `max-w-[140px]`).
3. Overly rigid horizontal flex rows on small viewports forcing buttons, amounts, and badges to compete for space.
4. Dense desktop table layouts failing to reflow cleanly into responsive mobile cards.

---

## 2. Categorization of Findings

### Critical (Financial Clipping & Broken Navigation)
- **Amount & Balance Clipping on Dashboard & Expenses (`/dashboard`, `/expenses`):**
  - KPI balance cards and debtor/creditor lists clip amounts (e.g., `you owe ₹7,500`, `owes you ₹2,725`, `₹15,000 paid`).
  - Fix: Enable `break-words`, tabular numbers (`tabular-nums`), vertical stacking of avatar/name/amount on mobile, and remove rigid `truncate` on financial figures.
- **Group Ledger Debt Simplification & Debts List (`/groups/[id]`):**
  - Member debtor/creditor names are hard-capped at `max-w-[110px]` with `truncate`, hiding member identities in settlement flows.
  - Fix: Allow flex wrap with natural name expansion and stacked arrow indicators on small screens.

### High (Identity & Name Truncation)
- **Group Member Names & Group Names (`/groups`, `/groups/[id]`, `/dashboard`):**
  - Group cards clip names like `Bhubaneswar to Nepal New Year Friends Trip` and member names like `Alexandria Christopher Johnson` and `Subhankar Kumar Panda`.
  - Fix: Replace single-line `truncate` with `line-clamp-2` or natural wrapping and `break-words`.
- **User Email Addresses & Header Badges (`Navbar.tsx`, `ProfileSettingsModal.tsx`, `/profile`):**
  - User emails (e.g., `subhankar.panda.qa@exampledomain.com`) and greeting labels (`Subhankar...`) are hard-clipped to `110px`.
  - Fix: Use `break-all` / `break-words` and fluid name container spacing.
- **Expense Titles & Descriptions (`/expenses`, `/activity`, `/groups/[id]`):**
  - Long titles (e.g., `High-Speed WiFi & ACT Broadband`, `Accommodation and transportation expenses`) cut off mid-word.
  - Fix: Reflow into 2-line wraps with full tooltip accessibility.

### Medium (Button & Form Label Squeeze)
- **Itinerary Quick Route Starters & Form Labels (`/itinerary`):**
  - Template buttons like `Bhubaneswar -> Darjeeling` clip secondary labels at 320px-360px.
  - Form labels `Group Budget (INR)` and `Stay Limit / Night (INR)` collide with flex icons.
  - Fix: Reflow cards from rigid horizontal flex to stacked flex-col on small screens; remove `truncate` on form labels.
- **Activity Feed & Notification Popover (`components/ActivityLogList.tsx`, `components/Navbar.tsx`):**
  - Activity titles cut off in dropdown feeds.
  - Fix: Enable natural multiline wrapping for activity items.

---

## 3. Systematic Implementation Workstreams

| Workstream | Target Files | Key Fixes |
|---|---|---|
| **WS1: Header & Navigation** | `components/Navbar.tsx`, `components/Sidebar.tsx` | Remove `max-w-[110px]` clipping on user name; allow natural wrapping for UPI & email; prevent icon squishing in mobile header. |
| **WS2: Group Details & Ledger** | `app/groups/[id]/page.tsx` | Remove `max-w-[110px]`, `max-w-[130px]`, `max-w-[140px]` on member names; reflow debt cards; convert dense passbook/reconciliation table rows into mobile cards on `< sm`. |
| **WS3: Dashboard & Group Lists** | `app/dashboard/page.tsx`, `app/groups/page.tsx` | Replace `truncate` with `line-clamp-2` or natural wrap on group titles and debtor balances; stack name and amount on narrow viewports. |
| **WS4: All Expenses & Activity** | `app/expenses/page.tsx`, `components/ActivityLogList.tsx`, `app/activity/page.tsx` | Allow expense titles to wrap naturally; preserve currency amounts with `tabular-nums shrink-0`; reflow date/paid-by rows. |
| **WS5: Modals & Dialogs** | `components/AddExpenseModal.tsx`, `components/ManageGroupModal.tsx`, `components/SettleUpModal.tsx`, `components/ProfileSettingsModal.tsx` | Remove hard truncation on participant names, split amounts, and email addresses; ensure modals fit 320px with safe internal scrolling. |
| **WS6: AI Itinerary & Profile** | `app/itinerary/page.tsx`, `app/profile/page.tsx` | Stack itinerary route starters; fix form label flex squeeze; allow email wrap with `break-all`. |

---

## 4. Verification Protocol
1. `npm run typecheck`
2. `npm test` (all 19 test suites, 123 tests)
3. `npm run build` (Next.js production build)
4. Playwright verification across 10 viewports (320px to 1440px) with long test data.

