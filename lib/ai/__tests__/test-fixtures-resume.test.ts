import { describe, it, expect } from "vitest";
import { getMockResponse } from "../test-fixtures";

// ── Tests ───────────────────────────────────────────────────
describe("test-fixtures: resume-parse fixture", () => {
  describe("Bug #4: fixture must match ResumeData structure", () => {
    it("returns a fixture for resume-parse task", () => {
      const fixture = getMockResponse("resume-parse");
      expect(fixture).not.toBeNull();
      expect(typeof fixture!.text).toBe("string");
      expect(fixture!.inputTokens).toBeGreaterThan(0);
      expect(fixture!.outputTokens).toBeGreaterThan(0);
    });

    it("parses to valid JSON", () => {
      const fixture = getMockResponse("resume-parse")!;
      expect(() => JSON.parse(fixture.text)).not.toThrow();
    });

    it("has all required ResumeData top-level fields", () => {
      const fixture = getMockResponse("resume-parse")!;
      const data = JSON.parse(fixture.text);

      expect(data).toHaveProperty("experience");
      expect(data).toHaveProperty("skills");
      expect(data).toHaveProperty("languages");
      expect(data).toHaveProperty("industries");
      expect(data).toHaveProperty("education");
      expect(data).toHaveProperty("yearsOfExperience");
      expect(data).toHaveProperty("seniority");
    });

    it("has correct types for each field", () => {
      const fixture = getMockResponse("resume-parse")!;
      const data = JSON.parse(fixture.text);

      expect(Array.isArray(data.experience)).toBe(true);
      expect(Array.isArray(data.skills)).toBe(true);
      expect(Array.isArray(data.languages)).toBe(true);
      expect(Array.isArray(data.industries)).toBe(true);
      expect(Array.isArray(data.education)).toBe(true);
      expect(typeof data.yearsOfExperience).toBe("number");
      expect(typeof data.seniority).toBe("string");
    });

    it("has valid seniority value", () => {
      const fixture = getMockResponse("resume-parse")!;
      const data = JSON.parse(fixture.text);

      const validSeniorities = [
        "entry",
        "mid",
        "senior",
        "executive",
        "unknown",
      ];
      expect(validSeniorities).toContain(data.seniority);
    });

    it("experience entries have correct ResumeExperience fields", () => {
      const fixture = getMockResponse("resume-parse")!;
      const data = JSON.parse(fixture.text);

      expect(data.experience.length).toBeGreaterThan(0);
      for (const exp of data.experience) {
        expect(typeof exp.title).toBe("string");
        expect(typeof exp.company).toBe("string");
        expect(typeof exp.industry).toBe("string");
        expect(typeof exp.durationMonths).toBe("number");
        expect(Array.isArray(exp.responsibilities)).toBe(true);
      }
    });

    it("education entries have correct ResumeEducation fields", () => {
      const fixture = getMockResponse("resume-parse")!;
      const data = JSON.parse(fixture.text);

      expect(data.education.length).toBeGreaterThan(0);
      for (const edu of data.education) {
        expect(typeof edu.degree).toBe("string");
        expect(typeof edu.field).toBe("string");
        expect(typeof edu.institution).toBe("string");
      }
    });

    it("language entries have correct ResumeLanguage fields", () => {
      const fixture = getMockResponse("resume-parse")!;
      const data = JSON.parse(fixture.text);

      expect(data.languages.length).toBeGreaterThan(0);
      for (const lang of data.languages) {
        expect(typeof lang.language).toBe("string");
        expect(typeof lang.proficiency).toBe("string");
      }
    });
  });
});
