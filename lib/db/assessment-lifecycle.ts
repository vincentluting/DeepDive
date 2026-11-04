// ============================================================
// Assessment Lifecycle — Unified post-completion side effects
//
// Single entry point for all "assessment completed" events.
// Ensures AssessmentCompletion registry, journey state machine,
// user context cache, and achievements all stay in sync.
//
// Every flow that completes an assessment (normal user flow,
// admin auto-fill, retake) MUST call this instead of manually
// orchestrating individual side effects.
// ============================================================

import { recordAssessmentCompletion } from "./assessment-completion";
import {
  getJourneyState,
  transitionJourney,
  adminSkipJourney,
} from "./journey";
import { recomputeUserContext } from "./user-context";
import { invalidateUserCache } from "./cached";
import { getLatestQuickDiveByUserId } from "./platform";
import { getCanonicalRiasec } from "./riasec-canonical";
import {
  getLatestAssessmentForUser,
  updateAssessmentRiasec,
} from "./assessments";
import type { AssessmentType } from "@/lib/types/platform";
import type { JourneyState, JourneyEvent } from "@/lib/journey/state-machine";

interface AfterAssessmentCompleteParams {
  userId: string;
  assessmentType: AssessmentType;
  resultId: string;
  /** Admin mode: skip journey FSM to target state instead of transitioning */
  adminSkipTo?: JourneyState;
  /** Extra metadata for achievements (e.g. { exploreMode }) */
  achievementContext?: Record<string, unknown>;
}

/**
 * Idempotent retake: FSM rejects a transition because the user already
 * advanced past it (e.g. retaking Deep Dive after report_generated). This is
 * an expected no-op, not an error.
 */
function isExpectedRetakeState(
  state: JourneyState,
  assessmentType: AssessmentType,
): boolean {
  if (assessmentType === "deep_dive") {
    return (
      state === "deep_dive_complete" ||
      state === "profile_generated" ||
      state === "report_generated" ||
      state === "coaching_unlocked"
    );
  }
  if (assessmentType === "quick_dive" || assessmentType === "immersive_dive") {
    return state !== "not_started";
  }
  return false;
}

/**
 * Run all post-completion side effects for an assessment.
 * Idempotent: safe to call multiple times for the same assessment.
 *
 * Side effects (in order):
 * 1. Record in AssessmentCompletion registry (gate for explore page unlock) — throws on failure
 * 2. Advance journey state machine (gate for page guards) — throws only on unreachable states
 * 3. Recompute user context (updates cached navigation state) — best-effort
 * 4. Invalidate user cache (forces fresh reads) — best-effort
 * 5. Check achievements (badges, milestones) — best-effort
 *
 * Critical writes (1, 2 for genuine FSM violations) propagate. Cache-class
 * failures (3, 4, 5) are logged but never abort: stale UserContext is
 * repaired on next read or by the pipeline worker.
 */
