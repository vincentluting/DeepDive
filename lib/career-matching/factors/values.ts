// ============================================================
// Factor: Schwartz Values Alignment (v2)
//
// v1: Top-3 overlap counting → only 4 possible scores (20/50/75/100).
//     Coarse and wastes the rich ipsative centered data.
//
// v2: Uses centered scores for continuous scoring.
//     For each career aligned value, looks up the user's centered
//     score for that value. Higher centered = more important to user.
//     Adds circumplex adjacency bonus for near-miss values.
//
// Score range: 0-100
// Available: After Deep Dive (PVQ-21 items)
// ============================================================

import type { SchwartzInput, FactorScore } from '../types'
import { getGroupValues } from '@/lib/content/soc-group-annotations'

/**
 * Schwartz circumplex adjacency map.
 * Adjacent values on the circumplex share motivational overlap,
 * so near-misses deserve partial credit.
 *
 * Order: power → achievement → hedonism → stimulation → self-direction
 *        → universalism → benevolence → conformity → tradition → security
 */
const SCHWARTZ_ADJACENT: Record<string, string[]> = {
  'power':          ['achievement', 'security'],
  'achievement':    ['power', 'hedonism'],
  'hedonism':       ['achievement', 'stimulation'],
  'stimulation':    ['hedonism', 'self-direction'],
  'self-direction': ['stimulation', 'universalism'],
  'universalism':   ['self-direction', 'benevolence'],
  'benevolence':    ['universalism', 'conformity'],
  'conformity':     ['benevolence', 'tradition'],
  'tradition':      ['conformity', 'security'],
  'security':       ['tradition', 'power'],
}

/**
 * Career annotations use 6 custom value labels that don't all match
 * Schwartz's 10 value types directly. This mapping bridges the gap.
 *
 * Only non-identity mappings listed — if a term is already a Schwartz
 * type (security, achievement), it passes through unchanged.
 */
const CAREER_TO_SCHWARTZ: Record<string, string> = {
  'growth':   'self-direction',  // personal development → autonomy/learning
  'meaning':  'universalism',    // broader purpose → social impact/understanding
  'creation': 'stimulation',     // creativity/novelty → exciting/varied work
  'freedom':  'self-direction',  // independence → autonomy
}

/** Resolve a career value label to its Schwartz equivalent */
function toSchwartz(careerValue: string): string {
  return CAREER_TO_SCHWARTZ[careerValue] ?? careerValue
}

/**
 * Calculate value alignment fit using centered scores.
 *
 * For each career aligned value:
 *   1. Map career value label → Schwartz type
 *   2. Look up user's centered score for that Schwartz type
 *   3. Adjacency bonus: if no strong direct score, check adjacent values
 *
 * Final score = average of per-value scores, with floor at 15.
 */
export function scoreValues(
  schwartz: SchwartzInput | undefined,
  alignedValues: string[],
  careerId: string,
): FactorScore {
  if (!schwartz) {
    return { score: 50, available: false }
  }

  // Use SOC group fallback if career lacks individual annotation
  const hasOwn = alignedValues.length > 0
  const effective = hasOwn
    ? alignedValues
    : (getGroupValues(careerId) ?? [])

  if (effective.length === 0) {
    return { score: 50, available: true, fallback: true }
  }

  // Score each career-aligned value against user's centered profile
  let totalFit = 0
  for (const rawValue of effective) {
    const value = toSchwartz(rawValue)
    const centered = schwartz.centered[value] ?? 0

    // Map centered score (-2..+2 typical range) to 0-100
    // -2 → 10, 0 → 50, +2 → 90
    const directScore = Math.min(100, Math.max(0, centered * 20 + 50))

    // Adjacency bonus: if direct score is low, check neighbors
    let adjacencyBonus = 0
    if (directScore < 50) {
      const neighbors = SCHWARTZ_ADJACENT[value] ?? []
      for (const neighbor of neighbors) {
        const neighborCentered = schwartz.centered[neighbor] ?? 0
        if (neighborCentered > 0) {
          // Partial credit: 30% of neighbor's positive score
          adjacencyBonus = Math.max(adjacencyBonus, neighborCentered * 6)
        }
      }
    }

    totalFit += Math.min(100, directScore + adjacencyBonus)
  }

  const score = Math.max(15, Math.round(totalFit / effective.length))

  return {
    score,
    available: true,
    fallback: !hasOwn,
  }
}
