// ============================================================
// Cohort Journey Progress — Compute completed steps from DB
// ============================================================

import { sql } from "@/lib/db/connection";
import { getCohortSteps } from "./config";
import type { CohortJourneyStep, CohortJourneyProgress } from "./types";

/**
 * Query existing DB tables to determine which journey steps
 * a cohort user has completed. Returns null if cohortId is falsy.
 */
export async function computeCohortProgress(
  userId: string,
  cohortId: string | null | undefined,
): Promise<CohortJourneyProgress | null> {
  if (!cohortId) return null;

  const steps = getCohortSteps(cohortId);
  if (steps.length === 0) return null;

  // Parallel queries for all step-relevant tables
  const [prePost, quickDive, deepReport, coachingSessions] = await Promise.all([
    sql`
      SELECT "assessmentType"
      FROM "PrePostAssessment"
      WHERE "userId" = ${userId}
    `.catch(() => []),
    sql`
      SELECT "id"
      FROM "QuickDiveResult"
      WHERE "userId" = ${userId}
      LIMIT 1
    `.catch(() => []),
    sql`
      SELECT "id"
      FROM "CareerReport"
      WHERE "userId" = ${userId}
      LIMIT 1
    `.catch(() => []),
    sql`
      SELECT "id"
      FROM "CoachingSession"
      WHERE "userId" = ${userId}
      LIMIT 1
    `.catch(() => []),
  ]);

  const prePostTypes = new Set(
    prePost.map((r: Record<string, unknown>) => r.assessmentType as string),
  );
  const hasQuickDive = quickDive.length > 0;
  const hasDeepReport = deepReport.length > 0;
  const hasCoaching = coachingSessions.length > 0;

  const completedSteps: CohortJourneyStep[] = [];

  for (const step of steps) {
    switch (step) {
      case "pre_assessment":
        if (prePostTypes.has("pre")) completedSteps.push(step);
        break;
      case "quick_dive":
        if (hasQuickDive) completedSteps.push(step);
        break;
      case "deep_dive":
        if (hasDeepReport) completedSteps.push(step);
        break;
      case "coaching":
        if (hasCoaching) completedSteps.push(step);
        break;
      case "post_immediate":
        if (prePostTypes.has("post_immediate")) completedSteps.push(step);
        break;
      case "post_1week":
        if (prePostTypes.has("post_1week")) completedSteps.push(step);
        break;
    }
  }

  // Current step = first non-completed step in the ordered list
  const currentStep = steps.find((s) => !completedSteps.includes(s)) ?? null;
  const isComplete = completedSteps.length === steps.length;
  const progressPercent =
    steps.length > 0
      ? Math.round((completedSteps.length / steps.length) * 100)
      : 0;

  return {
    cohortId,
    completedSteps,
    currentStep,
    isComplete,
    progressPercent,
  };
}
