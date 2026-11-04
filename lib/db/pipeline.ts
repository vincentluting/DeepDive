// ============================================================
// AssessmentPipeline DB layer
//
// Centralizes all reads/writes against the AssessmentPipeline table.
// Enforces idempotency (step transitions are conditional on current state),
// and hosts the worker-lock protocol used by the cron worker to claim rows
// without double-processing.
//
// Key design decisions (post 2026-04-22 cross-review):
//   - setStepStatus merges per-step update and overall recompute into a
//     single SQL UPDATE so Neon HTTP's per-statement transaction boundary
//     can't leave step/status/workerLock out of sync.
//   - claimWorkablePipelines filters on nextAttemptAt so transient failures
//     back off exponentially rather than re-burning LLM budget every minute.
//   - requestReportGeneration resets retryCount so the user's "try again"
//     click isn't starved by prior step-level failures using the global
//     retry counter.
// ============================================================

import { sql } from "./connection";
import {
  MAX_PIPELINE_RETRIES,
  STALE_RUNNING_THRESHOLD_MS,
  WORKER_LOCK_TTL_MS,
  type PipelineOverallStatus,
  type PipelineReportStatus,
  type PipelineResumeAnalysisStatus,
  type PipelineRow,
  type PipelineStepName,
  type PipelineStepStatus,
} from "@/lib/pipeline/types";

type RawPipelineRow = {
  id: string;
  assessmentId: string;
  userId: string;
  sessionId: string;
  locale: string;
  scoringStatus: PipelineStepStatus;
  profileStatus: PipelineStepStatus;
  narrativesStatus: PipelineStepStatus;
  reportStatus: PipelineReportStatus;
  resumeAnalysisStatus: PipelineResumeAnalysisStatus;
  reportRequestedAt: string | null;
  status: PipelineOverallStatus;
  retryCount: number;
  lastStepError: string | null;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  workerLock: string | null;
  workerLockAt: string | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
};

function hydrate(row: RawPipelineRow): PipelineRow {
  return {
    ...row,
    reportRequestedAt: row.reportRequestedAt
      ? new Date(row.reportRequestedAt)
      : null,
    lastAttemptAt: row.lastAttemptAt ? new Date(row.lastAttemptAt) : null,
    nextAttemptAt: row.nextAttemptAt ? new Date(row.nextAttemptAt) : null,
    workerLockAt: row.workerLockAt ? new Date(row.workerLockAt) : null,
    startedAt: new Date(row.startedAt),
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
    updatedAt: new Date(row.updatedAt),
  };
}

// Exponential backoff: retry #1 → 60s, #2 → 120s, #3 → 240s, #4 → 480s,
// #5 → 960s, capped at 1800s (30 min). 5 retries total = ~32 min of waiting,
// long enough for most Anthropic 529 overload windows (15–60 min) to resolve
// before we exhaust the budget. `newRetryCount` is the retryCount AFTER the
// current failure is recorded (not the delta). Pure function kept for unit
// testing; the SQL path computes the same value inline using the column.
export function nextBackoffSeconds(newRetryCount: number): number {
  if (newRetryCount <= 0) return 0;
  return Math.min(60 * 2 ** (newRetryCount - 1), 1800);
}

// ============================================================
// CRUD — create
// ============================================================

export interface CreatePipelineInput {
  assessmentId: string;
  userId: string;
  sessionId: string;
  locale: string;
  // For backfills (e.g. Jacky) we can mark already-done steps so the worker
  // only picks up the still-pending ones.
  initial?: Partial<{
    scoringStatus: PipelineStepStatus;
    profileStatus: PipelineStepStatus;
    narrativesStatus: PipelineStepStatus;
    reportStatus: PipelineReportStatus;
  }>;
}

/**
 * Create a new pipeline row for an assessment. Idempotent — if a row already
 * exists for that assessmentId (UNIQUE constraint), the ON CONFLICT branch
 * intentionally does NOT overwrite step status (it would clobber an in-flight
 * pipeline). Only `updatedAt` is bumped.
 */
