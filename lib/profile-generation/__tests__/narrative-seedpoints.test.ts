// ============================================================
// Tests: computeNarrativeSeedpoints
// ============================================================

import { describe, it, expect } from "vitest";
import { computeNarrativeSeedpoints } from "../narrative-seedpoints";
import type { PersonalProfileData } from "@/lib/types";
import type { ProfileAlgorithmOutput } from "@/lib/types/report";

type AlgoSnapshot = Omit<ProfileAlgorithmOutput, "archetypeContent">;

/** Minimal profile stub */
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
      label_zh: "解码者",
      label_en: "Scientist",
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
      ranking: [
        "self-direction",
        "achievement",
        "benevolence",
        "universalism",
        "stimulation",
        "hedonism",
        "power",
        "security",
        "tradition",
        "conformity",
      ],
      top3: ["self-direction", "achievement", "benevolence"],
      scores: {},
      conflictPair: null,
      conflictStatus: null,
      confidence: 0.85,
    },
    crossCultural: { type: null, label_zh: null },
    confidenceMap: {},
    version: "2.0",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  } as PersonalProfileData;
}

/** Minimal algo snapshot stub */
function makeAlgo(overrides: Partial<AlgoSnapshot> = {}): AlgoSnapshot {
  return {
    archetype: {
      primary: "I",
      orientation: "enhancement",
      code: "I-enhancement",
      label_zh: "解码者",
      label_en: "Scientist",
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
    riasecRadar: {
      build: 30,
      decode: 70,
      create: 50,
      connect: 40,
      drive: 35,
      structure: 45,
    },
    cognitiveStyleCode: null,
    cognitiveStyleDisplayMode: "balanced",
    cognitiveStyleDimensions: {
      EI: { score: 3, label: "I", isNearMidpoint: true },
      SN: { score: 3, label: "S", isNearMidpoint: true },
      TF: { score: 3, label: "T", isNearMidpoint: true },
      JP: { score: 3, label: "J", isNearMidpoint: true },
    },
    cognitiveStyleConfidence: 0.5,
    bigFiveDomains: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
    },
    bigFiveFacets: {},
    bigFivePrecision: "standard",
    bigFiveFacetPairs: [],
    polarityContext: {
      otcScore: 0.3,
      conScore: 0.3,
      polarity: "explore",
      polarityStrength: "weak",
    },
    schwartz: {
      raw: {},
      centered: {},
      ranking: [],
      top3: [],
    },
    sjtTensions: {
      scenarios: [],
      overallConsistency: 0.7,
      notableTensions: [],
    },
    ...overrides,
  } as AlgoSnapshot;
}

