// ============================================================
// Tests: computeMeaningCompass — Schwartz E/T axis × Ikigai overlap × tension
// ============================================================

import { describe, it, expect } from "vitest";
import { computeMeaningCompass } from "../meaning-compass";
import type { PersonalProfileData, MeaningCompass } from "@/lib/types/platform";
import type {
  SchwartzValue,
  BigFiveDimension,
  RIASECDimension,
  CollabStyle,
} from "@/lib/types/dimensions";
import type { ProfileAlgorithmOutput } from "@/lib/types/report";

type AlgoSnapshot = Omit<ProfileAlgorithmOutput, "archetypeContent">;

// ── Fixtures ──────────────────────────────────────────────────

function makeBigFive(
  overrides: Partial<Record<BigFiveDimension, number>> = {},
): Record<BigFiveDimension, number> {
  return {
    openness: 50,
    conscientiousness: 50,
    extraversion: 50,
    agreeableness: 50,
    neuroticism: 50,
    ...overrides,
  };
}

function makeCenteredSchwartz(
  overrides: Partial<Record<SchwartzValue, number>> = {},
): Record<SchwartzValue, number> {
  return {
    achievement: 0,
    power: 0,
    stimulation: 0,
    "self-direction": 0,
    hedonism: 0,
    benevolence: 0,
    universalism: 0,
    conformity: 0,
    tradition: 0,
    security: 0,
    ...overrides,
  };
}

function makeRiasecScores(
  overrides: Partial<Record<RIASECDimension, number>> = {},
): Record<RIASECDimension, number> {
  return { R: 50, I: 50, A: 50, S: 50, E: 50, C: 50, ...overrides };
}

function makeProfile(
  opts: {
    top3?: SchwartzValue[];
    riasec?: Partial<Record<RIASECDimension, number>>;
    collab?: CollabStyle;
    conflictPair?: PersonalProfileData["schwartzAnchors"]["conflictPair"];
  } = {},
): PersonalProfileData {
  const ranking: SchwartzValue[] = [
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
  ];
  return {
    id: "p-test",
    assessmentId: "a-test",
    archetype: {
      primary: "I",
      orientation: "transcendence",
      code: "I-transcendence",
      label_zh: "测试型",
      label_en: "Test Type",
      tagline_zh: "",
      tagline_en: "",
      confidence: 0.7,
      confidenceLevel: "medium",
      isBoundary: false,
      derivedFrom: {
        primary: { dimension: "I", score: 80 },
        secondary: { dimension: "A", score: 70 },
        tertiary: { dimension: "S", score: 65 },
        gap12: 10,
        gap23: 5,
        relation: "adjacent",
      },
    },
    cognitiveStyleCode: "INTP",
    cognitiveStyleDisplayMode: "normal",
    collabMapping: {
      primary: opts.collab ?? "C",
      secondary: null,
      scores: { D: 25, I: 25, S: 25, C: 25 },
      cssGradient: "",
      derivedFrom: "big_five_mapping",
      approximationNote_zh: "",
      approximationNote_en: "",
      confidence: 0.7,
    },
    schwartzAnchors: {
      ranking,
      top3: opts.top3 ?? ["benevolence", "self-direction", "universalism"],
      scores: {} as Record<SchwartzValue, number>,
      conflictPair: opts.conflictPair ?? null,
      conflictStatus: null,
      confidence: 0.85,
    },
    crossCultural: { type: null, label_zh: null },
    riasecScores: makeRiasecScores(opts.riasec),
    confidenceMap: { riasec: 0.7, bigFive: 0.7, collab: 0.7, values: 0.85 },
    version: "2.0",
    createdAt: "",
    updatedAt: "",
  };
}

