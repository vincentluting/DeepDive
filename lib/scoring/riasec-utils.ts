// ============================================================
// RIASEC Utility Functions
//
// Shared helpers for normalizing raw RIASEC scores and deriving
// the 12-type Archetype from RIASEC + Schwartz value orientation.
// Used by both Quick Dive and Deep Dive scoring pipelines.
// ============================================================

import type {
  RIASECDimension,
  Archetype,
  ValueOrientation,
  HollandRelation,
} from "@/lib/types";
import { ARCHETYPE_MAP } from "./constants";

// Holland hexagonal adjacency (R↔I↔A↔S↔E↔C↔R)
// Retained for RIASEC analysis in profile/report narratives.
const HOLLAND_ADJACENT: Record<RIASECDimension, RIASECDimension[]> = {
  R: ["I", "C"],
  I: ["R", "A"],
  A: ["I", "S"],
  S: ["A", "E"],
  E: ["S", "C"],
  C: ["E", "R"],
};

/**
 * Normalize raw RIASEC scores to 0-100 scale with configurable max.
 *
 * @param scores  Raw sum scores per RIASEC dimension
 * @param max     Maximum raw score per dimension:
 *                - Classic Mini-IP (0-4 Likert × 5 items) = 20
 *                - Immersive Dive  (1-5 Likert × 5 items) = 25
 */
export function normalizeRiasecScoresWithMax(
  scores: Record<string, number>,
  max: number,
): Record<RIASECDimension, number> {
  return {
    R: Math.round(((scores.R ?? 0) / max) * 100),
    I: Math.round(((scores.I ?? 0) / max) * 100),
    A: Math.round(((scores.A ?? 0) / max) * 100),
    S: Math.round(((scores.S ?? 0) / max) * 100),
    E: Math.round(((scores.E ?? 0) / max) * 100),
    C: Math.round(((scores.C ?? 0) / max) * 100),
  };
}

/**
 * Normalize raw RIASEC scores to 0-100 scale.
 * Convenience wrapper for Classic Mini-IP (O*NET standard: 5 items × 0-4 Likert = max 20).
 */
export function normalizeRiasecScores(
  scores: Record<string, number>,
): Record<RIASECDimension, number> {
  return normalizeRiasecScoresWithMax(scores, 20);
}

/**
 * Derive value orientation from Schwartz higher-order dimension scores.
 * Compares Self-Enhancement (Achievement + Power) vs Self-Transcendence (Benevolence + Universalism).
 *
 * @param enhancementScore  Mean or centered score for Self-Enhancement
 * @param transcendenceScore  Mean or centered score for Self-Transcendence
 */
export function deriveValueOrientation(
  enhancementScore: number,
  transcendenceScore: number,
): {
  orientation: ValueOrientation;
  confidence: number;
  scores: { enhancement: number; transcendence: number };
} {
  const orientation: ValueOrientation =
    enhancementScore > transcendenceScore ? "enhancement" : "transcendence";
  const gap = Math.abs(enhancementScore - transcendenceScore);
  const confidence = Math.min(gap / 2, 1); // normalize: gap of 2+ → full confidence
  return {
    orientation,
    confidence,
    scores: {
      enhancement: enhancementScore,
      transcendence: transcendenceScore,
    },
  };
}

// Holland hexagonal priority for deterministic tie-breaking.
// When two dimensions share the same normalized score, the dimension
// earlier in this canonical order wins.  This avoids instability caused
// by PostgreSQL JSONB reordering object keys (alphabetical) vs the JS
// insertion order used on the frontend.
const RIASEC_TIEBREAK: Record<RIASECDimension, number> = {
  R: 0,
  I: 1,
  A: 2,
  S: 3,
  E: 4,
  C: 5,
};

/**
 * Build 12-type archetype from RIASEC scores + Schwartz value orientation.
 *
 * Two dimensions:
 * 1. RIASEC primary (Top-1 dimension) → what you do
 * 2. ValueOrientation (enhancement/transcendence) → why you do it
 *
 * RIASEC score distribution is retained in derivedFrom for analytics & narratives.
 */
export function buildArchetype(
  riasecNormalized: Record<RIASECDimension, number>,
  valueOrientation: ValueOrientation,
  valueScores?: { enhancement: number; transcendence: number },
): Archetype {
  // 1. Sort RIASEC by score descending, with Holland-order tiebreaker
  //    to guarantee deterministic results regardless of JS object key order
  const sorted = (
    Object.entries(riasecNormalized) as [RIASECDimension, number][]
  ).sort(
    (a, b) => b[1] - a[1] || RIASEC_TIEBREAK[a[0]] - RIASEC_TIEBREAK[b[0]],
  );

  const [p1, s1] = sorted[0];
  const [p2, s2] = sorted[1];
  const [p3, s3] = sorted[2];

  const gap12 = s1 - s2;
  const gap23 = s2 - s3;
  const isAdjacent = HOLLAND_ADJACENT[p1].includes(p2);
  const relation: HollandRelation = isAdjacent ? "adjacent" : "cross";

  // 2. Boundary detection (RIASEC gap12 <= 5 → primary dimension may shift on retest)
  const isBoundary = gap12 <= 5;

  // 3. Confidence (based on RIASEC gap — how clear the primary dimension is)
  const confidence =
    gap12 >= 15 ? 0.85 : gap12 >= 10 ? 0.7 : gap12 >= 5 ? 0.55 : 0.4;
  const confidenceLevel =
    confidence >= 0.75 ? "high" : confidence >= 0.5 ? "medium" : "low";

  // 4. Look up labels
  const code = `${p1}-${valueOrientation}`;
  const mapEntry = ARCHETYPE_MAP[code];

  return {
    primary: p1,
    orientation: valueOrientation,
    code,
    label_zh: mapEntry?.label_zh ?? code,
    label_en: mapEntry?.label_en ?? code,
    tagline_zh: mapEntry?.tagline_zh ?? "",
    tagline_en: mapEntry?.tagline_en ?? "",
    confidence,
    confidenceLevel,
    isBoundary,
    valueScores,
    derivedFrom: {
      primary: { dimension: p1, score: s1 },
      secondary: { dimension: p2, score: s2 },
      tertiary: { dimension: p3, score: s3 },
      gap12,
      gap23,
      relation,
    },
  };
}
