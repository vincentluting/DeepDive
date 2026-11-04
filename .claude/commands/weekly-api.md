---
disable-model-invocation: true
---

Audit all API endpoints under `app/api/` for pattern compliance.

## Standard Pattern (per CONVENTIONS.md)
- Wrapped in `withLogging()`
- Uses `guardRoute()` for auth
- Uses `parseBody()` + Zod schema for input validation
- Uses `ApiErrorCode` + `createErrorResponse` for error responses
- Has try-catch with `logApiError` in catch

## Scan
Scan every `route.ts` file. Classify non-compliant endpoints:

🔴 **High risk** — No input validation (injection or crash risk)
🟠 **Medium risk** — No guardRoute (unauthorized access possible)
🟡 **Low risk** — Missing withLogging or non-standard error handling

For each issue: file path + one-line fix suggestion.

**Do NOT fix anything — report only.**

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: weekly-api
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
