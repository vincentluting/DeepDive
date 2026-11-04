// ============================================================
// Factor: RIASEC Interest Fit
//
// Cosine similarity between user's RIASEC vector and career's
// ideal RIASEC vector. The foundational factor — always available.
//
// Score range: 0-100 (cosine similarity × 100)
// ============================================================

import type { RiasecVector, FactorScore } from '../types'

const RIASEC_KEYS: (keyof RiasecVector)[] = ['R', 'I', 'A', 'S', 'E', 'C']

/**
 * Cosine similarity between two RIASEC vectors.
 * Returns value in [0, 1] — higher = more similar.
 */
export function cosineSimilarity(a: RiasecVector, b: RiasecVector): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (const key of RIASEC_KEYS) {
    dotProduct += a[key] * b[key]
    normA += a[key] * a[key]
    normB += b[key] * b[key]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0
  return dotProduct / denominator
}

/**
 * Convert various RIASEC input formats to a normalized vector.
 */
export function toRiasecVector(
  input: [string, number][] | Record<string, number>
): RiasecVector {
  const vector: RiasecVector = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }

  if (Array.isArray(input)) {
    for (const [key, value] of input) {
      if (key in vector) {
        vector[key as keyof RiasecVector] = value
      }
    }
  } else {
    for (const key of RIASEC_KEYS) {
      vector[key] = input[key] ?? 0
    }
  }

  return vector
}

/**
 * Calculate RIASEC interest fit.
 * Always available — this is the minimum input for any matching.
 */
export function scoreRiasec(
  userRiasec: RiasecVector,
  idealRiasec: RiasecVector,
): FactorScore {
  const similarity = cosineSimilarity(userRiasec, idealRiasec)
  return {
    score: Math.round(similarity * 100),
    available: true,
  }
}
