# lib/ AI Guide

This directory owns business logic, data access, validation, AI routing, and shared types.

## Read First

- Root `AGENTS.md`
- `docs/architecture/codebase-map.md`
- `CONVENTIONS.md`
- `docs/architecture/llm-call-inventory.md` before changing any LLM call
- `docs/database/DATA-DICTIONARY.md` before changing DB behavior

## Rules

- Route all LLM calls through `lib/ai/model-router.ts`; do not import provider clients directly.
- Keep API schemas in `lib/validation/api-schemas.ts`.
- Use Zod v4 imports: `from "zod/v4"`.
- Use existing DB helpers and parameterized Neon SQL patterns.
- Do not use `any` in production TypeScript.
- Search all references before changing exported types or function signatures.

## Frozen Or High-Risk Areas

Discuss scope before editing:

- `lib/scoring/`
- `lib/content/archetypes-12.ts`
- `lib/db/career-directions.ts`
- `lib/content/shadow-content.ts`
- `lib/report-generation/career-drain-content.ts`
- `lib/ai/model-router.ts`

## Common Entry Points

| Need | Start with |
| --- | --- |
| Assessment scoring | `lib/scoring/` |
| Profile generation | `lib/profile-generation/` |
| Report generation | `lib/report-generation/` |
| Coaching | `lib/coaching/` |
| AI provider health and routing | `lib/ai/` |
| DB access | `lib/db/` |
| Journey gates | `lib/journey/` |
| Cohort entitlements | `lib/cohort/` |
| Shared contracts | `lib/types/` |

## Validation

- Logic change: targeted Vitest test first, then `npx tsc --noEmit`.
- DB change: check `scripts/schema.sql`, migrations, and DB docs.
- LLM/report/coaching change: targeted tests plus full verification before handoff.

