---
title: Assessment Pipeline
category: architecture
sources:
  - lib/pipeline/orchestrator.ts
  - lib/pipeline/types.ts
  - lib/pipeline/steps/profile.ts
  - lib/pipeline/steps/narratives.ts
  - lib/pipeline/steps/report.ts
  - lib/pipeline/errors.ts
  - lib/db/pipeline.ts
  - app/api/cron/pipeline-worker/route.ts
sync_mode: partial
last_verified: 2026-04-23
verified_by: claude-code
---

# Assessment Pipeline

Server-orchestrated state machine that advances post–Deep Dive processing in bounded, idempotent steps. Source of truth for "what happens between `/api/assessment/complete` and the user seeing their report."

## Steps

| Step         | Runs                                                                           | Timing     | LLM calls    |
| ------------ | ------------------------------------------------------------------------------ | ---------- | ------------ |
| `scoring`    | inline in `/api/assessment/complete` — never seen by the orchestrator          | <1s        | 0            |
| `profile`    | algorithmic (`generateProfile()` from `algoSnapshot`)                          | <3s        | 0            |
| `narratives` | LLM profile narratives attached to `PersonalProfile.profileJson`               | 30–90s     | 2–5 parallel |
| `report`     | 2–3 LLM career report (user-triggered — `reportStatus` starts `not_requested`) | up to 180s | 2–3          |

Plus an independent `resumeAnalysis` branch (parse + match) when the user chooses the resume-enhanced path. See `docs/architecture/report-generation.md` §Resume-Enhanced Path.

Overall status: `pending → running → auto_done → completed`, or `failed`.

- **`auto_done`** = scoring + profile + narratives done, report still `not_requested` (user hasn't clicked "View Deep Dive Report" on the profile page).
- **`failed`** = unrecoverable, exceeded `MAX_PIPELINE_RETRIES` on a non-transient error.

## Orchestrator contract

`advancePipeline()` in `lib/pipeline/orchestrator.ts` advances **at most one step per invocation**. Bounds wall-clock cost per cron tick and keeps error recovery granular.

Step handlers return one of two signals:

- **`"done"`** — handler did the work, orchestrator marks the step done.
- **`"deferred"`** — couldn't proceed right now (e.g. someone else holds `ReportGenerationLock`). Orchestrator schedules a short retry (`DEFERRED_RETRY_DELAY_SECONDS = 60`) _without_ counting against the retry budget.

Transient errors (classified by `lib/pipeline/errors.ts#isTransientError`) trigger exponential backoff through `nextAttemptAt`. Retry budget: `MAX_PIPELINE_RETRIES = 5`.

## Worker locking

Workers claim a pipeline row atomically by setting `workerLock` + `workerLockAt`. Invariant: `releaseWorkerLock` runs **exactly once** per `advancePipeline()` invocation (enforced via `try/finally` regardless of which throw path fires).

| Constant                       | Value   | Role                                            |
| ------------------------------ | ------- | ----------------------------------------------- |
| `WORKER_LOCK_TTL_MS`           | 180_000 | Matches the report pipeline timeout             |
| `STALE_RUNNING_THRESHOLD_MS`   | 300_000 | Threshold for reclaiming a crashed worker's row |
| `DEFERRED_RETRY_DELAY_SECONDS` | 60      | Requeue delay when a handler reports `deferred` |
| `MAX_PIPELINE_RETRIES`         | 5       | Retry cap before row → `failed`                 |

### Crash recovery

Rows whose `workerLockAt` is older than `STALE_RUNNING_THRESHOLD_MS` (5 min) are eligible for reclamation by a fresh worker. This is the self-heal path when a worker crashes mid-step.

## Cron worker

`/api/cron/pipeline-worker` runs on Vercel cron, picks one claimable row, and calls `advancePipeline()`. This drives stuck rows forward even if the foreground request flow crashed or timed out. One step per tick keeps each invocation bounded.

## Funnel events

Terminal state changes are the only funnel emission points, so operators can watch the lifecycle end-to-end without double-counting. Consumers: admin funnel dashboard, `verify:thesis` drop-off classifier.

## Status polling

Frontend polls `/api/assessment/[id]/pipeline-status`. Response is `PipelineStatusResponse` from `lib/pipeline/types.ts` — it omits the internal lock fields.

### `profilePreview`

Populated once `profileStatus === "done"` so the UI can play a reveal ceremony before `narratives` finishes. Contains: `archetypePrimary`, bilingual archetype label + tagline, top RIASEC interest, top Big Five dimension, top values.

## Resume analysis branch

`resumeAnalysisStatus` progresses _independently_ of the main step order:

```
not_requested  → user hasn't decided yet (no ReportDepthDialog click)
skipped        → user chose Standard mode
pending/running/done/failed  → resume-enhanced path
```

Triggered from `ReportDepthDialog`; consumed by `generateCareerReport()` via the optional `resumeMatch` argument. Persistence lives in `lib/db/resume-match.ts` (migration `078`).

## Related migrations

| Migration                             | Purpose                                              |
| ------------------------------------- | ---------------------------------------------------- |
| `075-report-generation-lock.sql`      | `ReportGenerationLock` table (foreground/cron guard) |
| `076-assessment-pipeline.sql`         | `AssessmentPipeline` table + column set              |
| `077-assessment-pipeline-backoff.sql` | `nextAttemptAt` + retry columns for exp backoff      |
| `078-resume-match-persistence.sql`    | `ResumeMatch` table + `resumeAnalysisStatus` column  |
