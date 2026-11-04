// ============================================================
// Research export consent gate — SQL invariant regression tests
//
// Every research-export DB function MUST filter on
//   u."researchGroup" IS NOT NULL AND u."researchConsentAt" IS NOT NULL
// so that thesis exports never leak non-consented platform users.
//
// These tests capture the actual SQL emitted by each function and assert
// the consent filter is present. If a future refactor accidentally drops
// the filter (e.g. someone "simplifies" a WHERE clause), these tests fail
// before the bad code reaches production.
//
// Coverage:
//   - getThesisExportData (full dataset + count via single query)
//   - getResearchExportData (Quick Dive item-level)
//   - getResearchExportCount (Quick Dive count)
//   - getDeepDiveExportData (Deep Dive item-level — 4 date-filter branches)
//   - getDeepDiveExportCount (Deep Dive count — 4 date-filter branches)
//   - getResearchParticipantProgress (research progress tracking)
//
// Pattern: mock `sql` from @/lib/db/connection to capture template strings
// without hitting any real DB. See lib/db/__tests__/pipeline-backoff-sql.test.ts
// for the original example of this pattern.
// ============================================================

import { describe, expect, it, beforeEach, vi } from "vitest";

const capturedTemplates: string[][] = [];

vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => {
    capturedTemplates.push([...strings]);
    // Return empty rows so callers take their "no data" code path safely.
    return Promise.resolve([] as unknown[]);
  }),
}));

import { getThesisExportData } from "@/lib/db/admin-thesis-export";
import {
  getResearchExportData,
  getResearchExportCount,
} from "@/lib/db/admin-research-export";
import {
  getDeepDiveExportData,
  getDeepDiveExportCount,
} from "@/lib/db/admin-deepdive-export";
import { getResearchParticipantProgress } from "@/lib/db/research-progress";

beforeEach(() => {
  capturedTemplates.length = 0;
});

function joinedSql(): string {
  return capturedTemplates.flat().join(" ");
}

function expectConsentGate(sql: string): void {
  // The two consent gate clauses, written exactly as they appear in the
  // production SQL. Substring matching on the joined template — the gaps
  // between substrings hold parameter placeholders, so we look for the
  // verbatim filter text.
  expect(sql).toContain('"researchGroup" IS NOT NULL');
  expect(sql).toContain('"researchConsentAt" IS NOT NULL');
}

describe("Research export consent gate — getThesisExportData", () => {
  it("emits SQL with consent filter on default call", async () => {
    await getThesisExportData();
    expectConsentGate(joinedSql());
  });

  it("retains consent filter even with includeAllUsers=true (bypass via OR clause)", async () => {
    await getThesisExportData({ includeAllUsers: true });
    // The bypass works at runtime via boolean OR; the SQL itself MUST still
    // contain the gate so a future refactor can't accidentally remove the
    // safety branch and silently leak non-consented data.
    expectConsentGate(joinedSql());
  });

  it("retains consent filter when date range is applied", async () => {
    await getThesisExportData({
      from: "2026-01-01T00:00:00Z",
      to: "2026-02-01T00:00:00Z",
    });
    expectConsentGate(joinedSql());
  });

  it("emits SQL that selects attn_check_1 from T1 experienceFeedback JSONB", async () => {
    await getThesisExportData();
    const sql = joinedSql();
    // Verbatim cast pattern from admin-thesis-export.ts:
    //   (pp_imm."experienceFeedback"->>'attn_check_1')::numeric AS "attn_check_1"
    expect(sql).toContain("'attn_check_1'");
    expect(sql).toContain('AS "attn_check_1"');
  });
});

