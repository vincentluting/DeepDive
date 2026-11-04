import { describe, expect, it } from "vitest";

import { getCanonicalRiasec } from "@/lib/db/riasec-canonical";

describe("getCanonicalRiasec", () => {
  it("uses legacy archetypeCode orientation instead of defaulting to enhancement", () => {
    const canonical = getCanonicalRiasec({
      archetypeCode: "A-transcendence",
      scoresJson: { R: 0, I: 60, A: 80, S: 75, E: 70, C: 20 },
      resultDataJson: {
        labelData: {
          code: "A-transcendence",
          label_zh: "追梦人",
          label_en: "Dreamweaver",
        },
      },
      exploreMode: "classic",
    });

    expect(canonical.fromStored).toBe(false);
    expect(canonical.riasecNormalized.A).toBe(80);
    expect(canonical.riasecNormalized.S).toBe(75);
    expect(canonical.archetype.code).toBe("A-transcendence");
    expect(canonical.archetype.label_zh).toBe("追梦人");
  });

  it("still normalizes raw legacy scores when they are not already scaled", () => {
    const canonical = getCanonicalRiasec({
      archetypeCode: "A-transcendence",
      scoresJson: { R: 0, I: 12, A: 16, S: 15, E: 14, C: 4 },
      resultDataJson: null,
      exploreMode: "classic",
    });

    expect(canonical.riasecNormalized.A).toBe(80);
    expect(canonical.riasecNormalized.S).toBe(75);
    expect(canonical.archetype.code).toBe("A-transcendence");
  });

  it("keeps stored computed RIASEC as the highest-priority source", () => {
    const canonical = getCanonicalRiasec({
      archetypeCode: "A-transcendence",
      scoresJson: { R: 0, I: 12, A: 16, S: 15, E: 14, C: 4 },
      resultDataJson: {
        computedRiasec: {
          riasecNormalized: { R: 100, I: 0, A: 0, S: 0, E: 0, C: 0 },
          rawScoreMax: 20,
          computedAt: "2026-05-09T00:00:00.000Z",
          archetype: {
            primary: "R",
            orientation: "enhancement",
            code: "R-enhancement",
            label_zh: "工程专家",
            label_en: "Architect",
            tagline_zh: "用极致工艺赢得竞争优势",
            tagline_en: "Winning through engineering excellence",
            confidence: 0.85,
            confidenceLevel: "high",
            isBoundary: false,
            derivedFrom: {
              primary: { dimension: "R", score: 100 },
              secondary: { dimension: "I", score: 0 },
              tertiary: { dimension: "A", score: 0 },
              gap12: 100,
              gap23: 0,
              relation: "adjacent",
            },
          },
        },
      },
      exploreMode: "classic",
    });

    expect(canonical.fromStored).toBe(true);
    expect(canonical.archetype.code).toBe("R-enhancement");
    expect(canonical.riasecNormalized.R).toBe(100);
  });
});
