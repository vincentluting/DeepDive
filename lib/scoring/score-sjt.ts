// ============================================================
// SJT Should-Would Gap Scoring
// ============================================================
// Source: Deep Dive original IP — Dual SJT (Should vs Would)
//
// Algorithm:
//   For each of 6 scenarios:
//   1. Look up wouldScore and shouldScore from the scenario's scoringMap
//   2. gap = shouldScore - wouldScore
//      - Positive: aspiration gap (knows what's ideal but doesn't do it)
//      - Negative: acts more positively than their stated ideal
//      - Zero: behavior matches ideal (consistent)
//   3. For SJT-6 (dual domain): compute gap for both primary and secondary domains
//
// Output:
//   - Per-scenario tension scores
//   - Overall consistency (proportion of scenarios with gap === 0)
//   - Notable tensions (domains with |gap| >= 2)
// ============================================================

import type { SJTTensionScore } from '../types';
import { SJT_SCENARIOS } from '../questionnaire';

export interface SJTAnswer {
  scenarioId: number;
  wouldChoice: string;   // 'A' | 'B' | 'C' | 'D'
  shouldChoice: string;  // 'A' | 'B' | 'C' | 'D'
}

export interface SJTResult {
  /** Per-scenario tension scores */
  scenarios: SJTTensionScore[];
  /** 0-1: proportion of scenarios where should === would */
  overallConsistency: number;
  /** Domain names with significant tension (|gap| >= 2) */
  notableTensions: string[];
}

/** Minimum gap magnitude to count as "notable" tension */
const NOTABLE_GAP_THRESHOLD = 2;

/**
 * Score SJT Should-Would gaps for all 6 scenarios.
 *
 * @param answers - Array of { scenarioId, wouldChoice, shouldChoice }
 * @returns Tension scores, consistency ratio, and notable tensions
 */
export function scoreSJTGaps(answers: SJTAnswer[]): SJTResult {
  const scenarios: SJTTensionScore[] = [];
  let consistentCount = 0;
  const notableTensions: string[] = [];

  for (const answer of answers) {
    const scenario = SJT_SCENARIOS.find(s => s.id === answer.scenarioId);
    if (!scenario) continue;

    // Primary domain scoring
    const wouldScore = scenario.scoringMap[answer.wouldChoice] ?? 0;
    const shouldScore = scenario.scoringMap[answer.shouldChoice] ?? 0;
    const gap = shouldScore - wouldScore;
    const isConsistent = gap === 0;

    if (isConsistent) consistentCount++;

    const tensionScore: SJTTensionScore = {
      scenarioId: answer.scenarioId,
      domain: scenario.mappedDomain,
      wouldScore,
      shouldScore,
      gap,
      isConsistent,
    };

    // SJT-6 has dual domain scoring
    if (scenario.scoringMapSecondary && scenario.mappedDomainSecondary) {
      const wouldScoreSecondary = scenario.scoringMapSecondary[answer.wouldChoice] ?? 0;
      const shouldScoreSecondary = scenario.scoringMapSecondary[answer.shouldChoice] ?? 0;
      const gapSecondary = shouldScoreSecondary - wouldScoreSecondary;

      tensionScore.domainSecondary = scenario.mappedDomainSecondary;

      // For SJT-6, also check secondary domain gap for notable tension
      if (Math.abs(gapSecondary) >= NOTABLE_GAP_THRESHOLD) {
        if (!notableTensions.includes(scenario.mappedDomainSecondary)) {
          notableTensions.push(scenario.mappedDomainSecondary);
        }
      }
    }

    // Check primary domain for notable tension
    if (Math.abs(gap) >= NOTABLE_GAP_THRESHOLD) {
      if (!notableTensions.includes(scenario.mappedDomain)) {
        notableTensions.push(scenario.mappedDomain);
      }
    }

    scenarios.push(tensionScore);
  }

  const overallConsistency = answers.length > 0
    ? consistentCount / answers.length
    : 0;

  return {
    scenarios,
    overallConsistency: round(overallConsistency, 2),
    notableTensions,
  };
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
