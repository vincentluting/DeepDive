// ============================================================
// Career Exploration Engine — Unified Entry Point (v2)
//
// One engine, progressive precision, multiple composition strategies.
//
// Quick Dive (30 RIASEC) → precision: 'quick' → RIASEC only
// Deep Dive  (86 items)  → precision: 'full'  → 4 independent factors
//
// v2 Changes (2026-03-12):
// - Industry moved from scoring dimension to pre-filter
//   (constraint, not preference signal)
// - Collab style removed (construct contamination: derived from
//   RIASEC, not independently measured)
// - Adaptability now career-specific (uses aiEraCategory)
// - Seniority bonus: careers matching user's experience get +5
// - Composition strategies updated to use independent factors only
//
// The engine scores ALL careers against 4 independent factors,
// then composes results using different strategies:
//   best-fit:  highest weighted total
//   surprise:  moderate total but one factor exceptionally high
//   growth:    high interest but personality stretch
//   drain:     lowest weighted total
//
// Usage:
//   import { explore } from '@/lib/career-matching'
//   const result = explore(userProfile, { locale: 'zh' })
// ============================================================

import {
  type CareerDirectionTemplate,
  filterByIndustry,
  filterBySeniority,
} from "@/lib/types/report";
import { getCareerPool, ensureCareerPoolLoaded } from "./career-pool";

import { scoreRiasec, toRiasecVector } from "./factors/riasec";
import { scoreBigFive } from "./factors/big-five";
import { scoreValues } from "./factors/values";
import { scoreAdaptability } from "./factors/adaptability";
import { scoreCollabStyle } from "./factors/collab-style";
import { scoreIndustry } from "./factors/industry";
import { WEIGHT_PRESETS, type WeightConfig } from "./weights";
import type {
  UserProfile,
  CareerFilters,
  FactorScores,
  ScoredCareer,
  ExplorationResult,
  CareerDisplayItem,
  RiasecVector,
} from "./types";

// ── Core Scoring ─────────────────────────────────────────────

/**
 * Score a single career against the user profile.
 * v2: adaptability is now career-specific (receives aiEraCategory).
 * collabFit and industryFit still computed for backward compatibility
 * but weighted at 0 in the v2 preset.
 */
function scoreCareer(
  profile: UserProfile,
  career: CareerDirectionTemplate,
): FactorScores {
  return {
    interestFit: scoreRiasec(profile.riasec, career.idealRIASEC),
    personalityFit: scoreBigFive(
      profile.bigFive,
      career.idealBigFive,
      career.id,
    ),
    valueFit: scoreValues(profile.schwartz, career.alignedValues, career.id),
    adaptabilityFit: scoreAdaptability(
      profile.schwartz,
      career.aiEraCategory,
      career.aiExposureScore,
    ),
    collabFit: scoreCollabStyle(profile.collab, career.idealRIASEC),
    industryFit: scoreIndustry(profile.industry, career.industries),
  };
}

/**
 * Compute weighted total from factor scores using given weights.
 */
function computeTotal(factors: FactorScores, weights: WeightConfig): number {
  return Math.round(
    factors.interestFit.score * weights.interestFit +
      factors.personalityFit.score * weights.personalityFit +
      factors.valueFit.score * weights.valueFit +
      factors.adaptabilityFit.score * weights.adaptabilityFit +
      factors.collabFit.score * weights.collabFit +
      factors.industryFit.score * weights.industryFit,
  );
}

/**
 * Seniority bonus: +5 if career's seniority range includes user's experience.
 * -3 if user is significantly outside the range.
 * 0 if no seniority data available.
 */
function seniorityBonus(
  career: CareerDirectionTemplate,
  experienceYears?: number,
): number {
  if (experienceYears === undefined) return 0;
  const range = career.seniorityRange;
  if (!range) return 0;

  if (experienceYears >= range.minYears && experienceYears <= range.maxYears) {
    return 5; // Within range: small boost
  }

  const distance =
    experienceYears < range.minYears
      ? range.minYears - experienceYears
      : experienceYears - range.maxYears;

  if (distance > 5) return -3; // Way outside: small penalty
  return 0; // Close enough: neutral
}

// ── Composition Strategies ───────────────────────────────────

/**
 * Surprise: careers with moderate total (60-85) but at least one
 * factor scoring ≥ 90. These are the "wait, THAT career?" moments.
 *
 * v2: uses only independent factors (interest, personality, values).
 */
