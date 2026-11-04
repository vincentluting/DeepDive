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
  createSessionWithId: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { createSessionWithId } from "@/lib/db/sessions";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/session/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

function allowGuard(user: { id: string } | null = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 429) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Blocked", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/session/create", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns blocked response when guard blocks", async () => {
    blockGuard(429);
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns 400 when validation fails", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it("creates session with authenticated user (happy path)", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "s-123", tier: "deep", language: "en" },
    });
    (createSessionWithId as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    expect(createSessionWithId).toHaveBeenCalledWith({
      id: "s-123",
      tier: "deep",
      language: "en",
      userId: "u1",
    });
  });

  it("defaults tier to 'deep' when not provided", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "s-456", language: "zh" },
    });
    (createSessionWithId as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    await handler(makeRequest());

    expect(createSessionWithId).toHaveBeenCalledWith({
      id: "s-456",
      tier: "deep",
      language: "zh",
      userId: "u1",
    });
  });

  it("creates session without userId for anonymous user", async () => {
    allowGuard(null);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "s-anon", tier: "quick", language: "en" },
    });
    (createSessionWithId as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(createSessionWithId).toHaveBeenCalledWith({
      id: "s-anon",
      tier: "quick",
      language: "en",
      userId: undefined,
    });
  });

  it("returns 500 on DB constraint error", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "s-dup", language: "en" },
    });
    (createSessionWithId as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("duplicate key"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
