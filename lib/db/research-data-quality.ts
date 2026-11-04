// ============================================================
// Research data quality — DB reads for the admin Data Quality panel.
//
// Returns research-chain rows in the exact shape consumed by
// lib/research/thesis-validation.ts (same rules as `npm run verify:thesis`).
// Timepoints follow the canonical rule: T0 = MIN(pre), T1/T2 = MAX(post).
// ============================================================

import { sql } from "./connection";
import type { ResearchChainRow } from "@/lib/research/thesis-validation";

/**
 * One row per user with any research signal (group, consent, or a
 * PrePostAssessment record). Deliberately WIDER than the canonical
 * research population — the quality panel's job is to surface users
 * who are PARTIALLY enrolled (e.g. consented but no group, T0 without
 * consent), which the strict population filter would hide.
 */
export async function getResearchChainRows(): Promise<ResearchChainRow[]> {
  const rows = await sql`
    WITH
      consent_rows AS (
        SELECT "userId",
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE "withdrawnAt" IS NULL)::int AS active
        FROM "ConsentRecord"
        GROUP BY "userId"
      ),
      -- Canonical timepoint rule: T0 = FIRST pre, T1/T2 = LATEST post
      t0 AS (
        SELECT "userId", MIN("createdAt") AS "createdAt"
        FROM "PrePostAssessment"
        WHERE "assessmentType" = 'pre'
        GROUP BY "userId"
      ),
      t1 AS (
        SELECT "userId", MAX("createdAt") AS "createdAt"
        FROM "PrePostAssessment"
        WHERE "assessmentType" = 'post_immediate'
        GROUP BY "userId"
      ),
      t2 AS (
        SELECT "userId", MAX("createdAt") AS "createdAt"
        FROM "PrePostAssessment"
        WHERE "assessmentType" = 'post_1week'
        GROUP BY "userId"
      ),
      coaching AS (
        SELECT "userId", COUNT(*)::int AS c
        FROM "CoachingSession"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      ),
      reminder AS (
        SELECT "userId", "sendStatus"
        FROM "Post1WeekReminderLog"
      )
    SELECT
      u."id"                                AS "userId",
      u."email",
      u."researchGroup"                     AS "researchGroup",
      u."researchConsentAt"                 AS "researchConsentAt",
      u."isAdmin"                           AS "isAdmin",
      (COALESCE(cr.total, 0) > 0)           AS "hasConsentRecord",
      (COALESCE(cr.active, 0) > 0)          AS "hasActiveConsentRecord",
      t0."createdAt"                        AS "t0At",
      t1."createdAt"                        AS "t1At",
      t2."createdAt"                        AS "t2At",
      COALESCE(ch.c, 0)                     AS "coachingSessionCount",
      COALESCE(r."sendStatus", 'none')      AS "reminderLogStatus"
    FROM "User" u
    LEFT JOIN consent_rows cr ON cr."userId" = u."id"
    LEFT JOIN t0           ON t0."userId" = u."id"
    LEFT JOIN t1           ON t1."userId" = u."id"
    LEFT JOIN t2           ON t2."userId" = u."id"
    LEFT JOIN coaching ch  ON ch."userId" = u."id"
    LEFT JOIN reminder r   ON r."userId" = u."id"
    WHERE u."researchGroup" IS NOT NULL
       OR cr."userId" IS NOT NULL
       OR t0."userId" IS NOT NULL
       OR t1."userId" IS NOT NULL
       OR t2."userId" IS NOT NULL
    ORDER BY u."createdAt" ASC
  `;

  return rows.map((r) => ({
    userId: r.userId as string,
    email: (r.email as string) || "",
    researchGroup: (r.researchGroup as string) || null,
    researchConsentAt: r.researchConsentAt
      ? new Date(r.researchConsentAt as string).toISOString()
      : null,
    hasConsentRecord: r.hasConsentRecord === true,
    hasActiveConsentRecord: r.hasActiveConsentRecord === true,
    isAdmin: r.isAdmin === true,
    t0At: r.t0At ? new Date(r.t0At as string).toISOString() : null,
    t1At: r.t1At ? new Date(r.t1At as string).toISOString() : null,
    t2At: r.t2At ? new Date(r.t2At as string).toISOString() : null,
    coachingSessionCount: Number(r.coachingSessionCount) || 0,
    reminderLogStatus:
      (r.reminderLogStatus as ResearchChainRow["reminderLogStatus"]) || "none",
  }));
}
