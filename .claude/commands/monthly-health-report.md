---
disable-model-invocation: true
---

Generate a monthly codebase health report for Deep Dive.

## Scale Metrics
1. Count: total .ts/.tsx files, total lines of code (exclude node_modules, .next, package-lock.json), API endpoints under app/api/, components under components/, modules under lib/, test files under __tests__/.

## Quality Metrics
2. `npm run build` — pass/fail
3. `npm run lint` — warning count
4. `npm run test` — pass rate
5. `npm run lint:i18n` — missing key count
6. Count all `any` type usages (`: any`, `as any`)
7. Count all `@ts-ignore` / `@ts-expect-error`
8. Count all `TODO` / `FIXME` / `HACK`

## Architecture Metrics
9. Count `ensureTable()` / `CREATE TABLE IF NOT EXISTS` in lib/db/ (ideal: 0, all should be in schema.sql)
10. Count API endpoints not following standard `guardRoute` + `parseBody` pattern
11. List files exceeding 500 lines (candidates for splitting)
12. Check for circular imports (`import` cycles between modules)

## Output
Structured report suitable for pasting into CLAUDE.md "Current Development Status" section. Include month-over-month trend if previous data exists in CLAUDE.md.

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: monthly-health-report
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
