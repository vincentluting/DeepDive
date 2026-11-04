import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (before imports) ──────────────────────────────────
vi.mock("@/lib/db/platform", () => ({
  saveQuickDiveResult: vi.fn(),
}));

vi.mock("@/lib/db/assessment-lifecycle", () => ({
  afterAssessmentComplete: vi.fn(),
}));

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    DB_CONSTRAINT_FAILED: "DB_CONSTRAINT_FAILED",
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

import { guardRoute } from "@/lib/api/api-guard";
import { saveQuickDiveResult } from "@/lib/db/platform";
import { afterAssessmentComplete } from "@/lib/db/assessment-lifecycle";
import { parseBody } from "@/lib/validation/parse-body";

// ── Helpers ─────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/quickdive/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function allowGuard(
  user: {
    id: string;
    researchGroup?: "classic" | "immersive" | null;
  } | null = null,
) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 429) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Rate limited", { status }),
  });
}

const validData = {
  scores: { R: 10, I: 15, A: 20, S: 12, E: 8, C: 5 },
  code: "A",
  label: "Creative",
  locale: "en",
  resultData: { sortedScores: [] },
  exploreMode: "classic",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────
describe("POST /api/quickdive/save", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 429 when guard blocks", async () => {
    blockGuard(429);
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns error when parseBody fails", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it("saves result for anonymous user", async () => {
    allowGuard(); // no user
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (saveQuickDiveResult as ReturnType<typeof vi.fn>).mockResolvedValue(
      "qd-123",
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({ success: true, id: "qd-123" });

    expect(saveQuickDiveResult).toHaveBeenCalledWith({
      scores: validData.scores,
      archetypeCode: "A",
      archetypeLabel: "Creative",
      language: "en",
      userId: null,
      anonymousId: null,
      resultData: { sortedScores: [] },
      exploreMode: "classic",
      environment: "development",
      avatarGender: null,
    });

    // No lifecycle call for anonymous users
    expect(afterAssessmentComplete).not.toHaveBeenCalled();
  });

  it("saves result and triggers lifecycle for authenticated user", async () => {
    allowGuard({ id: "user-1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (saveQuickDiveResult as ReturnType<typeof vi.fn>).mockResolvedValue(
      "qd-456",
    );
    (afterAssessmentComplete as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(saveQuickDiveResult).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
    );

    expect(afterAssessmentComplete).toHaveBeenCalledWith({
      userId: "user-1",
      assessmentType: "quick_dive",
      resultId: "qd-456",
      achievementContext: { exploreMode: "classic" },
    });
  });

  it("uses immersive_dive assessment type for immersive mode", async () => {
    allowGuard({ id: "user-1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, exploreMode: "immersive" },
    });
    (saveQuickDiveResult as ReturnType<typeof vi.fn>).mockResolvedValue(
      "qd-789",
    );
    (afterAssessmentComplete as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    await handler(makeRequest());

    expect(afterAssessmentComplete).toHaveBeenCalledWith(
      expect.objectContaining({ assessmentType: "immersive_dive" }),
    );
  });

  it("uses immersive_dive assessment type for legacy narrative mode", async () => {
    allowGuard({ id: "user-1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, exploreMode: "narrative" },
    });
    (saveQuickDiveResult as ReturnType<typeof vi.fn>).mockResolvedValue(
      "qd-legacy",
    );
    (afterAssessmentComplete as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    await handler(makeRequest());

    expect(afterAssessmentComplete).toHaveBeenCalledWith({
      userId: "user-1",
      assessmentType: "immersive_dive",
      resultId: "qd-legacy",
      achievementContext: { exploreMode: "narrative" },
    });
  });

  it("rejects a classic research participant saving an immersive result (#106)", async () => {
    allowGuard({ id: "user-1", researchGroup: "classic" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, exploreMode: "immersive" },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
    expect(saveQuickDiveResult).not.toHaveBeenCalled();
  });

  it("allows an immersive research participant to save an immersive result (#106)", async () => {
    allowGuard({ id: "user-1", researchGroup: "immersive" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, exploreMode: "immersive" },
    });
    (saveQuickDiveResult as ReturnType<typeof vi.fn>).mockResolvedValue(
      "qd-imm",
    );
    (afterAssessmentComplete as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
  });

  it("returns 500 when authenticated lifecycle progression fails", async () => {
    allowGuard({ id: "user-1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (saveQuickDiveResult as ReturnType<typeof vi.fn>).mockResolvedValue(
      "qd-lifecycle-fail",
    );
    (afterAssessmentComplete as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("journey update failed"),
    );

    const res = await handler(makeRequest());

    expect(res.status).toBe(500);
    expect(afterAssessmentComplete).toHaveBeenCalledOnce();
  });

  it("returns 500 when saveQuickDiveResult throws", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (saveQuickDiveResult as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("constraint violation"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe("DB_CONSTRAINT_FAILED");
  });
});
