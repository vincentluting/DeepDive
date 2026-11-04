// ============================================================
// GET /api/action-hub/plan  — Get active action plan + items
// POST /api/action-hub/plan — Generate action plan from report
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";
import { generateActionPlanRequestSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  isSchemaDriftError,
  logApiError,
} from "@/lib/api/api-errors";
import {
  getActiveActionPlan,
  getActionItemsByPlan,
  getMilestonesByPlan,
} from "@/lib/db/action-hub";
import { generateActionPlan } from "@/lib/action-hub/generate-action-plan";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n/config";
import type { CareerReport } from "@/lib/types/report";

export const maxDuration = 30;

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return JSON.parse(value) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCareerReport(value: unknown): value is CareerReport {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.assessmentId === "string" &&
    typeof value.locale === "string" &&
    isRecord(value.header) &&
    isRecord(value.careerMatch)
  );
}

function resolveLocale(value: unknown): Locale {
  return typeof value === "string" && isValidLocale(value)
    ? value
    : defaultLocale;
}

function getArchetypeCode(assessmentData: Record<string, unknown> | null) {
  const archetype = assessmentData?.archetype;
  if (!isRecord(archetype)) return null;
  return typeof archetype.code === "string" ? archetype.code : null;
}

function getPrimaryRiasec(assessmentData: Record<string, unknown> | null) {
  const scores = assessmentData?.riasecNormalized;
  if (!isRecord(scores)) return null;
  return (
    Object.entries(scores)
      .filter(
        (entry): entry is [string, number] => typeof entry[1] === "number",
      )
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  );
}

// ── GET: Retrieve active action plan + items ─────────────

export const GET = withLogging(
  "/api/action-hub/plan",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "auth",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const userId = guard.user!.id;
      const plan = await getActiveActionPlan(userId);
      if (!plan) {
        return NextResponse.json({ plan: null, items: [] });
      }

      const items = await getActionItemsByPlan(plan.id);
      const milestones = await getMilestonesByPlan(plan.id);

      return NextResponse.json({ plan, items, milestones });
    } catch (error) {
      logApiError("/api/action-hub/plan", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch action plan",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to fetch action plan",
        500,
      );
    }
  },
);

// ── POST: Generate new action plan from report ───────────

