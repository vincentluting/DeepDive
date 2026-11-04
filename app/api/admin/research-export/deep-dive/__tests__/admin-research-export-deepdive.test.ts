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
vi.mock("@/lib/db/admin", () => ({
  getDeepDiveExportData: vi.fn(),
  getDeepDiveExportCount: vi.fn(),
  DEEP_DIVE_CSV_HEADERS: ["sessionId", "userId", "completedAt"],
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getDeepDiveExportData, getDeepDiveExportCount } from "@/lib/db/admin";

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
  return new Request(
    `http://localhost/api/admin/research-export/deep-dive${params}`,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/research-export/deep-dive", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns count when countOnly=true", async () => {
    allowAdmin();
    (getDeepDiveExportCount as ReturnType<typeof vi.fn>).mockResolvedValue(15);

    const json = await (await handler(makeReq("?countOnly=true"))).json();
    expect(json.count).toBe(15);
  });

  it("returns CSV (happy path)", async () => {
    allowAdmin();
    (getDeepDiveExportData as ReturnType<typeof vi.fn>).mockResolvedValue([
      { sessionId: "s1", userId: "u1", completedAt: "2026-01-01" },
    ]);

    const res = await handler(makeReq());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("sessionId");
  });

  it("returns 500 on DB error", async () => {
    allowAdmin();
    (getDeepDiveExportData as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );
    expect((await handler(makeReq())).status).toBe(500);
  });
});
