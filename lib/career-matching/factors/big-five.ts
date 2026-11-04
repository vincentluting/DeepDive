// ============================================================
// Factor: Big Five Personality Fit
//
// Range matching: checks whether user's Big Five domain scores
// fall within the career's ideal ranges. Penalizes distance
// from the ideal range proportionally.
//
// Score range: 0-100
// Available: After Deep Dive (IPIP-NEO items)
// ============================================================

import type { BigFiveVector, FactorScore } from '../types'
import { getGroupBigFive } from '@/lib/content/soc-group-annotations'

type BigFiveDimension = keyof BigFiveVector
type BigFiveRange = Partial<Record<BigFiveDimension, { min: number; max: number }>>

/**
 * Calculate personality fit using Big Five range matching.
 *
 * For each dimension where the career has an ideal range:
 * - Within range → 100 points
 * - Outside range → 100 - (distance × 2), minimum 0
 *
 * Returns average across all annotated dimensions.
 */
export function scoreBigFive(
  userBigFive: BigFiveVector | undefined,
  idealBigFive: BigFiveRange,
  careerId: string,
): FactorScore {
  if (!userBigFive) {
    return { score: 50, available: false }
  }

  // Use SOC group fallback if career lacks individual annotation
  const hasOwn = Object.keys(idealBigFive).length > 0
  const effective = hasOwn
    ? idealBigFive
    : (getGroupBigFive(careerId) ?? {}) as BigFiveRange

  const dimensions = Object.keys(effective) as BigFiveDimension[]
  if (dimensions.length === 0) {
    return { score: 60, available: true, fallback: true }
  }

  let totalFit = 0
  for (const dim of dimensions) {
    const range = effective[dim]
    if (!range) continue
    const userScore = userBigFive[dim]
    if (userScore >= range.min && userScore <= range.max) {
      totalFit += 100
    } else {
      const distance = userScore < range.min
        ? range.min - userScore
        : userScore - range.max
      totalFit += Math.max(0, 100 - distance * 2)
    }
  }

  return {
    score: Math.round(totalFit / dimensions.length),
    available: true,
    fallback: !hasOwn,
  }
}
