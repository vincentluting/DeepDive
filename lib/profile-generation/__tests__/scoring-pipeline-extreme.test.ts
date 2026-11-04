// ============================================================
// Tests: Scoring pipeline robustness under extreme inputs
//
// Sits in lib/profile-generation/__tests__/ (not lib/scoring/__tests__/)
// because lib/scoring/ is a frozen zone — but invariants here apply
// to runScoringPipelineV3() which is the public entry to the frozen
// pipeline. Tests verify the contract from outside.
//
// Specifically validates the corner case raised by the audit:
// layer3-derive.ts:153 computes total = D+I+S+C of shifted rawSignals
// (each in [0,2]). NaN would require total=0, i.e., every rawSignal=-1
// simultaneously — provably unreachable since CollabMapping
// contributions overlap (A4 belongs to both D and S with opposite
// reverseness, etc.). This test sweep documents the invariant.
// ============================================================

import { describe, it, expect } from "vitest";
import { runScoringPipelineV3 } from "@/lib/scoring";
import type { QuestionnaireAnswersV3, SessionMetadataV3 } from "@/lib/scoring";
import type { RIASECDimension } from "@/lib/types";
import { DDVQ21_ITEMS, IPIP_60_ITEM_IDS } from "@/lib/questionnaire";

const RIASEC: Record<RIASECDimension, number> = {
  R: 60,
  I: 80,
  A: 70,
  S: 50,
  E: 40,
  C: 30,
};

const META: SessionMetadataV3 = {
  sessionId: "test-extreme",
  totalTimeMs: 720000,
  moduleTimes: { sjt: 180000, ddvq: 240000, ipip60: 300000 },
};

function buildAllOneAnswers(): QuestionnaireAnswersV3 {
  const sjt = Array.from({ length: 6 }, (_, i) => ({
    scenarioId: i + 1,
    wouldChoice: "A",
    shouldChoice: "A",
  }));
  const values: Record<number, number> = {};
  for (const item of DDVQ21_ITEMS) values[item.id] = 1;
  const ipip60: Record<number, number> = {};
  for (const id of IPIP_60_ITEM_IDS) ipip60[id] = 1;
  return { sjt, values, ipip60 };
}

function buildAllFiveAnswers(): QuestionnaireAnswersV3 {
  const sjt = Array.from({ length: 6 }, (_, i) => ({
    scenarioId: i + 1,
    wouldChoice: "D",
    shouldChoice: "D",
  }));
  const values: Record<number, number> = {};
  for (const item of DDVQ21_ITEMS) values[item.id] = 6;
  const ipip60: Record<number, number> = {};
  for (const id of IPIP_60_ITEM_IDS) ipip60[id] = 5;
  return { sjt, values, ipip60 };
}

function buildMidpointAnswers(): QuestionnaireAnswersV3 {
  const sjt = Array.from({ length: 6 }, (_, i) => ({
    scenarioId: i + 1,
    wouldChoice: "B",
    shouldChoice: "B",
  }));
  const values: Record<number, number> = {};
  for (const item of DDVQ21_ITEMS) values[item.id] = 4;
  const ipip60: Record<number, number> = {};
  for (const id of IPIP_60_ITEM_IDS) ipip60[id] = 3;
  return { sjt, values, ipip60 };
}

function buildAlternatingAnswers(): QuestionnaireAnswersV3 {
  // Alternating low/high pattern — stress-tests rounding and reverse-keying
  const sjt = Array.from({ length: 6 }, (_, i) => ({
    scenarioId: i + 1,
    wouldChoice: i % 2 === 0 ? "A" : "D",
    shouldChoice: "B",
  }));
  const values: Record<number, number> = {};
  let i = 0;
  for (const item of DDVQ21_ITEMS) {
    values[item.id] = i++ % 2 === 0 ? 1 : 6;
  }
  const ipip60: Record<number, number> = {};
  let j = 0;
  for (const id of IPIP_60_ITEM_IDS) {
    ipip60[id] = j++ % 2 === 0 ? 1 : 5;
  }
  return { sjt, values, ipip60 };
}

