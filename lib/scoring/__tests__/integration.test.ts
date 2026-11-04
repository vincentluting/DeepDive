// ============================================================
// Scoring Pipeline v3.0 — Integration Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { runScoringPipelineV3 } from "../index";
import type { QuestionnaireAnswersV3, SessionMetadataV3 } from "../index";
import type { RIASECDimension } from "../../types";
import { DDVQ21_ITEMS, IPIP_60_ITEM_IDS } from "../../questionnaire";

// ============================================================
// Helpers
// ============================================================

function buildMockRiasec(): Record<RIASECDimension, number> {
  return { R: 60, I: 80, A: 70, S: 50, E: 40, C: 30 };
}

// ============================================================
// v3.0 Pipeline Helpers
// ============================================================

function buildMockAnswersV3(): QuestionnaireAnswersV3 {
  // Module A: SJT — all consistent (would = should = B)
  const sjt = Array.from({ length: 6 }, (_, i) => ({
    scenarioId: i + 1,
    wouldChoice: "B",
    shouldChoice: "B",
  }));

  // Module B: TwIVI — moderate across the board (rating = 4)
  const values: Record<number, number> = {};
  for (const item of DDVQ21_ITEMS) {
    values[item.id] = 4;
  }

  // Module C: IPIP-60 — midpoint across the board (rating = 3)
  const ipip60: Record<number, number> = {};
  for (const id of IPIP_60_ITEM_IDS) {
    ipip60[id] = 3;
  }

  return { sjt, values, ipip60 };
}

function buildMockMetadataV3(): SessionMetadataV3 {
  return {
    sessionId: "test-session-v3-001",
    totalTimeMs: 720000, // ~12 minutes
    moduleTimes: {
      sjt: 180000,
      ddvq: 240000,
      ipip60: 300000,
    },
  };
}

// ============================================================
// v3.0 Pipeline Tests
// ============================================================

