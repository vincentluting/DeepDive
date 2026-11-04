import { sql } from "./connection";
import { hardDeleteUser } from "./user-data";

export interface PendingDeletionRequest {
  id: string;
  userId: string;
  requestedAt: string;
  scheduledDeletionAt: string;
}

export interface DeletionQueueResult {
  total: number;
  succeeded: number;
  failed: number;
  failures: Array<{ userId: string; error: string }>;
  dryRun: boolean;
}

export async function fetchDueDeletionRequests(): Promise<
  PendingDeletionRequest[]
> {
  const rows = await sql<PendingDeletionRequest>`
    SELECT "id", "userId", "requestedAt"::text AS "requestedAt",
           "scheduledDeletionAt"::text AS "scheduledDeletionAt"
    FROM "UserDeletionRequest"
    WHERE "scheduledDeletionAt" <= NOW()
      AND "executedAt" IS NULL
      AND "cancelledAt" IS NULL
    ORDER BY "scheduledDeletionAt" ASC
  `;
  return rows;
}

export async function executeDeletionRequest(
  request: PendingDeletionRequest,
): Promise<void> {
  await sql`
    UPDATE "UserDeletionRequest"
    SET "executedAt" = NOW()
    WHERE "id" = ${request.id}
  `;
  await hardDeleteUser(request.userId);
}

export async function processDeletionQueue(
  options: { dryRun?: boolean } = {},
): Promise<DeletionQueueResult> {
  const dryRun = options.dryRun === true;
  const requests = await fetchDueDeletionRequests();
  const result: DeletionQueueResult = {
    total: requests.length,
    succeeded: 0,
    failed: 0,
    failures: [],
    dryRun,
  };
  if (dryRun || requests.length === 0) return result;

  for (const request of requests) {
    try {
      await executeDeletionRequest(request);
      result.succeeded += 1;
    } catch (err) {
      result.failed += 1;
      result.failures.push({
        userId: request.userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return result;
}
