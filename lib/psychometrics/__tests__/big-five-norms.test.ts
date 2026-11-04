// ============================================================
// Tests: Big Five norm-referencing + norm-referenced cognitive style
// Locks the F15 fix: dichotomy cuts at the population median, not the
// raw scale midpoint, so axes split ~50/50 instead of over-assigning the
// high pole.
// ============================================================

import { describe, it, expect } from "vitest";
import type { BigFiveDimension } from "@/lib/types";
import {
  IPIP_NEO_DOMAIN_NORMS,
  IPIP_NEO_FACET_NORMS,
  domainPercentile,
  domainTScore,
  isAboveNorm,
  normalCdf,
  facetPercentile,
  deriveNormReferencedCognitiveStyle,
} from "../big-five-norms";

const M = IPIP_NEO_DOMAIN_NORMS;

describe("normalCdf", () => {
  it("Φ(0)=0.5, Φ(1)≈0.841, Φ(-1)≈0.159, monotonic & bounded", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 3);
    expect(normalCdf(1)).toBeCloseTo(0.841, 2);
    expect(normalCdf(-1)).toBeCloseTo(0.159, 2);
    expect(normalCdf(5)).toBeGreaterThan(0.999);
    expect(normalCdf(-5)).toBeLessThan(0.001);
  });
});

describe("domainPercentile / domainTScore / isAboveNorm", () => {
  it("percentile is 50 at the mean, ~84 at +1SD, ~16 at -1SD", () => {
    for (const d of Object.keys(M) as BigFiveDimension[]) {
      expect(domainPercentile(d, M[d].mean)).toBeCloseTo(50, 0);
      expect(domainPercentile(d, M[d].mean + M[d].sd)).toBeCloseTo(84, 0);
      expect(domainPercentile(d, M[d].mean - M[d].sd)).toBeCloseTo(16, 0);
    }
  });

  it("percentile stays within [0,100] at extreme raw inputs", () => {
    for (const d of Object.keys(M) as BigFiveDimension[]) {
      expect(domainPercentile(d, 1)).toBeGreaterThanOrEqual(0);
      expect(domainPercentile(d, 5)).toBeLessThanOrEqual(100);
    }
  });

  it("facetPercentile uses IPIP-NEO facet norms (50 at the facet mean)", () => {
    // All 30 facets present, each percentile = 50 exactly at its own mean.
    expect(Object.keys(IPIP_NEO_FACET_NORMS)).toHaveLength(30);
    for (const [key, norm] of Object.entries(IPIP_NEO_FACET_NORMS)) {
      expect(facetPercentile(key, norm.mean)).toBeCloseTo(50, 5);
      expect(facetPercentile(key, norm.mean + norm.sd)).toBeCloseTo(84, 0);
    }
    // A high-normative facet (Altruism mean 4.18): a raw 5 is strong (~90),
    // not extreme — the norm-referenced check that prevents over-credit.
    expect(facetPercentile("A3_Altruism", 5)).toBeLessThan(93);
    // Unknown facet → neutral 50 (never skews a composite).
    expect(facetPercentile("ZZ_Nonexistent", 1)).toBe(50);
  });

  it("T-score is 50 at the mean, 60 at +1SD", () => {
    expect(domainTScore("conscientiousness", M.conscientiousness.mean)).toBe(
      50,
    );
    expect(
      domainTScore(
        "conscientiousness",
        M.conscientiousness.mean + M.conscientiousness.sd,
      ),
    ).toBe(60);
  });

  it("isAboveNorm cuts exactly at the population mean (the median, not 3.0)", () => {
    // Conscientiousness mean is 3.45 — ABOVE the raw scale midpoint 3.0.
    expect(isAboveNorm("conscientiousness", 3.46)).toBe(true); // J
    expect(isAboveNorm("conscientiousness", 3.44)).toBe(false); // P
    // A value above the scale midpoint (3.2) but below the pop mean → low pole.
    expect(isAboveNorm("conscientiousness", 3.2)).toBe(false); // P, not J
  });
});

