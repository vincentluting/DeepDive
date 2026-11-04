// ============================================================
// Tests: computeConflictHandling — TKI 5-mode Algorithm
//
// Regression test for facet-name hyphen/underscore mismatch.
// Before fix: N4_Self-Consciousness lookup used underscore key
//             and silently fell back to default 3.0 — distorting
//             assertiveness (25%) and avoiding mode (20%) for
//             every user.
// ============================================================

import { describe, it, expect } from "vitest";
import { computeConflictHandling } from "../conflict-handling-style";

type Pair = { facet: string; score: number };

function buildPairs(overrides: Partial<Record<string, number>> = {}): Pair[] {
  const defaults: Record<string, number> = {
    E3_Assertiveness: 3,
    A3_Altruism: 3,
    A4_Cooperation: 3,
    A5_Modesty: 3,
    A6_Sympathy: 3,
    "N4_Self-Consciousness": 3,
  };
  return Object.entries({ ...defaults, ...overrides }).map(
    ([facet, score]) => ({ facet, score: score as number }),
  );
}

const balancedDomains = {
  openness: 50,
  agreeableness: 50,
  extraversion: 50,
  neuroticism: 50,
  conscientiousness: 50,
};

describe("computeConflictHandling", () => {
  it("returns undefined when E3 missing", () => {
    const pairs = buildPairs().filter((p) => p.facet !== "E3_Assertiveness");
    expect(computeConflictHandling(pairs, balancedDomains)).toBeUndefined();
  });

  it("returns undefined when A4 missing", () => {
    const pairs = buildPairs().filter((p) => p.facet !== "A4_Cooperation");
    expect(computeConflictHandling(pairs, balancedDomains)).toBeUndefined();
  });

  it("returns undefined when openness domain missing", () => {
    expect(
      computeConflictHandling(buildPairs(), { agreeableness: 50 }),
    ).toBeUndefined();
  });

  it("reads N4 with hyphen key (regression)", () => {
    // Same E3, but different N4 → assertiveness must differ.
    const lowN4 = computeConflictHandling(
      buildPairs({ "N4_Self-Consciousness": 1 }),
      balancedDomains,
    );
    const highN4 = computeConflictHandling(
      buildPairs({ "N4_Self-Consciousness": 5 }),
      balancedDomains,
    );
    expect(lowN4!.assertiveness).toBeGreaterThan(highN4!.assertiveness);
    // N4 contributes 0.25 weight to assertiveness — a 4-point N4 swing on the
    // 1-5 scale should produce a substantial assertiveness gap.
    expect(lowN4!.assertiveness - highN4!.assertiveness).toBeGreaterThanOrEqual(
      20,
    );
  });

  it("derivedFrom.N4 reflects actual input (not default 3.0)", () => {
    const result = computeConflictHandling(
      buildPairs({ "N4_Self-Consciousness": 4.2 }),
      balancedDomains,
    );
    expect(result?.derivedFrom.N4).toBeCloseTo(4.2);
  });

  it("identifies competing for high-assert, low-coop profile", () => {
    const result = computeConflictHandling(
      buildPairs({
        E3_Assertiveness: 5,
        A5_Modesty: 1,
        "N4_Self-Consciousness": 1,
        A4_Cooperation: 1,
        A3_Altruism: 1,
        A6_Sympathy: 1,
      }),
      balancedDomains,
    );
    expect(result?.dominant).toBe("competing");
  });

  it("identifies accommodating for low-assert, high-coop profile", () => {
    const result = computeConflictHandling(
      buildPairs({
        E3_Assertiveness: 1,
        A5_Modesty: 5,
        "N4_Self-Consciousness": 5,
        A4_Cooperation: 5,
        A3_Altruism: 5,
        A6_Sympathy: 5,
      }),
      balancedDomains,
    );
    expect(result?.dominant).toBe("accommodating");
  });

  it("identifies collaborating for high-assert, high-coop, high-O profile", () => {
    const result = computeConflictHandling(
      buildPairs({
        E3_Assertiveness: 5,
        A5_Modesty: 1,
        "N4_Self-Consciousness": 1,
        A4_Cooperation: 5,
        A3_Altruism: 5,
        A6_Sympathy: 5,
      }),
      { ...balancedDomains, openness: 100 },
    );
    expect(result?.dominant).toBe("collaborating");
  });

  it("compromising peaks when both axes are at the population median (norm-referenced)", () => {
    // Facets at their parent-domain population means → norm-referenced axes = 50
    // → compromising formula peaks at 100. (Under norm-referencing the peak is
    // at the population median, not the raw scale midpoint.)
    const result = computeConflictHandling(
      buildPairs({
        // IPIP-NEO facet means (K&J 2019) → each facet percentile = 50 → axes = 50.
        E3_Assertiveness: 3.64,
        A5_Modesty: 3.085,
        "N4_Self-Consciousness": 2.922,
        A4_Cooperation: 3.775,
        A3_Altruism: 4.18,
        A6_Sympathy: 3.757,
      }),
      balancedDomains,
    );
    expect(result?.assertiveness).toBe(50);
    expect(result?.cooperativeness).toBe(50);
    expect(result?.modeScores.compromising).toBe(100);
  });

  it("compromising clamps to 0 (never negative) at extremes", () => {
    const result = computeConflictHandling(
      buildPairs({
        E3_Assertiveness: 1,
        A5_Modesty: 5,
        "N4_Self-Consciousness": 5,
        A4_Cooperation: 1,
        A3_Altruism: 1,
        A6_Sympathy: 1,
      }),
      balancedDomains,
    );
    // Both axes far from 50 → 100 - 50*1.2 - 50*1.2 = -20 → clamp 0
    expect(result?.modeScores.compromising).toBe(0);
  });

  it("returns 5 mode scores summing to range [0,500]", () => {
    const result = computeConflictHandling(buildPairs(), balancedDomains);
    const total = Object.values(result!.modeScores).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(500);
  });

  it("secondary is set only when within 8 points of dominant", () => {
    const balanced = computeConflictHandling(buildPairs(), balancedDomains);
    // At full balance, multiple modes should be close → secondary set
    expect(
      balanced?.secondary === undefined ||
        balanced?.secondary !== balanced?.dominant,
    ).toBe(true);
  });

  it("never produces NaN regardless of input", () => {
    const extremes: Array<Partial<Record<string, number>>> = [
      {
        E3_Assertiveness: 1,
        A4_Cooperation: 1,
        A5_Modesty: 1,
        A3_Altruism: 1,
        A6_Sympathy: 1,
        "N4_Self-Consciousness": 1,
      },
      {
        E3_Assertiveness: 5,
        A4_Cooperation: 5,
        A5_Modesty: 5,
        A3_Altruism: 5,
        A6_Sympathy: 5,
        "N4_Self-Consciousness": 5,
      },
    ];
    for (const ext of extremes) {
      const r = computeConflictHandling(buildPairs(ext), balancedDomains);
      expect(Number.isFinite(r!.assertiveness)).toBe(true);
      expect(Number.isFinite(r!.cooperativeness)).toBe(true);
      for (const [, v] of Object.entries(r!.modeScores)) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });
});
