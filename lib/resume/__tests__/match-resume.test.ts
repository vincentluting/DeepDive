import { describe, it, expect } from "vitest";
import { matchResumeToAssessment } from "../match-resume";
import type { ResumeData } from "../types";
import type { AssessmentResult } from "@/lib/types";

// ── Minimal mock assessment with required fields ────────────
const mockAssessment: AssessmentResult = {
  id: "test-assessment-1",
  sessionId: "test-session-1",
  timestamp: new Date().toISOString(),
  questionnaireVersion: "2.0",
  bigFive: {
    domains: {
      openness: 3.5,
      conscientiousness: 3.0,
      extraversion: 2.5,
      agreeableness: 4.0,
      neuroticism: 2.0,
    },
    facets: {},
    domainsNormalized: {
      openness: 70,
      conscientiousness: 60,
      extraversion: 50,
      agreeableness: 80,
      neuroticism: 40,
    },
  },
  schwartz: {
    raw: {} as AssessmentResult["schwartz"]["raw"],
    centered: {} as AssessmentResult["schwartz"]["centered"],
    ranking: [],
    top3: [],
  },
  tensions: {
    scenarios: [],
    overallConsistency: 0.8,
    notableTensions: [],
  },
  riasecNormalized: { R: 50, I: 70, A: 80, S: 30, E: 40, C: 20 },
  archetype: {
    primary: "A",
    orientation: "transcendence",
    code: "A-transcendence",
    label_zh: "",
    label_en: "",
    tagline_zh: "",
    tagline_en: "",
    confidence: 0.9,
    confidenceLevel: "high",
    isBoundary: false,
    enhancementScore: 3,
    transcendenceScore: 5,
    orientationGap: 2,
    riasecScores: { R: 50, I: 70, A: 80, S: 30, E: 40, C: 20 },
    gap12: 10,
  } as unknown as AssessmentResult["archetype"],
  meta: {
    totalQuestions: 147,
    answeredQuestions: 147,
    totalTimeMs: 600000,
    rushCount: 0,
    moduleTimes: { sjt: 200000, pvq: 200000, ipip: 200000 },
  },
};

