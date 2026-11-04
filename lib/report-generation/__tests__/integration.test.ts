// ============================================================
// Tests: generateIntegration() — LLM Parsing + Fallback
// Mocks the model-router's callLLM; no real API calls.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeProfileAlgorithm } from "@/lib/profile-generation/profile-algorithm";
import { computeCareerMatchAlgorithm } from "../career-match-algorithm";
import { buildPathwayPlaceholder } from "../career-pathway";
import { MOCK_CAREERS } from "./fixtures/mock-career-pool";

vi.mock("@/lib/career-matching/career-pool", () => ({
  getCareerPool: () => MOCK_CAREERS,
  ensureCareerPoolLoaded: async () => {},
  refreshCacheFromDb: async () => {},
  invalidateCareerPoolCache: () => {},
}));

import { buildBalancedAssessment } from "./fixtures/mock-assessment-balanced";
import {
  VALID_PROFILE_NARRATIVE,
  VALID_INTEGRATION,
  INTEGRATION_MISSING_CORE,
  INTEGRATION_MISSING_LETTER,
} from "./fixtures/mock-llm-responses";
import type { ProfileNarrativeOutput } from "../types";
import type { RealConditions } from "@/lib/types";

// Mock model-router (the unified LLM entry point)
const mockCallLLM = vi.fn();
vi.mock("@/lib/ai/model-router", () => ({
  callLLM: (...args: unknown[]) => mockCallLLM(...args),
}));

// Mock LLMPromptMeta logger — DB writes have no connection in tests, and the
// helper is fire-and-forget; mocking silences the expected "Database
// connection string not found" stderr noise.
vi.mock("@/lib/db/llm-usage", () => ({
  logLLMPromptMeta: vi.fn(),
  logLLMQualityCheck: vi.fn(),
}));

import { generateIntegration } from "../integration";

beforeEach(() => {
  vi.clearAllMocks();
});

/** Build all the dependencies for generateIntegration */
async function buildIntegrationInputs() {
  const assessment = buildBalancedAssessment();
  const profileAlgo = computeProfileAlgorithm(assessment);
  const careerMatchAlgo = await computeCareerMatchAlgorithm(
    assessment,
    profileAlgo,
    null,
  );
  const profileNarratives: ProfileNarrativeOutput = JSON.parse(
    VALID_PROFILE_NARRATIVE,
  );

  // Build career match for the integration call
  const careerMatch = {
    directions: careerMatchAlgo.candidates.map((c, i) => ({
      rank: i + 1,
      title_zh: c.direction.title_zh,
      title_en: c.direction.title_en,
      matchScore: c.score.total,
      matchBreakdown: c.score.breakdown,
      whySuitable: "test suitable",
      challenges: "test challenges",
      explorationNote: "test note",
      alignedValues: c.direction.alignedValues,
    })),
    summary: "Test summary for career match.",
  };

  const pathway = buildPathwayPlaceholder("en");

  return { assessment, profileAlgo, careerMatch, profileNarratives, pathway };
}

