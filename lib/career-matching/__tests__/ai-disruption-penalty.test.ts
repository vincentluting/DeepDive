// ============================================================
// Tests: AI Disruption Penalty — 'transformed' careers get -10
// Verifies that careers facing high AI replacement risk are
// scored lower in the exploration engine.
// ============================================================

import { describe, it, expect, vi } from "vitest";
import type { CareerDirectionTemplate } from "@/lib/types/report";
import { WEIGHT_PRESETS } from "../weights";

// Build a minimal career pool with explicit aiEraCategory values
const BASE_CAREER: Omit<
  CareerDirectionTemplate,
  "id" | "title_zh" | "title_en" | "aiEraCategory"
> = {
  subtitle_zh: "测试",
  idealRIASEC: { R: 50, I: 60, A: 40, S: 50, E: 45, C: 55 },
  alignedValues: ["achievement", "self-direction"],
  idealBigFive: { openness: { min: 40, max: 80 } },
  industries: ["tech"],
  crossCulturalFit: ["bridge"] as CareerDirectionTemplate["crossCulturalFit"],
  seniorityRange: { minYears: 0, maxYears: 20 },
  tags: ["test"],
  annotationSource: "expert-heuristic" as const,
  annotationConfidence: "expert-estimated" as const,
  lastReviewedAt: "2026-01-01",
};

// Two identical careers — one stable, one transformed
const STABLE_CAREER: CareerDirectionTemplate = {
  ...BASE_CAREER,
  id: "career-stable",
  title_zh: "稳定型职业",
  title_en: "Stable Career",
  aiEraCategory: "stable",
};

const TRANSFORMED_CAREER: CareerDirectionTemplate = {
  ...BASE_CAREER,
  id: "career-transformed",
  title_zh: "翻译专家",
  title_en: "Translator",
  aiEraCategory: "transformed",
};

const AUGMENTED_CAREER: CareerDirectionTemplate = {
  ...BASE_CAREER,
  id: "career-augmented",
  title_zh: "数据分析师",
  title_en: "Data Analyst",
  aiEraCategory: "augmented",
};

const NO_CATEGORY_CAREER: CareerDirectionTemplate = {
  ...BASE_CAREER,
  id: "career-no-category",
  title_zh: "未分类职业",
  title_en: "Uncategorized Career",
  // aiEraCategory intentionally omitted (undefined)
};

// Pad with 16 additional careers to meet the minimum pool size (20 total)
const FILLER_CAREERS: CareerDirectionTemplate[] = Array.from(
  { length: 16 },
  (_, i) => ({
    ...BASE_CAREER,
    id: `filler-career-${i + 1}`,
    title_zh: `填充职业${i + 1}`,
    title_en: `Filler Career ${i + 1}`,
    idealRIASEC: {
      R: (i * 13) % 100,
      I: (i * 19) % 100,
      A: (i * 29) % 100,
      S: (i * 31) % 100,
      E: (i * 37) % 100,
      C: (i * 41) % 100,
    },
  }),
);

const TEST_POOL = [
  STABLE_CAREER,
  TRANSFORMED_CAREER,
  AUGMENTED_CAREER,
  NO_CATEGORY_CAREER,
  ...FILLER_CAREERS,
];

vi.mock("@/lib/career-matching/career-pool", () => ({
  getCareerPool: () => TEST_POOL,
  ensureCareerPoolLoaded: async () => {},
}));

// Import after mock
import { explore } from "../engine";
import type { UserProfile } from "../types";

const BALANCED_PROFILE: UserProfile = {
  riasec: { R: 50, I: 60, A: 40, S: 50, E: 45, C: 55 },
  bigFive: {
    openness: 60,
    conscientiousness: 55,
    extraversion: 50,
    agreeableness: 55,
    neuroticism: 45,
  },
  schwartz: {
    top3: ["self-direction", "achievement", "benevolence"],
    centered: {
      "self-direction": 1.2,
      achievement: 0.8,
      benevolence: 0.5,
      stimulation: 0.3,
      hedonism: 0.1,
      universalism: -0.1,
      conformity: -0.3,
      tradition: -0.5,
      security: -0.8,
      power: -1.2,
    },
  },
};

describe("AI Disruption Penalty", () => {
  it("transformed career scores lower than stable career", async () => {
    const result = await explore(BALANCED_PROFILE, { count: 20 });

    const stable = result.allScored.find((c) => c.id === "career-stable");
    const transformed = result.allScored.find(
      (c) => c.id === "career-transformed",
    );

    expect(stable).toBeDefined();
    expect(transformed).toBeDefined();

    // Transformed gets -10 flat penalty on top of adaptabilityFit difference
    expect(transformed!.totalScore).toBeLessThan(stable!.totalScore);
  });

  it("augmented career receives no flat penalty", async () => {
    const result = await explore(BALANCED_PROFILE, { count: 20 });

    const augmented = result.allScored.find((c) => c.id === "career-augmented");
    expect(augmented).toBeDefined();

    // Verify score equals weighted base (no flat penalty applied)
    const factors = augmented!.factors;
    const w = WEIGHT_PRESETS.full;
    const expectedBase = Math.round(
      factors.interestFit.score * w.interestFit +
        factors.personalityFit.score * w.personalityFit +
        factors.valueFit.score * w.valueFit +
        factors.adaptabilityFit.score * w.adaptabilityFit +
        factors.collabFit.score * w.collabFit +
        factors.industryFit.score * w.industryFit,
    );
    expect(augmented!.totalScore).toBe(expectedBase);
  });

  it("career without aiEraCategory receives no flat penalty", async () => {
    const result = await explore(BALANCED_PROFILE, { count: 20 });

    const noCategory = result.allScored.find(
      (c) => c.id === "career-no-category",
    );
    expect(noCategory).toBeDefined();

    // Verify score equals weighted base (no flat penalty)
    const factors = noCategory!.factors;
    const w = WEIGHT_PRESETS.full;
    const expectedBase = Math.round(
      factors.interestFit.score * w.interestFit +
        factors.personalityFit.score * w.personalityFit +
        factors.valueFit.score * w.valueFit +
        factors.adaptabilityFit.score * w.adaptabilityFit +
        factors.collabFit.score * w.collabFit +
        factors.industryFit.score * w.industryFit,
    );
    expect(noCategory!.totalScore).toBe(expectedBase);
  });

  it("transformed career ranks lower due to penalty", async () => {
    const result = await explore(BALANCED_PROFILE, { count: 20 });

    const stableIdx = result.allScored.findIndex(
      (c) => c.id === "career-stable",
    );
    const transformedIdx = result.allScored.findIndex(
      (c) => c.id === "career-transformed",
    );

    // allScored is sorted descending by totalScore
    expect(transformedIdx).toBeGreaterThan(stableIdx);
  });

  it("penalty does not push score below 0", async () => {
    const result = await explore(BALANCED_PROFILE, { count: 20 });

    for (const career of result.allScored) {
      expect(career.totalScore).toBeGreaterThanOrEqual(0);
      expect(career.totalScore).toBeLessThanOrEqual(100);
    }
  });
});
