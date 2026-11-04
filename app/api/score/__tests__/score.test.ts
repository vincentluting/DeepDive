import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/scoring", () => ({
  runScoringPipelineV3: vi.fn(),
}));

vi.mock("@/lib/db/assessments", () => ({
  saveAssessmentResult: vi.fn(),
}));

vi.mock("@/lib/db/sessions", () => ({
  ensureSessionExists: vi.fn(),
  completeSession: vi.fn(),
}));

vi.mock("@/lib/db/assessment-lifecycle", () => ({
  afterAssessmentComplete: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
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

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/analytics/client", () => ({
  serverAnalytics: {
    track: vi.fn().mockResolvedValue(undefined),
  },
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getCurrentUser } from "@/lib/auth";
import { runScoringPipelineV3 } from "@/lib/scoring";
import { saveAssessmentResult } from "@/lib/db/assessments";
import { ensureSessionExists, completeSession } from "@/lib/db/sessions";
import { parseBody } from "@/lib/validation/parse-body";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

// Bug-log #052 (PR 4) made guardRoute require auth AND the route enforces
// `canAccess(user.cohort, "deepDive")`. The default test user must therefore
// carry a cohort that grants Deep Dive entitlement (thesis / beta both do).
function allowGuard(
  user: { id: string; cohort?: string | null } | null = {
    id: "u1",
    cohort: "thesis_2026",
  },
) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

const validPayload = {
  sessionId: "sess-1",
  sjt: [{ questionId: 1, selectedOption: "A", responseTimeMs: 500 }],
  values: { "1": 5, "2": 4, "3": 3 },
  ipip: { "1": 4, "2": 3 },
  riasecNormalized: { R: 0.5, I: 0.7, A: 0.9, S: 0.6, E: 0.4, C: 0.3 },
  locale: "en",
};

const mockScoringResult = {
  version: "3.0",
  archetype: { primary: "Narrator", secondary: "Explorer" },
  dimensions: {},
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/score", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 403 when user cohort lacks Deep Dive entitlement (bug-log #052/#040)", async () => {
    // SECURITY: even with a valid session, a cohort that does not grant
    // `deepDive` (e.g. NULL cohort = no entitlements at all) must not be
    // able to write an AssessmentResult. Codex final round 2 explicitly
    // asked for this deny-case lock-in.
    allowGuard({ id: "u1", cohort: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validPayload,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(403);
    // saveAssessmentResult must NOT be invoked — the route short-circuits.
    expect(saveAssessmentResult).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
      blocked: true,
      response: new Response("Too many requests", { status: 429 }),
    });
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns 400 when validation fails", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });
    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 when riasecNormalized is missing", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validPayload, riasecNormalized: undefined },
    });
    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain("riasecNormalized");
  });

  it("returns 400 when sjt/ipip/values are missing", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        sessionId: "sess-1",
        riasecNormalized: validPayload.riasecNormalized,
      },
    });
    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain("sjt");
  });

  it("scores and saves assessment on valid payload", async () => {
    allowGuard({ id: "u1", cohort: "thesis_2026" });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validPayload,
    });
    (ensureSessionExists as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (runScoringPipelineV3 as ReturnType<typeof vi.fn>).mockReturnValue(
      mockScoringResult,
    );
    (saveAssessmentResult as ReturnType<typeof vi.fn>).mockResolvedValue("a-1");
    (completeSession as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.id).toBe("a-1");
    expect(json.version).toBe("3.0");

    expect(ensureSessionExists).toHaveBeenCalledWith(
      "sess-1",
      "en",
      "deep",
      "u1",
    );
    expect(runScoringPipelineV3).toHaveBeenCalledTimes(1);
    expect(saveAssessmentResult).toHaveBeenCalledTimes(1);
    expect(completeSession).toHaveBeenCalledWith("sess-1", 0);
  });

  it("still returns 200 even if completeSession fails", async () => {
    allowGuard({ id: "u1", cohort: "thesis_2026" });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validPayload,
    });
    (ensureSessionExists as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (runScoringPipelineV3 as ReturnType<typeof vi.fn>).mockReturnValue(
      mockScoringResult,
    );
    (saveAssessmentResult as ReturnType<typeof vi.fn>).mockResolvedValue("a-2");
    (completeSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("session fail"),
    );

    const res = await handler(makeRequest());
    // Score should still succeed — completeSession failure is non-fatal
    expect(res.status).toBe(200);
  });

  it("accepts pvq as backward-compat alias for values", async () => {
    allowGuard({ id: "u1", cohort: "thesis_2026" });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    const legacyPayload = {
      ...validPayload,
      values: undefined,
      pvq: { "1": 5, "2": 4 },
    };
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: legacyPayload,
    });
    (ensureSessionExists as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (runScoringPipelineV3 as ReturnType<typeof vi.fn>).mockReturnValue(
      mockScoringResult,
    );
    (saveAssessmentResult as ReturnType<typeof vi.fn>).mockResolvedValue("a-3");
    (completeSession as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(runScoringPipelineV3).toHaveBeenCalledTimes(1);
  });
});
