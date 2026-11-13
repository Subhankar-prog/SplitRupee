# Phase 6 Motion Design & Signature Loader Guide

## 1. Motion Design Principles
- **Subtle & Purposeful**: Animations inform spatial relationships without delaying user task completion.
- **Timing Standards**:
  - Modal Backdrop: 160ms ease-out fade.
  - Modal Panel: 200ms cubic-bezier(0.16, 1, 0.3, 1) scale-up (0.96 -> 1.0) & translate.
  - Page Transitions: 170ms ease-out translateY + fade.
  - Interactive Elements: 150ms ease-out micro-scale active press (0.985).
- **Reduced Motion**: Full `@media (prefers-reduced-motion: reduce)` override eliminating transform/scale animations.

## 2. CSS Utility Tokens
- `.sr-modal-backdrop`: Smooth 160ms background dimming.
- `.sr-modal-panel`: 200ms spring-like modal emergence.
- `.sr-page-transition`: Route view enter transition applied at `AppShell`.
- `.sr-interactive-transition`: Smooth hover/press transitions on nav links and cards.
- `.sr-button-press`: Active state tactile feedback.

## 3. Signature Brand Loader (`SplitRupeeLoader.tsx`)
- **Brand Mark**: Two balancing financial tokens (Sage green & warm gold) linked by a traveling transit route dash around a terracotta Rupee emblem.
- **Variants Supported**:
  - `fullScreen`: Centered full-viewport splash.
  - `page`: Page section loading with warm background panel.
  - `modal`: Compact dialog overlay loading state.
  - `inline`: Lightweight inline row spinner for buttons and badges.
  - `skeleton`: Warm fintech shimmer skeleton for content blocks.
- **Contextual Copy**: Dynamic status labels (e.g., "Loading your group ledger...", "Fetching your expenses...", "Opening your passbook...").

