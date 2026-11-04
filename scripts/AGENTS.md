# scripts/ AI Guide

This directory contains database, migration, QA, E2E, verification, and maintenance scripts.

## Read First

- Root `AGENTS.md`
- `docs/architecture/codebase-map.md`
- `scripts/README.md`
- `scripts/migrations/README.md` before adding or changing migrations
- `docs/database/DATA-DICTIONARY.md` and `scripts/schema.sql` for DB shape

## Rules

- TypeScript scripts run with `node --import tsx`.
- It is acceptable for scripts to print progress with `console.log`; do not copy script logging patterns into production app code.
- Prefer dry-run behavior for scripts that mutate data.
- Never run production DB operations unless the user explicitly asks.
- After adding a migration, update `scripts/schema.sql` to the final state.
- Keep generated outputs out of tracked source unless the plan explicitly calls for a generated artifact.

## Common Commands

| Need | Command |
| --- | --- |
| Apply migrations | `npm run db:migrate` |
| Check migration status | `npm run db:migrate:status` |
| Dry-run migrations | `npm run db:migrate:dry-run` |
| Refresh AI inventory | `npm run ai:map` |
| Verify thesis data | `npm run verify:thesis` |

## Validation

- Script helper change: add or update `scripts/__tests__/`.
- Migration or schema change: run DB dry-run/status checks in a safe environment.
- AI navigation inventory change: run `npm run ai:map`.

