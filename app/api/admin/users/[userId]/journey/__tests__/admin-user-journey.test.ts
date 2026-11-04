import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: { INTERNAL_ERROR: "INTERNAL_ERROR" },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/db/connection", () => ({ sql: vi.fn() }));
vi.mock("@/lib/scoring/constants", () => ({
  RUSH_THRESHOLD_MS: { sjt: 3000, pvq: 2000, ipip: 1500 },
}));

import { guardRoute } from "@/lib/api/api-guard";
import { sql } from "@/lib/db/connection";

function allowAdmin() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "admin-1", isAdmin: true },
  });
}
function blockGuard(status = 403) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Forbidden", { status }),
  });
}

const mockContext = { params: Promise.resolve({ userId: "user-1" }) };

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/users/[userId]/journey", () => {
  let handler: (
    r: Request,
    ctx?: { params: Promise<Record<string, string>> },
  ) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect(
      (
        await handler(
          new Request("http://localhost/api/admin/users/user-1/journey"),
          mockContext,
        )
      ).status,
    ).toBe(403);
  });

  it("returns 404 when user not found", async () => {
    allowAdmin();
    // User query returns empty
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const res = await handler(
      new Request("http://localhost/api/admin/users/user-1/journey"),
      mockContext,
    );
    expect(res.status).toBe(404);
  });

  it("returns full journey (happy path)", async () => {
    allowAdmin();
    const mockSql = sql as unknown as ReturnType<typeof vi.fn>;
    // 1. User query
    mockSql.mockResolvedValueOnce([
      {
        id: "user-1",
        email: "test@test.com",
        name: "Test",
        createdAt: "2026-01-01",
        registrationCountry: "NL",
        careerStage: "early",
      },
    ]);
    // 2-13. Parallel queries: visits, sessions, assessments, reports, reactions, nps, coaching, memories, cdse, funnel, quickdive, thesis
    const emptyRows: never[] = [];
    for (let i = 0; i < 12; i++) mockSql.mockResolvedValueOnce(emptyRows);

    const json = await (
      await handler(
        new Request("http://localhost/api/admin/users/user-1/journey"),
        mockContext,
      )
    ).json();
    expect(json.user.id).toBe("user-1");
    expect(json.user.email).toBe("test@test.com");
    expect(json.timeline).toEqual([]);
    expect(json.coaching.totalSessions).toBe(0);
  });
});
