import { beforeEach, describe, expect, it, vi } from "vitest";

const { sqlMock } = vi.hoisted(() => ({
  sqlMock: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/db/connection", () => ({
  sql: new Proxy(sqlMock, {
    apply(target, _thisArg, args) {
      return target(...args);
    },
  }),
}));

import { enqueueCoachingReviewCandidate } from "../coaching-review-pool";

beforeEach(() => {
  vi.clearAllMocks();
  sqlMock.mockResolvedValue([]);
});

describe("coaching review pool DB", () => {
  it("enqueues a low-quality candidate with judge and deterministic payloads", async () => {
    await enqueueCoachingReviewCandidate({
      userId: "user-1",
      reportId: "report-1",
      round: 2,
      locale: "zh",
      reason: "llm-judge-missed-user-question",
      userMessage: "这是怎么回事？",
      assistantMessage: "这是一个值得探索的模式。",
      deterministicEval: {
        depthScore: 2,
        transitionScore: 2,
        evidenceGroundingScore: 2,
        prematureAdviceFlag: false,
        genericSummaryFlag: true,
        oneQuestionCompliance: true,
        reasons: ["generic-summary-opening"],
      },
      llmJudge: {
        answered_user_actual_question: false,
        specificity_score: 2,
        evidence_grounding_score: 2,
        transition_score: 2,
        coaching_depth_score: 2,
        premature_advice: false,
        abstract_language_flag: true,
        missed_emotion_flag: false,
        recommended_fix: "先回答真实问题。",
      },
    });

    expect(sqlMock).toHaveBeenCalledTimes(1);
    const sqlText = String(sqlMock.mock.calls[0][0]);
    expect(sqlText).toContain('"CoachingReviewPool"');
    expect(sqlText).toContain('"deterministicEvalJson"');
    expect(sqlText).toContain('"llmJudgeJson"');
  });
});