function composeSurprise(
  scored: ScoredCareer[],
  count: number,
): ScoredCareer[] {
  return scored
    .filter((c) => {
      const total = c.totalScore;
      if (total < 55 || total > 88) return false;

      const factors = c.factors;
      const hasSpike =
        factors.interestFit.score >= 90 ||
        (factors.personalityFit.available &&
          factors.personalityFit.score >= 90) ||
        (factors.valueFit.available && factors.valueFit.score >= 90);
      return hasSpike;
    })
    .sort((a, b) => {
      const maxA = Math.max(
        a.factors.interestFit.score,
        a.factors.personalityFit.score,
        a.factors.valueFit.score,
      );
      const maxB = Math.max(
        b.factors.interestFit.score,
        b.factors.personalityFit.score,
        b.factors.valueFit.score,
      );
      return maxB - b.totalScore - (maxA - a.totalScore);
    })
    .slice(0, count);
}

/**
 * Growth: careers where interest fit is high (≥ 70) but personality
 * has a meaningful gap. These stretch you.
 *
 * v2: gap detection uses personality and adaptability (not collab).
 */
function composeGrowth(scored: ScoredCareer[], count: number): ScoredCareer[] {
  return scored
    .filter((c) => {
      if (c.factors.interestFit.score < 70) return false;

      const hasGap =
        (c.factors.personalityFit.available &&
          c.factors.personalityFit.score < 55) ||
        (c.factors.adaptabilityFit.available &&
          c.factors.adaptabilityFit.score < 40);
      return hasGap;
    })
    .sort((a, b) => {
      const gapA =
        a.factors.interestFit.score -
        Math.min(
          a.factors.personalityFit.score,
          a.factors.adaptabilityFit.score,
        );
      const gapB =
        b.factors.interestFit.score -
        Math.min(
          b.factors.personalityFit.score,
          b.factors.adaptabilityFit.score,
        );
      return gapB - gapA;
    })
    .slice(0, count);
}

// ── Main Engine ──────────────────────────────────────────────

export interface ExploreOptions {
  locale?: string;
  /** Number of careers per composition strategy (default: 3) */
  count?: number;
  /** Career pool filters */
  filters?: CareerFilters;
  /** Custom weight override (default: auto-detected from profile) */
  weights?: WeightConfig;
  /** User target Job Zone band. Careers inside the band score normally;
   *  those outside receive a post-scoring penalty (max -30 for ≥3 tiers off).
   *  Default `{ min: 4, max: 5 }` matches Deep Dive's white-collar audience.
   *  Pass `null` to disable tier-aware ranking entirely (e.g. for thesis
   *  analysis that needs an un-penalized pool). */
  targetTier?: { min: number; max: number } | null;
}

/**
 * Tier penalty: post-scoring modifier that pulls careers outside the user's
 * target Job Zone band toward the bottom of the ranking.
 *
 *   in-band            → 0
 *   1 tier off         → -10
 *   2 tiers off        → -20
 *   ≥3 tiers off       → -30
 *   jobZone unknown    → 0  (don't penalize legacy / unclassified data)
 *   targetTier null    → 0  (caller opted out)
 */
export function computeTierPenalty(
  jobZone: number | null | undefined,
  targetTier: ExploreOptions["targetTier"] | undefined,
): number {
  if (targetTier === null || !targetTier) return 0;
  if (jobZone === null || jobZone === undefined) return 0;
  if (jobZone >= targetTier.min && jobZone <= targetTier.max) return 0;
  const gap =
    jobZone < targetTier.min
      ? targetTier.min - jobZone
      : jobZone - targetTier.max;
  if (gap >= 3) return -30;
  if (gap === 2) return -20;
  return -10;
}

const DEFAULT_TARGET_TIER: NonNullable<ExploreOptions["targetTier"]> = {
  min: 4,
  max: 5,
};

/**
 * Explore careers using the unified multi-factor engine.
 *
 * v2: Industry is always applied as a pre-filter (not a scoring dimension).
 * Seniority is applied as a post-scoring bonus.
 *
 * Async because it ensures the career pool is loaded from DB on cold start.
 */
