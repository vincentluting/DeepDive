// ============================================================
// Career Exploration Engine — Unified Types
//
// Shared types for the multi-factor career matching engine.
// Used by Quick Dive, Deep Dive, Profile, and Coaching.
// ============================================================

import type {
  AiEraCategory,
  CareerDirectionTemplate,
} from "@/lib/types/report";

// ── Factor Scores ────────────────────────────────────────────

/** Individual factor score (0-100) with optional metadata */
export interface FactorScore {
  score: number; // 0-100 normalized
  available: boolean; // was this factor computable from input data?
  fallback?: boolean; // used SOC group or other fallback?
}

/** All factor scores for a single career */
export interface FactorScores {
  interestFit: FactorScore; // RIASEC cosine similarity
  personalityFit: FactorScore; // Big Five range matching
  valueFit: FactorScore; // Schwartz values alignment
  adaptabilityFit: FactorScore; // Change-readiness
  collabFit: FactorScore; // Collaboration style compatibility
  industryFit: FactorScore; // Industry preference alignment
}

// ── Composition Strategies ───────────────────────────────────

/**
 * How to compose factor scores into final rankings.
 *
 * - best-fit:  Weighted total score, highest first (classic recommendation)
 * - surprise:  Total score in 60-85 range BUT at least one factor ≥90
 *              ("you'd never guess, but this is a perfect fit because...")
 * - growth:    Interest fit high, personality/collab has gap
 *              ("this career would stretch you in interesting ways")
 * - drain:     Lowest total score (energy drain / anti-patterns)
 */
export type CompositionStrategy = "best-fit" | "surprise" | "growth" | "drain";

// ── Engine Input ─────────────────────────────────────────────

/** RIASEC vector — the only required input (Quick Dive minimum) */
export interface RiasecVector {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

/** Big Five domain scores (0-100 normalized). Available after Deep Dive. */
export type BigFiveVector = Record<
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism",
  number
>;

/** Schwartz values (ipsative centered). Available after Deep Dive. */
export interface SchwartzInput {
  top3: string[];
  centered: Record<string, number>;
}

/** Collaboration style scores. Available after Deep Dive profile generation. */
export interface CollabInput {
  scores: Record<"D" | "I" | "S" | "C", number>; // 0-100
}

/** Industry preference input. Available after Reality Conditions module. */
export interface IndustryInput {
  /** User's current industry ID */
  currentIndustry?: string;
  /** User's target industry IDs */
  interestedIndustries: string[];
}

/** Progressive user profile — fields become available as user progresses */
export interface UserProfile {
  riasec: RiasecVector; // Always available (Quick Dive)
  bigFive?: BigFiveVector; // After Deep Dive
  schwartz?: SchwartzInput; // After Deep Dive
  collab?: CollabInput; // After Deep Dive + Profile
  industry?: IndustryInput; // After Reality Conditions
}

/** Optional filters to narrow the career pool */
export interface CareerFilters {
  industries?: string[];
  experienceYears?: number;
}

// ── Engine Output ────────────────────────────────────────────

/** A scored career with factor breakdown */
export interface ScoredCareer {
  id: string;
  title_zh: string;
  title_en: string;
  totalScore: number; // 0-100 weighted composite
  factors: FactorScores; // Individual factor breakdown
  tags?: string[];
  aiEraCategory?: AiEraCategory;
  aiExposureScore?: number | null;
  aiImpactLabel?: "low" | "medium" | "high" | null;
  marketOutlook?: CareerDirectionTemplate["marketOutlook"];
  resilienceLevel?: number;
  /** O*NET Job Zone (2-5); null when unclassified. */
  jobZone?: number | null;
  /** Whether the career falls inside the user's target tier band. */
  inTargetTier?: boolean;
  /** Distance from the user's target tier band (0 if in-band). */
  tierGap?: number;
}

/** Output from a single composition strategy */
export interface ComposedResult {
  strategy: CompositionStrategy;
  careers: ScoredCareer[];
}

/** Full engine output — multiple strategies at once */
export interface ExplorationResult {
  /** All careers scored (sorted by best-fit total). Typically not exposed to UI directly. */
  allScored: ScoredCareer[];
  /** Results grouped by composition strategy */
  composed: Record<CompositionStrategy, ScoredCareer[]>;
  /** What precision level was used */
  precision: "quick" | "full";
}

/** Simplified display item for UI components */
export interface CareerDisplayItem {
  id: string;
  name: string;
  title_zh: string;
  title_en: string;
  pct: number;
  aiEraCategory?: AiEraCategory;
  aiExposureScore?: number | null;
  aiImpactLabel?: "low" | "medium" | "high" | null;
  resilienceLevel?: number;
}
