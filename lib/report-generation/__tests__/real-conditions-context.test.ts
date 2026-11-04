// ============================================================
// Tests: buildRealConditionsContextBlock helper
// Verifies field selection, null fallbacks, locale handling.
// Prompt-contract style (no LLM): asserts text composition only.
// ============================================================

import { describe, it, expect, vi } from "vitest";

// Pass-through sanitize so the test isn't entangled with prompt-injection
// defense behavior — that's already covered in prompt-sanitization tests.
vi.mock("@/lib/ai/prompt-sanitization", () => ({
  sanitizeRealConditions: (c: unknown) => c,
}));

import { buildRealConditionsContextBlock } from "../real-conditions-context";
import type { RealConditions } from "@/lib/types/platform";

function fullRC(overrides: Partial<RealConditions> = {}): RealConditions {
  return {
    education: { level: "master", field: "Computer Science" },
    experienceYears: 7,
    pastIndustries: ["software", "fintech"],
    currentCountry: "NL",
    currentCity: "Amsterdam",
    targetCountry: "NL",
    targetCities: ["Amsterdam", "Rotterdam"],
    visaStatus: "work_visa",
    visaType: "Highly Skilled Migrant",
    workRestrictions: {
      canWorkFullTime: true,
      sponsorshipRequired: true,
      occupationRestricted: false,
    },
    workLanguages: [
      { language: "English", proficiency: "fluent" },
      { language: "Dutch", proficiency: "basic" },
    ],
    locationFlexibility: "stay-local",
    familyConstraints: {
      hasPartner: true,
      partnerWorkRestriction: true,
      hasDependents: false,
    },
    economicConstraints: {
      salaryFloor: "important",
      canRelocate: false,
      willingToRetrain: false,
    },
    salaryRange: { min: 70000, max: 95000, currency: "EUR" },
    workType: "fulltime",
    officeMode: "hybrid",
    interestedIndustries: ["ai", "climate"],
    openToCareerChange: "open",
    industryBackground: "B2B SaaS engineering teams",
    culturalIdentity: {
      externalExpectationPressure: "high",
      externalExpectationNote: "family expects tech-prestige role",
    },
    ...overrides,
  };
}

describe("buildRealConditionsContextBlock — null inputs", () => {
  it("emits a full-mode invitation when RC is null", () => {
    const r = buildRealConditionsContextBlock(null, "en", "full");
    expect(r.provided).toBe(false);
    expect(r.fieldCount).toBe(0);
    expect(r.block).toContain("Real-World Constraints");
    expect(r.block).toContain("not provided");
  });

  it("emits a narrative-mode general-conditional hint when RC is null", () => {
    const r = buildRealConditionsContextBlock(null, "en", "narrative");
    expect(r.provided).toBe(false);
    expect(r.block).toContain("general phrasing");
  });

  it("emits a summary-mode 'no concrete constraints' hint when RC is null", () => {
    const r = buildRealConditionsContextBlock(null, "en", "summary");
    expect(r.provided).toBe(false);
    expect(r.block).toContain("general transition tension");
  });

  it("emits a coaching-mode invitation (round 2-3, not round 1) when RC is null", () => {
    const r = buildRealConditionsContextBlock(null, "en", "coaching");
    expect(r.provided).toBe(false);
    expect(r.block).toContain("rounds 2-3");
    expect(r.block).toMatch(/Do NOT ask in round 1/i);
  });
});