export const POST = withLogging(
  "/api/action-hub/plan",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "auth",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const userId = guard.user!.id;

      const parsed = await parseBody(request, generateActionPlanRequestSchema);
      if ("error" in parsed) {
        return parsed.error;
      }
      const { reportId } = parsed.data;

      // Fetch the report data (locale lives inside reportJson, not as a column)
      const { sql } = await import("@/lib/db/connection");
      const reportRows = await sql`
        SELECT "reportJson" FROM "CareerReport"
        WHERE "id" = ${reportId} AND "userId" = ${userId}
        LIMIT 1
      `;
      const reportRow = reportRows[0];
      if (!reportRow) {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Report not found",
          404,
        );
      }

      let report: CareerReport;
      try {
        const parsedReport = parseJsonValue(reportRow.reportJson);
        if (!isCareerReport(parsedReport)) {
          throw new Error("Invalid report shape");
        }
        report = parsedReport;
      } catch {
        logApiError("/api/action-hub/plan", ApiErrorCode.INTERNAL_ERROR, {
          message: "Malformed reportJson in DB",
          cause: { reportId },
        });
        return createErrorResponse(
          ApiErrorCode.INTERNAL_ERROR,
          "Report data is corrupted",
          500,
        );
      }
      const reportLocale = resolveLocale(report.locale);

      // Fetch assessment for archetype info
      const assessmentRows = await sql`
        SELECT "resultJson" FROM "AssessmentResult"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;
      const assessment = assessmentRows[0]?.resultJson;
      let assessmentData: Record<string, unknown> | null = null;
      try {
        const parsedAssessment = parseJsonValue(assessment);
        assessmentData = isRecord(parsedAssessment) ? parsedAssessment : null;
      } catch {
        logApiError("/api/action-hub/plan", ApiErrorCode.INTERNAL_ERROR, {
          message: "Malformed resultJson in DB",
          cause: { userId },
        });
      }

      // Fetch both exercises for full tier-aware personalization.
      // Flow moments → multi-dimension patterns; non-negotiables → red-line + boost.
      let flowPatterns:
        | import("@/lib/action-hub/priority-ranker").FlowPatterns
        | null = null;
      let flowMomentsRaw:
        | import("@/lib/action-hub/guided-exercises").FlowMomentEntry[]
        | null = null;
      let nonNegotiablesSelected:
        | import("@/lib/action-hub/guided-exercises").NonNegotiablesResult["selected"]
        | null = null;
      try {
        const { getExercises } = await import("@/lib/db/profiles");
        const { analyzeFlowPatterns } =
          await import("@/lib/action-hub/guided-exercises");
        const exercises = await getExercises(userId);
        if (exercises?.flowMoments?.moments?.length === 3) {
          flowMomentsRaw = exercises.flowMoments
            .moments as import("@/lib/action-hub/guided-exercises").FlowMomentEntry[];
          flowPatterns = analyzeFlowPatterns(flowMomentsRaw);
        }
        if (exercises?.nonNegotiables?.selected?.length === 3) {
          nonNegotiablesSelected = exercises.nonNegotiables
            .selected as import("@/lib/action-hub/guided-exercises").NonNegotiablesResult["selected"];
        }
      } catch {
        // Exercise data is optional — proceed without it (lite tier).
      }

      const { getDictionary } = await import("@/lib/i18n/get-dictionary");
      const actionHubDict = (await getDictionary(reportLocale)).actionHub;
      const flowMomentDict = actionHubDict.exercises?.flowMoments;
      const flowLabels = {
        ...(flowMomentDict?.activities ?? {}),
        ...(flowMomentDict?.social ?? {}),
        ...(flowMomentDict?.environment ?? {}),
      };

      // Resolve non-negotiable labels for the report's locale so the LLM
      // and guidance builder can reference them by human-readable name.
      let nonNegotiableLabels: Record<string, string> | undefined;
      if (nonNegotiablesSelected) {
        const options = actionHubDict.exercises?.nonNegotiables?.options ?? {};
        nonNegotiableLabels = nonNegotiablesSelected.reduce(
          (acc, id) => {
            const label = (options as Record<string, string>)[id];
            if (label) acc[id] = label;
            return acc;
          },
          {} as Record<string, string>,
        );
      }

      // Archive any existing active plan
      const existingPlan = await getActiveActionPlan(userId);
      if (existingPlan) {
        const { archiveActionPlan } = await import("@/lib/db/action-hub");
        await archiveActionPlan(existingPlan.id);
      }

      // Generate the new plan
      const result = await generateActionPlan({
        userId,
        reportId,
        report,
        archetype: getArchetypeCode(assessmentData),
        primaryRiasec: getPrimaryRiasec(assessmentData),
        valuePolarity: null, // polarity lives in ProfileAlgorithmOutput, not assessment
        flowPatterns,
        flowMoments: flowMomentsRaw,
        nonNegotiables: nonNegotiablesSelected,
        nonNegotiableLabels,
        guidanceTemplates: actionHubDict.guidanceTemplates,
        flowLabels,
      });

      // Fetch the created plan + items + milestones
      const plan = await getActiveActionPlan(userId);
      const [items, milestones] = plan
        ? await Promise.all([
            getActionItemsByPlan(plan.id),
            getMilestonesByPlan(plan.id),
          ])
        : [[], []];

      return NextResponse.json({
        plan,
        items,
        milestones,
        generated: {
          planId: result.planId,
          itemCount: result.itemCount,
          tier: result.tier,
          llmEnriched: result.llmEnriched,
        },
      });
    } catch (error) {
      // Distinguish schema drift (a migration is unapplied — operational P0,
      // fix = run the migration) from a generic failure, so it doesn't hide
      // behind the same opaque "Failed to …" message. logApiError additionally
      // escalates schema-drift to Sentry `fatal` with a dbErrorClass tag.
      const driftError = isSchemaDriftError(error);
      const code = driftError
        ? ApiErrorCode.DB_CONSTRAINT_FAILED
        : ApiErrorCode.INTERNAL_ERROR;
      logApiError("/api/action-hub/plan", code, {
        message: driftError
          ? "Schema drift: action plan generation referenced a missing column/table — a DB migration is unapplied"
          : "Failed to generate action plan",
        cause: error,
      });
      return createErrorResponse(code, "Failed to generate action plan", 500);
    }
  },
);
