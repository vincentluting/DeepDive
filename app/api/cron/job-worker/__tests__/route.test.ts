import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/guard-cron", () => ({
  guardCron: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/jobs/runner", () => ({
  runDueJobs: vi.fn(),
}));

vi.mock("@/lib/db/durable-jobs", () => ({
  getDurableJobHealth: vi.fn(),
}));

import { guardCron } from "@/lib/api/guard-cron";
import { getDurableJobHealth } from "@/lib/db/durable-jobs";
import { runDueJobs } from "@/lib/jobs/runner";

function makeRequest(): Request {
  return new Request("http://localhost/api/cron/job-worker", {
    method: "GET",
    headers: { Authorization: "Bearer test-secret" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/cron/job-worker", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when cron guard blocks", async () => {
    (guardCron as ReturnType<typeof vi.fn>).mockReturnValue({
      blocked: true,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("runs due jobs and returns queue health", async () => {
    (guardCron as ReturnType<typeof vi.fn>).mockReturnValue({
      blocked: false,
    });
    (runDueJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
      workerId: "worker-1",
      claimed: 1,
      durationMs: 12,
      summary: { succeeded: 1, retry: 0, failed: 0, skipped: 0 },
      outcomes: [],
    });
    (getDurableJobHealth as ReturnType<typeof vi.fn>).mockResolvedValue({
      pending: 0,
      running: 0,
      succeededLast24h: 1,
      failedLast24h: 0,
      oldestPendingAt: null,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(runDueJobs).toHaveBeenCalledWith({ limit: 10 });

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.claimed).toBe(1);
    expect(json.health.succeededLast24h).toBe(1);
  });

  it("returns 500 when the worker fails", async () => {
    (guardCron as ReturnType<typeof vi.fn>).mockReturnValue({
      blocked: false,
    });
    (runDueJobs as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
