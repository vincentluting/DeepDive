// ============================================================
// Client-safe Career Matching Engine for Quick Dive
//
// RIASEC-only cosine similarity matching against static pool.
// Runs entirely in the browser — no DB, no server calls.
//
// For full multi-factor matching (Deep Dive), use engine.ts.
// ============================================================

import type { AiEraCategory } from "@/lib/types/report";
import { getCareerPoolClient } from "./client-pool";
import { getCareerTagline } from "@/lib/content/career-taglines";

interface RiasecVector {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

const RIASEC_KEYS: (keyof RiasecVector)[] = ["R", "I", "A", "S", "E", "C"];

function cosineSimilarity(a: RiasecVector, b: RiasecVector): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (const k of RIASEC_KEYS) {
    dot += a[k] * b[k];
    normA += a[k] * a[k];
    normB += b[k] * b[k];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function toRiasecVector(sortedScores: [string, number][]): RiasecVector {
  const v: RiasecVector = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const [key, value] of sortedScores) {
    if (key in v) v[key as keyof RiasecVector] = value;
  }
  return v;
}

export interface CareerDisplayItem {
  id: string;
  name: string;
  title_zh: string;
  title_en: string;
  pct: number;
  aiEraCategory?: AiEraCategory;
  aiExposureScore?: number | null;
  aiImpactLabel?: "low" | "medium" | "high" | null;
  resilienceLevel?: number;
  /** One-line description of what this career does (localized) */
  tagline?: string;
  /** Top 1-2 RIASEC dimensions driving the match (for top/fit careers) */
  matchDimensions?: (keyof RiasecVector)[];
  /** The RIASEC dimension that creates a hidden strain (for drain careers) */
  drainDimension?: keyof RiasecVector;
}

/**
 * Find "hidden reef" careers: high overall match but with a specific
 * RIASEC dimension gap where the career demands more than the user has.
 *
 * Algorithm:
 * 1. Take the top CANDIDATE_POOL careers by cosine similarity
 * 2. For each, find the dimension where career needs it most relative
 *    to user — specifically where career's proportional demand exceeds
 *    the user's proportional strength
 * 3. Score the "reef" by the magnitude of that gap
 * 4. Return the top drainN careers with the largest reef gaps
 *    (excluding careers already in topCareers / fitCareers)
 */
function findHiddenReefCareers(
  scored: {
    career: {
      id: string;
      title_zh: string;
      title_en: string;
      idealRIASEC: RiasecVector;
      aiEraCategory?: AiEraCategory;
      aiExposureScore?: number | null;
      aiImpactLabel?: "low" | "medium" | "high" | null;
      resilienceLevel?: number;
    };
    score: number;
  }[],
  userVec: RiasecVector,
  excludeIds: Set<string>,
  drainN: number,
): {
  career: (typeof scored)[0]["career"];
  score: number;
  reefDim: keyof RiasecVector;
  reefGap: number;
}[] {
  // Candidate pool: top careers with decent match (score >= 50), skip excluded
  const CANDIDATE_POOL = 30;
  const MIN_MATCH_SCORE = 50;
  const candidates = scored
    .slice(0, CANDIDATE_POOL)
    .filter((c) => c.score >= MIN_MATCH_SCORE && !excludeIds.has(c.career.id));

  // Normalize a vector to proportional weights (each dim as fraction of total)
  const userTotal = RIASEC_KEYS.reduce((sum, k) => sum + userVec[k], 0);
  const userProp: RiasecVector = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  if (userTotal > 0) {
    for (const k of RIASEC_KEYS) userProp[k] = userVec[k] / userTotal;
  }

  const reefScored = candidates.map((c) => {
    const careerVec = c.career.idealRIASEC;
    const careerTotal = RIASEC_KEYS.reduce((sum, k) => sum + careerVec[k], 0);
    const careerProp: RiasecVector = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    if (careerTotal > 0) {
      for (const k of RIASEC_KEYS) careerProp[k] = careerVec[k] / careerTotal;
    }

    // Find the dimension with the largest proportional gap
    // (career demands it proportionally more than user has)
    let maxGap = 0;
    let maxDim: keyof RiasecVector = "R";
    for (const k of RIASEC_KEYS) {
      const gap = careerProp[k] - userProp[k];
      if (gap > maxGap) {
        maxGap = gap;
        maxDim = k;
      }
    }

    return { ...c, reefDim: maxDim, reefGap: maxGap };
  });

  // Filter: only include careers with a meaningful gap
  const MIN_REEF_GAP = 0.05; // 5% proportional difference
  const meaningful = reefScored.filter((c) => c.reefGap >= MIN_REEF_GAP);

  // Sort by reef gap descending (biggest hidden strain first)
  meaningful.sort((a, b) => b.reefGap - a.reefGap);

  // Deduplicate by reef dimension — show diverse drain sources
  const seen = new Set<keyof RiasecVector>();
  const result: typeof meaningful = [];
  for (const c of meaningful) {
    if (result.length >= drainN) break;
    // Allow max 2 careers with the same reef dimension
    const dimCount = result.filter((r) => r.reefDim === c.reefDim).length;
    if (dimCount < 2) {
      result.push(c);
      seen.add(c.reefDim);
    }
  }

  return result;
}

/**
 * Client-side career matching for Quick Dive.
 * Pure RIASEC cosine similarity, no DB calls.
 */
export function matchCareersClient(
  sortedScores: [string, number][],
  locale: string,
  options?: { topN?: number; fitN?: number; drainN?: number },
): {
  topCareers: CareerDisplayItem[];
  fitCareers: CareerDisplayItem[];
  aiEraCareers: CareerDisplayItem[];
  drainCareers: CareerDisplayItem[];
  aiEraTopPick?: CareerDisplayItem;
} {
  const { topN = 3, fitN = 3, drainN = 3 } = options ?? {};
  const isZh = locale === "zh";
  const userVec = toRiasecVector(sortedScores);

  // Pre-filter: exclude CRS Level 0 (highly vulnerable) careers
  const pool = getCareerPoolClient().filter((c) => c.resilienceLevel !== 0);

  // Score all careers (with CRS resilience adjustment)
  // rl:3 gets a small tiebreaker bonus so modern/resilient careers
  // rank above fragile ones when cosine scores are nearly identical
  // (common with undifferentiated/flat RIASEC profiles).
  const scored = pool.map((career) => {
    const base = Math.round(
      cosineSimilarity(userVec, career.idealRIASEC) * 100,
    );
    const resilienceAdj =
      career.resilienceLevel === 1 ? -15 : career.resilienceLevel === 3 ? 2 : 0;
    return {
      career,
      score: Math.min(100, Math.max(0, base + resilienceAdj)),
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Find the top 1-2 RIASEC dimensions that drive the match:
  // dimensions where BOTH the user AND the career score above their own means
  const userMean = RIASEC_KEYS.reduce((s, k) => s + userVec[k], 0) / 6;
  const findMatchDims = (careerVec: RiasecVector): (keyof RiasecVector)[] => {
    const careerMean = RIASEC_KEYS.reduce((s, k) => s + careerVec[k], 0) / 6;
    const shared = RIASEC_KEYS.filter(
      (k) => userVec[k] > userMean && careerVec[k] > careerMean,
    )
      .map((k) => ({ k, strength: userVec[k] + careerVec[k] }))
      .sort((a, b) => b.strength - a.strength);
    return shared.slice(0, 2).map((s) => s.k);
  };

  const toDisplay = (items: typeof scored): CareerDisplayItem[] =>
    items.map((c) => ({
      id: c.career.id,
      name: isZh ? c.career.title_zh : c.career.title_en,
      title_zh: c.career.title_zh,
      title_en: c.career.title_en,
      pct: c.score,
      aiEraCategory: c.career.aiEraCategory,
      aiExposureScore: c.career.aiExposureScore,
      aiImpactLabel: c.career.aiImpactLabel,
      resilienceLevel: c.career.resilienceLevel,
      tagline: getCareerTagline(c.career.id, isZh ? "zh" : "en"),
      matchDimensions: findMatchDims(c.career.idealRIASEC),
    }));

  const topCareers = toDisplay(scored.slice(0, topN));
  const fitCareers = toDisplay(scored.slice(topN, topN + fitN));

  // Hidden reef drain: from high-match careers, find those with
  // a specific RIASEC dimension the career demands but the user lacks
  const excludeIds = new Set([
    ...topCareers.map((c) => c.id),
    ...fitCareers.map((c) => c.id),
  ]);
  const reefCareers = findHiddenReefCareers(
    scored,
    userVec,
    excludeIds,
    drainN,
  );
  const drainCareers: CareerDisplayItem[] = reefCareers.map((c) => ({
    id: c.career.id,
    name: isZh ? c.career.title_zh : c.career.title_en,
    title_zh: c.career.title_zh,
    title_en: c.career.title_en,
    pct: c.score,
    aiEraCategory: c.career.aiEraCategory,
    aiExposureScore: c.career.aiExposureScore,
    aiImpactLabel: c.career.aiImpactLabel,
    resilienceLevel: c.career.resilienceLevel,
    tagline: getCareerTagline(c.career.id, isZh ? "zh" : "en"),
    drainDimension: c.reefDim,
  }));

  // AI-era standout careers: high-match careers flagged as AI-augmented or AI-resilient
  const aiEraCareers = topCareers
    .concat(fitCareers)
    .filter(
      (c) =>
        c.aiEraCategory === "ai-native" || c.aiEraCategory === "transformed",
    )
    .slice(0, 3);

  // Best single AI-era career: scan full pool for the highest-match
  // ai-native or transformed career not already in top/fit/drain
  const allExcludeIds = new Set([
    ...topCareers.map((c) => c.id),
    ...fitCareers.map((c) => c.id),
    ...drainCareers.map((c) => c.id),
  ]);
  const bestAiEra = scored.find(
    (c) =>
      (c.career.aiEraCategory === "ai-native" ||
        c.career.aiEraCategory === "transformed") &&
      !allExcludeIds.has(c.career.id),
  );
  const aiEraTopPick: CareerDisplayItem | undefined = bestAiEra
    ? {
        id: bestAiEra.career.id,
        name: isZh ? bestAiEra.career.title_zh : bestAiEra.career.title_en,
        title_zh: bestAiEra.career.title_zh,
        title_en: bestAiEra.career.title_en,
        pct: bestAiEra.score,
        aiEraCategory: bestAiEra.career.aiEraCategory,
        aiExposureScore: bestAiEra.career.aiExposureScore,
        aiImpactLabel: bestAiEra.career.aiImpactLabel,
        resilienceLevel: bestAiEra.career.resilienceLevel,
        tagline: getCareerTagline(bestAiEra.career.id, isZh ? "zh" : "en"),
        matchDimensions: findMatchDims(bestAiEra.career.idealRIASEC),
      }
    : undefined;

  return { topCareers, fitCareers, aiEraCareers, drainCareers, aiEraTopPick };
}
