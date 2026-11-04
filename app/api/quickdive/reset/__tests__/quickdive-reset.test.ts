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

vi.mock("@/lib/db/assessment-completion", () => ({
  deleteAssessmentCompletion: vi.fn(),
}));

vi.mock("@/lib/db/user-context", () => ({
  recomputeUserContext: vi.fn(),
}));

vi.mock("@/lib/db/cached", () => ({
  invalidateUserCache: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { deleteAssessmentCompletion } from "@/lib/db/assessment-completion";
import { recomputeUserContext } from "@/lib/db/user-context";
import { invalidateUserCache } from "@/lib/db/cached";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/quickdive/reset", {
    method: "POST",
  });
}

function allowGuard(user = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 401) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/quickdive/reset", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("clears both completion types without deleting history", async () => {
    allowGuard({ id: "u1" });
    (deleteAssessmentCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (recomputeUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    expect(deleteAssessmentCompletion).toHaveBeenCalledWith("u1", "quick_dive");
    expect(deleteAssessmentCompletion).toHaveBeenCalledWith(
      "u1",
      "immersive_dive",
    );
    expect(recomputeUserContext).toHaveBeenCalledWith("u1");
    expect(invalidateUserCache).toHaveBeenCalledWith("u1");
  });

  it("returns 500 on DB error", async () => {
    allowGuard({ id: "u1" });
    (deleteAssessmentCompletion as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB error"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
