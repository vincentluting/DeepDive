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
vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));
vi.mock("@/components/quickdive/quickdive-data", () => ({
  QUESTIONS: [],
}));
vi.mock("@/lib/admin/generate-random-answers", () => ({
  generateQuickDiveAnswers: vi.fn(() => ({
    scores: { R: 5, I: 4, A: 3, S: 2, E: 1, C: 0 },
    rawScores: { R: 5, I: 4, A: 3, S: 2, E: 1, C: 0 },
  })),
  computeQuickDiveResult: vi.fn(() => ({
    code: "RE",
    label: "Test",
    resultData: {},
  })),
  normalizeRiasecScores: vi.fn(() => ({
    R: 80,
    I: 60,
    A: 40,
    S: 30,
    E: 20,
    C: 10,
  })),
  buildArchetype: vi.fn(() => ({ primary: "RE", code: "RE" })),
  generateDeepDiveAnswersV3: vi.fn(),
  generateSessionMetadataV3: vi.fn(),
  generateRandomQuickTwIVIAnswers: vi.fn(() => ({})),
}));
vi.mock("@/lib/assessment/twivi-quick", () => ({
  computeQuickValueOrientation: vi.fn(() => ({
    orientation: "Enhancement",
    scores: {},
  })),
}));
vi.mock("@/lib/scoring", () => ({ runScoringPipelineV3: vi.fn() }));
vi.mock("@/lib/db/assessments", () => ({ saveAssessmentResult: vi.fn() }));
vi.mock("@/lib/db/sessions", () => ({ ensureSessionExists: vi.fn() }));
vi.mock("@/lib/report-generation", () => ({ generateCareerReport: vi.fn() }));
vi.mock("@/lib/db/reports", () => ({ saveReportTransactional: vi.fn() }));
vi.mock("@/lib/db/platform", () => ({
  saveQuickDiveResult: vi.fn(() => "qd-1"),
}));
vi.mock("@/lib/profile-generation/generate-profile", () => ({
  generateProfile: vi.fn(() => ({
    algoSnapshot: null,
    narrativeSnapshots: {},
  })),
}));
vi.mock("@/lib/db/profiles", () => ({ saveProfile: vi.fn() }));
vi.mock("@/lib/db/admin-presets", () => ({ getAdminPreset: vi.fn() }));
vi.mock("@/lib/db/assessment-lifecycle", () => ({
  afterAssessmentComplete: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";

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

describe("POST /api/admin/auto-fill", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect(
      (
        await handler(
          new Request("http://localhost/api/admin/auto-fill", {
            method: "POST",
          }),
        )
      ).status,
    ).toBe(403);
  });

  it("returns quick dive result (happy path)", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        type: "quick",
        locale: "en",
        generateReport: false,
        usePreset: false,
      },
    });

    const json = await (
      await handler(
        new Request("http://localhost/api/admin/auto-fill", { method: "POST" }),
      )
    ).json();
    expect(json.type).toBe("quick");
    expect(json.reportId).toBe("qd-1");
    expect(json.code).toBe("RE");
  });

  it("returns validation error on bad body", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });

    const res = await handler(
      new Request("http://localhost/api/admin/auto-fill", { method: "POST" }),
    );
    expect(res.status).toBe(400);
  });
});
