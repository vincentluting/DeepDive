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

import { guardRoute } from "@/lib/api/api-guard";

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

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/mark-owner", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect(
      (await handler(new Request("http://localhost/api/admin/mark-owner")))
        .status,
    ).toBe(403);
  });

  it("returns marked status when no cookie", async () => {
    allowAdmin();
    const req = new Request("http://localhost/api/admin/mark-owner");
    // Simulate NextRequest cookies API (no cookie set = undefined)
    Object.defineProperty(req, "cookies", {
      value: { get: () => undefined },
    });

    const json = await (await handler(req)).json();
    expect(json.marked).toBe(false);
  });
});

describe("POST /api/admin/mark-owner", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("sets owner cookie (happy path)", async () => {
    allowAdmin();
    const res = await handler(
      new Request("http://localhost/api/admin/mark-owner", { method: "POST" }),
    );
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.marked).toBe(true);
  });
});

describe("DELETE /api/admin/mark-owner", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).DELETE as unknown as typeof handler;
  });

  it("clears owner cookie (happy path)", async () => {
    allowAdmin();
    const res = await handler(
      new Request("http://localhost/api/admin/mark-owner", {
        method: "DELETE",
      }),
    );
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.marked).toBe(false);
  });
});
