// ============================================================
// Report Generation — Internal Types
// These types are used within the report generation pipeline
// and are not exposed to the rest of the application.
// ============================================================

import type {
  AnnotationConfidence,
  BigFiveDimension,
  SchwartzValue,
} from "../types";
import type { AiEraCategory } from "../types/report";

// Re-export for convenience within the report generation module
export type {
  AssessmentResult,
  AssessmentInput,
  ProfileAlgorithmOutput,
  RealConditions,
  CareerReport,
  CareerDrainWarning,
  ReportHeader,
  Panel1CareerMatch,
  Panel3Pathway,
  IntegrationLayer,
  CareerDirection,
  JobDirection,
  ActionPlanTask,
  WeekPreview,
  ConstraintStrategy,
  FollowUpTrigger,
  Archetype,
  CognitiveStyleCode,
  RIASECDimension,
  BigFiveDimension,
  SchwartzValue,
  CrossCulturalType,
} from "../types";

/** Match score breakdown for a candidate career direction */
export interface MatchScore {
  total: number;
  breakdown: {
    interestFit: number;
    valueFit: number;
    personalityFit: number;
    adaptabilityFit: number;
    collabFit?: number;
    industryFit?: number;
  };
}

/**
 * Structured match insight — pre-analyzed "why this direction matches".
 * Computed by algorithm so LLM only needs to write prose, not analyze scores.
 */
export interface MatchInsight {
  /** Top 2-3 reasons this direction matches (strongest signals) */
  strengths: MatchSignal[];
  /** Top 1-2 growth edges (weakest signals) */
  gaps: MatchSignal[];
}

export interface MatchSignal {
  factor: "riasec" | "value" | "personality" | "adaptability";
  dimension?: string; // e.g. 'I', 'openness', 'creation'
  userScore?: number; // user's actual score
  idealRange?: { min: number; max: number }; // direction's ideal range
  signal: "strong_match" | "moderate_match" | "neutral" | "growth_edge";
  detail_en: string; // one-sentence pre-built explanation
  detail_zh: string;
}

/** Career direction candidate with computed match score */
export interface CandidateDirection {
  direction: {
    id: string;
    title_zh: string;
    title_en: string;
    subtitle_zh: string;
    alignedValues: string[];
    industries: string[];
    crossCulturalFit: string[];
    aiEraCategory?: AiEraCategory;
    aiExposureScore?: number | null;
    aiImpactLabel?: "low" | "medium" | "high" | null;
    annotationSource: string;
    annotationConfidence: AnnotationConfidence;
    lastReviewedAt: string;
    marketOutlook?: {
      trend: "growing" | "stable" | "transforming" | "emerging";
      label_zh: string;
      label_en: string;
      note_zh?: string;
      note_en?: string;
      source: string;
      lastUpdated?: string;
    };
    resilienceLevel?: number;
    /** O*NET Job Zone (2-5). Used by UI to label cross-tier exploration. */
    jobZone?: number | null;
  };
  score: MatchScore;
  /** Pre-analyzed match insights for LLM narrative generation */
  insights?: MatchInsight;
  /** Whether this career falls inside the user's target Job Zone band. */
  inTargetTier?: boolean;
  /** Distance from target band (0 = in-band; absolute tier gap otherwise). */
  tierGap?: number;
}

/** Output from career matching algorithm layer (3+2 architecture) */
export interface CareerMatchAlgorithmOutput {
  /** Top 3 primary directions — receive deep LLM narratives */
  candidates: CandidateDirection[];
  /** 2 exploratory directions — algorithm-only, lighter treatment */
  exploratoryCandidates: CandidateDirection[];
  /** Top 7-8 candidates BEFORE reality constraint filtering (ideal portrait) */
  idealCandidates: CandidateDirection[];
  /** Top 3 AI-era opportunity matches (ai-native + augmented careers) */
  aiEraCandidates: CandidateDirection[];
}

/** A single cross-framework connection in the butterfly effect narrative */
export interface ValuesCrossConnection {
  from: { framework: "schwartz" | "riasec" | "bigFive"; dimension: string };
  to: { framework: "schwartz" | "riasec" | "bigFive"; dimension: string };
  effect: string; // one-sentence description of how this connection manifests
}

/** Output from profile narrative LLM call — 6 segments */
export interface ProfileNarrativeOutput {
  archetypeNarrative: string; // RIASEC archetype interpretation
  bigFiveNarrative: string; // Big Five 30-facet personality narrative
  sjtTensionNarrative: string; // SJT Should-Would tension interpretation
  valueNarrative: string; // Schwartz values (ipsative centered)
  adaptabilityNarrative: string; // Adaptability/change-readiness from values
  valuesCrossImpactNarrative: string; // Cross-framework butterfly effect narrative
  crossConnections: ValuesCrossConnection[]; // 2-3 specific framework connections
}

