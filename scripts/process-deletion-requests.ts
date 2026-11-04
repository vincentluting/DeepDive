// ============================================================
// Deep Dive — GDPR Deletion Request Processor
//
// Scans UserDeletionRequest for rows whose scheduledDeletionAt has
// passed (and that have not been cancelled or already executed),
// hard-deletes the user and all associated data via the shared
// hardDeleteUser() pipeline, and marks the request as executed.
//
// Usage:
//   npm run gdpr:process-deletions                 # execute deletions
//   npx tsx scripts/process-deletion-requests.ts --dry-run  # preview only
//
// Intended cadence: daily cron (Vercel cron or external scheduler).
// Safe to run more often — no-op when the queue is empty.
//
// Idempotency: each row is marked executed inside a single transaction
// so re-running the script after a partial failure only touches the
// still-pending rows.
// ============================================================

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const verbose = args.includes("--verbose") || dryRun;

async function main(): Promise<void> {
  // Dynamic imports so lib/db/connection reads .env.local after dotenv runs.
  const { fetchDueDeletionRequests, executeDeletionRequest } =
    await import("../lib/db/user-deletion-queue");
  const requests = await fetchDueDeletionRequests();

  if (requests.length === 0) {
    console.log("[gdpr] No pending deletion requests are due.");
    return;
  }

  console.log(
    `[gdpr] ${requests.length} deletion request(s) due.` +
      (dryRun ? " (dry run — nothing will be deleted)" : ""),
  );

  if (verbose) {
    for (const r of requests) {
      console.log(
        `  - ${r.userId}  requested=${r.requestedAt}  scheduled=${r.scheduledDeletionAt}`,
      );
    }
  }

  if (dryRun) return;

  let ok = 0;
  let failed = 0;
  for (const r of requests) {
    try {
      await executeDeletionRequest(r);
      ok++;
      console.log(`[gdpr] ✓ Deleted user ${r.userId}`);
    } catch (err) {
      failed++;
      console.error(
        `[gdpr] ✗ Failed to delete user ${r.userId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log(`[gdpr] Done. ok=${ok} failed=${failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[gdpr] Fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
