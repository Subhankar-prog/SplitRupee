# SplitRupee — Phase 7: Implementation Report
## Application-Wide Premium Motion System & Signature Abstract Loader Redesign

**Project:** SplitRupee (`D:\splitrupee`)  
**Phase:** 7  
**Antislop Mode:** DURING  
**Baseline Verified:** 19 Vitest test suites (124 tests passed), Next.js production build succeeded (code 0, 27/27 static pages).

---

## 1. Executive Summary

Phase 7 successfully transforms SplitRupee into a calm, fluid, and premium digital product through two coordinated objectives:
1. **Unified Application-Wide Motion System**: Standardized hardware-accelerated motion tokens, module-to-module route transitions, non-blocking scroll reveals, tab transitions, drawer transitions, and card micro-interactions.
2. **Signature Abstract Loader Redesign ("Abstract Flow")**: Completely replaced the previous simple loader with a 3D-inspired digital sculpture of fluid, interlocking translucent geometric ribbons with layered depth, specular highlights, and ambient lighting in the Warm Modern Fintech palette.

---

## 2. Components & Routes Modified

| Area / File | Changes & Enhancements |
| :--- | :--- |
| `app/globals.css` | Added Phase 7 motion tokens (`--motion-instant` through `--motion-slow`, easing curves), Abstract Flow keyframes, `.sr-scroll-reveal`, `.sr-card-interactive`, `.sr-drawer-panel`, `.sr-tab-panel`, and complete `prefers-reduced-motion` safety overrides. |
| `components/SplitRupeeLoader.tsx` | Completely redesigned with `SplitRupeeAbstractSculpture`. Implemented the 5 variants (`fullScreen`, `page`, `modal`, `inline`, `skeleton`), contextual loading messages, indeterminate progress track, and static fallback under reduced-motion. |
| `lib/useScrollReveal.ts` | High-performance IntersectionObserver hook and shared observer with single-trigger unobserve and SSR fallback. |
| `components/ui/ScrollReveal.tsx` | Reusable declarative scroll-reveal wrapper component with stagger support (`stagger={1..5}`). |
| `app/page.tsx` | Integrated `ScrollReveal` across hero, 3-step expense flow, standalone AI Itinerary spotlight, use cases, workflow, Pro comparison, and final CTA; added tab transitions for showcase and use-case tabs; replaced raw spinner with `SplitRupeeLoader`. |
| `app/dashboard/page.tsx` | Wrapped Financial Standing Overview, Groups List, and Charts in `ScrollReveal`; added `sr-card-interactive` to group cards for subtle elevation on hover. |
| `app/expenses/page.tsx` | Added `sr-tab-panel` to expense category filter feeds and `sr-card-interactive` to expense list items. |
| `app/groups/[id]/page.tsx` | Integrated `sr-tab-panel` across all group tab views (Ledger, Transfers, Expenses, Settlements, Activity, Members, Itinerary) and added `sr-card-interactive` to member cards. |
| `app/itinerary/page.tsx` | Added `sr-card-interactive` to day cards, smooth expand/collapse, and travel route transitions; powered by `SplitRupeeLoader` modal and page variants. |
| `components/Sidebar.tsx` | Added `sr-modal-backdrop` and `sr-drawer-panel` for smooth cubic-bezier slide-in on mobile drawers; interactive hover transitions on group items. |
| `components/AppShell.tsx` | Reinforced `.sr-page-transition` on both public and authenticated route views; fullScreen abstract loader during session checks. |

---

## 3. Motion Utilities Created & Reused

- **Motion Tokens**:
  - Timing: `--motion-instant` (100ms), `--motion-fast` (140ms), `--motion-normal` (180ms), `--motion-medium` (240ms), `--motion-slow` (360ms).
  - Curves: `--motion-ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`), `--motion-ease-in-out` (`cubic-bezier(0.65, 0, 0.35, 1)`), `--motion-ease-spring` (`cubic-bezier(0.175, 0.885, 0.32, 1.1)`).
- **Classes**:
  - `.sr-page-transition`: 180ms module-to-module view transition (fade + 8px translate).
  - `.sr-scroll-reveal`: 420ms scroll reveal with hardware acceleration (transform & opacity).
  - `.sr-card-interactive`: 180ms subtle hover elevation (translateY(-2px) + shadow).
  - `.sr-button-press`: 120ms tactile micro-scale feedback (`:active { transform: scale(0.985); }`).
  - `.sr-tab-panel`: 160ms content transition on tab switch.
  - `.sr-drawer-panel`: 220ms smooth slide-in for mobile navigation.
  - `.sr-modal-backdrop` & `.sr-modal-panel`: Standardized modal emergence.

---

## 4. Dependencies Added

**None.** Zero external libraries were added. All animations rely on standard inline SVG and CSS transforms/opacity, keeping the JavaScript bundle minimal and ensuring 60fps performance on mobile devices.

---

## 5. Intentionally Non-Animated Components

To maintain financial accuracy and avoid visual fatigue, the following elements were intentionally excluded from large movement or number counting animations:
- Direct ledger transaction amounts and mathematical split totals.
- QR codes and UPI payment deep links (must be instantly actionable).
- Dense passbook table cells (animating 50+ table rows creates unacceptable jank and layout shifting).

