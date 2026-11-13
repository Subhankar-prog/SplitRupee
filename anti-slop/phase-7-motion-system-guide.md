# SplitRupee — Phase 7: Motion System Guide

## 1. Principles of Motion

1. **Subtle & Purposeful**: Animations inform spatial context and system responsiveness; they never delay user task completion.
2. **Hardware-Accelerated**: Only `transform` and `opacity` are animated to ensure continuous 60fps performance without reflows.
3. **Calm Financial Integrity**: Financial figures, balances, and payment triggers are steady and trustworthy, never bouncing or ticking rapidly.

---

## 2. Motion Tokens

```css
:root {
  --motion-instant: 100ms;
  --motion-fast: 140ms;
  --motion-normal: 180ms;
  --motion-medium: 240ms;
  --motion-slow: 360ms;

  --motion-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --motion-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --motion-ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.1);
  --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

---

## 3. Core Transition Patterns

### Module-to-Module Page Transitions
- **Class**: `.sr-page-transition`
- **Behavior**: Outgoing page disappears cleanly while incoming page enters with `opacity: 0 -> 1` and `translateY(8px -> 0)` over 180ms.
- **Application**: Automatically applied at `components/AppShell.tsx` keyed on `pathname`.

### Scroll Reveal
- **Component**: `<ScrollReveal as="section" stagger={1..5}>...</ScrollReveal>`
- **Hook**: `useScrollReveal({ threshold: 0.12 })`
- **Behavior**: Triggered once when entering viewport. Adds `.sr-revealed` class, then disconnects observer.
- **SSR / No-JS Safety**: Non-blocking CSS fallback ensures content is never hidden if observer is unavailable.

### Tab Switching
- **Class**: `.sr-tab-panel`
- **Behavior**: 160ms soft fade and small 4px translate into place when user switches filter or view tabs.
- **Usage**:
  ```tsx
  <div key={activeTab} className="sr-tab-panel">
    {/* Tab content */}
  </div>
  ```

### Cards & Micro-interactions
- **Class**: `.sr-card-interactive`
- **Hover**: Subtle `translateY(-2px)` elevation with soft shadow.
- **Active / Press**: `.sr-button-press:active { transform: scale(0.985); }`

### Mobile Navigation Drawer
- **Backdrop**: `.sr-modal-backdrop` (180ms ease-out fade).
- **Drawer**: `.sr-drawer-panel` (220ms ease-out slide-in from left).

---

## 4. Accessibility & Reduced Motion

The system strictly adheres to `prefers-reduced-motion: reduce`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .sr-scroll-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```
All content remains immediately visible, interactive, and functional with zero transition delay.

