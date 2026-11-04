// ============================================================
// Mini-IP — Scoring Algorithm
//
// Input:  30 responses (values 0-4, per O*NET Mini-IP official scoring)
// Output: MiniIpResult with raw dimension scores (0-20), ranked
//         RIASEC keys, and Top-2 Holland code.
//
// Each dimension has 5 items × max 4 → range 0-20 per dimension.
// Tie-breaking for equal scores follows RIASEC order (R>I>A>S>E>C).
// ============================================================

import { MINI_IP_ITEMS } from './items'
import type { MiniIpItem, MiniIpResult, RiasecKey, RiasecScores } from './types'

const RIASEC_ORDER: RiasecKey[] = ['R', 'I', 'A', 'S', 'E', 'C']

export function getTop2Code(scores: RiasecScores): string {
  const ranked = (Object.entries(scores) as [RiasecKey, number][])
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      // Tie-break by canonical RIASEC order
      return RIASEC_ORDER.indexOf(a[0]) - RIASEC_ORDER.indexOf(b[0])
    })
    .map(([key]) => key)
  return ranked[0] + ranked[1]
}

export function scoreMiniIp(responses: number[]): MiniIpResult {
  const rawScores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }

  MINI_IP_ITEMS.forEach((item: MiniIpItem, idx: number) => {
    rawScores[item.riasecScale] += responses[idx]  // Already 0-4 per O*NET standard
  })

  const allRanked = (Object.entries(rawScores) as [RiasecKey, number][])
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return RIASEC_ORDER.indexOf(a[0]) - RIASEC_ORDER.indexOf(b[0])
    })
    .map(([key]) => key)

  const top2Code = allRanked[0] + allRanked[1]

  return { rawScores, top2Code, allRanked, responseArray: responses }
}
