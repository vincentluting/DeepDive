// ============================================================
// Pipeline orchestrator
//
// Given a claimed pipeline row, advance it by ONE step. Called from the
// cron worker. Returns which step was attempted and the outcome, so the
// worker can log and release the lock appropriately.
//
// Key property: each call advances at most one step. This bounds wall-clock
// cost per cron tick and keeps error recovery granular.
//
// Invariants:
//   - releaseWorkerLock MUST run exactly once per advancePipeline invocation
//     regardless of which throw path fires (try/finally guarantees this).
//   - Funnel events are emitted only on terminal state changes so operators
//     can watch the pipeline lifecycle end-to-end.
// ============================================================

import {
  afterProfileGenerated,
  afterReportGenerated,
} from "@/lib/db/assessment-lifecycle";
import {
  deferStep,
  getPipeline,
  recomputeOverallStatus,
  releaseWorkerLock,
  setStepStatus,
} from "@/lib/db/pipeline";
import { classifyError, formatErrorMessage } from "@/lib/pipeline/errors";
import { runNarrativesStep } from "@/lib/pipeline/steps/narratives";
import { runProfileStep } from "@/lib/pipeline/steps/profile";
import { runReportStep } from "@/lib/pipeline/steps/report";
import {
  DEFERRED_RETRY_DELAY_SECONDS,
  MAX_PIPELINE_RETRIES,
  MAX_VALIDATION_RETRIES,
  type PipelineRow,
  type PipelineStepName,
  type StepResult,
} from "@/lib/pipeline/types";
import { trackFunnelEvent } from "@/lib/analytics/funnel";

export interface AdvanceOutcome {
  pipelineId: string;
  step: PipelineStepName | "none";
  result: "done" | "failed" | "retry" | "skipped" | "deferred";
  error?: string;
}

// Scoring runs synchronously inside /api/assessment/complete before the
// pipeline row is created, so the orchestrator never sees it pending.
type OrchestratableStep = Exclude<PipelineStepName, "scoring">;

/**
 * Picks the next step to run based on row state. Returns null when nothing
 * is actionable (e.g. reportStatus is 'not_requested').
 */
function pickNextStep(p: PipelineRow): OrchestratableStep | null {
  if (p.profileStatus !== "done") return "profile";
  if (p.narrativesStatus !== "done") return "narratives";
  if (p.reportStatus === "pending" || p.reportStatus === "running")
    return "report";
  return null;
}

async function safeReleaseLock(pipelineId: string, workerId: string) {
  try {
    await releaseWorkerLock(pipelineId, workerId);
  } catch (err) {
    console.error(
      `[pipeline.orchestrator] releaseWorkerLock failed for ${pipelineId}:`,
      formatErrorMessage(err),
    );
  }
}

async function fireLifecycleEventsForSuccess(
  pipelineId: string,
  userId: string,
  assessmentId: string,
  _step: PipelineStepName,
) {
  let finalState;
  try {
    finalState = await getPipeline(pipelineId);
  } catch (err) {
    // Non-fatal: event emission just can't happen. Surface via Sentry so
    // we don't silently lose observability.
    try {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(err, {
        tags: { route: "pipeline.orchestrator", phase: "lifecycle_event" },
        extra: { pipelineId },
      });
    } catch {
      // Sentry import itself may fail in edge environments — last resort.
    }
    console.error(
      `[pipeline.orchestrator] failed to fetch pipeline for lifecycle event (${pipelineId}):`,
      formatErrorMessage(err),
    );
    return;
  }
  if (!finalState) return;

  // Fire pipeline_completed on either terminal success state: completed (all
  // 4 steps done, including user-requested report) OR auto_done (scoring +
  // profile + narratives done, user hasn't requested report yet). Both are
  // meaningful "pipeline done for now" milestones for analytics/ops.
  if (finalState.status === "completed" || finalState.status === "auto_done") {
    const durationMs = Math.max(0, Date.now() - finalState.startedAt.getTime());
    trackFunnelEvent("pipeline_completed", {
      userId,
      metadata: {
        pipelineId,
        assessmentId,
        terminalStatus: finalState.status,
        durationMs,
      },
      // Per-status idempotency key so the event fires at most once for each
      // terminal state (auto_done first, then completed when user requests
      // report and the 4th step lands).
      idempotencyKey: `pipeline_completed:${pipelineId}:${finalState.status}`,
    }).catch(() => {});
  }
}

async function fireLifecycleEventsForFailure(
  pipelineId: string,
  userId: string,
  assessmentId: string,
  step: PipelineStepName,
  error: string,
  permanent: boolean,
  retryCount: number,
  errorClass: "validation" | "transient" | "permanent",
) {
  if (!permanent) return; // Only emit on terminal failure — avoids noise.

  trackFunnelEvent("pipeline_step_failed", {
    userId,
    metadata: { pipelineId, step, error, retryCount, errorClass },
    idempotencyKey: `pipeline_step_failed:${pipelineId}:${step}`,
  }).catch(() => {});

  if (step === "report") {
    trackFunnelEvent("report_generation_failed", {
      userId,
      metadata: {
        pipelineId,
        assessmentId,
        errorCode: `step_exhausted:${errorClass}`,
      },
      idempotencyKey: `report_generation_failed:${pipelineId}`,
    }).catch(() => {});
  }
}