export async function createPipeline(
  input: CreatePipelineInput,
): Promise<PipelineRow> {
  const { assessmentId, userId, sessionId, locale, initial = {} } = input;

  const scoring = initial.scoringStatus ?? "pending";
  const profile = initial.profileStatus ?? "pending";
  const narratives = initial.narrativesStatus ?? "pending";
  const report = initial.reportStatus ?? "not_requested";

  const rows = (await sql`
    INSERT INTO "AssessmentPipeline"
      ("assessmentId", "userId", "sessionId", "locale",
       "scoringStatus", "profileStatus", "narrativesStatus", "reportStatus")
    VALUES
      (${assessmentId}, ${userId}, ${sessionId}, ${locale},
       ${scoring}, ${profile}, ${narratives}, ${report})
    ON CONFLICT ("assessmentId") DO UPDATE SET
      "updatedAt" = NOW()
    RETURNING *
  `) as RawPipelineRow[];

  return hydrate(rows[0]);
}

// ============================================================
// CRUD — read
// ============================================================

export async function getPipeline(id: string): Promise<PipelineRow | null> {
  const rows = (await sql`
    SELECT * FROM "AssessmentPipeline" WHERE "id" = ${id}
  `) as RawPipelineRow[];
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function getPipelineByAssessment(
  assessmentId: string,
): Promise<PipelineRow | null> {
  const rows = (await sql`
    SELECT * FROM "AssessmentPipeline" WHERE "assessmentId" = ${assessmentId}
  `) as RawPipelineRow[];
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function getLatestPipelineForUser(
  userId: string,
): Promise<PipelineRow | null> {
  const rows = (await sql`
    SELECT * FROM "AssessmentPipeline"
    WHERE "userId" = ${userId}
    ORDER BY "startedAt" DESC
    LIMIT 1
  `) as RawPipelineRow[];
  return rows[0] ? hydrate(rows[0]) : null;
}

// ============================================================
// Worker lock — claim a batch of workable rows for the cron to process.
//
// "Workable" = status pending OR status=running but workerLock expired
// (= crashed worker). We use FOR UPDATE SKIP LOCKED so concurrent cron
// invocations don't fight, and filter on nextAttemptAt to enforce the
// exponential backoff after transient failures.
// ============================================================

export interface ClaimedPipeline {
  row: PipelineRow;
  lockId: string;
}

export async function claimWorkablePipelines(
  limit: number,
  workerId: string = crypto.randomUUID(),
): Promise<ClaimedPipeline[]> {
  const staleAtCutoff = new Date(Date.now() - STALE_RUNNING_THRESHOLD_MS);

  const rows = (await sql`
    WITH candidates AS (
      SELECT "id"
      FROM "AssessmentPipeline"
      WHERE "status" IN ('pending', 'running')
        AND (
          "workerLock" IS NULL
          OR "workerLockAt" < ${staleAtCutoff.toISOString()}
        )
        AND "retryCount" < ${MAX_PIPELINE_RETRIES}
        AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= NOW())
      ORDER BY "startedAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE "AssessmentPipeline" ap
    SET
      "workerLock" = ${workerId},
      "workerLockAt" = NOW(),
      "status" = 'running',
      "updatedAt" = NOW()
    FROM candidates c
    WHERE ap."id" = c."id"
    RETURNING ap.*
  `) as RawPipelineRow[];

  return rows.map((r) => ({ row: hydrate(r), lockId: workerId }));
}

export async function releaseWorkerLock(
  pipelineId: string,
  workerId: string,
): Promise<void> {
  await sql`
    UPDATE "AssessmentPipeline"
    SET "workerLock" = NULL,
        "workerLockAt" = NULL,
        "updatedAt" = NOW()
    WHERE "id" = ${pipelineId}
      AND "workerLock" = ${workerId}
  `;
}

// ============================================================
// Step transitions — atomic updates (step column + overall status column +
// backoff scheduling) in a single SQL statement so we never leave the row
// half-updated after a lambda kill.
// ============================================================

export async function setStepStatus(
  pipelineId: string,
  step: PipelineStepName,
  status: PipelineStepStatus,
  opts: {
    error?: string;
    incrementRetry?: boolean;
  } = {},
): Promise<PipelineRow | null> {
  const err = opts.error ?? null;
  const retryDelta = opts.incrementRetry ? 1 : 0;

  // Compute backoff from the retryCount that will be in effect AFTER this
  // update. If we're moving a step back to 'pending' after a transient
  // failure, space out the next claim attempt.
  const willBackoff = status === "pending" && retryDelta > 0;

  // Four near-identical UPDATE statements — one per step column. The set of
  // columns we touch is identical across steps; only the step column name
  // differs. Writing them out avoids the historical "multi-SQL recompute"
  // race (fixed 2026-04-22) by doing step-status, overall-status, workerLock
  // gating, and nextAttemptAt scheduling in ONE SQL.
  let rows: RawPipelineRow[];
  switch (step) {
    case "scoring":
      rows = (await sql`
        UPDATE "AssessmentPipeline"
        SET
          "scoringStatus" = ${status},
          "lastAttemptAt" = NOW(),
          "lastStepError" = ${err},
          "retryCount" = CASE
            WHEN ${status} = 'done' THEN 0
            ELSE "retryCount" + ${retryDelta}
          END,
          "nextAttemptAt" = CASE
            WHEN ${willBackoff}
              THEN NOW() + make_interval(secs => LEAST(60 * POWER(2, "retryCount" + ${retryDelta} - 1), 1800)::int)
            ELSE "nextAttemptAt"
          END,
          "status" = CASE
            WHEN ${status} = 'failed' OR "profileStatus" = 'failed'
                 OR "narrativesStatus" = 'failed' OR "reportStatus" = 'failed'
              THEN 'failed'
            WHEN ${status} = 'done' AND "profileStatus" = 'done'
                 AND "narrativesStatus" = 'done' AND "reportStatus" = 'done'
              THEN 'completed'
            WHEN ${status} = 'done' AND "profileStatus" = 'done'
                 AND "narrativesStatus" = 'done' AND "reportStatus" = 'not_requested'
              THEN 'auto_done'
            WHEN ${status} = 'running'
              THEN 'running'
            ELSE 'pending'
          END,
          "completedAt" = CASE
            WHEN ${status} = 'done' AND "profileStatus" = 'done'
                 AND "narrativesStatus" = 'done' AND "reportStatus" = 'done'
                 AND "completedAt" IS NULL
              THEN NOW()
            ELSE "completedAt"
          END,
          "workerLock" = CASE
            WHEN ${status} IN ('done','failed','not_requested')
                 AND "profileStatus" IN ('done','failed','not_requested')
                 AND "narrativesStatus" IN ('done','failed','not_requested')
                 AND "reportStatus" IN ('done','failed','not_requested')
              THEN NULL
            ELSE "workerLock"
          END,
          "updatedAt" = NOW()
        WHERE "id" = ${pipelineId}
        RETURNING *
      `) as RawPipelineRow[];
      break;
    case "profile":
      rows = (await sql`
        UPDATE "AssessmentPipeline"
        SET
          "profileStatus" = ${status},
          "lastAttemptAt" = NOW(),
          "lastStepError" = ${err},
          "retryCount" = CASE
            WHEN ${status} = 'done' THEN 0
            ELSE "retryCount" + ${retryDelta}
          END,
          "nextAttemptAt" = CASE
            WHEN ${willBackoff}
              THEN NOW() + make_interval(secs => LEAST(60 * POWER(2, "retryCount" + ${retryDelta} - 1), 1800)::int)
            ELSE "nextAttemptAt"
          END,
          "status" = CASE
            WHEN "scoringStatus" = 'failed' OR ${status} = 'failed'
                 OR "narrativesStatus" = 'failed' OR "reportStatus" = 'failed'
              THEN 'failed'
            WHEN "scoringStatus" = 'done' AND ${status} = 'done'
                 AND "narrativesStatus" = 'done' AND "reportStatus" = 'done'
              THEN 'completed'
            WHEN "scoringStatus" = 'done' AND ${status} = 'done'
                 AND "narrativesStatus" = 'done' AND "reportStatus" = 'not_requested'
              THEN 'auto_done'
            WHEN ${status} = 'running'
              THEN 'running'
            ELSE 'pending'
          END,
          "completedAt" = CASE
            WHEN "scoringStatus" = 'done' AND ${status} = 'done'
                 AND "narrativesStatus" = 'done' AND "reportStatus" = 'done'
                 AND "completedAt" IS NULL
              THEN NOW()
            ELSE "completedAt"
          END,
          "workerLock" = CASE
            WHEN "scoringStatus" IN ('done','failed','not_requested')
                 AND ${status} IN ('done','failed','not_requested')
                 AND "narrativesStatus" IN ('done','failed','not_requested')
                 AND "reportStatus" IN ('done','failed','not_requested')
              THEN NULL
            ELSE "workerLock"
          END,
          "updatedAt" = NOW()
        WHERE "id" = ${pipelineId}
        RETURNING *
      `) as RawPipelineRow[];
      break;
    case "narratives":
      rows = (await sql`
        UPDATE "AssessmentPipeline"
        SET
          "narrativesStatus" = ${status},
          "lastAttemptAt" = NOW(),
          "lastStepError" = ${err},
          "retryCount" = CASE
            WHEN ${status} = 'done' THEN 0
            ELSE "retryCount" + ${retryDelta}
          END,
          "nextAttemptAt" = CASE
            WHEN ${willBackoff}
              THEN NOW() + make_interval(secs => LEAST(60 * POWER(2, "retryCount" + ${retryDelta} - 1), 1800)::int)
            ELSE "nextAttemptAt"
          END,
          "status" = CASE
            WHEN "scoringStatus" = 'failed' OR "profileStatus" = 'failed'
                 OR ${status} = 'failed' OR "reportStatus" = 'failed'
              THEN 'failed'
            WHEN "scoringStatus" = 'done' AND "profileStatus" = 'done'
                 AND ${status} = 'done' AND "reportStatus" = 'done'
              THEN 'completed'
            WHEN "scoringStatus" = 'done' AND "profileStatus" = 'done'
                 AND ${status} = 'done' AND "reportStatus" = 'not_requested'
              THEN 'auto_done'
            WHEN ${status} = 'running'
              THEN 'running'
            ELSE 'pending'
          END,
          "completedAt" = CASE
            WHEN "scoringStatus" = 'done' AND "profileStatus" = 'done'
                 AND ${status} = 'done' AND "reportStatus" = 'done'
                 AND "completedAt" IS NULL
              THEN NOW()
            ELSE "completedAt"
          END,
          "workerLock" = CASE
            WHEN "scoringStatus" IN ('done','failed','not_requested')
                 AND "profileStatus" IN ('done','failed','not_requested')
                 AND ${status} IN ('done','failed','not_requested')
                 AND "reportStatus" IN ('done','failed','not_requested')
              THEN NULL
            ELSE "workerLock"
          END,
          "updatedAt" = NOW()
        WHERE "id" = ${pipelineId}
        RETURNING *
      `) as RawPipelineRow[];
      break;
    case "report":
      rows = (await sql`
        UPDATE "AssessmentPipeline"
        SET
          "reportStatus" = ${status},
          "lastAttemptAt" = NOW(),
          "lastStepError" = ${err},
          "retryCount" = CASE
            WHEN ${status} = 'done' THEN 0
            ELSE "retryCount" + ${retryDelta}
          END,
          "nextAttemptAt" = CASE
            WHEN ${willBackoff}
              THEN NOW() + make_interval(secs => LEAST(60 * POWER(2, "retryCount" + ${retryDelta} - 1), 1800)::int)
            ELSE "nextAttemptAt"
          END,
          "status" = CASE
            WHEN "scoringStatus" = 'failed' OR "profileStatus" = 'failed'
                 OR "narrativesStatus" = 'failed' OR ${status} = 'failed'
              THEN 'failed'
            WHEN "scoringStatus" = 'done' AND "profileStatus" = 'done'
                 AND "narrativesStatus" = 'done' AND ${status} = 'done'
              THEN 'completed'
            WHEN "scoringStatus" = 'done' AND "profileStatus" = 'done'
                 AND "narrativesStatus" = 'done' AND ${status} = 'not_requested'
              THEN 'auto_done'
            WHEN ${status} = 'running'
              THEN 'running'
            ELSE 'pending'
          END,
          "completedAt" = CASE
            WHEN "scoringStatus" = 'done' AND "profileStatus" = 'done'
                 AND "narrativesStatus" = 'done' AND ${status} = 'done'
                 AND "completedAt" IS NULL
              THEN NOW()
            ELSE "completedAt"
          END,
          "workerLock" = CASE
            WHEN "scoringStatus" IN ('done','failed','not_requested')
                 AND "profileStatus" IN ('done','failed','not_requested')
                 AND "narrativesStatus" IN ('done','failed','not_requested')
                 AND ${status} IN ('done','failed','not_requested')
              THEN NULL
            ELSE "workerLock"
          END,
          "updatedAt" = NOW()
        WHERE "id" = ${pipelineId}
        RETURNING *
      `) as RawPipelineRow[];
      break;
  }

  return rows[0] ? hydrate(rows[0]) : null;
}

/**
 * Defer a step — handler couldn't proceed right now (e.g. competing lock).
 *
 * Returns the step to 'pending' without touching retryCount, and pushes
 * nextAttemptAt forward by a short delay so the next cron tick doesn't
 * immediately re-claim and re-defer. Used for contention (not real
 * failure) so "5 retry budget" isn't consumed.
 */
export async function deferStep(
  pipelineId: string,
  step: PipelineStepName,
  delaySeconds: number,
): Promise<void> {
  switch (step) {
    case "scoring":
      // Scoring runs synchronously in /api/assessment/complete before the
      // pipeline row is created; the orchestrator's OrchestratableStep type
      // excludes it. This case is a defensive fall-through that should be
      // unreachable in practice. Kept so a future refactor that moves
      // scoring into the pipeline doesn't have to rediscover the shape.
      await sql`
        UPDATE "AssessmentPipeline"
        SET "scoringStatus" = 'pending',
            "status" = 'pending',
            "nextAttemptAt" = NOW() + make_interval(secs => ${delaySeconds}),
            "updatedAt" = NOW()
        WHERE "id" = ${pipelineId}
      `;
      break;
    case "profile":
      await sql`
        UPDATE "AssessmentPipeline"
        SET "profileStatus" = 'pending',
            "status" = 'pending',
            "nextAttemptAt" = NOW() + make_interval(secs => ${delaySeconds}),
            "updatedAt" = NOW()
        WHERE "id" = ${pipelineId}
      `;
      break;
    case "narratives":
      await sql`
        UPDATE "AssessmentPipeline"
        SET "narrativesStatus" = 'pending',
            "status" = 'pending',
            "nextAttemptAt" = NOW() + make_interval(secs => ${delaySeconds}),
            "updatedAt" = NOW()
        WHERE "id" = ${pipelineId}
      `;
      break;
    case "report":
      await sql`
        UPDATE "AssessmentPipeline"
        SET "reportStatus" = 'pending',
            "status" = 'pending',
            "nextAttemptAt" = NOW() + make_interval(secs => ${delaySeconds}),
            "updatedAt" = NOW()
        WHERE "id" = ${pipelineId}
      `;
      break;
  }
}

/**
 * Update the pipeline's locale — used when a user retries report generation
 * from a different language than the pipeline was originally created in.
 * No-op when the report has already been generated (locale swap on a saved
 * report would need a refresh=true regenerate API, not this flip).
 */
export async function updatePipelineLocale(
  pipelineId: string,
  locale: string,
): Promise<void> {
  await sql`
    UPDATE "AssessmentPipeline"
    SET "locale" = ${locale},
        "updatedAt" = NOW()
    WHERE "id" = ${pipelineId}
      AND "reportStatus" IN ('not_requested', 'pending', 'failed')
  `;
}

/**
 * User clicked "View Deep Dive Report" on the profile page.
 * Transitions reportStatus: not_requested|failed → pending, stamps
 * requestedAt, AND resets retryCount + nextAttemptAt so the user's
 * retry gets a fresh budget (prior step-level failures shouldn't starve
 * the user's explicit retry intent).
 */
export async function requestReportGeneration(
  pipelineId: string,
): Promise<PipelineRow | null> {
  const rows = (await sql`
    UPDATE "AssessmentPipeline"
    SET "reportStatus" = 'pending',
        "reportRequestedAt" = NOW(),
        "status" = 'pending',
        "retryCount" = 0,
        "nextAttemptAt" = NULL,
        "lastStepError" = NULL,
        "updatedAt" = NOW()
    WHERE "id" = ${pipelineId}
      AND "reportStatus" IN ('not_requested', 'failed')
    RETURNING *
  `) as RawPipelineRow[];
  return rows[0] ? hydrate(rows[0]) : null;
}

/**
 * Reset a `failed` pipeline so the cron worker can pick it up again.
 *
 * Used by:
 *   - POST /api/pipeline/[id]/retry (user-triggered restart-analysis button)
 *   - ops scripts cleaning up stuck pipelines
 *
 * Atomic SQL gates:
 *   1. `status = 'failed'` — refuse to touch a pipeline that's still
 *      running or already auto_done. Prevents the retry button from
 *      racing the cron worker mid-step.
 *   2. `updatedAt < NOW() - INTERVAL '60 seconds'` — soft rate limit so
 *      a user spamming the button can't spawn 5 parallel resets in 1 sec
 *      (each of which would burn LLM retries). The 60s window matches the
 *      cron tick cadence — after one reset, the next tick should already
 *      have started work before another reset is allowed.
 *
 * Returns the updated row, or null if the gates rejected the update
 * (caller can disambiguate via `getPipeline` if needed).
 *
 * What we reset:
 *   - status            → 'pending'    (cron worker eligibility)
 *   - narrativesStatus  → 'pending' if currently 'failed' (most common stuck state)
 *   - reportStatus      → 'pending' if currently 'failed', else preserve
 *   - retryCount        → 0            (fresh budget; matches requestReportGeneration)
 *   - nextAttemptAt     → NULL         (claim immediately on next tick)
 *   - lastStepError     → NULL
 *   - workerLock        → NULL         (in case a crashed worker left a stale lock)
 *   - workerLockAt      → NULL
 */
export async function resetFailedPipeline(
  pipelineId: string,
): Promise<PipelineRow | null> {
  const rows = (await sql`
    UPDATE "AssessmentPipeline"
    SET "status" = 'pending',
        "narrativesStatus" = CASE
          WHEN "narrativesStatus" = 'failed' THEN 'pending'::text
          ELSE "narrativesStatus"
        END,
        "reportStatus" = CASE
          WHEN "reportStatus" = 'failed' THEN 'pending'::text
          ELSE "reportStatus"
        END,
        "retryCount" = 0,
        "nextAttemptAt" = NULL,
        "lastStepError" = NULL,
        "workerLock" = NULL,
        "workerLockAt" = NULL,
        "updatedAt" = NOW()
    WHERE "id" = ${pipelineId}
      AND "status" = 'failed'
      AND "updatedAt" < NOW() - INTERVAL '60 seconds'
    RETURNING *
  `) as RawPipelineRow[];
  return rows[0] ? hydrate(rows[0]) : null;
}

/**
 * Set the resumeAnalysisStatus for a pipeline. This step is fully
 * independent of the main cron-driven pipeline (scoring/profile/narratives/
 * report): it does NOT contribute to overall status, completedAt, retryCount,
 * or workerLock. We update one column and bump updatedAt — nothing else.
 *
 * Status semantics:
 *   - not_requested: user hasn't seen the dialog yet (default)
 *   - pending: user opened the upload widget but hasn't finished
 *   - running: upload received, parse+match in flight
 *   - done: match result persisted to ResumeMatchResult
 *   - failed: parse or LLM error — report generator falls back to Standard
 *   - skipped: user picked "Standard" from the depth dialog
 */
export async function setResumeAnalysisStatus(
  pipelineId: string,
  status: PipelineResumeAnalysisStatus,
): Promise<void> {
  await sql`
    UPDATE "AssessmentPipeline"
    SET "resumeAnalysisStatus" = ${status},
        "updatedAt" = NOW()
    WHERE "id" = ${pipelineId}
  `;
}

/** Same as above but addressable via assessmentId (the natural id in most
 *  upload / regenerate API routes). No-op if no pipeline row yet. */
export async function setResumeAnalysisStatusByAssessment(
  assessmentId: string,
  status: PipelineResumeAnalysisStatus,
): Promise<void> {
  await sql`
    UPDATE "AssessmentPipeline"
    SET "resumeAnalysisStatus" = ${status},
        "updatedAt" = NOW()
    WHERE "assessmentId" = ${assessmentId}
  `;
}

/**
 * Sync the pipeline's reportStatus to 'done' after a successful report save
 * from the foreground SSE path (/api/generate-report[/stream]).
 *
 * Without this, there's up to a 60s lag between when the user sees their
 * report saved and when the next cron tick short-circuits runReportStep and
 * marks the pipeline complete — during which observability / dashboard
 * banners stay in an "in progress" state even though the user is done.
 *
 * Best-effort: if the pipeline row doesn't exist (legacy user) we no-op.
 * If it's already 'done' we also no-op. Reuses setStepStatus which handles
 * atomic overall-status recompute + workerLock cleanup.
 */
export async function markReportDoneByAssessment(
  assessmentId: string,
): Promise<void> {
  const pipeline = await getPipelineByAssessment(assessmentId);
  if (!pipeline) return;
  if (pipeline.reportStatus === "done") return;
  await setStepStatus(pipeline.id, "report", "done");
}

/**
 * Recomputes the overall `status` column from the per-step columns.
 * Only still called from advancePipeline's "nothing to do" branch — the
 * setStepStatus path now folds this into its single UPDATE.
 */
export async function recomputeOverallStatus(
  pipelineId: string,
): Promise<void> {
  await sql`
    UPDATE "AssessmentPipeline"
    SET
      "status" = CASE
        WHEN "scoringStatus" = 'failed' OR "profileStatus" = 'failed'
             OR "narrativesStatus" = 'failed' OR "reportStatus" = 'failed'
          THEN 'failed'
        WHEN "scoringStatus" = 'done' AND "profileStatus" = 'done'
             AND "narrativesStatus" = 'done' AND "reportStatus" = 'done'
          THEN 'completed'
        WHEN "scoringStatus" = 'done' AND "profileStatus" = 'done'
             AND "narrativesStatus" = 'done' AND "reportStatus" = 'not_requested'
          THEN 'auto_done'
        ELSE 'pending'
      END,
      "completedAt" = CASE
        WHEN "scoringStatus" = 'done' AND "profileStatus" = 'done'
             AND "narrativesStatus" = 'done' AND "reportStatus" = 'done'
             AND "completedAt" IS NULL
          THEN NOW()
        ELSE "completedAt"
      END,
      "updatedAt" = NOW()
    WHERE "id" = ${pipelineId}
  `;
}

// ============================================================
// Admin / diagnostics
// ============================================================

export async function countPipelinesByStatus(): Promise<
  Record<PipelineOverallStatus, number>
> {
  const rows = (await sql`
    SELECT "status", COUNT(*)::int AS n
    FROM "AssessmentPipeline"
    GROUP BY "status"
  `) as Array<{ status: PipelineOverallStatus; n: number }>;

  const base: Record<PipelineOverallStatus, number> = {
    pending: 0,
    running: 0,
    auto_done: 0,
    completed: 0,
    failed: 0,
  };
  for (const r of rows) base[r.status] = r.n;
  return base;
}

export const __INTERNAL__ = {
  MAX_PIPELINE_RETRIES,
  WORKER_LOCK_TTL_MS,
  STALE_RUNNING_THRESHOLD_MS,
  nextBackoffSeconds,
};
