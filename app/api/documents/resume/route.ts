// ============================================================
// DELETE /api/documents/resume?assessmentId=…
//
// Soft-removes the active ResumeMatchResult for an assessment so future
// report generations no longer pick it up. The row stays in the table
// (supersededAt set) for thesis provenance — see migration 078 and the
// "Remove" semantics decision in /Users/l/.claude/plans/i-noted-…hejlsberg.md.
//
// Also flips the pipeline's resumeAnalysisStatus to 'skipped' so a later
// regenerate without a fresh upload produces a Standard report (the cron
// fallback otherwise honors a stale persisted match).
//
// Idempotent: deleting twice returns supersededCount=0 the second time.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { verifyAssessmentOwnership } from "@/lib/db/assessments";
import { supersedeActiveResumeMatches } from "@/lib/db/resume-match";
import { setResumeAnalysisStatusByAssessment } from "@/lib/db/pipeline";

export const runtime = "nodejs";

export const DELETE = withLogging(
  "/api/documents/resume",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;
    const userId = guard.user?.id;
    if (!userId) {
      return createErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        "Authentication required.",
        401,
      );
    }

    const assessmentId = new URL(request.url).searchParams.get("assessmentId");
    if (!assessmentId || !assessmentId.trim()) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Missing required query parameter: assessmentId",
        400,
      );
    }

    // Fold every non-owner outcome into 404 so attackers can't enumerate
    // assessmentIds via the distinct 403 — same convention as upload route.
    const ownership = await verifyAssessmentOwnership(assessmentId, userId);
    if (ownership !== "owner") {
      return createErrorResponse(
        ApiErrorCode.ASSESSMENT_NOT_FOUND,
        `Assessment ${assessmentId} not found`,
        404,
      );
    }

    try {
      const supersededCount = await supersedeActiveResumeMatches(assessmentId);
      // Best-effort: if the pipeline row doesn't exist (legacy user before
      // pipeline FSM), no-op. Otherwise mark 'skipped' so the cron worker
      // doesn't silently re-enhance.
      await setResumeAnalysisStatusByAssessment(assessmentId, "skipped").catch(
        () => {},
      );

      return NextResponse.json({ success: true, supersededCount });
    } catch (e) {
      logApiError("/api/documents/resume", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to supersede resume match",
        cause: e,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to remove resume. Please try again.",
        500,
      );
    }
  },
);
