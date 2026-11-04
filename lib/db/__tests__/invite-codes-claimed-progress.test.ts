// ============================================================
// getClaimedUsersProgress — SQL shape + row-mapping regression tests
//
// Captures the SQL template emitted by getClaimedUsersProgress (without a real
// DB) and asserts:
//   - empty input short-circuits to [] with NO query
//   - the query touches all four pipeline tables + derives furthest step
//   - it intentionally has NO research-consent gate (beta users are included)
//   - rows map straight through to {userId, email, furthestStep}
//
// Mock pattern mirrors lib/db/__tests__/research-consent-gate.test.ts.
// ============================================================

import { describe, expect, it, beforeEach, vi } from "vitest";

const capturedTemplates: string[][] = [];

vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => {
    capturedTemplates.push([...strings]);
    return Promise.resolve([] as unknown[]);
  }),
}));

import { getClaimedUsersProgress } from "@/lib/db/invite-codes";

beforeEach(() => {
  capturedTemplates.length = 0;
  vi.clearAllMocks();
});

function joinedSql(): string {
  return capturedTemplates.flat().join(" ");
}

describe("getClaimedUsersProgress", () => {
  it("returns [] and issues no query for empty input", async () => {
    const result = await getClaimedUsersProgress([]);
    expect(result).toEqual([]);
    expect(capturedTemplates).toHaveLength(0);
  });

  it("queries all four pipeline tables and derives the furthest step", async () => {
    await getClaimedUsersProgress(["u1", "u2"]);
    const sql = joinedSql();
    expect(sql).toContain('"QuickDiveResult"');
    expect(sql).toContain('"QuestionnaireSession"');
    expect(sql).toContain('"CareerReport"');
    expect(sql).toContain('"CoachingSession"');
    expect(sql).toContain("CASE");
    expect(sql).toContain("= ANY(");
  });

  it("selects account identity + recruitment metadata columns", async () => {
    await getClaimedUsersProgress(["u1"]);
    const sql = joinedSql();
    expect(sql).toContain('u."name"');
    expect(sql).toContain('u."createdAt"');
    expect(sql).toContain('u."updatedAt"');
    expect(sql).toContain('"registrationCountry"');
    expect(sql).toContain('"language"');
  });

  it("derives language from the most recent assessment, not a fixed table priority", async () => {
    // Regression guard: language must come from UNION ALL of both assessment
    // tables ordered by recency — NOT COALESCE(QuickDive, DeepDive), which would
    // always prefer Quick Dive even when a later Deep Dive used another language.
    await getClaimedUsersProgress(["u1"]);
    const sql = joinedSql();
    expect(sql).toContain("UNION ALL");
    expect(sql).toContain('ORDER BY a."createdAt" DESC');
    expect(sql).not.toContain("COALESCE");
  });

  it("does NOT apply a research-consent gate (beta users must be included)", async () => {
    await getClaimedUsersProgress(["u1"]);
    const sql = joinedSql();
    expect(sql).not.toContain("researchConsentAt");
    expect(sql).not.toContain("researchGroup");
  });

  it("maps each row to the full ClaimedUserProgress shape (ISO-normalized dates)", async () => {
    const { sql: sqlMock } = await import("@/lib/db/connection");
    const mocked = vi.mocked(sqlMock as unknown as ReturnType<typeof vi.fn>);
    mocked.mockImplementationOnce(
      (strings: TemplateStringsArray, ..._values: unknown[]) => {
        capturedTemplates.push([...strings]);
        return Promise.resolve([
          {
            userId: "u1",
            email: "a@x.com",
            name: "Ann",
            furthestStep: "report",
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: "2026-06-02T00:00:00.000Z",
            country: "NL",
            language: "en",
          },
          {
            userId: "u2",
            email: "b@x.com",
            name: null,
            furthestStep: "registered",
            createdAt: "2026-06-03T00:00:00.000Z",
            updatedAt: "2026-06-03T00:00:00.000Z",
            country: null,
            language: null,
          },
        ] as unknown[]);
      },
    );
    const result = await getClaimedUsersProgress(["u1", "u2"]);
    expect(result).toEqual([
      {
        userId: "u1",
        email: "a@x.com",
        name: "Ann",
        furthestStep: "report",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-02T00:00:00.000Z",
        country: "NL",
        language: "en",
      },
      {
        userId: "u2",
        email: "b@x.com",
        name: null,
        furthestStep: "registered",
        createdAt: "2026-06-03T00:00:00.000Z",
        updatedAt: "2026-06-03T00:00:00.000Z",
        country: null,
        language: null,
      },
    ]);
  });

  it("drops non-string / empty ids leaked from a legacy object row", async () => {
    // A legacy InviteCode with claimedByUserIds={} flatMaps into a bare {} —
    // it must not reach the SQL param. Valid ids still drive the query.
    await getClaimedUsersProgress(["u1", {} as unknown as string, "", "u2"]);
    expect(joinedSql()).toContain("= ANY(");
  });

  it("returns [] with no query when every id is junk", async () => {
    const result = await getClaimedUsersProgress([{} as unknown as string, ""]);
    expect(result).toEqual([]);
    expect(capturedTemplates).toHaveLength(0);
  });
});
