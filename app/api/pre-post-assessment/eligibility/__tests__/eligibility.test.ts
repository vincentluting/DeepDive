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
vi.mock("@/lib/db/pre-post-assessment", () => ({
  isEligibleForPost1Week: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { isEligibleForPost1Week } from "@/lib/db/pre-post-assessment";

function allowGuard(user = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}
function blockGuard() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status: 401 }),
  });
}
function makeReq(): Request {
  return new Request("http://localhost/api/pre-post-assessment/eligibility");
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/pre-post-assessment/eligibility", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(401);
  });

  it("returns eligibility data for authenticated user", async () => {
    allowGuard();
    (isEligibleForPost1Week as ReturnType<typeof vi.fn>).mockResolvedValue({
      eligible: true,
      postImmediateDate: "2026-03-01",
    });

    const json = await (await handler(makeReq())).json();
    expect(json.eligible).toBe(true);
    expect(json.postImmediateDate).toBe("2026-03-01");
  });

  it("returns ineligible when no user id", async () => {
    (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
      blocked: false,
      user: {},
    });

    const json = await (await handler(makeReq())).json();
    expect(json.eligible).toBe(false);
    expect(json.postImmediateDate).toBeNull();
  });

  it("returns 500 on DB error", async () => {
    allowGuard();
    (isEligibleForPost1Week as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );
    expect((await handler(makeReq())).status).toBe(500);
  });
});
