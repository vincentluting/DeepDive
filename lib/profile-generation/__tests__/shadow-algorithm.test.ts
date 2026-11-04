// ============================================================
// Tests: computeShadowInsights
// ============================================================

import { describe, it, expect } from "vitest";
import { computeShadowInsights } from "../shadow-algorithm";
import type { PersonalProfileData } from "@/lib/types";

/** Minimal profile stub with only the fields shadow-algorithm reads */
function makeProfile(
  overrides: Partial<PersonalProfileData> = {},
): PersonalProfileData {
  return {
    id: "test-profile",
    assessmentId: "test-assessment",
    archetype: {
      primary: "I",
      orientation: "enhancement",
      code: "I-enhancement",
      label_zh: "",
      label_en: "",
      tagline_zh: "",
      tagline_en: "",
      isBoundary: false,
      confidence: 0.7,
      confidenceLevel: "medium",
      derivedFrom: {
        primary: { dimension: "I", score: 60 },
        secondary: { dimension: "A", score: 50 },
        tertiary: { dimension: "S", score: 40 },
        gap12: 10,
        gap23: 10,
        relation: "adjacent",
      },
    },
    cognitiveStyleCode: null,
    cognitiveStyleDisplayMode: "normal",
    collabMapping: {
      primary: "S",
      secondary: null,
      scores: { D: 25, I: 25, S: 25, C: 25 },
      cssGradient: "",
      derivedFrom: "big_five_mapping",
      approximationNote_zh: "",
      approximationNote_en: "",
      confidence: 0,
    },
    schwartzAnchors: {
      ranking: [],
      top3: [],
      scores: {},
      conflictPair: null,
      conflictStatus: null,
      confidence: 0,
    },
    crossCultural: { type: "bridge", label_zh: "" },
    confidenceMap: {},
    version: "1.0",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  } as PersonalProfileData;
}

describe("computeShadowInsights", () => {
  it("returns empty insights when bigFiveScores is missing", () => {
    const profile = makeProfile({ bigFiveScores: undefined });
    const result = computeShadowInsights(profile);
    expect(result.shadows).toEqual([]);
    expect(result.overallPattern_en).toBe("");
    expect(result.overallPattern_zh).toBe("");
  });

  it("returns empty insights when all scores are near 50 (no shadow)", () => {
    const profile = makeProfile({
      bigFiveScores: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 45,
      },
    });
    const result = computeShadowInsights(profile);
    expect(result.shadows).toEqual([]);
  });

  it("detects extraversion shadow for low E score", () => {
    const profile = makeProfile({
      bigFiveScores: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 30, // intensity = 50-30 = 20 (above threshold 8)
        agreeableness: 50,
        neuroticism: 45,
      },
    });
    const result = computeShadowInsights(profile);
    expect(result.shadows).toHaveLength(1);
    expect(result.shadows[0].domain).toBe("extraversion");
    expect(result.shadows[0].score).toBe(30);
    expect(result.shadows[0].shadowLabel_en).toBeTruthy();
    expect(result.shadows[0].shadowLabel_zh).toBeTruthy();
  });

  it("detects neuroticism shadow for high N score (reversed direction)", () => {
    const profile = makeProfile({
      bigFiveScores: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 70, // intensity = 70-45 = 25
      },
    });
    const result = computeShadowInsights(profile);
    expect(result.shadows).toHaveLength(1);
    expect(result.shadows[0].domain).toBe("neuroticism");
  });

  it("caps at 3 shadow insights maximum", () => {
    const profile = makeProfile({
      bigFiveScores: {
        openness: 25, // intensity 25
        conscientiousness: 20, // intensity 30
        extraversion: 30, // intensity 20
        agreeableness: 28, // intensity 22
        neuroticism: 75, // intensity 30
      },
    });
    const result = computeShadowInsights(profile);
    expect(result.shadows.length).toBeLessThanOrEqual(3);
  });

  it("sorts shadows by intensity (strongest first)", () => {
    const profile = makeProfile({
      bigFiveScores: {
        openness: 40, // intensity 10
        conscientiousness: 50,
        extraversion: 20, // intensity 30 (strongest)
        agreeableness: 35, // intensity 15
        neuroticism: 45,
      },
    });
    const result = computeShadowInsights(profile);
    expect(result.shadows[0].domain).toBe("extraversion");
  });

  it("generates overall pattern for extraversion + neuroticism combo", () => {
    const profile = makeProfile({
      bigFiveScores: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 30, // shadow
        agreeableness: 50,
        neuroticism: 60, // shadow
      },
    });
    const result = computeShadowInsights(profile);
    expect(result.overallPattern_en).toContain("quiet depth");
  });

  it("detects cross-framework tension (low E + Social archetype)", () => {
    const profile = makeProfile({
      bigFiveScores: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 30,
        agreeableness: 50,
        neuroticism: 45,
      },
      archetype: {
        primary: "S",
        orientation: "enhancement",
        code: "S-enhancement",
        label_zh: "",
        label_en: "",
        tagline_zh: "",
        tagline_en: "",
        isBoundary: false,
        confidence: 0.7,
        confidenceLevel: "medium",
        derivedFrom: {
          primary: { dimension: "S", score: 60 },
          secondary: { dimension: "A", score: 50 },
          tertiary: { dimension: "I", score: 40 },
          gap12: 10,
          gap23: 10,
          relation: "adjacent",
        },
      },
    });
    const result = computeShadowInsights(profile);
    const eShadow = result.shadows.find((s) => s.domain === "extraversion");
    expect(eShadow?.tensionWith).toBeDefined();
    expect(eShadow?.tensionWith?.framework).toBe("riasec");
    expect(eShadow?.tensionWith?.dimension).toBe("Social");
  });

  it("includes related career contexts from static content", () => {
    const profile = makeProfile({
      bigFiveScores: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 25,
        agreeableness: 50,
        neuroticism: 45,
      },
    });
    const result = computeShadowInsights(profile);
    expect(result.shadows[0].relatedCareerContexts).toBeDefined();
    expect(Array.isArray(result.shadows[0].relatedCareerContexts)).toBe(true);
  });
});
