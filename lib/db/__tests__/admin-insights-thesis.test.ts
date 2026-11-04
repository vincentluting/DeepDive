// ============================================================
// admin-insights thesis precision — SQL invariants & dedupe logic
//
// Locks the 2026-06 precision fixes:
//   - getResearchGroupComparison: person-level metrics on the canonical
//     research population (no session/report row multiplication)
//   - getArchetypeDistribution: one archetype per unique identity
//   - getCompletionTimeDistribution: researchOnly population gate
//   - getPrePostPairedData: flat rows from canonical pairs (postType kept)
// ============================================================

import { describe, expect, it, beforeEach, vi } from "vitest";

const capturedTemplates: string[][] = [];
const queuedResults: unknown[][] = [];

vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => {
    capturedTemplates.push([...strings]);
    return Promise.resolve(queuedResults.shift() ?? []);
  }),
}));

vi.mock("@/lib/db/research-metrics", () => ({
  getPairedSccData: vi.fn(),
}));

import {
  getResearchGroupComparison,
  getCompletionTimeDistribution,
  getPrePostPairedData,
  getArchetypeDistribution,
  dedupeArchetypeRecords,
} from "@/lib/db/admin-insights";
import { getPairedSccData } from "@/lib/db/research-metrics";

beforeEach(() => {
  capturedTemplates.length = 0;
  queuedResults.length = 0;
  vi.clearAllMocks();
});

function joinedSql(): string {
  return capturedTemplates.flat().join(" ");
}

describe("getResearchGroupComparison — person-level canonical population", () => {
  it("emits population gate (consent + not withdrawn + non-admin) on all three queries", async () => {
    await getResearchGroupComparison();
    const sql = joinedSql();
    // Population clauses appear in each of the 3 parallel queries
    const withdrawnCount = (sql.match(/"withdrawnAt" IS NULL/g) || []).length;
    expect(withdrawnCount).toBeGreaterThanOrEqual(3);
    expect(sql).toContain('"researchConsentAt" IS NOT NULL');
    expect(sql).toContain('"isAdmin" = FALSE');
  });

  it("counts completion per person via first completed quick session", async () => {
    await getResearchGroupComparison();
    const sql = joinedSql();
    expect(sql).toContain("first_completed_quick");
    expect(sql).toContain("DISTINCT ON");
    // first completed session = earliest createdAt
    expect(sql).toContain('ORDER BY qs."userId", qs."createdAt" ASC');
  });

  it("takes each user's latest NPS directly (no CareerReport row multiplication)", async () => {
    await getResearchGroupComparison();
    const sql = joinedSql();
    // NPS joined via LATERAL on userId with LIMIT 1 — not through CareerReport
    expect(sql).not.toContain('JOIN "CareerReport"');
    expect(sql).toContain('"ReportNPS"');
    expect(sql).toContain("LIMIT 1");
  });
});

describe("getCompletionTimeDistribution — researchOnly gate", () => {
  it("includes the population gate clauses when researchOnly is requested", async () => {
    await getCompletionTimeDistribution({ researchOnly: true });
    const sql = joinedSql();
    expect(sql).toContain('"researchGroup" IS NOT NULL');
    expect(sql).toContain('"withdrawnAt" IS NULL');
  });
});

describe("getPrePostPairedData — flat rows from canonical pairs", () => {
  it("maps t0t1/t0t2 pairs to rows tagged with postType", async () => {
    vi.mocked(getPairedSccData).mockResolvedValue({
      t0t1: [{ userId: "u1", pre: 10, post: 20 }],
      t0t2: [{ userId: "u1", pre: 10, post: 30 }],
      multiRecordUsers: [],
    });

    const rows = await getPrePostPairedData();
    expect(rows).toEqual([
      { userId: "u1", sccPre: 10, sccPost: 20, postType: "post_immediate" },
      { userId: "u1", sccPre: 10, sccPost: 30, postType: "post_1week" },
    ]);
  });
});

describe("dedupeArchetypeRecords — one archetype per identity", () => {
  it("counts a user with quick + report ONCE, report wins", () => {
    const result = dedupeArchetypeRecords([
      {
        identity: "u1",
        archetype: "Explorer",
        source: "quick",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        identity: "u1",
        archetype: "Architect",
        source: "report",
        createdAt: "2026-01-05T00:00:00Z",
      },
    ]);
    expect(result).toEqual([{ archetype: "Architect", count: 1 }]);
  });

  it("report wins even when the quick record is newer", () => {
    const result = dedupeArchetypeRecords([
      {
        identity: "u1",
        archetype: "Architect",
        source: "report",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        identity: "u1",
        archetype: "Explorer",
        source: "quick",
        createdAt: "2026-02-01T00:00:00Z",
      },
    ]);
    expect(result).toEqual([{ archetype: "Architect", count: 1 }]);
  });

  it("within the same source, the latest record wins", () => {
    const result = dedupeArchetypeRecords([
      {
        identity: "u1",
        archetype: "Explorer",
        source: "quick",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        identity: "u1",
        archetype: "Mentor",
        source: "quick",
        createdAt: "2026-01-09T00:00:00Z",
      },
    ]);
    expect(result).toEqual([{ archetype: "Mentor", count: 1 }]);
  });

  it("distinct anonymous identities count separately", () => {
    const result = dedupeArchetypeRecords([
      {
        identity: "anon:a",
        archetype: "Explorer",
        source: "quick",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        identity: "anon:b",
        archetype: "Explorer",
        source: "quick",
        createdAt: "2026-01-02T00:00:00Z",
      },
    ]);
    expect(result).toEqual([{ archetype: "Explorer", count: 2 }]);
  });
});

describe("getArchetypeDistribution — end-to-end dedupe", () => {
  it("a user with both a report and quick dives counts once", async () => {
    // First query: CareerReport rows; second: QuickDiveResult rows
    queuedResults.push(
      [
        {
          userId: "u1",
          reportJson: JSON.stringify({ archetype_label: "Architect" }),
          createdAt: "2026-01-05T00:00:00Z",
        },
      ],
      [
        {
          userId: "u1",
          anonymousId: null,
          id: "q1",
          archetypeLabel: "Explorer",
          createdAt: "2026-01-01T00:00:00Z",
        },
        {
          userId: null,
          anonymousId: "anon-7",
          id: "q2",
          archetypeLabel: "Explorer",
          createdAt: "2026-01-02T00:00:00Z",
        },
      ],
    );

    const result = await getArchetypeDistribution();
    // u1 → Architect (report wins); anon-7 → Explorer
    expect(result).toContainEqual({ archetype: "Architect", count: 1 });
    expect(result).toContainEqual({ archetype: "Explorer", count: 1 });
    const total = result.reduce((s, r) => s + r.count, 0);
    expect(total).toBe(2); // NOT 3 — the old double-count bug
  });
});
