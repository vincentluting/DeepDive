import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalProfileData } from "@/lib/types";
import type { ProfileAlgorithmOutput } from "@/lib/types/report";

const mockCallLLM = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ai/model-router", () => ({
  callLLM: mockCallLLM,
}));

vi.mock("@/lib/report-generation/common-rules", () => ({
  getSystemPreamble: () => "system preamble",
}));

vi.mock("@/lib/report-generation/language-guard", () => ({
  enforceOutputLocale: vi.fn(<T extends object>(output: T) =>
    Promise.resolve(output),
  ),
  buildRegeneratePrompt: vi.fn(() => "retry prompt"),
}));

import { generateIdentityNarratives } from "../generate-identity-narratives";

type AlgoSnapshot = Omit<ProfileAlgorithmOutput, "archetypeContent">;

function narrative(label: string): string {
  return `${label}: You tend to notice the real shape of a decision before other people have named it, and you keep working until the choice feels honest enough to stand behind.`;
}

function makeProfile(): PersonalProfileData {
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
  } as PersonalProfileData;
}

function makeAlgo(): AlgoSnapshot {
  const schwartzScores = {
    achievement: 0,
    power: 0,
    stimulation: 0,
    "self-direction": 0,
    universalism: 0,
    benevolence: 0,
    tradition: 0,
    conformity: 0,
    security: 0,
    hedonism: 0,
  };

  return {
    archetype: makeProfile().archetype,
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
      raw: schwartzScores,
      centered: schwartzScores,
      ranking: [],
      top3: [],
    },
    sjtTensions: {
      scenarios: [],
      overallConsistency: 0.7,
      notableTensions: [],
    },
  } as AlgoSnapshot;
}

