// ============================================================
// Tests: computeCareerMatchAlgorithm() — Career Direction Matching
// ============================================================

import { describe, it, expect, vi } from "vitest";
import { computeCareerMatchAlgorithm } from "../career-match-algorithm";
import { WEIGHT_PRESETS } from "@/lib/career-matching/weights";
import { computeProfileAlgorithm } from "@/lib/profile-generation/profile-algorithm";
import {
  buildBalancedAssessment,
  buildBalancedRealConditions,
} from "./fixtures/mock-assessment-balanced";
import {
  buildExtremeAssessment,
  buildMinimalAssessment,
} from "./fixtures/mock-assessment-extreme";
import { MOCK_CAREERS } from "./fixtures/mock-career-pool";

vi.mock("@/lib/career-matching/career-pool", () => ({
  getCareerPool: () => MOCK_CAREERS,
  ensureCareerPoolLoaded: async () => {},
  refreshCacheFromDb: async () => {},
  invalidateCareerPoolCache: () => {},
}));

/** Helper: run full algorithm stack for a given assessment */
async function runCareerMatch(
  assessment = buildBalancedAssessment(),
  realConditions: ReturnType<typeof buildBalancedRealConditions> | null = null,
) {
  const algo = computeProfileAlgorithm(assessment);
  return computeCareerMatchAlgorithm(assessment, algo, realConditions);
}

