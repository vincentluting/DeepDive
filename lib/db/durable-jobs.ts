// ============================================================
// DurableJob DB layer
//
// Generic Postgres-backed queue for non-critical side effects that still need
// durability: enqueue synchronously, claim with SKIP LOCKED, retry with
// exponential backoff, and guard duplicates with an optional idempotency key.
// ============================================================

import { sql } from "@/lib/db/connection";

export type DurableJobType = "post_registration";
export type DurableJobStatus = "pending" | "running" | "succeeded" | "failed";

export interface DurableJobRow<Payload = unknown> {
  id: string;
  type: DurableJobType;
  payload: Payload;
  status: DurableJobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  runAt: Date;
  lockedBy: string | null;
  lockedAt: Date | null;
  lastError: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

type RawDurableJobRow = {
  id: string;
  type: DurableJobType;
  payload: unknown;
  status: DurableJobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  runAt: string | Date;
  lockedBy: string | null;
  lockedAt: string | Date | null;
  lastError: string | null;
  idempotencyKey: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  completedAt: string | Date | null;
};

export interface EnqueueDurableJobInput<Payload = unknown> {
  type: DurableJobType;
  payload: Payload;
  idempotencyKey?: string;
  runAt?: Date;
  priority?: number;
  maxAttempts?: number;
}

const DEFAULT_MAX_ATTEMPTS = 5;
const STALE_JOB_LOCK_MS = 5 * 60 * 1000;

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function hydrate<Payload = unknown>(
  row: RawDurableJobRow,
): DurableJobRow<Payload> {
  const payload =
    typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;

  return {
    ...row,
    payload: payload as Payload,
    runAt: toDate(row.runAt),
    lockedAt: row.lockedAt ? toDate(row.lockedAt) : null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
    completedAt: row.completedAt ? toDate(row.completedAt) : null,
  };
}

export function durableJobBackoffSeconds(attemptsAfterFailure: number): number {
  if (attemptsAfterFailure <= 0) return 0;
  return Math.min(30 * 2 ** (attemptsAfterFailure - 1), 1800);
}

export function formatDurableJobError(error: unknown): string {
  const message =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return message.slice(0, 2000);
}

export async function enqueueDurableJob<Payload = unknown>(
  input: EnqueueDurableJobInput<Payload>,
): Promise<DurableJobRow<Payload>> {
  const rows = await sql<RawDurableJobRow>`
    INSERT INTO "DurableJob" (
      "type", "payload", "idempotencyKey", "runAt", "priority", "maxAttempts"
    )
    VALUES (
      ${input.type},
      ${JSON.stringify(input.payload)}::jsonb,
      ${input.idempotencyKey ?? null},
      ${input.runAt ?? new Date()},
      ${input.priority ?? 0},
      ${input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS}
    )
    ON CONFLICT ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL
    DO UPDATE SET
      "payload" = CASE
        WHEN "DurableJob"."status" IN ('pending', 'failed')
          THEN EXCLUDED."payload"
        ELSE "DurableJob"."payload"
      END,
      "runAt" = CASE
        WHEN "DurableJob"."status" IN ('pending', 'failed')
          THEN LEAST("DurableJob"."runAt", EXCLUDED."runAt")
        ELSE "DurableJob"."runAt"
      END,
      "priority" = GREATEST("DurableJob"."priority", EXCLUDED."priority"),
      "maxAttempts" = GREATEST("DurableJob"."maxAttempts", EXCLUDED."maxAttempts"),
      "status" = CASE
        WHEN "DurableJob"."status" = 'failed'
          AND "DurableJob"."attempts" < "DurableJob"."maxAttempts"
          THEN 'pending'
        ELSE "DurableJob"."status"
      END,
      "updatedAt" = NOW()
    RETURNING *
  `;

  return hydrate<Payload>(rows[0]);
}

export async function claimDueJobs(
  limit: number,
  workerId: string,
  types?: DurableJobType[],
): Promise<DurableJobRow[]> {
  if (limit <= 0) return [];

  const staleBefore = new Date(Date.now() - STALE_JOB_LOCK_MS);
  const rows =
    types && types.length > 0
      ? await sql<RawDurableJobRow>`
          WITH candidates AS (
            SELECT "id"
            FROM "DurableJob"
            WHERE "type" = ANY(${types})
              AND "status" IN ('pending', 'running')
              AND "runAt" <= NOW()
              AND "attempts" < "maxAttempts"
              AND (
                "lockedBy" IS NULL
                OR "lockedAt" < ${staleBefore}
              )
            ORDER BY "priority" DESC, "runAt" ASC, "createdAt" ASC
            LIMIT ${limit}
            FOR UPDATE SKIP LOCKED
          )
          UPDATE "DurableJob" dj
          SET
            "status" = 'running',
            "lockedBy" = ${workerId},
            "lockedAt" = NOW(),
            "updatedAt" = NOW()
          FROM candidates c
          WHERE dj."id" = c."id"
          RETURNING dj.*
        `
      : await sql<RawDurableJobRow>`
          WITH candidates AS (
            SELECT "id"
            FROM "DurableJob"
            WHERE "status" IN ('pending', 'running')
              AND "runAt" <= NOW()
              AND "attempts" < "maxAttempts"
              AND (
                "lockedBy" IS NULL
                OR "lockedAt" < ${staleBefore}
              )
            ORDER BY "priority" DESC, "runAt" ASC, "createdAt" ASC
            LIMIT ${limit}
            FOR UPDATE SKIP LOCKED
          )
          UPDATE "DurableJob" dj
          SET
            "status" = 'running',
            "lockedBy" = ${workerId},
            "lockedAt" = NOW(),
            "updatedAt" = NOW()
          FROM candidates c
          WHERE dj."id" = c."id"
          RETURNING dj.*
        `;

  return rows.map((row) => hydrate(row));
}

export async function markDurableJobSucceeded(
  jobId: string,
  workerId: string,
): Promise<DurableJobRow | null> {
  const rows = await sql<RawDurableJobRow>`
    UPDATE "DurableJob"
    SET
      "status" = 'succeeded',
      "lockedBy" = NULL,
      "lockedAt" = NULL,
      "lastError" = NULL,
      "completedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "id" = ${jobId}
      AND "lockedBy" = ${workerId}
    RETURNING *
  `;

  return rows[0] ? hydrate(rows[0]) : null;
}

export async function markDurableJobFailed(
  job: DurableJobRow,
  workerId: string,
  error: unknown,
  opts: { permanent?: boolean } = {},
): Promise<DurableJobRow | null> {
  const attemptsAfterFailure = job.attempts + 1;
  const terminal = opts.permanent || attemptsAfterFailure >= job.maxAttempts;
  const nextRunAt = terminal
    ? job.runAt
    : new Date(
        Date.now() + durableJobBackoffSeconds(attemptsAfterFailure) * 1000,
      );

  const rows = await sql<RawDurableJobRow>`
    UPDATE "DurableJob"
    SET
      "status" = ${terminal ? "failed" : "pending"},
      "attempts" = ${attemptsAfterFailure},
      "runAt" = ${nextRunAt},
      "lockedBy" = NULL,
      "lockedAt" = NULL,
      "lastError" = ${formatDurableJobError(error)},
      "completedAt" = ${terminal ? new Date() : null},
      "updatedAt" = NOW()
    WHERE "id" = ${job.id}
      AND "lockedBy" = ${workerId}
    RETURNING *
  `;

  return rows[0] ? hydrate(rows[0]) : null;
}

export interface DurableJobHealth {
  pending: number;
  running: number;
  succeededLast24h: number;
  failedLast24h: number;
  oldestPendingAt: string | null;
}

export async function getDurableJobHealth(): Promise<DurableJobHealth> {
  const rows = await sql<{
    pending: string | number;
    running: string | number;
    succeededLast24h: string | number;
    failedLast24h: string | number;
    oldestPendingAt: string | Date | null;
  }>`
    SELECT
      COUNT(*) FILTER (WHERE "status" = 'pending') AS "pending",
      COUNT(*) FILTER (WHERE "status" = 'running') AS "running",
      COUNT(*) FILTER (
        WHERE "status" = 'succeeded'
          AND "completedAt" >= NOW() - INTERVAL '24 hours'
      ) AS "succeededLast24h",
      COUNT(*) FILTER (
        WHERE "status" = 'failed'
          AND "completedAt" >= NOW() - INTERVAL '24 hours'
      ) AS "failedLast24h",
      MIN("runAt") FILTER (WHERE "status" = 'pending') AS "oldestPendingAt"
    FROM "DurableJob"
  `;

  const row = rows[0];
  return {
    pending: Number(row?.pending ?? 0),
    running: Number(row?.running ?? 0),
    succeededLast24h: Number(row?.succeededLast24h ?? 0),
    failedLast24h: Number(row?.failedLast24h ?? 0),
    oldestPendingAt: row?.oldestPendingAt
      ? toDate(row.oldestPendingAt).toISOString()
      : null,
  };
}
