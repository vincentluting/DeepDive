// ============================================================
// Identity Linking — IdentityLink CRUD + anonymous backfill
//
// Maps anonymous visitor IDs (clientId) to registered users.
// Supports backfilling UserFunnel events and PageVisit records
// when an anonymous user registers or logs in.
//
// Table: IdentityLink
// Related: UserFunnel (backfill by clientId), PageVisit (backfill by time window)
// ============================================================

import { sql } from './connection'

type LinkSource = 'registration' | 'login' | 'manual' | 'backfill'

/**
 * Link an anonymous visitor ID to a registered user.
 * Uses ON CONFLICT DO NOTHING so duplicate links are silently ignored.
 * Fire-and-forget: errors are caught and logged, never thrown.
 */
export async function linkIdentity(
  userId: string,
  anonymousId: string,
  source: LinkSource = 'registration'
): Promise<void> {
  try {
    const id = crypto.randomUUID()
    await sql`
      INSERT INTO "IdentityLink" ("id", "userId", "anonymousId", "source")
      VALUES (${id}, ${userId}, ${anonymousId}, ${source})
      ON CONFLICT ("userId", "anonymousId") DO NOTHING
    `
  } catch (error) {
    console.error('[identity] linkIdentity failed:', error instanceof Error ? error.message : error)
  }
}

/**
 * Backfill UserFunnel events: reassign anonymous funnel events to the
 * registered user. Only updates events from the last 90 days where
 * userId is still NULL.
 * Returns the number of rows updated.
 */
export async function backfillFunnelEvents(
  userId: string,
  anonymousId: string
): Promise<number> {
  try {
    const result = await sql`
      UPDATE "UserFunnel"
      SET "userId" = ${userId}
      WHERE "clientId" = ${anonymousId}
        AND "userId" IS NULL
        AND "createdAt" >= NOW() - INTERVAL '90 days'
    `
    return (result as unknown as { count?: number }).count ?? 0
  } catch (error) {
    console.error('[identity] backfillFunnelEvents failed:', error instanceof Error ? error.message : error);
    return 0
  }
}

/**
 * Backfill PageVisit records by time-window heuristic.
 *
 * PageVisit has no clientId column, so we use a best-effort approach:
 * 1. Find the earliest and latest createdAt from UserFunnel for this anonymousId
 * 2. Update PageVisit records within that time window that have no userId
 * 3. LIMIT 500 to prevent over-attribution
 *
 * Wrapped in a transaction — rolls back on failure.
 * Returns the number of rows updated.
 */
export async function backfillPageVisits(
  userId: string,
  anonymousId: string
): Promise<number> {
  // Step 1: Find the time window from UserFunnel
  const windowRows = await sql`
    SELECT
      MIN("createdAt") AS "earliest",
      MAX("createdAt") AS "latest"
    FROM "UserFunnel"
    WHERE "clientId" = ${anonymousId}
  `

  const earliest = windowRows[0]?.earliest as string | null
  const latest = windowRows[0]?.latest as string | null

  if (!earliest || !latest) {
    return 0
  }

  // Step 2: Atomic update within the time window (single query, no transaction needed)
  try {
    const updated = await sql`
      UPDATE "PageVisit"
      SET "userId" = ${userId}
      WHERE "id" IN (
        SELECT "id" FROM "PageVisit"
        WHERE "userId" IS NULL
          AND "createdAt" >= ${earliest}
          AND "createdAt" <= ${latest}
        LIMIT 500
      )
    `

    return (updated as unknown as { count?: number }).count ?? 0
  } catch (error) {
    console.error('[identity] backfillPageVisits failed:', error instanceof Error ? error.message : error)
    return 0
  }
}