describe("computeNarrativeSeedpoints", () => {
  it("returns empty seedpoints when bigFiveDomains is missing", () => {
    const profile = makeProfile();
    const algo = makeAlgo({ bigFiveDomains: undefined as never });
    const result = computeNarrativeSeedpoints(profile, algo);
    expect(result.seedpoints).toEqual([]);
  });

  it("returns seedpoints for all-average profile (at least SJT or intra-domain)", () => {
    const profile = makeProfile();
    const algo = makeAlgo();
    const result = computeNarrativeSeedpoints(profile, algo);
    // Even average profiles should get some seeds (SJT consistency, etc.)
    expect(result.dominantTheme.en).toBeTruthy();
    expect(result.dominantTheme.zh).toBeTruthy();
  });

  // ── Cross-domain pattern tests ──

  it("detects high-O-low-C pattern", () => {
    const profile = makeProfile();
    const algo = makeAlgo({
      bigFiveDomains: {
        openness: 80,
        conscientiousness: 25,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
      },
    });
    const result = computeNarrativeSeedpoints(profile, algo);
    const oC = result.seedpoints.find(
      (s) =>
        s.category === "cross-domain-amplification" &&
        s.insight.en.includes("generate ideas faster"),
    );
    expect(oC).toBeDefined();
    expect(oC!.salience).toBeGreaterThan(30);
  });

  it("detects high-E-low-A pattern", () => {
    const profile = makeProfile();
    const algo = makeAlgo({
      bigFiveDomains: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 80,
        agreeableness: 25,
        neuroticism: 50,
      },
    });
    const result = computeNarrativeSeedpoints(profile, algo);
    const eA = result.seedpoints.find(
      (s) =>
        s.category === "cross-domain-tension" &&
        s.insight.en.includes("drawn to people"),
    );
    expect(eA).toBeDefined();
  });

  it("detects high-N-high-C pattern", () => {
    const profile = makeProfile();
    const algo = makeAlgo({
      bigFiveDomains: {
        openness: 50,
        conscientiousness: 75,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 80,
      },
    });
    const result = computeNarrativeSeedpoints(profile, algo);
    const nC = result.seedpoints.find((s) =>
      s.insight.en.includes("inner critic"),
    );
    expect(nC).toBeDefined();
  });

  // ── Value × Personality clash tests ──

  it("detects achievement + low-C clash", () => {
    const profile = makeProfile({
      schwartzAnchors: {
        ranking: [],
        top3: ["achievement", "stimulation", "self-direction"],
        scores: {} as Record<string, number>,
        conflictPair: null,
        conflictStatus: null,
        confidence: 0.85,
      },
    });
    const algo = makeAlgo({
      bigFiveDomains: {
        openness: 50,
        conscientiousness: 25,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
      },
    });
    const result = computeNarrativeSeedpoints(profile, algo);
    const achC = result.seedpoints.find(
      (s) =>
        s.category === "value-personality-clash" &&
        s.insight.en.includes("accomplishment"),
    );
    expect(achC).toBeDefined();
  });

  it("detects benevolence + low-A clash", () => {
    const profile = makeProfile({
      schwartzAnchors: {
        ranking: [],
        top3: ["benevolence", "universalism", "self-direction"],
        scores: {} as Record<string, number>,
        conflictPair: null,
        conflictStatus: null,
        confidence: 0.85,
      },
    });
    const algo = makeAlgo({
      bigFiveDomains: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 25,
        neuroticism: 50,
      },
    });
    const result = computeNarrativeSeedpoints(profile, algo);
    const benA = result.seedpoints.find(
      (s) =>
        s.category === "value-personality-clash" &&
        s.insight.en.includes("genuinely want to help"),
    );
    expect(benA).toBeDefined();
  });

  // ── Archetype × Shadow tests ──

  it("detects Social archetype + low E shadow", () => {
    const profile = makeProfile({
      archetype: {
        primary: "S",
        orientation: "transcendence",
        code: "S-transcendence",
        label_zh: "疗愈者",
        label_en: "Healer",
        tagline_zh: "",
        tagline_en: "",
        isBoundary: false,
        confidence: 0.7,
        confidenceLevel: "medium",
        derivedFrom: {
          primary: { dimension: "S", score: 70 },
          secondary: { dimension: "A", score: 50 },
          tertiary: { dimension: "I", score: 40 },
          gap12: 20,
          gap23: 10,
          relation: "adjacent",
        },
      },
    });
    const algo = makeAlgo({
      bigFiveDomains: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 25,
        agreeableness: 70,
        neuroticism: 50,
      },
    });
    const result = computeNarrativeSeedpoints(profile, algo);
    const archShadow = result.seedpoints.find(
      (s) => s.category === "archetype-shadow",
    );
    expect(archShadow).toBeDefined();
    expect(archShadow!.insight.en).toContain("people-centered");
  });

  // ── SJT gap tests ──

  it("detects high SJT consistency as interesting", () => {
    const profile = makeProfile();
    const algo = makeAlgo({
      sjtTensions: {
        scenarios: [
          {
            scenarioId: 1,
            domain: "Leadership",
            shouldScore: 4,
            wouldScore: 4,
            gap: 0,
            isConsistent: true,
          },
        ],
        overallConsistency: 0.9,
        notableTensions: [],
      },
    });
    const result = computeNarrativeSeedpoints(profile, algo);
    const sjt = result.seedpoints.find((s) => s.category === "sjt-gap");
    expect(sjt).toBeDefined();
    expect(sjt!.insight.en).toContain("unusually aligned");
  });

  it("detects notable SJT gaps", () => {
    const profile = makeProfile();
    const algo = makeAlgo({
      sjtTensions: {
        scenarios: [
          {
            scenarioId: 1,
            domain: "Ethical",
            shouldScore: 5,
            wouldScore: 2,
            gap: -3,
            isConsistent: false,
          },
          {
            scenarioId: 2,
            domain: "Leadership",
            shouldScore: 4,
            wouldScore: 3,
            gap: -1,
            isConsistent: false,
          },
        ],
        overallConsistency: 0.45,
        notableTensions: ["Ethical behavior"],
      },
    });
    const result = computeNarrativeSeedpoints(profile, algo);
    const sjt = result.seedpoints.find((s) => s.category === "sjt-gap");
    expect(sjt).toBeDefined();
    expect(sjt!.insight.en).toContain("gap between your ideals");
  });

  // ── Sorting and limits ──

  it("returns max 8 seedpoints sorted by salience", () => {
    const profile = makeProfile({
      schwartzAnchors: {
        ranking: [],
        top3: ["achievement", "benevolence", "security"],
        scores: {} as Record<string, number>,
        conflictPair: null,
        conflictStatus: null,
        confidence: 0.85,
      },
    });
    // Extreme profile that triggers many patterns
    const algo = makeAlgo({
      bigFiveDomains: {
        openness: 85,
        conscientiousness: 20,
        extraversion: 80,
        agreeableness: 20,
        neuroticism: 75,
      },
      bigFiveFacetPairs: [
        {
          domain: "openness",
          facet: "O1_Imagination",
          score: 4.5,
          deviationFromMean: 1.2,
        },
        {
          domain: "openness",
          facet: "O6_Liberalism",
          score: 2.5,
          deviationFromMean: -0.8,
        },
        {
          domain: "extraversion",
          facet: "E3_Assertiveness",
          score: 4.8,
          deviationFromMean: 1.5,
        },
        {
          domain: "extraversion",
          facet: "E2_Gregariousness",
          score: 2.0,
          deviationFromMean: -1.3,
        },
      ],
      sjtTensions: {
        scenarios: [
          {
            scenarioId: 1,
            domain: "Ethical",
            shouldScore: 5,
            wouldScore: 2,
            gap: -3,
            isConsistent: false,
          },
        ],
        overallConsistency: 0.4,
        notableTensions: ["Ethical"],
      },
    });

    const result = computeNarrativeSeedpoints(profile, algo);
    expect(result.seedpoints.length).toBeLessThanOrEqual(8);
    expect(result.seedpoints.length).toBeGreaterThan(3);

    // Verify sorted by salience descending
    for (let i = 1; i < result.seedpoints.length; i++) {
      expect(result.seedpoints[i - 1].salience).toBeGreaterThanOrEqual(
        result.seedpoints[i].salience,
      );
    }
  });

  // ── Bilingual content ──

  it("all seedpoints have bilingual content", () => {
    const profile = makeProfile();
    const algo = makeAlgo({
      bigFiveDomains: {
        openness: 80,
        conscientiousness: 25,
        extraversion: 75,
        agreeableness: 30,
        neuroticism: 70,
      },
    });
    const result = computeNarrativeSeedpoints(profile, algo);
    for (const s of result.seedpoints) {
      expect(s.insight.en).toBeTruthy();
      expect(s.insight.zh).toBeTruthy();
      expect(s.scene.en).toBeTruthy();
      expect(s.scene.zh).toBeTruthy();
      expect(s.tension.en).toBeTruthy();
      expect(s.tension.zh).toBeTruthy();
    }
    expect(result.dominantTheme.en).toBeTruthy();
    expect(result.dominantTheme.zh).toBeTruthy();
  });

  // ── Dominant theme detection ──

  it("detects tension-heavy theme for profiles with many contradictions", () => {
    const profile = makeProfile();
    const algo = makeAlgo({
      bigFiveDomains: {
        openness: 80,
        conscientiousness: 25,
        extraversion: 75,
        agreeableness: 25,
        neuroticism: 70,
      },
      bigFiveFacetPairs: [
        {
          domain: "extraversion",
          facet: "E3_Assertiveness",
          score: 4.8,
          deviationFromMean: 1.5,
        },
        {
          domain: "extraversion",
          facet: "E2_Gregariousness",
          score: 2.0,
          deviationFromMean: -1.3,
        },
      ],
    });
    const result = computeNarrativeSeedpoints(profile, algo);
    expect(result.dominantTheme.en).toContain("creative complexity");
  });
});
