// ============================================================
// Pipeline step: profile
//
// Idempotent: algo profile is re-derived from AssessmentResult each run.
// If a PersonalProfile row already exists, saveProfile() does an upsert
// merging narrativeSnapshots so we don't clobber later narrative work.
// ============================================================

import { getEffectiveAssessment } from "@/lib/db/assessments";
import { getProfileByAssessment, saveProfile } from "@/lib/db/profiles";
import { generateProfile } from "@/lib/profile-generation/generate-profile";
import { isProfileCurrentForAssessment } from "@/lib/profile-generation/profile-fingerprint";
import type { PipelineRow, StepResult } from "@/lib/pipeline/types";

export async function runProfileStep(
  pipeline: PipelineRow,
): Promise<StepResult> {
  const assessment = await getEffectiveAssessment(
    pipeline.assessmentId,
    pipeline.userId,
  );
  if (!assessment) {
    throw new Error(
      `profile step: assessment ${pipeline.assessmentId} not found`,
    );
  }

  // Short-circuit only when the stored profile is current for the effective
  // assessment. If Quick Dive inputs changed, re-derive the algorithmic layer.
  const existing = await getProfileByAssessment(pipeline.assessmentId);
  if (existing && isProfileCurrentForAssessment(existing, assessment)) {
    return "done";
  }

  const profile = generateProfile(assessment, pipeline.userId);
  await saveProfile(profile);
  return "done";
}
