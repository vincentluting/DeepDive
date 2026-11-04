# Database Migrations

Numbered SQL migration files for incremental schema changes.

## Naming Convention

```
NNN-short-description.sql
```

- **NNN**: Three-digit zero-padded number (e.g., `001`, `010`, `100`)
- **short-description**: Kebab-case summary of the change
- Numbers should be sequential (001, 002, 003, ...)
- New migrations should use the next available number after the highest existing one

## Commands

```bash
npm run db:migrate            # Apply all pending migrations
npm run db:migrate:status     # Show which migrations are applied/pending
npm run db:migrate:dry-run    # Show what would be applied without executing

# Advanced options:
npx tsx scripts/run-migrations.ts --mark-applied   # Mark all pending as applied (no SQL executed)
```

## How It Works

1. The runner reads all `NNN-*.sql` files from this directory
2. It checks the `_migrations` table in the database for already-applied filenames
3. Pending migrations are executed in numeric order
4. Each successful migration is recorded in `_migrations`
5. On failure, the runner stops immediately (migrations must be applied in order)

## Writing Migrations

- **Idempotent preferred**: Use `IF NOT EXISTS`, `IF EXISTS`, `ADD COLUMN IF NOT EXISTS` where possible
- **Wrap destructive changes in a transaction**: Use `BEGIN; ... COMMIT;`
- **Keep each migration focused**: One logical change per file
- **No application logic**: SQL only, no TypeScript imports
- **Test before committing**: Run the SQL manually in a dev database first
- **Update schema.sql**: After adding a migration, ensure `scripts/schema.sql` reflects the final state

## Relationship to schema.sql

- `scripts/schema.sql` is the **canonical schema** (the complete, current state)
- Migrations are **incremental diffs** that evolve an existing database to match the canonical schema
- When setting up a fresh database, run `schema.sql` directly (no need for migrations)
- When updating an existing database, run pending migrations via `npm run db:migrate`

## Existing Migrations

| File | Description |
|------|-------------|
| `001-unify-quickdive.sql` | Migrate QuickExploreResult → QuickDiveResult, drop old table |
| `002-renumber-migrations.sql` | Rename old non-sequential tracking entries (007→003, 008→004, 009→005); note: 004 was later removed (see below) |
| `003-audit-cleanup.sql` | Drop 5 deprecated tables + 5 columns, add lastActiveAt |
| ~~`004-research-participant.sql`~~ | _(removed)_ Added `isResearchParticipant` flag — deleted when the research participant feature was removed |
| `005-exploration-progress.sql` | Add explorationProgressJson JSONB to QuestionnaireSession |
| `006-rename-jsonb-keys.sql` | Rename legacy JSONB keys: moduleTimes pvq→ddvq/ipip→ipip30, discMapping→collabMapping |
| `007-insightsjson-jsonb.sql` | Convert UserProfile.insightsJson column from TEXT to JSONB |
| `008-standardize-timestamps.sql` | Convert User and UserSession timestamp columns from TIMESTAMP to TIMESTAMPTZ |

> **Note:** Migration 004 (`004-research-participant.sql`) was renamed from `008-research-participant.sql` by migration 002 for tracking purposes, but the SQL file itself was removed during schema consolidation — its changes were incorporated directly into `schema.sql`. The gap between 003 and 005 is intentional and does not affect the migration runner.

## First-Time Setup for Existing Database

If your database already has all migrations applied manually (via Neon Console), mark them as applied:

```bash
npx tsx scripts/run-migrations.ts --mark-applied
```

This records all migration filenames in the `_migrations` table without re-executing the SQL.

## Note on Migration 004

`004-research-participant.sql` was created during renumbering (migration 002 renames the old
`008-research-participant.sql` tracking entry to `004-research-participant.sql`), but the file
was subsequently deleted when the research participant feature was removed in full.

On existing databases where migration 002 was applied, the `_migrations` table may contain an
entry for `004-research-participant.sql`. This orphaned entry is harmless — the migration
runner only processes files that exist in the directory, so the entry is silently ignored.
The next migration number in active use is `005`.
