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
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    DB_CONSTRAINT_FAILED: "DB_CONSTRAINT_FAILED",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/db/sessions", () => ({
  ensureSessionExists: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { ensureSessionExists } from "@/lib/db/sessions";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/session/ensure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function allowGuard(user: { id: string } = { id: "u1" }) {
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
describe("POST /api/session/ensure", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns validation error when body is invalid", async () => {
    allowGuard({ id: "u1" });
    const errorResponse = new Response(
      JSON.stringify({ error: "VALIDATION_ERROR" }),
      { status: 400 },
    );
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: errorResponse,
    });

    const res = await handler(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("ensures session exists and returns success", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "s1", language: "en", tier: "deep" },
    });
    (ensureSessionExists as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(
      makeRequest({ sessionId: "s1", language: "en", tier: "deep" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(ensureSessionExists).toHaveBeenCalledWith("s1", "en", "deep", "u1");
  });

  it("defaults tier to 'deep' when not provided", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "s1", language: "zh" },
    });
    (ensureSessionExists as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    await handler(makeRequest({ sessionId: "s1", language: "zh" }));
    expect(ensureSessionExists).toHaveBeenCalledWith("s1", "zh", "deep", "u1");
  });

  it("returns 500 when ensureSessionExists throws", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "s1", language: "en" },
    });
    (ensureSessionExists as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB constraint"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("DB_CONSTRAINT_FAILED");
  });
});
