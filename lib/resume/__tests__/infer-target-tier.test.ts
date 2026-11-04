// Tests: inferTargetTier — heuristic Job Zone inference from resume.

import { describe, it, expect } from "vitest";
import { inferTargetTier } from "../match-resume";
import type { ResumeData } from "../types";

const EMPTY: ResumeData = {
  experience: [],
  skills: [],
  languages: [],
  industries: [],
  education: [],
  yearsOfExperience: 0,
  seniority: "unknown",
};

function build(partial: Partial<ResumeData>): ResumeData {
  return { ...EMPTY, ...partial };
}

describe("inferTargetTier", () => {
  it("returns null when there's no signal at all", () => {
    expect(inferTargetTier(EMPTY)).toBeNull();
  });

  it("PhD researcher → tier 5", () => {
    const result = inferTargetTier(
      build({
        education: [
          { degree: "PhD", field: "Computer Science", institution: "MIT" },
        ],
        experience: [
          {
            title: "Research Scientist",
            company: "Anthropic",
            industry: "AI",
            durationMonths: 36,
            responsibilities: [],
          },
        ],
        seniority: "senior",
        yearsOfExperience: 3,
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.currentTier).toBe(5);
    expect(result!.aspirationalTier).toBe(5);
    expect(result!.min).toBe(4);
    expect(result!.max).toBe(5);
    expect(result!.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it("bachelor's product manager → tier 4 with stretch to 5", () => {
    const result = inferTargetTier(
      build({
        education: [
          { degree: "Bachelor of Science", field: "CS", institution: "UCLA" },
        ],
        experience: [
          {
            title: "Product Manager",
            company: "Stripe",
            industry: "fintech",
            durationMonths: 24,
            responsibilities: [],
          },
        ],
        seniority: "mid",
        yearsOfExperience: 2,
      }),
    );
    expect(result!.currentTier).toBe(4);
    expect(result!.aspirationalTier).toBe(5);
    expect(result!.min).toBe(3);
    expect(result!.max).toBe(5);
  });

  it("entry-level grad → currentTier downshifted by 1", () => {
    const result = inferTargetTier(
      build({
        education: [
          { degree: "Bachelor", field: "Design", institution: "RISD" },
        ],
        experience: [
          {
            title: "Junior Designer",
            company: "Agency",
            industry: "creative",
            durationMonths: 6,
            responsibilities: [],
          },
        ],
        seniority: "entry",
        yearsOfExperience: 0.5,
      }),
    );
    // bachelor=4, entry=-1 → 3; title "designer" overrides min to 4 → 4
    expect(result!.currentTier).toBe(4);
  });

  it("waiter / no degree → capped at tier 2", () => {
    const result = inferTargetTier(
      build({
        education: [],
        experience: [
          {
            title: "Waiter",
            company: "Restaurant",
            industry: "hospitality",
            durationMonths: 12,
            responsibilities: [],
          },
        ],
        seniority: "entry",
        yearsOfExperience: 1,
      }),
    );
    expect(result!.currentTier).toBe(2);
    expect(result!.aspirationalTier).toBe(3);
    expect(result!.min).toBe(2);
    expect(result!.max).toBe(3);
  });

  it("executive title bumps to tier 5", () => {
    const result = inferTargetTier(
      build({
        education: [
          { degree: "MBA", field: "Business", institution: "Harvard" },
        ],
        experience: [
          {
            title: "Chief Executive Officer",
            company: "Acme Inc.",
            industry: "tech",
            durationMonths: 60,
            responsibilities: [],
          },
        ],
        seniority: "executive",
        yearsOfExperience: 15,
      }),
    );
    expect(result!.currentTier).toBe(5);
  });

  it("high-school + clerical title → tier 2-3 band", () => {
    const result = inferTargetTier(
      build({
        education: [
          { degree: "High School Diploma", field: "", institution: "" },
        ],
        experience: [
          {
            title: "Cashier",
            company: "Retail Co.",
            industry: "retail",
            durationMonths: 18,
            responsibilities: [],
          },
        ],
        seniority: "entry",
        yearsOfExperience: 1.5,
      }),
    );
    // education=2, entry=-1 → 1, clamped → 2; title cap at 2 → 2
    expect(result!.currentTier).toBe(2);
    expect(result!.max).toBe(3);
  });

  it("tour guide → bumped to tier 3 (vocational override)", () => {
    const result = inferTargetTier(
      build({
        education: [{ degree: "High School", field: "", institution: "" }],
        experience: [
          {
            title: "Tour Guide",
            company: "City Tours",
            industry: "tourism",
            durationMonths: 24,
            responsibilities: [],
          },
        ],
        seniority: "mid",
        yearsOfExperience: 2,
      }),
    );
    // hs=2, mid=0 → 2; "tour guide" min=3 → 3
    expect(result!.currentTier).toBe(3);
  });

  it("clamps min to 2 (never recommends Job Zone 1)", () => {
    const result = inferTargetTier(
      build({
        education: [{ degree: "High School", field: "", institution: "" }],
        experience: [
          {
            title: "Server",
            company: "Café",
            industry: "hospitality",
            durationMonths: 6,
            responsibilities: [],
          },
        ],
        seniority: "entry",
        yearsOfExperience: 0.5,
      }),
    );
    expect(result!.min).toBeGreaterThanOrEqual(2);
  });

  it("returns reasoning string with key signals", () => {
    const result = inferTargetTier(
      build({
        education: [{ degree: "Master", field: "CS", institution: "MIT" }],
        seniority: "senior",
        experience: [
          {
            title: "Engineer",
            company: "X",
            industry: "tech",
            durationMonths: 36,
            responsibilities: [],
          },
        ],
        yearsOfExperience: 3,
      }),
    );
    expect(result!.reasoning).toContain("master");
    expect(result!.reasoning).toContain("senior");
  });

  // Regression: previously `lower.includes("ma")` matched `Diploma`,
  // `Marketing Certificate`, `Mama`, etc.; `includes("ba")` matched `MBA`.
  // length-desc sort fixed shadowing but NOT cross-word substrings.
  // Fix: word-boundary regex (`\bmba\b`, `\bdiploma\b`, ...).
  // Audit 2026-05-19 (Claude + Codex cross-review).
  describe("degree substring regression (2026-05-19)", () => {
    it("MBA alone → master, currentTier 5 (not bachelor)", () => {
      const result = inferTargetTier(
        build({
          education: [
            { degree: "MBA", field: "Business", institution: "INSEAD" },
          ],
          experience: [
            {
              title: "Strategy Consultant",
              company: "X",
              industry: "consulting",
              durationMonths: 36,
              responsibilities: [],
            },
          ],
          seniority: "senior",
          yearsOfExperience: 4,
        }),
      );
      // master education (5) + senior (+1) → 6, clamped → 5
      expect(result!.reasoning).toContain("master");
      expect(result!.currentTier).toBe(5);
    });

    it("Postgraduate Diploma → high_school signal, NOT master", () => {
      const result = inferTargetTier(
        build({
          education: [
            {
              degree: "Postgraduate Diploma in Marketing",
              field: "Marketing",
              institution: "X",
            },
          ],
          experience: [
            {
              title: "Marketing Coordinator",
              company: "Y",
              industry: "marketing",
              durationMonths: 24,
              responsibilities: [],
            },
          ],
          seniority: "mid",
          yearsOfExperience: 2,
        }),
      );
      // Diploma maps to high_school per the existing map convention.
      expect(result!.reasoning).toContain("high_school");
      expect(result!.reasoning).not.toContain("master");
    });

    it("Marketing Certificate → other, no false-positive master via 'ma'", () => {
      const result = inferTargetTier(
        build({
          education: [
            {
              degree: "Marketing Certificate",
              field: "Marketing",
              institution: "Y",
            },
          ],
          experience: [
            {
              title: "Marketing Coordinator",
              company: "Z",
              industry: "marketing",
              durationMonths: 12,
              responsibilities: [],
            },
          ],
          seniority: "mid",
          yearsOfExperience: 1,
        }),
      );
      // No recognized degree pattern → reasoning shouldn't claim a level.
      // "education: master" / "education: bachelor" must NOT appear.
      expect(result!.reasoning).not.toMatch(
        /education: (master|bachelor|high_school|phd)/,
      );
    });
  });
});
