import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const captureMessage = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  captureMessage: (...args: unknown[]) => captureMessage(...args),
}));

import {
  enforceOutputLocale,
  buildRegeneratePrompt,
  extractProperNouns,
} from "../language-guard";

const ENV_BACKUP = process.env.LANGUAGE_GUARD_DISABLED;

beforeEach(() => {
  captureMessage.mockClear();
  delete process.env.LANGUAGE_GUARD_DISABLED;
});

afterEach(() => {
  if (ENV_BACKUP === undefined) {
    delete process.env.LANGUAGE_GUARD_DISABLED;
  } else {
    process.env.LANGUAGE_GUARD_DISABLED = ENV_BACKUP;
  }
});

describe("enforceOutputLocale", () => {
  it("returns output untouched when fully valid", async () => {
    const output = { msg: "Valid English content here." };
    const regenerate = vi.fn();
    const sanitize = vi.fn();

    const result = await enforceOutputLocale(output, "en", {
      taskId: "test-task",
      regenerate,
      sanitize,
    });

    expect(result).toBe(output);
    expect(regenerate).not.toHaveBeenCalled();
    expect(sanitize).not.toHaveBeenCalled();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("invokes regenerate when pass-1 detects mismatch", async () => {
    const bad = { tip: "签证策略：确保寻找的职位不需要签证赞助。" };
    const good = {
      tip: "Visa strategy: ensure roles do not require sponsorship.",
    };
    const regenerate = vi.fn().mockResolvedValue(good);

    const result = await enforceOutputLocale(bad, "en", {
      taskId: "test-task",
      regenerate,
    });

    expect(regenerate).toHaveBeenCalledTimes(1);
    expect(result).toEqual(good);
    // One Sentry warning for pass1 only (pass2 succeeded)
    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(captureMessage.mock.calls[0][1]).toMatchObject({
      level: "warning",
      tags: expect.objectContaining({
        task: "test-task",
        targetLocale: "en",
        guardPhase: "pass1",
      }),
    });
  });

  it("invokes sanitize when regenerate still returns mismatched output", async () => {
    const bad = { tip: "签证策略：确保寻找的职位不需要签证赞助。" };
    const stillBad = { tip: "签证策略：另一种说法但依然是中文。" };
    const sanitized = { tip: "" };
    const regenerate = vi.fn().mockResolvedValue(stillBad);
    const sanitize = vi.fn().mockReturnValue(sanitized);

    const result = await enforceOutputLocale(bad, "en", {
      taskId: "test-task",
      regenerate,
      sanitize,
    });

    expect(regenerate).toHaveBeenCalledTimes(1);
    expect(sanitize).toHaveBeenCalledTimes(1);
    expect(result).toEqual(sanitized);
    // Two Sentry events: pass1 warning + pass2 error
    expect(captureMessage).toHaveBeenCalledTimes(2);
    expect(captureMessage.mock.calls[1][1]).toMatchObject({
      level: "error",
      tags: expect.objectContaining({ guardPhase: "pass2" }),
    });
  });

  it("sanitizes original output when no regenerate hook", async () => {
    const bad = { tip: "签证策略：确保寻找的职位不需要签证赞助。" };
    const sanitized = { tip: "" };
    const sanitize = vi.fn().mockReturnValue(sanitized);

    const result = await enforceOutputLocale(bad, "en", {
      taskId: "test-task",
      sanitize,
    });

    expect(sanitize).toHaveBeenCalledTimes(1);
    expect(result).toEqual(sanitized);
    expect(captureMessage).toHaveBeenCalledTimes(1);
  });

  it("falls through to sanitize when regenerate returns null", async () => {
    const bad = { tip: "签证策略：确保寻找的职位不需要签证赞助。" };
    const sanitize = vi.fn().mockReturnValue({ tip: "" });
    const regenerate = vi.fn().mockResolvedValue(null);

    await enforceOutputLocale(bad, "en", {
      taskId: "test-task",
      regenerate,
      sanitize,
    });

    expect(regenerate).toHaveBeenCalledTimes(1);
    expect(sanitize).toHaveBeenCalledTimes(1);
  });

  it("respects LANGUAGE_GUARD_DISABLED env flag", async () => {
    process.env.LANGUAGE_GUARD_DISABLED = "1";

    const bad = { tip: "签证策略：确保寻找的职位不需要签证赞助。" };
    const regenerate = vi.fn();
    const sanitize = vi.fn();

    const result = await enforceOutputLocale(bad, "en", {
      taskId: "test-task",
      regenerate,
      sanitize,
    });

    expect(result).toBe(bad);
    expect(regenerate).not.toHaveBeenCalled();
    expect(sanitize).not.toHaveBeenCalled();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it("applies whitelistPhrases to avoid false positives", async () => {
    const output = { tip: "Look for roles based in 北京 that match." };
    const regenerate = vi.fn();

    const result = await enforceOutputLocale(output, "en", {
      taskId: "test-task",
      whitelistPhrases: ["北京"],
      regenerate,
    });

    expect(result).toBe(output);
    expect(regenerate).not.toHaveBeenCalled();
  });
});

describe("buildRegeneratePrompt", () => {
  it("appends explicit retry context with mismatched fields", () => {
    const result = buildRegeneratePrompt({
      originalPrompt: "Generate career pathway for user.",
      langName: "English",
      foundMismatchFields: [
        "jobSearchStrategy.constraintStrategies[0].constraint",
        "jobSearchStrategy.constraintStrategies[0].strategy",
      ],
    });

    expect(result).toContain("Generate career pathway for user.");
    expect(result).toContain("CRITICAL LANGUAGE RETRY CONTEXT");
    expect(result).toContain("English");
    expect(result).toContain("constraintStrategies[0].constraint");
  });
});

describe("extractProperNouns", () => {
  it("collects cities, industries, fields", () => {
    const nouns = extractProperNouns({
      education: { level: "bachelor", field: "Computer Science" },
      experienceYears: 5,
      pastIndustries: ["FinTech", "EdTech"],
      currentCity: "Amsterdam",
      targetCities: ["New York", "San Francisco"],
      visaStatus: "",
      workRestrictions: {
        canWorkFullTime: true,
        sponsorshipRequired: false,
        occupationRestricted: false,
      },
      workLanguages: [],
      locationFlexibility: "open",
      familyConstraints: {
        hasPartner: false,
        partnerWorkRestriction: false,
        hasDependents: false,
      },
      economicConstraints: { canRelocate: true, willingToRetrain: true },
      salaryRange: { min: 0, max: 0, currency: "USD" },
      workType: "full_time",
      officeMode: "hybrid",
      interestedIndustries: ["AI"],
      openToCareerChange: "yes",
    } as never);

    expect(nouns).toContain("Amsterdam");
    expect(nouns).toContain("New York");
    expect(nouns).toContain("FinTech");
    expect(nouns).toContain("EdTech");
    expect(nouns).toContain("Computer Science");
    expect(nouns).toContain("AI");
  });

  it("returns empty array for null/undefined", () => {
    expect(extractProperNouns(null)).toEqual([]);
    expect(extractProperNouns(undefined)).toEqual([]);
  });

  it("filters empty strings", () => {
    const nouns = extractProperNouns({
      education: { level: "bachelor", field: "" },
      experienceYears: 0,
      pastIndustries: ["", "FinTech"],
      currentCity: "",
      targetCities: [],
      visaStatus: "",
      workRestrictions: {
        canWorkFullTime: true,
        sponsorshipRequired: false,
        occupationRestricted: false,
      },
      workLanguages: [],
      locationFlexibility: "open",
      familyConstraints: {
        hasPartner: false,
        partnerWorkRestriction: false,
        hasDependents: false,
      },
      economicConstraints: { canRelocate: true, willingToRetrain: true },
      salaryRange: { min: 0, max: 0, currency: "USD" },
      workType: "full_time",
      officeMode: "hybrid",
      interestedIndustries: [],
      openToCareerChange: "no",
    } as never);

    expect(nouns).toEqual(["FinTech"]);
  });
});
