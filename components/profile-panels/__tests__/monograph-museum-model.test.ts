import { describe, expect, it } from "vitest";
import type { PersonalProfileData } from "@/lib/types";
import { buildMonographMuseumModel } from "../monograph-museum-model";

function mockProfile(): PersonalProfileData {
  return {
    id: "profile-abc123",
    assessmentId: "assessment-xyz789",
    archetype: {
      primary: "I",
      orientation: "transcendence",
      code: "I-transcendence",
      label_en: "Researcher",
      label_zh: "科学家",
      tagline_en: "Relentless in the pursuit of truth",
      tagline_zh: "不到真相不罢休",
      confidence: 0.88,
      confidenceLevel: "high",
      isBoundary: false,
      derivedFrom: {
        primary: { dimension: "I", score: 91 },
        secondary: { dimension: "A", score: 74 },
        tertiary: { dimension: "C", score: 62 },
        gap12: 17,
        gap23: 12,
        relation: "adjacent",
      },
    },
    cognitiveStyleCode: "INTJ",
    cognitiveStyleDisplayMode: "normal",
    cognitiveStyleConfidence: 0.72,
    collabMapping: {
      primary: "C",
      secondary: "S",
      scores: { D: 12, I: 18, S: 28, C: 42 },
      cssGradient: "",
      derivedFrom: "big_five_mapping",
      approximationNote_en: "",
      approximationNote_zh: "",
      confidence: 0.73,
    },
    schwartzAnchors: {
      ranking: [
        "universalism",
        "self-direction",
        "benevolence",
        "stimulation",
        "achievement",
        "security",
        "conformity",
        "tradition",
        "power",
        "hedonism",
      ],
      top3: ["universalism", "self-direction", "benevolence"],
      scores: {
        achievement: 2,
        power: 1,
        stimulation: 4,
        "self-direction": 5,
        hedonism: 2,
        benevolence: 5,
        universalism: 6,
        conformity: 2,
        tradition: 2,
        security: 3,
      },
      conflictPair: null,
      conflictStatus: null,
      confidence: 0.64,
    },
    crossCultural: { type: null, label_zh: null },
    confidenceMap: {},
    narrativeSnapshots: {
      coreInsight:
        "You turn uncertainty into a question clear enough to pursue.",
      identitySummary:
        "You are most alive when a hidden pattern becomes legible.",
      archetypeNarrative:
        "You search until the work has a true center. Noise loses power when you can name the pattern.",
      bigFiveNarrative:
        "Your attention favors depth over display. You need enough solitude to hear the signal.",
      valueNarrative:
        "You care about truth that serves more than personal advantage. Meaning arrives when discovery becomes useful.",
    },
  } as PersonalProfileData;
}

describe("buildMonographMuseumModel", () => {
  it("distills profile data into the selected Monograph Museum hero model", () => {
    const model = buildMonographMuseumModel({
      profile: mockProfile(),
      locale: "en",
      mintedDate: "June 12, 2026",
      evidenceBandLabels: {
        pattern: "Core Pattern",
        style: "Working Style",
        values: "Value Anchors",
      },
    });

    expect(model.archetypeName).toBe("Researcher");
    expect(model.quote).toBe(
      "You turn uncertainty into a question clear enough to pursue.",
    );
    expect(model.anchors).toEqual(["Analytical", "Universalism", "Refining"]);
    expect(model.meta).toEqual({
      impression: "profile-abc123",
      minted: "June 12, 2026",
    });
    // Evidence bands are a pure numeric confidence signature on the cover —
    // no prose. The full narrative for each axis lives once in Chapter 01.
    expect(model.evidenceBands).toEqual([
      { id: "pattern", label: "Core Pattern", value: 88 },
      { id: "style", label: "Working Style", value: 73 },
      { id: "values", label: "Value Anchors", value: 64 },
    ]);
  });
});
