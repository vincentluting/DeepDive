// ============================================================
// PrePostAssessment — Combined SCC + CDC + Research Questions
//
// Table: PrePostAssessment
// Stores pre/post_immediate/post_1week measurement data for
// between-subject research study.
//
// Note: CDSE-SF was removed in v4.3 (replaced by CDC-5).
// DB columns cdseResponses/cdseTotalScore are repurposed for CDC-5 data:
// cdseResponses stores CDC-5 item-level responses (JSON);
// cdseTotalScore stores CDC-5 sum score (range 5–25).
// ============================================================

import { sql } from "./connection";
import type { SCCResponses } from "@/lib/cdse/scc-questions";
import { computeSCCTotalScore } from "@/lib/cdse/scc-questions";
import type {
  ExperienceFeedback,
  PrePostAssessmentType,
} from "@/lib/types/platform";
import { hasResearchConsent } from "./consent-records";

export interface PrePostAssessmentRecord {
  id: number;
  userId: string | null;
  assessmentType: PrePostAssessmentType;
  sccResponses: SCCResponses;
  sccTotalScore: number;
  cdcResponses: Record<string, number> | null; // CDC-5 item responses (repurposed cdseResponses column)
  cdcTotalScore: number | null; // CDC-5 sum score range 5–25 (repurposed cdseTotalScore column)
  experienceFeedback: ExperienceFeedback | null;
  createdAt: string;
}

export async function savePrePostAssessment(data: {
  userId: string | null;
  assessmentType: PrePostAssessmentType;
  sccResponses: SCCResponses;
  cdcResponses?: Record<string, number>;
  experienceFeedback?: ExperienceFeedback;
}): Promise<number> {
  const sccTotalScore = computeSCCTotalScore(data.sccResponses);
  const cdcTotalScore = data.cdcResponses
    ? Object.values(data.cdcResponses).reduce((sum, v) => sum + v, 0)
    : null;

  try {
    const rows = await sql`
      INSERT INTO "PrePostAssessment" (
        "userId", "assessmentType", "sccResponses", "sccTotalScore",
        "cdseResponses", "cdseTotalScore", "experienceFeedback"
      )
      VALUES (
        ${data.userId},
        ${data.assessmentType},
        ${JSON.stringify(data.sccResponses)}::jsonb,
        ${sccTotalScore},
        ${data.cdcResponses ? JSON.stringify(data.cdcResponses) : null}::jsonb,
        ${cdcTotalScore},
        ${data.experienceFeedback ? JSON.stringify(data.experienceFeedback) : null}::jsonb
      )
      RETURNING "id"
    `;
    return rows[0].id as number;
  } catch (dbErr) {
    // Unique constraint (userId, assessmentType) — migration 012.
    // Concurrent duplicate: a parallel request already committed this
    // user+timepoint, so the data IS saved. Return the existing id and let the
    // caller treat it as an idempotent success instead of a 500 that would
    // scare a research participant into dropping out (#011).
    if ((dbErr as { code?: string }).code === "23505") {
      const existing = (await sql`
        SELECT "id" FROM "PrePostAssessment"
        WHERE "userId" = ${data.userId}
          AND "assessmentType" = ${data.assessmentType}
        LIMIT 1
      `) as Array<{ id: number }>;
      if (existing[0]?.id != null) return existing[0].id;
      throw new Error(
        `Duplicate assessment submission for user ${data.userId ?? "anonymous"}, type '${data.assessmentType}'`,
        { cause: dbErr },
      );
    }
    throw new Error(
      `savePrePostAssessment failed for user ${data.userId ?? "anonymous"}`,
      { cause: dbErr },
    );
  }
}

export async function getPrePostAssessments(userId: string): Promise<{
  pre: PrePostAssessmentRecord | null;
  postImmediate: PrePostAssessmentRecord | null;
  post1Week: PrePostAssessmentRecord | null;
}> {
  const rows = await sql`
    SELECT "id", "userId", "assessmentType", "sccResponses", "sccTotalScore",
           "cdseResponses", "cdseTotalScore", "experienceFeedback", "createdAt"
    FROM "PrePostAssessment"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
  `;

  let pre: PrePostAssessmentRecord | null = null;
  let postImmediate: PrePostAssessmentRecord | null = null;
  let post1Week: PrePostAssessmentRecord | null = null;

  for (const row of rows) {
    const record: PrePostAssessmentRecord = {
      id: row.id as number,
      userId: row.userId as string | null,
      assessmentType: row.assessmentType as PrePostAssessmentType,
      sccResponses: row.sccResponses as SCCResponses,
      sccTotalScore: Number(row.sccTotalScore),
      cdcResponses: (row.cdseResponses as Record<string, number>) ?? null,
      cdcTotalScore:
        row.cdseTotalScore != null ? Number(row.cdseTotalScore) : null,
      experienceFeedback: row.experienceFeedback as ExperienceFeedback | null,
      createdAt: (row.createdAt as Date).toISOString(),
    };

    if (record.assessmentType === "pre" && !pre) {
      pre = record;
    } else if (record.assessmentType === "post_immediate" && !postImmediate) {
      postImmediate = record;
    } else if (record.assessmentType === "post_1week" && !post1Week) {
      post1Week = record;
    }

    if (pre && postImmediate && post1Week) break;
  }

  return { pre, postImmediate, post1Week };
}

/** Check if a research participant has completed the pre-assessment. */
export async function hasCompletedPre(userId: string): Promise<boolean> {
  const userRows = await sql`
    SELECT "researchGroup" FROM "User" WHERE "id" = ${userId}
  `;
  const isResearchParticipant = !!userRows[0]?.researchGroup;
  const rows = await sql`
    SELECT 1 FROM "PrePostAssessment"
    WHERE "userId" = ${userId} AND "assessmentType" = 'pre'
    LIMIT 1
  `;
  if (rows.length === 0) return false;
  if (!isResearchParticipant) return true;
  return hasResearchConsent(userId);
}

/**
 * Check if user is eligible for post_1week assessment:
 * - User has researchGroup set (is a research participant)
 * - Has a post_immediate record
 * - post_immediate was created >= 7 days ago
 * - Does NOT have a post_1week record yet
 */
export async function isEligibleForPost1Week(userId: string): Promise<{
  eligible: boolean;
  postImmediateDate: string | null;
}> {
  // Check if user is a research participant
  const userRows = await sql`
    SELECT "researchGroup" FROM "User" WHERE "id" = ${userId}
  `;
  if (userRows.length === 0 || !userRows[0].researchGroup) {
    return { eligible: false, postImmediateDate: null };
  }

  const rows = await sql`
    SELECT "assessmentType", "createdAt"
    FROM "PrePostAssessment"
    WHERE "userId" = ${userId}
      AND "assessmentType" IN ('post_immediate', 'post_1week')
    ORDER BY "createdAt" DESC
  `;

  let postImmediateDate: string | null = null;
  let hasPost1Week = false;

  for (const row of rows) {
    if (row.assessmentType === "post_1week") {
      hasPost1Week = true;
    }
    if (row.assessmentType === "post_immediate" && !postImmediateDate) {
      postImmediateDate = (row.createdAt as Date).toISOString();
    }
  }

  if (!postImmediateDate || hasPost1Week) {
    return { eligible: false, postImmediateDate };
  }

  const daysSinceImmediate =
    (Date.now() - new Date(postImmediateDate).getTime()) /
    (1000 * 60 * 60 * 24);
  return {
    eligible: daysSinceImmediate >= 7,
    postImmediateDate,
  };
}