// ── Helpers ─────────────────────────────────────────────────
function makeResume(overrides: Partial<ResumeData> = {}): ResumeData {
  return {
    experience: [],
    skills: [],
    languages: [],
    industries: [],
    education: [],
    yearsOfExperience: 0,
    seniority: "unknown",
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────
describe("matchResumeToAssessment", () => {
  describe("Bug #1: handles undefined fields without crashing", () => {
    it("does not throw when experience entries have undefined industry", () => {
      const resume = makeResume({
        experience: [
          {
            title: "Designer",
            company: "Acme",
            industry: undefined as unknown as string,
            durationMonths: 24,
            responsibilities: ["UI design"],
          },
        ],
      });

      expect(() =>
        matchResumeToAssessment(resume, mockAssessment),
      ).not.toThrow();
    });

    it("does not throw when experience entries have undefined title and company", () => {
      const resume = makeResume({
        experience: [
          {
            title: undefined as unknown as string,
            company: undefined as unknown as string,
            industry: "tech",
            durationMonths: 12,
            responsibilities: [],
          },
        ],
      });

      expect(() =>
        matchResumeToAssessment(resume, mockAssessment),
      ).not.toThrow();
    });

    it("does not throw when education has undefined degree", () => {
      const resume = makeResume({
        education: [
          {
            degree: undefined as unknown as string,
            field: "Computer Science",
            institution: "MIT",
          },
        ],
      });

      expect(() =>
        matchResumeToAssessment(resume, mockAssessment),
      ).not.toThrow();
    });

    it("returns a valid ResumeMatchResult with all missing optional fields", () => {
      const resume = makeResume({
        experience: [
          {
            title: undefined as unknown as string,
            company: undefined as unknown as string,
            industry: undefined as unknown as string,
            durationMonths: 0,
            responsibilities: [],
          },
        ],
        skills: [],
        industries: [],
        education: [
          {
            degree: undefined as unknown as string,
            field: "",
            institution: "",
          },
        ],
      });

      const result = matchResumeToAssessment(resume, mockAssessment);

      expect(result).toHaveProperty("alignedDimensions");
      expect(result).toHaveProperty("conflictingDimensions");
      expect(result).toHaveProperty("autoFillRealConditions");
      expect(result).toHaveProperty("summary_zh");
      expect(result).toHaveProperty("summary_en");
      expect(Array.isArray(result.alignedDimensions)).toBe(true);
      expect(Array.isArray(result.conflictingDimensions)).toBe(true);
    });

    it("produces correct alignment with valid resume data", () => {
      const resume = makeResume({
        experience: [
          {
            title: "UX Designer",
            company: "Creative Co",
            industry: "design",
            durationMonths: 48,
            responsibilities: ["Visual design"],
          },
        ],
        skills: ["design", "illustration", "figma"],
        industries: ["design", "media"],
      });

      const result = matchResumeToAssessment(resume, mockAssessment);

      // A (Artistic) should align — resume has design signals and assessment A = 80
      expect(result.alignedDimensions.length).toBeGreaterThan(0);
      expect(typeof result.summary_en).toBe("string");
      expect(result.summary_en.length).toBeGreaterThan(0);
    });
  });

  // Regression 2026-05-19 (Codex cross-review): autoFillFromResume previously
  // had its own duplicate degreeMap with the same substring bug. Refactored
  // to call mapDegreeToLevel so both paths stay in sync. These tests guard
  // the auto-fill path so a future regression in degree parsing surfaces here.
  describe("autoFillRealConditions.education.level (degree regression)", () => {
    it("MBA → master", () => {
      const resume = makeResume({
        education: [{ degree: "MBA", field: "Business", institution: "X" }],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe("master");
    });

    it("Postgraduate Diploma → high_school (not master)", () => {
      const resume = makeResume({
        education: [
          {
            degree: "Postgraduate Diploma",
            field: "Marketing",
            institution: "Y",
          },
        ],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe(
        "high_school",
      );
    });

    it("Marketing Certificate → other (no false-positive master via 'ma')", () => {
      const resume = makeResume({
        education: [
          {
            degree: "Marketing Certificate",
            field: "Marketing",
            institution: "Z",
          },
        ],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe("other");
    });

    it("Bachelor of Science → bachelor", () => {
      const resume = makeResume({
        education: [
          { degree: "Bachelor of Science", field: "CS", institution: "U" },
        ],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe("bachelor");
    });

    it("PhD → phd", () => {
      const resume = makeResume({
        education: [{ degree: "PhD", field: "Physics", institution: "MIT" }],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe("phd");
    });

    it("Chinese 硕士 → master", () => {
      const resume = makeResume({
        education: [
          { degree: "硕士", field: "计算机", institution: "清华大学" },
        ],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe("master");
    });

    it("Chinese 博士 → phd", () => {
      const resume = makeResume({
        education: [
          { degree: "博士研究生", field: "物理", institution: "北京大学" },
        ],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe("phd");
    });

    it("Chinese 本科 → bachelor", () => {
      const resume = makeResume({
        education: [{ degree: "本科", field: "金融", institution: "复旦大学" }],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe("bachelor");
    });

    it("Chinese 高中 → high_school", () => {
      const resume = makeResume({
        education: [{ degree: "高中", field: "", institution: "某中学" }],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe(
        "high_school",
      );
    });

    it("Chinese 大专 (vocational college) → high_school", () => {
      const resume = makeResume({
        education: [
          { degree: "大专", field: "护理", institution: "某职业学院" },
        ],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe(
        "high_school",
      );
    });

    it("Chinese 副学士 (associate degree) → high_school", () => {
      const resume = makeResume({
        education: [{ degree: "副学士", field: "工商", institution: "X 学院" }],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe(
        "high_school",
      );
    });

    it("English 'undergrad' shortform → bachelor", () => {
      const resume = makeResume({
        education: [
          { degree: "Undergrad in CS", field: "CS", institution: "U" },
        ],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe("bachelor");
    });

    it("Plural 'Masters' → master", () => {
      const resume = makeResume({
        education: [
          {
            degree: "Masters in Public Health",
            field: "Public Health",
            institution: "U",
          },
        ],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe("master");
    });

    it("Spaced 'B Sc' → bachelor", () => {
      const resume = makeResume({
        education: [
          { degree: "B Sc Computer Science", field: "CS", institution: "U" },
        ],
      });
      const result = matchResumeToAssessment(resume, mockAssessment);
      expect(result.autoFillRealConditions.education?.level).toBe("bachelor");
    });
  });
});
