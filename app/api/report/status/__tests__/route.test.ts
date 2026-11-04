import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
  },
  createErrorResponse: vi.fn(
    (code: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: code, message }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/db/assessments", () => ({
  getEffectiveAssessment: vi.fn(),
}));

vi.mock("@/lib/db/reports", () => ({
  getReportIdByAssessment: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getEffectiveAssessment } from "@/lib/db/assessments";
import { getReportIdByAssessment } from "@/lib/db/reports";

function makeRequest(assessmentId?: string): Request {
  const qs = assessmentId ? `?assessmentId=${assessmentId}` : "";
  return new Request(`http://localhost/api/report/status${qs}`, {
    method: "GET",
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

describe("GET /api/report/status", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest("a1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when assessmentId is missing", async () => {
    allowGuard();
    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 404 when assessment is not accessible", async () => {
    allowGuard();
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(makeRequest("a1"));
    expect(res.status).toBe(404);
  });

  it("returns pending when report does not exist yet", async () => {
    allowGuard();
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
    });
    (getReportIdByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest("a1"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "pending",
      reportId: null,
    });
  });

  it("returns ready when report exists", async () => {
    allowGuard();
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
    });
    (getReportIdByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(
      "r1",
    );

    const res = await handler(makeRequest("a1"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "ready",
      reportId: "r1",
    });
  });
});
