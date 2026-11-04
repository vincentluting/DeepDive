// ============================================================
// Global Teardown — Clean up temp files after all tests.
//
// When running via `npm run test:e2e` (branch isolation mode),
// the wrapper script handles branch deletion — no DB cleanup needed.
// When running via `npx playwright test` directly, fall back to
// API-based cleanup for backward compatibility.
// ============================================================

import { request } from "@playwright/test";
import { cleanupAllTestUsers } from "./fixtures/test-setup";
import * as fs from "fs";
import * as path from "path";

const SHARED_CONTEXT_PATH = path.join(__dirname, ".shared-context.json");
const STORAGE_STATE_PATH = path.join(__dirname, ".storage-state.json");

export default async function globalTeardown() {
  const isBranchIsolated = process.env.E2E_MANAGED === "true";

  // Only clean up test users when NOT using branch isolation
  // (branch deletion wipes all data automatically)
  if (!isBranchIsolated) {
    const ctx = await request.newContext({
      extraHTTPHeaders: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    try {
      await cleanupAllTestUsers(ctx);
      console.log("[global-teardown] Cleaned up all test users");
    } finally {
      await ctx.dispose();
    }
  }

  // Remove temp files
  for (const f of [SHARED_CONTEXT_PATH, STORAGE_STATE_PATH]) {
    try {
      fs.unlinkSync(f);
    } catch {
      /* already gone */
    }
  }
}
