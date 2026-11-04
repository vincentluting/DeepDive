// ============================================================
// TwIVI Quick — 8-item Value Orientation Subset for Quick Dive
// ============================================================
// Extracts 8 items from the full TwIVI (Sandy et al. 2017) to determine
// Self-Enhancement vs Self-Transcendence orientation in Quick Dive.
//
// Items: Achievement (8,18) + Power (9,19) = Enhancement
//        Benevolence (3,13) + Universalism (4,14) = Transcendence
//
// Scale: 1-6 Likert ("Not like me at all" → "Very much like me")
// Scoring: No ipsative centering (only 8 items); direct mean comparison.
// ============================================================

import type { ValueOrientation } from "@/lib/types/dimensions";
import type { SchwartzValue } from "@/lib/types/dimensions";
import {
  DDVQ21_ITEMS,
  DDVQ_SCALE_LABELS,
  DDVQ_INSTRUCTIONS,
} from "@/lib/questionnaire/module-b-ddvq21";
import type { DDVQItem } from "@/lib/questionnaire/module-b-ddvq21";

// ── Item Selection ──────────────────────────────────────────

/** The 8 TwIVI item IDs used for Quick Dive value orientation */
const QUICK_TWIVI_ITEM_IDS = [3, 13, 4, 14, 8, 18, 9, 19] as const;

/** Enhancement value types (Self-Enhancement pole) */
const ENHANCEMENT_VALUES: SchwartzValue[] = ["achievement", "power"];

/** Transcendence value types (Self-Transcendence pole) */
const TRANSCENDENCE_VALUES: SchwartzValue[] = ["benevolence", "universalism"];

/** Extracted 8 items from the full TwIVI item bank, preserving original IDs */
export const QUICK_TWIVI_ITEMS: DDVQItem[] = QUICK_TWIVI_ITEM_IDS.map((id) => {
  const item = DDVQ21_ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`TwIVI item ${id} not found in DDVQ21_ITEMS`);
  return item;
});

// Re-export scale labels and instructions for UI rendering
export { DDVQ_SCALE_LABELS, DDVQ_INSTRUCTIONS };

// ── Scoring ─────────────────────────────────────────────────

export interface QuickValueResult {
  orientation: ValueOrientation;
  confidence: number; // 0-1: higher = clearer preference
  isBoundary: boolean; // true when |enhancement - transcendence| < 0.5
  scores: {
    enhancement: number; // mean of Achievement + Power items (1-6)
    transcendence: number; // mean of Benevolence + Universalism items (1-6)
  };
}

/**
 * Compute value orientation from 8 Quick Dive TwIVI answers.
 *
 * @param answers  Map of TwIVI item ID → Likert response (1-6)
 *                 Must contain all 8 item IDs: 3, 4, 8, 9, 13, 14, 18, 19
 */
export function computeQuickValueOrientation(
  answers: Record<number, number>,
): QuickValueResult {
  // Collect scores per pole
  const enhancementScores: number[] = [];
  const transcendenceScores: number[] = [];

  for (const item of QUICK_TWIVI_ITEMS) {
    const score = answers[item.id];
    if (score == null) continue;

    if (ENHANCEMENT_VALUES.includes(item.valueType)) {
      enhancementScores.push(score);
    } else if (TRANSCENDENCE_VALUES.includes(item.valueType)) {
      transcendenceScores.push(score);
    }
  }

  // Compute means (fallback to 3.5 midpoint if no answers)
  const mean = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 3.5;

  const enhancement = mean(enhancementScores);
  const transcendence = mean(transcendenceScores);

  // Binary classification
  const orientation: ValueOrientation =
    enhancement > transcendence ? "enhancement" : "transcendence";

  // Confidence: gap normalized to 0-1 (gap of 2+ on 1-6 scale → full confidence)
  const gap = Math.abs(enhancement - transcendence);
  const confidence = Math.min(gap / 2, 1);
  const isBoundary = gap < 0.5;

  return {
    orientation,
    confidence,
    isBoundary,
    scores: {
      enhancement: Math.round(enhancement * 100) / 100,
      transcendence: Math.round(transcendence * 100) / 100,
    },
  };
}
