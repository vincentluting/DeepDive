import { describe, expect, it } from "vitest";

import {
  buildReportDossierCoverModel,
  type ReportDossierSource,
} from "../report-dossier-cover-model";

const DICT = {
  cinematicTitle: "A clearer map of your becoming.",
  cinematicSubtitle:
    "A restrained view of the paths where your pattern, market reality, and next experiments overlap.",
  cinematicLeadLabel: "Primary signal",
  cinematicDirections: "Directions",
  cinematicFit: "Fit",
  cinematicMatch: "Match",
  cinematicReality: "Reality",
  cinematicEvidence: "Evidence",
  cinematicDrains: "Drains",
  cinematicExperiments: "Experiments",
  cinematicConfidence: "Confidence",
  interestFit: "Interest",
  valueFit: "Values",
  personalityFit: "Personality",
  cinematicProofPrivate: "Private to you",
  cinematicProofEvidence: "Evidence-based",
  cinematicProofProduct: "Product, not play",
};

const SOURCE: ReportDossierSource = {
  header: {
    archetype: {
      label_en: "Pattern Alchemist",
      label_zh: "模式炼金师",
      tagline_en: "Turns complexity into usable direction",
      tagline_zh: "把复杂变成可用方向",
    },
  },
  careerMatch: {
    directions: [
      {
        rank: 1,
        title_en: "Product Strategy Research",
        title_zh: "产品策略研究",
        matchScore: 91,
        whySuitable:
          "This direction uses your pattern recognition and communication strengths.",
        challenges:
          "Repetitive stakeholder reporting without decision ownership can drain energy.",
        explorationNote: "Interview two research-led product strategists.",
        matchBreakdown: {
          interestFit: 94,
          valueFit: 88,
          personalityFit: 84,
          adaptabilityFit: 78,
          industryFit: 76,
        },
        actionableInsights: {
          thirtyDayChallenge: {
            challenge_en: "Shadow one strategy research workflow.",
            challenge_zh: "旁听一次策略研究工作流。",
          },
        },
      },
    ],
    exploratoryDirections: [
      {
        rank: 4,
        title_en: "Research Operations",
        title_zh: "研究运营",
        matchScore: 74,
        whySuitable: "It gives your systems thinking a clear operating lane.",
        challenges: "It may become too procedural if discovery is absent.",
        explorationNote:
          "Compare one research ops role with one strategist role.",
        matchBreakdown: {
          interestFit: 75,
          valueFit: 72,
          personalityFit: 70,
          adaptabilityFit: 78,
        },
      },
    ],
  },
  careerPathway: {
    jobDirections: [
      { title_en: "UX Researcher", title_zh: "用户研究员", matchScore: 89 },
      {
        title_en: "Product Strategy Associate",
        title_zh: "产品策略助理",
        matchScore: 84,
      },
    ],
    actionPlan: {
      week1: {
        tasks: [
          {
            description: "Talk to one researcher.",
            relatedDirection: 1,
            difficulty: "easy",
            isCompleted: false,
          },
        ],
      },
    },
  },
  careerDrainWarning: {
    redFlagEnvironments: [
      { signal_en: "Output without decisions", signal_zh: "只产出不决策" },
    ],
  },
  integration: {
    coreInsight:
      "You create clarity by turning loose signals into decisions people can trust.",
  },
  meta: {
    realConditionsProvided: true,
    qualityScore: 0.82,
  },
};

describe("buildReportDossierCoverModel", () => {
  it("distills a report into an editorial cover model", () => {
    const model = buildReportDossierCoverModel(SOURCE, "en", DICT);

    expect(model.title).toBe("A clearer map of your becoming.");
    expect(model.archetypeLabel).toBe("Pattern Alchemist");
    expect(model.primaryDirection.title).toBe("Product Strategy Research");
    expect(model.primaryDirection.match).toBe(91);
    // Top-directions leaderboard — primary + exploratory, capped at 3.
    expect(model.topDirections).toEqual([
      { rank: 1, title: "Product Strategy Research", match: 91 },
      { rank: 4, title: "Research Operations", match: 74 },
    ]);
    // Metrics now carry the top direction's three fit pillars, not the old
    // industry "Reality" + LLM quality "Evidence" vanity pair.
    expect(model.metrics).toEqual([
      { label: "Interest", value: 94 },
      { label: "Values", value: 88 },
      { label: "Personality", value: 84 },
    ]);
    expect(model.sections.map((section) => section.label)).toEqual([
      "Evidence",
      "Drains",
      "Experiments",
    ]);
    expect(model.proofPoints).toEqual([
      "Private to you",
      "Evidence-based",
      "Product, not play",
    ]);
  });

  it("localizes core labels and direction titles", () => {
    const model = buildReportDossierCoverModel(SOURCE, "zh", DICT);

    expect(model.archetypeLabel).toBe("模式炼金师");
    expect(model.primaryDirection.title).toBe("产品策略研究");
    expect(model.sections[0].body).toContain("pattern recognition");
  });

  it("falls back to a single honest match metric when fit breakdown is absent", () => {
    // Historical reports may lack matchBreakdown entirely — must not render 0%
    // interest/value/personality pillars.
    const legacy: ReportDossierSource = {
      ...SOURCE,
      careerMatch: {
        directions: [
          {
            rank: 1,
            title_en: "Legacy Direction",
            title_zh: "历史方向",
            matchScore: 88,
            // matchBreakdown intentionally cast away to mimic legacy data
          } as unknown as ReportDossierSource["careerMatch"]["directions"][number],
        ],
      },
    };
    const model = buildReportDossierCoverModel(legacy, "en", DICT);
    expect(model.metrics).toEqual([{ label: "Match", value: 88 }]);
  });

  it("caps section bodies at two sentences for space-free Chinese text", () => {
    const cjk: ReportDossierSource = {
      ...SOURCE,
      careerMatch: {
        directions: [
          {
            ...SOURCE.careerMatch.directions[0],
            whySuitable: "第一句话。第二句话。第三句话。",
          },
        ],
      },
    };
    const model = buildReportDossierCoverModel(cjk, "zh", DICT);
    expect(model.sections[0].body).toBe("第一句话。第二句话。");
  });
});
