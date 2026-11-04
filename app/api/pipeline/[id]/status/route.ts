// ============================================================
// GET /api/pipeline/[id]/status — polling endpoint for /processing page
//
// Returns per-step status + overall status + pointers the client uses to
// route once the pipeline is done (profileId, reportId).
//
// Auth: session-bound — only the pipeline's owner can read its status.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { ApiErrorCode, createErrorResponse } from "@/lib/api/api-errors";
import { getPipeline, setStepStatus } from "@/lib/db/pipeline";
import { getProfileByAssessment } from "@/lib/db/profiles";
import { getReportIdByAssessment } from "@/lib/db/reports";
import type { PipelineStatusResponse } from "@/lib/pipeline/types";
import { hasCompleteNarratives } from "@/lib/profile-generation/narrative-renderability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withLogging(
  "/api/pipeline/[id]/status",
  async (request: NextRequest, ctx?: { params: Promise<{ id: string }> }) => {
    const guard = await guardRoute(request, {
      tier: "read",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    const params = ctx?.params ? await ctx.params : undefined;
    const id = params?.id;
    if (!id) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Missing pipeline id",
        400,
      );
    }

    // Ownership check: for non-admins, conflate "not found" and "not yours"
    // into a 404 so attackers can't enumerate pipelineIds via 404 vs 403.
    // Admins can inspect any pipeline (ops visibility).
    let pipeline = await getPipeline(id);
    const isAdmin = Boolean(guard.user?.isAdmin);
    const isOwner = pipeline?.userId === guard.user?.id;
    if (!pipeline || (!isOwner && !isAdmin)) {
      return createErrorResponse(
        ApiErrorCode.ASSESSMENT_NOT_FOUND,
        "Pipeline not found",
        404,
      );
    }

    // Resolve profileId + reportId (used by client to route after done).
    const [profile, reportId] = await Promise.all([
      getProfileByAssessment(pipeline.assessmentId),
      getReportIdByAssessment(pipeline.assessmentId).catch(() => null),
    ]);

    if (
      pipeline.narrativesStatus === "done" &&
      profile &&
      !hasCompleteNarratives(profile.narrativeSnapshots)
    ) {
      pipeline =
        (await setStepStatus(pipeline.id, "narratives", "pending", {
          error: "Incomplete narrative payload detected",
        })) ?? pipeline;
    }

    // Profile preview — once the algorithmic profile is saved we can give the
    // client enough data to play a reveal ceremony while narratives still
    // generate in the background.
    let profilePreview: PipelineStatusResponse["profilePreview"] = null;
    if (profile && pipeline.profileStatus === "done") {
      const riasec = profile.riasecScores ?? {};
      const topRiasecEntry = Object.entries(riasec).sort(
        (a, b) => (b[1] as number) - (a[1] as number),
      )[0];
      const bigFive = (profile.bigFiveScores ?? {}) as Record<string, number>;
      const topBigFiveEntry = Object.entries(bigFive).sort(
        (a, b) => (b[1] as number) - (a[1] as number),
      )[0];

      profilePreview = {
        archetypePrimary: profile.archetype.primary ?? "",
        archetypeLabelEn: profile.archetype.label_en ?? "",
        archetypeLabelZh: profile.archetype.label_zh ?? "",
        archetypeTaglineEn: profile.archetype.tagline_en ?? "",
        archetypeTaglineZh: profile.archetype.tagline_zh ?? "",
        topInterest: topRiasecEntry
          ? {
              code: topRiasecEntry[0],
              score: Math.round(topRiasecEntry[1] as number),
            }
          : null,
        topBigFive: topBigFiveEntry
          ? {
              key: topBigFiveEntry[0],
              score: Math.round(topBigFiveEntry[1] as number),
            }
          : null,
        topValues: profile.schwartzAnchors?.top3 ?? [],
      };
    }

    const body: PipelineStatusResponse = {
      pipelineId: pipeline.id,
      assessmentId: pipeline.assessmentId,
      locale: pipeline.locale,
      scoringStatus: pipeline.scoringStatus,
      profileStatus: pipeline.profileStatus,
      narrativesStatus: pipeline.narrativesStatus,
      reportStatus: pipeline.reportStatus,
      resumeAnalysisStatus: pipeline.resumeAnalysisStatus,
      reportRequestedAt: pipeline.reportRequestedAt?.toISOString() ?? null,
      status: pipeline.status,
      retryCount: pipeline.retryCount,
      lastStepError: pipeline.lastStepError,
      startedAt: pipeline.startedAt.toISOString(),
      completedAt: pipeline.completedAt?.toISOString() ?? null,
      profileId: profile?.id ?? null,
      reportId: reportId ?? null,
      profilePreview,
    };

    return NextResponse.json(body);
  },
);
