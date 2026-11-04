// ============================================================
// Pipeline step: report
//
// Only runs when the user has clicked "View Deep Dive Report" on the
// profile page (reportStatus: not_requested → pending). The step
// fetches all inputs, generates the 2-3 LLM calls via the existing
// report pipeline, and saves via saveReportTransactional.
//
// Idempotent: if a CareerReport already exists for the assessment
// (UNIQUE constraint), saveReportTransactional returns null and we
// treat the step as done.
// ============================================================

import { getEffectiveAssessment } from "@/lib/db/assessments";
import {
  getRealConditions,
  getRealConditionsByUserId,
} from "@/lib/db/conditions";
import { getProfileByAssessment } from "@/lib/db/profiles";
import {
  getReportByAssessment,
  saveReportTransactional,
} from "@/lib/db/reports";
import {
  acquireReportLock,
  releaseReportLock,
} from "@/lib/db/report-generation-lock";
import { generateCareerReport } from "@/lib/report-generation";
import { computeInputHash } from "@/lib/report/prerequisites";
import {
  isNarrativeCurrentForProfile,
  isProfileCurrentForAssessment,
} from "@/lib/profile-generation/profile-fingerprint";
import { getLatestActiveResumeMatch } from "@/lib/db/resume-match";
import type { PipelineRow, StepResult } from "@/lib/pipeline/types";

export async function runReportStep(
  pipeline: PipelineRow,
): Promise<StepResult> {
  // Short-circuit if report already exists — keeps the step idempotent.
  const existing = await getReportByAssessment(pipeline.assessmentId);
  if (existing) return "done";

  // Cross-instance dedup: /api/generate-report and /api/generate-report/stream
  // both acquire ReportGenerationLock. Without this, the pipeline cron worker
  // will burn 2-3 duplicate LLM calls (~$0.3–$1.0) in parallel with a
  // foreground SSE call that the user already kicked off from the profile
  // page.
  //
  // If we can't get the lock someone else is already generating. Signal
  // "deferred" so the orchestrator LEAVES the step pending (reclaimable
  // next tick) instead of mistakenly marking it done — otherwise a failed
  // foreground SSE call would strand the pipeline in a fake reportStatus='done'
  // state that requestReportGeneration refuses to reset.
  const lock = await acquireReportLock(pipeline.assessmentId);
  if (!lock) return "deferred";

  try {
    const assessment = await getEffectiveAssessment(
      pipeline.assessmentId,
      pipeline.userId,
    );
    if (!assessment) {
      throw new Error(
        `report step: assessment ${pipeline.assessmentId} not found`,
      );
    }

    const profile = await getProfileByAssessment(pipeline.assessmentId);
    const profileIsFresh = profile
      ? isProfileCurrentForAssessment(profile, assessment)
      : false;
    const profileAlgoSnapshot = profileIsFresh
      ? (profile?.algoSnapshot ?? undefined)
      : undefined;
    // Shape identity narratives into the ProfileNarrativeOutput that the report
    // pipeline expects. Mirrors app/api/generate-report/route.ts.
    const profileNarratives =
      profileIsFresh &&
      profile?.narrativeSnapshots &&
      isNarrativeCurrentForProfile(profile)
        ? {
            archetypeNarrative:
              profile.narrativeSnapshots.archetypeNarrative ?? "",
            bigFiveNarrative: profile.narrativeSnapshots.bigFiveNarrative ?? "",
            sjtTensionNarrative:
              profile.narrativeSnapshots.sjtTensionNarrative ?? "",
            valueNarrative: profile.narrativeSnapshots.valueNarrative ?? "",
            adaptabilityNarrative: "",
            valuesCrossImpactNarrative:
              profile.narrativeSnapshots.crossDimensionNarrative ?? "",
            crossConnections: [],
          }
        : null;

    const realConditions =
      (await getRealConditions(pipeline.assessmentId)) ??
      (await getRealConditionsByUserId(pipeline.userId).catch(() => null));

    // Resume enhancement — pick up the latest non-superseded evidence row
    // ONLY when the user has explicitly opted in (resumeAnalysisStatus ===
    // 'done' means /api/documents/upload successfully persisted a match).
    // 'skipped' means the user chose Standard in the depth-mode dialog and
    // the cron fallback must honor that choice, otherwise a foreground
    // Standard run followed by a cron retry would silently upgrade to
    // Enhanced. 'not_requested'/'pending'/'running'/'failed' all mean
    // "no committed resume to layer in" so we skip the DB read.
    const resumeMatch =
      pipeline.resumeAnalysisStatus === "done"
        ? await getLatestActiveResumeMatch(pipeline.assessmentId).catch(
            () => null,
          )
        : null;

    const locale = pipeline.locale || "en";

    const report = await generateCareerReport(
      assessment,
      realConditions,
      locale,
      profileAlgoSnapshot,
      profileNarratives,
      undefined,
      resumeMatch,
      pipeline.userId,
    );

    const inputHash = computeInputHash({
      assessmentId: pipeline.assessmentId,
      realConditions,
      riasecNormalized: assessment.riasecNormalized,
    });

    await saveReportTransactional(
      report,
      pipeline.userId,
      pipeline.sessionId,
      pipeline.assessmentId,
      profile?.narrativeSnapshots,
      inputHash,
    );
  } finally {
    await releaseReportLock(lock);
  }
  return "done";
}