export async function advancePipeline(
  pipeline: PipelineRow,
  workerId: string,
): Promise<AdvanceOutcome> {
  // ── Sentry isolation scope per pipeline ──────────────────────
  // The cron worker drives up to 5 pipelines concurrently via
  // Promise.allSettled (see app/api/cron/pipeline-worker/route.ts).
  // Without an explicit isolation scope, breadcrumbs added inside
  // `runNarrativesStep`/`runProfileStep`/`runReportStep` would
  // attach to whatever captureException happens to fire next on the
  // shared scope — even if it belongs to a different pipeline.
  // (See codex review note 2026-05-12; documented behaviour of
  // @sentry/core's stack-based async context strategy.)
  //
  // We wrap the entire advance flow in withIsolationScope so each
  // pipeline gets its own breadcrumb buffer + tag space.
  const Sentry = await import("@sentry/nextjs");
  return Sentry.withIsolationScope(async (scope) => {
    scope.setTag("pipelineId", pipeline.id);
    scope.setTag("assessmentId", pipeline.assessmentId);
    scope.setTag("workerId", workerId);
    return doAdvancePipeline(pipeline, workerId);
  });
}

async function doAdvancePipeline(
  pipeline: PipelineRow,
  workerId: string,
): Promise<AdvanceOutcome> {
  const step = pickNextStep(pipeline);

  if (!step) {
    // Nothing to do — make sure overall status reflects reality and release lock.
    try {
      await recomputeOverallStatus(pipeline.id);
    } finally {
      await safeReleaseLock(pipeline.id, workerId);
    }
    return { pipelineId: pipeline.id, step: "none", result: "skipped" };
  }

  try {
    // Mark step as running BEFORE executing so crashed workers leave a trace.
    await setStepStatus(pipeline.id, step, "running");

    try {
      let result: StepResult;
      switch (step) {
        case "profile":
          result = await runProfileStep(pipeline);
          break;
        case "narratives":
          result = await runNarrativesStep(pipeline);
          break;
        case "report":
          result = await runReportStep(pipeline);
          break;
      }

      // Deferred: handler couldn't proceed (e.g. lock held by another
      // instance). Leave the step in 'pending' and schedule a short
      // retry — do NOT mark 'done' (otherwise a failed foreground
      // handler would strand the pipeline in a fake success state).
      if (result === "deferred") {
        await deferStep(pipeline.id, step, DEFERRED_RETRY_DELAY_SECONDS);
        return {
          pipelineId: pipeline.id,
          step,
          result: "deferred",
        };
      }

      await setStepStatus(pipeline.id, step, "done");

      // Journey-state side effects — best effort, must NOT throw.
      // Failures surface to Sentry so pipeline ↔ journey divergence is
      // observable (otherwise dashboard / coaching gates can silently desync).
      if (step === "profile") {
        try {
          await afterProfileGenerated(pipeline.userId);
        } catch (err) {
          try {
            const Sentry = await import("@sentry/nextjs");
            Sentry.captureException(err, {
              tags: {
                route: "pipeline.orchestrator",
                phase: "after_profile_generated",
              },
              extra: { pipelineId: pipeline.id, userId: pipeline.userId },
            });
          } catch {
            // Sentry import itself may fail in edge environments — last resort.
          }
          console.warn(
            `[pipeline.orchestrator] afterProfileGenerated failed (non-fatal) for ${pipeline.userId}:`,
            formatErrorMessage(err),
          );
        }
      }
      if (step === "report") {
        try {
          await afterReportGenerated(pipeline.userId);
        } catch (err) {
          try {
            const Sentry = await import("@sentry/nextjs");
            Sentry.captureException(err, {
              tags: {
                route: "pipeline.orchestrator",
                phase: "after_report_generated",
              },
              extra: { pipelineId: pipeline.id, userId: pipeline.userId },
            });
          } catch {
            // Sentry import itself may fail in edge environments — last resort.
          }
          console.warn(
            `[pipeline.orchestrator] afterReportGenerated failed (non-fatal) for ${pipeline.userId}:`,
            formatErrorMessage(err),
          );
        }
      }

      await fireLifecycleEventsForSuccess(
        pipeline.id,
        pipeline.userId,
        pipeline.assessmentId,
        step,
      );

      return { pipelineId: pipeline.id, step, result: "done" };
    } catch (err) {
      const message = formatErrorMessage(err);
      const errorClass = classifyError(err);
      // Permanent → 0 retries. Validation → MAX_VALIDATION_RETRIES (2).
      // Transient → MAX_PIPELINE_RETRIES (5, exp backoff).
      // pipeline.retryCount is the count BEFORE this failure; +1 represents
      // the current failure being recorded.
      const maxForClass =
        errorClass === "transient"
          ? MAX_PIPELINE_RETRIES
          : errorClass === "validation"
            ? MAX_VALIDATION_RETRIES
            : 0;
      const canRetry = pipeline.retryCount + 1 < maxForClass;

      // On retry, move the step back to 'pending' so next cron tick picks it up.
      // On permanent failure (or retries exhausted), mark 'failed'.
      try {
        // errorClass is captured for telemetry / future schema persistence;
        // setStepStatus only needs the message for now.
        await setStepStatus(
          pipeline.id,
          step,
          canRetry ? "pending" : "failed",
          { error: message, incrementRetry: true },
        );
      } catch (statusErr) {
        // Even updating status failed — worst case the stale-recovery timeout
        // in claimWorkablePipelines (5 min) will pick this row up again.
        console.error(
          `[pipeline.orchestrator] failed to record step failure for ${pipeline.id}:`,
          formatErrorMessage(statusErr),
        );
      }

      await fireLifecycleEventsForFailure(
        pipeline.id,
        pipeline.userId,
        pipeline.assessmentId,
        step,
        message,
        !canRetry,
        pipeline.retryCount + 1,
        errorClass,
      );

      return {
        pipelineId: pipeline.id,
        step,
        result: canRetry ? "retry" : "failed",
        error: message,
      };
    }
  } finally {
    // Guarantee: lock is released exactly once per invocation, regardless of
    // which throw path fired above.
    await safeReleaseLock(pipeline.id, workerId);
  }
}
