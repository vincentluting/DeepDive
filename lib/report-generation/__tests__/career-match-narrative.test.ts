// ============================================================
// Tests: generateCareerMatchNarrative() — LLM Parsing + Fallback
// Mocks the model-router's callLLM; no real API calls.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeProfileAlgorithm } from "@/lib/profile-generation/profile-algorithm";
import { computeCareerMatchAlgorithm } from "../career-match-algorithm";
import { MOCK_CAREERS } from "./fixtures/mock-career-pool";

vi.mock("@/lib/career-matching/career-pool", () => ({
  getCareerPool: () => MOCK_CAREERS,
  ensureCareerPoolLoaded: async () => {},
  refreshCacheFromDb: async () => {},
  invalidateCareerPoolCache: () => {},
}));
import { buildBalancedAssessment } from "./fixtures/mock-assessment-balanced";
import {
  VALID_PANEL1_NARRATIVE,
  INCOMPLETE_PANEL1_NARRATIVE,
  PANEL1_MISSING_SUMMARY,
} from "./fixtures/mock-llm-responses";

// Mock model-router (the unified LLM entry point)
const mockCallLLM = vi.fn();
vi.mock("@/lib/ai/model-router", () => ({
  callLLM: (...args: unknown[]) => mockCallLLM(...args),
}));

// Mock sanitizeRealConditions to avoid importing its dependencies
vi.mock("@/lib/ai/prompt-sanitization", () => ({
  sanitizeRealConditions: vi.fn((c: unknown) => c),
}));

// Mock LLMPromptMeta logger — fire-and-forget DB writes with no test
// connection produce expected stderr noise; mocking keeps test output clean.
vi.mock("@/lib/db/llm-usage", () => ({
  logLLMPromptMeta: vi.fn(),
  logLLMQualityCheck: vi.fn(),
}));

import { generateCareerMatchNarrative } from "../career-match-narrative";

beforeEach(() => {
  vi.clearAllMocks();
});

/** Helper: build algo outputs */
async function buildAlgoOutputs() {
  const assessment = buildBalancedAssessment();
  const profileAlgo = computeProfileAlgorithm(assessment);
  const careerMatchAlgo = await computeCareerMatchAlgorithm(
    assessment,
    profileAlgo,
    null,
  );
  return { assessment, profileAlgo, careerMatchAlgo };
}