export async function afterAssessmentComplete({
  userId,
  assessmentType,
  resultId,
  adminSkipTo,
  achievementContext,
}: AfterAssessmentCompleteParams): Promise<void> {
  // 1. AssessmentCompletion registry — critical for unlock gates.
  await recordAssessmentCompletion({ userId, assessmentType, resultId });

  // 2. Journey state machine — transitionJourney returns {success, error}
  // instead of throwing, so we must inspect the result. A retake of an
  // assessment the user already completed is expected to fail FSM validation
  // (idempotent no-op); only genuinely unreachable transitions should throw.
  if (adminSkipTo) {
    await adminSkipJourney(userId, adminSkipTo);
  } else {
    const event = ASSESSMENT_TO_JOURNEY_EVENT[assessmentType];
    if (event) {
      const result = await transitionJourney(userId, event, "system");
      if (
        !result.success &&
        !isExpectedRetakeState(result.previousState, assessmentType)
      ) {
        throw new Error(
          `Journey transition failed for user=${userId} type=${assessmentType}: ${result.error}`,
        );
      }
    }
  }

  // 3-4. Context + cache — best-effort. A stale UserContext row is repaired
  // by the next read path or by the pipeline worker's recompute on profile
  // generation; failing the entire request here would force the client into
  // an unrecoverable retry loop for a non-essential side effect.
  try {
    await recomputeUserContext(userId);
    invalidateUserCache(userId);
  } catch (err) {
    console.error(
      "[lifecycle] recomputeUserContext failed (non-fatal):",
      err instanceof Error ? err.message : err,
    );
  }

  // 5. Achievements (best-effort, non-blocking)
  const achievementEvent = ASSESSMENT_TO_ACHIEVEMENT[assessmentType];
  if (achievementEvent) {
    import("@/lib/achievements/engine")
      .then((m) =>
        m.checkAchievements(userId, achievementEvent, achievementContext),
      )
      .catch(() => {});
  }

  // 6. RIASEC sync to Assessment — when Quick Dive is retaken and user
  // already has a Deep Dive assessment, update the assessment's riasecNormalized
  // + archetype fields (0 LLM, instant DB update).
  // Profile and Report regeneration are lazy — triggered when user visits those pages.
  if (assessmentType === "quick_dive" || assessmentType === "immersive_dive") {
    getLatestQuickDiveByUserId(userId)
      .then(async (qd) => {
        if (!qd) return;
        const existing = await getLatestAssessmentForUser(userId);
        if (!existing) return;
        const { riasecNormalized, archetype } = getCanonicalRiasec(qd);
        // Skip if RIASEC hasn't actually changed
        const dims = ["R", "I", "A", "S", "E", "C"] as const;
        const unchanged = dims.every(
          (k) => riasecNormalized[k] === existing.result.riasecNormalized?.[k],
        );
        if (unchanged) return;
        // Update only 2 fields in assessment — no Profile/Report regen
        const updatedResult = {
          ...(existing.result as unknown as Record<string, unknown>),
          riasecNormalized,
          archetype,
        };
        await updateAssessmentRiasec(existing.id, updatedResult);
        invalidateUserCache(userId);
      })
      .catch((err) => {
        console.error(
          "[lifecycle] Assessment RIASEC sync failed:",
          err instanceof Error ? err.message : err,
        );
      });
  }
}

/**
 * Unified post-completion side effects for profile generation.
 * Keeps journey/cache/context updates consistent with assessment flows.
 */
export async function afterProfileGenerated(userId: string): Promise<void> {
  // Defensive recovery: older/non-awaited Deep Dive completion handlers could
  // leave a real saved profile while journeyState was still
  // quick_dive_complete. Since a profile implies the Deep Dive assessment was
  // scored, advance the missing intermediate state before generating profile.
  const state = await getJourneyState(userId);
  if (state === "quick_dive_complete") {
    await transitionJourney(userId, "COMPLETE_DEEP_DIVE", "system", {
      recoveredBy: "afterProfileGenerated",
    });
  }

  const result = await transitionJourney(userId, "GENERATE_PROFILE", "system");
  if (!result.success) {
    throw new Error(
      result.error ?? "Failed to transition journey after profile generation",
    );
  }

  await recomputeUserContext(userId);
  invalidateUserCache(userId);
}

/**
 * Unified post-completion side effects for report generation.
 * Keeps journey/cache/context updates consistent with assessment flows.
 *
 * Throws on transition failure (mirrors afterProfileGenerated). The caller
 * (lib/pipeline/orchestrator.ts) catches and routes the error to Sentry so
 * pipeline ↔ journey divergence is observable instead of silent.
 */
export async function afterReportGenerated(userId: string): Promise<void> {
  const result = await transitionJourney(userId, "GENERATE_REPORT", "system");
  if (!result.success) {
    throw new Error(
      result.error ?? "Failed to transition journey after report generation",
    );
  }

  await recomputeUserContext(userId);
  invalidateUserCache(userId);
}

// ── Mapping tables ──────────────────────────────────────────

const ASSESSMENT_TO_JOURNEY_EVENT: Partial<
  Record<AssessmentType, JourneyEvent>
> = {
  quick_dive: "COMPLETE_QUICK_DIVE",
  immersive_dive: "COMPLETE_QUICK_DIVE",
  deep_dive: "COMPLETE_DEEP_DIVE",
};

const ASSESSMENT_TO_ACHIEVEMENT: Partial<Record<AssessmentType, string>> = {
  quick_dive: "quick_dive_complete",
  immersive_dive: "quick_dive_complete",
  deep_dive: "deep_dive_complete",
};