describe("getThesisExportData — attn_check mapping (row → output)", () => {
  it("maps attn_check_1=4 to attn_check_passed=true", async () => {
    const { sql: sqlMock } = await import("@/lib/db/connection");
    const mocked = vi.mocked(sqlMock as unknown as ReturnType<typeof vi.fn>);
    // One-shot override: return a single row representing a T1 attention-pass.
    mocked.mockImplementationOnce(
      (strings: TemplateStringsArray, ..._values: unknown[]) => {
        capturedTemplates.push([...strings]);
        return Promise.resolve([
          {
            email: "attn-mapping-test@deepdive.local",
            researchGroup: "classic",
            attn_check_1: "4",
            // Minimal other required columns so mapping doesn't crash on nulls:
            // every field in admin-thesis-export.ts mapping treats null/undefined
            // via `!= null` guards, so undefined is safe.
          },
        ] as unknown[]);
      },
    );
    const rows = await getThesisExportData();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.attn_check_1).toBe(4);
    expect(rows[0]?.attn_check_passed).toBe(true);
  });

  it("maps attn_check_1=2 (failed) to attn_check_passed=false", async () => {
    const { sql: sqlMock } = await import("@/lib/db/connection");
    const mocked = vi.mocked(sqlMock as unknown as ReturnType<typeof vi.fn>);
    mocked.mockImplementationOnce(
      (strings: TemplateStringsArray, ..._values: unknown[]) => {
        capturedTemplates.push([...strings]);
        return Promise.resolve([
          {
            email: "attn-fail-test@deepdive.local",
            researchGroup: "classic",
            attn_check_1: "2",
          },
        ] as unknown[]);
      },
    );
    const rows = await getThesisExportData();
    expect(rows[0]?.attn_check_1).toBe(2);
    expect(rows[0]?.attn_check_passed).toBe(false);
  });

  it("maps attn_check_1=null (T1 not reached) to both fields null", async () => {
    const { sql: sqlMock } = await import("@/lib/db/connection");
    const mocked = vi.mocked(sqlMock as unknown as ReturnType<typeof vi.fn>);
    mocked.mockImplementationOnce(
      (strings: TemplateStringsArray, ..._values: unknown[]) => {
        capturedTemplates.push([...strings]);
        return Promise.resolve([
          {
            email: "attn-null-test@deepdive.local",
            researchGroup: "classic",
            attn_check_1: null,
          },
        ] as unknown[]);
      },
    );
    const rows = await getThesisExportData();
    expect(rows[0]?.attn_check_1).toBeNull();
    expect(rows[0]?.attn_check_passed).toBeNull();
  });
});

describe("Research export consent gate — getResearchExportData (Quick Dive)", () => {
  it("emits SQL with consent filter", async () => {
    await getResearchExportData({ mode: "all" });
    expectConsentGate(joinedSql());
  });

  it("retains consent filter when mode and date range are set", async () => {
    await getResearchExportData({
      mode: "classic",
      from: "2026-01-01T00:00:00Z",
      to: "2026-02-01T00:00:00Z",
    });
    expectConsentGate(joinedSql());
  });
});

describe("Research export consent gate — getResearchExportCount (Quick Dive)", () => {
  it("emits count SQL with consent filter", async () => {
    await getResearchExportCount({ mode: "all" });
    expectConsentGate(joinedSql());
  });

  it("retains consent filter when filtering by date range", async () => {
    await getResearchExportCount({
      mode: "all",
      from: "2026-01-01T00:00:00Z",
      to: "2026-02-01T00:00:00Z",
    });
    expectConsentGate(joinedSql());
  });
});

describe("Research export consent gate — getDeepDiveExportData (Deep Dive)", () => {
  // Deep Dive has four SQL branches (no-filter / from-only / to-only / both).
  // Each branch must have its own consent gate.
  it("no-filter branch has consent gate", async () => {
    await getDeepDiveExportData({});
    expectConsentGate(joinedSql());
  });

  it("from-only branch has consent gate", async () => {
    await getDeepDiveExportData({ from: "2026-01-01T00:00:00Z" });
    expectConsentGate(joinedSql());
  });

  it("to-only branch has consent gate", async () => {
    await getDeepDiveExportData({ to: "2026-02-01T00:00:00Z" });
    expectConsentGate(joinedSql());
  });

  it("from-and-to branch has consent gate", async () => {
    await getDeepDiveExportData({
      from: "2026-01-01T00:00:00Z",
      to: "2026-02-01T00:00:00Z",
    });
    expectConsentGate(joinedSql());
  });
});

