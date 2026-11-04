// ============================================================
// Exploration Progress — UserExplorationProgress CRUD
//
// Table: UserExplorationProgress
// Required schema (add via migration):
//
//   CREATE TABLE "UserExplorationProgress" (
//     "id"          TEXT PRIMARY KEY,
//     "userId"      TEXT NOT NULL REFERENCES "User"("id") UNIQUE,
//     "modulesJson" JSONB NOT NULL DEFAULT '{}',
//     "depthM"      INTEGER NOT NULL DEFAULT 0,
//     "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
//   );
//   CREATE INDEX "idx_exploration_progress_user"
//     ON "UserExplorationProgress"("userId");
//
// modulesJson shape: { [ModuleKey | SideQuestKey]: ISO-8601 string | null }
// depthM is always recalculated from modulesJson on every write.
// ============================================================

import { sql } from './connection';
import {
  calculateDepth,
  type UserExplorationProgress,
} from '@/lib/exploration/depth-calculator';
import { getQuickDiveModeAliases } from '@/lib/quickdive/explore-mode';

// ── Internal helpers ───────────────────────────────────────

/** Raw DB row returned by Neon for UserExplorationProgress. */
interface ExplorationProgressRow {
  id: string;
  userId: string;
  modulesJson: Record<string, string | null>;
  depthM: number;
  updatedAt: string;
}

/** Convert a raw DB row to the typed domain object. */
function rowToProgress(row: ExplorationProgressRow): UserExplorationProgress {
  const modules: Record<string, Date | null> = {};
  for (const [key, val] of Object.entries(row.modulesJson)) {
    modules[key] = val ? new Date(val) : null;
  }
  return {
    userId:    row.userId,
    modules,
    depthM:    row.depthM,
    updatedAt: new Date(row.updatedAt),
  };
}

// ── Public API ─────────────────────────────────────────────

/**
 * Compute exploration progress in real-time from source tables.
 * This is the primary read path — it NEVER touches UserExplorationProgress.
 *
 * Main-path modules and their data sources:
 *   quickDive   → QuickDiveResult.createdAt
 *   deepDive    → AssessmentResult.createdAt (covers SJT+DDVQ+IPIP as one step)
 *   profile     → PersonalProfile.createdAt
 *   report      → CareerReport.createdAt
 *   actionHub   → ActionPlan.createdAt OR ActionItem.completedAt
 *   coaching    → CoachingSession.startedAt
 *
 * Side quests:
 *   immersive    → QuickDiveResult with exploreMode='immersive'
 *   realityCheck → RealConditions.createdAt
 */
