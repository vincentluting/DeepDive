import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/guard-cron", () => ({
  guardCron: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/db/user-deletion-queue", () => ({
  processDeletionQueue: vi.fn(),
}));

import { guardCron } from "@/lib/api/guard-cron";
import { processDeletionQueue } from "@/lib/db/user-deletion-queue";
import { GET } from "../route";
import type { NextRequest } from "next/server";

function makeRequest(): NextRequest {
  return new Request("http://localhost/api/cron/process-deletion-requests", {
    method: "GET",
    headers: { Authorization: "Bearer test-secret" },
  }) as unknown as NextRequest;
}

function allowCron() {
  (guardCron as ReturnType<typeof vi.fn>).mockReturnValue({ blocked: false });
}

function blockCron(status = 401) {
  (guardCron as ReturnType<typeof vi.fn>).mockReturnValue({
    blocked: true,
    response: new Response(JSON.stringify({ error: "Unauthorized" }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  });
}

describe("GET /api/cron/process-deletion-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when cron guard rejects the request", async () => {
    blockCron();
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(processDeletionQueue).not.toHaveBeenCalled();
  });

  it("returns success=true with totals when queue is empty", async () => {
    allowCron();
    (processDeletionQueue as ReturnType<typeof vi.fn>).mockResolvedValue({
      total: 0,
      succeeded: 0,
      failed: 0,
      failures: [],
      dryRun: false,
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      success: true,
      total: 0,
      succeeded: 0,
      failed: 0,
      failures: [],
    });
  });

  it("reports failures with success=false when any deletion errors", async () => {
    allowCron();
    (processDeletionQueue as ReturnType<typeof vi.fn>).mockResolvedValue({
      total: 2,
      succeeded: 1,
      failed: 1,
      failures: [{ userId: "u-broken", error: "cascade failed" }],
      dryRun: false,
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.total).toBe(2);
    expect(body.succeeded).toBe(1);
    expect(body.failed).toBe(1);
    expect(body.failures).toEqual([
      { userId: "u-broken", error: "cascade failed" },
    ]);
  });

  it("returns 500 when processDeletionQueue throws", async () => {
    allowCron();
    (processDeletionQueue as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db exploded"),
    );

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Failed to process deletion queue" });
  });
});
