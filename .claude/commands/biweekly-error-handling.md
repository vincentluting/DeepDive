---
disable-model-invocation: true
---

Audit error handling robustness across the stack.

## API Route Layer
1. Scan all `app/api/` route.ts files.
2. Check each endpoint's DB operations are inside try-catch.
3. Check LLM calls (`callLLM` / `streamLLM`) have timeout handling and degradation logic.
4. Check for bare `throw` without an upper-level catch.

## Frontend Component Layer
5. Check all `fetch` / `csrfFetch` calls have `.catch` or try-catch.
6. Check that failed fetches show user-friendly error messages (not blank screens or silent failures).

## Database Layer
7. Check `lib/db/*.ts` sql`` calls have appropriate error handling.
8. Especially check: Can failed writes (INSERT/UPDATE) leave data in an inconsistent state?

## Output
List each issue with: file name, line number, issue type, suggested fix.
Sort by impact: user-facing experience > tracking data > developer experience.

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: biweekly-error-handling
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
