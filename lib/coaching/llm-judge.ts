// ============================================================
// Coaching LLM judge — second layer of the quality loop
// ============================================================

// @language-guard-exempt: this LLM call returns internal JSON quality scores only; user-visible coaching text is produced by the guarded coaching stream.
import { z } from "zod/v4";
import { callLLMStructured } from "@/lib/ai/structured-output";
import type { CoachingTurnState } from "./turn-state";
import type {
  CoachingTurnUnderstanding,
  CoachingTurnUnderstandingV2,
} from "./turn-understanding";
import type { CoachingTurnEvalResult } from "./turn-eval";
import type { CoachingSpecificityEvalResult } from "./turn-specificity";

export const CoachingLLMJudgeResultSchema = z.object({
  answered_user_actual_question: z.boolean(),
  specificity_score: z.number().int().min(1).max(5),
  evidence_grounding_score: z.number().int().min(1).max(5),
  transition_score: z.number().int().min(1).max(5),
  coaching_depth_score: z.number().int().min(1).max(5),
  premature_advice: z.boolean(),
  abstract_language_flag: z.boolean(),
  missed_emotion_flag: z.boolean(),
  recommended_fix: z.string(),
});

export type CoachingLLMJudgeResult = z.infer<
  typeof CoachingLLMJudgeResultSchema
>;

type CoachingRiskLevel = CoachingTurnUnderstandingV2["riskLevel"];

interface JudgeMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function shouldRunLLMJudge(params: {
  deterministicEval: CoachingTurnEvalResult;
  specificityEval: CoachingSpecificityEvalResult;
  riskLevel?: CoachingRiskLevel;
  sampleRate?: number;
  random?: () => number;
}): boolean {
  const riskLevel = params.riskLevel ?? "normal";
  if (riskLevel !== "normal") return true;
  if (!params.specificityEval.pass) return true;
  if (params.deterministicEval.genericSummaryFlag) return true;
  if (params.deterministicEval.prematureAdviceFlag) return true;
  if (params.deterministicEval.evidenceGroundingScore <= 2) return true;
  if (params.deterministicEval.transitionScore <= 2) return true;
  if (!params.deterministicEval.oneQuestionCompliance) return true;

  const sampleRate = Math.max(0, Math.min(params.sampleRate ?? 0, 1));
  const random = params.random ?? Math.random;
  return sampleRate > 0 && random() < sampleRate;
}

export function buildLLMJudgeRewriteReasons(
  judge: CoachingLLMJudgeResult,
): string[] {
  const reasons: string[] = [];
  if (!judge.answered_user_actual_question) {
    reasons.push("llm-judge-missed-user-question");
  }
  if (judge.specificity_score <= 2) {
    reasons.push("llm-judge-low-specificity");
  }
  if (judge.evidence_grounding_score <= 2) {
    reasons.push("llm-judge-low-evidence-grounding");
  }
  if (judge.transition_score <= 2) {
    reasons.push("llm-judge-low-transition");
  }
  if (judge.coaching_depth_score <= 2) {
    reasons.push("llm-judge-low-coaching-depth");
  }
  if (judge.premature_advice) {
    reasons.push("llm-judge-premature-advice");
  }
  if (judge.abstract_language_flag) {
    reasons.push("llm-judge-abstract-language");
  }
  if (judge.missed_emotion_flag) {
    reasons.push("llm-judge-missed-emotion");
  }
  return reasons;
}

export function didLLMJudgePass(judge: CoachingLLMJudgeResult): boolean {
  return buildLLMJudgeRewriteReasons(judge).length === 0;
}

function buildJudgeMessages(params: {
  locale: string;
  userMessage: string | null;
  assistantMessage: string;
  turnState: CoachingTurnState;
  understandingV1?: CoachingTurnUnderstanding | null;
  understandingV2?: CoachingTurnUnderstandingV2 | null;
}): JudgeMessage[] {
  return [
    {
      role: "system",
      content:
        "You are a strict evaluator for a career identity coaching product. Judge only the assistant reply quality against the user's actual turn. Return JSON only.",
    },
    {
      role: "user",
      content: JSON.stringify({
        output_locale: params.locale,
        rubric: {
          answered_user_actual_question:
            "true only if the reply directly answers the user's actual why/how/opinion/request before asking a coaching question",
          specificity_score:
            "1 abstract and generic, 5 anchored in concrete user words/report/action evidence",
          evidence_grounding_score:
            "1 no evidence, 5 clearly uses user quote, report signal, memory, or action evidence",
          transition_score:
            "1 abrupt summary-to-next-step jump, 5 natural bridge between understanding and next move",
          coaching_depth_score:
            "1 shallow validation, 5 names a useful testable pattern or hypothesis without overclaiming",
          premature_advice:
            "true if advice/action appears before understanding the user's situation",
          abstract_language_flag:
            "true if terms like pattern/tension/explore/direction are floating without concrete anchor",
          missed_emotion_flag:
            "true if the user expressed emotion and the reply ignored it",
        },
        user_message: params.userMessage,
        assistant_message: params.assistantMessage,
        turn_state: params.turnState,
        deterministic_understanding: params.understandingV1 ?? null,
        semantic_understanding: params.understandingV2 ?? null,
      }),
    },
  ];
}

export async function evaluateCoachingTurnWithLLMJudge(params: {
  locale: string;
  userMessage: string | null;
  assistantMessage: string;
  turnState: CoachingTurnState;
  understandingV1?: CoachingTurnUnderstanding | null;
  understandingV2?: CoachingTurnUnderstandingV2 | null;
}): Promise<CoachingLLMJudgeResult | null> {
  try {
    return await callLLMStructured(
      "coaching-summary",
      buildJudgeMessages(params),
      CoachingLLMJudgeResultSchema,
    );
  } catch {
    return null;
  }
}