export async function explore(
  profile: UserProfile,
  options: ExploreOptions = {},
): Promise<ExplorationResult> {
  const { count = 3, filters } = options;
  // `undefined` → use white-collar default; `null` → caller explicitly disabled
  const targetTier =
    options.targetTier === undefined ? DEFAULT_TARGET_TIER : options.targetTier;

  // Auto-detect precision from available data
  const precision = profile.bigFive && profile.schwartz ? "full" : "quick";
  const weights = options.weights ?? WEIGHT_PRESETS[precision];

  // ── L1: Ensure career pool is loaded (prevents cold-start empty pool) ──
  await ensureCareerPoolLoaded();

  // ── Pre-filter: industry (constraint, not preference) ──────
  let pool = getCareerPool();
  const userIndustries =
    filters?.industries ?? profile.industry?.interestedIndustries;
  if (userIndustries?.length && !userIndustries.includes("recommend_for_me")) {
    const filtered = filterByIndustry(pool, userIndustries);
    // Only apply if enough careers remain (avoid empty results)
    if (filtered.length >= 10) pool = filtered;
  }

  // ── Pre-filter: seniority (keep as hard filter too) ────────
  if (filters?.experienceYears !== undefined) {
    const filtered = filterBySeniority(pool, filters.experienceYears);
    if (filtered.length >= 10) pool = filtered;
  }

  // ── Pre-filter: resilience (CRS Level 0 = highly vulnerable → exclude) ──
  pool = pool.filter((c) => c.resilienceLevel !== 0);

  // ── Pre-filter: lifecycle (sunset/retired careers → exclude) ──
  pool = pool.filter(
    (c) =>
      c.deprecationStatus !== "sunset" && c.deprecationStatus !== "retired",
  );

  // ── Score all careers ──────────────────────────────────────
  const allScored: ScoredCareer[] = pool.map((career) => {
    const factors = scoreCareer(profile, career);
    const baseTotal = computeTotal(factors, weights);

    // Seniority bonus: post-scoring modifier (development stage consideration)
    const senBonus = seniorityBonus(career, filters?.experienceYears);

    // CRS penalty: Level 1 (vulnerable) careers get -15 score penalty
    const resiliencePenalty = career.resilienceLevel === 1 ? -15 : 0;

    // AI disruption penalty: 'transformed' careers (high AI replacement risk) get -10
    const aiDisruptionPenalty =
      career.aiEraCategory === "transformed" ? -10 : 0;

    // Tier penalty: careers outside user's target Job Zone band sink to the
    // cross-tier exploration section (default white-collar band 4-5).
    const tierPenalty = computeTierPenalty(career.jobZone, targetTier);

    // Tier metadata for UI segmentation
    const jobZone = career.jobZone ?? null;
    const inTargetTier =
      targetTier !== null && jobZone !== null
        ? jobZone >= targetTier.min && jobZone <= targetTier.max
        : true;
    const tierGap =
      targetTier !== null && jobZone !== null
        ? jobZone < targetTier.min
          ? targetTier.min - jobZone
          : jobZone > targetTier.max
            ? jobZone - targetTier.max
            : 0
        : 0;

    return {
      id: career.id,
      title_zh: career.title_zh,
      title_en: career.title_en,
      totalScore: Math.min(
        100,
        Math.max(
          0,
          baseTotal +
            senBonus +
            resiliencePenalty +
            aiDisruptionPenalty +
            tierPenalty,
        ),
      ),
      factors,
      tags: career.tags,
      aiEraCategory: career.aiEraCategory,
      aiExposureScore: career.aiExposureScore,
      aiImpactLabel: career.aiImpactLabel,
      marketOutlook: career.marketOutlook,
      resilienceLevel: career.resilienceLevel,
      jobZone,
      inTargetTier,
      tierGap,
    };
  });

  // Sort by total score descending (best-fit order)
  allScored.sort((a, b) => b.totalScore - a.totalScore);

  // Compose results through different strategies
  const bestFit = allScored.slice(0, count);
  const drain = [...allScored].reverse().slice(0, count);
  const surprise = composeSurprise(allScored, count);
  const growth = composeGrowth(allScored, count);

  return {
    allScored,
    composed: {
      "best-fit": bestFit,
      surprise,
      growth,
      drain,
    },
    precision,
  };
}

// ── Convenience Functions ────────────────────────────────────

/**
 * Quick Dive convenience: match from raw RIASEC scores.
 * Drop-in replacement for the old matchCareersForDisplay().
 *
 * NOTE: For client-side Quick Dive, use client-engine.ts instead.
 * This function is for server-side use only (e.g., API routes).
 */
export async function exploreFromRiasec(
  sortedScores: [string, number][],
  locale: string,
  options?: { topN?: number; fitN?: number; drainN?: number },
): Promise<{
  topCareers: CareerDisplayItem[];
  fitCareers: CareerDisplayItem[];
  drainCareers: CareerDisplayItem[];
}> {
  const { topN = 3, fitN = 3, drainN = 3 } = options ?? {};
  const isZh = locale === "zh";

  const profile: UserProfile = {
    riasec: toRiasecVector(sortedScores),
  };

  const result = await explore(profile, { count: topN + fitN });

  const toDisplay = (careers: ScoredCareer[]): CareerDisplayItem[] =>
    careers.map((c) => ({
      id: c.id,
      name: isZh ? c.title_zh : c.title_en,
      title_zh: c.title_zh,
      title_en: c.title_en,
      pct: c.totalScore,
    }));

  const bestFit = result.allScored;
  return {
    topCareers: toDisplay(bestFit.slice(0, topN)),
    fitCareers: toDisplay(bestFit.slice(topN, topN + fitN)),
    drainCareers: toDisplay(bestFit.slice(-drainN).reverse()),
  };
}

// Re-export types and utilities
export { toRiasecVector } from "./factors/riasec";
export { cosineSimilarity } from "./factors/riasec";
export type {
  UserProfile,
  ExplorationResult,
  ScoredCareer,
  CareerDisplayItem,
  RiasecVector,
};
