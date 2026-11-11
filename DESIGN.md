# SplitRupee – Design System

> A distinctive, warm, premium fintech experience for managing shared expenses, group finances and settlements.

## 1. Product Identity

SplitRupee is an Indian expense-sharing and group finance management application.

The product should feel:
- Trustworthy and financially responsible.
- Friendly and approachable.
- Modern and professionally designed.
- Simple to understand.
- Comfortable for everyday use.

The visual identity should be inspired by premium financial management dashboards, particularly the composition and visual refinement of the QClay Finance Management Dashboard.

Do not copy the reference design. Develop a distinctive SplitRupee identity.

## 2. Design Philosophy

The design should prioritize:
1. Clarity over decoration.
2. Readability over visual complexity.
3. Consistency over experimentation.
4. Useful whitespace over excessive cards.
5. Meaningful color over random color usage.
6. Functional interactions over decorative animations.

Every visual element must have a purpose.

Avoid generic AI-generated SaaS aesthetics.

## 3. Color Palette

### Light Theme

| Token | Color |
|---|---|
| Background | #F5F4EF |
| Surface | #FFFFFF |
| Secondary surface | #EEEEE7 |
| Primary text | #26332D |
| Secondary text | #758078 |
| Primary brand | #739B83 |
| Dark brand | #263A32 |
| Accent | #D9A86C |
| Border | #E6E9E3 |
| Positive | #56866A |
| Negative | #C36F69 |
| Warning | #C89550 |

### Dark Theme

| Token | Color |
|---|---|
| Background | #171F1D |
| Surface | #222C29 |
| Secondary surface | #293530 |
| Primary text | #F3F4EE |
| Secondary text | #A5B2A9 |
| Primary brand | #8DB69A |
| Dark brand | #739B83 |
| Accent | #D9A86C |
| Border | #35413B |
| Positive | #8DB69A |
| Negative | #DB8980 |
| Warning | #D9B078 |

Use semantic color tokens instead of hardcoding colors inside individual components.

Maintain readable contrast in both themes.

## 4. Typography

Primary font: Manrope.

Secondary font: Inter.

Usage:
- Manrope for page headings, section titles and financial figures.
- Inter for body text, forms, navigation, tables and descriptions.
- Tabular numerals for monetary amounts and balances.

Typography should be restrained and consistent.

Avoid excessive font weights, oversized headings and decorative typography.

## 5. Layout and Spacing

Use a consistent spacing system based on multiples of 4px.

Preferred spacing:
- 4px: Minimal inline spacing.
- 8px: Compact spacing.
- 12px: Component spacing.
- 16px: Standard component padding.
- 24px: Section spacing.
- 32px: Large section spacing.
- 40px and above: Major page separation.

Use whitespace intentionally.

Do not put every piece of content inside a separate card.

Use a combination of:
- Open layouts.
- Subtle dividers.
- Selected elevated surfaces.
- Structured data sections.
- Clear content grouping.

## 6. Component Styling

### Cards
- White or theme-specific surfaces.
- Subtle borders.
- Restrained shadows.
- Consistent padding.
- Moderate corner radii.
- No excessive elevation.

### Buttons
- Clear primary and secondary hierarchy.
- Sage green for primary actions.
- Consistent height and padding.
- Distinct hover, focus, disabled and active states.
- Avoid unnecessary gradients.

### Inputs
- Clean backgrounds.
- Subtle borders.
- Clearly visible labels.
- Consistent field heights.
- Accessible focus states.
- Helpful validation messages.

### Tables
- Clear column alignment.
- Readable typography.
- Subtle row separators.
- Proper currency alignment.
- Responsive behavior.

### Badges
- Use semantic colors.
- Keep them compact.
- Avoid excessive colorful labels.

### Modals and Drawers
- Consistent surfaces and spacing.
- Clear hierarchy.
- Accessible close controls.
- Appropriate responsive behavior.

## 7. Financial Data Visualization

Financial information is central to SplitRupee.

Use clear visual hierarchy for:
- Total group spending.
- Personal spending.
- Amount owed.
- Amount to receive.
- Settlement history.
- Expense distribution.

Charts must:
- Use restrained colors.
- Have readable labels.
- Include meaningful legends.
- Use consistent tooltips.
- Support both themes.
- Never misrepresent actual data.

Positive and negative financial balances must be distinguishable without relying exclusively on color.

## 8. Navigation

Navigation should be simple and predictable.

Maintain:
- Clear active navigation state.
- Consistent icon style.
- Appropriate spacing.
- Understandable labels.
- Responsive mobile navigation.

Use a consistent Lucide-style icon family.

Do not mix unrelated icon styles.

## 9. Dark Mode

Dark mode is a first-class design system, not an inverted light theme.

Use deep green-gray backgrounds instead of pure black.

Maintain:
- Clear text hierarchy.
- Subtle surface differentiation.
- Accessible contrast.
- Visible borders.
- Consistent semantic colors.

All existing application pages and components must support dark mode.

## 10. Responsive Design

Design for desktop, laptop, tablet and mobile.

Requirements:
- Responsive navigation.
- Flexible dashboard grids.
- Proper mobile table handling.
- Full-width mobile forms when appropriate.
- Comfortable touch targets.
- No horizontal overflow.
- Consistent spacing across screen sizes.

Do not simply shrink desktop layouts to fit mobile.

## 11. Motion

Animations must be purposeful and subtle.

Acceptable:
- Theme transitions.
- Button feedback.
- Dropdown transitions.
- Modal transitions.
- Small loading indicators.

Avoid:
- Continuous floating animations.
- Excessive parallax.
- Decorative background movement.
- Unnecessary transitions on financial data.

Respect reduced-motion preferences.

## 12. Visual Anti-Patterns

Never introduce these without a specific product requirement:

- Generic purple-blue gradient backgrounds.
- Excessive glassmorphism.
- Random colorful card collections.
- Unnecessary floating blobs.
- Oversized rounded cards everywhere.
- Excessive shadows.
- Decorative elements without meaning.
- Fake financial data.
- Unnecessary animations.
- Generic AI-generated marketing copy.
- Inconsistent typography.
- Inconsistent icon families.

## 13. Brand Consistency

Every existing and future page must follow this design system.

This includes:
- Landing page.
- Dashboard.
- Groups.
- Expenses.
- Settlements.
- Friends.
- Profile.
- Settings.
- Authentication.
- Calculator.
- Pricing.
- Modals and forms.

No page should introduce an unrelated visual language.

## 14. Implementation Rules

- Inspect existing components before creating new ones.
- Reuse the existing design architecture where appropriate.
- Centralize design tokens.
- Avoid duplicated CSS.
- Preserve existing business logic.
- Preserve API contracts and database structures.
- Preserve existing functionality.
- Do not replace real data with mock data.
- Test both themes.
- Test responsive layouts.

## 15. Final Design Standard

SplitRupee should feel like an original, carefully designed fintech product.

The goal is not to make the application look flashy.

The goal is to make it look intentional, trustworthy, polished and human-designed.

This document is the source of truth for all visual design decisions in SplitRupee.