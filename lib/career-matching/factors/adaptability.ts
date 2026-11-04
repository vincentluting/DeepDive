// ============================================================
// Factor: Adaptability / Change-Readiness (v3)
//
// v1: Global constant — same score for all careers. Useless.
// v2: Career-specific — crosses user's Schwartz values with
//     the career's discrete aiEraCategory.
// v3: Hybrid — uses continuous aiExposureScore (Anthropic
//     Economic Index, 0-1) when available, falls back to
//     discrete aiEraCategory. More granular differentiation
//     between careers within the same category.
//
// User signal:  Schwartz ipsative (stimulation vs security)
// Career signal: aiExposureScore (continuous, 0-1) OR
//                aiEraCategory (stable|augmented|transformed|ai-native)
//
// Score range: 0-100
// Available: After Deep Dive (PVQ-21 items)
// ============================================================

import type { SchwartzInput, FactorScore } from "../types";
import type { AiEraCategory } from "@/lib/types/report";

/**
 * Discrete fallback: ideal adaptability center per category.
 * Used only when aiExposureScore is not available.
 */
const CAREER_IDEAL_ADAPTABILITY: Record<string, number> = {
  stable: 30,
  augmented: 45,
  transformed: 65,
  "ai-native": 80,
};

/**
 * Calculate adaptability fit between user and career.
 *
 * Strategy:
 * - If aiExposureScore available → use continuous ideal center
 *   (maps 0→25, 0.5→60, 1.0→85 on the adaptability scale)
 * - Else if aiEraCategory available → use discrete lookup
 * - Else → neutral fallback (60)
 *
 * In both paths, the score rewards users whose change-readiness
 * matches the career's AI exposure demands.
 */
export function scoreAdaptability(
  schwartz: SchwartzInput | undefined,
  careerAiEra?: AiEraCategory,
  aiExposureScore?: number | null,
): FactorScore {
  if (!schwartz) {
    return { score: 50, available: false };
  }

  // No AI signals at all → neutral
  if (!careerAiEra && aiExposureScore == null) {
    return { score: 60, available: true, fallback: true };
  }

  const stimulation = schwartz.centered["stimulation"] ?? 0;
  const security = schwartz.centered["security"] ?? 0;

  // Map user's adaptability to 0-100 scale
  // stimulation - security typically ranges from -2 to +2 (ipsative centered)
  // Map: -2 → 10, 0 → 50, +2 → 90
  const userAdaptability = Math.min(
    100,
    Math.max(0, (stimulation - security) * 20 + 50),
  );

  // Determine career's ideal adaptability center
  let idealCenter: number;
  if (aiExposureScore != null && aiExposureScore >= 0) {
    // Continuous path: map exposure 0→25, 0.5→55, 1.0→85
    // Higher exposure → career demands more adaptability
    idealCenter = Math.round(25 + aiExposureScore * 60);
  } else {
    // Discrete fallback
    idealCenter = CAREER_IDEAL_ADAPTABILITY[careerAiEra!] ?? 45;
  }

  // Distance-based scoring: closer to ideal = higher score
  // Penalty: 1 point per 1 unit of distance, gentler than Big Five's 2x
  const distance = Math.abs(userAdaptability - idealCenter);
  const score = Math.max(15, Math.round(100 - distance));

  return {
    score,
    available: true,
  };
}
