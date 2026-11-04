---
disable-model-invocation: true
---

Perform a monthly security review.

## Authentication & Authorization
1. Check all `app/api/` endpoints' `guardRoute()` configuration:
   - Write operations require `authenticated` or higher?
   - Admin endpoints require `admin` privilege?
   - List all `public` endpoints — are they appropriate?
2. Check session management:
   - Session cookie attributes (httpOnly, secure, sameSite)
   - Session expiry duration reasonable?
   - Mechanism for cleaning expired sessions?

## Input Validation
3. Check all endpoints accepting user input:
   - All validated via Zod schema?
   - String inputs have length limits?
   - JSON inputs have depth/size limits?
4. SQL injection check:
   - All sql`` template strings use parameterized values correctly?
   - Any string concatenation into SQL?

## Sensitive Data Exposure
5. Check console.log / console.error for leaks of: user emails, passwords, API keys, full assessment data.
6. Check API responses for fields that shouldn't be exposed (passwordHash, internal IDs, etc.).

## Environment Variables
7. List all `process.env.XXX` references. Verify none are hardcoded in source code.

## Output by risk level
🔴 Critical (fix immediately)
🟠 High (fix this week)
🟡 Medium (fix next iteration)
🟢 Suggestion (improves security posture)

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: monthly-security
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