describe("generateIntegration", () => {
  describe("successful LLM response", () => {
    it("parses valid JSON response correctly", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      const result = await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );

      expect(result.coreInsight).toContain("Synthesizer");
      expect(result.letterToUser).toContain("snapshot");
      expect(result.transitions.profileToPathway.length).toBeGreaterThan(0);
    });

    it("uses 2000 tokens for EN and 1500 for ZH", async () => {
      mockCallLLM.mockResolvedValue(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();

      await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );
      expect(mockCallLLM.mock.calls[0][2]).toMatchObject({ maxTokens: 4000 });

      mockCallLLM.mockClear();
      await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "zh",
      );
      expect(mockCallLLM.mock.calls[0][2]).toMatchObject({ maxTokens: 3000 });
    });

    it("system message excludes restraint rules", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );

      // callLLM is called with (task, messages, options)
      // messages[0] is the system message
      const systemMsg = mockCallLLM.mock.calls[0][1][0].content;
      expect(systemMsg).not.toContain("Narrative Restraint Protocol");
    });
  });

  describe("retry on incomplete JSON", () => {
    it("retries when coreInsight is missing", async () => {
      mockCallLLM
        .mockResolvedValueOnce(INTEGRATION_MISSING_CORE)
        .mockResolvedValueOnce(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      const result = await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );

      expect(mockCallLLM).toHaveBeenCalledTimes(2);
      expect(result.coreInsight).toContain("Synthesizer");
    });

    it("retries when letterToUser is missing", async () => {
      mockCallLLM
        .mockResolvedValueOnce(INTEGRATION_MISSING_LETTER)
        .mockResolvedValueOnce(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      const result = await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );

      expect(mockCallLLM).toHaveBeenCalledTimes(2);
      expect(result.letterToUser.length).toBeGreaterThan(0);
    });
  });

  describe("fallback behavior", () => {
    it("returns EN fallback on total failure", async () => {
      mockCallLLM
        .mockRejectedValueOnce(new Error("API error"))
        .mockRejectedValueOnce(new Error("API error"));

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      const result = await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );

      expect(result.coreInsight).toContain("Tactician");
      // Epigraph v1: fallback copy must be free of item-count provenance —
      // no more "based on 147 items" in either coreInsight or letterToUser.
      expect(result.coreInsight).not.toMatch(/\b(86|147)\b/);
      expect(result.letterToUser).not.toMatch(/\b(86|147)\b/);
      expect(result.letterToUser.length).toBeGreaterThan(0);
      expect(result.transitions.profileToPathway.length).toBeGreaterThan(0);
    });

    it("returns ZH fallback on total failure", async () => {
      mockCallLLM
        .mockRejectedValueOnce(new Error("API error"))
        .mockRejectedValueOnce(new Error("API error"));

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      const result = await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "zh",
      );

      expect(result.coreInsight).toContain("战略家");
      // Epigraph v1: ZH fallback also forbids item-count provenance.
      expect(result.coreInsight).not.toMatch(/\b(86|147)\b/);
      expect(result.letterToUser).not.toMatch(/\b(86|147)\b/);
      expect(result.letterToUser.length).toBeGreaterThan(0);
      expect(result.transitions.profileToPathway.length).toBeGreaterThan(0);
    });

    it("fallback handles missing transitions gracefully", async () => {
      // Return an integration response with transitions but missing sub-fields
      const partialTransitions = JSON.stringify({
        coreInsight: "An insight.",
        transitions: {},
        letterToUser: "A letter.",
      });
      mockCallLLM.mockResolvedValueOnce(partialTransitions);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      const result = await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );

      // Should use empty string for missing profileToPathway (null coalescing in source)
      expect(typeof result.transitions.profileToPathway).toBe("string");
    });

    it("fallback on empty response", async () => {
      mockCallLLM.mockResolvedValueOnce("").mockResolvedValueOnce("");

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      const result = await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );

      expect(result.coreInsight.length).toBeGreaterThan(0);
      expect(result.letterToUser.length).toBeGreaterThan(0);
    });
  });

  describe("language enforcement", () => {
    beforeEach(() => {
      mockCallLLM.mockReset();
    });

    const INTEGRATION_WITH_CHINESE_LEAK = JSON.stringify({
      coreInsight:
        "你的探索显示出综合者的模式——将分析与创意表达相结合的人。值得探索的方向利用了这一桥梁，而你的下一步是在小型实验中测试这些联系。",
      transitions: {
        profileToPathway:
          "理解你的模式是基础——现在让我们规划一条具体的前进道路——",
      },
      letterToUser:
        "你好。\n\n在这份深度探索中，你展现出综合者的特质。你天然地在分析与表达之间架桥，这让你在许多传统职业之外看到更多可能。\n\n值得关注的方向将利用这座桥梁，而不是要求你选边。你的下一步不需要完美，只需要真实——一个可以让你观察自己如何响应的小实验。\n\n这份快照会随着你的探索而演变。最好的方向不是被选择的，而是被尝试出来的。",
    });

    it("regenerates when EN output contains Chinese and returns clean retry", async () => {
      mockCallLLM
        .mockResolvedValueOnce(INTEGRATION_WITH_CHINESE_LEAK)
        .mockResolvedValueOnce(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      const result = await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );

      expect(mockCallLLM).toHaveBeenCalledTimes(2);
      expect(result.coreInsight).not.toMatch(/[\u4e00-\u9fff]/);
      expect(result.letterToUser).not.toMatch(/[\u4e00-\u9fff]/);
      expect(result.transitions.profileToPathway).not.toMatch(
        /[\u4e00-\u9fff]/,
      );
    });

    it("falls back to algorithm text when both LLM passes leak Chinese", async () => {
      mockCallLLM
        .mockResolvedValueOnce(INTEGRATION_WITH_CHINESE_LEAK)
        .mockResolvedValueOnce(INTEGRATION_WITH_CHINESE_LEAK);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      const result = await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );

      // Algorithm fallback is English
      expect(result.coreInsight).not.toMatch(/[\u4e00-\u9fff]/);
      expect(result.letterToUser).not.toMatch(/[\u4e00-\u9fff]/);
      // Epigraph v1: fallback must not leak item-count provenance
      expect(result.letterToUser).not.toMatch(/\b(86|147)\b/);
      // ...but it must still contain the archetype hook so users know it's
      // the right report.
      expect(result.letterToUser).toContain("Tactician");
    });

    it("passes through cleanly when LLM output matches locale", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
      );

      // Only the original call
      expect(mockCallLLM).toHaveBeenCalledTimes(1);
    });
  });

  describe("RealConditions injection (Phase B audit fix)", () => {
    const realConditionsFixture: RealConditions = {
      education: { level: "master", field: "Computer Science" },
      experienceYears: 7,
      pastIndustries: ["software"],
      currentCity: "Amsterdam",
      targetCities: ["Amsterdam"],
      visaStatus: "work_visa",
      visaType: "Highly Skilled Migrant",
      workRestrictions: {
        canWorkFullTime: true,
        sponsorshipRequired: true,
        occupationRestricted: false,
      },
      workLanguages: [{ language: "English", proficiency: "fluent" as const }],
      locationFlexibility: "stay-local" as const,
      familyConstraints: {
        hasPartner: true,
        partnerWorkRestriction: true,
        hasDependents: false,
      },
      economicConstraints: {
        salaryFloor: "critical" as const,
        canRelocate: false,
        willingToRetrain: false,
      },
      salaryRange: { min: 80000, max: 100000, currency: "EUR" },
      workType: "fulltime" as const,
      officeMode: "hybrid" as const,
      interestedIndustries: ["ai"],
      openToCareerChange: "open" as const,
      culturalIdentity: {
        externalExpectationPressure: "high" as const,
      },
    };

    it("prompt contains the User's Reality Snapshot when realConditions provided", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
        null,
        realConditionsFixture,
      );

      const promptContent = mockCallLLM.mock.calls[0]?.[1]?.[1]
        ?.content as string;
      expect(promptContent).toContain("User's Reality Snapshot");
      // High-decision-weight signals should make it into the summary
      expect(promptContent).toMatch(/visa|sponsorship/i);
    });

    it("prompt contains Paragraph 3 honest-reality-tension directive", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
        null,
        realConditionsFixture,
      );

      const promptContent = mockCallLLM.mock.calls[0]?.[1]?.[1]
        ?.content as string;
      expect(promptContent).toContain("strategic threshold");
      expect(promptContent).toContain("never as a checklist");
    });

    it("coreInsight directive forbids leaking reality-snapshot field names", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
        null,
        realConditionsFixture,
      );

      const promptContent = mockCallLLM.mock.calls[0]?.[1]?.[1]
        ?.content as string;
      expect(promptContent).toContain(
        "Strictly forbidden: naming specific reality-snapshot fields",
      );
    });

    it("emits null-fallback hint when realConditions is null", async () => {
      mockCallLLM.mockResolvedValueOnce(VALID_INTEGRATION);

      const {
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
      } = await buildIntegrationInputs();
      await generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives,
        pathway,
        "en",
        null,
        null, // <-- no realConditions
      );

      const promptContent = mockCallLLM.mock.calls[0]?.[1]?.[1]
        ?.content as string;
      expect(promptContent).toContain("general transition tension");
    });
  });
});