/** Output from career match narrative LLM call */
export interface CareerMatchNarrativeOutput {
  summary: string;
  directions: Array<{
    whySuitable: string;
    challenges: string;
    actionableInsights?: {
      books: Array<{
        title: string;
        author: string;
        reason_zh: string;
        reason_en: string;
      }>;
      certifications: Array<{
        name: string;
        provider: string;
        timeToComplete: string;
        priority: "start_here" | "next_step";
        reason_zh: string;
        reason_en: string;
      }>;
      communityMove: {
        action_zh: string;
        action_en: string;
        platform: string;
      };
      thirtyDayChallenge: {
        challenge_zh: string;
        challenge_en: string;
      };
    };
  }>;
  /** AI-era direction narratives (optional, appended to same LLM call) */
  aiEraDirections?: Array<{
    whySuitable: string;
    challenges: string;
  }>;
}

/** Output from Panel 3 LLM call */
export interface Panel3LLMOutput {
  jobDirections: Array<{
    title_zh: string;
    title_en: string;
    industry: string;
    seniority: string;
    matchScore: number;
    matchReason: string;
    linkedinSearchQuery: string;
    isIdealMatch?: boolean;
    resourceGuide?: {
      atsKeywords: string[];
      linkedinTip_zh: string;
      linkedinTip_en: string;
      salaryContext_zh: string;
      salaryContext_en: string;
    };
    gapAnalysis?: {
      readinessScore: number;
      readinessLabel_zh: string;
      readinessLabel_en: string;
      skillGaps: Array<{
        skill_zh: string;
        skill_en: string;
        currentLevel_zh: string;
        currentLevel_en: string;
        requiredLevel_zh: string;
        requiredLevel_en: string;
        bridgeAction_zh: string;
        bridgeAction_en: string;
        timeToClose: string;
        difficulty: "low" | "medium" | "high";
      }>;
      experienceGaps: Array<{
        gap_zh: string;
        gap_en: string;
        workaround_zh: string;
        workaround_en: string;
      }>;
      conditionsAlignment: {
        visaCompatibility: "favorable" | "neutral" | "challenging" | "unknown";
        locationMatch: "strong" | "partial" | "mismatch" | "unknown";
        salaryExpectationMatch:
          | "within_range"
          | "stretch"
          | "overqualified"
          | "unknown";
        note_zh: string;
        note_en: string;
      };
      timelineToCompetitive_zh: string;
      timelineToCompetitive_en: string;
      topPriorityAction_zh: string;
      topPriorityAction_en: string;
    };
  }>;
  jobSearchStrategy: {
    positioning: string;
    resumeHighlights: string[];
    networkingTips: string[];
    constraintStrategies: Array<{
      constraint: string;
      strategy: string;
    }>;
  };
  week1: {
    theme: string;
    tasks: Array<{
      description: string;
      relatedDirection: number;
      difficulty: "easy" | "medium" | "stretch";
    }>;
  };
  weeksPreview: Array<{
    weekNumber: number;
    theme: string;
    taskCount: number;
  }>;
}

/** Output from Career Drain Warning LLM call (#5) */
export interface CareerDrainLLMOutput {
  drainingDirections: Array<{
    title_zh: string;
    title_en: string;
    reason_zh: string;
    reason_en: string;
  }>;
  drainingIndustries: Array<{
    name_zh: string;
    name_en: string;
    reason_zh: string;
    reason_en: string;
  }>;
  drainingManagementStyles: Array<{
    style_zh: string;
    style_en: string;
    reason_zh: string;
    reason_en: string;
  }>;
  redFlagEnvironments: Array<{
    signal_zh: string;
    signal_en: string;
  }>;
  framingSummary_zh: string;
  framingSummary_en: string;
}

/** Output from Integration LLM call */
export interface IntegrationLLMOutput {
  coreInsight: string;
  transitions: {
    headerToCareerMatch?: string;
    careerMatchToProfile?: string;
    profileToPathway: string;
  };
  letterToUser: string;
}

// ============================================================
// Internal Pipeline Types
// ============================================================

/** Big Five facet group for prompts */
export interface FacetSummary {
  domain: BigFiveDimension;
  domainLabel: string;
  domainScore: number; // 0-100 normalized
  topFacets: Array<{ facet: string; score: number }>; // top 3 facets (highest)
  lowFacets: Array<{ facet: string; score: number }>; // bottom 2 facets (lowest)
}

/** Schwartz values summary for prompts */
export interface SchwartzSummary {
  top3: SchwartzValue[];
  bottom2: SchwartzValue[];
  centeredScores: Record<SchwartzValue, number>;
  hasNegativeTension: boolean; // any strongly positive AND strongly negative pairs
}
