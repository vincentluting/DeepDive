import { describe, expect, it } from "vitest";
import type { PersonalProfileData } from "@/lib/types";
import {
  buildCinematicProfileModel,
  buildProfileDepthStations,
} from "../cinematic-profile-model";

function mockProfile(): PersonalProfileData {
  return {
    id: "profile-cinema-123",
    assessmentId: "assessment-cinema-456",
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

describe("buildProfileDepthStations", () => {
  it("returns the cinematic descent stations in scroll order", () => {
    expect(buildProfileDepthStations()).toEqual([
      {
        id: "surface",
        anchorId: "profile-cinematic-hero",
        depthMeters: 0,
        depth: "0m",
        label: "Surface",
      },
      {
        id: "identity",
        anchorId: "ch-portrait",
        depthMeters: 120,
        depth: "120m",
        label: "Identity",
      },
      {
        id: "inner-landscape",
        anchorId: "ch-inner-landscape",
        depthMeters: 260,
        depth: "260m",
        label: "Inner Landscape",
      },
      {
        id: "meaning",
        anchorId: "ch-meaning",
        depthMeters: 420,
        depth: "420m",
        label: "Meaning",
      },
      {
        id: "tensions",
        anchorId: "ch-tensions",
        depthMeters: 620,
        depth: "620m",
        label: "Tensions",
      },
      {
        id: "report-threshold",
        anchorId: "profile-report-cta",
        depthMeters: 800,
        depth: "800m",
        label: "Report Threshold",
      },
    ]);
  });

  it("allows localized station labels without changing anchors or depths", () => {
    const stations = buildProfileDepthStations({
      surface: "海面",
      identity: "身份",
      "inner-landscape": "内在景观",
      meaning: "意义",
      tensions: "张力",
      "report-threshold": "报告阈值",
    });

    expect(stations.map((station) => station.label)).toEqual([
      "海面",
      "身份",
      "内在景观",
      "意义",
      "张力",
      "报告阈值",
    ]);
    expect(stations.map((station) => station.depth)).toEqual([
      "0m",
      "120m",
      "260m",
      "420m",
      "620m",
      "800m",
    ]);
  });
});

describe("buildCinematicProfileModel", () => {
  it("distills profile data into a cinematic monograph model", () => {
    const model = buildCinematicProfileModel({
      profile: mockProfile(),
      locale: "en",
      mintedDate: "June 17, 2026",
      depthLabels: {
        surface: "Surface",
        identity: "Identity",
        "inner-landscape": "Inner Landscape",
        meaning: "Meaning",
        tensions: "Tensions",
        "report-threshold": "Report Threshold",
      },
      evidenceBandLabels: {
        pattern: "Core Pattern",
        style: "Working Style",
        values: "Value Anchors",
      },
    });

    expect(model.archetypeName).toBe("Researcher");
    expect(model.heroQuote).toBe(
      "You turn uncertainty into a question clear enough to pursue.",
    );
    expect(model.anchors).toEqual(["Analytical", "Universalism", "Refining"]);
    expect(model.depthStations.map((station) => station.id)).toEqual([
      "surface",
      "identity",
      "inner-landscape",
      "meaning",
      "tensions",
      "report-threshold",
    ]);
    // Evidence bands carry only the numeric confidence reading now (no prose);
    // they inherit the monograph cover's pure-data signature.
    expect(model.evidenceBands).toEqual([
      { id: "pattern", label: "Core Pattern", value: 88 },
      { id: "style", label: "Working Style", value: 73 },
      { id: "values", label: "Value Anchors", value: 64 },
    ]);
  });
});
