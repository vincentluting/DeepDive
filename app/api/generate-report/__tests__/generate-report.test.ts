import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (before imports) ──────────────────────────────────
const mockSql = vi.fn();
vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

vi.mock("@/lib/report-generation", () => ({
  generateCareerReport: vi.fn(),
}));

vi.mock("@/lib/access/check-access", () => ({
  canAccessFeature: vi.fn(),
}));

vi.mock("@/lib/db/assessments", () => ({
  getEffectiveAssessment: vi.fn(),
  verifyAssessmentOwnership: vi.fn(),
}));

vi.mock("@/lib/db/conditions", () => ({
  getRealConditions: vi.fn(),
  getRealConditionsByUserId: vi.fn(),
}));

vi.mock("@/lib/db/profiles", () => ({
  getProfileByAssessment: vi.fn(),
}));

vi.mock("@/lib/db/reports", () => ({
  saveReportTransactional: vi.fn(),
  getReportByAssessment: vi.fn(),
  getReportIdByAssessment: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/journey", () => ({
  getJourneyState: vi.fn().mockResolvedValue("report_generated"),
}));

vi.mock("@/lib/report/prerequisites", () => ({
  computeInputHash: vi.fn().mockReturnValue("hash-abc"),
}));

vi.mock("@/lib/db/assessment-lifecycle", () => ({
  afterReportGenerated: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/achievements/engine", () => ({
  checkAchievements: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/coaching/trigger-coach-message", () => ({
  triggerCoachMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/report-generation-lock", () => ({
  acquireReportLock: vi
    .fn()
    .mockResolvedValue({ assessmentId: "a1", instanceId: "test-instance" }),
  releaseReportLock: vi.fn().mockResolvedValue(undefined),
}));

