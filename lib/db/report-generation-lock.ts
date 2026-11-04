// ============================================================
// ReportGenerationLock — cross-instance dedup for /api/generate-report
//
// Neon serverless uses stateless HTTP; Postgres advisory locks are
// session-scoped and do not survive between queries. Instead, we use
// a dedicated lock table with atomic upsert semantics.
//
// Acquire:
//   INSERT ... ON CONFLICT UPDATE WHERE expiresAt < NOW()
//   RETURNING "instanceId" = <ours>
//
//   - If INSERT wins → we own the lock
//   - If UPDATE wins (existing lock expired) → we own the lock
//   - If WHERE fails (existing lock still active) → nothing returned,
//     caller must wait for the other instance's CareerReport to land
//
// Release: DELETE by (assessmentId, instanceId) so we only remove our
// own lock, never a newer holder's lock.
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";

const DEFAULT_TTL_MS = 180_000;

export interface LockHandle {
  assessmentId: string;
  instanceId: string;
}

/**
 * Try to acquire the lock. Returns a handle if we won, null if another
 * instance holds an unexpired lock.
 */
export async function acquireReportLock(
  assessmentId: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<LockHandle | null> {
  const instanceId = randomUUID();
  const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000));

  const rows = (await sql`
    INSERT INTO "ReportGenerationLock" ("assessmentId", "instanceId", "expiresAt")
    VALUES (${assessmentId}, ${instanceId}, NOW() + (${ttlSeconds} || ' seconds')::INTERVAL)
    ON CONFLICT ("assessmentId") DO UPDATE SET
      "instanceId" = EXCLUDED."instanceId",
      "expiresAt"  = EXCLUDED."expiresAt",
      "acquiredAt" = NOW()
    WHERE "ReportGenerationLock"."expiresAt" < NOW()
    RETURNING "instanceId"
  `) as Array<{ instanceId: string }>;

  if (rows.length === 0) return null;
  if (rows[0].instanceId !== instanceId) return null;

  return { assessmentId, instanceId };
}

/**
 * Release the lock. Safe to call if another instance already reclaimed
 * the lock — we only delete rows matching our instanceId.
 */
export async function releaseReportLock(handle: LockHandle): Promise<void> {
  try {
    await sql`
      DELETE FROM "ReportGenerationLock"
      WHERE "assessmentId" = ${handle.assessmentId}
        AND "instanceId" = ${handle.instanceId}
    `;
  } catch {
    // Best-effort release — the lock self-expires in ≤ ttlMs anyway.
  }
}