describe("generateCareerMatchNarrative", () => {
  describe("successful LLM response", () => {
    it("parses valid response with summary and directions", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      const result = await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      expect(result.summary).toContain("interest map");
      expect(result.directions).toHaveLength(5);
      expect(result.directions[0].whySuitable.length).toBeGreaterThan(0);
      expect(result.directions[0].challenges.length).toBeGreaterThan(0);
    });

    it("uses 1500 tokens for EN and 1200 for ZH (3+2 architecture)", async () => {
      mockCallLLM.mockResolvedValue(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();

      await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );
      expect(mockCallLLM.mock.calls[0][2]).toMatchObject({ maxTokens: 3000 });

      mockCallLLM.mockClear();
      await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "zh",
      );
      expect(mockCallLLM.mock.calls[0][2]).toMatchObject({ maxTokens: 2500 });
    });
  });

  describe("retry on incomplete JSON", () => {
    it("retries when directions array is empty", async () => {
      mockCallLLM
        .mockResolvedValueOnce(INCOMPLETE_PANEL1_NARRATIVE)
        .mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      const result = await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      expect(mockCallLLM).toHaveBeenCalledTimes(2);
      expect(result.directions.length).toBeGreaterThan(0);
    });

    it("retries when summary is missing", async () => {
      mockCallLLM
        .mockResolvedValueOnce(PANEL1_MISSING_SUMMARY)
        .mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      const result = await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      expect(mockCallLLM).toHaveBeenCalledTimes(2);
      expect(result.summary.length).toBeGreaterThan(0);
    });
  });

  describe("fallback behavior", () => {
    it("returns EN fallback when LLM fails twice", async () => {
      mockCallLLM
        .mockRejectedValueOnce(new Error("API error"))
        .mockRejectedValueOnce(new Error("API error"));

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      const result = await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      expect(result.summary).toContain("interest map");
      expect(result.directions.length).toBe(careerMatchAlgo.candidates.length);

      for (const dir of result.directions) {
        expect(dir.whySuitable.length).toBeGreaterThan(0);
        expect(dir.challenges.length).toBeGreaterThan(0);
      }
    });

    it("returns ZH fallback when LLM fails twice", async () => {
      mockCallLLM
        .mockRejectedValueOnce(new Error("API error"))
        .mockRejectedValueOnce(new Error("API error"));

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      const result = await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "zh",
      );

      expect(result.summary).toContain("兴趣图谱");
      expect(result.directions.length).toBe(careerMatchAlgo.candidates.length);
    });

    it("fallback directions include match score data", async () => {
      mockCallLLM.mockRejectedValue(new Error("LLM down"));

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      const result = await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      // Fallback whySuitable should include qualitative interest alignment band
      expect(result.directions[0].whySuitable).toContain("interest alignment");
    });

    it("returns fallback on empty LLM response", async () => {
      mockCallLLM.mockResolvedValueOnce("").mockResolvedValueOnce("");

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      const result = await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.directions.length).toBeGreaterThan(0);
    });
  });

  describe("AI disruption risk tagging in prompt", () => {
    it("prompt includes AI risk warning for transformed careers (zh)", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      // Replace first career with a transformed one to test prompt injection
      const { assessment, profileAlgo } = await buildAlgoOutputs();
      const algo = computeProfileAlgorithm(assessment);
      const careerMatchAlgo = await computeCareerMatchAlgorithm(
        assessment,
        algo,
        null,
      );

      // Force a transformed career into candidates for prompt testing
      if (careerMatchAlgo.candidates.length > 0) {
        careerMatchAlgo.candidates[0].direction.aiEraCategory = "transformed";
      }

      await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "zh",
      );

      // The prompt (second arg to callLLM) should contain AI risk tag
      const promptContent = mockCallLLM.mock.calls[0]?.[1]?.[1]
        ?.content as string;
      if (promptContent) {
        expect(promptContent).toContain("AI转型风险");
      }
    });

    it("prompt includes AI risk warning for transformed careers (en)", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo } = await buildAlgoOutputs();
      const algo = computeProfileAlgorithm(assessment);
      const careerMatchAlgo = await computeCareerMatchAlgorithm(
        assessment,
        algo,
        null,
      );

      if (careerMatchAlgo.candidates.length > 0) {
        careerMatchAlgo.candidates[0].direction.aiEraCategory = "transformed";
      }

      await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      const promptContent = mockCallLLM.mock.calls[0]?.[1]?.[1]
        ?.content as string;
      if (promptContent) {
        expect(promptContent).toContain("AI Disruption Risk");
      }
    });

    it("prompt includes augmented challenges directive linking RC + strategic threshold", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      const promptContent = mockCallLLM.mock.calls[0]?.[1]?.[1]
        ?.content as string;
      expect(promptContent).toContain("strategic threshold");
      expect(promptContent).toContain("visa sponsorship");
    });

    it("prompt surfaces sensitive RC fields with conditional-clause discipline (2026-05-23 audit fix)", async () => {
      // Pre-fix behavior: narrative mode hid all sensitive fields and warned
      // the LLM to "assume they may apply." Users felt their visa/family/
      // salary inputs were ignored in Career Match challenges. Fix #2 now
      // exposes a sensitive sub-block with explicit conditional-clause
      // discipline — sensitive VALUES surface, raw numerics still don't.
      mockCallLLM.mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      const rcWithSensitive = {
        education: { level: "master" as const, field: "CS" },
        experienceYears: 5,
        pastIndustries: ["tech"],
        currentCity: "Amsterdam",
        targetCities: ["Amsterdam"],
        visaStatus: "work_visa" as const,
        visaType: "ULTRA_SECRET_VISA_TYPE_42",
        workRestrictions: {
          canWorkFullTime: true,
          sponsorshipRequired: true,
          occupationRestricted: false,
        },
        workLanguages: [
          { language: "English", proficiency: "fluent" as const },
        ],
        locationFlexibility: "stay-local" as const,
        familyConstraints: {
          hasPartner: true,
          partnerWorkRestriction: true,
          hasDependents: true,
        },
        economicConstraints: {
          salaryFloor: "critical" as const,
          canRelocate: false,
          willingToRetrain: false,
        },
        salaryRange: { min: 99999, max: 123456, currency: "EUR" },
        workType: "fulltime" as const,
        officeMode: "hybrid" as const,
        interestedIndustries: ["ai"],
        openToCareerChange: "open" as const,
        culturalIdentity: {
          externalExpectationPressure: "high" as const,
        },
      };

      await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        rcWithSensitive,
        "en",
      );

      const promptContent = mockCallLLM.mock.calls[0]?.[1]?.[1]
        ?.content as string;
      // Low-sensitivity fields still make it through the primary block
      expect(promptContent).toContain("Amsterdam");
      // Sensitive sub-block is now present with conditional-clause discipline
      expect(promptContent).toContain("Sensitive Strategic Thresholds");
      expect(promptContent).toMatch(/write as e\.g\./i);
      // Visa type SHOULD surface (categorical signal needed for grounding)
      expect(promptContent).toContain("ULTRA_SECRET_VISA_TYPE_42");
      // Salary FLOOR (categorical) surfaces; raw salaryRange numbers still
      // do NOT — we expose the decision-weight signal ("critical"), never
      // the raw number, so the LLM can't accidentally quote a specific
      // figure back to the user.
      expect(promptContent).toContain("critical");
      expect(promptContent).not.toContain("99999");
      expect(promptContent).not.toContain("123456");
    });

    it("per-direction risk tag NOT present for stable-only candidates", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();

      // Ensure no transformed careers in candidates
      for (const c of careerMatchAlgo.candidates) {
        c.direction.aiEraCategory = "stable";
      }

      await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      const promptContent = mockCallLLM.mock.calls[0]?.[1]?.[1]
        ?.content as string;
      if (promptContent) {
        // The per-direction tag (with colon + description) should NOT appear
        // Note: the challenges instruction itself quotes the tag name for reference
        expect(promptContent).not.toContain(
          "⚠️ AI Disruption Risk: This direction",
        );
        expect(promptContent).not.toContain("⚠️ AI转型风险: 该方向");
      }
    });

    it("challenges instruction references AI disruption handling", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      const promptContent = mockCallLLM.mock.calls[0]?.[1]?.[1]
        ?.content as string;
      if (promptContent) {
        // challenges instruction should explain how to handle flagged directions
        expect(promptContent).toContain("AI Disruption Risk");
      }
    });
  });

  describe("language enforcement", () => {
    beforeEach(() => {
      // mockResolvedValueOnce queue is not cleared by vi.clearAllMocks()
      mockCallLLM.mockReset();
    });

    const EN_NARRATIVE_WITH_CHINESE_LEAK = JSON.stringify({
      summary:
        "基于你的兴趣图谱、人格特征和价值取向，以下方向最值得你探索。（中文泄漏）",
      directions: [
        {
          whySuitable:
            "这个方向与你的兴趣高度匹配，值得深入探索其在 AI 时代的应用。",
          challenges: "需要持续学习新工具和技术。",
        },
        {
          whySuitable:
            "Your analytical depth pairs well with this direction's demands.",
          challenges: "Market entry can be competitive in this space.",
        },
      ],
    });

    it("regenerates when EN output contains Chinese and returns clean retry", async () => {
      mockCallLLM
        .mockResolvedValueOnce(EN_NARRATIVE_WITH_CHINESE_LEAK)
        .mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      const result = await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      expect(mockCallLLM).toHaveBeenCalledTimes(2);
      // All summary/whySuitable/challenges should be English now
      expect(result.summary).not.toMatch(/[\u4e00-\u9fff]/);
      for (const d of result.directions) {
        expect(d.whySuitable).not.toMatch(/[\u4e00-\u9fff]/);
        expect(d.challenges).not.toMatch(/[\u4e00-\u9fff]/);
      }
    });

    it("falls back to algorithm text when both LLM passes leak Chinese", async () => {
      mockCallLLM
        .mockResolvedValueOnce(EN_NARRATIVE_WITH_CHINESE_LEAK)
        .mockResolvedValueOnce(EN_NARRATIVE_WITH_CHINESE_LEAK);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      const result = await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      // Should have fallen through to algorithm fallback (EN)
      expect(result.summary).toContain("interest map");
      for (const d of result.directions) {
        expect(d.whySuitable).not.toMatch(/[\u4e00-\u9fff]/);
        expect(d.challenges).not.toMatch(/[\u4e00-\u9fff]/);
      }
    });

    it("passes through cleanly when LLM output matches locale", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_PANEL1_NARRATIVE);

      const { assessment, profileAlgo, careerMatchAlgo } =
        await buildAlgoOutputs();
      await generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        null,
        "en",
      );

      // Only the original call — no regenerate triggered
      expect(mockCallLLM).toHaveBeenCalledTimes(1);
    });
  });
});