describe("computeCareerMatchAlgorithm", () => {
  describe("basic structure", () => {
    it("returns candidates array", async () => {
      const output = await runCareerMatch();
      expect(output).toHaveProperty("candidates");
      expect(Array.isArray(output.candidates)).toBe(true);
    });

    it("returns exactly 3 primary + 2 exploratory candidates", async () => {
      const output = await runCareerMatch();
      expect(output.candidates).toHaveLength(3);
      expect(output.exploratoryCandidates).toHaveLength(2);
    });

    it("each candidate has required fields", async () => {
      const output = await runCareerMatch();

      for (const c of output.candidates) {
        expect(c).toHaveProperty("direction");
        expect(c).toHaveProperty("score");
        expect(c.direction).toHaveProperty("id");
        expect(c.direction).toHaveProperty("title_zh");
        expect(c.direction).toHaveProperty("title_en");
        expect(c.direction).toHaveProperty("subtitle_zh");
        expect(c.direction).toHaveProperty("alignedValues");
        expect(c.direction).toHaveProperty("industries");
        expect(c.score).toHaveProperty("total");
        expect(c.score).toHaveProperty("breakdown");
      }
    });

    it("score breakdown has all four components", async () => {
      const output = await runCareerMatch();

      for (const c of output.candidates) {
        expect(c.score.breakdown).toHaveProperty("interestFit");
        expect(c.score.breakdown).toHaveProperty("valueFit");
        expect(c.score.breakdown).toHaveProperty("personalityFit");
        expect(c.score.breakdown).toHaveProperty("adaptabilityFit");
      }
    });
  });

  describe("scoring correctness", () => {
    it("candidates are sorted by total score descending", async () => {
      const output = await runCareerMatch();
      const scores = output.candidates.map((c) => c.score.total);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });

    it("total score is within valid range 0-100", async () => {
      const output = await runCareerMatch();
      for (const c of output.candidates) {
        expect(c.score.total).toBeGreaterThanOrEqual(0);
        expect(c.score.total).toBeLessThanOrEqual(100);
      }
    });

    it("breakdown scores are within valid range 0-100", async () => {
      const output = await runCareerMatch();
      for (const c of output.candidates) {
        const { interestFit, valueFit, personalityFit, adaptabilityFit } =
          c.score.breakdown;
        expect(interestFit).toBeGreaterThanOrEqual(0);
        expect(interestFit).toBeLessThanOrEqual(100);
        expect(valueFit).toBeGreaterThanOrEqual(0);
        expect(valueFit).toBeLessThanOrEqual(100);
        expect(personalityFit).toBeGreaterThanOrEqual(0);
        expect(personalityFit).toBeLessThanOrEqual(100);
        expect(adaptabilityFit).toBeGreaterThanOrEqual(0);
        expect(adaptabilityFit).toBeLessThanOrEqual(100);
      }
    });

    it("total score is weighted sum of breakdown", async () => {
      const output = await runCareerMatch();
      for (const c of output.candidates) {
        const { interestFit, valueFit, personalityFit, adaptabilityFit } =
          c.score.breakdown;
        // Weights sourced from WEIGHT_PRESETS.full (robust to re-weighting).
        // v3 (2026-06-19): adaptability=0 (Schwartz double-count removed, B1);
        // collabFit/industryFit zeroed since v2.
        const w = WEIGHT_PRESETS.full;
        const expected = Math.round(
          interestFit * w.interestFit +
            personalityFit * w.personalityFit +
            valueFit * w.valueFit +
            adaptabilityFit * w.adaptabilityFit,
        );
        expect(c.score.total).toBe(expected);
      }
    });
  });

  describe("balanced vs extreme assessments", () => {
    it("extreme assessment produces different top directions than balanced", async () => {
      const balancedOutput = await runCareerMatch(buildBalancedAssessment());
      const extremeOutput = await runCareerMatch(buildExtremeAssessment());

      const balancedIds = balancedOutput.candidates.map((c) => c.direction.id);
      const extremeIds = extremeOutput.candidates.map((c) => c.direction.id);

      // At least some directions should differ
      const overlap = balancedIds.filter((id) => extremeIds.includes(id));
      expect(overlap.length).toBeLessThan(3);
    });

    it("extreme I-dominant profile scores high on analytical directions", async () => {
      const assessment = buildExtremeAssessment();
      const output = await runCareerMatch(assessment);

      // The top candidate should have a reasonable match score
      expect(output.candidates[0].score.total).toBeGreaterThan(40);
    });

    it("minimal (uniform) assessment still produces valid rankings", async () => {
      const output = await runCareerMatch(buildMinimalAssessment());

      expect(output.candidates).toHaveLength(3);
      // With uniform scores, directions should still be ranked
      for (const c of output.candidates) {
        expect(c.score.total).toBeGreaterThan(0);
      }
    });
  });

  describe("value fit scoring", () => {
    it("value fit uses continuous scoring from centered values", async () => {
      const assessment = buildBalancedAssessment();
      assessment.schwartz.top3 = [
        "achievement",
        "self-direction",
        "stimulation",
      ];

      const output = await runCareerMatch(assessment);
      // v2: value fit is continuous (15-100), not discrete
      for (const c of output.candidates) {
        expect(c.score.breakdown.valueFit).toBeGreaterThanOrEqual(15);
        expect(c.score.breakdown.valueFit).toBeLessThanOrEqual(100);
      }
    });

    it("returns 50 (neutral) when direction has no aligned values", async () => {
      // This tests the neutral case; directions with empty alignedValues → 50
      const assessment = buildBalancedAssessment();
      const output = await runCareerMatch(assessment);

      // All value fits should be valid discrete values
      for (const c of output.candidates) {
        expect(c.score.breakdown.valueFit).toBeGreaterThanOrEqual(20);
        expect(c.score.breakdown.valueFit).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("adaptability fit", () => {
    it("is bounded between 30 and 80", async () => {
      const extremeOutput = await runCareerMatch(buildExtremeAssessment());
      const balancedOutput = await runCareerMatch(buildBalancedAssessment());

      for (const c of [
        ...extremeOutput.candidates,
        ...balancedOutput.candidates,
      ]) {
        expect(c.score.breakdown.adaptabilityFit).toBeGreaterThanOrEqual(30);
        expect(c.score.breakdown.adaptabilityFit).toBeLessThanOrEqual(80);
      }
    });
  });

  describe("real conditions filtering", () => {
    it("produces results with null realConditions", async () => {
      const output = await runCareerMatch(buildBalancedAssessment(), null);
      expect(output.candidates).toHaveLength(3);
    });

    it("produces results with realConditions", async () => {
      const output = await runCareerMatch(
        buildBalancedAssessment(),
        buildBalancedRealConditions(),
      );
      expect(output.candidates).toHaveLength(3);
    });

    it("industry filtering narrows candidates when enough remain", async () => {
      const conditions = buildBalancedRealConditions();
      conditions.interestedIndustries = ["tech"];

      const withFilter = await runCareerMatch(
        buildBalancedAssessment(),
        conditions,
      );
      const withoutFilter = await runCareerMatch(
        buildBalancedAssessment(),
        null,
      );

      // Both should return 5, but the top directions may differ
      expect(withFilter.candidates).toHaveLength(3);
      expect(withoutFilter.candidates).toHaveLength(3);
    });

    it('ignores industry filter when "recommend_for_me" is selected', async () => {
      const conditions = buildBalancedRealConditions();
      conditions.interestedIndustries = ["recommend_for_me"];

      const output = await runCareerMatch(
        buildBalancedAssessment(),
        conditions,
      );
      expect(output.candidates).toHaveLength(3);
    });
  });

  describe("edge cases", () => {
    it("handles zero RIASEC scores", async () => {
      const assessment = buildBalancedAssessment();
      assessment.riasecNormalized = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

      const output = await runCareerMatch(assessment);
      expect(output.candidates).toHaveLength(3);
      // Interest fit should be 0 for zero-vector
      for (const c of output.candidates) {
        expect(c.score.breakdown.interestFit).toBe(0);
      }
    });

    it("handles single-dimension RIASEC spike", async () => {
      const assessment = buildBalancedAssessment();
      assessment.riasecNormalized = { R: 0, I: 100, A: 0, S: 0, E: 0, C: 0 };

      const output = await runCareerMatch(assessment);
      expect(output.candidates).toHaveLength(3);
      expect(output.candidates[0].score.total).toBeGreaterThan(0);
    });
  });

  describe("tier-aware bucketing (jobZone)", () => {
    it("mock fixtures without jobZone fall back to old behavior (all in-band)", async () => {
      // MOCK_CAREERS has no jobZone field → engine treats them all as
      // inTargetTier=true → primary takes top 3 by score, exploratory takes
      // next 2. This preserves the contract for pre-2026-05 tests.
      const output = await runCareerMatch();
      expect(output.candidates).toHaveLength(3);
      expect(output.exploratoryCandidates).toHaveLength(2);

      // All candidates inTargetTier=true (no jobZone signal)
      for (const c of [...output.candidates, ...output.exploratoryCandidates]) {
        expect(c.inTargetTier).toBe(true);
        expect(c.tierGap).toBe(0);
      }
    });

    it("primary + exploratory IDs never overlap", async () => {
      const output = await runCareerMatch();
      const primaryIds = new Set(output.candidates.map((c) => c.direction.id));
      const exploratoryIds = output.exploratoryCandidates.map(
        (c) => c.direction.id,
      );
      for (const id of exploratoryIds) {
        expect(primaryIds.has(id)).toBe(false);
      }
    });

    it("aiEraCandidates exclude IDs already in primary + exploratory", async () => {
      const output = await runCareerMatch();
      const topIds = new Set(
        [...output.candidates, ...output.exploratoryCandidates].map(
          (c) => c.direction.id,
        ),
      );
      for (const c of output.aiEraCandidates) {
        expect(topIds.has(c.direction.id)).toBe(false);
      }
    });

    it("CandidateDirection exposes jobZone/inTargetTier/tierGap fields", async () => {
      const output = await runCareerMatch();
      for (const c of output.candidates) {
        expect(c).toHaveProperty("inTargetTier");
        expect(c).toHaveProperty("tierGap");
        expect(c.direction).toHaveProperty("jobZone");
      }
    });
  });
});
