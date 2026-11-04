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

vi.mock("@/lib/db/admin", () => ({
  listUsersWithStats: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { listUsersWithStats } from "@/lib/db/admin";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(params = ""): Request {
  return new Request(`http://localhost/api/admin/users${params}`, {
    method: "GET",
  });
}

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

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/admin/users", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard(403);
    const res = await handler(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns paginated user list (happy path)", async () => {
    allowAdmin();
    (listUsersWithStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      users: [{ id: "u1", name: "Test" }],
      total: 1,
      stats: { totalUsers: 50 },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.users).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(20);
  });

  it("passes pagination params correctly", async () => {
    allowAdmin();
    (listUsersWithStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      users: [],
      total: 0,
      stats: {},
    });

    await handler(makeRequest("?page=3&limit=50&search=test"));

    expect(listUsersWithStats).toHaveBeenCalledWith(3, 50, "test");
  });

  it("clamps limit to 100 max", async () => {
    allowAdmin();
    (listUsersWithStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      users: [],
      total: 0,
      stats: {},
    });

    await handler(makeRequest("?limit=999"));

    expect(listUsersWithStats).toHaveBeenCalledWith(1, 100, "");
  });

  it("returns 500 on DB error", async () => {
    allowAdmin();
    (listUsersWithStats as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
