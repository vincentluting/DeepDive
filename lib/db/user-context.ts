// ============================================================
// UserContext — Precomputed user context (single-row read path)
//
// Table: UserContext
// Key idea: Instead of 7+ queries per page load, read 1 row.
// Updated on every data mutation (write-time aggregation).
//
// Write path: recomputeUserContext(userId) — called after
//   Quick Dive save, report generation, profile generation,
//   coaching session end.
// Read path: getUserContext(userId) — 1 query, ~50ms.
// ============================================================

import { sql } from './connection'
import { getProfile } from './profiles'
import { getUserProfileInsights } from './profiles'
import { getUserReports, getLatestReportIdForUser } from './reports'
import { getLatestQuickDiveByUserId } from './platform'
import { getDeepDiveStatusForUser } from './sessions'
import { getCoachingSessionCount } from './coaching'
import { computeProgressFromSourceTables } from './exploration-progress'
import { calculateDepth, getDepthZone } from '../exploration/depth-calculator'
import { getJourneyState } from './journey'
import { deriveUserLevel } from '../journey/state-machine'

// ── Context JSON shape ───────────────────────────────────

export interface UserContextData {
  /** 0=new, 1=quickDiveOnly, 2=profileGenerated+, 3=powerUser — derived from journeyState */
  userLevel: 0 | 1 | 2 | 3
  hasQuickDive: boolean
  hasDeepReport: boolean
  deepDiveInProgress: boolean

  quickDive: {
    archetypeCode: string
    archetypeLabel: string
    scoresJson: Record<string, number>
  } | null

  latestReportId: string | null
  reports: Array<{
    id: string
    createdAt: string
    reportType: 'deep' | 'quick'
    exploreMode?: string | null
  }>

  profile: {
    archetypeCode: string | null
    archetypeLabelEn: string | null
    archetypeLabelZh: string | null
    coreInsight: string | null
    riasecScores: Record<string, number> | null
  } | null

  coachingCount: number

  depth: {
    depthM: number
    completionPercent: number
    zoneNameEn: string
    zoneNameZh: string
  }

  insights: Array<{ insight?: string; discoveredAt?: string }>

  updatedAt: string
}

// ── Read path ────────────────────────────────────────────

/**
 * Get precomputed user context (1 query).
 * Returns null if context hasn't been computed yet.
 */
export async function getUserContext(userId: string): Promise<UserContextData | null> {
  const rows = await sql`
    SELECT "contextJson" FROM "UserContext"
    WHERE "userId" = ${userId}
  `
  if (rows.length === 0) return null

  const raw = rows[0].contextJson
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as UserContextData } catch { return null }
  }
  return raw as UserContextData
}

// ── Write path ───────────────────────────────────────────

/**
 * Recompute and persist the full user context.
 * Call after any data mutation (report, profile, quickdive, coaching).
 * Runs 7 queries in parallel, computes derived fields, UPSERTs 1 row.
 */
export async function recomputeUserContext(userId: string): Promise<UserContextData> {
  // Fetch all source data in parallel
  const [
    { reports },
    personalProfile,
    quickDiveData,
    deepDiveStatus,
    coachingCount,
    profileInsights,
    latestReportId,
    explorationProgress,
    journeyState,
  ] = await Promise.all([
    getUserReports(userId).catch(() => ({ reports: [] as Awaited<ReturnType<typeof getUserReports>>['reports'] })),
    getProfile(userId).catch(() => null),
    getLatestQuickDiveByUserId(userId).catch(() => null),
    getDeepDiveStatusForUser(userId).catch(() => ({ hasResults: false, inProgress: false })),
    getCoachingSessionCount(userId).catch(() => 0),
    getUserProfileInsights(userId).catch(() => null),
    getLatestReportIdForUser(userId).catch(() => null),
    computeProgressFromSourceTables(userId).catch(() => null),
    getJourneyState(userId).catch(() => 'not_started' as const),
  ])

  // Derive exploration depth
  const progressModules = explorationProgress?.modules ?? {}
  const depthResult = calculateDepth(progressModules)
  const zone = getDepthZone(depthResult.depthM)

  // Derive user level from journey state (single source of truth)
  const hasQuickDive = !!quickDiveData || !!progressModules['quickDive']
  const hasDeepReport = reports.some(r => r.reportType === 'deep')

  // Extract insights from profile insights JSONB
  const insights: Array<{ insight?: string; discoveredAt?: string }> = (() => {
    if (!profileInsights?.insightsJson) return []
    const arr = (profileInsights.insightsJson as Record<string, unknown>).coachingInsights
    return Array.isArray(arr) ? arr as Array<{ insight?: string; discoveredAt?: string }> : []
  })()

  const hasPowerUserData = reports.length > 1 && insights.length > 0
  const userLevel = deriveUserLevel(journeyState, hasPowerUserData)

  // Build context object (lightweight — no reportJson blobs)
  const context: UserContextData = {
    userLevel,
    hasQuickDive,
    hasDeepReport,
    deepDiveInProgress: deepDiveStatus.inProgress,

    quickDive: quickDiveData ? {
      archetypeCode: quickDiveData.archetypeCode,
      archetypeLabel: quickDiveData.archetypeLabel,
      scoresJson: quickDiveData.scoresJson,
    } : null,

    latestReportId,
    reports: reports.map(r => ({
      id: r.id,
      createdAt: r.createdAt,
      reportType: r.reportType,
      exploreMode: r.exploreMode,
    })),

    profile: personalProfile ? {
      archetypeCode: personalProfile.archetype?.code ?? null,
      archetypeLabelEn: personalProfile.archetype?.label_en ?? null,
      archetypeLabelZh: personalProfile.archetype?.label_zh ?? null,
      coreInsight: personalProfile.narrativeSnapshots?.coreInsight ?? null,
      riasecScores: personalProfile.riasecScores ?? null,
    } : null,

    coachingCount,

    depth: {
      depthM: depthResult.depthM,
      completionPercent: depthResult.completionPercent,
      zoneNameEn: zone.label.en,
      zoneNameZh: zone.label.zh,
    },

    insights,

    updatedAt: new Date().toISOString(),
  }

  // UPSERT into UserContext
  await sql`
    INSERT INTO "UserContext" ("userId", "contextJson", "version", "updatedAt")
    VALUES (${userId}, ${JSON.stringify(context)}::jsonb, 1, NOW())
    ON CONFLICT ("userId") DO UPDATE
      SET "contextJson" = EXCLUDED."contextJson",
          "version" = "UserContext"."version" + 1,
          "updatedAt" = NOW()
  `

  return context
}

/**
 * Get user context with lazy recompute.
 * If context exists, return it. If not, compute it on the fly.
 * This ensures the first page load works even before any mutation triggered recompute.
 */
export async function getUserContextOrCompute(userId: string): Promise<UserContextData> {
  const existing = await getUserContext(userId)
  if (existing) return existing
  return recomputeUserContext(userId)
}
