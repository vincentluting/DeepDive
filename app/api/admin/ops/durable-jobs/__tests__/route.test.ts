import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: { INTERNAL_ERROR: "INTERNAL_ERROR" },
  createErrorResponse: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: code, message }), { status }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/db/durable-jobs", () => ({
  getDurableJobHealth: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getDurableJobHealth } from "@/lib/db/durable-jobs";

function makeRequest(): Request {
  return new Request("http://localhost/api/admin/ops/durable-jobs");
}

function allowAdmin(): void {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "admin-1", isAdmin: true },
  });
}

function blockGuard(): void {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Forbidden", { status: 403 }),
  });
}

describe("GET /api/admin/ops/durable-jobs", () => {
  let handler: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("requires admin access", async () => {
    blockGuard();

    const response = await handler(makeRequest());

    expect(response.status).toBe(403);
    expect(getDurableJobHealth).not.toHaveBeenCalled();
  });

  it("returns DurableJob health", async () => {
    allowAdmin();
    (getDurableJobHealth as ReturnType<typeof vi.fn>).mockResolvedValue({
      pending: 2,
      running: 1,
      succeededLast24h: 5,
      failedLast24h: 0,
      oldestPendingAt: "2026-05-02T20:00:00.000Z",
    });

    const response = await handler(makeRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      health: {
        pending: 2,
        running: 1,
        succeededLast24h: 5,
        failedLast24h: 0,
        oldestPendingAt: "2026-05-02T20:00:00.000Z",
      },
    });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("returns 500 when health lookup fails", async () => {
    allowAdmin();
    (getDurableJobHealth as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const response = await handler(makeRequest());

    expect(response.status).toBe(500);
  });
});
