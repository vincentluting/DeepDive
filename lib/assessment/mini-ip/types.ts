// ============================================================
// Mini-IP — Type Definitions
//
// Core types for the O*NET Mini Interest Profiler (Mini-IP):
// a 30-item RIASEC assessment derived from the SF-60.
// ============================================================

export type RiasecKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'
export type RiasecScores = Record<RiasecKey, number>

export interface MiniIpItem {
  index: number        // 1-30 (Mini-IP original number)
  textEn: string       // English original
  textZh: string       // Chinese translation
  riasecScale: RiasecKey
}

export interface MiniIpResult {
  rawScores: RiasecScores     // Raw total per dimension (0-20)
  top2Code: string            // e.g. "IA"
  allRanked: RiasecKey[]      // High to low
  responseArray: number[]     // 30 raw answers (1-5)
}
