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

const mockSql = vi.fn();
vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

import { guardRoute } from "@/lib/api/api-guard";

function allowAdmin() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "admin-1", isAdmin: true },
  });
}
function blockGuard() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Forbidden", { status: 403 }),
  });
}
function makeReq(params = ""): Request {
  return new Request(`http://localhost/api/admin/user-profiles${params}`);
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/user-profiles", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns paginated user profiles (happy path)", async () => {
    allowAdmin();
    // 1st call: total count
    mockSql.mockResolvedValueOnce([{ count: 1 }]);
    // 2nd call: user rows
    mockSql.mockResolvedValueOnce([
      {
        id: "u1",
        email: "test@example.com",
        name: "Test",
        careerStage: null,
        registrationCountry: null,
        createdAt: "2026-01-01",
        profileJson: null,
        profileCreatedAt: null,
        quickDiveScores: { R: 15, I: 10, A: 8, S: 5, E: 3, C: 2 },
        quickDiveArchetype: "R-enhancement",
      },
    ]);
    // 3rd call: all profiles (aggregates)
    mockSql.mockResolvedValueOnce([]);
    // 4th call: all quick dives (aggregates)
    mockSql.mockResolvedValueOnce([]);

    const res = await handler(makeReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.users).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.users[0].hasQuickDive).toBe(true);
    expect(json.users[0].riasecCode).toBe("RIA");
  });

  it("clamps limit to 100 max", async () => {
    allowAdmin();
    mockSql.mockResolvedValueOnce([{ count: 0 }]);
    mockSql.mockResolvedValueOnce([]);
    mockSql.mockResolvedValueOnce([]);
    mockSql.mockResolvedValueOnce([]);

    const json = await (await handler(makeReq("?limit=999"))).json();
    expect(json.limit).toBe(100);
  });

  it("returns 500 on DB error", async () => {
    allowAdmin();
    mockSql.mockRejectedValue(new Error("DB down"));
    expect((await handler(makeReq())).status).toBe(500);
  });
});
