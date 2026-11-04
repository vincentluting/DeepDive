import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ───────────────────────────────────────────────────

// vi.hoisted runs before vi.mock hoisting, so mocks are available in the factory
const { sqlMock, getCohortStepsMock } = vi.hoisted(() => ({
  sqlMock: vi.fn().mockResolvedValue([]),
  getCohortStepsMock: vi.fn().mockReturnValue([]),
}));

vi.mock("@/lib/db/connection", () => ({
  sql: new Proxy(sqlMock, {
    // Tagged template literal: sql`...` calls the function with (strings, ...values)
    apply(target, _thisArg, args) {
      return target(...args);
    },
  }),
}));

vi.mock("@/lib/cohort/config", () => ({
  getCohortSteps: getCohortStepsMock,
}));

import { computeCohortProgress } from "../progress";

beforeEach(() => {
  vi.clearAllMocks();
  // Restore defaults after clearAllMocks wipes them
  sqlMock.mockResolvedValue([]);
  getCohortStepsMock.mockReturnValue([]);
});

// ── Tests ───────────────────────────────────────────────────
describe("computeCohortProgress", () => {
  it("returns null for null cohortId", async () => {
    const result = await computeCohortProgress("user-1", null);
    expect(result).toBeNull();
  });

  it("returns null for undefined cohortId", async () => {
    const result = await computeCohortProgress("user-1", undefined);
    expect(result).toBeNull();
  });

  it("returns null when getCohortSteps returns empty array", async () => {
    getCohortStepsMock.mockReturnValue([]);
    const result = await computeCohortProgress("user-1", "cohort-1");
    expect(result).toBeNull();
  });

  it("returns progress object for valid cohortId", async () => {
    getCohortStepsMock.mockReturnValue([
      "pre_assessment",
      "quick_dive",
      "deep_dive",
    ]);

    // Mock SQL responses: prePost, quickDive, deepReport
    sqlMock
      .mockResolvedValueOnce([{ assessmentType: "pre" }]) // prePost
      .mockResolvedValueOnce([{ id: "qd-1" }]) // quickDive
      .mockResolvedValueOnce([]); // deepReport (not yet completed)

    const result = await computeCohortProgress("user-1", "cohort-1");

    expect(result).not.toBeNull();
    expect(result!.cohortId).toBe("cohort-1");
    expect(result!.completedSteps).toContain("pre_assessment");
    expect(result!.completedSteps).toContain("quick_dive");
    expect(result!.completedSteps).not.toContain("deep_dive");
    expect(result!.currentStep).toBe("deep_dive");
    expect(result!.isComplete).toBe(false);
    expect(result!.progressPercent).toBe(67); // 2/3
  });

  describe("Bug #2: SQL queries must NOT reference reportType", () => {
    it("does not include reportType in any SQL query", async () => {
      getCohortStepsMock.mockReturnValue(["quick_dive", "deep_dive"]);

      sqlMock.mockResolvedValue([]);

      await computeCohortProgress("user-1", "cohort-1");

      // Inspect all SQL tagged template calls
      for (const call of sqlMock.mock.calls) {
        const templateStrings = call[0];
        if (Array.isArray(templateStrings)) {
          const fullQuery = templateStrings.join("?");
          expect(fullQuery).not.toContain("reportType");
        }
      }
    });
  });
});
