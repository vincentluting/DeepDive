// ============================================================
// Verification Invariants — property tests for career-matching math
//
// Locks the invariants empirically verified in the 2026-06-19 scoring/
// matching audit (scripts/verification/). Pure functions only — hermetic,
// no DB. Guards against regressions in scale, bounds, determinism, and
// tie/zero handling.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  cosineSimilarity,
  toRiasecVector,
  scoreRiasec,
} from "../factors/riasec";
import { scoreBigFive } from "../factors/big-five";
import { scoreValues } from "../factors/values";
import { scoreAdaptability } from "../factors/adaptability";
import { WEIGHT_PRESETS } from "../weights";
import { computeTierPenalty } from "../engine";
import type { RiasecVector } from "../types";

const KEYS: (keyof RiasecVector)[] = ["R", "I", "A", "S", "E", "C"];

function randomVec(seed: number): RiasecVector {
  // deterministic pseudo-random per seed (no Math.random — keeps tests stable)
  const v = {} as RiasecVector;
  let a = seed >>> 0;
  for (const k of KEYS) {
    a = (a * 1664525 + 1013904223) >>> 0;
    v[k] = a % 101; // 0-100
  }
  return v;
}

describe("cosineSimilarity invariants", () => {
  it("is bounded in [0,1] for non-negative vectors", () => {
    for (let s = 1; s <= 200; s++) {
      const sim = cosineSimilarity(randomVec(s), randomVec(s * 7 + 1));
      expect(sim).toBeGreaterThanOrEqual(0);
      expect(sim).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it("identical vectors → 1.0", () => {
    const v = randomVec(42);
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 6);
  });

  it("zero vector → 0 (no NaN/Infinity from divide-by-zero)", () => {
    const zero: RiasecVector = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const v = randomVec(9);
    expect(cosineSimilarity(zero, v)).toBe(0);
    expect(cosineSimilarity(zero, zero)).toBe(0);
    expect(Number.isNaN(cosineSimilarity(zero, v))).toBe(false);
  });

  it("is symmetric", () => {
    const a = randomVec(3);
    const b = randomVec(99);
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 12);
  });
});

describe("scoreRiasec invariants", () => {
  it("score ∈ [0,100] and available", () => {
    for (let s = 1; s <= 100; s++) {
      const r = scoreRiasec(randomVec(s), randomVec(s * 3 + 2));
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.available).toBe(true);
    }
  });

  it("monotonicity — self-match scores 100 (interest fit is maximal at identity)", () => {
    for (let s = 1; s <= 50; s++) {
      const v = randomVec(s);
      expect(scoreRiasec(v, v).score).toBe(100);
    }
  });

  it("toRiasecVector fills missing dims with 0", () => {
    const v = toRiasecVector({ R: 50, E: 80 });
    expect(v).toEqual({ R: 50, I: 0, A: 0, S: 0, E: 80, C: 0 });
  });
});

describe("WEIGHT_PRESETS invariants", () => {
  it("full preset weights sum to 1.0", () => {
    const w = WEIGHT_PRESETS.full;
    const sum =
      w.interestFit +
      w.personalityFit +
      w.valueFit +
      w.adaptabilityFit +
      w.collabFit +
      w.industryFit;
    expect(sum).toBeCloseTo(1.0, 9);
  });

  it("quick preset is RIASEC-only", () => {
    const w = WEIGHT_PRESETS.quick;
    expect(w.interestFit).toBe(1.0);
    expect(
      w.personalityFit +
        w.valueFit +
        w.adaptabilityFit +
        w.collabFit +
        w.industryFit,
    ).toBe(0);
  });
});

describe("computeTierPenalty invariants", () => {
  const tier = { min: 4, max: 5 };
  it("in-band → 0", () => {
    expect(computeTierPenalty(4, tier)).toBe(0);
    expect(computeTierPenalty(5, tier)).toBe(0);
  });
  it("graduated penalty by gap", () => {
    expect(computeTierPenalty(3, tier)).toBe(-10); // 1 off
    expect(computeTierPenalty(2, tier)).toBe(-20); // 2 off
    expect(computeTierPenalty(1, tier)).toBe(-30); // 3 off (capped)
  });
  it("unknown jobZone or opted-out → 0", () => {
    expect(computeTierPenalty(null, tier)).toBe(0);
    expect(computeTierPenalty(undefined, tier)).toBe(0);
    expect(computeTierPenalty(2, null)).toBe(0);
  });
});

describe("scoreBigFive invariants (user 0-100 vs ideal range 0-100)", () => {
  const ideal = { openness: { min: 60, max: 80 } };
  it("within range → 100", () => {
    const r = scoreBigFive(
      {
        openness: 70,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
      },
      ideal,
      "test-id",
    );
    expect(r.score).toBe(100);
  });
  it("score ∈ [0,100] across the scale", () => {
    for (let u = 0; u <= 100; u += 5) {
      const r = scoreBigFive(
        {
          openness: u,
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50,
        },
        ideal,
        "test-id",
      );
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });
  it("missing user data → neutral 50, not available", () => {
    const r = scoreBigFive(undefined, ideal, "test-id");
    expect(r.score).toBe(50);
    expect(r.available).toBe(false);
  });
});

describe("scoreValues / scoreAdaptability bounds", () => {
  const schwartz = {
    top3: ["achievement", "power", "security"],
    centered: {
      achievement: 1.2,
      power: 0.8,
      security: -0.5,
      stimulation: 0.3,
      benevolence: -0.2,
      universalism: 0.1,
    } as Record<string, number>,
  };
  it("scoreValues ∈ [15,100] (floor at 15)", () => {
    const r = scoreValues(schwartz, ["achievement", "power"], "id");
    expect(r.score).toBeGreaterThanOrEqual(15);
    expect(r.score).toBeLessThanOrEqual(100);
  });
  it("scoreValues missing schwartz → neutral 50 not available", () => {
    const r = scoreValues(undefined, ["achievement"], "id");
    expect(r.score).toBe(50);
    expect(r.available).toBe(false);
  });
  it("scoreAdaptability ∈ [15,100]", () => {
    const r = scoreAdaptability(schwartz, "ai-native", 0.9);
    expect(r.score).toBeGreaterThanOrEqual(15);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
