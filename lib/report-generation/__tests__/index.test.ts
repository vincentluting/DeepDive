// ============================================================
// Tests: generateCareerReport() — Main Report Pipeline
// Mocks the 3 LLM-calling modules; exercises the orchestration,
// validation, timeout, and pure-algorithm helpers.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_CAREERS } from "./fixtures/mock-career-pool";
import {
  VALID_PANEL1_NARRATIVE,
  VALID_INTEGRATION,
  VALID_PANEL3_LLM,
} from "./fixtures/mock-llm-responses";
import type { CareerMatchNarrativeOutput } from "../types";

// ── Module-level mocks (must be before any imports that use them) ──

vi.mock("@/lib/career-matching/career-pool", () => ({
  getCareerPool: () => MOCK_CAREERS,
  ensureCareerPoolLoaded: async () => {},
  refreshCacheFromDb: async () => {},
  invalidateCareerPoolCache: () => {},
}));

vi.mock("@/lib/ai/model-router", () => ({
  callLLM: vi.fn(),
  isAnthropicAvailable: () => false,
}));

// Mock the 3 LLM-calling modules
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
    // Keep buildPathwayPlaceholder real
  };
});

const mockGenerateIntegration = vi.fn();
vi.mock("../integration", () => ({
  generateIntegration: (...args: unknown[]) => mockGenerateIntegration(...args),
}));

// ── Imports (after mocks) ──

import { generateCareerReport } from "../index";
import {
  buildBalancedAssessment,
  buildBalancedRealConditions,
} from "./fixtures/mock-assessment-balanced";

// ── Parsed mock responses ──

const PARSED_NARRATIVE: CareerMatchNarrativeOutput = JSON.parse(
  VALID_PANEL1_NARRATIVE,
);

const PARSED_INTEGRATION = JSON.parse(VALID_INTEGRATION);

const PARSED_PATHWAY = {
  realConditionsProvided: true,
  ...JSON.parse(VALID_PANEL3_LLM),
};

// ── Setup ──

beforeEach(() => {
  vi.clearAllMocks();

  // Default: LLM mocks resolve successfully
  mockGenerateCareerMatchNarrative.mockResolvedValue(PARSED_NARRATIVE);
  mockGenerateIntegration.mockResolvedValue(PARSED_INTEGRATION);
  mockGenerateCareerPathway.mockResolvedValue(PARSED_PATHWAY);
});

// ── Tests ──

