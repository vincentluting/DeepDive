import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/guard-cron", () => ({
  guardCron: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/db/analytics-visits", () => ({
  scanNotableVisitors: vi.fn(),
}));

vi.mock("@/lib/analytics/errors", () => ({
  logAnalyticsError: vi.fn(),
}));

import { guardCron } from "@/lib/api/guard-cron";
import { scanNotableVisitors } from "@/lib/db/analytics-visits";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/cron/scan-notable", {
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
describe("GET /api/cron/scan-notable", () => {
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

  it("returns newCount on success", async () => {
    allowCron();
    (scanNotableVisitors as ReturnType<typeof vi.fn>).mockResolvedValue(3);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.newCount).toBe(3);
    expect(typeof json.durationMs).toBe("number");
    expect(json.timestamp).toBeDefined();
  });

  it("returns 500 on error", async () => {
    allowCron();
    (scanNotableVisitors as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
