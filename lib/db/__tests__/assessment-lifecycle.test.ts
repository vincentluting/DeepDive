// ============================================================
// afterAssessmentComplete — error granularity regression tests
//
// Lifecycle side effects span 5 steps with very different
// importance. The boundary between "throw" and "log" is the
// reason users were stuck on the "正在准备你的档案" retry
// screen on 2026-05-09: the previous shape (`await
// afterAssessmentComplete(...)` without internal granularity)
// promoted any cache-class failure into a 500 that crashed the
// whole `/api/assessment/complete` request before
// `createPipeline` could run.
//
// Contract these tests pin down:
//   1. recordAssessmentCompletion failure  → throws (critical
//      registry write — explore-page unlock gate depends on it)
//   2. Genuine FSM violation                → throws
//      (transitionJourney rejected from a state the assessment
//      can't legally advance from)
//   3. Idempotent retake (FSM rejected because user already
//      passed the target state)            → does NOT throw
//   4. recomputeUserContext failure        → does NOT throw
//      (cache class; a stale UserContext row is repaired on
//      next read or by the pipeline worker)
//   5. Happy path                          → does NOT throw
// ============================================================

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const recordMock = vi.fn();
const transitionMock = vi.fn();
const getJourneyStateMock = vi.fn();
const adminSkipMock = vi.fn();
const recomputeMock = vi.fn();
const invalidateMock = vi.fn();
const getQdMock = vi.fn();
const getCanonicalMock = vi.fn();
const getLatestAssessmentMock = vi.fn();
const updateAssessmentRiasecMock = vi.fn();

vi.mock("@/lib/db/assessment-completion", () => ({
  recordAssessmentCompletion: (...args: unknown[]) => recordMock(...args),
}));
vi.mock("@/lib/db/journey", () => ({
  getJourneyState: (...args: unknown[]) => getJourneyStateMock(...args),
  transitionJourney: (...args: unknown[]) => transitionMock(...args),
  adminSkipJourney: (...args: unknown[]) => adminSkipMock(...args),
}));
vi.mock("@/lib/db/user-context", () => ({
  recomputeUserContext: (...args: unknown[]) => recomputeMock(...args),
}));
vi.mock("@/lib/db/cached", () => ({
  invalidateUserCache: (...args: unknown[]) => invalidateMock(...args),
}));
vi.mock("@/lib/db/platform", () => ({
  getLatestQuickDiveByUserId: (...args: unknown[]) => getQdMock(...args),
}));
vi.mock("@/lib/db/riasec-canonical", () => ({
  getCanonicalRiasec: (...args: unknown[]) => getCanonicalMock(...args),
}));
vi.mock("@/lib/db/assessments", () => ({
  getLatestAssessmentForUser: (...args: unknown[]) =>
    getLatestAssessmentMock(...args),
  updateAssessmentRiasec: (...args: unknown[]) =>
    updateAssessmentRiasecMock(...args),
}));

import { afterAssessmentComplete } from "@/lib/db/assessment-lifecycle";

const TEST_USER = "user-123";
const TEST_RESULT = "session-abc";

