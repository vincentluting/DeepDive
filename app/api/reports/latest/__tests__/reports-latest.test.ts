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

vi.mock("@/lib/db/reports", () => ({
  getLatestReportIdForUser: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getLatestReportIdForUser } from "@/lib/db/reports";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/reports/latest", { method: "GET" });
}

function allowGuard(user = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 401) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/reports/latest", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns latest report id", async () => {
    allowGuard();
    (getLatestReportIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
      "r-abc123",
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.id).toBe("r-abc123");
  });

  it("returns null when user has no reports", async () => {
    allowGuard();
    (getLatestReportIdForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest());
    const json = await res.json();
    expect(json.id).toBeNull();
  });

  it("returns 500 on DB error", async () => {
    allowGuard();
    (getLatestReportIdForUser as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
