// ============================================================
// CoachingTurnEval — per-turn product quality telemetry
//
// This table tracks conversational quality signals that are specific to the
// coaching product, separate from provider-level LLMUsageLog.
// ============================================================

import { sql } from "./connection";
import type { CoachingPhase } from "@/lib/coaching/turn-state";
import type { CoachingTurnEvalResult } from "@/lib/coaching/turn-eval";

export interface SaveCoachingTurnEvalParams {
  userId: string | null;
  reportId?: string | null;
  round: number;
  locale: string;
  phase: CoachingPhase;
  evalResult: CoachingTurnEvalResult;
  stateJson: Record<string, unknown>;
}

export function saveCoachingTurnEval(
  params: SaveCoachingTurnEvalParams,
): void {
  const id = crypto.randomUUID();
  const { evalResult } = params;

  sql`
    INSERT INTO "CoachingTurnEval" (
      "id", "userId", "reportId", "round", "locale", "phase",
      "depthScore", "transitionScore", "evidenceGroundingScore",
      "prematureAdviceFlag", "genericSummaryFlag", "oneQuestionCompliance",
      "reasonsJson", "stateJson"
    ) VALUES (
      ${id},
      ${params.userId},
      ${params.reportId ?? null},
      ${params.round},
      ${params.locale},
      ${params.phase},
      ${evalResult.depthScore},
      ${evalResult.transitionScore},
      ${evalResult.evidenceGroundingScore},
      ${evalResult.prematureAdviceFlag},
      ${evalResult.genericSummaryFlag},
      ${evalResult.oneQuestionCompliance},
      ${JSON.stringify(evalResult.reasons)}::jsonb,
      ${JSON.stringify(params.stateJson)}::jsonb
    )
  `.catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[coaching-turn-eval] Failed to save turn eval:", msg);
  });
}
