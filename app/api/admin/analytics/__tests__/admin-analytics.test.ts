import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: { INTERNAL_ERROR: "INTERNAL_ERROR" },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

// Mock all analytics DB functions
vi.mock("@/lib/db/analytics-visits", () => ({
  getVisitOverview: vi.fn().mockResolvedValue({ totalVisits: 100 }),
  getVisitTrend: vi.fn().mockResolvedValue([]),
  getRecentVisitors: vi.fn().mockResolvedValue([]),
  getTopPages: vi.fn().mockResolvedValue([]),
  getTopReferrers: vi.fn().mockResolvedValue([]),
  getSuspiciousActivity: vi.fn().mockResolvedValue([]),
  getVisitsByCountry: vi.fn().mockResolvedValue([]),
  getVisitorJourney: vi.fn().mockResolvedValue([]),
  getTopCampaigns: vi.fn().mockResolvedValue([]),
  cleanupOldVisits: vi.fn().mockResolvedValue(0),
  backfillInternalTraffic: vi.fn().mockResolvedValue(0),
  backfillOwnerTraffic: vi.fn().mockResolvedValue(0),
  getCountryInsight: vi.fn().mockResolvedValue(null),
  scanNotableVisitors: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/db/analytics-materialized", () => ({
  refreshMaterializedViews: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/admin-insights", () => ({
  getReactionDistribution: vi.fn().mockResolvedValue([]),
  getNPSDistribution: vi.fn().mockResolvedValue([]),
  getArchetypeDistribution: vi.fn().mockResolvedValue([]),
  getQuestionnaireStats: vi.fn().mockResolvedValue({}),
  getGeographyDistribution: vi.fn().mockResolvedValue([]),
  getLanguageDistribution: vi.fn().mockResolvedValue([]),
  getDropoffDistribution: vi.fn().mockResolvedValue([]),
  getPrePostPairedData: vi.fn().mockResolvedValue([]),
  getCompletionTimeDistribution: vi.fn().mockResolvedValue([]),
  getReportEngagementStats: vi.fn().mockResolvedValue({}),
  getCoachingDepthStats: vi.fn().mockResolvedValue({}),
  getResearchGroupComparison: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/analytics/errors", () => ({
  getAnalyticsHealth: vi.fn().mockResolvedValue({ healthy: true }),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getVisitorJourney } from "@/lib/db/analytics-visits";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(params = ""): Request {
  return new Request(`http://localhost/api/admin/analytics${params}`, {
    method: "GET",
  });
}

function allowAdmin() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "admin-1", isAdmin: true },
  });
}

function blockGuard(status = 403) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Forbidden", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/admin/analytics", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    const res = await handler(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns journey drill-down when journey param present", async () => {
    allowAdmin();
    (getVisitorJourney as ReturnType<typeof vi.fn>).mockResolvedValue([
      { page: "/en/explore", timestamp: "2026-03-23" },
    ]);

    const res = await handler(makeRequest("?journey=abc123"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.journey).toHaveLength(1);
    expect(getVisitorJourney).toHaveBeenCalledWith("abc123");
  });

  it("returns full analytics dashboard data", async () => {
    allowAdmin();

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.overview).toBeDefined();
    expect(json.overview.totalVisits).toBe(100);
  });
});
