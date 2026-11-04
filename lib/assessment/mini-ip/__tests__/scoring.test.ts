// ============================================================
// Tests for Mini-IP Scoring Algorithm
// ============================================================

import { describe, it, expect } from 'vitest'
import { scoreMiniIp } from '../scoring'
import { MINI_IP_ITEMS } from '../items'

// ============================================================
// Helpers
// ============================================================

/** Build a 30-item response array. fillValue is the default for all items,
 *  overrides is a map of 0-based index → value. */
function buildResponses(fillValue: 0 | 1 | 2 | 3 | 4, overrides: Record<number, 0 | 1 | 2 | 3 | 4> = {}): number[] {
  return MINI_IP_ITEMS.map((_, i) => overrides[i] ?? fillValue)
}

/** Return all 0-based indices where the item belongs to the given RIASEC scale. */
function indicesFor(scale: 'R' | 'I' | 'A' | 'S' | 'E' | 'C'): number[] {
  return MINI_IP_ITEMS.reduce<number[]>((acc, item, i) => {
    if (item.riasecScale === scale) acc.push(i)
    return acc
  }, [])
}

/** Build overrides that set every item of `scale` to `value`. */
function setScale(
  scale: 'R' | 'I' | 'A' | 'S' | 'E' | 'C',
  value: 0 | 1 | 2 | 3 | 4,
  base: Record<number, 0 | 1 | 2 | 3 | 4> = {}
): Record<number, 0 | 1 | 2 | 3 | 4> {
  const out = { ...base }
  for (const i of indicesFor(scale)) out[i] = value
  return out
}

// ============================================================
// Tests
// ============================================================

describe('scoreMiniIp', () => {
  describe('all-max (4) responses', () => {
    it('should correctly calculate RIASEC scores for all-4 responses', () => {
      const responses = buildResponses(4)
      const result = scoreMiniIp(responses)

      // Each dimension has 5 items; 5 items × 4 = 20
      expect(result.rawScores.R).toBe(20)
      expect(result.rawScores.I).toBe(20)
      expect(result.rawScores.A).toBe(20)
      expect(result.rawScores.S).toBe(20)
      expect(result.rawScores.E).toBe(20)
      expect(result.rawScores.C).toBe(20)
    })
  })

  describe('all-min (0) responses', () => {
    it('should correctly calculate RIASEC scores for all-0 responses', () => {
      const responses = buildResponses(0)
      const result = scoreMiniIp(responses)

      // Each dimension: 5 items × 0 = 0
      expect(result.rawScores.R).toBe(0)
      expect(result.rawScores.I).toBe(0)
      expect(result.rawScores.A).toBe(0)
      expect(result.rawScores.S).toBe(0)
      expect(result.rawScores.E).toBe(0)
      expect(result.rawScores.C).toBe(0)
    })
  })

  describe('top-2 code identification', () => {
    it('should correctly identify top-2 code', () => {
      // R all-4 (score 20), I all-3 (score 15), rest all-0 (score 0)
      const overrides = setScale('R', 4)
      const overridesWithI = setScale('I', 3, overrides)
      const responses = buildResponses(0, overridesWithI)

      const result = scoreMiniIp(responses)
      expect(result.rawScores.R).toBe(20)
      expect(result.rawScores.I).toBe(15)
      expect(result.top2Code).toBe('RI')
    })

    it('should handle tied scores by RIASEC order', () => {
      // R and I both at score 15, rest at 0
      const overrides = setScale('R', 3)
      const overridesWithI = setScale('I', 3, overrides)
      const responses = buildResponses(0, overridesWithI)

      const result = scoreMiniIp(responses)
      expect(result.rawScores.R).toBe(15)
      expect(result.rawScores.I).toBe(15)
      // Tie-break by RIASEC canonical order → R before I
      expect(result.top2Code).toBe('RI')
    })
  })

  describe('allRanked order', () => {
    it('should return correct allRanked order', () => {
      // Target: R:20, A:16, I:12, E:8, S:4, C:0
      //
      // R items (all 5 of them) → value 4 → total 20
      // A items: 4 items → value 4, 1 item → value 0 → total 16
      // I items: 3 items → value 4, 2 items → value 0 → total 12
      // E items: 2 items → value 4, 3 items → value 0 → total 8
      // S items: 1 item  → value 4, 4 items → value 0 → total 4
      // C items: all → value 0 → total 0
      //
      // 0-based indices by scale (interleaved R-I-A-S-E-C × 5 blocks):
      //   R: 0, 6, 12, 18, 24
      //   I: 1, 7, 13, 19, 25
      //   A: 2, 8, 14, 20, 26
      //   S: 3, 9, 15, 21, 27
      //   E: 4, 10, 16, 22, 28
      //   C: 5, 11, 17, 23, 29
      const responses: (0 | 1 | 2 | 3 | 4)[] = [
        4, 4, 4, 4, 4, 0,   // block 1: R=4, I=4, A=4, S=4, E=4, C=0
        4, 4, 4, 0, 4, 0,   // block 2: R=4, I=4, A=4, S=0, E=4, C=0
        4, 4, 4, 0, 0, 0,   // block 3: R=4, I=4, A=4, S=0, E=0, C=0
        4, 0, 4, 0, 0, 0,   // block 4: R=4, I=0, A=4, S=0, E=0, C=0
        4, 0, 0, 0, 0, 0,   // block 5: R=4, I=0, A=0, S=0, E=0, C=0
      ]
      expect(responses).toHaveLength(30)

      const result = scoreMiniIp(responses)
      expect(result.rawScores.R).toBe(20)
      expect(result.rawScores.A).toBe(16)
      expect(result.rawScores.I).toBe(12)
      expect(result.rawScores.E).toBe(8)
      expect(result.rawScores.S).toBe(4)
      expect(result.rawScores.C).toBe(0)
      expect(result.allRanked).toEqual(['R', 'A', 'I', 'E', 'S', 'C'])
    })
  })

  describe('responseArray preservation', () => {
    it('should preserve original responseArray', () => {
      // Use a distinctive pattern so we can verify it's passed through unchanged
      const responses = buildResponses(2, { 0: 0, 5: 1, 10: 3, 15: 4, 29: 1 })
      const result = scoreMiniIp(responses)
      expect(result.responseArray).toEqual(responses)
    })
  })
})

describe('MINI_IP_ITEMS', () => {
  it('should have exactly 30 items covering all 6 RIASEC scales', () => {
    expect(MINI_IP_ITEMS).toHaveLength(30)

    const counts: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
    for (const item of MINI_IP_ITEMS) {
      counts[item.riasecScale]++
    }

    expect(counts.R).toBe(5)
    expect(counts.I).toBe(5)
    expect(counts.A).toBe(5)
    expect(counts.S).toBe(5)
    expect(counts.E).toBe(5)
    expect(counts.C).toBe(5)
  })

  it('should have items in R-I-A-S-E-C interleaved order', () => {
    const expectedCycle = ['R', 'I', 'A', 'S', 'E', 'C'] as const

    // Verify first two blocks (items 0–11)
    for (let i = 0; i < 12; i++) {
      const expectedScale = expectedCycle[i % 6]
      expect(MINI_IP_ITEMS[i].riasecScale).toBe(expectedScale)
    }
  })
})
