import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

const mockSql = vi.fn();
vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

import { guardRoute } from "@/lib/api/api-guard";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(id?: string): Request {
  const url = id
    ? `http://localhost/api/session/status?id=${id}`
    : "http://localhost/api/session/status";
  const req = new Request(url, { method: "GET" });
  // Next.js route uses request.nextUrl — attach it for Vitest
  (req as unknown as { nextUrl: URL }).nextUrl = new URL(url);
  return req;
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
describe("GET /api/session/status", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns blocked response when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest("s1"));
    expect(res.status).toBe(429);
  });

  it("returns not_found when no id param", async () => {
    allowGuard();
    const res = await handler(makeRequest());
    const json = await res.json();
    expect(json.status).toBe("not_found");
  });

  it("returns not_found when session does not exist", async () => {
    allowGuard({ id: "u1" });
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest("nonexistent"));
    const json = await res.json();
    expect(json.status).toBe("not_found");
  });

  it("returns session status (in_progress)", async () => {
    allowGuard({ id: "u1" });
    mockSql.mockResolvedValue([{ status: "in_progress" }]);

    const res = await handler(makeRequest("s1"));
    const json = await res.json();
    expect(json.status).toBe("in_progress");
  });

  it("returns completed status", async () => {
    allowGuard({ id: "u1" });
    mockSql.mockResolvedValue([{ status: "completed" }]);

    const res = await handler(makeRequest("s1"));
    const json = await res.json();
    expect(json.status).toBe("completed");
  });

  it("defaults to active when status is null", async () => {
    allowGuard({ id: "u1" });
    mockSql.mockResolvedValue([{ status: null }]);

    const res = await handler(makeRequest("s1"));
    const json = await res.json();
    expect(json.status).toBe("active");
  });

  it("returns not_found with 500 on DB error", async () => {
    allowGuard({ id: "u1" });
    mockSql.mockRejectedValue(new Error("DB down"));

    const res = await handler(makeRequest("s1"));
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.status).toBe("not_found");
  });
});