function makeAlgo(
  opts: {
    enhancement?: number;
    transcendence?: number;
    bigFive?: Partial<Record<BigFiveDimension, number>>;
    centered?: Partial<Record<SchwartzValue, number>>;
    skipValueScores?: boolean;
  } = {},
): AlgoSnapshot {
  const valueScores = opts.skipValueScores
    ? undefined
    : {
        enhancement: opts.enhancement ?? 0,
        transcendence: opts.transcendence ?? 0,
      };
  return {
    archetype: {
      primary: "I",
      orientation: "transcendence",
      code: "I-transcendence",
      label_zh: "",
      label_en: "",
      tagline_zh: "",
      tagline_en: "",
      confidence: 0.7,
      confidenceLevel: "medium",
      isBoundary: false,
      valueScores,
      derivedFrom: {
        primary: { dimension: "I", score: 80 },
        secondary: { dimension: "A", score: 70 },
        tertiary: { dimension: "S", score: 65 },
        gap12: 10,
        gap23: 5,
        relation: "adjacent",
      },
    },
    riasecRadar: {
      build: 50,
      decode: 80,
      create: 70,
      connect: 50,
      drive: 50,
      structure: 50,
    },
    cognitiveStyleCode: "INTP",
    cognitiveStyleDisplayMode: "normal",
    cognitiveStyleDimensions: {
      EI: { score: 30, label: "I", isNearMidpoint: false },
      SN: { score: 70, label: "N", isNearMidpoint: false },
      TF: { score: 40, label: "T", isNearMidpoint: false },
      JP: { score: 60, label: "P", isNearMidpoint: false },
    },
    cognitiveStyleConfidence: 0.7,
    bigFiveDomains: makeBigFive(opts.bigFive),
    bigFiveFacets: {},
    bigFivePrecision: "standard",
    bigFiveFacetPairs: [],
    polarityContext: {
      otcScore: 0,
      conScore: 0,
      polarity: "anchor",
      polarityStrength: "weak",
    },
    schwartz: {
      raw: {} as Record<SchwartzValue, number>,
      centered: makeCenteredSchwartz(opts.centered),
      ranking: [],
      top3: [],
    },
    sjtTensions: { scenarios: [], overallConsistency: 1, notableTensions: [] },
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe("computeMeaningCompass — pole", () => {
  it("returns transcendence axis when transcendence > enhancement", () => {
    const result = computeMeaningCompass(
      makeProfile(),
      makeAlgo({ enhancement: 1, transcendence: 3 }),
    );
    expect(result.pole.axis).toBe("transcendence");
    expect(result.pole.spectrumPosition).toBeGreaterThan(0);
    expect(result.pole.strength).toBeGreaterThan(0);
  });

  it("returns enhancement axis when enhancement > transcendence", () => {
    const result = computeMeaningCompass(
      makeProfile(),
      makeAlgo({ enhancement: 4, transcendence: 1 }),
    );
    expect(result.pole.axis).toBe("enhancement");
    expect(result.pole.spectrumPosition).toBeLessThan(0);
  });

  it("strength scales with gap (gap of 2 → strength 1.0)", () => {
    const result = computeMeaningCompass(
      makeProfile(),
      makeAlgo({ enhancement: 0, transcendence: 2 }),
    );
    expect(result.pole.strength).toBeCloseTo(1, 2);
  });

  it("strength clamps to 1.0 even for very large gaps", () => {
    const result = computeMeaningCompass(
      makeProfile(),
      makeAlgo({ enhancement: 0, transcendence: 10 }),
    );
    expect(result.pole.strength).toBe(1);
  });

  it("spectrumPosition clamps to [-1, 1]", () => {
    const high = computeMeaningCompass(
      makeProfile(),
      makeAlgo({ enhancement: 0, transcendence: 10 }),
    );
    expect(high.pole.spectrumPosition).toBe(1);

    const low = computeMeaningCompass(
      makeProfile(),
      makeAlgo({ enhancement: 10, transcendence: 0 }),
    );
    expect(low.pole.spectrumPosition).toBe(-1);
  });

  it("falls back to centered Schwartz when archetype.valueScores absent", () => {
    const result = computeMeaningCompass(
      makeProfile(),
      makeAlgo({
        skipValueScores: true,
        centered: { benevolence: 0.8, universalism: 0.6 },
      }),
    );
    expect(result.pole.axis).toBe("transcendence");
    expect(result.pole.spectrumPosition).toBeGreaterThan(0);
  });

  it("returns neutral pole when both archetype.valueScores and centered absent", () => {
    const algo = makeAlgo({ skipValueScores: true });
    // Wipe centered to 0 (default) → neutral
    const result = computeMeaningCompass(makeProfile(), algo);
    expect(result.pole.strength).toBe(0);
    expect(result.pole.spectrumPosition).toBe(0);
  });
});

describe("computeMeaningCompass — keystones", () => {
  it("produces exactly top-3 keystones", () => {
    const result = computeMeaningCompass(
      makeProfile({
        top3: ["benevolence", "self-direction", "achievement"],
      }),
      makeAlgo(),
    );
    expect(result.keystones).toHaveLength(3);
    expect(result.keystones.map((k) => k.schwartzKey)).toEqual([
      "benevolence",
      "self-direction",
      "achievement",
    ]);
  });

  it("provides bilingual labels for keystones", () => {
    const result = computeMeaningCompass(
      makeProfile({ top3: ["benevolence"] }),
      makeAlgo(),
    );
    expect(result.keystones[0].label_en).toBeTruthy();
    expect(result.keystones[0].label_zh).toBeTruthy();
    expect(result.keystones[0].label_en).not.toBe(result.keystones[0].label_zh);
  });

  it("derives Big Five coloring tag from dominant domain", () => {
    const result = computeMeaningCompass(
      makeProfile({ top3: ["benevolence"] }),
      makeAlgo({ bigFive: { extraversion: 80 } }),
    );
    expect(result.keystones[0].bigFiveColoring).toBe("high_extraversion");
  });

  it("inverts neuroticism into stability for coloring", () => {
    const result = computeMeaningCompass(
      makeProfile({ top3: ["benevolence"] }),
      // Low N (15) → 100-15 = 85 inverted → dominant
      makeAlgo({ bigFive: { neuroticism: 15, extraversion: 50 } }),
    );
    expect(result.keystones[0].bigFiveColoring).toBe("high_stability");
  });

  it("returns 'balanced' coloring when no domain stands out", () => {
    const result = computeMeaningCompass(
      makeProfile({ top3: ["benevolence"] }),
      makeAlgo({ bigFive: { openness: 50, extraversion: 50 } }),
    );
    expect(result.keystones[0].bigFiveColoring).toBe("balanced");
  });

  it("handles empty top3 gracefully", () => {
    const profile = makeProfile({ top3: [] });
    const result = computeMeaningCompass(profile, makeAlgo());
    expect(result.keystones).toEqual([]);
  });
});

describe("computeMeaningCompass — ikigai", () => {
  it("places Schwartz 'love'-circle values into love and 'need'-circle into need", () => {
    const result = computeMeaningCompass(
      makeProfile({ top3: ["self-direction", "benevolence", "universalism"] }),
      makeAlgo(),
    );
    // self-direction → love (creative_autonomy)
    expect(
      result.ikigai.love.some((i) => i.themeKey === "creative_autonomy"),
    ).toBe(true);
    // benevolence → need (helping_others)
    expect(
      result.ikigai.need.some((i) => i.themeKey === "helping_others"),
    ).toBe(true);
    // universalism → need (truth_seeking)
    expect(result.ikigai.need.some((i) => i.themeKey === "truth_seeking")).toBe(
      true,
    );
  });

  it("places top-2 RIASEC into goodAt circle", () => {
    const result = computeMeaningCompass(
      makeProfile({
        top3: ["benevolence"],
        riasec: { S: 90, I: 80, R: 30, A: 30, E: 30, C: 30 },
      }),
      makeAlgo(),
    );
    // S → helping_others, I → truth_seeking — both should be in goodAt
    const goodAtThemes = result.ikigai.goodAt.map((i) => i.themeKey);
    expect(goodAtThemes).toContain("helping_others");
    expect(goodAtThemes).toContain("truth_seeking");
  });

  it("places collaboration primary into goodAt circle", () => {
    const result = computeMeaningCompass(
      makeProfile({
        top3: ["benevolence"],
        riasec: { R: 90, C: 80, A: 30, I: 30, S: 30, E: 30 },
        collab: "I", // I → helping_others theme
      }),
      makeAlgo(),
    );
    expect(
      result.ikigai.goodAt.some((i) => i.themeKey === "helping_others"),
    ).toBe(true);
  });

  it("detects overlap when same theme appears in >=2 circles", () => {
    // benevolence (need, helping_others) + RIASEC S top (goodAt, helping_others)
    // → helping_others should be in both circles + overlap
    const result = computeMeaningCompass(
      makeProfile({
        top3: ["benevolence"],
        riasec: { S: 90, I: 80, R: 30, A: 30, E: 30, C: 30 },
      }),
      makeAlgo(),
    );
    const helpingItem = result.ikigai.overlap.find(
      (i) => i.themeKey === "helping_others",
    );
    expect(helpingItem).toBeDefined();
    expect(helpingItem!.circles).toContain("need");
    expect(helpingItem!.circles).toContain("goodAt");
    expect(helpingItem!.sources.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty ikigai circles when profile data is empty", () => {
    const profile: PersonalProfileData = {
      ...makeProfile({ top3: [] }),
      riasecScores: undefined,
      collabMapping: {
        primary: "C",
        secondary: null,
        scores: { D: 0, I: 0, S: 0, C: 0 },
        cssGradient: "",
        derivedFrom: "big_five_mapping",
        approximationNote_zh: "",
        approximationNote_en: "",
        confidence: 0,
      },
    };
    const result = computeMeaningCompass(profile, makeAlgo());
    // Only collab primary's goodAt theme remains
    expect(result.ikigai.love).toEqual([]);
    expect(result.ikigai.need).toEqual([]);
  });

  it("merges duplicate themes (e.g. achievement + power both → achievement_influence)", () => {
    const result = computeMeaningCompass(
      makeProfile({
        top3: ["achievement", "power", "self-direction"],
      }),
      makeAlgo(),
    );
    // achievement and power both map to achievement_influence theme
    const achInfluenceItems = [
      ...result.ikigai.love,
      ...result.ikigai.need,
      ...result.ikigai.goodAt,
    ].filter((i) => i.themeKey === "achievement_influence");
    // After merge: should appear at most once across all circles (deduped by themeKey)
    expect(achInfluenceItems.length).toBeLessThanOrEqual(1);
  });
});

describe("computeMeaningCompass — meaningTension", () => {
  it("surfaces achievement_benevolence as creative_vs_experiential", () => {
    const result = computeMeaningCompass(
      makeProfile({ conflictPair: "achievement_benevolence" }),
      makeAlgo(),
    );
    expect(result.meaningTension.pair).toBe("achievement_benevolence");
    expect(result.meaningTension.surfacedAs).toBe("creative_vs_experiential");
  });

  it("surfaces power_universalism as creative_vs_experiential", () => {
    const result = computeMeaningCompass(
      makeProfile({ conflictPair: "power_universalism" }),
      makeAlgo(),
    );
    expect(result.meaningTension.surfacedAs).toBe("creative_vs_experiential");
  });

  it("surfaces autonomy_conformity as agency_vs_acceptance", () => {
    const result = computeMeaningCompass(
      makeProfile({ conflictPair: "autonomy_conformity" }),
      makeAlgo(),
    );
    expect(result.meaningTension.surfacedAs).toBe("agency_vs_acceptance");
  });

  it("surfaces stimulation_security as agency_vs_acceptance", () => {
    const result = computeMeaningCompass(
      makeProfile({ conflictPair: "stimulation_security" }),
      makeAlgo(),
    );
    expect(result.meaningTension.surfacedAs).toBe("agency_vs_acceptance");
  });

  it("returns null tension when no conflict pair detected", () => {
    const result = computeMeaningCompass(
      makeProfile({ conflictPair: null }),
      makeAlgo(),
    );
    expect(result.meaningTension.pair).toBeNull();
    expect(result.meaningTension.surfacedAs).toBeNull();
  });
});

describe("computeMeaningCompass — integration shape", () => {
  it("returns a complete MeaningCompass shape", () => {
    const result: MeaningCompass = computeMeaningCompass(
      makeProfile({
        top3: ["benevolence", "self-direction", "universalism"],
        riasec: { S: 90, A: 80, R: 30, I: 50, E: 30, C: 30 },
        collab: "I",
        conflictPair: "achievement_benevolence",
      }),
      makeAlgo({
        enhancement: 1.5,
        transcendence: 2.5,
        bigFive: { extraversion: 75 },
      }),
    );

    expect(result.pole.axis).toBe("transcendence");
    expect(result.keystones.length).toBe(3);
    expect(result.ikigai.love.length).toBeGreaterThan(0);
    expect(result.ikigai.goodAt.length).toBeGreaterThan(0);
    expect(result.ikigai.need.length).toBeGreaterThan(0);
    expect(result.meaningTension.pair).toBe("achievement_benevolence");
    expect(result.meaningTension.surfacedAs).toBe("creative_vs_experiential");
  });

  it("does not mutate the input profile or algo", () => {
    const profile = makeProfile({ top3: ["benevolence"] });
    const algo = makeAlgo({ enhancement: 1, transcendence: 2 });
    const profileBefore = JSON.stringify(profile);
    const algoBefore = JSON.stringify(algo);
    computeMeaningCompass(profile, algo);
    expect(JSON.stringify(profile)).toBe(profileBefore);
    expect(JSON.stringify(algo)).toBe(algoBefore);
  });
});
