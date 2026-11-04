import { describe, expect, it } from "vitest";

import {
  buildInterestFieldAxes,
  buildQuickReportDossierModel,
} from "../quick-report-dossier-model";
import type { QuickDiveResultData } from "../quickdive-data";

const RESULT: QuickDiveResultData = {
  code: "IA",
  label: {
    code: "IA",
    label_en: "Investigative Creator",
    label_zh: "探索型创造者",
    tagline_en: "Finds patterns and gives them form",
    tagline_zh: "发现模式，并赋予形式",
    colorHex: "#0B5F91",
  },
  sortedScores: [
    ["R", 18],
    ["I", 16],
    ["C", 14],
    ["A", 12],
    ["S", 9],
    ["E", 7],
  ],
  topCareers: [
    { id: "ux-researcher", name: "UX Researcher", pct: 91 },
    { id: "data-journalist", name: "Data Journalist", pct: 86 },
  ],
  fitCareers: [{ id: "service-designer", name: "Service Designer", pct: 82 }],
  drainCareers: [{ id: "sales-rep", name: "Sales Representative", pct: 64 }],
  confidenceTier: "HC",
};

const DICT = {
  title: "Quick Dive Report",
  generatedAt: "Generated on",
  highConfidencePrefix: "Across your choices, a clear pattern emerged — ",
  medConfidencePrefix: "Your choices reveal a lean — ",
  lowConfidenceTitle: "Signal unclear",
  lowConfidenceBody: "Treat this as a starting point.",
  bestFit: "Best Fit Careers",
  energyDrain: "Energy Drain",
  deepDiveCta: "Want a deeper look?",
};

describe("buildInterestFieldAxes", () => {
  it("maps six RIASEC scores into four quiet editorial axes", () => {
    expect(buildInterestFieldAxes(RESULT.sortedScores)).toEqual([
      { id: "build", label: "Build", value: 80 },
      { id: "guide", label: "Guide", value: 40 },
      { id: "analyze", label: "Analyze", value: 75 },
      { id: "create", label: "Create", value: 70 },
    ]);
  });
});

describe("buildQuickReportDossierModel", () => {
  it("distills Quick Dive result data into a first-signal report model", () => {
    const model = buildQuickReportDossierModel({
      result: RESULT,
      locale: "en",
      createdAt: "2026-06-25T08:00:00.000Z",
      dict: DICT,
    });

    expect(model.title).toBe("Quick Dive Report");
    expect(model.identityLabel).toBe("Investigative Creator");
    expect(model.summary).toContain("clear pattern emerged");
    expect(model.topSignals).toEqual([
      { label: "UX Researcher", value: 91 },
      { label: "Data Journalist", value: 86 },
      { label: "Service Designer", value: 82 },
    ]);
    expect(model.drainSignals).toEqual([
      { label: "Sales Representative", value: 64 },
    ]);
  });

  it("uses localized identity labels when requested", () => {
    const model = buildQuickReportDossierModel({
      result: RESULT,
      locale: "zh",
      createdAt: "2026-06-25T08:00:00.000Z",
      dict: DICT,
    });

    expect(model.identityLabel).toBe("探索型创造者");
  });
});
