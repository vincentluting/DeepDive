// ============================================================
// Durable job runner
//
// Claims due jobs, dispatches to typed handlers, and records success/retry/
// terminal failure back into DurableJob.
// ============================================================

import {
  claimDueJobs,
  markDurableJobFailed,
  markDurableJobSucceeded,
  type DurableJobRow,
  type DurableJobType,
} from "@/lib/db/durable-jobs";
import { handlePostRegistrationJob } from "@/lib/jobs/post-registration";

type DurableJobHandler = (
  payload: unknown,
  job: DurableJobRow,
) => Promise<void>;

const handlers = new Map<DurableJobType, DurableJobHandler>([
  ["post_registration", handlePostRegistrationJob],
]);

export interface RunDueJobsOptions {
  limit?: number;
  workerId?: string;
  types?: DurableJobType[];
}

export type JobRunResult = "succeeded" | "retry" | "failed" | "skipped";

export interface JobRunOutcome {
  jobId: string;
  type: DurableJobType;
  result: JobRunResult;
  attempts: number;
  durationMs: number;
  error?: string;
}

export interface JobRunSummary {
  workerId: string;
  claimed: number;
  durationMs: number;
  summary: Record<JobRunResult, number>;
  outcomes: JobRunOutcome[];
}

export async function runDueJobs(
  options: RunDueJobsOptions = {},
): Promise<JobRunSummary> {
  const workerId = options.workerId ?? crypto.randomUUID();
  const limit = options.limit ?? 10;
  const start = Date.now();
  const jobs = await claimDueJobs(limit, workerId, options.types);

  const outcomes = await Promise.all(
    jobs.map((job) => runOneJob(job, workerId)),
  );

  return {
    workerId,
    claimed: jobs.length,
    durationMs: Date.now() - start,
    summary: summarize(outcomes),
    outcomes,
  };
}

async function runOneJob(
  job: DurableJobRow,
  workerId: string,
): Promise<JobRunOutcome> {
  const start = Date.now();
  const handler = handlers.get(job.type);

  if (!handler) {
    await markDurableJobFailed(
      job,
      workerId,
      new Error(`No durable job handler registered for ${job.type}`),
      { permanent: true },
    );
    return {
      jobId: job.id,
      type: job.type,
      result: "failed",
      attempts: job.attempts + 1,
      durationMs: Date.now() - start,
      error: "missing_handler",
    };
  }

  try {
    await handler(job.payload, job);
    await markDurableJobSucceeded(job.id, workerId);
    return {
      jobId: job.id,
      type: job.type,
      result: "succeeded",
      attempts: job.attempts,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const updated = await markDurableJobFailed(job, workerId, err);
    const terminal = updated?.status === "failed";
    return {
      jobId: job.id,
      type: job.type,
      result: terminal ? "failed" : "retry",
      attempts: updated?.attempts ?? job.attempts + 1,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function summarize(outcomes: JobRunOutcome[]): Record<JobRunResult, number> {
  return {
    succeeded: outcomes.filter((item) => item.result === "succeeded").length,
    retry: outcomes.filter((item) => item.result === "retry").length,
    failed: outcomes.filter((item) => item.result === "failed").length,
    skipped: outcomes.filter((item) => item.result === "skipped").length,
  };
}
