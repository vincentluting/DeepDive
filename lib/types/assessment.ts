// ============================================================
// Deep Dive — Assessment & Scoring Type Definitions
// ============================================================

import type {
  RIASECDimension,
  BigFiveDimension,
  SchwartzValue,
  Archetype,
  CognitiveStyleCode,
  CollabMapping,
  SJTTensionScore,
} from './dimensions';
// ============================================================
// AssessmentResult — v2.0 scoring pipeline output (deprecated)
// ============================================================

/**
 * @deprecated v2.0 only — retained for reading historical data from DB.
 * The v2.0 scoring pipeline (runScoringPipeline) has been removed.
 * New assessments use AssessmentResultV3 via runScoringPipelineV3().
 */
export interface AssessmentResult {
  id: string;
  sessionId: string;
  timestamp: string;
  questionnaireVersion: '2.0';

  // === Module C: IPIP-NEO-120 → Big Five (sole data source) ===
  bigFive: {
    domains: Record<BigFiveDimension, number>;          // 5 domain means (1-5 scale)
    facets: Record<string, number>;                      // 30 facet means (1-5 scale)
    domainsNormalized: Record<BigFiveDimension, number>; // 0-100 for UI
  };

  // === Module B: PVQ-21 → Schwartz Values (sole data source) ===
  schwartz: {
    raw: Record<SchwartzValue, number>;          // raw means per value type
    centered: Record<SchwartzValue, number>;      // after ipsative centering
    ranking: SchwartzValue[];                     // sorted by centered score
    top3: SchwartzValue[];
  };

  // === Module A: SJT → Should-Would Tension (independent insight) ===
  tensions: {
    scenarios: SJTTensionScore[];                // 6 scenario tension scores
    overallConsistency: number;                  // 0-1, proportion of consistent scenarios
    notableTensions: string[];                   // domain names with significant gaps
  };

  // === Inherited from Quick Dive ===
  riasecNormalized: Record<RIASECDimension, number>;
  archetype: Archetype;

  // === Optional derivations (retained but demoted to optional) ===
  cognitiveStyleCode?: CognitiveStyleCode;  // derived from IPIP-NEO-120 Big Five
  collabMapping?: CollabMapping;  // Collaboration Style derived from Big Five in layer3-derive.ts

  // === Quality metadata ===
  meta: {
    totalQuestions: number;         // 147
    answeredQuestions: number;
    totalTimeMs: number;
    rushCount: number;              // questions answered too quickly
    moduleTimes: {
      sjt: number;
      pvq: number;
      ipip: number;
    };
  };
}

// ============================================================
// AssessmentResultV3 — Output of v3.0 scoring pipeline (86-item questionnaire)
// ============================================================

/**
 * AssessmentResultV3 — Output of the v3.0 scoring pipeline.
 *
 * Four independent scoring modules:
 * - Module A: SJT (6 scenarios) → Should-Would Tension Scores
 * - Module B: TwIVI (20 items) → Schwartz Values + Higher-Order Dimensions
 * - Module C: IPIP-60 (60 items) → Big Five standard-level
 * - RIASEC + Archetype: Inherited from Quick Dive (not re-measured)
 */
export interface AssessmentResultV3 {
  id: string;
  sessionId: string;
  timestamp: string;
  questionnaireVersion: '3.0';

  // === Module C: IPIP-60 → Big Five (standard level) ===
  bigFive: {
    domains: Record<BigFiveDimension, number>;          // 5 domain means (1-5 scale)
    facets: Record<string, number>;                      // 30 facet scores (1-5), mean of 2 items per facet
    domainsNormalized: Record<BigFiveDimension, number>; // 0-100 for UI
    precision: 'screening' | 'standard' | 'full';       // 'screening' for IPIP-30, 'standard' for IPIP-60, 'full' for IPIP-120
  };

  // === Module B: TwIVI → Schwartz Values + Higher-Order Dimensions ===
  schwartz: {
    raw: Record<SchwartzValue, number>;
    centered: Record<SchwartzValue, number>;
    /** Higher-Order value dimensions (openness-to-change, self-enhancement, conservation, self-transcendence) */
    higherOrder: Record<string, number>;
    ranking: SchwartzValue[];
    top3: SchwartzValue[];
  };

  // === Module A: SJT → Should-Would Tension (same as v2.0) ===
  tensions: {
    scenarios: SJTTensionScore[];
    overallConsistency: number;
    notableTensions: string[];
  };

  // === Inherited from Quick Dive ===
  riasecNormalized: Record<RIASECDimension, number>;
  archetype: Archetype;

  // === Optional derivations ===
  cognitiveStyleCode?: CognitiveStyleCode;
  collabMapping?: CollabMapping;  // Collaboration Style derived from Big Five

  // === Quality metadata ===
  meta: {
    totalQuestions: number;         // 86 (not including Reality Snapshot)
    answeredQuestions: number;
    totalTimeMs: number;
    rushCount: number;
    moduleTimes: {
      sjt: number;
      ddvq: number;    // TwIVI module time
      ipip60: number;  // IPIP-60 module time
    };
    /** How this assessment was generated — absent for real user completions */
    generationSource?: 'user' | 'admin-random' | 'admin-preset';
  };
}

// ============================================================
// AssessmentInput — Union type for report generation pipeline
// ============================================================

/**
 * AssessmentInput — Accepts both v2.0 and v3.0 assessment results.
 *
 * The report generation pipeline only reads shared structural fields
 * (bigFive, schwartz, tensions, riasecNormalized, archetype, cognitiveStyleCode, collabMapping)
 * and never accesses version-specific fields like meta.moduleTimes keys.
 */
export type AssessmentInput = AssessmentResult | AssessmentResultV3;
