# Deep Dive Codebase Map

> AI-facing source map. Use this file to choose the smallest useful reading set before editing.
> For generated counts and largest-file inventory, run `npm run ai:map` and read `docs/architecture/ai-code-inventory.generated.md`.

## Start Here

| Task | Read first | Then inspect |
| --- | --- | --- |
| Product or journey question | `docs/product/product-overview.md` | `docs/product/user-journeys.md`, relevant `app/[locale]/...` route |
| UI or page change | `components/AGENTS.md` | `app/AGENTS.md`, `.claude/skills/deepdive-design/SKILL.md`, target component |
| API route change | `app/AGENTS.md` | `lib/validation/api-schemas.ts`, `lib/api/`, target `app/api/**/route.ts` |
| Scoring or assessment | `docs/architecture/scoring-pipeline.md` | `lib/scoring/`, `lib/questionnaire/`, related tests |
| Report generation | `docs/architecture/report-generation.md` | `lib/report-generation/`, `components/report/`, `lib/types/report.ts` |
| Coaching | `docs/architecture/coaching-system.md` | `lib/coaching/`, `app/api/coaching-chat/`, `components/features/coaching-chat.tsx` |
| LLM routing | `docs/architecture/llm-call-inventory.md` | `docs/architecture/ai-routing-v2.md`, `lib/ai/model-router.ts` |
| Database | `docs/database/DATA-DICTIONARY.md` | `scripts/schema.sql`, `scripts/migrations/README.md`, `lib/db/` |
| i18n | `docs/design/i18n-style-guide.md` | `lib/i18n/`, affected `lib/i18n/dictionaries/*` namespaces |
| Testing | `CONVENTIONS.md` | nearest `__tests__/`, `vitest.config.ts`, relevant `e2e/` helper |

## Runtime Areas

| Area | Responsibility | Notes |
| --- | --- | --- |
| `app/[locale]/` | Localized App Router pages and layouts | Route groups split app, public, report, and marketing surfaces. |
| `app/api/` | Next.js API routes | Use `guardRoute(request, { tier })`, `withLogging`, and Zod schemas from `lib/validation/api-schemas.ts`. |
| `components/` | React UI components | Domain folders are preferred over broad shared abstractions. User-visible text must come from i18n dictionaries. |
| `components/ui/` | shadcn/Radix-style primitives | Keep primitives generic and low-copy. Domain language belongs in feature components. |
| `lib/` | Business logic, data access, validation, AI, and types | Prefer existing helpers and module boundaries before adding new abstractions. |
| `store/` | Zustand state | Currently small. Check consumers before changing state shape. |
| `scripts/` | Operational, DB, verification, and maintenance scripts | Scripts may log to stdout. Production app code should not add debug `console.log`. |
| `e2e/` | Playwright journeys and helpers | Use for critical conversion paths, not unit-level behavior. |

## High-Signal Lib Modules

| Module | Purpose | Primary docs |
| --- | --- | --- |
| `lib/scoring/` | Frozen assessment scoring pipeline | `docs/architecture/scoring-pipeline.md` |
| `lib/profile-generation/` | Algorithmic profile and narrative seedpoints | `docs/architecture/profile-generation.md` |
| `lib/report-generation/` | Career report pipeline and prompts | `docs/architecture/report-generation.md` |
| `lib/coaching/` | Coach prompt construction, memory use, quality loop | `docs/architecture/coaching-system.md` |
| `lib/ai/` | Provider health, routing, cache, tests | `docs/architecture/ai-routing-v2.md` |
| `lib/db/` | Neon Postgres access modules | `docs/database/DATA-DICTIONARY.md` |
| `lib/cohort/` | Invite cohorts and entitlements | `docs/architecture/cohort-entitlements.md` |
| `lib/journey/` | Journey state machine and gates | `docs/architecture/journey-state-machine.md` |
| `lib/i18n/` | Locale loading and dictionaries | `docs/design/i18n-style-guide.md` |
| `lib/types/` | Shared TypeScript contracts | Search all references before changing exported shapes. |
| `lib/validation/` | API schemas and parsing helpers | Keep API input validation centralized here. |

## Frozen Or High-Risk Areas

Discuss scope with the project owner before editing:

- `lib/scoring/`
- `lib/content/archetypes-12.ts`
- `lib/db/career-directions.ts`
- `lib/content/shadow-content.ts`
- `lib/report-generation/career-drain-content.ts`
- `lib/ai/model-router.ts`

Also treat auth, security, payment, DB schema, and production operations as high risk.

## Context Budget Guidance

Read the smallest set that can answer the question:

1. Start with this map, root `AGENTS.md`, and the closest local `AGENTS.md`.
2. Read the relevant architecture doc only when touching that subsystem.
3. Use `docs/architecture/ai-code-inventory.generated.md` to spot large files before loading them.
4. Avoid bulk-reading generated or binary-heavy artifacts unless the task explicitly needs them.

Common context-noise areas:

- `.claude/quality/codex-redteam/output-*.md`
- `.playwright-mcp/`
- `.journey-test-reports/`
- `.qa-reports/`
- `package-lock.json`
- E2E screenshot snapshots
- thesis reference PDFs and other binary research files

## Validation Shortcuts

| Change type | Minimum useful check |
| --- | --- |
| Docs or AI navigation only | `npm run ai:map`, `npm run lint` |
| TypeScript or script change | `npx tsc --noEmit`, targeted Vitest test |
| i18n dictionary change | `npm run lint:i18n` |
| API, DB, scoring, report, coaching | Targeted tests plus full `npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n` |
| Frontend interaction or visual flow | Browser or Playwright check after static validation |

