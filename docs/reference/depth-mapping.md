---
title: Page-to-Depth Mapping
category: reference
sources:
  - app/globals.css
sync_mode: manual
last_verified: 2026-03-20
verified_by: claude-code
---

# Page-to-Depth Mapping

> **Reference Date:** 2026-03-04
> **Applies to:** `app/globals.css` depth spectrum + `.depth-*` utility classes

This document specifies which depth level each page or component should use,
ensuring the ocean-depth metaphor is applied consistently across the product.

---

## Depth Spectrum Reference

The depth system maps the user's journey to background tones. Deeper engagement =
darker background. Dashboard and share surfaces stay bright.

| CSS Class / Token | Light Mode Color | Dark Mode Color | Description |
|---|---|---|---|
| `.depth-void` / `--depth-void` | `#010E1A` | `#010E1A` | Deepest — maximum drama |
| `.depth-abyss` / `--depth-abyss` | `#011828` | `#020E18` | Deep dive atmosphere |
| `.depth-deep` / `--depth-deep` | `#022A4A` | `#041A2E` | Mid-depth immersion |
| `.depth-mid` / `--depth-mid` | `#065A90` | `#0A2840` | Transition zone |
| `.depth-reef` / `--depth-reef` | `#0870AE` | `#0C3A58` | Primary accent depth |
| `.depth-shallow` / `--depth-shallow` | `#E8F2FC` | `#112A3E` | Light, readable content |
| `.depth-surface` / `--depth-surface` | `#F0F6FC` | `#14202C` | Near-surface utility |
| `.depth-sky` / `--depth-sky` | `#FAFBFC` | `#0D1117` | Lightest — utilitarian |
| Paper tokens (`--paper-*`) | `#FFFDF9` bg | `#1A1510` bg | Warm, personal exception |

---

## Page-to-Depth Assignment

| Page / Component | Depth Level | Rationale |
|---|---|---|
| Landing hero | `depth-void` | Maximum drama, first impression |
| Landing sections (below fold) | `depth-abyss` | Narrative depth |
| Questionnaire shell | `depth-abyss` → `depth-deep` | Progressive depth per module |
| Completion ceremony | `depth-void` | Climax moment |
| Report header | `depth-abyss` | Deep, premium feel |
| Report panels | `depth-shallow` | Readable content |
| Report "Letter to User" | Paper tokens | Warm, personal exception |
| Ocean reveal (scroll transition) | `depth-void` → `depth-shallow` | Animated depth change |
| Quick Report page | `depth-shallow` | Light, scannable |
| Share page | `depth-shallow` | Light, shareable |
| Dashboard | `depth-sky` | Lightest, utilitarian |
| Settings | `depth-sky` | Lightest, utilitarian |
| Deep Dive landing | `depth-void` | Immersive entry |
| QuickDive explore | `depth-shallow` | Bright, approachable |

---

## Implementation Notes

### Applying depth classes

Add the `.depth-*` class to the page shell (outermost wrapper) or section container.
The class sets both `background-color` and `color` from the paired CSS variables,
with a 400 ms `ease-out-quint` transition built in.

```tsx
// Example: Deep Dive landing shell
<div className="depth-void min-h-screen">
  ...
</div>

// Example: Report panels (readable content area)
<section className="depth-shallow px-6 py-10">
  ...
</section>
```

### Progressive depth in the questionnaire

The questionnaire shell starts at `depth-abyss` and shifts to `depth-deep` as the
user progresses through modules. Drive this with Framer Motion or a conditional
class based on the active module index.

### Paper tokens (Letter to User)

The "Letter to User" component is the one designed exception to the ocean palette.
Use the `--paper-*` CSS variables directly — do not apply a `.depth-*` class to
this component.

```tsx
// Correct: use paper variables explicitly
style={{ backgroundColor: 'var(--paper-bg)', color: 'var(--paper-text)' }}
```

### Scroll transition (Ocean reveal)

The animated transition from `depth-void` (hero) to `depth-shallow` (report) uses
the `--depth-transition-duration` (400 ms) and `--depth-transition-easing` variables
already set on every `.depth-*` class. Swap the class on scroll position change.

### Glass cards within depth zones

Use the matching `--glass-{depth}` variable for backdrop-blur cards that sit inside
a depth zone. The `.glass-card` utility class applies `backdrop-filter: blur(16px)`
and a `var(--glass-border-dark)` border — pair it with the correct `--glass-*`
background for the current depth level.

---

## Related Files

- `app/globals.css` — depth CSS variables and utility classes (lines 143–351)
- `components/features/depth-gauge/` — depth gauge UI components
- `components/layout/depth-meter.tsx` — depth meter layout component
- `lib/exploration/depth-calculator.ts` — depth score calculation logic