describe("buildRealConditionsContextBlock — full mode (Career Pathway)", () => {
  it("includes visa, sponsorship, family, salary, and external pressure", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "en", "full");
    expect(r.provided).toBe(true);
    expect(r.fieldCount).toBeGreaterThanOrEqual(19);
    expect(r.block).toContain("Visa status: work_visa");
    expect(r.block).toContain("employer visa sponsorship");
    expect(r.block).toContain("Amsterdam");
    expect(r.block).toContain("Has partner/family");
    expect(r.block).toContain("Salary floor importance");
    expect(r.block).toContain("External expectation pressure");
    expect(r.block).toContain("family expects tech-prestige role"); // note injected
  });

  it("the title is the active directive form, NOT the old reference-only form", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "en", "full");
    expect(r.block).toContain(
      "honor these in constraintStrategies and jobDirections",
    );
    expect(r.block).not.toMatch(/reference only.*not instructions/i);
  });

  it("renders the 5 new fields when all are populated", () => {
    const rc = fullRC({
      workRestrictions: {
        canWorkFullTime: true,
        sponsorshipRequired: true,
        occupationRestricted: true,
        occupationNote: "regulated finance roles only",
      },
      salaryRange: { min: 80000, max: 110000, currency: "EUR" },
      currentIndustry: "fintech",
      careerChangeUrgency: "considering",
    });
    const r = buildRealConditionsContextBlock(rc, "en", "full");
    expect(r.block).toContain("Can work full-time: Yes");
    expect(r.block).toMatch(/Occupation restricted.*Yes.*regulated finance/);
    expect(r.block).toContain("Salary range: 80000-110000 EUR");
    // INDUSTRY_MAP maps "fintech" via getIndustryLabelByLocale; we don't hardcode
    // the exact label string (it may evolve), only that the line renders.
    expect(r.block).toMatch(/Current industry: \S+/);
    expect(r.block).toContain("Career change urgency: Actively considering");
    expect(r.fieldCount).toBeGreaterThanOrEqual(22);
  });

  it("omits occupationRestricted line when false (avoids noise)", () => {
    const rc = fullRC({
      workRestrictions: {
        canWorkFullTime: true,
        sponsorshipRequired: false,
        occupationRestricted: false,
      },
    });
    const r = buildRealConditionsContextBlock(rc, "en", "full");
    expect(r.block).not.toMatch(/Occupation restricted/);
  });

  it("omits salaryRange line when min and max are both 0", () => {
    const rc = fullRC({ salaryRange: { min: 0, max: 0, currency: "EUR" } });
    const r = buildRealConditionsContextBlock(rc, "en", "full");
    expect(r.block).not.toMatch(/^- Salary range:/m);
    // salaryFloor line is independent and still rendered
    expect(r.block).toContain("Salary floor importance");
  });

  it("omits currentIndustry and careerChangeUrgency lines when not provided", () => {
    const rc = fullRC(); // base fixture has neither set
    const r = buildRealConditionsContextBlock(rc, "en", "full");
    expect(r.block).not.toMatch(/^- Current industry:/m);
    expect(r.block).not.toMatch(/^- Career change urgency:/m);
  });
});

describe("buildRealConditionsContextBlock — narrative mode (Career Match → Gemini)", () => {
  it("includes low-sensitivity fields in the primary block", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "en", "narrative");
    expect(r.provided).toBe(true);
    expect(r.block).toContain("Amsterdam");
    expect(r.block).toContain("Industries of interest");
    // Salary RANGE (numeric value) must not leak into the primary block —
    // only salary floor importance (critical/important) is exposed via the
    // sensitive sub-block as a categorical signal, not the raw number.
    expect(r.block).not.toContain("70000");
  });

  it("appends a sensitive-constraints sub-block when high-weight signals are present (2026-05-23 audit fix)", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "en", "narrative");
    // Sub-block title with explicit conditional-clause discipline
    expect(r.block).toContain("Sensitive Strategic Thresholds");
    expect(r.block).toContain("conditional clauses only");
    // Each sensitive line includes a value summary AND a "write as e.g."
    // example, so the LLM has both ground-truth and a template that
    // discourages bare field-name copying.
    expect(r.block).toMatch(/write as e\.g\./i);
    // Specific values surface (Visa/Family/Salary/External — all four high-
    // weight signals are present in fullRC fixture).
    expect(r.block).toMatch(/Visa\/work-permit:/);
    expect(r.block).toMatch(/Family:.*partner/);
    expect(r.block).toMatch(/Salary floor: important/);
    expect(r.block).toMatch(/External expectation pressure: high/);
  });

  it("footer pivots to with-sensitive discipline when sensitive sub-block populated", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "en", "narrative");
    // New footer: "paraphrase the impact, never the field name"
    expect(r.block).toMatch(/paraphrase the impact/i);
    expect(r.block).toMatch(/never the field name/i);
  });

  it("footer falls back to no-sensitive generic conditional phrasing when no high-weight constraint present", () => {
    // RC filled, but all sensitive fields at flexible/none level
    const rc = fullRC({
      visaStatus: "citizen",
      workRestrictions: {
        canWorkFullTime: true,
        sponsorshipRequired: false,
        occupationRestricted: false,
      },
      familyConstraints: {
        hasPartner: false,
        partnerWorkRestriction: false,
        hasDependents: false,
      },
      economicConstraints: {
        salaryFloor: "flexible",
        canRelocate: true,
        willingToRetrain: true,
      },
      culturalIdentity: {
        externalExpectationPressure: "low",
      },
    });
    const r = buildRealConditionsContextBlock(rc, "en", "narrative");
    // No sensitive sub-block when nothing registered
    expect(r.block).not.toContain("Sensitive Strategic Thresholds");
    // Generic conditional framing footer (legacy behavior preserved)
    expect(r.block).toMatch(/no high-weight sensitive constraints/i);
    expect(r.block).toMatch(/strategic threshold/i);
  });

  it("zh locale uses Chinese sensitive-block title and footer", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "zh", "narrative");
    expect(r.block).toContain("现实背景");
    // Chinese sensitive sub-block title
    expect(r.block).toContain("敏感策略门槛");
    // Chinese with-sensitive footer wording
    expect(r.block).toMatch(/条件句转译影响/);
  });
});