// Resume enhancement lookup — mocked so the happy path doesn't hit a real
// DB. Default: null (no resume uploaded yet). Individual tests can override
// via mockResolvedValueOnce.
vi.mock("@/lib/db/resume-match", () => ({
  getLatestActiveResumeMatch: vi.fn().mockResolvedValue(null),
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
    CONFLICT: "CONFLICT",
    AI_NOT_CONFIGURED: "AI_NOT_CONFIGURED",
    AI_KEY_INVALID: "AI_KEY_INVALID",
    AI_RATE_LIMITED: "AI_RATE_LIMITED",
    AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
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

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { canAccessFeature } from "@/lib/access/check-access";
import {
  getEffectiveAssessment,
  verifyAssessmentOwnership,
} from "@/lib/db/assessments";
import { getRealConditionsByUserId } from "@/lib/db/conditions";
import { getProfileByAssessment } from "@/lib/db/profiles";
import {
  saveReportTransactional,
  getReportByAssessment,
} from "@/lib/db/reports";
import { getCurrentUser } from "@/lib/auth";
import { generateCareerReport } from "@/lib/report-generation";
import { getJourneyState } from "@/lib/db/journey";
import { afterReportGenerated } from "@/lib/db/assessment-lifecycle";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { parseBody } from "@/lib/validation/parse-body";
import type { AssessmentInput } from "@/lib/types";
import {
  computeProfileInputHash,
  PROFILE_ALGORITHM_VERSION,
} from "@/lib/profile-generation/profile-fingerprint";

// ── Helpers ─────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/generate-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

function allowGuard(user: { id: string; cohort?: string }) {
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

const mockAssessment = {
  id: "assess-1",
  sessionId: "sess-1",
  riasecNormalized: { R: 0.5, I: 0.7, A: 0.8, S: 0.6, E: 0.3, C: 0.4 },
};

const mockReport = {
  integration: {
    letterToUser: "Dear user...",
    coreInsight: "You are creative.",
  },
  careerDrainWarning: {
    drainingDirections: [{ title_en: "Accounting", title_zh: "会计" }],
  },
};

/** Set up all mocks for a successful generation */
function setupHappyPath() {
  allowGuard({ id: "user-1", cohort: "research-2026" });
  (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { assessmentId: "assess-1", locale: "en" },
  });
  (getReportByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(
    mockAssessment,
  );
  (verifyAssessmentOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(
    "owner",
  );
  (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "user-1",
  });
  (getRealConditionsByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
    null,
  );
  (getProfileByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (generateCareerReport as ReturnType<typeof vi.fn>).mockResolvedValue(
    mockReport,
  );
  (saveReportTransactional as ReturnType<typeof vi.fn>).mockResolvedValue(
    "rpt-1",
  );
  (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
    "report_generated",
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────
describe("POST /api/generate-report", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  // ── Auth & entitlement gates ──

  it("returns 401 when guard blocks", async () => {
    blockGuard(401);
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 when user lacks aiReport entitlement", async () => {
    allowGuard({ id: "user-1", cohort: undefined });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await handler(makeRequest());
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.message).toContain("invite code");
  });

  it("returns error when parseBody fails", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  // ── Dedup: existing report ──

  it("returns existing reportId without regenerating", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "assess-1", locale: "en" },
    });
    (getReportByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing-rpt",
    });
    (verifyAssessmentOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(
      "owner",
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.reportId).toBe("existing-rpt");
    expect(generateCareerReport).not.toHaveBeenCalled();
  });

  it("returns 404 (never the report id) for an assessment the caller does not own", async () => {
    allowGuard({ id: "user-2", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "assess-1", locale: "en" },
    });
    // A report exists, but the caller does not own the assessment.
    (getReportByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing-rpt",
    });
    (verifyAssessmentOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(
      "forbidden",
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(404);
    // The ownership gate runs BEFORE the existing-report fast-path.
    expect(getReportByAssessment).not.toHaveBeenCalled();
    expect(generateCareerReport).not.toHaveBeenCalled();
  });

  // ── Assessment not found ──

  it("returns 404 when assessment does not exist", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "nonexistent", locale: "en" },
    });
    (getReportByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(404);
  });

  // ── Happy path ──

  it("generates report and returns reportId", async () => {
    setupHappyPath();

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.reportId).toBe("rpt-1");

    // realConditions is undefined (both lookups returned nothing), profile is null.
    // Trailing args: onProgress (undefined), resumeMatch (null), userId (string)
    // — userId added 2026-05-18 for LLMPromptMeta observability.
    expect(generateCareerReport).toHaveBeenCalledWith(
      mockAssessment,
      undefined,
      "en",
      undefined,
      null,
      undefined,
      null,
      "user-1",
    );
    expect(saveReportTransactional).toHaveBeenCalled();
    expect(afterReportGenerated).toHaveBeenCalledWith("user-1");
    expect(trackFunnelEvent).toHaveBeenCalledWith(
      "report_generated",
      expect.objectContaining({
        userId: "user-1",
      }),
    );
  });

  it("passes real conditions and profile algo snapshot when available", async () => {
    setupHappyPath();
    const mockConditions = { country: "NL", visaStatus: "student_visa" };
    const mockAlgoSnapshot = { bigFiveDomains: { openness: 75 } };
    (getRealConditionsByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockConditions,
    );
    (getProfileByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      algorithmVersion: PROFILE_ALGORITHM_VERSION,
      profileInputHash: computeProfileInputHash(
        mockAssessment as unknown as AssessmentInput,
      ),
      algoSnapshot: mockAlgoSnapshot,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(generateCareerReport).toHaveBeenCalledWith(
      mockAssessment,
      mockConditions,
      "en",
      mockAlgoSnapshot,
      null,
      undefined,
      null,
      "user-1",
    );
  });

  it("does not reuse a stale profile algo snapshot with a fresh assessment", async () => {
    setupHappyPath();
    const staleAlgoSnapshot = { bigFiveDomains: { openness: 12 } };
    (getProfileByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      algorithmVersion: PROFILE_ALGORITHM_VERSION,
      profileInputHash: "stale-profile-input",
      algoSnapshot: staleAlgoSnapshot,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const call = (generateCareerReport as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(call[0]).toBe(mockAssessment);
    expect(call[2]).toBe("en");
    expect(call[3]).toBeUndefined();
    expect(call[4]).toBeNull();
  });

  // ── Refresh mode ──

  it("deletes existing report in refresh mode before regenerating", async () => {
    setupHappyPath();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "assess-1", locale: "en", refresh: true },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    // Should have called sql to delete existing report
    expect(mockSql).toHaveBeenCalled();
    expect(generateCareerReport).toHaveBeenCalled();
  });

  // ── LLM error mapping ──

  it("returns 503 when AI is not configured", async () => {
    setupHappyPath();
    (generateCareerReport as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("OPENAI_API_KEY is not set"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(503);

    const json = await res.json();
    expect(json.error).toBe("AI_NOT_CONFIGURED");
  });

  it("returns 429 when AI is rate limited", async () => {
    setupHappyPath();
    (generateCareerReport as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("API error: 429 rate limit exceeded"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(429);

    const json = await res.json();
    expect(json.error).toBe("AI_RATE_LIMITED");
  });

  it("returns 502 when AI service errors", async () => {
    setupHappyPath();
    (generateCareerReport as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("API error: 500 server error"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(502);

    const json = await res.json();
    expect(json.error).toBe("AI_SERVICE_ERROR");
  });

  it("returns 504 on timeout", async () => {
    setupHappyPath();
    (generateCareerReport as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Request timed out after 100s"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(504);
  });

  it("returns 200 with reportId even when journey transition fails", async () => {
    setupHappyPath();
    // Journey state doesn't advance — but report should still be returned
    (afterReportGenerated as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("journey DB write failed"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.reportId).toBeTruthy();
  });

  it("returns 500 on unknown errors", async () => {
    setupHappyPath();
    (generateCareerReport as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Something completely unexpected"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe("INTERNAL_ERROR");
  });
});
