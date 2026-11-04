// ============================================================
// NPS — ReportNPS CRUD
//
// Table: ReportNPS
// Key fields: id, reportId, userId, score (0-10), feedback, locale
// Upserts by reportId + userId (one NPS per user per report).
// ============================================================

import { sql } from './connection';

/**
 * Upsert an NPS score for a report.
 * If the user has already rated this report, update the score.
 */
export async function saveNPS(
  reportId: string,
  score: number,
  options: {
    userId?: string | null;
    pmfResponse?: string | null;
    feedback?: string | null;
    locale?: string | null;
  } = {}
): Promise<{ id: string }> {
  const { userId = null, pmfResponse = null, feedback = null, locale = null } = options;

  const id = crypto.randomUUID();

  if (userId) {
    // Atomic upsert using the partial unique index idx_nps_report_user
    const rows = await sql`
      INSERT INTO "ReportNPS" ("id", "reportId", "userId", "score", "pmfResponse", "feedback", "locale")
      VALUES (${id}, ${reportId}, ${userId}, ${score}, ${pmfResponse}, ${feedback}, ${locale})
      ON CONFLICT ("reportId", "userId") WHERE "userId" IS NOT NULL
      DO UPDATE SET "score" = EXCLUDED."score", "pmfResponse" = EXCLUDED."pmfResponse", "feedback" = EXCLUDED."feedback", "locale" = EXCLUDED."locale", "createdAt" = NOW()
      RETURNING "id"
    `;
    return { id: rows[0].id as string };
  }

  await sql`
    INSERT INTO "ReportNPS" ("id", "reportId", "userId", "score", "pmfResponse", "feedback", "locale")
    VALUES (${id}, ${reportId}, ${userId}, ${score}, ${pmfResponse}, ${feedback}, ${locale})
  `;
  return { id };
}

/**
 * Get the NPS score a user gave to a specific report.
 */
export async function getNPS(
  reportId: string,
  userId?: string | null
): Promise<{ score: number; pmfResponse: string | null; feedback: string | null } | null> {
  if (!userId) return null;

  const rows = await sql`
    SELECT "score", "pmfResponse", "feedback" FROM "ReportNPS"
    WHERE "reportId" = ${reportId} AND "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  return {
    score: rows[0].score as number,
    pmfResponse: (rows[0].pmfResponse as string) || null,
    feedback: (rows[0].feedback as string) || null,
  };
}

/**
 * Get the average NPS score across all reports.
 */
export async function getNPSAverage(): Promise<{ average: number; count: number }> {
  const rows = await sql`
    SELECT
      ROUND(AVG("score")::numeric, 1) as "average",
      COUNT(*)::int as "count"
    FROM "ReportNPS"
  `;

  return {
    average: parseFloat(rows[0]?.average as string) || 0,
    count: (rows[0]?.count as number) || 0,
  };
}
