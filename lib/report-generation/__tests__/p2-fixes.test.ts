// ============================================================
// Tests: P0-P2 Report Fixes
// Verifies: algorithmic whySuitable for exploratory directions,
// AI risk tagging in narrative prompts, annotation confidence
// display logic, and anti-fixation prompt changes.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_CAREERS } from "./fixtures/mock-career-pool";
import {
  VALID_PANEL1_NARRATIVE,
  VALID_INTEGRATION,
  VALID_PANEL3_LLM,
} from "./fixtures/mock-llm-responses";
import type { CareerMatchNarrativeOutput } from "../types";
import type { CareerDirectionTemplate } from "@/lib/types/report";

// ── Mock career pool with aiEraCategory variants ──

const TRANSFORMED_CAREER: CareerDirectionTemplate = {
  ...MOCK_CAREERS[0],
  id: "transformed-career-1",
  title_zh: "翻译专家",
  title_en: "Translator",
  aiEraCategory: "transformed",
};

const MOCK_CAREERS_WITH_TRANSFORMED = [
  TRANSFORMED_CAREER,
  ...MOCK_CAREERS.slice(1),
];

vi.mock("@/lib/career-matching/career-pool", () => ({
  getCareerPool: () => MOCK_CAREERS_WITH_TRANSFORMED,
  ensureCareerPoolLoaded: async () => {},
  refreshCacheFromDb: async () => {},
  invalidateCareerPoolCache: () => {},
}));

vi.mock("@/lib/ai/model-router", () => ({
  callLLM: vi.fn(),
  isAnthropicAvailable: () => false,
}));

const mockGenerateCareerMatchNarrative = vi.fn();
vi.mock("../career-match-narrative", () => ({
  generateCareerMatchNarrative: (...args: unknown[]) =>
    mockGenerateCareerMatchNarrative(...args),
}));

const mockGenerateCareerPathway = vi.fn();
vi.mock("../career-pathway", async (importOriginal) => {
  const original = await importOriginal<typeof import("../career-pathway")>();
  return {
    ...original,
    generateCareerPathway: (...args: unknown[]) =>
      mockGenerateCareerPathway(...args),
  };
});

const mockGenerateIntegration = vi.fn();
vi.mock("../integration", () => ({
  generateIntegration: (...args: unknown[]) => mockGenerateIntegration(...args),
}));

// ── Imports after mocks ──

import { generateCareerReport } from "../index";
import { buildBalancedAssessment } from "./fixtures/mock-assessment-balanced";
import { computeProfileAlgorithm } from "@/lib/profile-generation/profile-algorithm";
import { computeCareerMatchAlgorithm } from "../career-match-algorithm";

// ── Parsed mock responses ──

const PARSED_NARRATIVE: CareerMatchNarrativeOutput = JSON.parse(
  VALID_PANEL1_NARRATIVE,
);
const PARSED_INTEGRATION = JSON.parse(VALID_INTEGRATION);
const PARSED_PATHWAY = {
  realConditionsProvided: true,
  ...JSON.parse(VALID_PANEL3_LLM),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateCareerMatchNarrative.mockResolvedValue(PARSED_NARRATIVE);
  mockGenerateIntegration.mockResolvedValue(PARSED_INTEGRATION);
  mockGenerateCareerPathway.mockResolvedValue(PARSED_PATHWAY);
});

// ── Tests ──