describe("runScoringPipelineV3", () => {
  it("should return a complete AssessmentResultV3", () => {
    const result = runScoringPipelineV3(
      buildMockAnswersV3(),
      buildMockRiasec(),
      buildMockMetadataV3(),
    );

    expect(result.questionnaireVersion).toBe("3.0");
    expect(result.sessionId).toBe("test-session-v3-001");
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  it("should have Big Five data with standard precision", () => {
    const result = runScoringPipelineV3(
      buildMockAnswersV3(),
      buildMockRiasec(),
      buildMockMetadataV3(),
    );

    expect(result.bigFive).toBeDefined();
    expect(result.bigFive.precision).toBe("standard");
    expect(result.bigFive.domains).toHaveProperty("neuroticism");
    expect(result.bigFive.domains).toHaveProperty("extraversion");
    expect(result.bigFive.domains).toHaveProperty("openness");
    expect(result.bigFive.domains).toHaveProperty("agreeableness");
    expect(result.bigFive.domains).toHaveProperty("conscientiousness");
    expect(Object.keys(result.bigFive.facets)).toHaveLength(30);
  });

  it("should have Schwartz values from TwIVI", () => {
    const result = runScoringPipelineV3(
      buildMockAnswersV3(),
      buildMockRiasec(),
      buildMockMetadataV3(),
    );

    expect(result.schwartz).toBeDefined();
    expect(result.schwartz.raw).toHaveProperty("self-direction");
    expect(result.schwartz.ranking).toHaveLength(10);
    expect(result.schwartz.top3).toHaveLength(3);
    // TwIVI adds higher-order dimensions
    expect(result.schwartz.higherOrder).toBeDefined();
    expect(result.schwartz.higherOrder).toHaveProperty("openness-to-change");
    expect(result.schwartz.higherOrder).toHaveProperty("self-enhancement");
    expect(result.schwartz.higherOrder).toHaveProperty("conservation");
    expect(result.schwartz.higherOrder).toHaveProperty("self-transcendence");
  });

  it("should have tensions from SJT", () => {
    const result = runScoringPipelineV3(
      buildMockAnswersV3(),
      buildMockRiasec(),
      buildMockMetadataV3(),
    );

    expect(result.tensions).toBeDefined();
    expect(result.tensions.scenarios).toHaveLength(6);
    expect(result.tensions.overallConsistency).toBe(1);
  });

  it("should inherit RIASEC and compute archetype internally", () => {
    const riasec = buildMockRiasec();
    const result = runScoringPipelineV3(
      buildMockAnswersV3(),
      riasec,
      buildMockMetadataV3(),
    );

    expect(result.riasecNormalized).toEqual(riasec);
    // Archetype is now computed from RIASEC + Schwartz higher-order (not passed in)
    expect(result.archetype).toBeDefined();
    expect(result.archetype.primary).toBeDefined();
    expect(result.archetype.code).toBeDefined();
    expect(result.archetype.orientation).toMatch(
      /^(enhancement|transcendence)$/,
    );
    expect(result.archetype.confidence).toBeGreaterThan(0);
  });

  it("should have correct v3.0 metadata", () => {
    const result = runScoringPipelineV3(
      buildMockAnswersV3(),
      buildMockRiasec(),
      buildMockMetadataV3(),
    );

    expect(result.meta.totalQuestions).toBe(86);
    // 6 SJT + 20 TwIVI + 60 IPIP-60 = 86
    expect(result.meta.answeredQuestions).toBe(86);
    expect(result.meta.totalTimeMs).toBe(720000);
    expect(result.meta.moduleTimes.sjt).toBe(180000);
    expect(result.meta.moduleTimes.ddvq).toBe(240000);
    expect(result.meta.moduleTimes.ipip60).toBe(300000);
  });

  it("should have cognitive style derivation (standard-level)", () => {
    const result = runScoringPipelineV3(
      buildMockAnswersV3(),
      buildMockRiasec(),
      buildMockMetadataV3(),
    );

    expect(result.cognitiveStyleCode).toBeDefined();
    if (result.cognitiveStyleCode) {
      expect(result.cognitiveStyleCode.dimensions).toHaveProperty("EI");
      expect(result.cognitiveStyleCode.dimensions).toHaveProperty("SN");
      expect(result.cognitiveStyleCode.dimensions).toHaveProperty("TF");
      expect(result.cognitiveStyleCode.dimensions).toHaveProperty("JP");
    }
  });

  it("should have Collaboration Style mapping derivation", () => {
    const result = runScoringPipelineV3(
      buildMockAnswersV3(),
      buildMockRiasec(),
      buildMockMetadataV3(),
    );

    expect(result.collabMapping).toBeDefined();
    if (result.collabMapping) {
      expect(result.collabMapping.primary).toBeDefined();
      expect(result.collabMapping.scores).toBeDefined();
    }
  });

  describe("v3.0 rush detection", () => {
    it("should count rush responses", () => {
      const metadata = buildMockMetadataV3();
      metadata.itemResponseTimes = {
        sjt: { 1: 1000 }, // rush (< 3000ms)
        ddvq: { 1: 500 }, // rush (< 1500ms)
        ipip60: { 1: 200 }, // rush (< 1200ms)
      };

      const result = runScoringPipelineV3(
        buildMockAnswersV3(),
        buildMockRiasec(),
        metadata,
      );

      expect(result.meta.rushCount).toBe(3);
    });

    it("should not count rushes when no response times provided", () => {
      const result = runScoringPipelineV3(
        buildMockAnswersV3(),
        buildMockRiasec(),
        buildMockMetadataV3(),
      );

      expect(result.meta.rushCount).toBe(0);
    });
  });

  describe("v3.0 varied inputs", () => {
    it("should handle high Big Five scores (IPIP-60)", () => {
      const answers = buildMockAnswersV3();
      for (const id of IPIP_60_ITEM_IDS) {
        answers.ipip60[id] = 5;
      }

      const result = runScoringPipelineV3(
        answers,
        buildMockRiasec(),
        buildMockMetadataV3(),
      );

      for (const domain of Object.values(result.bigFive.domains)) {
        expect(domain).toBeGreaterThan(0);
        expect(domain).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("v3.0 backward compat (pvq alias)", () => {
    it("should accept deprecated pvq field as fallback for values", () => {
      const sjt = Array.from({ length: 6 }, (_, i) => ({
        scenarioId: i + 1,
        wouldChoice: "B",
        shouldChoice: "B",
      }));

      // Use deprecated `pvq` field instead of `values`
      const pvq: Record<number, number> = {};
      for (const item of DDVQ21_ITEMS) {
        pvq[item.id] = 4;
      }

      const ipip60: Record<number, number> = {};
      for (const id of IPIP_60_ITEM_IDS) {
        ipip60[id] = 3;
      }

      const result = runScoringPipelineV3(
        {
          sjt,
          values: undefined as unknown as Record<number, number>,
          pvq,
          ipip60,
        },
        buildMockRiasec(),
        buildMockMetadataV3(),
      );

      expect(result.questionnaireVersion).toBe("3.0");
      expect(result.schwartz).toBeDefined();
      expect(result.schwartz.ranking).toHaveLength(10);
    });
  });
});