describe("Research export consent gate — getDeepDiveExportCount (Deep Dive)", () => {
  it("no-filter branch has consent gate", async () => {
    await getDeepDiveExportCount({});
    expectConsentGate(joinedSql());
  });

  it("from-only branch has consent gate", async () => {
    await getDeepDiveExportCount({ from: "2026-01-01T00:00:00Z" });
    expectConsentGate(joinedSql());
  });

  it("to-only branch has consent gate", async () => {
    await getDeepDiveExportCount({ to: "2026-02-01T00:00:00Z" });
    expectConsentGate(joinedSql());
  });

  it("from-and-to branch has consent gate", async () => {
    await getDeepDiveExportCount({
      from: "2026-01-01T00:00:00Z",
      to: "2026-02-01T00:00:00Z",
    });
    expectConsentGate(joinedSql());
  });
});

describe("Withdrawn-consent gate — canonical population (2026-06 fix)", () => {
  // A consent that was later withdrawn must remove the participant from
  // ALL research statistics. The gate is an EXISTS on ConsentRecord with
  // withdrawnAt IS NULL, plus isAdmin = FALSE for test-account hygiene.
  function expectActivePopulationGate(sql: string): void {
    expect(sql).toContain('"ConsentRecord"');
    expect(sql).toContain('"withdrawnAt" IS NULL');
    expect(sql).toContain('"isAdmin" = FALSE');
  }

  it("getThesisExportData excludes withdrawn + admin users", async () => {
    await getThesisExportData();
    expectActivePopulationGate(joinedSql());
  });

  it("getResearchParticipantProgress excludes withdrawn + admin users", async () => {
    await getResearchParticipantProgress();
    expectActivePopulationGate(joinedSql());
  });

  it("getResearchExportData (Quick Dive) excludes withdrawn + admin users", async () => {
    await getResearchExportData({ mode: "all" });
    expectActivePopulationGate(joinedSql());
  });

  it("getResearchExportCount (Quick Dive) excludes withdrawn + admin users", async () => {
    await getResearchExportCount({ mode: "all" });
    expectActivePopulationGate(joinedSql());
  });

  it("getDeepDiveExportData excludes withdrawn + admin users on every date branch", async () => {
    for (const opts of [
      {},
      { from: "2026-01-01T00:00:00Z" },
      { to: "2026-02-01T00:00:00Z" },
      { from: "2026-01-01T00:00:00Z", to: "2026-02-01T00:00:00Z" },
    ]) {
      capturedTemplates.length = 0;
      await getDeepDiveExportData(opts);
      expectActivePopulationGate(joinedSql());
    }
  });

  it("getDeepDiveExportCount excludes withdrawn + admin users on every date branch", async () => {
    for (const opts of [
      {},
      { from: "2026-01-01T00:00:00Z" },
      { to: "2026-02-01T00:00:00Z" },
      { from: "2026-01-01T00:00:00Z", to: "2026-02-01T00:00:00Z" },
    ]) {
      capturedTemplates.length = 0;
      await getDeepDiveExportCount(opts);
      expectActivePopulationGate(joinedSql());
    }
  });

  it("research progress takes FIRST pre record as T0 (canonical baseline)", async () => {
    await getResearchParticipantProgress();
    const sql = joinedSql();
    // pre_test CTE orders ASC (first record); post CTEs stay DESC (latest)
    expect(sql).toContain(`WHERE "assessmentType" = 'pre'
      ORDER BY "userId", "createdAt" ASC`);
  });
});

describe("Research export consent gate — getResearchParticipantProgress", () => {
  it("emits SQL with consent filter", async () => {
    await getResearchParticipantProgress();
    expectConsentGate(joinedSql());
  });

  it("reverse-joins InviteCode so each participant shows their invite code", async () => {
    // Guards the LATERAL join added for the admin invite-code column — if a
    // refactor drops it, the research progress table loses the invite column.
    await getResearchParticipantProgress();
    const sql = joinedSql();
    expect(sql).toContain('"InviteCode"');
    expect(sql).toContain('"claimedByUserIds"');
  });
});