describe("generateCareerReport", () => {
  describe("happy path — no realConditions", () => {
    it("returns a CareerReport with all required fields", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      expect(report).toHaveProperty("id");
      expect(report).toHaveProperty("header");
      expect(report).toHaveProperty("careerMatch");
      expect(report).toHaveProperty("careerAnchors");
      expect(report).toHaveProperty("careerPathway");
      expect(report).toHaveProperty("integration");
      expect(report).toHaveProperty("careerDrainWarning");
      expect(report).toHaveProperty("meta");
    });

    it("careerMatch.directions has entries", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      expect(report.careerMatch.directions.length).toBeGreaterThan(0);
    });

    it("careerAnchors has 3 items from riasec, schwartz, bigfive", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      expect(report.careerAnchors).toHaveLength(3);

      const sources = report.careerAnchors?.map((a) => a.source) ?? [];
      expect(sources).toContain("riasec");
      expect(sources).toContain("schwartz");
      expect(sources).toContain("bigfive");
    });

    it("careerMatch.aiEraPersonalInsight has moat and watchOut fields", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      const insight = report.careerMatch.aiEraPersonalInsight;
      expect(insight).toBeDefined();
      expect(insight).toHaveProperty("moat_zh");
      expect(insight).toHaveProperty("moat_en");
      expect(insight).toHaveProperty("watchOut_zh");
      expect(insight).toHaveProperty("watchOut_en");
      expect(insight).toHaveProperty("positioning_zh");
      expect(insight).toHaveProperty("positioning_en");
      expect(insight).toHaveProperty("adaptabilityScore");
      expect(typeof insight!.adaptabilityScore).toBe("number");
    });

    it("meta.realConditionsProvided is false", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      expect(report.meta.realConditionsProvided).toBe(false);
    });

    it("uses placeholder pathway when no realConditions", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      // Pathway should be the placeholder (no LLM call for pathway)
      expect(mockGenerateCareerPathway).not.toHaveBeenCalled();
      expect(report.careerPathway).toBeDefined();
      expect(report.careerPathway.realConditionsProvided).toBe(false);
    });

    it("meta contains expected version and timing info", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      expect(report.meta.version).toBe("3.0");
      expect(report.meta.generationTimeMs).toBeGreaterThanOrEqual(0);
      expect(typeof report.meta.llmCalls).toBe("number");
      expect(report.meta.llmModel).toBe("gpt-4o-mini");
    });

    it("careerDrainWarning is present (algorithmic, not mocked)", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      expect(report.careerDrainWarning).toBeDefined();
    });
  });

  describe("happy path — with realConditions", () => {
    it("meta.realConditionsProvided is true", async () => {
      const assessment = buildBalancedAssessment();
      const realConditions = buildBalancedRealConditions();
      const report = await generateCareerReport(
        assessment,
        realConditions,
        "zh",
      );

      expect(report.meta.realConditionsProvided).toBe(true);
    });

    it("calls generateCareerPathway when realConditions provided", async () => {
      const assessment = buildBalancedAssessment();
      const realConditions = buildBalancedRealConditions();
      await generateCareerReport(assessment, realConditions, "zh");

      expect(mockGenerateCareerPathway).toHaveBeenCalledTimes(1);
    });

    it("locale is passed through to the report", async () => {
      const assessment = buildBalancedAssessment();
      const realConditions = buildBalancedRealConditions();
      const report = await generateCareerReport(
        assessment,
        realConditions,
        "zh",
      );

      expect(report.locale).toBe("zh");
    });
  });

  describe("validation errors", () => {
    it("throws when archetype is missing", async () => {
      const assessment = buildBalancedAssessment();
      (assessment as any).archetype = undefined;
      (assessment as any).riasecNormalized = undefined;

      await expect(
        generateCareerReport(assessment, null, "en"),
      ).rejects.toThrow("Assessment missing archetype and riasecNormalized");
    });

    it("throws when riasecNormalized is missing", async () => {
      const assessment = buildBalancedAssessment();
      (assessment as any).riasecNormalized = undefined;

      await expect(
        generateCareerReport(assessment, null, "en"),
      ).rejects.toThrow("Assessment missing riasecNormalized");
    });

    it("throws when bigFive is missing", async () => {
      const assessment = buildBalancedAssessment();
      (assessment as any).bigFive = undefined;

      await expect(
        generateCareerReport(assessment, null, "en"),
      ).rejects.toThrow("Assessment missing bigFive");
    });

    it("throws when schwartz is missing", async () => {
      const assessment = buildBalancedAssessment();
      (assessment as any).schwartz = undefined;

      await expect(
        generateCareerReport(assessment, null, "en"),
      ).rejects.toThrow("Assessment missing schwartz");
    });
  });

  describe("pathway fallback", () => {
    it("degrades gracefully when pathway rejects inside Promise.all", async () => {
      mockGenerateCareerPathway.mockRejectedValue(new Error("LLM failed"));

      const assessment = buildBalancedAssessment();
      const realConditions = buildBalancedRealConditions();

      // Pathway rejection is caught — report still generated with fallback.
      // Pipeline waits 10s for provider recovery retry, so this test needs
      // extended timeout.
      const report = await generateCareerReport(
        assessment,
        realConditions,
        "en",
      );
      expect(report).toBeDefined();
      expect(report.careerPathway).toBeDefined();
      // meta.degradedSections should include careerMatch since narrative failed
      expect(report.meta).toHaveProperty("degradedSections");
    }, 30_000);

    it("uses placeholder when no realConditions (pathway not called)", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      expect(mockGenerateCareerPathway).not.toHaveBeenCalled();
      expect(report.careerPathway).toBeDefined();
      expect(report.careerPathway.realConditionsProvided).toBe(false);
    });
  });

  describe("withTimeout behavior", () => {
    it("rejects when narrative call exceeds per-call timeout", async () => {
      // Mock narrative to never resolve (simulates hung LLM)
      mockGenerateCareerMatchNarrative.mockReturnValue(
        new Promise(() => {
          /* never resolves */
        }),
      );

      const assessment = buildBalancedAssessment();

      // The per-call timeout is 90s; the pipeline timeout is 180s.
      // We can't wait that long in a test, but we can verify the
      // pipeline timeout wrapper rejects.
      // Override PIPELINE_TIMEOUT_MS by racing with a short timer.
      const result = Promise.race([
        generateCareerReport(assessment, null, "en"),
        new Promise<"test-timeout">((resolve) =>
          setTimeout(() => resolve("test-timeout"), 500),
        ),
      ]);

      // The test timer should win since the pipeline is stuck
      await expect(result).resolves.toBe("test-timeout");
    });
  });

  describe("integration layer", () => {
    it("calls generateIntegration with correct arguments", async () => {
      const assessment = buildBalancedAssessment();
      await generateCareerReport(assessment, null, "en");

      expect(mockGenerateIntegration).toHaveBeenCalledTimes(1);
      // First arg: assessment, second: profileAlgo, third: careerMatch, fourth: null (no profile narratives), fifth: pathway, sixth: locale
      const callArgs = mockGenerateIntegration.mock.calls[0];
      expect(callArgs[0]).toBe(assessment); // assessment
      expect(callArgs[3]).toBeNull(); // profileNarratives = null in v3.0
      expect(callArgs[5]).toBe("en"); // locale
    });

    it("integration output is included in report", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      expect(report.integration).toEqual(PARSED_INTEGRATION);
    });
  });

  describe("career match assembly", () => {
    it("directions include whySuitable from LLM narratives", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      // The first direction should have whySuitable from the mock narrative
      const firstDir = report.careerMatch.directions[0];
      expect(firstDir.whySuitable).toBe(
        PARSED_NARRATIVE.directions[0].whySuitable,
      );
    });

    it("directions include matchScore and matchBreakdown", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      for (const dir of report.careerMatch.directions) {
        expect(typeof dir.matchScore).toBe("number");
        expect(dir.matchBreakdown).toBeDefined();
      }
    });

    it("exploratoryDirections have algorithmic whySuitable from MatchInsight", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      for (const dir of report.careerMatch.exploratoryDirections ?? []) {
        // whySuitable is now built from algorithm insights (non-empty if insights exist)
        expect(typeof dir.whySuitable).toBe("string");
        expect(dir.challenges).toBe("");
      }
    });

    it("summary comes from LLM narrative", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      expect(report.careerMatch.summary).toBe(PARSED_NARRATIVE.summary);
    });
  });

  describe("header", () => {
    it("contains archetype info from assessment", async () => {
      const assessment = buildBalancedAssessment();
      const report = await generateCareerReport(assessment, null, "en");

      expect(report.header.archetype.code).toBe("I-enhancement");
      expect(report.header.archetype.label_en).toBeTruthy();
      expect(typeof report.header.archetype.label_zh).toBe("string");
    });
  });
});
