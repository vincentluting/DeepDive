---
disable-model-invocation: true
---

Perform a database schema consistency audit.

## Canonical schema vs migrations

1. Read `scripts/schema.sql` as the canonical DDL.
2. Scan `scripts/migrations/*.sql` — verify the cumulative effect of migrations in order matches `schema.sql` (tables, columns, types, defaults, CHECK constraints, FK constraints, indexes).

## SQL statement scan

3. Scan all `lib/db/*.ts` SQL statements. Verify every referenced table name and column name exists in `schema.sql`. Especially check:
   - INSERT column names match table definitions
   - SELECT doesn't reference non-existent columns
   - JOIN conditions use correct column names

## Hidden tables

4. Check for tables created only via `ensureTable()` or inline `CREATE TABLE IF NOT EXISTS` in `lib/db/*.ts` but missing from `schema.sql`.

## Output

```
🗄️ Schema sync: [synced / drifted]
📋 Table coverage: X tables in schema.sql
⚠️ Drifts: [each with fix suggestion]
🔍 Hidden tables: [list]
```

> NOTE (2026-04-08): `lib/db/schema-init.ts` / `initTables()` has been deleted. It was dead code duplicating `schema.sql` and is no longer a sync target. The canonical DDL lives only in `scripts/schema.sql`, evolved by `scripts/migrations/NNN_*.sql`.

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: weekly-schema
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
