import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
  },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/db/admin", () => ({
  getResearchExportData: vi.fn(),
  getResearchExportCount: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getResearchExportData, getResearchExportCount } from "@/lib/db/admin";

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
function makeReq(params = ""): Request {
  return new Request(`http://localhost/api/admin/research-export${params}`);
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/research-export", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns count only when countOnly=true", async () => {
    allowAdmin();
    (getResearchExportCount as ReturnType<typeof vi.fn>).mockResolvedValue(42);

    const json = await (await handler(makeReq("?countOnly=true"))).json();
    expect(json.count).toBe(42);
  });

  it("returns JSON by default (happy path)", async () => {
    allowAdmin();
    (getResearchExportData as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "r1", archetypeCode: "RE" },
    ]);

    const res = await handler(makeReq());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
  });

  it("returns CSV when format=csv", async () => {
    allowAdmin();
    (getResearchExportData as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await handler(makeReq("?format=csv"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
  });

  it("returns 500 on DB error", async () => {
    allowAdmin();
    (getResearchExportData as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );
    expect((await handler(makeReq())).status).toBe(500);
  });
});