describe("scoring pipeline robustness", () => {
  it("never produces NaN with all-1 IPIP responses", () => {
    const r = runScoringPipelineV3(buildAllOneAnswers(), RIASEC, META);
    for (const v of Object.values(r.bigFive.facets)) {
      expect(Number.isFinite(v)).toBe(true);
    }
    if (r.collabMapping) {
      const sum =
        r.collabMapping.scores.D +
        r.collabMapping.scores.I +
        r.collabMapping.scores.S +
        r.collabMapping.scores.C;
      expect(sum).toBeCloseTo(100, 0);
      for (const v of Object.values(r.collabMapping.scores)) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  it("never produces NaN with all-5 IPIP responses", () => {
    const r = runScoringPipelineV3(buildAllFiveAnswers(), RIASEC, META);
    for (const v of Object.values(r.bigFive.facets)) {
      expect(Number.isFinite(v)).toBe(true);
    }
    if (r.collabMapping) {
      for (const v of Object.values(r.collabMapping.scores)) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  it("never produces NaN with all-3 (centered) responses", () => {
    const r = runScoringPipelineV3(buildMidpointAnswers(), RIASEC, META);
    for (const v of Object.values(r.bigFive.facets)) {
      expect(v).toBeCloseTo(3, 1);
    }
  });

  it("never produces NaN with alternating low/high IPIP responses", () => {
    const r = runScoringPipelineV3(buildAlternatingAnswers(), RIASEC, META);
    for (const v of Object.values(r.bigFive.facets)) {
      expect(Number.isFinite(v)).toBe(true);
    }
    if (r.collabMapping) {
      for (const v of Object.values(r.collabMapping.scores)) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  it("CollabMapping scores always sum to 100 (within 1 unit of rounding)", () => {
    const cases = [
      buildAllOneAnswers(),
      buildAllFiveAnswers(),
      buildMidpointAnswers(),
      buildAlternatingAnswers(),
    ];
    for (const answers of cases) {
      const r = runScoringPipelineV3(answers, RIASEC, META);
      if (!r.collabMapping) continue;
      const sum =
        r.collabMapping.scores.D +
        r.collabMapping.scores.I +
        r.collabMapping.scores.S +
        r.collabMapping.scores.C;
      expect(sum).toBeCloseTo(100, 0);
    }
  });

  it("(corner case proof) sweep cannot trigger layer3-derive total=0 NaN", () => {
    // Documented invariant: layer3-derive total = sum of shifted rawSignals
    // each in [0,2]. total=0 requires every rawSignal=-1, which is unreachable
    // because CollabMapping contributions overlap with opposite reverseness:
    //   D includes A4_Cooperation as REVERSED (low A4 → high D signal)
    //   S includes A4_Cooperation as NOT REVERSED (high A4 → high S signal)
    // So D and S rawSignals cannot both equal -1 from the same A4 input.
    // This sweep across all extreme inputs demonstrates the invariant holds.
    const cases = [
      buildAllOneAnswers(),
      buildAllFiveAnswers(),
      buildMidpointAnswers(),
      buildAlternatingAnswers(),
    ];
    for (const answers of cases) {
      const r = runScoringPipelineV3(answers, RIASEC, META);
      if (!r.collabMapping) continue;
      for (const v of Object.values(r.collabMapping.scores)) {
        expect(Number.isNaN(v)).toBe(false);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it("Big Five facets always in 1-5 range", () => {
    const cases = [
      buildAllOneAnswers(),
      buildAllFiveAnswers(),
      buildMidpointAnswers(),
      buildAlternatingAnswers(),
    ];
    for (const answers of cases) {
      const r = runScoringPipelineV3(answers, RIASEC, META);
      for (const v of Object.values(r.bigFive.facets)) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(5);
      }
    }
  });

  it("Big Five normalized scores always in 0-100 range", () => {
    const r = runScoringPipelineV3(buildAllOneAnswers(), RIASEC, META);
    for (const v of Object.values(r.bigFive.domainsNormalized)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
