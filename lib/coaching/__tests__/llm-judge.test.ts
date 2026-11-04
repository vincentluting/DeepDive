import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  CoachingLLMJudgeResultSchema,
  buildLLMJudgeRewriteReasons,
  evaluateCoachingTurnWithLLMJudge,
  shouldRunLLMJudge,
} from "../llm-judge";

const mockCallLLMStructured = vi.fn();

vi.mock("@/lib/ai/structured-output", () => ({
  callLLMStructured: (...args: unknown[]) => mockCallLLMStructured(...args),
}));

const deterministicPass = {
  depthScore: 4,
  transitionScore: 4,
  evidenceGroundingScore: 4,
  prematureAdviceFlag: false,
  genericSummaryFlag: false,
  oneQuestionCompliance: true,
  reasons: [],
};

const specificityPass = {
  pass: true,
  specificityScore: 4,
  answeredUserRequest: true,
  concreteAnchorPresent: true,
  tooAbstractFlag: false,
  reasons: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Coaching LLM judge", () => {
  it("validates the required judge JSON shape", () => {
    const result = CoachingLLMJudgeResultSchema.parse({
      answered_user_actual_question: false,
      specificity_score: 2,
      evidence_grounding_score: 3,
      transition_score: 4,
      coaching_depth_score: 2,
      premature_advice: true,
      abstract_language_flag: true,
      missed_emotion_flag: false,
      recommended_fix: "先回答用户问的具体原因，再引用用户原话。",
    });

    expect(result.specificity_score).toBe(2);
    expect(result.premature_advice).toBe(true);
  });

  it("falls back to null when structured judge output fails", async () => {
    mockCallLLMStructured.mockRejectedValueOnce(new Error("bad json"));

    const result = await evaluateCoachingTurnWithLLMJudge({
      locale: "zh",
      userMessage: "这是怎么回事？",
      assistantMessage: "这是一个值得探索的模式。",
      turnState: {
        currentPhase: "discovery",
        knownFacts: [],
        emotionalSignals: ["frustrated"],
        coreConcern: "AI coach quality",
        confirmedPatterns: [],
        unconfirmedHypotheses: [],
        lastCoachQuestion: null,
        userAnsweredLastQuestion: true,
        nextBestMove: "Answer directly.",
        evidenceQuote: "这是怎么回事？",
      },
      understandingV2: {
        requestType: "why_question",
        userActualQuestion: "这是怎么回事？",
        directAnswerNeeded: true,
        concreteObjects: ["AI聊天"],
        emotionalSignals: ["frustrated"],
        hiddenAssumptions: [],
        likelyTension: null,
        evidenceNeeded: [],
        nextBestMove: "先回答原因。",
        riskLevel: "normal",
      },
    });

    expect(result).toBeNull();
  });

  it("runs for deterministic failures, sensitive turns, and sampled passing turns", () => {
    expect(
      shouldRunLLMJudge({
        deterministicEval: {
          ...deterministicPass,
          evidenceGroundingScore: 2,
          reasons: ["missing-user-evidence-anchor"],
        },
        specificityEval: specificityPass,
        riskLevel: "normal",
        sampleRate: 0,
        random: () => 0.99,
      }),
    ).toBe(true);

    expect(
      shouldRunLLMJudge({
        deterministicEval: deterministicPass,
        specificityEval: specificityPass,
        riskLevel: "sensitive",
        sampleRate: 0,
        random: () => 0.99,
      }),
    ).toBe(true);

    expect(
      shouldRunLLMJudge({
        deterministicEval: deterministicPass,
        specificityEval: specificityPass,
        riskLevel: "normal",
        sampleRate: 0.2,
        random: () => 0.1,
      }),
    ).toBe(true);

    expect(
      shouldRunLLMJudge({
        deterministicEval: deterministicPass,
        specificityEval: specificityPass,
        riskLevel: "normal",
        sampleRate: 0,
        random: () => 0,
      }),
    ).toBe(false);
  });

  it("turns low judge scores into rewrite reasons", () => {
    const reasons = buildLLMJudgeRewriteReasons({
      answered_user_actual_question: false,
      specificity_score: 2,
      evidence_grounding_score: 2,
      transition_score: 3,
      coaching_depth_score: 2,
      premature_advice: true,
      abstract_language_flag: true,
      missed_emotion_flag: true,
      recommended_fix: "先回答问题。",
    });

    expect(reasons).toEqual(
      expect.arrayContaining([
        "llm-judge-missed-user-question",
        "llm-judge-low-specificity",
        "llm-judge-low-evidence-grounding",
        "llm-judge-low-coaching-depth",
        "llm-judge-premature-advice",
        "llm-judge-abstract-language",
        "llm-judge-missed-emotion",
      ]),
    );
  });
});
