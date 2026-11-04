// ============================================================
// Deep Dive — Dimension Type Definitions
// ============================================================

// ========== Dimension Types ==========

export type RIASECDimension = "R" | "I" | "A" | "S" | "E" | "C";

export type BigFiveDimension =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism";

export type CrossCulturalType = "bridge" | "integrate" | "root" | "global";

// ===== Schwartz Value Dimensions (replaces ValueAnchor) =====
export type SchwartzValue =
  | "achievement" // Achievement & recognition
  | "power" // Influence & status
  | "stimulation" // Stimulation & new experiences
  | "self-direction" // Self-Direction (PVQ-21 standard term)
  | "hedonism" // Pleasure & enjoyment
  | "benevolence" // Helping close others
  | "universalism" // Universal care & justice
  | "conformity" // Norms & compliance
  | "tradition" // Tradition & sense of mission
  | "security"; // Safety & stability

// Schwartz conflict pairs (conditionally triggered for Q42)
export type SchwartzConflictPair =
  | "achievement_benevolence"
  | "autonomy_conformity"
  | "stimulation_security"
  | "power_universalism";

// ===== Collaboration Style (proprietary derivation from Big Five; Layer 2 only) =====
// Style keys D/I/S/C are internal identifiers retained for DB compatibility.
// Brand names: D=引领型(Leading), I=激发型(Inspiring), S=稳健型(Anchoring), C=精研型(Refining)
export type CollabStyle = "D" | "I" | "S" | "C";

// ===== Archetype confidence level =====
export type ArchetypeConfidenceLevel = "high" | "medium" | "low";
// high: confidence >= 75, medium: 50-74, low: < 50

// ===== Value Orientation (12-type: RIASEC × Enhancement/Transcendence) =====
// Determined by Schwartz Self-Enhancement↔Self-Transcendence axis (TwIVI).
export type ValueOrientation = "enhancement" | "transcendence";

// Holland hexagonal adjacency relation (used in RIASEC analysis, not archetype determination)
export type HollandRelation = "dominant" | "adjacent" | "cross";

// ========== Archetype (12-type: RIASEC × ValueOrientation) ==========

export interface Archetype {
  // Two dimensions
  primary: RIASECDimension; // Top-1 RIASEC dimension (family)
  orientation: ValueOrientation; // enhancement | transcendence

  // Code & labels — single identity
  code: string; // "R-enhancement", "I-transcendence", etc.
  label_zh: string;
  label_en: string;
  tagline_zh: string;
  tagline_en: string;

  // Confidence metadata
  confidence: number; // 0-1 scale
  confidenceLevel: ArchetypeConfidenceLevel;
  isBoundary: boolean; // true when RIASEC gap12 <= 5

  // Value orientation scores (from TwIVI)
  valueScores?: {
    enhancement: number; // mean(Achievement, Power) — raw or centered
    transcendence: number; // mean(Benevolence, Universalism)
  };

  // Source data (RIASEC distribution — retained for analytics & narratives)
  derivedFrom: {
    primary: { dimension: RIASECDimension; score: number };
    secondary: { dimension: RIASECDimension; score: number };
    tertiary: { dimension: RIASECDimension; score: number };
    gap12: number; // Top1 - Top2 score
    gap23: number; // Top2 - Top3 score
    relation: HollandRelation; // Top1-Top2 Holland hexagonal relation
  };
}

// ========== Layer 3: Derived Models ==========

export interface CognitiveStyleDimensionInfo {
  /**
   * Preference strength on this axis, range 0-100, midpoint 50.
   * Higher score = stronger preference toward the LEFT pole letter:
   *   EI → E, SN → S, TF → T, JP → J.
   * UI consumers (cognitive-style-breakdown.tsx) rely on this convention
   * to render the spectrum bar and pick the hint copy. See
   * deriveCognitiveStyleFromBigFive in lib/scoring/index.ts for the
   * forward (EI/JP) vs reverse (SN/TF) normalization rules.
   */
  score: number;
  label: string;
  isNearMidpoint: boolean;
}

export type CognitiveStyleDisplayMode = "normal" | "balanced";

export interface CognitiveStyleCode {
  code: string | null; // e.g. "ENFJ", or null when displayMode is 'balanced'
  displayMode: CognitiveStyleDisplayMode;
  /**
   * Present when displayMode is 'balanced' — dimensions near the midpoint.
   * `score` follows the same 0-100 / left-pole-positive convention as
   * `CognitiveStyleDimensionInfo.score`.
   */
  nearMidpointDimensions?: Array<{
    axis: "EI" | "SN" | "TF" | "JP";
    score: number;
  }>;
  dimensions: Record<"EI" | "SN" | "TF" | "JP", CognitiveStyleDimensionInfo>;
  /**
   * Model confidence as a fraction in [0, 1]. UI multiplies by 100 for
   * percentage display. NOT 0-100.
   */
  confidence: number;
}

// CollabMapping interface (Collaboration Style derived from Big Five)
export interface CollabMapping {
  primary: CollabStyle;
  secondary: CollabStyle | null;
  scores: Record<CollabStyle, number>; // style percentages, sum ≈ 100
  cssGradient: string; // dual-color gradient for UI
  derivedFrom: "big_five_mapping"; // explicitly marks derivation source
  approximationNote_zh: string;
  approximationNote_en: string;
  confidence: number;
}

// SchwartzAnchorsResult
export interface SchwartzAnchorsResult {
  ranking: SchwartzValue[]; // drag-sort result (9 items including 'power')
  top3: SchwartzValue[];
  scores: Record<SchwartzValue, number>; // 各维度累计分数
  conflictPair: SchwartzConflictPair | null; // detected conflict pair
  conflictStatus: "confirmed" | "managed" | "resolved" | null; // Q42 user confirmation
  confidence: number;
}

// ===== SJT Should-Would Tension Score (v2.0) =====
export interface SJTTensionScore {
  scenarioId: number; // 1-6
  domain: string; // mapped Big Five domain (e.g. 'extraversion')
  domainSecondary?: string; // SJT-6 maps to two domains
  wouldScore: number; // score for actual choice
  shouldScore: number; // score for ideal choice
  gap: number; // should - would
  isConsistent: boolean; // gap === 0
}
