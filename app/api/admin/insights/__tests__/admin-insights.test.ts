import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
  },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/db/admin-insights-cross", () => ({
  getWeeklyKPIs: vi.fn().mockResolvedValue({ newUsers: 10 }),
  getFunnelLossSpotlight: vi.fn().mockResolvedValue([]),
  getSuperUsers: vi.fn().mockResolvedValue([]),
  getABTestFullFunnel: vi.fn().mockResolvedValue({}),
  getCohortRetentionForInsights: vi.fn().mockResolvedValue([]),
  getUTMAttribution: vi.fn().mockResolvedValue([]),
  getFunnelBottleneckDiagnosis: vi.fn().mockResolvedValue([]),
  getABTrendAnalysis: vi.fn().mockResolvedValue([]),
  getPrePostEffectSummary: vi.fn().mockResolvedValue({}),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getWeeklyKPIs as _getWeeklyKPIs } from "@/lib/db/admin-insights-cross";

function allowAdmin() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "admin-1", isAdmin: true },
  });
}
function blockGuard() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Forbidden", { status: 403 }),
  });
}
function makeReq(params = ""): Request {
  return new Request(`http://localhost/api/admin/insights${params}`);
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/insights", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns single section data", async () => {
    allowAdmin();
    const json = await (await handler(makeReq("?section=kpi"))).json();
    expect(json.section).toBe("kpi");
    expect(json.data).toEqual({ newUsers: 10 });
  });

  it("returns batch data for section=all", async () => {
    allowAdmin();
    const json = await (await handler(makeReq("?section=all"))).json();
    expect(json.section).toBe("all");
    expect(json.data.kpi).toEqual({ newUsers: 10 });
  });

  it("returns 400 for invalid section", async () => {
    allowAdmin();
    expect((await handler(makeReq("?section=invalid"))).status).toBe(400);
  });

  it("returns 400 when no section provided", async () => {
    allowAdmin();
    expect((await handler(makeReq())).status).toBe(400);
  });
});
