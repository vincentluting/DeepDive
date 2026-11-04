// ============================================================
// Tests: computeInterpersonalEnergy — IPC-inspired Algorithm
//
// Regression test for facet-name hyphen/underscore mismatch.
// Before fix: N4_Self-Consciousness lookup used underscore key
//             and silently fell back to default 3.0 — distorting
//             agency by 25% for every user.
// ============================================================

import { describe, it, expect } from "vitest";
import { computeInterpersonalEnergy } from "../interpersonal-energy";

type Pair = { facet: string; score: number };

function buildPairs(overrides: Partial<Record<string, number>> = {}): Pair[] {
  const defaults: Record<string, number> = {
    E1_Friendliness: 3,
    E2_Gregariousness: 3,
    E3_Assertiveness: 3,
    A3_Altruism: 3,
    A5_Modesty: 3,
    A6_Sympathy: 3,
    "N4_Self-Consciousness": 3,
  };
  return Object.entries({ ...defaults, ...overrides }).map(
    ([facet, score]) => ({ facet, score: score as number }),
  );
}

describe("computeInterpersonalEnergy", () => {
  it("returns undefined when any core facet is missing", () => {
    // Drop E1
    const pairs = buildPairs().filter((p) => p.facet !== "E1_Friendliness");
    expect(computeInterpersonalEnergy(pairs)).toBeUndefined();
  });

  it("returns a result when all core facets exist", () => {
    const result = computeInterpersonalEnergy(buildPairs());
    expect(result).toBeDefined();
    expect(typeof result?.agency).toBe("number");
    expect(typeof result?.communion).toBe("number");
  });

  it("reads N4 with hyphen key (regression: was looking up underscore)", () => {
    // Construct two profiles that differ ONLY in N4. If the lookup is
    // broken (defaults to 3.0), agency would be identical between them.
    const lowN4 = computeInterpersonalEnergy(
      buildPairs({ "N4_Self-Consciousness": 1, E3_Assertiveness: 3 }),
    );
    const highN4 = computeInterpersonalEnergy(
      buildPairs({ "N4_Self-Consciousness": 5, E3_Assertiveness: 3 }),
    );
    expect(lowN4!.agency).toBeGreaterThan(highN4!.agency);
    // Difference comes from the N4 weight (0.25) over the full 0-100 scale.
    expect(lowN4!.agency - highN4!.agency).toBeGreaterThanOrEqual(20);
  });

  it("reflects N4 in derivedFrom (not the default 3.0)", () => {
    const result = computeInterpersonalEnergy(
      buildPairs({ "N4_Self-Consciousness": 4.5 }),
    );
    expect(result?.derivedFrom.N4).toBeCloseTo(4.5);
  });

  it("computes correct agency for high-assertive low-modesty profile", () => {
    // E3=5 (full), A5=1 (low modesty inverted to 100), N4=1 (low self-cons inverted to 100)
    // agency = 100*0.45 + 100*0.30 + 100*0.25 = 100
    const result = computeInterpersonalEnergy(
      buildPairs({
        E3_Assertiveness: 5,
        A5_Modesty: 1,
        "N4_Self-Consciousness": 1,
      }),
    );
    expect(result?.agency).toBeGreaterThanOrEqual(95);
    expect(result?.quadrant).toMatch(/^assured-/);
  });

  it("computes correct communion for warm/altruistic profile", () => {
    // E1=5, A3=5, A6=5. Against IPIP-NEO facet norms, max warmth lands ~90th
    // percentile (not ~100) because Altruism/Sympathy are normatively high
    // already (A3 mean 4.18), so a "5" is strong but not extreme.
    const result = computeInterpersonalEnergy(
      buildPairs({ E1_Friendliness: 5, A3_Altruism: 5, A6_Sympathy: 5 }),
    );
    expect(result?.communion).toBeGreaterThanOrEqual(90);
    expect(result?.quadrant).toMatch(/-warm$/);
  });

  it("classifies the four quadrants", () => {
    const assuredWarm = computeInterpersonalEnergy(
      buildPairs({
        E3_Assertiveness: 5,
        A5_Modesty: 1,
        "N4_Self-Consciousness": 1,
        E1_Friendliness: 5,
        A3_Altruism: 5,
        A6_Sympathy: 5,
      }),
    );
    expect(assuredWarm?.quadrant).toBe("assured-warm");

    const assuredReserved = computeInterpersonalEnergy(
      buildPairs({
        E3_Assertiveness: 5,
        A5_Modesty: 1,
        "N4_Self-Consciousness": 1,
        E1_Friendliness: 1,
        A3_Altruism: 1,
        A6_Sympathy: 1,
      }),
    );
    expect(assuredReserved?.quadrant).toBe("assured-reserved");

    const unassumingWarm = computeInterpersonalEnergy(
      buildPairs({
        E3_Assertiveness: 1,
        A5_Modesty: 5,
        "N4_Self-Consciousness": 5,
        E1_Friendliness: 5,
        A3_Altruism: 5,
        A6_Sympathy: 5,
      }),
    );
    expect(unassumingWarm?.quadrant).toBe("unassuming-warm");

    const unassumingReserved = computeInterpersonalEnergy(
      buildPairs({
        E3_Assertiveness: 1,
        A5_Modesty: 5,
        "N4_Self-Consciousness": 5,
        E1_Friendliness: 1,
        A3_Altruism: 1,
        A6_Sympathy: 1,
      }),
    );
    expect(unassumingReserved?.quadrant).toBe("unassuming-reserved");
  });

  it("classifies energy mode based on E2", () => {
    const amplifier = computeInterpersonalEnergy(
      buildPairs({ E2_Gregariousness: 5 }),
    );
    expect(amplifier?.energyMode).toBe("amplifier");

    const observer = computeInterpersonalEnergy(
      buildPairs({ E2_Gregariousness: 1 }),
    );
    expect(observer?.energyMode).toBe("observer");

    const curator = computeInterpersonalEnergy(
      // ≈ Extraversion population mean → ~50th percentile → mid (curator) band.
      buildPairs({ E2_Gregariousness: 3.27 }),
    );
    expect(curator?.energyMode).toBe("curator");
  });

  it("no longer forces the raw midpoint (3.0) into a 'balanced' assured-warm (F15)", () => {
    // OLD behavior scored all-3.0 as agency=communion=50 → assured-warm. Norm-
    // referencing reads 3.0 against the elevated population norms: the
    // agreeableness-derived warmth facets (3.0) sit well below the A norm
    // (3.71), so communion is below the median → NOT "warm". The scale-midpoint
    // bias is removed.
    const result = computeInterpersonalEnergy(buildPairs());
    expect(result?.communion).toBeLessThan(50);
    expect(result?.quadrant).not.toBe("assured-warm");
  });

  it("falls back to 3.0 for missing optional A5 and N4", () => {
    const pairs = buildPairs().filter(
      (p) => p.facet !== "A5_Modesty" && p.facet !== "N4_Self-Consciousness",
    );
    const result = computeInterpersonalEnergy(pairs);
    expect(result).toBeDefined();
    expect(result?.derivedFrom.A5).toBe(3);
    expect(result?.derivedFrom.N4).toBe(3);
  });

  it("never returns NaN regardless of input", () => {
    const extremes: Array<Partial<Record<string, number>>> = [
      { E3_Assertiveness: 1, A5_Modesty: 1, "N4_Self-Consciousness": 1 },
      { E3_Assertiveness: 5, A5_Modesty: 5, "N4_Self-Consciousness": 5 },
      { E1_Friendliness: 5, A3_Altruism: 1, A6_Sympathy: 5 },
    ];
    for (const ext of extremes) {
      const result = computeInterpersonalEnergy(buildPairs(ext));
      expect(Number.isFinite(result!.agency)).toBe(true);
      expect(Number.isFinite(result!.communion)).toBe(true);
    }
  });
});