beforeEach(() => {
  recordMock.mockReset().mockResolvedValue(undefined);
  transitionMock.mockReset().mockResolvedValue({
    success: true,
    previousState: "quick_dive_complete",
    newState: "deep_dive_complete",
  });
  getJourneyStateMock.mockReset().mockResolvedValue("quick_dive_complete");
  adminSkipMock.mockReset().mockResolvedValue(undefined);
  recomputeMock.mockReset().mockResolvedValue(undefined);
  invalidateMock.mockReset();
  getQdMock.mockReset().mockResolvedValue(null);
  getCanonicalMock.mockReset();
  getLatestAssessmentMock.mockReset().mockResolvedValue(null);
  updateAssessmentRiasecMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("afterAssessmentComplete — error granularity", () => {
  it("happy path resolves without throwing", async () => {
    await expect(
      afterAssessmentComplete({
        userId: TEST_USER,
        assessmentType: "deep_dive",
        resultId: TEST_RESULT,
      }),
    ).resolves.toBeUndefined();
    expect(recordMock).toHaveBeenCalledOnce();
    expect(transitionMock).toHaveBeenCalledWith(
      TEST_USER,
      "COMPLETE_DEEP_DIVE",
      "system",
    );
    expect(recomputeMock).toHaveBeenCalledWith(TEST_USER);
    expect(invalidateMock).toHaveBeenCalledWith(TEST_USER);
  });

  it("propagates recordAssessmentCompletion errors (critical write)", async () => {
    recordMock.mockRejectedValueOnce(
      new Error("AssessmentCompletion INSERT failed"),
    );
    await expect(
      afterAssessmentComplete({
        userId: TEST_USER,
        assessmentType: "deep_dive",
        resultId: TEST_RESULT,
      }),
    ).rejects.toThrow(/AssessmentCompletion INSERT failed/);
    // Downstream steps must not run if the registry write failed.
    expect(transitionMock).not.toHaveBeenCalled();
    expect(recomputeMock).not.toHaveBeenCalled();
  });

  it("does NOT throw when transitionJourney rejects an idempotent retake (deep_dive_complete)", async () => {
    transitionMock.mockResolvedValueOnce({
      success: false,
      previousState: "deep_dive_complete",
      newState: "deep_dive_complete",
      error: "Invalid transition: deep_dive_complete + COMPLETE_DEEP_DIVE",
    });
    await expect(
      afterAssessmentComplete({
        userId: TEST_USER,
        assessmentType: "deep_dive",
        resultId: TEST_RESULT,
      }),
    ).resolves.toBeUndefined();
    expect(recomputeMock).toHaveBeenCalledOnce();
  });

  it("does NOT throw on retake when user is already at report_generated", async () => {
    transitionMock.mockResolvedValueOnce({
      success: false,
      previousState: "report_generated",
      newState: "report_generated",
      error: "Invalid transition",
    });
    await expect(
      afterAssessmentComplete({
        userId: TEST_USER,
        assessmentType: "deep_dive",
        resultId: TEST_RESULT,
      }),
    ).resolves.toBeUndefined();
  });

  it("THROWS when transitionJourney rejects from an unreachable state (genuine FSM violation)", async () => {
    transitionMock.mockResolvedValueOnce({
      success: false,
      previousState: "not_started",
      newState: "not_started",
      error: "Invalid transition: not_started + COMPLETE_DEEP_DIVE",
    });
    await expect(
      afterAssessmentComplete({
        userId: TEST_USER,
        assessmentType: "deep_dive",
        resultId: TEST_RESULT,
      }),
    ).rejects.toThrow(/Journey transition failed/);
  });

  it("does NOT throw when recomputeUserContext fails (cache-class side effect)", async () => {
    recomputeMock.mockRejectedValueOnce(
      new Error("UserContext UPSERT failed: connection lost"),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      afterAssessmentComplete({
        userId: TEST_USER,
        assessmentType: "deep_dive",
        resultId: TEST_RESULT,
      }),
    ).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    // Critical writes still ran.
    expect(recordMock).toHaveBeenCalledOnce();
    expect(transitionMock).toHaveBeenCalledOnce();
    errorSpy.mockRestore();
  });

  it("does NOT throw when invalidateUserCache fails after a successful recompute", async () => {
    invalidateMock.mockImplementationOnce(() => {
      throw new Error("cache layer unavailable");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      afterAssessmentComplete({
        userId: TEST_USER,
        assessmentType: "deep_dive",
        resultId: TEST_RESULT,
      }),
    ).resolves.toBeUndefined();
    errorSpy.mockRestore();
  });

  it("quick_dive retake from any non-`not_started` state is treated as expected", async () => {
    transitionMock.mockResolvedValueOnce({
      success: false,
      previousState: "profile_generated",
      newState: "profile_generated",
      error: "Invalid transition",
    });
    await expect(
      afterAssessmentComplete({
        userId: TEST_USER,
        assessmentType: "quick_dive",
        resultId: TEST_RESULT,
      }),
    ).resolves.toBeUndefined();
  });
});
