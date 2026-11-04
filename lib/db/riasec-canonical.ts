// ============================================================
// Canonical RIASEC Reader — Single source of truth accessor
//
// Reads the pre-computed RIASEC + Archetype from QuickDiveResult.
// New QD sessions store computedRiasec in resultDataJson (Batch 1).
// Legacy rows fall back to recomputation from raw scores.
//
// ALL downstream consumers (DD page, cascade, scoring pipeline)
// MUST use this module instead of calling normalizeRiasecScores
// or buildArchetype directly.
// ============================================================

import type { RIASECDimension, Archetype, ValueOrientation } from "@/lib/types";
import {
  normalizeRiasecScoresWithMax,
  buildArchetype,
} from "@/lib/scoring/riasec-utils";
import { isImmersiveExploreMode } from "@/lib/quickdive/explore-mode";

/** Shape of the canonical RIASEC data stored in resultDataJson.computedRiasec */
export interface ComputedRiasec {
  riasecNormalized: Record<RIASECDimension, number>;
  archetype: Archetype;
  rawScoreMax: number;
  computedAt: string;
}

/** Return type for getCanonicalRiasec */
export interface CanonicalRiasecData {
  riasecNormalized: Record<RIASECDimension, number>;
  archetype: Archetype;
  /** Whether data came from stored computation (true) or legacy fallback (false) */
  fromStored: boolean;
}

/**
 * Extract canonical RIASEC + Archetype from a QuickDiveResult.
 *
 * Priority:
 * 1. Read `resultDataJson.computedRiasec` (new sessions, computed once at QD frontend)
 * 2. Fallback: recompute from raw scoresJson (legacy data before this migration)
 *
 * @param qd  QuickDiveResult row (must include scoresJson, resultDataJson, exploreMode)
 */
export function getCanonicalRiasec(qd: {
  archetypeCode?: string | null;
  scoresJson: Record<string, number>;
  resultDataJson: Record<string, unknown> | null;
  exploreMode: string;
}): CanonicalRiasecData {
  // 1. Prefer stored computed data (new sessions)
  const computed = (qd.resultDataJson as Record<string, unknown> | null)
    ?.computedRiasec as ComputedRiasec | undefined;
  if (computed?.riasecNormalized && computed?.archetype?.code) {
    return {
      riasecNormalized: computed.riasecNormalized as Record<
        RIASECDimension,
        number
      >,
      archetype: computed.archetype,
      fromStored: true,
    };
  }

  // 2. Legacy fallback: recompute from raw scores
  // Classic Mini-IP: 0-4 Likert × 5 items = max 20
  // Immersive Dive:  1-5 Likert × 5 items = max 25
  const max = isImmersiveExploreMode(qd.exploreMode) ? 25 : 20;
  const maxObservedScore = Math.max(
    0,
    ...Object.values(qd.scoresJson).filter(
      (score): score is number => typeof score === "number",
    ),
  );
  const riasecNormalized =
    maxObservedScore > max
      ? normalizeAlreadyScaledScores(qd.scoresJson)
      : normalizeRiasecScoresWithMax(qd.scoresJson, max);

  // Try to read value orientation from stored computedValues (new sessions)
  const storedValues = (qd.resultDataJson as Record<string, unknown> | null)
    ?.computedValues as
    | {
        orientation?: string;
        scores?: { enhancement: number; transcendence: number };
      }
    | undefined;
  const orientation: ValueOrientation =
    storedValues?.orientation === "enhancement" ||
    storedValues?.orientation === "transcendence"
      ? storedValues.orientation
      : (parseOrientation(qd.archetypeCode) ?? "enhancement"); // pre-archetype legacy data defaults to enhancement
  const archetype = buildArchetype(
    riasecNormalized,
    orientation,
    storedValues?.scores,
  );

  return {
    riasecNormalized,
    archetype,
    fromStored: false,
  };
}

function normalizeAlreadyScaledScores(
  scores: Record<string, number>,
): Record<RIASECDimension, number> {
  return {
    R: clampScore(scores.R),
    I: clampScore(scores.I),
    A: clampScore(scores.A),
    S: clampScore(scores.S),
    E: clampScore(scores.E),
    C: clampScore(scores.C),
  };
}

function clampScore(score: number | undefined): number {
  if (typeof score !== "number" || !Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function parseOrientation(
  archetypeCode: string | null | undefined,
): ValueOrientation | null {
  const rawOrientation = archetypeCode?.split("-")[1];
  if (rawOrientation === "enhancement" || rawOrientation === "transcendence") {
    return rawOrientation;
  }
  return null;
}
