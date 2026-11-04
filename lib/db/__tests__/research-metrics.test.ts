// ============================================================
// research-metrics — canonical population gate + row mapping
//
// lib/db/research-metrics.ts is THE single source of the thesis
// population definition. These tests lock its four clauses:
//   researchGroup IS NOT NULL / researchConsentAt IS NOT NULL /
//   isAdmin = FALSE / EXISTS active ConsentRecord (withdrawnAt IS NULL)
// ============================================================

import { describe, expect, it, beforeEach, vi } from "vitest";

const capturedTemplates: string[][] = [];
let nextRows: unknown[] = [];

vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => {
    capturedTemplates.push([...strings]);
    const rows = nextRows;
    nextRows = [];
    return Promise.resolve(rows);
  }),
}));

import {
  getResearchPrePostRows,
  getPairedSccData,
} from "@/lib/db/research-metrics";

beforeEach(() => {
  capturedTemplates.length = 0;
  nextRows = [];
});

function joinedSql(): string {
  return capturedTemplates.flat().join(" ");
}

describe("getResearchPrePostRows — canonical population gate", () => {
  it("emits all four population clauses", async () => {
    await getResearchPrePostRows();
    const sql = joinedSql();
    expect(sql).toContain('"researchGroup" IS NOT NULL');
    expect(sql).toContain('"researchConsentAt" IS NOT NULL');
    expect(sql).toContain('"isAdmin" = FALSE');
    expect(sql).toContain('"ConsentRecord"');
    expect(sql).toContain('"withdrawnAt" IS NULL');
  });

  it("maps numeric strings and Date timestamps to typed rows", async () => {
    nextRows = [
      {
        userId: "u1",
        assessmentType: "pre",
        sccTotalScore: "32.50", // NUMERIC arrives as string
        cdseTotalScore: null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    ];
    const rows = await getResearchPrePostRows();
    expect(rows).toEqual([
      {
        userId: "u1",
        assessmentType: "pre",
        sccTotalScore: 32.5,
        cdseTotalScore: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });
});

describe("getPairedSccData — end-to-end canonical pairing", () => {
  it("collapses a multi-record user to one pair per window and flags them", async () => {
    nextRows = [
      // 2× pre (canonical = earliest) + 2× post_immediate (canonical = latest)
      {
        userId: "u1",
        assessmentType: "pre",
        sccTotalScore: "10",
        cdseTotalScore: null,
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        userId: "u1",
        assessmentType: "pre",
        sccTotalScore: "99",
        cdseTotalScore: null,
        createdAt: "2026-01-03T00:00:00Z",
      },
      {
        userId: "u1",
        assessmentType: "post_immediate",
        sccTotalScore: "20",
        cdseTotalScore: null,
        createdAt: "2026-01-10T00:00:00Z",
      },
      {
        userId: "u1",
        assessmentType: "post_immediate",
        sccTotalScore: "22",
        cdseTotalScore: null,
        createdAt: "2026-01-11T00:00:00Z",
      },
    ];

    const { t0t1, t0t2, multiRecordUsers } = await getPairedSccData();
    expect(t0t1).toEqual([{ userId: "u1", pre: 10, post: 22 }]);
    expect(t0t2).toEqual([]);
    expect(multiRecordUsers).toHaveLength(2); // pre ×2, post_immediate ×2
  });
});
