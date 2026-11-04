// ============================================================
// GET /api/admin/research-quality — contract tests
// Verifies admin gating, issue aggregation via the shared validation
// rules, and multi-record user email enrichment.
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: { INTERNAL_ERROR: "INTERNAL_ERROR" },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/db/research-data-quality", () => ({
  getResearchChainRows: vi.fn(),
}));
vi.mock("@/lib/db/research-metrics", () => ({
  getMultiRecordUsers: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getResearchChainRows } from "@/lib/db/research-data-quality";
import { getMultiRecordUsers } from "@/lib/db/research-metrics";
import type { ResearchChainRow } from "@/lib/research/thesis-validation";

function allowAdmin() {
  vi.mocked(guardRoute).mockResolvedValue({
    blocked: false,
    user: { id: "admin-1", isAdmin: true },
  } as unknown as Awaited<ReturnType<typeof guardRoute>>);
}

function blockGuard(status = 403) {
  vi.mocked(guardRoute).mockResolvedValue({
    blocked: true,
    response: new Response("Forbidden", { status }),
  } as unknown as Awaited<ReturnType<typeof guardRoute>>);
}

function chainRow(overrides: Partial<ResearchChainRow> = {}): ResearchChainRow {
  return {
    userId: "u1",
    email: "p1@example.com",
    researchGroup: "classic",
    researchConsentAt: "2026-05-01T00:00:00.000Z",
    hasConsentRecord: true,
    hasActiveConsentRecord: true,
    isAdmin: false,
    t0At: "2026-05-01T01:00:00.000Z",
    t1At: "2026-05-02T00:00:00.000Z",
    t2At: "2026-05-10T00:00:00.000Z",
    coachingSessionCount: 1,
    reminderLogStatus: "none",
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/research-quality", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    const res = await handler(
      new Request("http://localhost/api/admin/research-quality"),
    );
    expect(res.status).toBe(403);
  });

  it("aggregates issues with the shared validation rules", async () => {
    allowAdmin();
    vi.mocked(getResearchChainRows).mockResolvedValue([
      chainRow(), // clean participant
      // consent timestamp without audit row → error
      chainRow({
        userId: "u2",
        email: "p2@example.com",
        hasConsentRecord: false,
        hasActiveConsentRecord: false,
        t0At: null,
        t1At: null,
        t2At: null,
      }),
    ]);
    vi.mocked(getMultiRecordUsers).mockResolvedValue([]);

    const res = await handler(
      new Request("http://localhost/api/admin/research-quality"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.summary.totalResearch).toBe(2);
    expect(json.summary.fullChain).toBe(1);
    expect(json.errorCount).toBeGreaterThanOrEqual(1);
    const consentIssue = json.issues.find(
      (i: { userId: string; category: string }) =>
        i.userId === "u2" && i.category === "research-consent",
    );
    expect(consentIssue).toBeTruthy();
    expect(consentIssue.severity).toBe("error");
  });

  it("enriches multi-record users with emails from chain rows", async () => {
    allowAdmin();
    vi.mocked(getResearchChainRows).mockResolvedValue([chainRow()]);
    vi.mocked(getMultiRecordUsers).mockResolvedValue([
      { userId: "u1", assessmentType: "pre", count: 2 },
    ]);

    const res = await handler(
      new Request("http://localhost/api/admin/research-quality"),
    );
    const json = await res.json();
    expect(json.multiRecordUsers).toEqual([
      {
        userId: "u1",
        assessmentType: "pre",
        count: 2,
        email: "p1@example.com",
      },
    ]);
  });

  it("returns 500 when the DB layer throws", async () => {
    allowAdmin();
    vi.mocked(getResearchChainRows).mockRejectedValue(new Error("db down"));
    vi.mocked(getMultiRecordUsers).mockResolvedValue([]);

    const res = await handler(
      new Request("http://localhost/api/admin/research-quality"),
    );
    expect(res.status).toBe(500);
  });
});
