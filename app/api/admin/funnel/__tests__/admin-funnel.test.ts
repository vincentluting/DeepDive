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
vi.mock("@/lib/analytics/funnel-queries", () => ({
  getFunnelStats: vi.fn(),
  getFilteredConversionRates: vi.fn(),
  getFunnelStepTiming: vi.fn(),
  getFunnelFilterOptions: vi.fn(),
}));
vi.mock("@/lib/db/nps", () => ({ getNPSAverage: vi.fn() }));

import { guardRoute } from "@/lib/api/api-guard";
import { getFunnelStats } from "@/lib/analytics/funnel-queries";
import { getNPSAverage } from "@/lib/db/nps";

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
function makeReq(params = ""): Request {
  return new Request(`http://localhost/api/admin/funnel${params}`);
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/funnel", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns funnel data (happy path)", async () => {
    allowAdmin();
    const {
      getFunnelStats,
      getFilteredConversionRates,
      getFunnelStepTiming,
      getFunnelFilterOptions,
    } = await import("@/lib/analytics/funnel-queries");
    (getFunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      total: 100,
    });
    (getFilteredConversionRates as ReturnType<typeof vi.fn>).mockResolvedValue({
      rate: 0.5,
    });
    (getNPSAverage as ReturnType<typeof vi.fn>).mockResolvedValue(8.5);
    (getFunnelStepTiming as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (getFunnelFilterOptions as ReturnType<typeof vi.fn>).mockResolvedValue({
      languages: [],
    });

    const json = await (await handler(makeReq())).json();
    expect(json.stats).toEqual({ total: 100 });
    expect(json.nps).toBe(8.5);
    expect(json.days).toBe(30);
  });

  it("clamps days param to 1-365", async () => {
    allowAdmin();
    const {
      getFunnelStats,
      getFilteredConversionRates,
      getFunnelStepTiming,
      getFunnelFilterOptions,
    } = await import("@/lib/analytics/funnel-queries");
    (getFunnelStats as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (getFilteredConversionRates as ReturnType<typeof vi.fn>).mockResolvedValue(
      {},
    );
    (getNPSAverage as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (getFunnelStepTiming as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (getFunnelFilterOptions as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const json = await (await handler(makeReq("?days=999"))).json();
    expect(json.days).toBe(365);
    expect(getFunnelStats).toHaveBeenCalledWith(365);
  });

  it("returns 500 on DB error", async () => {
    allowAdmin();
    (getFunnelStats as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );
    expect((await handler(makeReq())).status).toBe(500);
  });
});
