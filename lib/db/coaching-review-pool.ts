// ============================================================
// CoachingReviewPool — low-quality turns queued for human review
// ============================================================

import { sql } from "./connection";
import type { CoachingTurnEvalResult } from "@/lib/coaching/turn-eval";
import type { CoachingLLMJudgeResult } from "@/lib/coaching/llm-judge";

export interface EnqueueCoachingReviewCandidateParams {
  userId: string | null;
  reportId?: string | null;
  round: number;
  locale: string;
  reason: string;
  userMessage: string | null;
  assistantMessage: string;
  deterministicEval: CoachingTurnEvalResult;
  llmJudge?: CoachingLLMJudgeResult | null;
}

export async function enqueueCoachingReviewCandidate(
  params: EnqueueCoachingReviewCandidateParams,
): Promise<void> {
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO "CoachingReviewPool" (
      "id", "userId", "reportId", "round", "locale", "reason",
      "userMessage", "assistantMessage",
      "deterministicEvalJson", "llmJudgeJson"
    ) VALUES (
      ${id},
      ${params.userId},
      ${params.reportId ?? null},
      ${params.round},
      ${params.locale},
      ${params.reason},
      ${params.userMessage},
      ${params.assistantMessage},
      ${JSON.stringify(params.deterministicEval)}::jsonb,
      ${JSON.stringify(params.llmJudge ?? null)}::jsonb
    )
  `;
}
