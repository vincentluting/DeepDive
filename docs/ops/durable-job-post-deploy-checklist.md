# Durable Job Post-Deploy Checklist

> last_verified: 2026-05-03
> owner: Engineering
> scope: `/api/cron/job-worker`, `DurableJob`, post-registration side effects

Use this immediately after deploying the durable post-registration queue. The goal is to prove the queue drains in production, registration side effects eventually complete, and welcome email delivery remains single-send.

---

## Preconditions

- Migration `084-durable-job-queue.sql` has run on the production database.
- Vercel has `CRON_SECRET` set.
- `vercel.json` includes `/api/cron/job-worker` on `* * * * *`.
- Admin account can call `/api/admin/ops/durable-jobs`.
- Resend dashboard access is available when `EMAIL_MODE` is not `beta`.

---

## 1. Verify Vercel Cron Trigger

1. Open Vercel -> Project -> Logs.
2. Filter for `/api/cron/job-worker`.
3. Confirm at least one 200 response within 2 minutes of deployment.

Manual probe:

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://<production-domain>/api/cron/job-worker"
```

Expected response shape:

```json
{
  "success": true,
  "claimed": 0,
  "summary": { "succeeded": 0, "retry": 0, "failed": 0, "skipped": 0 },
  "health": {
    "pending": 0,
    "running": 0,
    "succeededLast24h": 0,
    "failedLast24h": 0,
    "oldestPendingAt": null
  }
}
```

Failure signals:

- 401/403: `CRON_SECRET` mismatch or missing header.
- 404: route did not deploy.
- 500: check Vercel logs for `[cron:job-worker] Fatal error`.
- No scheduled hits after 2 minutes: cron config was not picked up by the deployed project.

---

## 2. Verify Queue Health

Use the admin endpoint:

```bash
curl -sS -b "<admin-session-cookie>" \
  "https://<production-domain>/api/admin/ops/durable-jobs"
```

Healthy thresholds right after deploy:

- `pending`: can be non-zero briefly, but `oldestPendingAt` should not be older than 2-3 minutes.
- `running`: should normally be 0; any running row older than 5 minutes is stale and should be reclaimed by the next worker run.
- `failedLast24h`: should be 0 after a clean deploy.
- `succeededLast24h`: should increase after test registrations or real registrations.

Database spot check:

```sql
SELECT "status", COUNT(*) AS count
FROM "DurableJob"
GROUP BY "status"
ORDER BY "status";
```

Stale running check:

```sql
SELECT "id", "type", "attempts", "lockedAt", "lastError"
FROM "DurableJob"
WHERE "status" = 'running'
  AND "lockedAt" < NOW() - INTERVAL '5 minutes'
ORDER BY "lockedAt" ASC;
```

---

## 3. Verify Registration Post-Processing

1. Register a fresh test account in production.
2. Capture the new `User.id` from admin tools or Neon.
3. Check the durable job row:

```sql
SELECT "id", "type", "status", "attempts", "completedAt", "lastError"
FROM "DurableJob"
WHERE "idempotencyKey" = 'post_registration:<user_id>';
```

Expected:

- Exactly one row.
- `type = 'post_registration'`.
- Final status becomes `succeeded` within 2 minutes.
- `lastError` is null.

If the row is `pending`:

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://<production-domain>/api/cron/job-worker"
```

If the row is `failed`, inspect `lastError`, Vercel logs, and the dependent service named in the error.

---

## 4. Verify Welcome Email Sends Once

Current source of truth for exact delivery count is Resend, because the app does not persist an email delivery log.

Production mode:

1. In Resend, search the test account email.
2. Confirm exactly one welcome email was accepted/sent for that registration.
3. Confirm no second welcome email appears after manually triggering `/api/cron/job-worker` again.

Beta mode:

1. `EMAIL_MODE=beta` should suppress transactional welcome email.
2. The durable job should still reach `succeeded`.
3. Vercel logs may show `[email:suppressed]` for the welcome email.

Database duplicate guard:

```sql
SELECT "id", "status", "attempts", "completedAt"
FROM "DurableJob"
WHERE "idempotencyKey" = 'post_registration:<user_id>'
ORDER BY "createdAt" ASC;
```

Expected: one row only. If Resend shows duplicates despite one durable job row, add an explicit email send ledger before relying on retries for email-critical flows.

---

## 5. Go/No-Go

Go:

- Cron has produced a 200 within 2 minutes.
- Admin health endpoint returns successfully.
- Test registration creates one durable job and it reaches `succeeded`.
- `failedLast24h = 0` after the test.
- Welcome email is either exactly one send in production mode, or intentionally suppressed in beta mode.

No-go:

- Cron route is not being invoked.
- Pending jobs accumulate beyond 3 minutes.
- Running jobs remain locked beyond 5 minutes after repeated cron runs.
- Any `post_registration` job reaches terminal `failed`.
- Resend shows duplicate welcome emails for one user registration.
