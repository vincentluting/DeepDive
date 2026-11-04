// ============================================================
// POST /api/report/[id]/regenerate-pathway — Regenerate Career Pathway + Integration
//
// Input:  { sessionId: string }
// Output: { success: true, report: CareerReport }
//
// Regenerates only the career pathway and Integration (letter/transitions)
// using newly saved reality conditions. Does NOT re-run full pipeline.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";
import { regeneratePathwaySchema } from "@/lib/validation/api-schemas";
import {
  getReport,
  updateReportJson,
  checkReportOwnership,
} from "@/lib/db/reports";
import {
  getRealConditions,
  getRealConditionsByUserId,
} from "@/lib/db/conditions";
import { getEffectiveAssessment } from "@/lib/db/assessments";
import { generateCareerPathway } from "@/lib/report-generation/career-pathway";
import { generateIntegration } from "@/lib/report-generation/integration";
import { computeProfileAlgorithm } from "@/lib/profile-generation/profile-algorithm";
import type { AssessmentResult, CareerReport } from "@/lib/types";
import type { ProfileNarrativeOutput } from "@/lib/report-generation/types";
import type { ResumeMatchResult } from "@/lib/resume/types";

export const maxDuration = 120;

export const POST = withLogging(
  "/api/report/[id]/regenerate-pathway",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const { id: reportId } = await context.params;

      const parsed = await parseBody(request, regeneratePathwaySchema);
      if ("error" in parsed) return parsed.error;
      const { sessionId } = parsed.data;

      // Fetch existing report
      const report = await getReport(reportId);
      if (!report) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Report not found",
          404,
        );
      }

      // Ownership check: only the report owner can regenerate
      if (guard.user?.id) {
        const isOwner = await checkReportOwnership(reportId, guard.user.id);
        if (!isOwner) {
          return createErrorResponse(
            ApiErrorCode.UNAUTHORIZED,
            "You can only regenerate your own report",
            403,
          );
        }
      } else {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Authentication required",
          401,
        );
      }

      // Fetch reality conditions — userId-first, sessionId fallback
      let realConditions = await getRealConditionsByUserId(guard.user?.id);
      if (!realConditions) {
        realConditions = await getRealConditions(sessionId);
      }
      if (!realConditions) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "No reality conditions found for this session",
          400,
        );
      }

      // Fetch assessment with latest QD RIASEC merged
      const assessment = await getEffectiveAssessment(
        report.assessmentId,
        guard.user?.id,
      );
      if (!assessment) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Assessment not found",
          404,
        );
      }

      const locale = report.locale || "en";

      // Recompute profile algorithm output (needed for career pathway and integration)
      const profileAlgo = computeProfileAlgorithm(
        assessment as AssessmentResult,
      );

      // Build resumeEvidence FIRST so we can thread it into both the pathway
      // and integration regen calls. R5 invariant: reuse THIS report's
      // snapshot rather than the latest active ResumeMatchResult, otherwise
      // a newer resume uploaded after report generation would splice
      // new-resume language into pathway/integration while careerMatch +
      // resumeEvidence + meta.resumeMatchId still point at the OLD resume —
      // a visibly inconsistent hybrid.
      //
      // Carry experience signals (userTargetTier + autoFillRealConditions)
      // forward when the snapshot has them (codex P1 fix 2026-05-23) — these
      // anchor the Career Pathway "seniority MUST match" prompt rule.
      // Snapshots written before that fix lack them; we degrade gracefully
      // to empty autoFill rather than failing the regen.
      const reportEvidence = report.resumeEvidence ?? null;
      const resumeEvidence: ResumeMatchResult | null =
        report.meta?.resumeEnhanced && reportEvidence
          ? {
              alignedDimensions: reportEvidence.alignedDimensions,
              conflictingDimensions: reportEvidence.conflictingDimensions,
              summary_zh: reportEvidence.summary_zh,
              summary_en: reportEvidence.summary_en,
              autoFillRealConditions:
                reportEvidence.autoFillRealConditions ?? {},
              ...(reportEvidence.userTargetTier && {
                userTargetTier: reportEvidence.userTargetTier,
              }),
            }
          : null;

      // Generate new career pathway with real conditions + resume evidence
      // (LLM call #1, with retry). Resume evidence calibrates Week 1 task
      // difficulty + jobDirections seniority so a resume-enhanced report's
      // pathway regen keeps the 30-day plan grounded in actual experience.
      let newPathway;
      try {
        newPathway = await generateCareerPathway(
          assessment as AssessmentResult,
          report.careerMatch,
          profileAlgo,
          realConditions,
          locale,
          guard.user?.id ?? null,
          resumeEvidence,
        );
      } catch (pathwayErr) {
        console.warn(
          "[regenerate-pathway] Pathway attempt 1 failed, retrying in 10s:",
          pathwayErr instanceof Error ? pathwayErr.message : pathwayErr,
        );
        await new Promise((r) => setTimeout(r, 10_000));
        newPathway = await generateCareerPathway(
          assessment as AssessmentResult,
          report.careerMatch,
          profileAlgo,
          realConditions,
          locale,
          guard.user?.id ?? null,
          resumeEvidence,
        );
      }

      // v3.0: profile narratives are generated separately — pass null so integration
      // uses algo-based fallback for any personality context it needs.
      const profileNarratives: ProfileNarrativeOutput | null = null;

      // Generate new Integration (LLM call #2, with retry)
      let newIntegration;
      try {
        newIntegration = await generateIntegration(
          assessment as AssessmentResult,
          profileAlgo,
          report.careerMatch,
          profileNarratives,
          newPathway,
          locale,
          resumeEvidence,
          realConditions,
          guard.user?.id ?? null,
        );
      } catch (integrationErr) {
        console.warn(
          "[regenerate-pathway] Integration attempt 1 failed, retrying in 10s:",
          integrationErr instanceof Error
            ? integrationErr.message
            : integrationErr,
        );
        await new Promise((r) => setTimeout(r, 10_000));
        newIntegration = await generateIntegration(
          assessment as AssessmentResult,
          profileAlgo,
          report.careerMatch,
          profileNarratives,
          newPathway,
          locale,
          resumeEvidence,
          realConditions,
          guard.user?.id ?? null,
        );
      }

      // Update report in place
      const updatedReport: CareerReport = {
        ...report,
        careerPathway: newPathway,
        integration: newIntegration,
        meta: {
          ...report.meta,
          realConditionsProvided: true,
        },
      };

      await updateReportJson(reportId, updatedReport);

      return NextResponse.json({ success: true, report: updatedReport });
    } catch (error) {
      logApiError(
        "/api/report/[id]/regenerate-pathway",
        ApiErrorCode.INTERNAL_ERROR,
        {
          message: "Failed to regenerate career pathway",
          cause: error,
        },
      );
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to regenerate career pathway",
        500,
      );
    }
  },
);
