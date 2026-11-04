import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/guard-cron", () => ({
  guardCron: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn().mockResolvedValue({ count: 0 }),
}));

vi.mock("@/lib/db/analytics-visits", () => ({
  cleanupOldVisits: vi.fn(),
}));

vi.mock("@/lib/analytics/errors", () => ({
  logAnalyticsError: vi.fn(),
}));

const sentryCaptureMessage = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureMessage: (...args: unknown[]) => sentryCaptureMessage(...args),
}));

import { guardCron } from "@/lib/api/guard-cron";
import { cleanupOldVisits } from "@/lib/db/analytics-visits";
import { sql } from "@/lib/db/connection";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/cron/cleanup-old-data", {
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
describe("GET /api/cron/cleanup-old-data", () => {
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

  it("returns deleted counts on success", async () => {
    allowCron();
    (cleanupOldVisits as ReturnType<typeof vi.fn>).mockResolvedValue(5);
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 2,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.deletedCounts.pageVisits).toBe(5);
    expect(typeof json.durationMs).toBe("number");
  });

  it("returns 500 on error", async () => {
    allowCron();
    (cleanupOldVisits as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("includes LLMUsageLog count in deletedCounts", async () => {
    allowCron();
    (cleanupOldVisits as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      count: 7,
    });

    const res = await handler(makeRequest());
    const json = await res.json();
    expect(json.deletedCounts.llmUsage).toBe(7);
  });

  it("includes capacity ratio when pg_database_size returns a value", async () => {
    allowCron();
    (cleanupOldVisits as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    // DELETEs return {count}; the capacity SELECT returns [{bytes}].
    // The route fires DELETEs first (Steps 1-6) then SELECT pg_database_size.
    // Mock as a queue: first all the count-shaped responses, last the size row.
    const sqlMock = sql as unknown as ReturnType<typeof vi.fn>;
    sqlMock.mockResolvedValue({ count: 0 });
    // Final call (SELECT pg_database_size) — bytes well below the 80% warn
    sqlMock.mockResolvedValueOnce({ count: 0 }); // Step 2: AnalyticsError
    sqlMock.mockResolvedValueOnce({ count: 0 }); // Step 3: NotableVisitor
    sqlMock.mockResolvedValueOnce({ count: 0 }); // Step 4: UserSession
    sqlMock.mockResolvedValueOnce({ count: 0 }); // Step 5: LLMUsageLog
    // Step 6 fires 8 parallel DELETEs (all return {count: 0} via the default)
    // Step 7 fires the capacity SELECT — override default for one more call
    // by chaining 8 more defaults then the size row.
    for (let i = 0; i < 8; i++) sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockResolvedValueOnce([{ bytes: 100 * 1024 * 1024 }]); // 100MB → 20% of 500MB ceiling

    const res = await handler(makeRequest());
    const json = await res.json();
    expect(json.capacity.dbSizeBytes).toBe(100 * 1024 * 1024);
    expect(json.capacity.ratio).toBeCloseTo(0.2, 2);
    expect(sentryCaptureMessage).not.toHaveBeenCalled();
  });

  it("captures Sentry warning when DB size exceeds 80% of free ceiling", async () => {
    allowCron();
    (cleanupOldVisits as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const sqlMock = sql as unknown as ReturnType<typeof vi.fn>;
    sqlMock.mockResolvedValue({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    for (let i = 0; i < 8; i++) sqlMock.mockResolvedValueOnce({ count: 0 });
    // 425MB → 85% of 500MB → warning level
    sqlMock.mockResolvedValueOnce([{ bytes: 425 * 1024 * 1024 }]);

    await handler(makeRequest());

    expect(sentryCaptureMessage).toHaveBeenCalledOnce();
    const [message, options] = sentryCaptureMessage.mock.calls[0];
    expect(message).toMatch(/Neon DB size/);
    expect((options as { level: string }).level).toBe("warning");
  });

  it("escalates to Sentry error level at >=95% capacity", async () => {
    allowCron();
    (cleanupOldVisits as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const sqlMock = sql as unknown as ReturnType<typeof vi.fn>;
    sqlMock.mockResolvedValue({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    for (let i = 0; i < 8; i++) sqlMock.mockResolvedValueOnce({ count: 0 });
    // 480MB → 96% of 500MB → error level
    sqlMock.mockResolvedValueOnce([{ bytes: 480 * 1024 * 1024 }]);

    await handler(makeRequest());

    expect(sentryCaptureMessage).toHaveBeenCalledOnce();
    const [, options] = sentryCaptureMessage.mock.calls[0];
    expect((options as { level: string }).level).toBe("error");
  });

  it("survives pg_database_size failure (continues without capacity signal)", async () => {
    allowCron();
    (cleanupOldVisits as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    const sqlMock = sql as unknown as ReturnType<typeof vi.fn>;
    sqlMock.mockResolvedValue({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockResolvedValueOnce({ count: 0 });
    for (let i = 0; i < 8; i++) sqlMock.mockResolvedValueOnce({ count: 0 });
    sqlMock.mockRejectedValueOnce(new Error("pg_database_size denied"));

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.capacity.dbSizeBytes).toBeNull();
  });
});
