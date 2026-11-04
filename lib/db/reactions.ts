// ============================================================
// Reactions — ReportReaction CRUD
//
// Table: ReportReaction
// Key fields: id, reportId, userId, reaction
// Reaction types: 'surprised' | 'skeptical' | 'resonates'
// Upserts by reportId + userId (one reaction per user per report).
// ============================================================

import { sql } from './connection';

export type ReactionType = 'surprised' | 'skeptical' | 'resonates';

/**
 * Save a report reaction. Upserts by reportId + userId/anonymous.
 */
export async function saveReaction(
  reportId: string,
  reaction: ReactionType,
  userId?: string | null
): Promise<{ id: string }> {
  const id = crypto.randomUUID();

  if (userId) {
    // Atomic upsert using the partial unique index idx_reaction_report_user (migration 011)
    const rows = await sql`
      INSERT INTO "ReportReaction" ("id", "userId", "reportId", "reaction")
      VALUES (${id}, ${userId}, ${reportId}, ${reaction})
      ON CONFLICT ("reportId", "userId") WHERE "userId" IS NOT NULL
      DO UPDATE SET "reaction" = EXCLUDED."reaction", "createdAt" = NOW()
      RETURNING "id"
    `;
    return { id: rows[0].id as string };
  }

  await sql`
    INSERT INTO "ReportReaction" ("id", "userId", "reportId", "reaction")
    VALUES (${id}, ${null}, ${reportId}, ${reaction})
  `;
  return { id };
}

/**
 * Get the reaction for a specific report and user.
 */
export async function getReaction(
  reportId: string,
  userId?: string | null
): Promise<ReactionType | null> {
  if (!userId) return null;

  const rows = await sql`
    SELECT "reaction" FROM "ReportReaction"
    WHERE "reportId" = ${reportId} AND "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  return rows[0].reaction as ReactionType;
}
