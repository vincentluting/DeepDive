// ============================================================
// Tests: computeProfileAlgorithm() — Pure Algorithm
// ============================================================

import { describe, it, expect } from "vitest";
import { computeProfileAlgorithm } from "@/lib/profile-generation/profile-algorithm";
import { buildBalancedAssessment } from "./fixtures/mock-assessment-balanced";
import {
  buildExtremeAssessment,
  buildMinimalAssessment,
} from "./fixtures/mock-assessment-extreme";

describe("computeProfileAlgorithm", () => {
  describe("basic structure", () => {
    it("returns all required fields", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output).toHaveProperty("archetype");
      expect(output).toHaveProperty("archetypeContent");
      expect(output).toHaveProperty("riasecRadar");
      expect(output).toHaveProperty("cognitiveStyleCode");
      expect(output).toHaveProperty("cognitiveStyleDisplayMode");
      expect(output).toHaveProperty("cognitiveStyleDimensions");
      expect(output).toHaveProperty("cognitiveStyleConfidence");
      expect(output).toHaveProperty("bigFiveDomains");
      expect(output).toHaveProperty("bigFiveFacets");
      expect(output).toHaveProperty("schwartz");
      expect(output).toHaveProperty("sjtTensions");
    });

    it("schwartz sub-fields are preserved", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.schwartz).toHaveProperty("raw");
      expect(output.schwartz).toHaveProperty("centered");
      expect(output.schwartz).toHaveProperty("ranking");
      expect(output.schwartz).toHaveProperty("top3");
      expect(output.schwartz.top3).toHaveLength(3);
    });

    it("sjtTensions sub-fields are preserved", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.sjtTensions).toHaveProperty("scenarios");
      expect(output.sjtTensions).toHaveProperty("overallConsistency");
      expect(output.sjtTensions).toHaveProperty("notableTensions");
      expect(output.sjtTensions.scenarios).toHaveLength(6);
    });
  });

  describe("RIASEC radar mapping", () => {
    it("maps RIASEC dimensions to brand names for balanced profile", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.riasecRadar.build).toBe(45); // R
      expect(output.riasecRadar.decode).toBe(60); // I
      expect(output.riasecRadar.create).toBe(55); // A
      expect(output.riasecRadar.connect).toBe(50); // S
      expect(output.riasecRadar.drive).toBe(48); // E
      expect(output.riasecRadar.structure).toBe(42); // C
    });

    it("maps extreme RIASEC scores correctly", () => {
      const assessment = buildExtremeAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.riasecRadar.decode).toBe(95); // I = 95
      expect(output.riasecRadar.connect).toBe(15); // S = 15
      expect(output.riasecRadar.drive).toBe(10); // E = 10
    });
  });

  describe("archetype content lookup", () => {
    it("returns content for known archetype code", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      // I-explore archetype exists in ARCHETYPES_12
      expect(output.archetypeContent).not.toBeNull();
      if (output.archetypeContent) {
        expect(output.archetypeContent).toHaveProperty("narrative_zh");
        expect(output.archetypeContent).toHaveProperty("narrative_en");
        expect(output.archetypeContent).toHaveProperty("coreStrengths");
        expect(output.archetypeContent).toHaveProperty("growthEdges");
      }
    });

    it("preserves archetype reference", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.archetype.primary).toBe("I");
      expect(output.archetype.orientation).toBe("enhancement");
      expect(output.archetype.code).toBe("I-enhancement");
      expect(output.archetype.confidence).toBe(0.55);
    });
  });

  describe("Big Five data pass-through", () => {
    it("uses domainsNormalized for bigFiveDomains", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.bigFiveDomains.openness).toBe(60);
      expect(output.bigFiveDomains.conscientiousness).toBe(55);
      expect(output.bigFiveDomains.extraversion).toBe(50);
      expect(output.bigFiveDomains.agreeableness).toBe(62);
      expect(output.bigFiveDomains.neuroticism).toBe(45);
    });

    it("preserves all 30 facets", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(Object.keys(output.bigFiveFacets)).toHaveLength(30);
      expect(output.bigFiveFacets.O1_Imagination).toBe(3.5);
      expect(output.bigFiveFacets.N6_Vulnerability).toBe(2.8);
    });

    it("handles extreme Big Five values", () => {
      const assessment = buildExtremeAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.bigFiveDomains.openness).toBe(92);
      expect(output.bigFiveDomains.extraversion).toBe(18);
      expect(output.bigFiveFacets.O4_Adventurousness).toBe(4.9);
      expect(output.bigFiveFacets.E2_Gregariousness).toBe(1.5);
    });
  });

  describe("cognitive style handling", () => {
    it("derives norm-referenced cognitive style when present", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      // Norm-referenced (F15): the balanced fixture is above the raw midpoint
      // but below the IPIP-NEO population means → low-pole letters ISTP, not the
      // "INFJ" the old 3.0-midpoint cut produced.
      expect(output.cognitiveStyleCode).toBe("ISTP");
      expect(output.cognitiveStyleDisplayMode).toBe("normal");
      expect(output.cognitiveStyleDimensions.EI.label).toBe("I");
    });

    it("norm-references against population means, not the raw scale midpoint", () => {
      // The minimal fixture sits at the raw scale midpoint (all domains ≈ 50/100
      // = raw 3.0). That is BELOW the elevated IPIP-NEO population means, so a
      // norm-referenced reading is below-average on O/A/C → ISTP, NOT a
      // "balanced" non-type. This is precisely the bias the fix corrects: the
      // raw midpoint is not the population median. (F15)
      const assessment = buildMinimalAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.cognitiveStyleCode).toBe("ISTP");
      expect(output.cognitiveStyleDimensions.JP.label).toBe("P");
      expect(output.cognitiveStyleDimensions.SN.label).toBe("S");
    });
  });

  describe("Schwartz values pass-through", () => {
    it("preserves all value components", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.schwartz.top3).toEqual([
        "self-direction",
        "benevolence",
        "achievement",
      ]);
      expect(output.schwartz.ranking).toHaveLength(10);
      expect(output.schwartz.centered["self-direction"]).toBeCloseTo(0.58, 1);
    });

    it("preserves extreme centered values", () => {
      const assessment = buildExtremeAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.schwartz.centered["self-direction"]).toBeCloseTo(2.93, 1);
      expect(output.schwartz.centered.tradition).toBeCloseTo(-1.87, 1);
    });
  });

  describe("SJT tensions pass-through", () => {
    it("preserves scenarios for balanced profile", () => {
      const assessment = buildBalancedAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.sjtTensions.overallConsistency).toBe(0.85);
      expect(output.sjtTensions.notableTensions).toHaveLength(0);
    });

    it("preserves notable tensions for extreme profile", () => {
      const assessment = buildExtremeAssessment();
      const output = computeProfileAlgorithm(assessment);

      expect(output.sjtTensions.overallConsistency).toBe(0.33);
      expect(output.sjtTensions.notableTensions).toContain("extraversion");
      expect(output.sjtTensions.notableTensions).toContain("agreeableness");
      expect(output.sjtTensions.notableTensions).toContain("neuroticism");
    });
  });
});
