// ============================================================
// CoachingHypothesis — long-term coach hypothesis memory
// ============================================================

import { sql } from "./connection";
import type {
  CoachingHypothesisForPrompt,
  CoachingHypothesisStatus,
} from "@/lib/coaching/hypothesis-memory";

export interface CoachingHypothesis {
  id: string;
  userId: string;
  hypothesis: string;
  evidenceJson: string[];
  counterEvidenceJson: string[];
  confidence: number;
  status: CoachingHypothesisStatus;
  sourceSessionId: string | null;
  lastValidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoachingHypothesisParams {
  userId: string;
  hypothesis: string;
  evidence: string[];
  confidence: number;
  sourceSessionId?: string | null;
}

export interface HypothesisValidationParams {
  id: string;
  userId: string;
  evidence?: string;
}

export interface HypothesisRejectionParams {
  id: string;
  userId: string;
  counterEvidence: string;
}

export function toPromptHypothesis(
  row: CoachingHypothesis,
): CoachingHypothesisForPrompt {
  return {
    id: row.id,
    hypothesis: row.hypothesis,
    evidence: row.evidenceJson,
    counterEvidence: row.counterEvidenceJson,
    confidence: row.confidence,
    status: row.status,
    lastValidatedAt: row.lastValidatedAt,
  };
}

export async function createCoachingHypothesis(
  params: CreateCoachingHypothesisParams,
): Promise<CoachingHypothesis> {
  const rows = await sql<CoachingHypothesis>`
    INSERT INTO "CoachingHypothesis" (
      "userId", "hypothesis", "evidenceJson", "counterEvidenceJson",
      "confidence", "status", "sourceSessionId"
    ) VALUES (
      ${params.userId},
      ${params.hypothesis},
      ${JSON.stringify(params.evidence)}::jsonb,
      ${JSON.stringify([])}::jsonb,
      ${params.confidence},
      'active',
      ${params.sourceSessionId ?? null}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function getOpenCoachingHypotheses(
  userId: string,
  limit = 20,
): Promise<CoachingHypothesis[]> {
  const rows = await sql<CoachingHypothesis>`
    SELECT *
    FROM "CoachingHypothesis"
    WHERE "userId" = ${userId}
      AND "status" IN ('active', 'confirmed')
    ORDER BY
      CASE WHEN "status" = 'confirmed' THEN 0 ELSE 1 END,
      "confidence" DESC,
      "updatedAt" DESC
    LIMIT ${limit}
  `;
  return rows;
}

export async function confirmCoachingHypothesis(
  params: HypothesisValidationParams,
): Promise<boolean> {
  const appendedEvidence = params.evidence ? [params.evidence] : [];
  const rows = await sql<{ id: string }>`
    UPDATE "CoachingHypothesis"
    SET
      "status" = 'confirmed',
      "lastValidatedAt" = now(),
      "updatedAt" = now(),
      "evidenceJson" =
        "evidenceJson" || ${JSON.stringify(appendedEvidence)}::jsonb
    WHERE "id" = ${params.id}
      AND "userId" = ${params.userId}
    RETURNING "id"
  `;
  return rows.length > 0;
}

export async function rejectCoachingHypothesis(
  params: HypothesisRejectionParams,
): Promise<boolean> {
  const rows = await sql<{ id: string }>`
    UPDATE "CoachingHypothesis"
    SET
      "status" = 'rejected',
      "lastValidatedAt" = now(),
      "updatedAt" = now(),
      "counterEvidenceJson" =
        "counterEvidenceJson" || ${JSON.stringify([params.counterEvidence])}::jsonb
    WHERE "id" = ${params.id}
      AND "userId" = ${params.userId}
    RETURNING "id"
  `;
  return rows.length > 0;
}

export async function markCoachingHypothesisStale(
  id: string,
  userId: string,
): Promise<boolean> {
  const rows = await sql<{ id: string }>`
    UPDATE "CoachingHypothesis"
    SET "status" = 'stale', "updatedAt" = now()
    WHERE "id" = ${id}
      AND "userId" = ${userId}
    RETURNING "id"
  `;
  return rows.length > 0;
}
