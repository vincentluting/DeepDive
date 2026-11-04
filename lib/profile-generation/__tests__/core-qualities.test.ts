// ============================================================
// Tests: computeCoreQualities — Ofman 4-quadrant Algorithm
//
// Regression test for FACET_QUADRANTS hyphen/underscore mismatch.
// Before fix: 4 quadrants (E5_Excitement-Seeking, C1_Self-Efficacy,
//             C4_Achievement-Striving, N4_Self-Consciousness) were
//             keyed with underscores while production data uses
//             hyphens — these facets could NEVER appear in user
//             core qualities (silent 13% data loss).
// ============================================================

import { describe, it, expect } from "vitest";
import { computeCoreQualities } from "../core-qualities";

type FacetInput = {
  facet: string;
  domain: string;
  score: number;
  deviationFromMean: number;
};

function pair(
  facet: string,
  domain: string,
  score: number,
  deviation: number,
): FacetInput {
  return { facet, domain, score, deviationFromMean: deviation };
}

describe("computeCoreQualities", () => {
  it("returns empty array for empty input", () => {
    expect(computeCoreQualities([])).toEqual([]);
  });

  it("returns empty array when no facet has sufficient deviation", () => {
    const input = [pair("O1_Imagination", "openness", 3, 0.1)];
    expect(computeCoreQualities(input)).toEqual([]);
  });

  it("(regression) selects N4_Self-Consciousness when deviation is high", () => {
    const input = [pair("N4_Self-Consciousness", "neuroticism", 4.5, 1.5)];
    const result = computeCoreQualities(input);
    expect(result.length).toBe(1);
    expect(result[0].facet).toBe("N4_Self-Consciousness");
    expect(result[0].direction).toBe("high");
    expect(result[0].coreQuality).toBeDefined();
    expect(result[0].coreQuality.zh).toBe("社交觉察");
  });

  it("(regression) selects E5_Excitement-Seeking when deviation is high", () => {
    const input = [pair("E5_Excitement-Seeking", "extraversion", 4.8, 1.5)];
    const result = computeCoreQualities(input);
    expect(result[0]?.facet).toBe("E5_Excitement-Seeking");
    expect(result[0]?.coreQuality.en).toBe("Boldness");
  });

  it("(regression) selects C1_Self-Efficacy when deviation is high", () => {
    const input = [pair("C1_Self-Efficacy", "conscientiousness", 4.5, 1.5)];
    const result = computeCoreQualities(input);
    expect(result[0]?.facet).toBe("C1_Self-Efficacy");
    expect(result[0]?.coreQuality.en).toBe("Capability");
  });

  it("(regression) selects C4_Achievement-Striving when deviation is high", () => {
    const input = [
      pair("C4_Achievement-Striving", "conscientiousness", 4.7, 1.5),
    ];
    const result = computeCoreQualities(input);
    expect(result[0]?.facet).toBe("C4_Achievement-Striving");
    expect(result[0]?.coreQuality.en).toBe("Ambition");
  });

  it("(regression) selects C5_Self-Discipline when deviation is high", () => {
    // C5_Self-Discipline is the 5th hyphen-named facet — initially missed
    // in the first round of fixes (N4/E5/C1/C4 only). Locks in the full set.
    const input = [pair("C5_Self-Discipline", "conscientiousness", 4.6, 1.5)];
    const result = computeCoreQualities(input);
    expect(result[0]?.facet).toBe("C5_Self-Discipline");
    expect(result[0]?.coreQuality.en).toBe("Persistence");
  });

  it("uses 'high' for positive deviation, 'low' for negative", () => {
    const high = computeCoreQualities([
      pair("N4_Self-Consciousness", "neuroticism", 4.5, 1.5),
    ]);
    expect(high[0].direction).toBe("high");

    const low = computeCoreQualities([
      pair("N4_Self-Consciousness", "neuroticism", 1.5, -1.5),
    ]);
    expect(low[0].direction).toBe("low");
    expect(low[0].coreQuality.en).toBe("Self-assurance");
  });

  it("Pass 1 prefers domain diversity (one per domain first)", () => {
    // Two extraversion facets with high deviation, plus one openness facet
    // with smaller deviation. Pass 1 should pick the strongest extraversion
    // PLUS the openness (different domain).
    const input = [
      pair("E1_Friendliness", "extraversion", 4.8, 1.8),
      pair("E3_Assertiveness", "extraversion", 4.8, 1.8),
      pair("O1_Imagination", "openness", 4.0, 1.0),
    ];
    const result = computeCoreQualities(input, 2);
    const domains = result.map((r) => r.domain);
    expect(domains).toContain("openness");
    expect(domains).toContain("extraversion");
  });

  it("respects maxResults", () => {
    const input = [
      pair("E1_Friendliness", "extraversion", 4.5, 1.5),
      pair("O1_Imagination", "openness", 4.5, 1.5),
      pair("A1_Trust", "agreeableness", 4.5, 1.5),
      pair("C2_Orderliness", "conscientiousness", 4.5, 1.5),
      pair("N1_Anxiety", "neuroticism", 4.5, 1.5),
    ];
    const result = computeCoreQualities(input, 3);
    expect(result.length).toBe(3);
  });

  it("Pass 2 allows up to 2 facets per domain", () => {
    const input = [
      pair("E1_Friendliness", "extraversion", 4.5, 1.5),
      pair("E3_Assertiveness", "extraversion", 4.5, 1.4),
      pair("E5_Excitement-Seeking", "extraversion", 4.5, 1.3),
    ];
    const result = computeCoreQualities(input, 5);
    const extraversionCount = result.filter(
      (r) => r.domain === "extraversion",
    ).length;
    expect(extraversionCount).toBeLessThanOrEqual(2);
  });

  it("filters out facets with deviation < MIN_DEVIATION (0.2)", () => {
    const input = [
      pair("E1_Friendliness", "extraversion", 3.1, 0.1), // below threshold
      pair("O1_Imagination", "openness", 3.5, 0.5), // above threshold
    ];
    const result = computeCoreQualities(input);
    expect(result.length).toBe(1);
    expect(result[0].facet).toBe("O1_Imagination");
  });

  it("populates all 4 quadrant fields (coreQuality, pitfall, challenge, allergy)", () => {
    const result = computeCoreQualities([
      pair("N4_Self-Consciousness", "neuroticism", 4.5, 1.5),
    ]);
    expect(result[0].coreQuality).toBeDefined();
    expect(result[0].pitfall).toBeDefined();
    expect(result[0].challenge).toBeDefined();
    expect(result[0].allergy).toBeDefined();
  });
});
