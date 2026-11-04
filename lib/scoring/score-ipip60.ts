// ============================================================
// IPIP-60 Scoring — Standard-Level Big Five
// ============================================================
// 2 items per facet × 30 facets = 60 items.
// Uses the same reverse-scoring logic as IPIP-30 and IPIP-NEO-120.
//
// Algorithm:
//   1. Reverse-score items using IPIP_REVERSE_CONSTANT (6 - raw)
//   2. Facet Score = mean(itemA_score, itemB_score) on 1-5 scale
//   3. Domain Score = mean of 6 facet scores
//   4. Normalized Domain Score = (domainMean - 1) / 4 * 100 → 0-100
//
// Output is marked precision: 'standard' to distinguish from
// 'screening' (IPIP-30) and 'full' (IPIP-NEO-120).
// ============================================================

import type { BigFiveDimension } from "../types";
import {
  IPIP_60_ITEMS,
  IPIP_60_FACET_ITEM_MAP,
  DOMAIN_FACETS,
} from "../questionnaire/module-c-ipip-neo60";
import { IPIP_REVERSE_CONSTANT } from "./constants";

// ============================================================
// Reversed item set (built from IPIP-60 items only)
// ============================================================

const REVERSED_SET = new Set(
  IPIP_60_ITEMS.filter((item) => item.isReversed).map((item) => item.id),
);

// ============================================================
// Result Type
// ============================================================

export interface IPIP60Result {
  /** 5 domain means on 1-5 scale (mean of 6 two-item facet scores) */
  domains: Record<BigFiveDimension, number>;
  /** 30 facet scores on 1-5 scale (mean of 2 items per facet) */
  facets: Record<string, number>;
  /** 5 domain scores normalized to 0-100 for UI display */
  domainsNormalized: Record<BigFiveDimension, number>;
  /** Always 'standard' — two-item facet measurement, improved reliability */
  precision: "standard";
}

// ============================================================
// Scoring Function
// ============================================================

/**
 * Score IPIP-60 answers (standard-level Big Five).
 *
 * @param answers - Map of item_id → rating (1-5), exactly 60 items expected
 * @returns Big Five 5 domains + 30 two-item facet scores + normalized scores
 */
export function scoreIPIP60(answers: Record<number, number>): IPIP60Result {
  // Step 1: Apply reverse scoring
  const scored: Record<number, number> = {};
  for (const [idStr, raw] of Object.entries(answers)) {
    const id = Number(idStr);
    scored[id] = REVERSED_SET.has(id) ? IPIP_REVERSE_CONSTANT - raw : raw;
  }

  // Step 2: Compute facet scores (mean of 2 items per facet)
  const facets: Record<string, number> = {};
  for (const [facetName, itemIds] of Object.entries(IPIP_60_FACET_ITEM_MAP)) {
    const itemScores = itemIds
      .map((id) => scored[id])
      .filter((v) => v !== undefined && v !== 0);

    facets[facetName] =
      itemScores.length > 0
        ? round(
            itemScores.reduce((sum, v) => sum + v, 0) / itemScores.length,
            2,
          )
        : 0;
  }

  // Step 3: Compute domain scores (mean of 6 facet scores per domain)
  const domainNames: BigFiveDimension[] = [
    "neuroticism",
    "extraversion",
    "openness",
    "agreeableness",
    "conscientiousness",
  ];

  const domains = {} as Record<BigFiveDimension, number>;
  const domainsNormalized = {} as Record<BigFiveDimension, number>;

  for (const domain of domainNames) {
    const facetNames = DOMAIN_FACETS[domain];
    const facetScores = facetNames
      .map((name) => facets[name])
      .filter((v) => v !== undefined && v !== 0);

    const domainMean =
      facetScores.length > 0
        ? facetScores.reduce((sum, v) => sum + v, 0) / facetScores.length
        : 0;

    domains[domain] = round(domainMean, 2);
    domainsNormalized[domain] = round(
      Math.max(0, Math.min(100, ((domainMean - 1) / 4) * 100)),
      1,
    );
  }

  return { domains, facets, domainsNormalized, precision: "standard" };
}

// ============================================================
// Utility
// ============================================================

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