describe("deriveNormReferencedCognitiveStyle", () => {
  const atMeans = (): Record<BigFiveDimension, number> => ({
    neuroticism: M.neuroticism.mean,
    extraversion: M.extraversion.mean,
    openness: M.openness.mean,
    agreeableness: M.agreeableness.mean,
    conscientiousness: M.conscientiousness.mean,
  });

  it("a person at the population means is 'balanced' (no forced type)", () => {
    const cs = deriveNormReferencedCognitiveStyle(atMeans());
    expect(cs.displayMode).toBe("balanced");
    expect(cs.code).toBeNull();
  });

  it("clearly above means on E/O/A/C → ENFJ", () => {
    const cs = deriveNormReferencedCognitiveStyle({
      neuroticism: 3.0,
      extraversion: 4.5,
      openness: 4.5,
      agreeableness: 4.5,
      conscientiousness: 4.5,
    });
    expect(cs.code).toBe("ENFJ");
    expect(cs.displayMode).toBe("normal");
  });

  it("clearly below means on E/O/A/C → ISTP", () => {
    const cs = deriveNormReferencedCognitiveStyle({
      neuroticism: 3.0,
      extraversion: 2.0,
      openness: 2.0,
      agreeableness: 2.0,
      conscientiousness: 2.0,
    });
    expect(cs.code).toBe("ISTP");
  });

  it("FIX: above scale-midpoint but below population mean reads as the low pole", () => {
    // C = 3.2 is above the raw midpoint 3.0 (old code → J) but below the
    // population mean 3.45 (norm-referenced → P).
    const cs = deriveNormReferencedCognitiveStyle({
      neuroticism: 3.0,
      extraversion: 2.5,
      openness: 2.5,
      agreeableness: 2.5,
      conscientiousness: 3.2,
    });
    expect(cs.dimensions.JP.label).toBe("P");
  });

  it("score follows the left-pole-positive convention and stays in [0,100]", () => {
    const cs = deriveNormReferencedCognitiveStyle({
      neuroticism: 3.0,
      extraversion: 4.5, // high E → strong E (left pole) → high EI score
      openness: 2.0, // low O → strong S (left pole) → high SN score
      agreeableness: 2.0, // low A → strong T (left pole) → high TF score
      conscientiousness: 4.5, // high C → strong J (left pole) → high JP score
    });
    for (const axis of ["EI", "SN", "TF", "JP"] as const) {
      expect(cs.dimensions[axis].score).toBeGreaterThanOrEqual(0);
      expect(cs.dimensions[axis].score).toBeLessThanOrEqual(100);
    }
    expect(cs.dimensions.EI.score).toBeGreaterThan(50); // toward E
    expect(cs.dimensions.SN.score).toBeGreaterThan(50); // toward S
    expect(cs.dimensions.TF.score).toBeGreaterThan(50); // toward T
    expect(cs.dimensions.JP.score).toBeGreaterThan(50); // toward J
  });
});

describe("deriveNormReferencedCognitiveStyle — defensive (invalid input)", () => {
  it("all-invalid domains fall back to 'balanced', never a confident code", () => {
    const bad = {
      neuroticism: NaN,
      extraversion: NaN,
      openness: undefined as unknown as number,
      agreeableness: NaN,
      conscientiousness: NaN,
    } as Record<BigFiveDimension, number>;
    const cs = deriveNormReferencedCognitiveStyle(bad);
    expect(cs.code).toBeNull();
    expect(cs.displayMode).toBe("balanced");
    expect(cs.confidence).toBe(0);
  });

  it("a single malformed domain suppresses the code to balanced (no confident type)", () => {
    const cs = deriveNormReferencedCognitiveStyle({
      neuroticism: 3.0,
      extraversion: 4.5,
      openness: 4.5,
      agreeableness: 4.5,
      conscientiousness: NaN, // one bad axis must not yield a 0.75-confidence code
    } as Record<BigFiveDimension, number>);
    expect(cs.code).toBeNull();
    expect(cs.displayMode).toBe("balanced");
    expect(cs.confidence).toBe(0);
  });

  it("domainPercentile / facetPercentile return neutral 50 on NaN", () => {
    expect(domainPercentile("openness", NaN)).toBe(50);
    expect(facetPercentile("A3_Altruism", NaN)).toBe(50);
  });
});
