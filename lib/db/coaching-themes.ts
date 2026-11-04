// ============================================================
// CoachingTheme — CRUD for longitudinal coaching memory
//
// Tracks recurring topics, sentiments, and patterns across
// coaching sessions to enable contradiction detection and
// growth tracking.
// ============================================================

import { sql } from "./connection";

export interface CoachingTheme {
  id: string;
  userId: string;
  theme: string;
  context: string | null;
  sentiment: "positive" | "negative" | "neutral" | "conflicted" | null;
  mentionCount: number;
  firstMentionedAt: string;
  lastMentionedAt: string;
  resolved: boolean;
}

/** Get active (unresolved) themes for a user, sorted by mention count desc */
export async function getActiveThemes(
  userId: string,
  limit = 15,
): Promise<CoachingTheme[]> {
  const rows = await sql<CoachingTheme>`
    SELECT * FROM "CoachingTheme"
    WHERE "userId" = ${userId} AND "resolved" = FALSE
    ORDER BY "mentionCount" DESC, "lastMentionedAt" DESC
    LIMIT ${limit}
  `;
  return rows;
}

/** Upsert a theme: increment count if exists, create if new */
export async function upsertTheme(
  userId: string,
  theme: string,
  context: string | null,
  sentiment: CoachingTheme["sentiment"],
): Promise<CoachingTheme> {
  const rows = await sql<CoachingTheme>`
    INSERT INTO "CoachingTheme" ("userId", "theme", "context", "sentiment")
    VALUES (${userId}, ${theme}, ${context}, ${sentiment})
    ON CONFLICT ("userId", "theme")
    DO UPDATE SET
      "mentionCount" = "CoachingTheme"."mentionCount" + 1,
      "lastMentionedAt" = now(),
      "context" = COALESCE(EXCLUDED."context", "CoachingTheme"."context"),
      "sentiment" = COALESCE(EXCLUDED."sentiment", "CoachingTheme"."sentiment")
    RETURNING *
  `;
  return rows[0];
}

/** Mark a theme as resolved (user has moved past this topic) */
export async function resolveTheme(
  themeId: string,
  userId: string,
): Promise<void> {
  await sql`
    UPDATE "CoachingTheme" SET "resolved" = TRUE
    WHERE "id" = ${themeId} AND "userId" = ${userId}
  `;
}

/** Get themes that might indicate contradictions (conflicted sentiment or high frequency) */
export async function getContradictionCandidates(
  userId: string,
): Promise<CoachingTheme[]> {
  const rows = await sql<CoachingTheme>`
    SELECT * FROM "CoachingTheme"
    WHERE "userId" = ${userId}
      AND "resolved" = FALSE
      AND ("sentiment" = 'conflicted' OR "mentionCount" >= 3)
    ORDER BY "mentionCount" DESC
    LIMIT 5
  `;
  return rows;
}

/** Get themes showing growth (sentiment changed from negative to positive, or resolved) */
export async function getGrowthIndicators(
  userId: string,
): Promise<CoachingTheme[]> {
  const rows = await sql<CoachingTheme>`
    SELECT * FROM "CoachingTheme"
    WHERE "userId" = ${userId}
      AND "resolved" = TRUE
      AND "mentionCount" >= 2
    ORDER BY "lastMentionedAt" DESC
    LIMIT 5
  `;
  return rows;
}
