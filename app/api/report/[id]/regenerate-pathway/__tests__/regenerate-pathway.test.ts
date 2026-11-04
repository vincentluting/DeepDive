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
    INTERNAL_ERROR: "INTERNAL_ERROR",
    ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    UNAUTHORIZED: "UNAUTHORIZED",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/validation/api-schemas", () => ({
  regeneratePathwaySchema: { parse: vi.fn() },
}));

vi.mock("@/lib/db/reports", () => ({
  getReport: vi.fn(),
  updateReportJson: vi.fn(),
  checkReportOwnership: vi.fn(),
}));

vi.mock("@/lib/db/conditions", () => ({
  getRealConditions: vi.fn(),
  getRealConditionsByUserId: vi.fn(),
}));

vi.mock("@/lib/db/assessments", () => ({
  getEffectiveAssessment: vi.fn(),
}));

vi.mock("@/lib/report-generation/career-pathway", () => ({
  generateCareerPathway: vi.fn(),
}));

vi.mock("@/lib/report-generation/integration", () => ({
  generateIntegration: vi.fn(),
}));

vi.mock("@/lib/profile-generation/profile-algorithm", () => ({
  computeProfileAlgorithm: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  getReport,
  checkReportOwnership,
  updateReportJson,
} from "@/lib/db/reports";
import { getRealConditionsByUserId } from "@/lib/db/conditions";
import { getEffectiveAssessment } from "@/lib/db/assessments";
import { generateCareerPathway } from "@/lib/report-generation/career-pathway";
import { generateIntegration } from "@/lib/report-generation/integration";
import { computeProfileAlgorithm } from "@/lib/profile-generation/profile-algorithm";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/report/r1/regenerate-pathway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "s1" }),
  });
}

const mockContext = { params: Promise.resolve({ id: "r1" }) };

function allowGuard(user: { id: string } = { id: "u1" }) {
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
describe("POST /api/report/[id]/regenerate-pathway", () => {
  let handler: (req: Request, ctx?: unknown) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (
      req: Request,
      ctx?: unknown,
    ) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest(), mockContext);
    expect(res.status).toBe(401);
  });

  it("returns 404 when report not found", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "s1" },
    });
    (getReport as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(makeRequest(), mockContext);
    expect(res.status).toBe(404);
  });

  it("returns 403 when user does not own report", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "s1" },
    });
    (getReport as ReturnType<typeof vi.fn>).mockResolvedValue({
      assessmentId: "a1",
      locale: "en",
      careerMatch: {},
      meta: {},
    });
    (checkReportOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await handler(makeRequest(), mockContext);
    expect(res.status).toBe(403);
  });

  it("returns success after regenerating pathway", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "s1" },
    });
    (getReport as ReturnType<typeof vi.fn>).mockResolvedValue({
      assessmentId: "a1",
      locale: "en",
      careerMatch: {},
      meta: {},
    });
    (checkReportOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getRealConditionsByUserId as ReturnType<typeof vi.fn>).mockResolvedValue({
      budget: "low",
    });
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
    });
    (computeProfileAlgorithm as ReturnType<typeof vi.fn>).mockReturnValue({
      riasec: [],
    });
    (generateCareerPathway as ReturnType<typeof vi.fn>).mockResolvedValue({
      paths: [],
    });
    (generateIntegration as ReturnType<typeof vi.fn>).mockResolvedValue({
      letter: "hi",
    });
    (updateReportJson as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeRequest(), mockContext);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.report).toBeDefined();
  });
});
