// ============================================================
// Pipeline step: narratives
//
// Generates LLM identity narratives and merges them into
// PersonalProfile.profileJson.narrativeSnapshots. Idempotent — if renderable
// narratives already exist on the profile we skip the LLM call.
// ============================================================

import {
  getProfileByAssessment,
  saveProfile,
  updateProfileNarratives,
} from "@/lib/db/profiles";
import { getEffectiveAssessment } from "@/lib/db/assessments";
import { invalidateUserCache } from "@/lib/db/cached";
import { generateIdentityNarratives } from "@/lib/profile-generation/generate-identity-narratives";
import { generateProfile } from "@/lib/profile-generation/generate-profile";
import {
  hasCompleteNarratives,
  REQUIRED_NARRATIVE_KEYS,
} from "@/lib/profile-generation/narrative-renderability";
import {
  computeNarrativeInputHash,
  isNarrativeCurrentForProfile,
  isProfileCurrentForAssessment,
} from "@/lib/profile-generation/profile-fingerprint";
import {
  reportNarrativeFailure,
  fieldLengthMap,
} from "@/lib/profile-generation/narrative-telemetry";
import type { PipelineRow, StepResult } from "@/lib/pipeline/types";

export async function runNarrativesStep(
  pipeline: PipelineRow,
): Promise<StepResult> {
  let profile = await getProfileByAssessment(pipeline.assessmentId);
  if (!profile) {
    throw new Error(
      `narratives step: profile for assessment ${pipeline.assessmentId} not found`,
    );
  }

  const assessment = await getEffectiveAssessment(
    pipeline.assessmentId,
    pipeline.userId,
  );
  if (!assessment) {
    throw new Error(
      `narratives step: assessment ${pipeline.assessmentId} not found`,
    );
  }

  if (!isProfileCurrentForAssessment(profile, assessment)) {
    profile = generateProfile(assessment, pipeline.userId);
    await saveProfile(profile);
  }

  // Idempotency short-circuit.
  if (
    hasCompleteNarratives(profile.narrativeSnapshots) &&
    isNarrativeCurrentForProfile(profile)
  ) {
    return "done";
  }

  const algo = profile.algoSnapshot;
  if (!algo) {
    throw new Error(
      `narratives step: profile ${profile.id} missing algoSnapshot — cannot generate narratives`,
    );
  }

  const narratives = await generateIdentityNarratives(
    profile,
    algo,
    pipeline.locale,
  );
  if (!narratives) {
    // Do NOT emit reportNarrativeFailure here — the generator already
    // emitted a TERMINAL captureMessage (mode=generator-returned-null or
    // legacy-fields-missing) before returning null. Duplicating the event
    // here would double-count in the 24h alert threshold (codex 2026-05-12).
    // The thrown Error propagates to orchestrator.advancePipeline's catch
    // block, which records it via setStepStatus → lastStepError. Sentry
    // gets the breadcrumb trail attached to the generator's earlier
    // captureMessage via the per-pipeline isolation scope.
    throw new Error(
      `narratives step: all LLM providers returned null for assessment ${pipeline.assessmentId}`,
    );
  }

  if (!hasCompleteNarratives(narratives)) {
    // Defensive double-check. Post 2026-05-11 the generator guarantees
    // null-or-complete, so this branch should be unreachable — but if it
    // ever fires we want a UNIQUE Sentry event because it represents a
    // generator contract violation (different failure mode from
    // generator-returned-null).
    reportNarrativeFailure({
      mode: "pipeline-step-incomplete",
      locale: pipeline.locale,
      assessmentId: pipeline.assessmentId,
      fieldLengths: fieldLengthMap(narratives, REQUIRED_NARRATIVE_KEYS),
      level: "error",
      detail:
        "generator returned but hasCompleteNarratives=false (generator contract violation)",
    });
    throw new Error(
      `narratives step: incomplete narrative payload for assessment ${pipeline.assessmentId}`,
    );
  }
  await updateProfileNarratives(pipeline.assessmentId, {
    ...narratives,
    narrativeLocale: pipeline.locale,
    narrativeInputHash: computeNarrativeInputHash(
      profile.profileInputHash,
      pipeline.locale,
    ),
    populatedAt: new Date().toISOString(),
  });
  invalidateUserCache(pipeline.userId);
  return "done";
}
