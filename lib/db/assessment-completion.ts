// ============================================================
// AssessmentCompletion — Unified assessment completion registry
//
// Single source of truth for "which assessments has this user completed?"
// Replaces ad-hoc checks (hasQuickDiveResult, getDeepDiveStatusForUser)
// with a unified query interface.
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";
import type { AssessmentType } from "@/lib/types/platform";

/**
 * Record a completed assessment for a user.
 * Idempotent: duplicate (userId, assessmentType, resultId) is silently ignored.
 */
export async function recordAssessmentCompletion(params: {
  userId: string;
  assessmentType: AssessmentType;
  resultId: string;
}): Promise<void> {
  const id = randomUUID();
  try {
    await sql`
      INSERT INTO "AssessmentCompletion" ("id", "userId", "assessmentType", "resultId", "completedAt")
      VALUES (${id}, ${params.userId}, ${params.assessmentType}, ${params.resultId}, NOW())
      ON CONFLICT ("userId", "assessmentType", "resultId") DO NOTHING
    `;
  } catch (err) {
    throw new Error(
      `Failed to record assessment completion for user=${params.userId} type=${params.assessmentType}`,
      { cause: err },
    );
  }
}

/**
 * Get completion status for multiple assessment types at once.
 * Returns a map of assessmentType → boolean.
 */
export async function getCompletionStatus(
  userId: string,
  types: AssessmentType[],
): Promise<Record<AssessmentType, boolean>> {
  const result: Record<string, boolean> = {};
  for (const t of types) {
    result[t] = false;
  }

  if (types.length === 0) return result as Record<AssessmentType, boolean>;

  const rows = await sql`
    SELECT DISTINCT "assessmentType"
    FROM "AssessmentCompletion"
    WHERE "userId" = ${userId}
      AND "assessmentType" = ANY(${types})
  `;

  for (const row of rows) {
    result[row.assessmentType as string] = true;
  }

  return result as Record<AssessmentType, boolean>;
}

/**
 * Delete completion records for a user + assessment type (used by retake flow).
 */
export async function deleteAssessmentCompletion(
  userId: string,
  assessmentType: AssessmentType,
): Promise<void> {
  try {
    await sql`
      DELETE FROM "AssessmentCompletion"
      WHERE "userId" = ${userId} AND "assessmentType" = ${assessmentType}
    `;
  } catch (err) {
    throw new Error(
      `Failed to delete assessment completion for user=${userId} type=${assessmentType}`,
      { cause: err },
    );
  }
}
