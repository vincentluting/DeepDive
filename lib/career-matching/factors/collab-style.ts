// ============================================================
// Factor: Collaboration Style Fit (NEW)
//
// Maps career's typical work environment to DISC-derived
// collaboration preferences. Careers that emphasize leadership
// favor high-D users; service-oriented careers favor high-S.
//
// Uses the career's RIASEC profile as a proxy for work style:
//   E-heavy careers → favor D (drive) + I (influence)
//   S-heavy careers → favor S (steadiness) + I (influence)
//   R-heavy careers → favor C (compliance) + D (drive)
//   C-heavy careers → favor C (compliance) + S (steadiness)
//   A-heavy careers → favor I (influence) + D (drive)
//   I-heavy careers → favor C (compliance) + D (drive)
//
// Score range: 0-100
// Available: After Deep Dive + Profile generation
// ============================================================

import type { CollabInput, FactorScore, RiasecVector } from '../types'

type CollabStyle = 'D' | 'I' | 'S' | 'C'

/**
 * Derive the ideal collaboration style weights from a career's RIASEC profile.
 *
 * Each RIASEC dimension contributes to certain collab styles.
 * The result is a normalized weight vector (sums to ~1.0).
 */
function deriveIdealCollabWeights(riasec: RiasecVector): Record<CollabStyle, number> {
  // How each RIASEC dimension maps to collaboration style preferences
  // Based on occupational psychology: work environment → behavioral demands
  const mapping: Record<keyof RiasecVector, Record<CollabStyle, number>> = {
    R: { D: 0.3, I: 0.0, S: 0.2, C: 0.5 },  // Hands-on: structured, independent
    I: { D: 0.3, I: 0.1, S: 0.1, C: 0.5 },  // Research: analytical, methodical
    A: { D: 0.3, I: 0.5, S: 0.1, C: 0.1 },  // Creative: expressive, autonomous
    S: { D: 0.1, I: 0.4, S: 0.4, C: 0.1 },  // Social: relational, supportive
    E: { D: 0.5, I: 0.3, S: 0.1, C: 0.1 },  // Enterprising: decisive, persuasive
    C: { D: 0.1, I: 0.1, S: 0.3, C: 0.5 },  // Conventional: process, compliance
  }

  const weights: Record<CollabStyle, number> = { D: 0, I: 0, S: 0, C: 0 }
  let totalRiasec = 0

  for (const dim of ['R', 'I', 'A', 'S', 'E', 'C'] as (keyof RiasecVector)[]) {
    const v = riasec[dim]
    totalRiasec += v
    for (const style of ['D', 'I', 'S', 'C'] as CollabStyle[]) {
      weights[style] += v * mapping[dim][style]
    }
  }

  // Normalize
  if (totalRiasec > 0) {
    for (const style of ['D', 'I', 'S', 'C'] as CollabStyle[]) {
      weights[style] /= totalRiasec
    }
  }

  return weights
}

/**
 * Calculate collaboration style fit.
 *
 * Computes cosine similarity between user's collab profile
 * and the career's derived ideal collab weights.
 */
export function scoreCollabStyle(
  collab: CollabInput | undefined,
  careerRiasec: RiasecVector,
): FactorScore {
  if (!collab) {
    return { score: 50, available: false }
  }

  const idealWeights = deriveIdealCollabWeights(careerRiasec)
  const styles: CollabStyle[] = ['D', 'I', 'S', 'C']

  // Normalize user scores to 0-1 range
  const maxUserScore = Math.max(...styles.map(s => collab.scores[s]), 1)
  const userNorm = styles.map(s => collab.scores[s] / maxUserScore)
  const idealNorm = styles.map(s => idealWeights[s])

  // Cosine similarity
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < 4; i++) {
    dot += userNorm[i] * idealNorm[i]
    normA += userNorm[i] * userNorm[i]
    normB += idealNorm[i] * idealNorm[i]
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  const similarity = denom === 0 ? 0 : dot / denom

  return {
    score: Math.round(similarity * 100),
    available: true,
  }
}
