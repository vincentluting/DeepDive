// ============================================================
// Schwartz Circumplex Conflict Detection
//
// Detects opposing high-scoring values on the Schwartz circular model.
// Two axes define theoretical opposition:
//   Self-Enhancement ↔ Self-Transcendence
//   Openness to Change ↔ Conservation
//
// A conflict is flagged when both sides of an opposing pair score
// above the respondent's personal mean (positive centered scores).
// ============================================================

import type { SchwartzValue } from '../types/dimensions';
import type { SchwartzConflictPair } from '../types/dimensions';
import { SCHWARTZ_CONFLICT_PAIR_VALUES } from './schwartz-conflicts';

/** Minimum centered score (above personal mean) for a value to count as "high". */
const HIGH_THRESHOLD = 0.3;

/** Minimum sum of both centered scores to qualify as a real conflict. */
const MIN_CONFLICT_STRENGTH = 0.8;

/**
 * Opposing value pairs from the Schwartz circumplex.
 * Each pair crosses one of the two theoretical axes.
 */
const OPPOSING_PAIRS: Array<{
  pair: SchwartzConflictPair;
  v1: SchwartzValue;
  v2: SchwartzValue;
}> = (Object.entries(SCHWARTZ_CONFLICT_PAIR_VALUES) as Array<
  [SchwartzConflictPair, readonly [SchwartzValue, SchwartzValue]]
>).map(([pair, [v1, v2]]) => ({ pair, v1, v2 }));

/**
 * Detect the strongest value conflict from Schwartz centered scores.
 *
 * Returns the pair where both opposing values are above the respondent's
 * personal mean, with the highest combined strength. Returns null if no
 * conflict exceeds thresholds.
 */
export function detectSchwartzConflict(
  centered: Record<SchwartzValue, number>,
): SchwartzConflictPair | null {
  let best: SchwartzConflictPair | null = null;
  let bestStrength = 0;

  for (const { pair, v1, v2 } of OPPOSING_PAIRS) {
    const s1 = centered[v1] ?? 0;
    const s2 = centered[v2] ?? 0;

    // Both must be above personal mean
    if (s1 <= HIGH_THRESHOLD || s2 <= HIGH_THRESHOLD) continue;

    const strength = s1 + s2;
    if (strength >= MIN_CONFLICT_STRENGTH && strength > bestStrength) {
      bestStrength = strength;
      best = pair;
    }
  }

  return best;
}
