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

const mockGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi
    .fn()
    .mockResolvedValue({ get: (...args: unknown[]) => mockGet(...args) }),
}));

vi.mock("@/lib/auth", () => ({
  deleteSession: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn().mockResolvedValue(undefined),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { deleteSession, clearSessionCookie } from "@/lib/auth";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
describe("POST /api/auth/logout", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../../logout/route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns blocked response when guard blocks", async () => {
    blockGuard(429);
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
  });

  it("deletes session and clears cookie (happy path)", async () => {
    allowGuard({ id: "u1" });
    mockGet.mockReturnValue({ value: "session-abc" });
    (deleteSession as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (clearSessionCookie as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    expect(deleteSession).toHaveBeenCalledWith("session-abc");
    expect(clearSessionCookie).toHaveBeenCalledTimes(1);
  });

  it("clears cookie even when no session cookie exists", async () => {
    allowGuard({ id: "u1" });
    mockGet.mockReturnValue(undefined);
    (clearSessionCookie as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(deleteSession).not.toHaveBeenCalled();
    expect(clearSessionCookie).toHaveBeenCalledTimes(1);
  });

  it("returns 500 on unexpected error", async () => {
    allowGuard({ id: "u1" });
    mockGet.mockReturnValue({ value: "session-abc" });
    (deleteSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB error"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
