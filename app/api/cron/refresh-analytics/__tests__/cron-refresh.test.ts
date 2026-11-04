import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/guard-cron", () => ({
  guardCron: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/db/analytics-materialized", () => ({
  refreshMaterializedViews: vi.fn(),
}));

vi.mock("@/lib/analytics/errors", () => ({
  logAnalyticsError: vi.fn(),
}));

import { guardCron } from "@/lib/api/guard-cron";
import { refreshMaterializedViews } from "@/lib/db/analytics-materialized";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/cron/refresh-analytics", {
    method: "GET",
    headers: { Authorization: "Bearer test-secret" },
  });
}

function allowCron() {
  (guardCron as ReturnType<typeof vi.fn>).mockReturnValue({ blocked: false });
}

function blockCron() {
  (guardCron as ReturnType<typeof vi.fn>).mockReturnValue({
    blocked: true,
    response: new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/cron/refresh-analytics", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when cron guard blocks", async () => {
    blockCron();
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns views on success", async () => {
    allowCron();
    (refreshMaterializedViews as ReturnType<typeof vi.fn>).mockResolvedValue({
      views: ["mv_daily_visits", "mv_weekly_signups"],
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.views).toEqual(["mv_daily_visits", "mv_weekly_signups"]);
    expect(typeof json.durationMs).toBe("number");
  });

  it("returns 500 on error", async () => {
    allowCron();
    (refreshMaterializedViews as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
