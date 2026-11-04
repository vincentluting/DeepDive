# app/ AI Guide

This directory contains Next.js App Router pages, layouts, route groups, and API routes.

## Read First

- Root `AGENTS.md`
- `docs/architecture/codebase-map.md`
- `CONVENTIONS.md`
- For UI routes: `components/AGENTS.md` and `.claude/skills/deepdive-design/SKILL.md`
- For API routes: `lib/validation/api-schemas.ts`, `lib/api/`, and the relevant architecture doc

## Rules

- Keep localized user-facing pages under `app/[locale]/`.
- API routes must use `guardRoute(request, { tier })` and `withLogging` unless there is a documented exception.
- API input validation belongs in `lib/validation/api-schemas.ts`.
- Do not put business logic directly in route handlers when an existing `lib/` module owns the behavior.
- Client state-changing requests from UI code must use `csrfFetch`.
- User-visible text must come from i18n dictionaries.

## Validation

- API change: targeted route tests plus `npx tsc --noEmit`.
- Page or layout change: `npx tsc --noEmit`, `npm run lint`, and browser or Playwright validation for visible flows.
- i18n change: `npm run lint:i18n`.

