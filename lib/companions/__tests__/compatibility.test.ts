import { describe, it, expect } from "vitest";
import {
  parseArchetypeCode,
  cosineSimilarity,
  complementarity,
  computeCompatibility,
} from "../compatibility";
import type { CompanionRiasecScores } from "@/lib/types/companion";

const ZERO: CompanionRiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
const ALL_ONES: CompanionRiasecScores = { R: 1, I: 1, A: 1, S: 1, E: 1, C: 1 };
const R_ONLY: CompanionRiasecScores = { R: 5, I: 0, A: 0, S: 0, E: 0, C: 0 };
const I_ONLY: CompanionRiasecScores = { R: 0, I: 5, A: 0, S: 0, E: 0, C: 0 };
const RIA_HEAVY: CompanionRiasecScores = {
  R: 4,
  I: 5,
  A: 4,
  S: 1,
  E: 1,
  C: 1,
};

describe("parseArchetypeCode()", () => {
  it("parses canonical codes", () => {
    expect(parseArchetypeCode("R-enhancement")).toEqual({
      primary: "R",
      orientation: "enhancement",
    });
    expect(parseArchetypeCode("I-transcendence")).toEqual({
      primary: "I",
      orientation: "transcendence",
    });
    expect(parseArchetypeCode("C-transcendence")).toEqual({
      primary: "C",
      orientation: "transcendence",
    });
  });

  it("returns null on malformed input", () => {
    expect(parseArchetypeCode("")).toBeNull();
    expect(parseArchetypeCode("R")).toBeNull();
    expect(parseArchetypeCode("R-")).toBeNull();
    expect(parseArchetypeCode("Z-enhancement")).toBeNull(); // unknown primary
    expect(parseArchetypeCode("R-something_else")).toBeNull();
    expect(parseArchetypeCode("r-enhancement")).toBeNull(); // case-sensitive
  });

  it("treats non-string defensively", () => {
    // @ts-expect-error — exercising runtime defence
    expect(parseArchetypeCode(undefined)).toBeNull();
    // @ts-expect-error — exercising runtime defence
    expect(parseArchetypeCode(42)).toBeNull();
  });
});

describe("cosineSimilarity()", () => {
  it("returns 1 for identical non-zero vectors", () => {
    expect(cosineSimilarity(ALL_ONES, ALL_ONES)).toBeCloseTo(1, 6);
    expect(cosineSimilarity(R_ONLY, R_ONLY)).toBeCloseTo(1, 6);
  });

  it("returns 0 for fully orthogonal vectors", () => {
    expect(cosineSimilarity(R_ONLY, I_ONLY)).toBe(0);
  });

  it("defaults to 0 when either vector is zero (no NaN)", () => {
    expect(cosineSimilarity(ZERO, R_ONLY)).toBe(0);
    expect(cosineSimilarity(R_ONLY, ZERO)).toBe(0);
    expect(cosineSimilarity(ZERO, ZERO)).toBe(0);
  });

  it("clamps to [0, 1] under floating-point drift", () => {
    const sim = cosineSimilarity(RIA_HEAVY, RIA_HEAVY);
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it("is symmetric", () => {
    const ab = cosineSimilarity(RIA_HEAVY, R_ONLY);
    const ba = cosineSimilarity(R_ONLY, RIA_HEAVY);
    expect(ab).toBeCloseTo(ba, 12);
  });
});

describe("complementarity()", () => {
  it("0.7 for same orientation", () => {
    expect(complementarity("enhancement", "enhancement")).toBe(0.7);
    expect(complementarity("transcendence", "transcendence")).toBe(0.7);
  });

  it("1.0 for opposite orientation", () => {
    expect(complementarity("enhancement", "transcendence")).toBe(1.0);
    expect(complementarity("transcendence", "enhancement")).toBe(1.0);
  });
});

describe("computeCompatibility()", () => {
  const viewer = {
    scoresJson: RIA_HEAVY,
    archetypeCode: "I-enhancement",
  };

  it("perfect-similarity, opposite-orientation pair scores at the upper end", () => {
    const result = computeCompatibility(viewer, {
      scoresJson: RIA_HEAVY, // identical RIASEC
      archetypeCode: "I-transcendence", // opposite orientation
    });
    expect(result).not.toBeNull();
    // 0.6 × 1 + 0.4 × 1 = 1.0 → 100
    expect(result!.score).toBe(100);
    expect(result!.cosineSimilarity).toBeCloseTo(1, 6);
    expect(result!.complementarity).toBe(1.0);
    expect(result!.primary).toBe("I");
    expect(result!.orientation).toBe("transcendence");
  });

  it("perfect-similarity, same-orientation pair scores lower than opposite-orientation", () => {
    const sameOrient = computeCompatibility(viewer, {
      scoresJson: RIA_HEAVY,
      archetypeCode: "I-enhancement",
    })!;
    const oppOrient = computeCompatibility(viewer, {
      scoresJson: RIA_HEAVY,
      archetypeCode: "I-transcendence",
    })!;
    expect(sameOrient.score).toBeLessThan(oppOrient.score);
    // 0.6 × 1 + 0.4 × 0.7 = 0.88 → 88
    expect(sameOrient.score).toBe(88);
  });

  it("orthogonal-similarity, opposite-orientation pair leans on the complementarity floor", () => {
    // Use strictly disjoint vectors to make cosine exactly 0
    const result = computeCompatibility(
      { scoresJson: R_ONLY, archetypeCode: "R-enhancement" },
      { scoresJson: I_ONLY, archetypeCode: "I-transcendence" },
    )!;
    // cosine = 0 exactly, complementarity = 1.0
    // score = 100 × (0.6 × 0 + 0.4 × 1) = 40 exactly
    expect(result.cosineSimilarity).toBe(0);
    expect(result.complementarity).toBe(1.0);
    expect(result.score).toBe(40);
    expect(result.primary).toBe("I");
    expect(result.orientation).toBe("transcendence");
  });

  it("returns null when either archetypeCode is unparseable", () => {
    expect(
      computeCompatibility(viewer, {
        scoresJson: RIA_HEAVY,
        archetypeCode: "garbage",
      }),
    ).toBeNull();
    expect(
      computeCompatibility(
        { scoresJson: RIA_HEAVY, archetypeCode: "" },
        { scoresJson: RIA_HEAVY, archetypeCode: "I-transcendence" },
      ),
    ).toBeNull();
  });

  it("score is clamped to [0, 100] range", () => {
    const a = computeCompatibility(viewer, {
      scoresJson: ZERO,
      archetypeCode: "I-enhancement",
    })!;
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
  });
});
