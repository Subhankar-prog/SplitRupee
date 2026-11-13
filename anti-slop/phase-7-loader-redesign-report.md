# SplitRupee — Phase 7: Signature Loader Redesign Report
## "Abstract Flow" — Dimensional Digital Sculpture

---

## 1. Why the Previous Loader Was Replaced

The previous loader relied on a central currency symbol (₹) flanked by bouncing green and gold dots. While functional, it lacked the visual maturity, dimensional elegance, and brand distinction expected of a high-end fintech application. It felt like an icon animation rather than an art-directed product signature.

---

## 2. Creative Concept: Abstract Flow

The redesigned loader draws inspiration from high-end SaaS and fintech digital sculptures (such as the Vaulta reference).
The central concept is:
**A system of fluid, dimensional translucent forms coming together in perfect equilibrium.**

### Visual Elements:
- **Primary Dimensional Ribbon A**: A fluid mobius-curved glass ribbon flowing clockwise, blending Warm Terracotta into Gold with frosted translucent depth.
- **Secondary Interlocking Ribbon B**: A counter-balancing curved ribbon flowing counter-clockwise, blending Gold into Sage Green with harmonic phase offset.
- **Ambient Luminous Core Node**: A soft ambient light lens breathing at the focal center, evoking the moment balances settle.
- **Specular Ridge Highlights**: Soft specular highlights along the curved ridge giving the impression of physical frosted crystal.
- **NO Literal Currency Signs or Floating Dots**: The composition is 100% abstract and sculptural.

---

## 3. Light & Dark Theme Adaptation

- **Light Mode (`#F6EFE3` Canvas / `#FFFAF2` Surface)**:
  - Terracotta (`#AD5434`), Warm Gold (`#D99A45`), Sage (`#4D6143`).
  - Studio drop shadow with warm ambient occlusion (`rgba(41, 37, 31, 0.16)`).
- **Dark Mode (`#171613` Canvas / `#24221D` Surface)**:
  - Soft Terracotta (`#E28A63`), Gold (`#F0BD70`), Sage (`#A5B995`).
  - Incandescent glow with deep shadow occlusion (`rgba(0, 0, 0, 0.65)`).

---

## 4. The 5 Preserved Variants

1. **`fullScreen`**: Large abstract sculpture (140px), "SplitRupee" brand mark, "Everything coming together." secondary headline, contextual copy, and thin indeterminate progress track.
2. **`page`**: Medium abstract sculpture (96px) centered in page loading boundaries with contextual copy.
3. **`modal`**: Compact abstract sculpture (64px) scaled to fit inside dialog windows cleanly without pushing action buttons offscreen.
4. **`inline`**: Micro abstract ribbon ring (24px) for loading buttons and badges without causing layout shift.
5. **`skeleton`**: Warm fintech shimmer block placeholders matching actual card and list dimensions.

---

## 5. Visual Evidence & Screenshots

All captured evidence is saved in `visual-review/phase-7/loaders/`:
- `fullscreen-light.png`: Full-screen hero loader in Warm Light mode.
- `fullscreen-dark.png`: Full-screen hero loader in Dark mode.
- `page-variant-light.png`: Standard in-page loading boundary.
- `modal-variant-light.png`: Compact dialog loading layout.
- `inline-variant-light.png`: Micro button loading indicator.
- `skeleton-variant-light.png`: Warm fintech shimmer skeleton.
- `abstract-composition-desktop.png`: High-resolution 140px desktop sculpture render.
- `abstract-composition-mobile.png`: 390px mobile viewport sculpture render.
- `reduced-motion-appearance.png`: Static sculptural render under `prefers-reduced-motion`.

