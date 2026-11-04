// ============================================================
// Career Pool Provider — Unified source of career directions
//
// Source: Database (cached 5 min). No static fallback.
//
// Architecture (3-layer defense):
//   L1: ensureCareerPoolLoaded() — async entry, must be awaited
//       before any scoring. Called inside explore().
//   L2: getCareerPool() — sync accessor, THROWS if pool not
//       loaded (fail-fast, never silent empty array).
//   L3: Concurrent load dedup — multiple cold-start callers
//       share a single DB promise.
//
// All consumers should import getCareerPool() instead of
// querying the DB directly.
// ============================================================

import type { CareerDirectionTemplate } from "@/lib/types/report";

// ── In-memory cache ──────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedPool: CareerDirectionTemplate[] | null = null;
let cachedAt = 0;

/** Shared in-flight promise to dedup concurrent cold-start loads (L3) */
let inflightLoad: Promise<void> | null = null;

/**
 * Ensure the career pool is loaded before synchronous access.
 *
 * This is the canonical async entry point (L1). Called internally
 * by explore(), so most callers don't need to call it directly.
 * Idempotent — returns immediately if cache is already fresh.
 * Concurrent calls share a single DB request (L3 dedup).
 */
export async function ensureCareerPoolLoaded(): Promise<void> {
  if (
    cachedPool &&
    cachedPool.length > 0 &&
    Date.now() - cachedAt < CACHE_TTL_MS
  ) {
    return;
  }
  // Dedup: if a load is already in flight, join it instead of spawning another
  if (inflightLoad) {
    await inflightLoad;
    return;
  }
  inflightLoad = refreshCacheFromDb();
  try {
    await inflightLoad;
  } finally {
    inflightLoad = null;
  }
}

/**
 * Get the full career direction pool (synchronous).
 *
 * IMPORTANT: Callers must ensure ensureCareerPoolLoaded() has been
 * awaited before calling this. explore() does this automatically.
 *
 * L2 defense: throws if pool is not initialized, preventing silent
 * empty-result propagation.
 */
export function getCareerPool(): CareerDirectionTemplate[] {
  if (!cachedPool || cachedPool.length === 0) {
    throw new Error(
      "[career-pool] Pool not loaded. Call await ensureCareerPoolLoaded() before getCareerPool(). " +
        "This usually means explore() was not awaited or a cold-start race condition occurred.",
    );
  }
  return cachedPool;
}

/**
 * Force-refresh the cache from database.
 * Called internally by ensureCareerPoolLoaded(), or externally after admin edits.
 */
export async function refreshCacheFromDb(): Promise<void> {
  try {
    const { getAllActiveCareerDirections } =
      await import("@/lib/db/career-directions");
    const dbRows = await getAllActiveCareerDirections();

    if (dbRows.length > 0) {
      // Map DB rows → CareerDirectionTemplate interface
      cachedPool = dbRows.map((row) => ({
        id: row.id,
        title_zh: row.titleZh,
        title_en: row.titleEn,
        // Spread locale titles (title_nl, title_de, etc.) for getLocalizedField()
        ...Object.fromEntries(
          Object.entries(row.titleLocales ?? {}).map(([k, v]) => [
            `title_${k}`,
            v,
          ]),
        ),
        subtitle_zh: row.subtitleZh ?? "",
        idealRIASEC: row.idealRiasec,
        alignedValues: row.alignedValues,
        idealBigFive: row.idealBigFive,
        industries: row.industries,
        crossCulturalFit:
          row.crossCulturalFit as CareerDirectionTemplate["crossCulturalFit"],
        seniorityRange: {
          minYears: row.seniorityMin,
          maxYears: row.seniorityMax,
        },
        tags: row.tags,
        aiEraCategory: row.aiEraCategory ?? undefined,
        aiExposureScore: row.aiExposureScore ?? undefined,
        aiImpactLabel: row.aiImpactLabel ?? undefined,
        annotationSource: row.annotationSource,
        annotationConfidence: row.annotationConfidence,
        lastReviewedAt:
          row.lastReviewedAt?.toISOString().slice(0, 10) ??
          new Date().toISOString().slice(0, 10),
        marketOutlook: row.marketOutlook
          ? {
              trend: row.marketOutlook
                .trend as CareerDirectionTemplate["marketOutlook"] extends {
                trend: infer T;
              }
                ? T
                : never,
              label_zh: row.marketOutlook.label_zh,
              label_en: row.marketOutlook.label_en,
              note_zh: row.marketOutlook.note_zh,
              note_en: row.marketOutlook.note_en,
              source: row.marketOutlook.source,
              lastUpdated: row.marketOutlook.lastUpdated,
            }
          : undefined,
        resilienceScore: row.resilienceScore ?? undefined,
        resilienceLevel: row.resilienceLevel ?? undefined,
        jobZone: row.jobZone ?? null,
        deprecationStatus: row.deprecationStatus ?? "active",
        sunsetDate: row.sunsetDate ?? undefined,
      }));
      cachedAt = Date.now();
    }
  } catch {
    // DB unavailable — if stale cache exists, keep it; otherwise throw
    if (!cachedPool || cachedPool.length === 0) {
      throw new Error(
        "[career-pool] Failed to load career pool from DB and no stale cache available",
      );
    }
  }
}

/**
 * Invalidate the cache (e.g., after admin edit).
 * Next call to ensureCareerPoolLoaded() will trigger a DB refresh.
 */
export function invalidateCareerPoolCache(): void {
  cachedAt = 0;
}
