import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (before imports) ──────────────────────────────────
vi.mock("@/lib/db/reports", () => ({
  getReportJsonById: vi.fn(),
  getAssessmentDataForReport: vi.fn(),
  checkReportOwnership: vi.fn(),
  checkReportExists: vi.fn(),
  deleteReportById: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserWithAdmin: vi.fn(),
}));

vi.mock("@/lib/db/cached", () => ({
  invalidateUserCache: vi.fn(),
}));

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    UNAUTHORIZED: "UNAUTHORIZED",
    ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
    VALIDATION_ERROR: "VALIDATION_ERROR",
  },
  createErrorResponse: vi.fn((code: string, msg: string, status: number) => {
    return new Response(JSON.stringify({ error: code, message: msg }), {
      status,
    });
  }),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getCurrentUserWithAdmin } from "@/lib/auth";
import {
  getReportJsonById,
  getAssessmentDataForReport,
  checkReportOwnership,
  checkReportExists,
  deleteReportById,
} from "@/lib/db/reports";
import { invalidateUserCache } from "@/lib/db/cached";

// ── Helpers ─────────────────────────────────────────────────
function makeGetRequest(): Request {
  return new Request("http://localhost/api/report/rpt-1", { method: "GET" });
}

function makeDeleteRequest(): Request {
  return new Request("http://localhost/api/report/rpt-1", { method: "DELETE" });
}

const mockContext = { params: Promise.resolve({ id: "rpt-1" }) };

function allowGuard(user: { id: string }) {
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

// ── GET Tests ───────────────────────────────────────────────
describe("GET /api/report/[id]", () => {
  let handler: (req: Request, ctx: typeof mockContext) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (
      req: Request,
      ctx: typeof mockContext,
    ) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard(401);
    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(401);
  });

  it("returns 401 when getCurrentUserWithAdmin returns null", async () => {
    allowGuard({ id: "user-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(401);
  });

  it("returns 404 when user does not own report", async () => {
    allowGuard({ id: "user-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      isAdmin: false,
    });
    (checkReportOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(404);
  });

  it("returns 404 when report does not exist", async () => {
    allowGuard({ id: "user-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      isAdmin: false,
    });
    (checkReportOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getReportJsonById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(404);
  });

  it("returns report data with assessment meta (happy path)", async () => {
    allowGuard({ id: "user-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      isAdmin: false,
    });
    (checkReportOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getReportJsonById as ReturnType<typeof vi.fn>).mockResolvedValue({
      assessmentId: "assess-1",
      chapters: { anchor: {} },
    });
    (getAssessmentDataForReport as ReturnType<typeof vi.fn>).mockResolvedValue({
      sessionId: "sess-1",
      resultJson: {
        evidenceChain: { key: "val" },
        archetype: { code: "RI", name: "Analytical Builder" },
        schwartz: { top3: ["Self-Direction", "Achievement", "Stimulation"] },
        meta: {
          rushCount: 2,
          hesitationCount: 5,
          totalQuestions: 86,
          answeredQuestions: 86,
        },
      },
    });

    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.report).toBeTruthy();
    expect(json.assessmentId).toBe("assess-1");
    expect(json.assessmentSessionId).toBe("sess-1");
    expect(json.currentUserId).toBe("user-1");
    expect(json.evidenceChain).toEqual({ key: "val" });
    expect(json.archetype).toEqual({ code: "RI", name: "Analytical Builder" });
    expect(json.schwartzTop3).toEqual([
      "Self-Direction",
      "Achievement",
      "Stimulation",
    ]);
    expect(json.assessmentMeta).toEqual({
      rushCount: 2,
      hesitationCount: 5,
      totalQuestions: 86,
      answeredQuestions: 86,
    });
  });

  it("admin bypasses ownership check", async () => {
    allowGuard({ id: "admin-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "admin-1",
      isAdmin: true,
    });
    (getReportJsonById as ReturnType<typeof vi.fn>).mockResolvedValue({
      chapters: {},
    });

    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(200);
    expect(checkReportOwnership).not.toHaveBeenCalled();
  });

  it("returns report without assessment data when assessmentId is absent", async () => {
    allowGuard({ id: "user-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      isAdmin: false,
    });
    (checkReportOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getReportJsonById as ReturnType<typeof vi.fn>).mockResolvedValue({
      chapters: {},
    });

    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.assessmentId).toBeNull();
    expect(json.evidenceChain).toBeNull();
    expect(getAssessmentDataForReport).not.toHaveBeenCalled();
  });

  it("returns 500 on corrupted report JSON", async () => {
    allowGuard({ id: "user-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      isAdmin: false,
    });
    (checkReportOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getReportJsonById as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("JSON parse error"),
    );

    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(500);
  });
});

// ── DELETE Tests ─────────────────────────────────────────────
describe("DELETE /api/report/[id]", () => {
  let handler: (req: Request, ctx: typeof mockContext) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.DELETE as unknown as (
      req: Request,
      ctx: typeof mockContext,
    ) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard(401);
    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(401);
  });

  it("returns 401 when user is not authenticated", async () => {
    allowGuard({ id: "user-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(401);
  });

  it("deletes report as owner", async () => {
    allowGuard({ id: "user-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      isAdmin: false,
    });
    (checkReportOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (deleteReportById as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(invalidateUserCache).toHaveBeenCalledWith("user-1");
  });

  it("returns 404 when non-owner tries to delete", async () => {
    allowGuard({ id: "user-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      isAdmin: false,
    });
    (checkReportOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(404);
  });

  it("admin can delete any report", async () => {
    allowGuard({ id: "admin-1" });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "admin-1",
      isAdmin: true,
    });
    (checkReportExists as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (deleteReportById as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(200);
    expect(checkReportOwnership).not.toHaveBeenCalled();
  });
});
