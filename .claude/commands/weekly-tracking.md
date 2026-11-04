---
disable-model-invocation: true
---

Perform a complete data tracking chain audit.

## Tracking Endpoint Liveness
1. List all endpoints under `app/api/analytics/`.
2. For each, check:
   - Is it blocked by `middleware.ts` CSRF logic?
   - Are `sendBeacon` endpoints in the CSRF exemption list?
   - Do DB write statements reference correct table names from `scripts/schema.sql`?

## Funnel Event Coverage
3. Read all FunnelEvent types in `lib/analytics/funnel.ts`.
4. For each event type, search the entire project for its trigger location.
5. Flag events that are "defined but never sent" from any frontend code.
6. Verify these critical user nodes have tracking:
   - Landing page visit, Quick Dive start/complete, Registration
   - Deep Dive start/complete, Report view, Report reaction, NPS score
   - Coaching start, Coaching feedback

## Passive Tracking Verification
7. Check `hooks/use-report-engagement.ts` sendBeacon calls — correct URL? Payload structure matches API expectation?
8. Check `lib/analytics/time-on-page.ts` sendBeacon calls — URL, payload, visit-id cookie reading logic.

## Output
```
📊 Tracking health: X/Y endpoints alive
🚨 Dead endpoints: [list]
⚠️ Untriggered events: [list]
✅ Suggested fixes: [steps]
```

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: weekly-tracking
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
