# components/ AI Guide

This directory contains React UI organized by product domain.

## Read First

- Root `AGENTS.md`
- `docs/architecture/codebase-map.md`
- `CONVENTIONS.md`
- `.claude/skills/deepdive-design/SKILL.md` for visual, layout, or animation changes
- `docs/design/i18n-style-guide.md` for copy and locale changes

## Rules

- Prefer the existing domain folder over creating broad shared components.
- Keep `components/ui/` generic. Product copy and feature behavior belong in domain components.
- Use i18n dictionaries for all user-visible text.
- Use `csrfFetch` for client-side `POST`, `PUT`, `PATCH`, and `DELETE`.
- Avoid silent `catch { return null }` in UI. Use the project error-reporting helper when failures matter.
- Preserve mobile-first responsive behavior and check 375px layouts for visible changes.

## Common Entry Points

| Surface | Directory |
| --- | --- |
| Quick Dive and immersive explore | `components/quickdive/`, `components/immersive-explore/` |
| Deep Dive questionnaire | `components/questionnaire/` |
| Report UI | `components/report/` |
| Profile dashboard | `components/profile-panels/` |
| Coaching | `components/features/coaching-chat.tsx`, `components/coaching/` |
| Admin | `components/admin/` |

## Validation

- Component logic: nearest Vitest test or add one under `__tests__/`.
- Visual interaction: run static checks and verify in browser or Playwright.
- Copy/i18n: `npm run lint:i18n`.

