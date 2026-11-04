// ============================================================
// CoachingSessionSummary CRUD — Phase 4 longitudinal memory.
//
// Structured per-session summaries with pgvector embeddings, giving the coach
// cross-session continuity. Written by lib/coaching/session-summary.ts after a
// conversation ends; read by coaching-chat (recent + semantically relevant
// past sessions) through the evidence packet's session_summary slot.
// ============================================================

import { sql } from "./connection";
import { toVectorLiteral } from "@/lib/ai/embeddings";

export interface CoachingSessionSummary {
  id: string;
  userId: string;
  sessionId: string;
  summary: string;
  keyDecisions: string[];
  openLoops: string[];
  emotionalArc: string | null;
  createdAt: string;
}

export async function saveSessionSummary(input: {
  userId: string;
  sessionId: string;
  summary: string;
  keyDecisions: string[];
  openLoops: string[];
  emotionalArc: string | null;
  embedding: number[] | null;
}): Promise<void> {
  const embeddingLiteral = input.embedding
    ? toVectorLiteral(input.embedding)
    : null;
  // Idempotent: a retried or re-run summary for the same session replaces the
  // prior row instead of stacking duplicates (which would crowd genuine earlier
  // sessions out of getRecentSummaries' LIMIT, poisoning cross-session context).
  await sql`
    DELETE FROM "CoachingSessionSummary"
    WHERE "userId" = ${input.userId} AND "sessionId" = ${input.sessionId}
  `;
  await sql`
    INSERT INTO "CoachingSessionSummary"
      ("userId", "sessionId", "summary", "keyDecisions", "openLoops", "emotionalArc", "embedding")
    VALUES (
      ${input.userId},
      ${input.sessionId},
      ${input.summary},
      ${JSON.stringify(input.keyDecisions)}::jsonb,
      ${JSON.stringify(input.openLoops)}::jsonb,
      ${input.emotionalArc},
      ${embeddingLiteral}::vector
    )
  `;
}

/** Most recent session summaries for a user (reverse-chronological). */
export async function getRecentSummaries(
  userId: string,
  limit = 3,
): Promise<CoachingSessionSummary[]> {
  // Over-fetch then dedupe by sessionId (keep the most recent per session) as a
  // backstop against duplicate rows from concurrent writes — duplicates must not
  // crowd genuine earlier sessions out of the limit.
  const rows = (await sql`
    SELECT "id", "userId", "sessionId", "summary", "keyDecisions",
           "openLoops", "emotionalArc", "createdAt"
    FROM "CoachingSessionSummary"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT ${limit * 4}
  `) as CoachingSessionSummary[];
  const seen = new Set<string>();
  const deduped: CoachingSessionSummary[] = [];
  for (const row of rows) {
    if (seen.has(row.sessionId)) continue;
    seen.add(row.sessionId);
    deduped.push(row);
    if (deduped.length >= limit) break;
  }
  return deduped;
}

/** Past session summaries most semantically relevant to the current turn.
 *  Returns [] when nothing is embedded yet — caller can fall back to recents. */
export async function retrieveRelevantSummaries(
  userId: string,
  queryEmbedding: number[],
  limit = 3,
): Promise<CoachingSessionSummary[]> {
  return (await sql`
    SELECT "id", "userId", "sessionId", "summary", "keyDecisions",
           "openLoops", "emotionalArc", "createdAt"
    FROM "CoachingSessionSummary"
    WHERE "userId" = ${userId} AND "embedding" IS NOT NULL
    ORDER BY "embedding" <=> ${toVectorLiteral(queryEmbedding)}::vector
    LIMIT ${limit}
  `) as CoachingSessionSummary[];
}
