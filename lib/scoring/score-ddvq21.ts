// ============================================================
// TwIVI Scoring — Ipsative Centering (Raw − MRAT)
// ============================================================
// Instrument: TwIVI (Sandy, Gosling, Schwartz & Koelkebeck, 2017)
// Algorithm (standard ipsative centering, per Schwartz 1992/2004):
//   1. Raw Score = mean of items belonging to each value type
//   2. MRAT = respondent's overall mean across all 20 items
//   3. Centered Score = Raw Score - MRAT
//   4. Higher-Order = mean of centered scores for constituent values
//
// All 10 values have exactly 2 items each.
//
// NOTE: Export names kept as DDVQ21_* / scoreDDVQ21 for backward
// compatibility across the codebase.
// ============================================================

import type { SchwartzValue } from '../types';

/** The 10 Schwartz Basic Value types */
const VALUE_TYPES: SchwartzValue[] = [
  'self-direction', 'stimulation', 'hedonism', 'achievement', 'power',
  'security', 'conformity', 'tradition', 'benevolence', 'universalism',
];

/** TwIVI item-to-value mapping (item IDs 1-20) */
export const DDVQ21_VALUE_MAP: Record<SchwartzValue, number[]> = {
  'conformity':     [1, 11],
  'tradition':      [2, 12],
  'benevolence':    [3, 13],
  'universalism':   [4, 14],
  'self-direction': [5, 15],
  'stimulation':    [6, 16],
  'hedonism':       [7, 17],
  'achievement':    [8, 18],
  'power':          [9, 19],
  'security':       [10, 20],
};

/** Higher-Order value dimensions (Schwartz circular model) */
export const DDVQ21_HIGHER_ORDER: Record<string, SchwartzValue[]> = {
  'openness-to-change': ['self-direction', 'stimulation'],
  'self-enhancement':   ['achievement', 'power', 'hedonism'],
  'conservation':       ['security', 'conformity', 'tradition'],
  'self-transcendence': ['benevolence', 'universalism'],
};

export type HigherOrderDimension = keyof typeof DDVQ21_HIGHER_ORDER;

export interface DDVQ21Result {
  /** Raw mean per value type (1-6 scale) */
  raw: Record<SchwartzValue, number>;
  /** Centered scores (raw - MRAT): positive = above personal average */
  centered: Record<SchwartzValue, number>;
  /** Higher-Order dimension scores (mean of constituent centered scores) */
  higherOrder: Record<string, number>;
  /** Value types sorted by centered score (highest first) */
  ranking: SchwartzValue[];
  /** Top 3 value types */
  top3: SchwartzValue[];
}

/**
 * Score TwIVI answers using ipsative centering (Raw − MRAT).
 *
 * @param answers - Map of item_id (1-20) → rating (1-6)
 * @returns Raw scores, centered scores, higher-order dimensions, ranking, and top 3 values
 */
export function scoreDDVQ21(
  answers: Record<number, number>,
): DDVQ21Result {
  // Step 1: Compute raw score per value type (mean of assigned items)
  const raw = {} as Record<SchwartzValue, number>;

  for (const valueType of VALUE_TYPES) {
    const itemIds = DDVQ21_VALUE_MAP[valueType];
    const itemScores = itemIds
      .map(id => answers[id])
      .filter(v => v !== undefined);

    raw[valueType] = itemScores.length > 0
      ? round(itemScores.reduce((sum, v) => sum + v, 0) / itemScores.length, 2)
      : 0;
  }

  // Step 2: Compute MRAT (Mean RATing across all 20 items)
  const allScores = Object.values(answers).filter(v => v !== undefined);
  const mrat = allScores.length > 0
    ? allScores.reduce((sum, v) => sum + v, 0) / allScores.length
    : 0;

  // Step 3: Ipsative centering (raw - MRAT)
  const centered = {} as Record<SchwartzValue, number>;
  for (const valueType of VALUE_TYPES) {
    centered[valueType] = round(raw[valueType] - mrat, 2);
  }

  // Step 4: Higher-Order dimension scores (mean of constituent centered scores)
  const higherOrder = {} as Record<string, number>;
  for (const [dimension, values] of Object.entries(DDVQ21_HIGHER_ORDER)) {
    const dimScores = values.map(v => centered[v]);
    higherOrder[dimension] = round(
      dimScores.reduce((sum, s) => sum + s, 0) / dimScores.length,
      2,
    );
  }

  // Step 5: Sort by centered score (descending) → ranking
  const ranking = [...VALUE_TYPES].sort(
    (a, b) => centered[b] - centered[a],
  );

  const top3 = ranking.slice(0, 3);

  return { raw, centered, higherOrder, ranking, top3 };
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