describe("buildRealConditionsContextBlock — summary mode (Integration letter)", () => {
  it("picks 2-4 high-decision-weight signals", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "en", "summary");
    expect(r.provided).toBe(true);
    expect(r.fieldCount).toBeLessThanOrEqual(4);
    expect(r.fieldCount).toBeGreaterThan(0);
    // For this fixture: visa sponsorship + partner + salary floor + external pressure
    expect(r.block).toMatch(/visa|sponsorship/i);
  });

  it("renders nothing notable when RC carries only weak signals", () => {
    const rc = fullRC({
      visaStatus: "citizen",
      workRestrictions: {
        canWorkFullTime: true,
        sponsorshipRequired: false,
        occupationRestricted: false,
      },
      familyConstraints: {
        hasPartner: false,
        partnerWorkRestriction: false,
        hasDependents: false,
      },
      economicConstraints: {
        salaryFloor: "flexible",
        canRelocate: true,
        willingToRetrain: true,
      },
      culturalIdentity: {
        externalExpectationPressure: "low",
      },
      targetCities: ["Amsterdam"], // matches currentCity, no mismatch fallback
    });
    const r = buildRealConditionsContextBlock(rc, "en", "summary");
    expect(r.provided).toBe(true);
    expect(r.fieldCount).toBe(0);
    // Weak-signal fallback distinguishes "user filled, but all soft" from
    // "user didn't fill at all" (Codex audit 2026-05-18).
    expect(r.block).toContain("no high-decision-weight constraint registered");
    expect(r.block).toContain("flexibility");
  });

  it("does NOT render salary line when salaryFloor is 'flexible'", () => {
    const rc = fullRC({
      economicConstraints: {
        salaryFloor: "flexible",
        canRelocate: true,
        willingToRetrain: true,
      },
    });
    const r = buildRealConditionsContextBlock(rc, "en", "summary");
    expect(r.block).not.toMatch(/salary floor.*flexible/i);
  });
});

describe("buildRealConditionsContextBlock — coaching mode (chat)", () => {
  it("includes a 'DO NOT re-ask' directive when RC is provided", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "en", "coaching");
    expect(r.provided).toBe(true);
    expect(r.block).toMatch(/DO NOT re-ask/i);
    expect(r.block).toContain("ground every suggestion");
  });

  it("includes full field set (the coach needs the most context)", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "en", "coaching");
    expect(r.fieldCount).toBeGreaterThanOrEqual(19);
    expect(r.block).toContain("work_visa");
    expect(r.block).toContain("Amsterdam");
  });
});

describe("buildRealConditionsContextBlock — locale support", () => {
  it("falls back to English title for unknown locale", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "xx", "full");
    expect(r.block).toContain("Real-World Constraints");
  });

  it("zh full mode renders Chinese labels", () => {
    const r = buildRealConditionsContextBlock(fullRC(), "zh", "full");
    expect(r.block).toContain("现实约束");
    expect(r.block).toContain("当前城市");
  });
});