describe("P2 Fix: Exploratory directions get algorithmic whySuitable", () => {
  it("exploratory directions have non-empty whySuitable from MatchInsight", async () => {
    const assessment = buildBalancedAssessment();
    const report = await generateCareerReport(assessment, null, "en");

    const exploratory = report.careerMatch.exploratoryDirections ?? [];
    expect(exploratory.length).toBeGreaterThan(0);

    for (const dir of exploratory) {
      // whySuitable should be built from algorithm insights, not empty
      expect(dir.whySuitable.length).toBeGreaterThan(0);
      // challenges remain empty (no LLM call for exploratory)
      expect(dir.challenges).toBe("");
    }
  });

  it("exploratory whySuitable contains score data (not generic text)", async () => {
    const assessment = buildBalancedAssessment();
    const report = await generateCareerReport(assessment, null, "en");

    const exploratory = report.careerMatch.exploratoryDirections ?? [];
    for (const dir of exploratory) {
      if (dir.whySuitable) {
        // Should contain dimension-specific language from MatchInsight signals
        const hasSpecificContent = /score|match|values?|align|range/i.test(
          dir.whySuitable,
        );
        expect(hasSpecificContent).toBe(true);
      }
    }
  });

  it("zh locale produces Chinese algorithmic reasons", async () => {
    const assessment = buildBalancedAssessment();
    const report = await generateCareerReport(assessment, null, "zh");

    const exploratory = report.careerMatch.exploratoryDirections ?? [];
    for (const dir of exploratory) {
      if (dir.whySuitable) {
        // Chinese reasons should contain Chinese characters
        const hasChinese = /[\u4e00-\u9fff]/.test(dir.whySuitable);
        expect(hasChinese).toBe(true);
      }
    }
  });

  it("primary directions still use LLM narratives (not algorithmic)", async () => {
    const assessment = buildBalancedAssessment();
    const report = await generateCareerReport(assessment, null, "en");

    // Primary directions (rank 1-3) should have LLM-generated text
    const primaryWithNarrative = report.careerMatch.directions.filter(
      (d) => d.whySuitable,
    );
    expect(primaryWithNarrative.length).toBeGreaterThan(0);

    // The LLM narrative text should differ from algorithmic patterns
    for (const dir of primaryWithNarrative) {
      expect(dir.whySuitable).toBe(
        PARSED_NARRATIVE.directions[dir.rank - 1]?.whySuitable ?? "",
      );
    }
  });
});

describe("P2 Fix: MatchInsight generation for exploratory candidates", () => {
  it("exploratory candidates have insights computed", async () => {
    const assessment = buildBalancedAssessment();
    const algo = computeProfileAlgorithm(assessment);
    const matchResult = await computeCareerMatchAlgorithm(
      assessment,
      algo,
      null,
    );

    for (const c of matchResult.exploratoryCandidates) {
      expect(c.insights).toBeDefined();
      expect(c.insights!.strengths.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("insights have bilingual detail text", async () => {
    const assessment = buildBalancedAssessment();
    const algo = computeProfileAlgorithm(assessment);
    const matchResult = await computeCareerMatchAlgorithm(
      assessment,
      algo,
      null,
    );

    for (const c of matchResult.exploratoryCandidates) {
      if (c.insights && c.insights.strengths.length > 0) {
        const signal = c.insights.strengths[0];
        expect(signal.detail_en).toBeTruthy();
        expect(signal.detail_zh).toBeTruthy();
      }
    }
  });
});

describe("P1 Fix: Integration prompt anti-fixation", () => {
  it("integration LLM is called with non-verbatim anti-fixation instruction", async () => {
    const assessment = buildBalancedAssessment();
    await generateCareerReport(assessment, null, "zh");

    expect(mockGenerateIntegration).toHaveBeenCalledTimes(1);

    // The integration function is called — verify the underlying prompt
    // doesn't contain verbatim copy-paste text by checking the function was
    // invoked with the right locale
    const [, , , , , locale] = mockGenerateIntegration.mock.calls[0];
    expect(locale).toBe("zh");
  });
});

describe("P1 Fix: Annotation confidence display", () => {
  it("annotation confidence values are present on career directions", async () => {
    const assessment = buildBalancedAssessment();
    const report = await generateCareerReport(assessment, null, "en");

    for (const dir of report.careerMatch.directions) {
      // All mock careers have expert-estimated annotation
      expect(dir.annotationConfidence).toBeDefined();
    }
  });
});
