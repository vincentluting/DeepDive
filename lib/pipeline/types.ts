// ============================================================
// Pipeline types — AssessmentPipeline state machine
//
// Single source of truth for post-Deep-Dive processing.
// Each of the 4 steps progresses independently and idempotently:
//
//   scoring     → write AssessmentResult
//   profile     → write PersonalProfile (algorithmic, <3s)
//   narratives  → LLM-generated profile narratives (attaches to PersonalProfile.profileJson)
//   report      → 2-3 LLM calls producing the Deep Dive report (user-triggered)
//
// reportStatus starts as 'not_requested' and flips to 'pending' only when
// the user clicks "View Deep Dive Report" on the profile page.
// ============================================================

export type PipelineStepStatus = "pending" | "running" | "done" | "failed";
export type PipelineReportStatus = "not_requested" | PipelineStepStatus;
// Resume analysis runs off the main pipeline — it's user-triggered from the
// Report depth dialog and is fully optional. 'skipped' means the user chose
// Standard mode; 'not_requested' means they haven't decided yet.
export type PipelineResumeAnalysisStatus =
  | "not_requested"
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "skipped";

export type PipelineOverallStatus =
  | "pending" // At least one auto step is pending/running
  | "running" // A worker currently owns the lock
  | "auto_done" // scoring + profile + narratives done; report not_requested
  | "completed" // All four steps done (including report)
  | "failed"; // Unrecoverable — exceeded retries on a non-transient error

export type PipelineStepName = "scoring" | "profile" | "narratives" | "report";

export interface PipelineRow {
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
  reportRequestedAt: Date | null;
  status: PipelineOverallStatus;
  retryCount: number;
  lastStepError: string | null;
  lastAttemptAt: Date | null;
  nextAttemptAt: Date | null;
  workerLock: string | null;
  workerLockAt: Date | null;
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}

// Returned to the frontend poller; omits internal lock fields.
export interface PipelineStatusResponse {
  pipelineId: string;
  assessmentId: string;
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
  startedAt: string;
  completedAt: string | null;
  // Denormalized pointers the client uses to route after done.
  profileId: string | null;
  reportId: string | null;
  // Profile preview (populated once profileStatus === "done" so the UI can
  // play a reveal ceremony before narratives finish generating).
  profilePreview: {
    archetypePrimary: string; // e.g. "A"
    archetypeLabelEn: string;
    archetypeLabelZh: string;
    archetypeTaglineEn: string;
    archetypeTaglineZh: string;
    topInterest: { code: string; score: number } | null;
    topBigFive: { key: string; score: number } | null;
    topValues: string[];
  } | null;
}

export const MAX_PIPELINE_RETRIES = 5;
/**
 * Validation failures (e.g. "incomplete narrative payload", "all LLM
 * providers returned null") almost always reproduce the same way against
 * the same inputs — burning the full transient budget on them wastes LLM
 * spend and keeps users stuck for ~30 min before reaching terminal state.
 * 2 means "initial attempt + 1 retry", which covers the rare case of LLM
 * sampling moodiness while still failing fast for real schema breaks.
 *
 * See: lib/pipeline/errors.ts: VALIDATION_PATTERNS
 */
export const MAX_VALIDATION_RETRIES = 2;
export const WORKER_LOCK_TTL_MS = 180_000; // 3 min — matches report pipeline timeout
export const STALE_RUNNING_THRESHOLD_MS = 300_000; // 5 min — reclaim crashed workers

/**
 * Step handlers return one of three signals so the orchestrator can tell
 * "work actually advanced" apart from "another instance was already handling
 * it, try again later".
 *
 *   "done"     — the handler did the work, orchestrator marks the step done.
 *   "deferred" — the handler couldn't proceed right now (e.g. someone else
 *                holds the ReportGenerationLock). Orchestrator leaves the
 *                step pending and schedules a short retry WITHOUT counting
 *                against retryCount.
 */
export type StepResult = "done" | "deferred";

// When a step is deferred, how long to wait before the next cron tick can
// re-claim it. Short enough that the user doesn't feel stuck; long enough
// that we don't thrash against whoever is holding the foreground lock.
export const DEFERRED_RETRY_DELAY_SECONDS = 60;
