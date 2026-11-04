import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/db/connection", () => ({ sql: vi.fn() }));
vi.mock("@/lib/auth/admin", () => ({ isUserAdmin: vi.fn() }));

import { guardRoute } from "@/lib/api/api-guard";
import { sql } from "@/lib/db/connection";
import { isUserAdmin } from "@/lib/auth/admin";

function allowAdmin() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "admin-1", email: "admin@test.com", isAdmin: true },
  });
  (isUserAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);
}
function blockGuard(status = 403) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Forbidden", { status }),
  });
}
function blockNonAdmin() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "user-1", email: "user@test.com", isAdmin: false },
  });
  (isUserAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(false);
}
function makeReq(): Request {
  return new Request("http://localhost/api/admin/anonymous-qd");
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/anonymous-qd", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns 403 for non-admin user", async () => {
    blockNonAdmin();
    const res = await handler(makeReq());
    expect(res.status).toBe(403);
  });

  it("returns results and stats (happy path)", async () => {
    allowAdmin();
    const mockSql = sql as unknown as ReturnType<typeof vi.fn>;
    // First call: results rows
    mockSql.mockResolvedValueOnce([
      {
        id: "qd-1",
        anonymousId: "anon-1",
        userId: null,
        archetypeCode: "RE",
        archetypeLabel: "Explorer",
        language: "en",
        exploreMode: "classic",
        adminNote: null,
        createdAt: "2026-04-01T00:00:00Z",
        userEmail: null,
        userName: null,
        converted: false,
        convertedEmail: null,
        convertedName: null,
        convertedAt: null,
      },
    ]);
    // Second call: stats
    mockSql.mockResolvedValueOnce([
      { total: 10, anonymous: 7, registered: 3, unique_anonymous: 5 },
    ]);

    const json = await (await handler(makeReq())).json();
    expect(json.results).toHaveLength(1);
    expect(json.stats.total).toBe(10);
    expect(json.stats.anonymous).toBe(7);
    expect(json.stats.registered).toBe(3);
  });
});

describe("PATCH /api/admin/anonymous-qd", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).PATCH as unknown as typeof handler;
  });

  it("returns 403 for non-admin user", async () => {
    blockNonAdmin();
    const res = await handler(
      new Request("http://localhost/api/admin/anonymous-qd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "qd-1", adminNote: "test" }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("updates admin note (happy path)", async () => {
    allowAdmin();
    const mockSql = sql as unknown as ReturnType<typeof vi.fn>;
    mockSql.mockResolvedValueOnce([]);

    const res = await handler(
      new Request("http://localhost/api/admin/anonymous-qd", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "qd-1", adminNote: "John Doe" }),
      }),
    );
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
