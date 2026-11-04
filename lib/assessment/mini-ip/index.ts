// ============================================================
// Mini-IP (O*NET Mini Interest Profiler) — Quick Dive 题库
// ============================================================
// 30-item RIASEC assessment based on O*NET Interest Profiler Short Form.
// This is the ACTIVE item source for Quick Dive Classic.
//
// Consumers:
//   - components/quickdive/quickdive-data.ts      (MINI_IP_ITEMS → question UI)
//   - components/quickdive/use-explore-engine.ts   (MINI_IP_ITEMS → scoring + research data)
//   - components/quickdive/classic-explore-question.tsx (MINI_IP_LIKERT_OPTIONS)
//   - components/quickdive/onet-attribution.tsx    (ONET_ATTRIBUTION — legally required)
//
// Source: O*NET Mini Interest Profiler (public domain, attribution required)
// ============================================================

export { MINI_IP_ITEMS } from './items'
export { scoreMiniIp, getTop2Code } from './scoring'
export {
  ONET_ATTRIBUTION,
  ONET_MODIFICATION_NOTICE,
  MINI_IP_LIKERT_OPTIONS,
  RIASEC_DESCRIPTIONS,
} from './constants'
export type { MiniIpItem, MiniIpResult, RiasecKey, RiasecScores } from './types'
