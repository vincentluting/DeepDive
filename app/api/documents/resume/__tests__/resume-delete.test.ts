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
  ApiErrorCode: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    UNAUTHORIZED: "UNAUTHORIZED",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/db/assessments", () => ({
  verifyAssessmentOwnership: vi.fn(),
}));

vi.mock("@/lib/db/resume-match", () => ({
  supersedeActiveResumeMatches: vi.fn(),
}));

vi.mock("@/lib/db/pipeline", () => ({
  setResumeAnalysisStatusByAssessment: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { verifyAssessmentOwnership } from "@/lib/db/assessments";
import { supersedeActiveResumeMatches } from "@/lib/db/resume-match";
import { setResumeAnalysisStatusByAssessment } from "@/lib/db/pipeline";

// ── Helpers ──────────────────────────────────────────────────
function allowGuard(user: { id: string } | null = { id: "u1" }) {
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

function makeDeleteRequest(assessmentId: string | null = "a1") {
  const url = assessmentId
    ? `http://localhost/api/documents/resume?assessmentId=${assessmentId}`
    : "http://localhost/api/documents/resume";
  return new Request(url, { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  (verifyAssessmentOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(
    "owner",
  );
  (
    setResumeAnalysisStatusByAssessment as ReturnType<typeof vi.fn>
  ).mockResolvedValue(undefined);
  (supersedeActiveResumeMatches as ReturnType<typeof vi.fn>).mockResolvedValue(
    1,
  );
});

// ── Tests ────────────────────────────────────────────────────
describe("DELETE /api/documents/resume", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.DELETE as unknown as (req: Request) => Promise<Response>;
  });

  it("returns guard response when blocked", async () => {
    blockGuard();
    const res = await handler(makeDeleteRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 when guard allows but userId missing", async () => {
    allowGuard(null);
    const res = await handler(makeDeleteRequest("a1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when assessmentId query is missing", async () => {
    allowGuard();
    const res = await handler(makeDeleteRequest(null));
    expect(res.status).toBe(400);
  });

  it("returns 400 when assessmentId is empty/whitespace", async () => {
    allowGuard();
    const res = await handler(makeDeleteRequest("   "));
    expect(res.status).toBe(400);
  });

  it("returns 404 when caller is not the owner", async () => {
    allowGuard();
    (
      verifyAssessmentOwnership as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce("forbidden");
    const res = await handler(makeDeleteRequest("a1"));
    expect(res.status).toBe(404);
  });

  it("returns 404 when assessment does not exist", async () => {
    allowGuard();
    (
      verifyAssessmentOwnership as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce("not-found");
    const res = await handler(makeDeleteRequest("a1"));
    expect(res.status).toBe(404);
  });

  it("returns 200 with supersededCount on successful removal", async () => {
    allowGuard();
    (
      supersedeActiveResumeMatches as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce(1);
    const res = await handler(makeDeleteRequest("a1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.supersededCount).toBe(1);
    expect(supersedeActiveResumeMatches).toHaveBeenCalledWith("a1");
    expect(setResumeAnalysisStatusByAssessment).toHaveBeenCalledWith(
      "a1",
      "skipped",
    );
  });

  it("is idempotent: second removal returns supersededCount=0", async () => {
    allowGuard();
    (supersedeActiveResumeMatches as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    const first = await handler(makeDeleteRequest("a1"));
    expect(first.status).toBe(200);
    expect((await first.json()).supersededCount).toBe(1);

    const second = await handler(makeDeleteRequest("a1"));
    expect(second.status).toBe(200);
    expect((await second.json()).supersededCount).toBe(0);
  });

  it("still returns 200 even if pipeline status update fails (best-effort)", async () => {
    allowGuard();
    // Pipeline mark is best-effort — its failure should not surface to user.
    (
      setResumeAnalysisStatusByAssessment as ReturnType<typeof vi.fn>
    ).mockRejectedValueOnce(new Error("pipeline row missing"));
    const res = await handler(makeDeleteRequest("a1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 when supersede throws", async () => {
    allowGuard();
    (
      supersedeActiveResumeMatches as ReturnType<typeof vi.fn>
    ).mockRejectedValueOnce(new Error("db unreachable"));
    const res = await handler(makeDeleteRequest("a1"));
    expect(res.status).toBe(500);
  });
});
