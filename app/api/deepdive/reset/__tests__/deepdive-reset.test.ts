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

vi.mock("@/lib/db/sessions", () => ({
  getLatestDeepDiveSessionId: vi.fn(),
  markSessionAbandoned: vi.fn(),
}));

vi.mock("@/lib/db/assessments", () => ({
  deleteAssessmentsBySession: vi.fn(),
}));

vi.mock("@/lib/db/reports", () => ({
  deleteReportByAssessment: vi.fn(),
}));

vi.mock("@/lib/db/conditions", () => ({
  deleteRealConditionsBySession: vi.fn(),
}));

vi.mock("@/lib/db/exploration-progress", () => ({
  resetDeepDiveModules: vi.fn(),
}));

vi.mock("@/lib/db/assessment-completion", () => ({
  deleteAssessmentCompletion: vi.fn(),
}));

vi.mock("@/lib/db/journey", () => ({
  rollbackJourneyAfterDeepReset: vi.fn(),
}));

vi.mock("@/lib/db/user-context", () => ({
  recomputeUserContext: vi.fn(),
}));

vi.mock("@/lib/db/cached", () => ({
  invalidateUserCache: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import {
  getLatestDeepDiveSessionId,
  markSessionAbandoned,
} from "@/lib/db/sessions";
import { deleteAssessmentsBySession } from "@/lib/db/assessments";
import { deleteReportByAssessment } from "@/lib/db/reports";
import { deleteRealConditionsBySession } from "@/lib/db/conditions";
import { resetDeepDiveModules } from "@/lib/db/exploration-progress";
import { deleteAssessmentCompletion } from "@/lib/db/assessment-completion";
import { rollbackJourneyAfterDeepReset } from "@/lib/db/journey";
import { recomputeUserContext } from "@/lib/db/user-context";
import { invalidateUserCache } from "@/lib/db/cached";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/deepdive/reset", {
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
describe("POST /api/deepdive/reset", () => {
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

  it("resets full pipeline when session+assessment+report exist", async () => {
    allowGuard({ id: "u1" });
    (getLatestDeepDiveSessionId as ReturnType<typeof vi.fn>).mockResolvedValue(
      "s-deep",
    );
    (deleteAssessmentsBySession as ReturnType<typeof vi.fn>).mockResolvedValue(
      "a-1",
    );
    (deleteReportByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (
      deleteRealConditionsBySession as ReturnType<typeof vi.fn>
    ).mockResolvedValue(undefined);
    (markSessionAbandoned as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (resetDeepDiveModules as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (deleteAssessmentCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (rollbackJourneyAfterDeepReset as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (recomputeUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    expect(deleteAssessmentsBySession).toHaveBeenCalledWith("s-deep");
    expect(deleteReportByAssessment).toHaveBeenCalledWith("a-1");
    expect(deleteRealConditionsBySession).toHaveBeenCalledWith("s-deep");
    expect(markSessionAbandoned).toHaveBeenCalledWith("s-deep");
    expect(resetDeepDiveModules).toHaveBeenCalledWith("u1");
    expect(deleteAssessmentCompletion).toHaveBeenCalledWith("u1", "deep_dive");
    expect(rollbackJourneyAfterDeepReset).toHaveBeenCalledWith("u1");
    expect(recomputeUserContext).toHaveBeenCalledWith("u1");
    expect(invalidateUserCache).toHaveBeenCalledWith("u1");
  });

  it("skips report deletion when no assessment found", async () => {
    allowGuard({ id: "u1" });
    (getLatestDeepDiveSessionId as ReturnType<typeof vi.fn>).mockResolvedValue(
      "s-deep",
    );
    (deleteAssessmentsBySession as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (
      deleteRealConditionsBySession as ReturnType<typeof vi.fn>
    ).mockResolvedValue(undefined);
    (markSessionAbandoned as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (resetDeepDiveModules as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (deleteAssessmentCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (rollbackJourneyAfterDeepReset as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (recomputeUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(deleteReportByAssessment).not.toHaveBeenCalled();
  });

  it("still resets modules when no session exists", async () => {
    allowGuard({ id: "u1" });
    (getLatestDeepDiveSessionId as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (resetDeepDiveModules as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (deleteAssessmentCompletion as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (rollbackJourneyAfterDeepReset as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (recomputeUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    // Session-dependent operations should not be called
    expect(deleteAssessmentsBySession).not.toHaveBeenCalled();
    expect(markSessionAbandoned).not.toHaveBeenCalled();
    // But module reset and completion clear should still run
    expect(resetDeepDiveModules).toHaveBeenCalledWith("u1");
    expect(deleteAssessmentCompletion).toHaveBeenCalledWith("u1", "deep_dive");
    expect(rollbackJourneyAfterDeepReset).toHaveBeenCalledWith("u1");
    expect(recomputeUserContext).toHaveBeenCalledWith("u1");
  });

  it("returns 500 on DB error", async () => {
    allowGuard({ id: "u1" });
    (getLatestDeepDiveSessionId as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
