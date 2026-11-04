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
vi.mock("@/lib/db/llm-usage", () => ({
  getLLMUsageSummary: vi.fn(),
  getLLMCostPerUser: vi.fn(),
  getLLMUsageByModel: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import {
  getLLMUsageSummary,
  getLLMCostPerUser,
  getLLMUsageByModel,
} from "@/lib/db/llm-usage";

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
  return new Request(`http://localhost/api/admin/llm-usage${params}`);
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/llm-usage", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns LLM usage data (happy path)", async () => {
    allowAdmin();
    (getLLMUsageSummary as ReturnType<typeof vi.fn>).mockResolvedValue({
      totalCalls: 500,
    });
    (getLLMCostPerUser as ReturnType<typeof vi.fn>).mockResolvedValue([
      { userId: "u1", estimatedCostUsd: 1.5 },
      { userId: "u2", estimatedCostUsd: 2.5 },
    ]);
    (getLLMUsageByModel as ReturnType<typeof vi.fn>).mockResolvedValue([
      { model: "gpt-4o-mini", calls: 300 },
    ]);

    const json = await (await handler(makeReq())).json();
    expect(json.totalCalls).toBe(500);
    expect(json.totalEstimatedCost).toBe(4);
    expect(json.days).toBe(7);
  });

  it("clamps days to 1-90", async () => {
    allowAdmin();
    (getLLMUsageSummary as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (getLLMCostPerUser as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (getLLMUsageByModel as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const json = await (await handler(makeReq("?days=999"))).json();
    expect(json.days).toBe(90);
    expect(getLLMUsageSummary).toHaveBeenCalledWith(90, undefined);
  });

  it("passes environment filter", async () => {
    allowAdmin();
    (getLLMUsageSummary as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (getLLMCostPerUser as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (getLLMUsageByModel as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handler(makeReq("?environment=test"));
    expect(getLLMUsageSummary).toHaveBeenCalledWith(7, "test");
  });

  it("returns 500 on DB error", async () => {
    allowAdmin();
    (getLLMUsageSummary as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );
    expect((await handler(makeReq())).status).toBe(500);
  });
});
