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

vi.mock("@/lib/coaching/get-coach-access-level", () => ({
  getCoachAccessLevel: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getCoachAccessLevel } from "@/lib/coaching/get-coach-access-level";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/coaching-access", { method: "GET" });
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
describe("GET /api/coaching-access", () => {
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

  it("returns level 0 (coaching locked, no Quick Dive)", async () => {
    allowGuard({ id: "u1" });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 0,
      maxRounds: 0,
      completedRounds: 0,
      primaryRiasecType: null,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.level).toBe(0);
    expect(json.maxRounds).toBe(0);
    expect(json.userId).toBe("u1");
  });

  it("returns level 1 (limited coaching, Quick Dive done)", async () => {
    allowGuard({ id: "u2" });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 1,
      maxRounds: 3,
      completedRounds: 1,
      primaryRiasecType: "A",
    });

    const res = await handler(makeRequest());
    const json = await res.json();

    expect(json.level).toBe(1);
    expect(json.maxRounds).toBe(3);
    expect(json.completedRounds).toBe(1);
    expect(json.primaryRiasecType).toBe("A");
    expect(json.userId).toBe("u2");
  });

  it("returns level 2 (full coaching, Deep Dive done)", async () => {
    allowGuard({ id: "u3" });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 2,
      maxRounds: null,
      completedRounds: 5,
      primaryRiasecType: "I",
    });

    const res = await handler(makeRequest());
    const json = await res.json();

    expect(json.level).toBe(2);
    expect(json.maxRounds).toBeNull();
    expect(json.completedRounds).toBe(5);
  });

  it("returns 500 on internal error", async () => {
    allowGuard({ id: "u1" });
    (getCoachAccessLevel as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