export async function computeProgressFromSourceTables(userId: string): Promise<UserExplorationProgress> {
  const immersiveModes = getQuickDiveModeAliases('immersive');
  const safeQuery = (promise: Promise<Array<Record<string, unknown>>>, label?: string): Promise<Array<Record<string, unknown>>> =>
    promise.catch((err) => {
      console.warn(`[exploration-progress] Query failed${label ? ` (${label})` : ''}:`, err instanceof Error ? err.message : err);
      return [];
    });

  const [qdRow, assessRow, profileRow, reportRow, coachRow, planRow, actionRow, immersiveRow, realityRow] = await Promise.all([
    // Main path
    safeQuery(sql`SELECT "createdAt" FROM "QuickDiveResult" WHERE "userId" = ${userId} ORDER BY "createdAt" ASC LIMIT 1`),
    safeQuery(sql`SELECT "createdAt" FROM "AssessmentResult" WHERE "userId" = ${userId} ORDER BY "createdAt" ASC LIMIT 1`),
    safeQuery(sql`SELECT "createdAt" FROM "PersonalProfile" WHERE "userId" = ${userId} ORDER BY "createdAt" ASC LIMIT 1`),
    safeQuery(sql`SELECT "createdAt" FROM "CareerReport" WHERE "userId" = ${userId} ORDER BY "createdAt" ASC LIMIT 1`),
    safeQuery(sql`SELECT "startedAt" AS "createdAt" FROM "CoachingSession" WHERE "userId" = ${userId} ORDER BY "startedAt" ASC LIMIT 1`),
    safeQuery(sql`SELECT "createdAt" FROM "ActionPlan" WHERE "userId" = ${userId} ORDER BY "createdAt" ASC LIMIT 1`),
    safeQuery(sql`SELECT "completedAt" AS "createdAt" FROM "ActionItem" WHERE "userId" = ${userId} AND "status" = 'completed' ORDER BY "completedAt" ASC LIMIT 1`),
    // Side quests
    safeQuery(sql`SELECT "createdAt" FROM "QuickDiveResult" WHERE "userId" = ${userId} AND "exploreMode" = ANY(${immersiveModes}) ORDER BY "createdAt" ASC LIMIT 1`),
    safeQuery(sql`SELECT "createdAt" FROM "RealConditions" WHERE "userId" = ${userId} ORDER BY "createdAt" ASC LIMIT 1`),
  ]);

  // actionHub = whichever came first: plan created or first action completed
  const planDate = planRow.length > 0 ? new Date(planRow[0].createdAt as string) : null;
  const actionDate = actionRow.length > 0 ? new Date(actionRow[0].createdAt as string) : null;
  const actionHubDate = planDate ?? actionDate;

  const modules: Record<string, Date | null> = {
    // Main path
    quickDive:    qdRow.length > 0       ? new Date(qdRow[0].createdAt as string)       : null,
    deepDive:     assessRow.length > 0   ? new Date(assessRow[0].createdAt as string)   : null,
    profile:      profileRow.length > 0  ? new Date(profileRow[0].createdAt as string)  : null,
    report:       reportRow.length > 0   ? new Date(reportRow[0].createdAt as string)   : null,
    actionHub:    actionHubDate,
    coaching:     coachRow.length > 0    ? new Date(coachRow[0].createdAt as string)    : null,
    // Side quests
    immersive:    immersiveRow.length > 0 ? new Date(immersiveRow[0].createdAt as string) : null,
    realityCheck: realityRow.length > 0  ? new Date(realityRow[0].createdAt as string)  : null,
  };

  const { depthM } = calculateDepth(modules);

  return {
    userId,
    modules,
    depthM,
    updatedAt: new Date(),
  };
}

/**
 * Fetch exploration progress for a user without auto-creating a record.
 * Returns null if the user has no progress row yet.
 */
export async function getExplorationProgress(
  userId: string,
): Promise<UserExplorationProgress | null> {
  const rows = await sql`
    SELECT "id", "userId", "modulesJson", "depthM", "updatedAt"
    FROM "UserExplorationProgress"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  return rowToProgress(rows[0] as ExplorationProgressRow);
}

/**
 * Reset Deep Dive module timestamps (deepDive, profile, report, realityCheck) to null,
 * then recalculate and persist the total depthM.
 * No-ops if the user has no progress row yet.
 */
export async function resetDeepDiveModules(userId: string): Promise<void> {
  const current = await getExplorationProgress(userId);
  if (!current) return;

  const updatedModules: Record<string, Date | null> = { ...current.modules };
  for (const key of ['deepDive', 'profile', 'report', 'realityCheck']) {
    updatedModules[key] = null;
  }

  const { depthM } = calculateDepth(updatedModules);

  const modulesForDb: Record<string, string | null> = {};
  for (const [key, val] of Object.entries(updatedModules)) {
    modulesForDb[key] = val ? val.toISOString() : null;
  }

  await sql`
    UPDATE "UserExplorationProgress"
    SET "modulesJson" = ${JSON.stringify(modulesForDb)}::jsonb,
        "depthM"      = ${depthM},
        "updatedAt"   = NOW()
    WHERE "userId" = ${userId}
  `;
}
