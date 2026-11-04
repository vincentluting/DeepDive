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
vi.mock("@/lib/db/research-progress", () => ({
  getResearchParticipantProgress: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getResearchParticipantProgress } from "@/lib/db/research-progress";

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
function makeReq(): Request {
  return new Request("http://localhost/api/admin/research-progress");
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/research-progress", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns research progress data", async () => {
    allowAdmin();
    const mockData = {
      participants: [{ userId: "u1", preComplete: true, postComplete: false }],
      summary: { total: 10, completed: 5 },
    };
    (
      getResearchParticipantProgress as ReturnType<typeof vi.fn>
    ).mockResolvedValue(mockData);

    const res = await handler(makeReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.participants).toHaveLength(1);
    expect(json.summary.total).toBe(10);
  });

  it("returns 500 on DB error", async () => {
    allowAdmin();
    (
      getResearchParticipantProgress as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("DB down"));
    expect((await handler(makeReq())).status).toBe(500);
  });
});
