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
    AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
    AI_NOT_CONFIGURED: "AI_NOT_CONFIGURED",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/db/assessments", () => ({
  getAssessmentResult: vi.fn(),
  verifyAssessmentOwnership: vi.fn(),
}));

vi.mock("@/lib/resume", () => ({
  parseResume: vi.fn(),
  matchResumeToAssessment: vi.fn(),
}));

vi.mock("@/lib/access/check-access", () => ({
  canAccessFeature: vi.fn(),
}));

vi.mock("@/lib/db/resume-match", () => ({
  createResumeMatchResult: vi.fn(),
}));

vi.mock("@/lib/db/pipeline", () => ({
  setResumeAnalysisStatusByAssessment: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import {
  verifyAssessmentOwnership,
  getAssessmentResult,
} from "@/lib/db/assessments";
import { canAccessFeature } from "@/lib/access/check-access";
import { createResumeMatchResult } from "@/lib/db/resume-match";
import { setResumeAnalysisStatusByAssessment } from "@/lib/db/pipeline";
import { parseResume, matchResumeToAssessment } from "@/lib/resume";

// ── Helpers ──────────────────────────────────────────────────
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

function makeUploadRequest(fields: Record<string, string | File> = {}) {
  const formData = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    formData.append(k, v);
  }
  return new Request("http://localhost/api/documents/upload", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  (verifyAssessmentOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(
    "owner",
  );
  (createResumeMatchResult as ReturnType<typeof vi.fn>).mockResolvedValue(
    "rm-1",
  );
  (
    setResumeAnalysisStatusByAssessment as ReturnType<typeof vi.fn>
  ).mockResolvedValue(undefined);
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/documents/upload", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns guard response when blocked", async () => {
    blockGuard();
    const res = await handler(makeUploadRequest());
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing sourceType", async () => {
    allowGuard();
    const file = new File(["test"], "resume.pdf", { type: "application/pdf" });
    const res = await handler(makeUploadRequest({ file, assessmentId: "a1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing assessmentId", async () => {
    allowGuard();
    const file = new File(["test"], "resume.pdf", { type: "application/pdf" });
    const res = await handler(
      makeUploadRequest({ file, sourceType: "resume" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns resume match result on success", async () => {
    allowGuard();
    (getAssessmentResult as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
    });
    (parseResume as ReturnType<typeof vi.fn>).mockResolvedValue({
      skills: ["js"],
    });
    (matchResumeToAssessment as ReturnType<typeof vi.fn>).mockReturnValue({
      score: 0.8,
    });

    const file = new File(["pdf content"], "resume.pdf", {
      type: "application/pdf",
    });
    const res = await handler(
      makeUploadRequest({
        file,
        assessmentId: "a1",
        sourceType: "resume",
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.type).toBe("resume");
    expect(json.data.score).toBe(0.8);
  });

  it("returns 404 when assessment not found", async () => {
    allowGuard();
    (getAssessmentResult as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const file = new File(["pdf content"], "resume.pdf", {
      type: "application/pdf",
    });
    const res = await handler(
      makeUploadRequest({
        file,
        assessmentId: "missing",
        sourceType: "resume",
      }),
    );
    expect(res.status).toBe(404);
  });
});
