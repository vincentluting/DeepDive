import { describe, expect, it } from "vitest";
import {
  parseCliArgs,
  displayIdentity,
  validateResearchChain,
  computeResearchSummary,
  type ResearchChainRow,
} from "../verify-thesis-data";

const NOW = new Date("2026-04-24T12:00:00Z").getTime();
const ONE_DAY = 24 * 60 * 60 * 1000;

function row(overrides: Partial<ResearchChainRow> = {}): ResearchChainRow {
  return {
    userId: "11111111-aaaa-bbbb-cccc-222222222222",
    email: "participant@example.com",
    researchGroup: "A",
    researchConsentAt: new Date(NOW - 10 * ONE_DAY).toISOString(),
    hasConsentRecord: true,
    hasActiveConsentRecord: true,
    isAdmin: false,
    t0At: new Date(NOW - 10 * ONE_DAY).toISOString(),
    t1At: new Date(NOW - 8 * ONE_DAY).toISOString(),
    t2At: null,
    coachingSessionCount: 1,
    reminderLogStatus: "none",
    ...overrides,
  };
}

describe("parseCliArgs", () => {
  it("defaults every flag to false (no PII, no research-only)", () => {
    expect(parseCliArgs([])).toEqual({
      verbose: false,
      jsonOutput: false,
      researchOnly: false,
      withPii: false,
    });
  });

  it("sets researchOnly and withPii when flags are present", () => {
    expect(
      parseCliArgs(["--research-only", "--with-pii", "--verbose"]),
    ).toEqual({
      verbose: true,
      jsonOutput: false,
      researchOnly: true,
      withPii: true,
    });
  });
});

describe("displayIdentity", () => {
  it("returns a short user-id by default", () => {
    expect(displayIdentity("abcdef1234", "a@b.com", false)).toBe(
      "user-abcdef12",
    );
  });

  it("returns email only when PII flag is on and email exists", () => {
    expect(displayIdentity("abcdef1234", "a@b.com", true)).toBe("a@b.com");
  });

  it("still masks when email is null even with PII flag", () => {
    expect(displayIdentity("abcdef1234", null, true)).toBe("user-abcdef12");
  });
});

describe("validateResearchChain", () => {
  it("flags audit-evidence missing when only timestamp is set", () => {
    const issues = validateResearchChain(
      row({ hasConsentRecord: false, hasActiveConsentRecord: false }),
      NOW,
    );
    expect(
      issues.some(
        (i) =>
          i.severity === "error" &&
          i.category === "research-consent" &&
          i.message.includes("ConsentRecord audit row"),
      ),
    ).toBe(true);
  });

  it("flags timestamp missing when audit record is active but timestamp is null", () => {
    const issues = validateResearchChain(row({ researchConsentAt: null }), NOW);
    expect(
      issues.some(
        (i) =>
          i.severity === "error" &&
          i.message.includes("researchConsentAt is NULL"),
      ),
    ).toBe(true);
  });

  it("flags T0 without any consent evidence", () => {
    const issues = validateResearchChain(
      row({
        researchConsentAt: null,
        hasConsentRecord: false,
        hasActiveConsentRecord: false,
      }),
      NOW,
    );
    expect(
      issues.some(
        (i) =>
          i.severity === "error" &&
          i.message.includes("no consent evidence found"),
      ),
    ).toBe(true);
  });

  it("flags T1 with no coaching session", () => {
    const issues = validateResearchChain(row({ coachingSessionCount: 0 }), NOW);
    expect(
      issues.some(
        (i) =>
          i.severity === "warning" &&
          i.category === "research-t1" &&
          i.message.includes("never used coaching"),
      ),
    ).toBe(true);
  });

  it("flags invalid T2 recorded before T1+7d", () => {
    const issues = validateResearchChain(
      row({
        t1At: new Date(NOW - 10 * ONE_DAY).toISOString(),
        t2At: new Date(NOW - 7 * ONE_DAY).toISOString(),
      }),
      NOW,
    );
    expect(
      issues.some(
        (i) =>
          i.severity === "error" &&
          i.category === "research-t2" &&
          i.message.includes("sample invalid"),
      ),
    ).toBe(true);
  });

  it("accepts T2 recorded exactly 7 days after T1 (boundary)", () => {
    const t1Ms = NOW - 8 * ONE_DAY;
    const issues = validateResearchChain(
      row({
        t1At: new Date(t1Ms).toISOString(),
        t2At: new Date(t1Ms + 7 * ONE_DAY).toISOString(),
      }),
      NOW,
    );
    expect(
      issues.some(
        (i) => i.category === "research-t2" && i.severity === "error",
      ),
    ).toBe(false);
  });

  it("flags missing reminder log when T1 ≥7d old and T2 missing", () => {
    const issues = validateResearchChain(
      row({
        t1At: new Date(NOW - 8 * ONE_DAY).toISOString(),
        t2At: null,
        reminderLogStatus: "none",
      }),
      NOW,
    );
    expect(
      issues.some(
        (i) =>
          i.severity === "warning" &&
          i.category === "research-reminder" &&
          i.message.includes("no reminder log row"),
      ),
    ).toBe(true);
  });

  it("flags failed reminder as error", () => {
    const issues = validateResearchChain(
      row({
        t1At: new Date(NOW - 8 * ONE_DAY).toISOString(),
        t2At: null,
        reminderLogStatus: "failed",
      }),
      NOW,
    );
    expect(
      issues.some(
        (i) =>
          i.severity === "error" &&
          i.category === "research-reminder" &&
          i.message.includes("reminder send failed"),
      ),
    ).toBe(true);
  });

  it("skips reminder-missing check when T1 is <7d old", () => {
    const issues = validateResearchChain(
      row({
        t1At: new Date(NOW - 5 * ONE_DAY).toISOString(),
        t2At: null,
        reminderLogStatus: "none",
      }),
      NOW,
    );
    expect(issues.some((i) => i.category === "research-reminder")).toBe(false);
  });

  it("returns no issues for a healthy full chain", () => {
    const issues = validateResearchChain(
      row({
        t2At: new Date(NOW - 1 * ONE_DAY).toISOString(),
        t1At: new Date(NOW - 9 * ONE_DAY).toISOString(),
      }),
      NOW,
    );
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });
});

describe("computeResearchSummary", () => {
  it("counts consent/T0/T1/T2/full-chain and flags invalid T2 timing", () => {
    const rows: ResearchChainRow[] = [
      row({ t0At: null, t1At: null, t2At: null, coachingSessionCount: 0 }),
      row({
        userId: "2",
        t2At: new Date(NOW - 1 * ONE_DAY).toISOString(),
        t1At: new Date(NOW - 10 * ONE_DAY).toISOString(),
      }),
      row({
        userId: "3",
        t2At: new Date(NOW - 5 * ONE_DAY).toISOString(),
        t1At: new Date(NOW - 7 * ONE_DAY).toISOString(),
      }),
    ];
    const summary = computeResearchSummary(rows, NOW);
    expect(summary.totalResearch).toBe(3);
    expect(summary.consentedUsers).toBe(3);
    expect(summary.t0Count).toBe(2);
    expect(summary.t1Count).toBe(2);
    expect(summary.t2Count).toBe(2);
    expect(summary.fullChain).toBe(2);
    expect(summary.invalidT2Timing).toBe(1);
  });
});
