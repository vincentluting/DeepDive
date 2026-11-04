// ============================================================
// Tests: computeProfileAlgorithm — Core pure-algorithm pipeline
// ============================================================

import { describe, it, expect } from "vitest";
import { computeProfileAlgorithm } from "../profile-algorithm";
import { buildBalancedAssessment } from "@/lib/report-generation/__tests__/fixtures/mock-assessment-balanced";

describe("computeProfileAlgorithm", () => {
  const assessment = buildBalancedAssessment();

  it("maps RIASEC to brand-named radar dimensions", () => {
    const result = computeProfileAlgorithm(assessment);
    expect(result.riasecRadar).toEqual({
      build: assessment.riasecNormalized.R,
      decode: assessment.riasecNormalized.I,
      create: assessment.riasecNormalized.A,
      connect: assessment.riasecNormalized.S,
      drive: assessment.riasecNormalized.E,
      structure: assessment.riasecNormalized.C,
    });
  });

  it("passes through archetype data unchanged", () => {
    const result = computeProfileAlgorithm(assessment);
    expect(result.archetype).toEqual(assessment.archetype);
  });

  it("looks up archetype content from content library", () => {
    const result = computeProfileAlgorithm(assessment);
    expect(result.archetypeContent).toBeDefined();
    expect(result.archetypeContent!.label_zh).toBeTruthy();
    expect(result.archetypeContent!.label_en).toBeTruthy();
  });

  it("passes through Big Five domains normalized", () => {
    const result = computeProfileAlgorithm(assessment);
    expect(result.bigFiveDomains).toEqual(assessment.bigFive.domainsNormalized);
  });

  it("passes through Big Five facets", () => {
    const result = computeProfileAlgorithm(assessment);
    expect(result.bigFiveFacets).toEqual(assessment.bigFive.facets);
  });

  it("defaults bigFivePrecision to full for v2.0 assessments", () => {
    const result = computeProfileAlgorithm(assessment);
    expect(result.bigFivePrecision).toBe("full");
  });

  it("reads bigFivePrecision from v3.0 assessments", () => {
    const v3Assessment = {
      ...assessment,
      bigFive: { ...assessment.bigFive, precision: "standard" as const },
    };
    const result = computeProfileAlgorithm(v3Assessment);
    expect(result.bigFivePrecision).toBe("standard");
  });

  it("computes bigFiveFacetPairs with correct domain mapping", () => {
    const result = computeProfileAlgorithm(assessment);
    expect(result.bigFiveFacetPairs.length).toBe(30); // 5 domains × 6 facets

    // Check domain mapping: O1 → openness
    const o1 = result.bigFiveFacetPairs.find(
      (p) => p.facet === "O1_Imagination",
    );
    expect(o1?.domain).toBe("openness");

    // Check domain mapping: E2 → extraversion
    const e2 = result.bigFiveFacetPairs.find(
      (p) => p.facet === "E2_Gregariousness",
    );
    expect(e2?.domain).toBe("extraversion");

    // Check domain mapping: N1 → neuroticism
    const n1 = result.bigFiveFacetPairs.find((p) => p.facet === "N1_Anxiety");
    expect(n1?.domain).toBe("neuroticism");
  });

  it("computes deviation from domain mean correctly", () => {
    const result = computeProfileAlgorithm(assessment);

    // Openness facets: O1=3.5, O2=3.3, O3=3.6, O4=3.2, O5=3.4, O6=3.0
    // Domain mean = (3.5+3.3+3.6+3.2+3.4+3.0)/6 = 3.333...
    const o1 = result.bigFiveFacetPairs.find(
      (p) => p.facet === "O1_Imagination",
    )!;
    const expectedMean = (3.5 + 3.3 + 3.6 + 3.2 + 3.4 + 3.0) / 6;
    expect(o1.deviationFromMean).toBeCloseTo(3.5 - expectedMean, 5);
  });

  it("builds polarityContext from schwartz higherOrder (or defaults)", () => {
    const result = computeProfileAlgorithm(assessment);
    // Without higherOrder in v2.0 schwartz, defaults to 0/0
    expect(result.polarityContext).toHaveProperty("otcScore");
    expect(result.polarityContext).toHaveProperty("conScore");
    expect(result.polarityContext).toHaveProperty("polarity");
    expect(result.polarityContext).toHaveProperty("polarityStrength");
    expect(["explore", "anchor"]).toContain(result.polarityContext.polarity);
    expect(["strong", "moderate", "weak"]).toContain(
      result.polarityContext.polarityStrength,
    );
  });

  it("passes through Schwartz values", () => {
    const result = computeProfileAlgorithm(assessment);
    expect(result.schwartz.raw).toEqual(assessment.schwartz.raw);
    expect(result.schwartz.centered).toEqual(assessment.schwartz.centered);
    expect(result.schwartz.ranking).toEqual(assessment.schwartz.ranking);
    expect(result.schwartz.top3).toEqual(assessment.schwartz.top3);
  });

  it("passes through SJT tensions", () => {
    const result = computeProfileAlgorithm(assessment);
    expect(result.sjtTensions.scenarios).toEqual(assessment.tensions.scenarios);
    expect(result.sjtTensions.overallConsistency).toBe(
      assessment.tensions.overallConsistency,
    );
    expect(result.sjtTensions.notableTensions).toEqual(
      assessment.tensions.notableTensions,
    );
  });

  it("derives cognitive style from Big Five even when the stored code is absent", () => {
    // The cognitive style is now NORM-REFERENCED from the Big Five domains
    // directly (see lib/psychometrics/big-five-norms.ts), so it no longer
    // depends on the cognitiveStyleCode field carried from the frozen scoring
    // pipeline. Dropping that field must not change the result.
    const noCogStyle = { ...assessment, cognitiveStyleCode: undefined };
    const result = computeProfileAlgorithm(noCogStyle);
    const ref = computeProfileAlgorithm(assessment);
    expect(result.cognitiveStyleCode).toBe(ref.cognitiveStyleCode);
    expect(result.cognitiveStyleDimensions).toEqual(
      ref.cognitiveStyleDimensions,
    );
  });

  it("derives norm-referenced cognitive style from Big Five (no scale-midpoint bias)", () => {
    // Balanced fixture domains (O 3.4 / C 3.2 / E 3.0 / A 3.5) are ABOVE the raw
    // scale midpoint (3.0) but BELOW the IPIP-NEO population means
    // (E 3.27 / O 3.59 / A 3.71 / C 3.45). Norm-referencing therefore yields the
    // low-pole letters I/S/T/P — NOT the "INFJ" the old 3.0-midpoint cut gave.
    // This is the fix for the "everyone becomes J/F/N" bias (F15).
    const result = computeProfileAlgorithm(assessment);
    expect(result.cognitiveStyleCode).toBe("ISTP");
    expect(result.cognitiveStyleDisplayMode).toBe("normal");
    // Below-population-mean conscientiousness must read as P, not J.
    expect(result.cognitiveStyleDimensions.JP.label).toBe("P");
  });
});
