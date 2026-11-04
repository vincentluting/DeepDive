import { describe, expect, it } from "vitest";
import { computeCoachingQualityMetrics } from "../eval-metrics";

describe("coaching eval metrics", () => {
  it("computes dashboard rates from deterministic and judge signals", () => {
    const metrics = computeCoachingQualityMetrics([
      {
        depthScore: 2,
        transitionScore: 4,
        evidenceGroundingScore: 4,
        prematureAdviceFlag: false,
        genericSummaryFlag: false,
        oneQuestionCompliance: true,
        reasonsJson: ["llm-judge-low-coaching-depth"],
        stateJson: {},
      },
      {
        depthScore: 4,
        transitionScore: 2,
        evidenceGroundingScore: 2,
        prematureAdviceFlag: false,
        genericSummaryFlag: true,
        oneQuestionCompliance: true,
        reasonsJson: [
          "too-abstract",
          "llm-judge-missed-user-question",
        ],
        stateJson: { qualityRewrite: "1", llmJudgeStatus: "fail" },
      },
      {
        depthScore: 5,
        transitionScore: 5,
        evidenceGroundingScore: 5,
        prematureAdviceFlag: false,
        genericSummaryFlag: false,
        oneQuestionCompliance: true,
        reasonsJson: [],
        stateJson: { llmJudgeStatus: "pass" },
      },
    ]);

    expect(metrics.totalTurns).toBe(3);
    expect(metrics.too_superficial_rate).toBeCloseTo(1 / 3);
    expect(metrics.abstract_reply_rate).toBeCloseTo(1 / 3);
    expect(metrics.disjointed_rate).toBeCloseTo(1 / 3);
    expect(metrics.missed_user_question_rate).toBeCloseTo(1 / 3);
    expect(metrics.rewrite_rate).toBeCloseTo(1 / 3);
    expect(metrics.eval_pass_rate).toBeCloseTo(1 / 3);
  });
});
