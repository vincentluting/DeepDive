// ============================================================
// Tests: deriveCognitiveStyleFromBigFive — MBTI letter + 0-100 score
// ============================================================
// Regression suite for the 2026-05-10 INFJ/INFP fix:
//   - score is 0-100 with midpoint 50 (not raw 1-5)
//   - higher score = preference toward the LEFT pole letter
//   - EI/JP use forward normalization, SN/TF use reverse
//   - label and the UI hint direction (`score >= 50 ? left : right`) must
//     never disagree (the original bug surfaced as INFJ + P description)
// ============================================================

import { describe, it, expect } from "vitest";
import { deriveCognitiveStyleFromBigFive } from "../index";
import type { BigFiveDimension } from "../../types";

const buildDomains = (
  overrides: Partial<Record<BigFiveDimension, number>> = {},
): Record<BigFiveDimension, number> => ({
  neuroticism: 3,
  extraversion: 3,
  openness: 3,
  agreeableness: 3,
  conscientiousness: 3,
  ...overrides,
});

describe("deriveCognitiveStyleFromBigFive", () => {
  describe("score normalization (0-100, midpoint 50)", () => {
    it("emits scores within [0, 100] for all axes", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({
          extraversion: 4.5,
          openness: 4.5,
          agreeableness: 1.5,
          conscientiousness: 3.5,
        }),
      );
      for (const axis of ["EI", "SN", "TF", "JP"] as const) {
        const score = result.dimensions[axis].score;
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });

    it("centers a midpoint Big Five profile at score 50 on every axis", () => {
      const result = deriveCognitiveStyleFromBigFive(buildDomains());
      expect(result.dimensions.EI.score).toBe(50);
      expect(result.dimensions.SN.score).toBe(50);
      expect(result.dimensions.TF.score).toBe(50);
      expect(result.dimensions.JP.score).toBe(50);
    });

    it("clamps domains outside [1, 5] to the 0-100 range", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({
          extraversion: 0,
          openness: 6,
          agreeableness: -1,
          conscientiousness: 10,
        }),
      );
      expect(result.dimensions.EI.score).toBe(0);
      // reverse(6) before clamp would be -25 → clamp to 0
      expect(result.dimensions.SN.score).toBe(0);
      // reverse(-1) before clamp would be 150 → clamp to 100
      expect(result.dimensions.TF.score).toBe(100);
      expect(result.dimensions.JP.score).toBe(100);
    });
  });

  describe("EI axis (forward: high E → high score → left pole 'E')", () => {
    it("high extraversion emits label 'E' with score > 50", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ extraversion: 4.5 }),
      );
      expect(result.dimensions.EI.label).toBe("E");
      expect(result.dimensions.EI.score).toBeGreaterThan(50);
    });

    it("low extraversion emits label 'I' with score < 50", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ extraversion: 1.5 }),
      );
      expect(result.dimensions.EI.label).toBe("I");
      expect(result.dimensions.EI.score).toBeLessThan(50);
    });
  });

  describe("SN axis (reverse: high O → 'N' which is RIGHT pole → low score)", () => {
    it("high openness emits label 'N' with score < 50 (UI hint stays 'N')", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ openness: 4.5 }),
      );
      expect(result.dimensions.SN.label).toBe("N");
      // reverse((5-4.5)/4)*100 = 12.5
      expect(result.dimensions.SN.score).toBeCloseTo(12.5, 5);
    });

    it("low openness emits label 'S' with score > 50 (UI hint stays 'S')", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ openness: 1.5 }),
      );
      expect(result.dimensions.SN.label).toBe("S");
      // reverse((5-1.5)/4)*100 = 87.5
      expect(result.dimensions.SN.score).toBeCloseTo(87.5, 5);
    });
  });

  describe("TF axis (reverse: high A → 'F' which is RIGHT pole → low score)", () => {
    it("high agreeableness emits label 'F' with score < 50", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ agreeableness: 4.5 }),
      );
      expect(result.dimensions.TF.label).toBe("F");
      expect(result.dimensions.TF.score).toBeCloseTo(12.5, 5);
    });

    it("low agreeableness emits label 'T' with score > 50", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ agreeableness: 1.5 }),
      );
      expect(result.dimensions.TF.label).toBe("T");
      expect(result.dimensions.TF.score).toBeCloseTo(87.5, 5);
    });
  });

  describe("JP axis (forward: high C → high score → left pole 'J')", () => {
    it("high conscientiousness emits label 'J' with score > 50", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ conscientiousness: 4.5 }),
      );
      expect(result.dimensions.JP.label).toBe("J");
      expect(result.dimensions.JP.score).toBeCloseTo(87.5, 5);
    });

    it("low conscientiousness emits label 'P' with score < 50", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ conscientiousness: 1.5 }),
      );
      expect(result.dimensions.JP.label).toBe("P");
      expect(result.dimensions.JP.score).toBeCloseTo(12.5, 5);
    });
  });

  describe("end-to-end UI contract — replays the user-reported screenshot", () => {
    // Reproduces the values reverse-engineered from the bug screenshot:
    //   外向 strength 47.08 → extraversion raw ≈ 2.92
    //   实感 strength 45.92 → openness     raw ≈ 4.08
    //   思考 strength 46.08 → agreeableness raw ≈ 3.92
    //   判断 strength 46.5  → conscientiousness raw ≈ 3.5
    // UI logic (cognitive-style-breakdown.tsx:73,143-154):
    //   strength = Math.abs(score - 50)
    //   hintKey = isNearMidpoint ? "balanced" : score >= 50 ? left : right
    const pickHintKey = (
      score: number,
      isNearMidpoint: boolean,
      hintKeys: { left: string; right: string },
    ) =>
      isNearMidpoint
        ? "cogHintBalanced"
        : score >= 50
          ? hintKeys.left
          : hintKeys.right;

    const HINTS = {
      EI: { left: "cogHintEI_E", right: "cogHintEI_I" },
      SN: { left: "cogHintSN_S", right: "cogHintSN_N" },
      TF: { left: "cogHintTF_T", right: "cogHintTF_F" },
      JP: { left: "cogHintJP_J", right: "cogHintJP_P" },
    };

    it("matches the screenshot's letter code 'INFJ'", () => {
      const r = deriveCognitiveStyleFromBigFive(
        buildDomains({
          extraversion: 2.92,
          openness: 4.08,
          agreeableness: 3.92,
          conscientiousness: 3.5,
        }),
      );
      expect(r.code).toBe("INFJ");
      expect(r.displayMode).toBe("normal");
    });

    it("JP hint resolves to the J description (the original bug fixed)", () => {
      const r = deriveCognitiveStyleFromBigFive(
        buildDomains({ conscientiousness: 3.5 }),
      );
      const hint = pickHintKey(
        r.dimensions.JP.score,
        r.dimensions.JP.isNearMidpoint,
        HINTS.JP,
      );
      expect(r.dimensions.JP.label).toBe("J");
      expect(hint).toBe("cogHintJP_J"); // pre-fix this resolved to cogHintJP_P
    });

    it("EI in the screenshot stays balanced (the calm middle)", () => {
      const r = deriveCognitiveStyleFromBigFive(
        buildDomains({ extraversion: 2.92 }),
      );
      expect(r.dimensions.EI.isNearMidpoint).toBe(true);
      expect(
        pickHintKey(
          r.dimensions.EI.score,
          r.dimensions.EI.isNearMidpoint,
          HINTS.EI,
        ),
      ).toBe("cogHintBalanced");
    });

    it("SN/TF show right-pole descriptions matching their N/F labels", () => {
      const r = deriveCognitiveStyleFromBigFive(
        buildDomains({ openness: 4.08, agreeableness: 3.92 }),
      );
      expect(r.dimensions.SN.label).toBe("N");
      expect(
        pickHintKey(
          r.dimensions.SN.score,
          r.dimensions.SN.isNearMidpoint,
          HINTS.SN,
        ),
      ).toBe("cogHintSN_N");
      expect(r.dimensions.TF.label).toBe("F");
      expect(
        pickHintKey(
          r.dimensions.TF.score,
          r.dimensions.TF.isNearMidpoint,
          HINTS.TF,
        ),
      ).toBe("cogHintTF_F");
    });
  });

  describe("the original INFJ/INFP bug — label vs UI hint must agree", () => {
    // The screenshot reproduction: conscientiousness ≈ 3.5 produced
    // label='J' but the UI showed the 'P' description because the raw
    // 1-5 score (3.5) collapsed to leftPct < 50 in UI math.
    it("conscientiousness 3.5 → label='J' AND score >= 50", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ conscientiousness: 3.5 }),
      );
      expect(result.dimensions.JP.label).toBe("J");
      expect(result.dimensions.JP.score).toBeGreaterThanOrEqual(50); // UI now shows J hint
    });

    it("after the fix, label and hint direction align across all axes", () => {
      // Drive a profile through every quadrant and assert the invariant
      // `score >= 50` ↔ `label is the left-pole letter`.
      const profiles: Array<Partial<Record<BigFiveDimension, number>>> = [
        {
          extraversion: 4,
          openness: 4,
          agreeableness: 4,
          conscientiousness: 4,
        },
        {
          extraversion: 2,
          openness: 2,
          agreeableness: 2,
          conscientiousness: 2,
        },
        {
          extraversion: 4,
          openness: 2,
          agreeableness: 4,
          conscientiousness: 2,
        },
        {
          extraversion: 2,
          openness: 4,
          agreeableness: 2,
          conscientiousness: 4,
        },
      ];
      const leftPole = { EI: "E", SN: "S", TF: "T", JP: "J" } as const;

      for (const overrides of profiles) {
        const r = deriveCognitiveStyleFromBigFive(buildDomains(overrides));
        if (r.displayMode === "balanced") continue; // letters skipped when too balanced
        for (const axis of ["EI", "SN", "TF", "JP"] as const) {
          const dim = r.dimensions[axis];
          if (dim.isNearMidpoint) continue;
          if (dim.score >= 50) {
            expect(dim.label).toBe(leftPole[axis]);
          } else {
            expect(dim.label).not.toBe(leftPole[axis]);
          }
        }
      }
    });
  });

  describe("isNearMidpoint and displayMode", () => {
    it("flags a domain within ±0.5 of raw midpoint as near-midpoint", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ extraversion: 3.2 }),
      );
      expect(result.dimensions.EI.isNearMidpoint).toBe(true);
    });

    it("treats raw 3.5 as 'clear' (strict < 0.5 boundary, not balanced)", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ conscientiousness: 3.5 }),
      );
      expect(result.dimensions.JP.isNearMidpoint).toBe(false);
    });

    it("returns code=null and displayMode='balanced' when ≥2 axes are near-midpoint", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({ extraversion: 3.1, openness: 3.0 }),
      );
      expect(result.displayMode).toBe("balanced");
      expect(result.code).toBeNull();
    });

    it("returns a 4-letter code in normal mode with confidence reflecting clear axes", () => {
      const result = deriveCognitiveStyleFromBigFive(
        buildDomains({
          extraversion: 1.5,
          openness: 4.5,
          agreeableness: 4.5,
          conscientiousness: 4.5,
        }),
      );
      expect(result.displayMode).toBe("normal");
      expect(result.code).toBe("INFJ");
      expect(result.confidence).toBe(1); // 4 clear axes / 4
    });
  });
});
