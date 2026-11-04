---
title: Motion Design Principles
category: design
sources:
  - app/globals.css
  - components/ui/
sync_mode: manual
last_verified: 2026-03-20
verified_by: claude-code
---

# Deep Dive — Motion Design Principles

> ⚠️ **Meridian 设计系统上线后 (2026-06)**，权威设计源为 [`.claude/skills/deepdive-design/SKILL.md`](../../.claude/skills/deepdive-design/SKILL.md)。本文档保留为历史规范，如与 Meridian 冲突以 skill 为准。

_Last updated: 2026-03-07_

Motion in Deep Dive follows one rule: **movement communicates depth**. Faster = closer to the user; slower = environmental ambience. Every animation maps to one of four tiers that mirror the ocean metaphor.

## Four Motion Tiers

### Tier 1 — Micro-feedback (200ms)

Immediate haptic-like response to user actions. Think: pressing a button at the surface.

| Token             | Value | Easing          |
| ----------------- | ----- | --------------- |
| `--duration-fast` | 200ms | `--ease-spring` |

Usage: button `:active` scale, toggle flip, hover color shift, tooltip appear.

CSS pattern: `transition: var(--transition-default)` or Tailwind `duration-200`.

### Tier 2 — Standard Transition (300ms)

Content sliding in/out, cards appearing, navigation state changes. The default for anything that moves.

| Token                  | Value        | Easing          |
| ---------------------- | ------------ | --------------- |
| `--duration-default`   | 300ms        | `--ease-spring` |
| `--transition-default` | 300ms spring | —               |

Utility classes: `.animate-fade-in`, `.animate-scale-in`.

### Tier 3 — Entrance Animation (500ms)

Page-level content reveals, modal appearances, section stagger. The user is "diving deeper."

| Token               | Value       | Easing             |
| ------------------- | ----------- | ------------------ |
| `--duration-slow`   | 500ms       | `--ease-out-quint` |
| `--transition-slow` | 500ms quint | —                  |

Utility classes: `.animate-fade-in-up` (primary entrance), stagger via `.stagger-1` / `.stagger-2` / `.stagger-3`.

### Tier 4 — Cinematic / Ritual (700ms+)

Full-page reveals, archetype unveiling, report generation ceremony. Reserved for L3–L4 visual intensity moments.

| Token                  | Value      | Easing            |
| ---------------------- | ---------- | ----------------- |
| `--duration-elegant`   | 700ms      | `--ease-out-expo` |
| `--transition-elegant` | 700ms expo | —                 |

Utility class: `.animate-fade-in-up-slow` (uses `--duration-elegant`).

### Ambient Loops (6–16s)

Environmental decoration that runs indefinitely. Not user-triggered — these breathe life into the environment.

| Animation          | Duration | Usage                             |
| ------------------ | -------- | --------------------------------- |
| `floatSlow`        | 6s       | Particle drift, depth particles   |
| `cardAmbientPulse` | 7s       | Card glow breathing               |
| `caustics`         | 16s      | Water light overlay on reports    |
| `aurora`           | 12s      | Gradient aurora on ceremony pages |

No tokens — these are decorative and intentionally varied.

## Easing Curves

| Token              | Curve                                    | Character                                              |
| ------------------ | ---------------------------------------- | ------------------------------------------------------ |
| `--ease-spring`    | `cubic-bezier(0.25, 0.1, 0.25, 1)`       | Responsive, natural — default for interactive elements |
| `--ease-out-quint` | `cubic-bezier(0.22, 1, 0.36, 1)`         | Decelerating entrance — content sliding into view      |
| `--ease-out-expo`  | `cubic-bezier(0.16, 1, 0.3, 1)`          | Dramatic deceleration — cinematic reveals              |
| `--ease-elastic`   | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Bouncy overshoot — celebration moments only            |

### When to Use Each

- **Spring**: Default. Buttons, toggles, nav transitions, hover states.
- **Out-quint**: Page entrance, card stagger, section reveals.
- **Out-expo**: Hero reveals, archetype unveiling, report generation.
- **Elastic**: Confetti, celebration badges, achievement unlocks. Use sparingly.

## Visual Intensity Alignment

Motion tiers map to the Visual Intensity Levels defined in `docs/design/visual-intensity-spec.md`:

| Intensity Level      | Motion Tier      | Examples                                             |
| -------------------- | ---------------- | ---------------------------------------------------- |
| L1 Pure Utility      | Tier 1–2         | Settings, admin, forms                               |
| L2 Guided Flow       | Tier 2–3         | Dashboard, questionnaire, coaching chat              |
| L3 Narrative Theatre | Tier 3–4         | Report panels, profile pages, explore hub            |
| L4 Cinematic Ritual  | Tier 4 + Ambient | Result reveal, report generation, archetype ceremony |

## `prefers-reduced-motion`

All animations respect the user's motion preference. In `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Ambient loops (`.animate-float-slow`, `.cta-glow-ring`) are fully disabled under reduced motion.

## Implementation Checklist

When adding new animations:

1. Pick the correct tier based on the trigger (user action vs. page load vs. ambient)
2. Use the corresponding `--duration-*` token, not a hardcoded value
3. Use the corresponding `--ease-*` curve
4. Prefer existing utility classes (`.animate-fade-in-up`, `.animate-scale-in`) over inline keyframes
5. Test with `prefers-reduced-motion: reduce` enabled
6. Check the Visual Intensity Spec to confirm the animation budget for that page
