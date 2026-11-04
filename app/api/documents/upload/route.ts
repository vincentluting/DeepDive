// ============================================================
// POST /api/documents/upload — Resume Upload
//
// Accepts multipart/form-data with:
//   - file: document file (PDF, DOCX)
//   - assessmentId: string (required)
//   - sourceType: 'resume' (required)
//
// Returns: { type: 'resume', data: matchResult }
// ============================================================

export const runtime = "nodejs";
// LLM resume-parse has CALL_TIMEOUT_MS=90s and GLOBAL=250s (model-router.ts:508,512);
// allow 180s so worst-case provider fallback completes before vercel kills the route.
export const maxDuration = 180;

import { NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import {
  getAssessmentResult,
  verifyAssessmentOwnership,
} from "@/lib/db/assessments";
import { createResumeMatchResult } from "@/lib/db/resume-match";
import { setResumeAnalysisStatusByAssessment } from "@/lib/db/pipeline";
import { canAccessFeature } from "@/lib/access/check-access";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { parseResume, matchResumeToAssessment } from "@/lib/resume";
import type { DocumentSourceType } from "@/lib/documents/types";
import type { AssessmentResult } from "@/lib/types";

// ============================================================
// File size limits
// ============================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ============================================================
// Allowed MIME types
// ============================================================

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc"]);

// ============================================================
// Route handler
// ============================================================

export const POST = withLogging(
  "/api/documents/upload",
  async (request: NextRequest) => {
    let userId: string | undefined;
    let assessmentIdForErrorPath: string | null = null;
    try {
      // Rate limit: use 'ai' tier since this calls OpenAI.
      // requireAuth: the upload path now persists career evidence tied to a
      // user, so anonymous uploads are no longer acceptable.
      const guard = await guardRoute(request, {
        tier: "ai",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;
      userId = guard.user?.id;

      // Parse multipart form data
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Invalid form data. Expected multipart/form-data with file, assessmentId, and sourceType.",
          400,
        );
      }

      const file = formData.get("file");
      const assessmentId = formData.get("assessmentId");
      const sourceType = formData.get(
        "sourceType",
      ) as DocumentSourceType | null;

      // Validate sourceType
      if (!sourceType || sourceType !== "resume") {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          'Missing or invalid field: sourceType (must be "resume")',
          400,
        );
      }

      // Validate assessmentId
      if (
        !assessmentId ||
        typeof assessmentId !== "string" ||
        !assessmentId.trim()
      ) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Missing required field: assessmentId",
          400,
        );
      }
      assessmentIdForErrorPath = assessmentId;

      // Entitlement gate — resume enhancement follows the same cohort OR
      // purchase rule as aiReport/resumeEnhancement (see FEATURE_TO_TIER).
      // canAccessFeature handles both paths so paying users in the default
      // cohort aren't locked out here.
      if (!userId) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Authentication required.",
          401,
        );
      }
      const hasAccess = await canAccessFeature(
        userId,
        guard.user?.cohort,
        "resumeEnhancement",
      );
      if (!hasAccess) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Resume enhancement requires an active invite code or purchase.",
          403,
        );
      }

      // Validate file presence
      if (!file || !(file instanceof File)) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Missing required field: file",
          400,
        );
      }

      // Validate file size
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: {
              code: "FILE_TOO_LARGE",
              message: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the ${maxSizeMB}MB limit`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 413 },
        );
      }

      // Validate MIME type
      const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");

      if (!ALLOWED_MIME_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          {
            error: {
              code: "UNSUPPORTED_MEDIA_TYPE",
              message: `File type "${file.type}" is not supported. Please upload a PDF or DOCX file.`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 415 },
        );
      }

      // Ownership check: verify this user owns the assessment (directly or
      // through the legacy session fallback). Fold every non-owner outcome
      // into 404 so attackers can't enumerate assessmentIds via the
      // distinct 403. Critically, an AssessmentResult row with userId=null
      // that is NOT linked to the caller's session is rejected — without
      // the fallback helper, the old `owner.userId && ...` check would
      // short-circuit to "allow" on those legacy rows.
      const ownership = await verifyAssessmentOwnership(assessmentId, userId);
      if (ownership !== "owner") {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          `Assessment ${assessmentId} not found`,
          404,
        );
      }

      // Load the full assessment for the matcher.
      const assessment = await getAssessmentResult(assessmentId);
      if (!assessment) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          `Assessment ${assessmentId} not found`,
          404,
        );
      }

      // Mark resume analysis as running on the pipeline (best-effort — no-op
      // if no pipeline row exists yet, which is OK during the v1→v2 transition
      // window where the old flow uploads before /api/assessment/complete).
      await setResumeAnalysisStatusByAssessment(assessmentId, "running").catch(
        () => {},
      );

      const buffer = Buffer.from(await file.arrayBuffer());
      const typedAssessment = assessment as unknown as AssessmentResult;

      const resumeData = await parseResume(buffer, file.type);
      const matchResult = matchResumeToAssessment(resumeData, typedAssessment);

      // Persist the match result so the report generator can pick it up via
      // DB lookup rather than depending on Zustand store state. Any previous
      // active row for this assessment is superseded inside createResumeMatchResult.
      const resumeMatchId = await createResumeMatchResult({
        assessmentId,
        userId: userId ?? null,
        fileName: file.name,
        fileType: file.type,
        resumeData,
        matchResult,
      });

      await setResumeAnalysisStatusByAssessment(assessmentId, "done").catch(
        () => {},
      );

      return NextResponse.json({
        type: "resume",
        data: matchResult,
        resumeMatchId,
      });
    } catch (error) {
      // Best-effort: mark the pipeline step failed so the UI / ops digest can
      // see the resume analysis didn't land. Silence errors inside the catch
      // itself — the outer error response is what the user sees.
      if (assessmentIdForErrorPath) {
        await setResumeAnalysisStatusByAssessment(
          assessmentIdForErrorPath,
          "failed",
        ).catch(() => {});
      }
      logApiError("/api/documents/upload", ApiErrorCode.INTERNAL_ERROR, {
        userId,
        message: "Failed to process document upload",
        cause: error,
      });

      // Surface specific errors as user-friendly messages
      if (error instanceof Error) {
        if (
          error.message.includes("no extractable text") ||
          error.message.includes("empty document")
        ) {
          return createErrorResponse(
            ApiErrorCode.VALIDATION_ERROR,
            "The uploaded file contains no extractable text. Please upload a file with readable content.",
            400,
          );
        }
        if (error.message.includes("OpenAI API error")) {
          return createErrorResponse(
            ApiErrorCode.AI_SERVICE_ERROR,
            "AI service is temporarily unavailable. Please try again later.",
            503,
          );
        }
        if (error.message.includes("OPENAI_API_KEY")) {
          return createErrorResponse(
            ApiErrorCode.AI_NOT_CONFIGURED,
            "AI service is not configured. Please contact the administrator.",
            503,
          );
        }
        if (
          error.message.includes("Cannot find module") ||
          error.message.includes("MODULE_NOT_FOUND")
        ) {
          logApiError("/api/documents/upload", ApiErrorCode.INTERNAL_ERROR, {
            message: `Module loading failed: ${error.message}`,
          });
          return createErrorResponse(
            ApiErrorCode.INTERNAL_ERROR,
            "Document processing service is not available. Please contact the administrator.",
            503,
          );
        }
      }

      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to process document. Please try again or contact support.",
        500,
      );
    }
  },
);
