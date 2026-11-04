// ============================================================
// CoachingFeedback — CRUD
//
// Table: CoachingFeedback
// Key fields: id, sessionId, userId, rating, highlight, createdAt
// Stores satisfaction feedback collected at the end of coaching sessions.
// ============================================================

import { sql } from './connection';

export type CoachingFeedbackRating = 'okay' | 'helpful' | 'very_helpful';
export type CoachingFeedbackTag =
  | 'too_superficial'
  | 'disjointed'
  | 'too_fast_advice'
  | 'missed_emotion'
  | 'did_not_use_report';
export type CoachingFeedbackReason =
  | "understood_me"
  | "missed_my_point"
  | "unclear"
  | "too_many_questions"
  | "too_generic"
  | "not_practical"
  | "avoided_recommendation"
  | "helpful_next_step"
  | "natural_conversation";

export interface SaveCoachingFeedbackParams {
  sessionId: string;
  userId: string | null;
  rating: CoachingFeedbackRating;
  reasons?: CoachingFeedbackReason[];
  highlight?: string | null;
  tags?: CoachingFeedbackTag[];
}

// Table is created by initTables() in lib/db/admin.ts (synced with scripts/schema.sql).

export async function saveCoachingFeedback(
  params: SaveCoachingFeedbackParams
): Promise<{ id: string }> {

  const id = crypto.randomUUID();
  const {
    sessionId,
    userId,
    rating,
    reasons = [],
    highlight = null,
    tags = [],
  } = params;

  try {
    await sql`
      INSERT INTO "CoachingFeedback" (
        "id", "sessionId", "userId", "rating", "reasons", "highlight", "tagsJson"
      )
      VALUES (${id}, ${sessionId}, ${userId}, ${rating}, ${reasons}, ${highlight}, ${JSON.stringify(tags)}::jsonb)
    `;
  } catch (dbErr) {
    throw new Error(`saveCoachingFeedback DB insert failed for session ${sessionId}`, { cause: dbErr });
  }

  return { id };
}
