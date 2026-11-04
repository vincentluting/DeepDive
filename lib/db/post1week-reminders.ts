import { randomUUID } from "crypto";
import { sql } from "./connection";

export interface Post1WeekReminderCandidate {
  userId: string;
  email: string;
  name: string | null;
  postImmediateAt: string;
}

/**
 * Bug-log #008: previously the candidate query excluded EVERY user that had
 * any `Post1WeekReminderLog` row, regardless of `sendStatus`. So a single
 * email outage (sendEmail returns false / throws) would permanently lock
 * the affected users out of T2 — they would never appear in candidate lists
 * again, even after the email service recovered. That destroys the entire
 * day's T2 cohort.
 *
 * The fix changes the exclusion rule:
 *   - `sent`             → permanently excluded (correct: don't re-email)
 *   - recent `claimed`   → excluded (another worker is currently sending)
 *   - stale `claimed`    → INCLUDED (likely a crashed worker; retry)
 *   - `failed` < 24h     → excluded (cool-down, prevents admin spam-retry
 *                          of a permanently-bad email address)
 *   - `failed` ≥ 24h     → INCLUDED (transient errors deserve a retry)
 *
 * The `claimedAt < NOW() - INTERVAL '1 hour'` threshold for stale `claimed`
 * matches the in-app sendEmail timeout budget — anything older than that is
 * almost certainly abandoned.
 *
 * Combined with the daily cron cadence this still throttles retry frequency.
 * For permanently-bad emails (e.g. invalid mailbox) the 24h failed-cooldown
 * means at most one retry per day; admins should reconcile via the
 * `error` column rather than relying on automatic retry to clear them.
 *
 * NOTE: a hard retry-count cap (`MAX_ATTEMPTS = 3` etc.) would require a
 * schema migration to add an `attemptCount` column. Logged as a follow-up
 * in bug-log Phase 4 retro; the 24h cooldown is the pragmatic ship-now fix.
 */
const FAILED_COOLDOWN_HOURS = 24;
const STALE_CLAIM_HOURS = 1;

export async function getPost1WeekReminderCandidates(): Promise<
  Post1WeekReminderCandidate[]
> {
  const rows = await sql<Post1WeekReminderCandidate>`
    SELECT u."id" AS "userId", u."email", u."name",
           pp."createdAt"::text AS "postImmediateAt"
    FROM "User" u
    JOIN "PrePostAssessment" pp
      ON pp."userId" = u."id" AND pp."assessmentType" = 'post_immediate'
    WHERE u."researchGroup" IS NOT NULL
      AND pp."createdAt" < NOW() - INTERVAL '7 days'
      AND NOT EXISTS (
        SELECT 1 FROM "PrePostAssessment" p2
        WHERE p2."userId" = u."id" AND p2."assessmentType" = 'post_1week'
      )
      AND NOT EXISTS (
        SELECT 1 FROM "Post1WeekReminderLog" rl
        WHERE rl."userId" = u."id"
          AND (
            rl."sendStatus" = 'sent'
            OR (
              rl."sendStatus" = 'claimed'
              AND rl."claimedAt" > NOW() - (${STALE_CLAIM_HOURS}::int * INTERVAL '1 hour')
            )
            OR (
              rl."sendStatus" = 'failed'
              AND rl."claimedAt" > NOW() - (${FAILED_COOLDOWN_HOURS}::int * INTERVAL '1 hour')
            )
          )
      )
    ORDER BY pp."createdAt" ASC
  `;
  return rows;
}

/**
 * Bug-log #008 (continued): claim now does an upsert that re-arms a failed
 * (after the cool-down) or stale-claimed row instead of silently no-op'ing
 * on `ON CONFLICT`. The `WHERE` clause on the UPDATE preserves the
 * existing `sent` rows so we never re-send, and gates the failed re-claim
 * to the same 24-hour cool-down used by the candidate query — this keeps
 * the admin endpoint from spamming the same bad mailbox repeatedly.
 *
 * Returns the row id on successful claim (insert or re-arm) or null when
 * another worker already holds an active claim, the row is `sent`, or a
 * failed row is still in cool-down.
 */
export async function claimPost1WeekReminder(data: {
  userId: string;
  email: string;
  locale: "en" | "zh";
  postImmediateAt: string;
}): Promise<string | null> {
  const rows = await sql<{ id: string }>`
    INSERT INTO "Post1WeekReminderLog" (
      "id", "userId", "email", "locale", "postImmediateAt", "sendStatus", "claimedAt"
    ) VALUES (
      ${randomUUID()}, ${data.userId}, ${data.email}, ${data.locale},
      ${data.postImmediateAt}, 'claimed', NOW()
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "sendStatus"      = 'claimed',
      "claimedAt"       = NOW(),
      "email"           = EXCLUDED."email",
      "locale"          = EXCLUDED."locale",
      "postImmediateAt" = EXCLUDED."postImmediateAt",
      "sentAt"          = NULL,
      "error"           = NULL
    WHERE
      (
        "Post1WeekReminderLog"."sendStatus" = 'failed'
        AND "Post1WeekReminderLog"."claimedAt" < NOW() - (${FAILED_COOLDOWN_HOURS}::int * INTERVAL '1 hour')
      )
      OR (
        "Post1WeekReminderLog"."sendStatus" = 'claimed'
        AND "Post1WeekReminderLog"."claimedAt" < NOW() - (${STALE_CLAIM_HOURS}::int * INTERVAL '1 hour')
      )
    RETURNING "id"
  `;
  return rows[0]?.id ?? null;
}

export async function markPost1WeekReminderResult(data: {
  id: string;
  sent: boolean;
  error?: string | null;
}): Promise<void> {
  await sql`
    UPDATE "Post1WeekReminderLog"
    SET
      "sendStatus" = ${data.sent ? "sent" : "failed"},
      "sentAt" = ${data.sent ? new Date() : null},
      "error" = ${data.error ?? null}
    WHERE "id" = ${data.id}
  `;
}