describe("generateIdentityNarratives", () => {
  beforeEach(() => {
    mockCallLLM.mockReset();
  });

  it("falls back to legacy when soul + repair both fail to complete the payload", async () => {
    const partialSoul = {
      identitySummary: narrative("identity"),
      archetypeNarrative: narrative("archetype"),
      bigFiveNarrative: narrative("big five"),
      valueNarrative: narrative("values"),
      sjtTensionNarrative: narrative("sjt"),
    };
    const callA = {
      identitySummary: narrative("fallback identity"),
      archetypeNarrative: narrative("fallback archetype"),
      bigFiveNarrative: narrative("fallback big five"),
      valueNarrative: narrative("fallback values"),
    };
    const callB = {
      sjtTensionNarrative: narrative("fallback sjt"),
      crossDimensionNarrative: narrative("fallback cross dimension"),
      growthMapInsight: narrative("fallback growth"),
    };

    mockCallLLM.mockImplementation(
      async (_task: string, messages: { content: string }[]) => {
        const prompt = messages[1]?.content ?? "";
        // Repair attempt has the same soul prompt PLUS the addendum. Match
        // it first so it doesn't fall into the plain soul branch.
        if (prompt.includes("Regenerate ONLY the following fields")) {
          // Repair attempt returns the same partial (no new fields) →
          // repair fails → caller falls through to legacy A/B.
          return JSON.stringify({});
        }
        if (prompt.includes("Write a letter about this person")) {
          return JSON.stringify(partialSoul);
        }
        if (prompt.includes("Return JSON with 4 fields")) {
          return JSON.stringify(callA);
        }
        if (prompt.includes("Return JSON with 3 fields")) {
          return JSON.stringify(callB);
        }
        throw new Error("Unexpected prompt");
      },
    );

    const result = await generateIdentityNarratives(
      makeProfile(),
      makeAlgo(),
      "en",
    );

    expect(result).toMatchObject({ ...callA, ...callB });
    // Soul (1) + repair (1) + legacy A (1) + legacy B (1) = 4
    expect(mockCallLLM).toHaveBeenCalledTimes(4);
  });

  it("uses field-level repair to recover when soul is missing ≤ 2 fields", async () => {
    // Soul returns 5/7. crossDimensionNarrative + growthMapInsight too short.
    const partialSoul = {
      identitySummary: narrative("identity"),
      archetypeNarrative: narrative("archetype"),
      bigFiveNarrative: narrative("big five"),
      valueNarrative: narrative("values"),
      sjtTensionNarrative: narrative("sjt"),
      crossDimensionNarrative: "x", // too short — Zod will reject
      growthMapInsight: "y", // too short
    };
    // Repair returns the two missing fields with valid lengths.
    const repaired = {
      crossDimensionNarrative: narrative("repaired cross"),
      growthMapInsight: narrative("repaired growth"),
    };

    mockCallLLM.mockImplementation(
      async (_task: string, messages: { content: string }[]) => {
        const prompt = messages[1]?.content ?? "";
        if (prompt.includes("Regenerate ONLY the following fields")) {
          return JSON.stringify(repaired);
        }
        if (prompt.includes("Write a letter about this person")) {
          return JSON.stringify(partialSoul);
        }
        throw new Error(
          "Unexpected prompt — repair should have completed the run",
        );
      },
    );

    const result = await generateIdentityNarratives(
      makeProfile(),
      makeAlgo(),
      "en",
    );

    // Result contains the soul-good 5 fields + repaired 2 fields, never
    // hits legacy A/B.
    expect(result).toMatchObject({
      identitySummary: partialSoul.identitySummary,
      archetypeNarrative: partialSoul.archetypeNarrative,
      bigFiveNarrative: partialSoul.bigFiveNarrative,
      valueNarrative: partialSoul.valueNarrative,
      sjtTensionNarrative: partialSoul.sjtTensionNarrative,
      crossDimensionNarrative: repaired.crossDimensionNarrative,
      growthMapInsight: repaired.growthMapInsight,
    });
    // Soul (1) + repair (1) = 2; legacy not invoked.
    expect(mockCallLLM).toHaveBeenCalledTimes(2);
  });

  it("skips repair and falls to legacy when ≥ 3 fields are missing", async () => {
    // Soul returns only 4/7 valid — repair cap (MAX_REPAIR_MISSING=2)
    // refuses to attempt repair, falls through directly to legacy.
    const partialSoul = {
      identitySummary: narrative("identity"),
      archetypeNarrative: narrative("archetype"),
      bigFiveNarrative: narrative("big five"),
      valueNarrative: narrative("values"),
      // sjtTensionNarrative, crossDimensionNarrative, growthMapInsight missing
    };
    const callA = {
      identitySummary: narrative("fallback identity"),
      archetypeNarrative: narrative("fallback archetype"),
      bigFiveNarrative: narrative("fallback big five"),
      valueNarrative: narrative("fallback values"),
    };
    const callB = {
      sjtTensionNarrative: narrative("fallback sjt"),
      crossDimensionNarrative: narrative("fallback cross dimension"),
      growthMapInsight: narrative("fallback growth"),
    };

    mockCallLLM.mockImplementation(
      async (_task: string, messages: { content: string }[]) => {
        const prompt = messages[1]?.content ?? "";
        if (prompt.includes("Regenerate ONLY the following fields")) {
          throw new Error(
            "Repair must NOT be called when missing > MAX_REPAIR_MISSING",
          );
        }
        if (prompt.includes("Write a letter about this person")) {
          return JSON.stringify(partialSoul);
        }
        if (prompt.includes("Return JSON with 4 fields")) {
          return JSON.stringify(callA);
        }
        if (prompt.includes("Return JSON with 3 fields")) {
          return JSON.stringify(callB);
        }
        throw new Error("Unexpected prompt");
      },
    );

    const result = await generateIdentityNarratives(
      makeProfile(),
      makeAlgo(),
      "en",
    );

    expect(result).toMatchObject({ ...callA, ...callB });
    // Soul (1) + legacy A (1) + legacy B (1) = 3. No repair call.
    expect(mockCallLLM).toHaveBeenCalledTimes(3);
  });
});
