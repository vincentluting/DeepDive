// ============================================================
// Deep Dive — Report Type Definitions
// ============================================================

import type {
  RIASECDimension,
  BigFiveDimension,
  CrossCulturalType,
  CognitiveStyleDisplayMode,
  CognitiveStyleCode,
  Archetype,
  SchwartzValue,
  SJTTensionScore,
} from "./dimensions";

import type { ArchetypeContent } from "../content/types";

// Local aliases for readability
type ArchetypeRef = Archetype;
type ArchetypeContentRef = ArchetypeContent;

// ========== Career Anchors (Ch1 bridge from Profile to Report) ==========

/**
 * A career anchor distilled from profile dimensions.
 * Each anchor is a binary preference pair showing which pole the user leans toward.
 * Used in Report Chapter 1 as a lightweight bridge — "your profile means THIS for careers."
 */
export interface CareerAnchor {
  /** Legacy bilingual anchor label, e.g. "创造性表达 > 执行效率" / "Creative expression > Execution efficiency".
   * Kept for backward compatibility with historical reports; UI no longer renders this. */
  label_zh: string;
  label_en: string;
  /** The pole the user leans toward, e.g. "Hands-on building" / "动手建造" */
  positive_zh: string;
  positive_en: string;
  /** The opposite pole the user leans away from, e.g. "Passive execution" / "被动执行" */
  negative_zh: string;
  negative_en: string;
  /** Which profile dimension(s) this anchor derives from */
  source: "riasec" | "schwartz" | "bigfive" | "cross-dimension";
  /** Strength of this preference (0-100) — used for sorting; UI does not render this. */
  strength: number;
}

// ========== Career Report ==========

export interface ReportHeader {
  // 12-type archetype (RIASEC × Enhancement/Transcendence)
  archetype: {
    code: string;
    orientation: "enhancement" | "transcendence";
    label_zh: string;
    label_en: string;
    tagline_zh: string;
    tagline_en: string;
  };

  // Two-letter RIASEC archetype code, e.g. "IA", "SR" (for avatar rendering)
  archetypeCode?: string;

  // Secondary labels
  cognitiveStyleCode: string | null;
  cognitiveStyleDisplayMode: CognitiveStyleDisplayMode;
  crossCulturalType_zh: string | null; // nullable (CC questions not collected)
  crossCulturalType_en: string | null; // nullable (CC questions not collected)

  // Collaboration Style mapping (share card background gradient)
  collabMapping: {
    cssGradient: string;
    primary: string;
    secondary: string | null;
  };

  // Full display string, e.g. "Soul Creator · ENFJ · Bridge"
  displayString_zh: string;
  displayString_en: string;

  // Anti-fixation design
  fluidityNote_zh: string;
  fluidityNote_en: string;
  isBoundary: boolean;

  // Archetype confidence (v6.0)
  confidenceLevel?: "high" | "medium" | "low";
  confidence?: number; // 0-100
  adjacentArchetype?: {
    code: string;
    label_zh: string;
    label_en: string;
  } | null;
}

export interface CareerDirection {
  rank: number; // 1-5
  title_zh: string;
  title_en: string;
  matchScore: number; // 0-100, algorithm-calculated

  // Match breakdown (algorithm-calculated, for frontend visualization)
  matchBreakdown: {
    interestFit: number; // RIASEC match (0-100)
    valueFit: number; // value anchor fit (0-100)
    personalityFit: number; // personality fit (0-100)
    adaptabilityFit: number; // CAAS fit (0-100)
    industryFit?: number; // Industry preference alignment (0-100)
  };

  // Industry tags from career direction DB
  industries?: string[];

  // Why worth exploring (LLM generated, 2-3 sentences)
  whySuitable: string;

  // Possible challenges (LLM generated, 1-2 sentences)
  challenges: string;

  // Exploration note (algorithm generated)
  explorationNote: string;

  // Aligned value anchors (algorithm annotated)
  alignedValues: string[];

  // Cross-cultural fit types from career direction DB
  crossCulturalFit?: string[];

  // Computed barrier level for cross-cultural reality display
  crossCulturalBarrierLevel?: "low" | "medium" | "high";

  // AI era classification — how AI reshapes this career
  aiEraCategory?: AiEraCategory;

  // AI exposure (Anthropic Economic Index) — current AI task penetration
  aiExposureScore?: number | null; // 0-1
  aiImpactLabel?: "low" | "medium" | "high" | null;

  // CRS resilience level (0-3): 0=highly vulnerable, 1=vulnerable, 2=resilient, 3=highly resilient
  resilienceLevel?: number;

  // O*NET Job Zone (2-5) — professional preparation level. Used by UI to
  // show a "different professional level" hint in the cross-tier section.
  jobZone?: number | null;
  // Whether this direction is inside the user's target Job Zone band.
  inTargetTier?: boolean;
  // Distance from the target band (0 = in-band). Used for UI badge text.
  tierGap?: number;

  // Confidence annotation — transparency about match model source
  annotationConfidence?: AnnotationConfidence;

  // Static market trend label (from O*NET / WEF data — shown only in reality-adjusted phase)
  marketOutlook?: {
    trend: "growing" | "stable" | "transforming" | "emerging";
    label_zh: string;
    label_en: string;
    note_zh?: string;
    note_en?: string;
    source: string;
    lastUpdated?: string;
  };

  // Career-planner level actionable insights (LLM generated at report time)
  actionableInsights?: {
    // 2-3 books with rationale, chosen for THIS person's profile
    books: Array<{
      title: string;
      author: string;
      reason_zh: string; // Why THIS book for THIS person's specific profile (1 sentence)
      reason_en: string;
    }>;

    // 1-2 certifications specific to this direction + person's current level
    certifications: Array<{
      name: string;
      provider: string; // e.g. "Coursera", "PMI", "CFA Institute"
      timeToComplete: string; // e.g. "3个月" / "3 months"
      priority: "start_here" | "next_step";
      reason_zh: string;
      reason_en: string;
    }>;

    // 1 community or network move (specific, not generic)
    communityMove: {
      action_zh: string; // e.g. "加入LinkedIn群组 'Product Leaders Asia'"
      action_en: string;
      platform: string; // LinkedIn / Slack / Discord / Meetup / etc.
    };

    // 30-day concrete challenge (1 specific action, not vague advice)
    thirtyDayChallenge: {
      challenge_zh: string;
      challenge_en: string;
    };
  };
}

export interface Panel1CareerMatch {
  /** Top 3 primary directions with deep LLM narratives */
  directions: CareerDirection[];

  /** 2 exploratory directions — algorithm-only, lighter treatment ("you might not have considered...") */
  exploratoryDirections?: CareerDirection[];

  summary: string;

  /** Top 7-8 career directions BEFORE reality constraint filtering (ideal portrait) */
  idealDirections?: CareerDirection[];

  /** Top 3 AI-era opportunity matches (ai-native + augmented, deduplicated from main directions) */
  aiEraDirections?: CareerDirection[];

  /** Personalized AI-era insight based on user's archetype + Big Five + RIASEC (pure algorithm, 0 LLM) */
  aiEraPersonalInsight?: AiEraPersonalInsight;

  /** Differential impact of reality constraints on ideal directions */
  realityImpact?: {
    /** Direction IDs whose rank improved after reality constraints */
    strengthened: string[];
    /** Direction IDs that dropped in rank or fell out of top 3 */
    weakened: string[];
    /** Direction IDs that appeared in filtered top 3 but not in ideal top 7 */
    newOpportunities: string[];
  };
}

export interface CareerDrainWarning {
  // Draining career directions (2-4 items)
  drainingDirections: Array<{
    title_zh: string;
    title_en: string;
    reason_zh: string; // 1-2 sentences on WHY this is draining for this specific person
    reason_en: string;
    sourceLabel_zh?: string; // e.g. "低秩序性" — which trait triggered this drain
    sourceLabel_en?: string; // e.g. "Low Orderliness"
  }>;

  // Industries / sectors to be cautious about (2-3 items)
  drainingIndustries: Array<{
    name_zh: string;
    name_en: string;
    reason_zh: string;
    reason_en: string;
    sourceLabel_zh?: string;
    sourceLabel_en?: string;
  }>;

  // Management styles that would drain this person (2-3 items)
  drainingManagementStyles: Array<{
    style_zh: string;
    style_en: string;
    reason_zh: string;
    reason_en: string;
    sourceLabel_zh?: string;
    sourceLabel_en?: string;
  }>;

  // Work environment signals to watch for (3-5 items, shorter)
  redFlagEnvironments: Array<{
    signal_zh: string;
    signal_en: string;
    sourceLabel_zh?: string;
    sourceLabel_en?: string;
  }>;

  // Framing summary (1-2 sentences)
  framingSummary_zh: string;
  framingSummary_en: string;
}

interface MarketSignal {
  estimatedOpenings: number;
  demandTrend: "rising" | "stable" | "declining" | "unknown";
  dataSource: string;
  fetchedAt: string;
}

interface GapAnalysisSkillGap {
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
}

interface GapAnalysisExperienceGap {
  gap_zh: string;
  gap_en: string;
  workaround_zh: string;
  workaround_en: string;
}

interface GapAnalysisConditionsAlignment {
  visaCompatibility: "favorable" | "neutral" | "challenging" | "unknown";
  locationMatch: "strong" | "partial" | "mismatch" | "unknown";
  salaryExpectationMatch:
    | "within_range"
    | "stretch"
    | "overqualified"
    | "unknown";
  note_zh: string;
  note_en: string;
}

export interface GapAnalysis {
  readinessScore: number;
  readinessLabel_zh: string;
  readinessLabel_en: string;
  skillGaps: GapAnalysisSkillGap[];
  experienceGaps: GapAnalysisExperienceGap[];
  conditionsAlignment: GapAnalysisConditionsAlignment;
  timelineToCompetitive_zh: string;
  timelineToCompetitive_en: string;
  topPriorityAction_zh: string;
  topPriorityAction_en: string;
}

export interface JobDirection {
  title_zh: string;
  title_en: string;
  industry: string;
  seniority: string;
  matchScore: number;
  matchReason: string;
  linkedinSearchQuery: string;
  marketSignal?: MarketSignal;
  annotationConfidence?: AnnotationConfidence;

  // Whether this direction overlaps with Panel 1 ideal matches
  isIdealMatch?: boolean;

  // Pre-computed resource guide for this specific job title
  resourceGuide?: {
    // Keywords/skills to add to resume to pass ATS for this role
    atsKeywords: string[]; // 3-5 keywords specific to this job title
    // One specific LinkedIn move for this exact role
    linkedinTip_zh: string;
    linkedinTip_en: string;
    // Salary range context for overseas Chinese market (honest estimate)
    salaryContext_zh: string; // e.g. "北美初级: $70k-90k USD，需2年相关经验"
    salaryContext_en: string;
  };

  // Pre-computed gap analysis (generated at report time, not on user click)
  gapAnalysis?: GapAnalysis;
}

export interface ActionPlanTask {
  description: string;
  relatedDirection: number;
  difficulty: "easy" | "medium" | "stretch";
  isCompleted: boolean;
}

export interface WeekPreview {
  weekNumber: number;
  theme: string;
  taskCount: number;
  unlockCTA: string;
}

export interface ConstraintStrategy {
  constraint: string;
  strategy: string;
}

export interface FollowUpTrigger {
  dayOffset: number;
  type: "nudge" | "review" | "upsell";
  subject: string;
  contentBrief: string;
}

export interface Panel3Pathway {
  realConditionsProvided: boolean;

  // 3.1 Matching job directions
  jobDirections: JobDirection[];

  // 3.2 Job search strategy (LLM generated)
  jobSearchStrategy: {
    positioning: string;
    resumeHighlights: string[];
    networkingTips: string[];
    constraintStrategies: ConstraintStrategy[];
  };

  // 3.3 30-day action plan (layered delivery)
  actionPlan: {
    intensity: "exploratory" | "structured" | "accelerated"; // v6.0: Schwartz-based, replaces CAAS thrustLevel
    thrustNote: string;
    confidenceNote?: string;

    // Week 1: full free content
    week1: {
      theme: string;
      tasks: ActionPlanTask[];
    };
    // Weeks 2-4: preview only
    weeksPreview: WeekPreview[];
  };

  // 3.4 Subscription bridge
  subscriptionBridge: {
    cta_zh: string;
    cta_en: string;
    trialDays: number;
    valueProps: string[];
  };

  // 3.5 Follow-up triggers
  followUpSchedule: {
    emailCollected: boolean;
    triggers: FollowUpTrigger[];
  };
}

export interface IntegrationLayer {
  // Core insight (report top, 2-3 sentences)
  coreInsight: string;

  // Transition texts between sections
  // headerToCareerMatch and careerMatchToProfile are deprecated — removed from
  // LLM output schema so new reports won't contain them. Kept optional here
  // for backward-compat with existing DB records.
  transitions: {
    /** @deprecated No longer generated. Present only in reports created before 2026-04. */
    headerToCareerMatch?: string;
    /** @deprecated No longer generated. Present only in reports created before 2026-04. */
    careerMatchToProfile?: string;
    profileToPathway: string;
  };

  // Letter to user (report end, 3-4 paragraphs)
  letterToUser: string;
}

export interface CareerReport {
  id: string;
  assessmentId: string;
  locale: string;

  // Reference to the PersonalProfile that this report is based on
  // In v3.0+, profile and report are generated separately;
  // the report reads profile data via this reference instead of embedding Panel 2.
  profileId?: string;

  // Report header: identity labels (lightweight reference from profile)
  header: ReportHeader;

  // Career anchors: 3 key preferences bridging identity → career (Ch1)
  careerAnchors?: CareerAnchor[];

  // Career match directions (top career paths matched to user profile)
  careerMatch: Panel1CareerMatch;

  // Reality career pathway (job directions + action plan)
  careerPathway: Panel3Pathway;

  // Integration layer
  integration: IntegrationLayer;

  // Career drain warning (optional, LLM #5)
  careerDrainWarning?: CareerDrainWarning;

  // Metadata
  meta: {
    generatedAt: number;
    version: "5.0" | "6.0" | "7.0" | "2.0" | "3.0";
    llmModel: string;
    generationTimeMs: number;
    llmCalls: number;
    realConditionsProvided: boolean;
    /** Resume enhancement provenance — tells the UI whether this report was
     *  generated with resume evidence and timestamps the source upload. */
    resumeEnhanced?: boolean;
    resumeMatchId?: string;
    resumeMatchAt?: number;
    /** Sections that exhausted retry+fallback and degraded to algorithmic
     *  text. Frontend uses this to show "Enhance" / fallback notice. */
    degradedSections?: string[];
    /** Migration 094: per-section LLM provenance.
     *  taskName → { provider, model } for every LLM-backed section.
     *  E.g. { "profile-narrative": { provider: "anthropic", model: "claude-sonnet-4-6" }, ... }
     *  When userId is null (anonymous flow) this is undefined. */
    llmProviderMap?: Record<string, { provider: string; model: string }>;
    /** Migration 094: 0.00–1.00 — share of LLM sections that hit primary
     *  AND passed quality gates (in Phase 2, gates may bring this below 1).
     *  In Phase 1 this is simply 1 - degradedSections.length / totalLLMSections. */
    qualityScore?: number;
  };
  /** Resume-derived evidence: aligned dimensions + conflict tensions plus
   *  the experience signals (years / industries / seniority tier) used by
   *  Career Pathway to calibrate jobDirections seniority and Week 1 task
   *  difficulty. Populated only when an active ResumeMatchResult was
   *  available at generation time. Consumed by the report UI's "Evidence"
   *  sections AND rehydrated by /regenerate-pathway so regen sees the same
   *  data the original generation did (R5 invariant). */
  resumeEvidence?: {
    alignedDimensions: Array<{
      dimension: string;
      assessmentSignal: string;
      resumeEvidence: string;
      confidenceBoost: number;
    }>;
    conflictingDimensions: Array<{
      dimension: string;
      assessmentSignal: string;
      resumeEvidence: string;
      tensionInsight_zh: string;
      tensionInsight_en: string;
    }>;
    summary_zh: string;
    summary_en: string;
    /** Inferred Job Zone band (2-5) used by the career-match algorithm
     *  layer + surfaced as a seniority line in prompt blocks. Optional —
     *  older snapshots predating the 2026-05-23 audit fix lack it. */
    userTargetTier?: {
      currentTier: number;
      aspirationalTier: number;
      min: number;
      max: number;
      confidence: number;
      reasoning: string;
    };
    /** Resume-derived auto-fill candidates for RealConditions. Only the
     *  experience-signal subset (experienceYears + pastIndustries) is
     *  prompt-relevant; we keep the type loose to allow forward expansion
     *  without a migration. Optional for the same legacy-snapshot reason. */
    autoFillRealConditions?: {
      experienceYears?: number;
      pastIndustries?: string[];
      [key: string]: unknown;
    };
  };
}

// ========== Career Direction Template (for matching algorithm) ==========

export type AnnotationConfidence =
  | "expert-estimated"
  | "data-validated"
  | "community-verified";
export type AiEraCategory =
  | "stable"
  | "augmented"
  | "transformed"
  | "ai-native";

/** AI-era personal insight — pure algorithm, based on RIASEC × Big Five × archetype */
export interface AiEraPersonalInsight {
  /** What AI cannot replace about this person (1-2 sentences, bilingual) */
  moat_zh: string;
  moat_en: string;
  /** Key shift to be aware of (1 sentence, bilingual) */
  watchOut_zh: string;
  watchOut_en: string;
  /** Recommended AI-era positioning (1 sentence, bilingual) */
  positioning_zh: string;
  positioning_en: string;
  /** 0-100 AI adaptability score based on Big Five openness + conscientiousness */
  adaptabilityScore: number;
}

export interface CareerDirectionTemplate {
  id: string;
  title_zh: string;
  title_en: string;
  // Additional locale titles from DB titleLocales (title_nl, title_de, etc.)
  title_nl?: string;
  title_de?: string;
  title_fr?: string;
  title_es?: string;
  title_pt?: string;
  title_it?: string;
  title_ru?: string;
  title_ja?: string;
  title_ko?: string;
  subtitle_zh?: string;
  idealRIASEC: Record<RIASECDimension, number>;
  alignedValues: string[];
  idealBigFive: Partial<Record<BigFiveDimension, { min: number; max: number }>>;
  industries: string[];
  crossCulturalFit: CrossCulturalType[];
  seniorityRange?: { minYears: number; maxYears: number };
  tags?: string[];
  aiEraCategory?: AiEraCategory;
  aiExposureScore?: number | null; // 0-1, from Anthropic Economic Index
  aiImpactLabel?: "low" | "medium" | "high" | null;
  annotationSource?: "expert-heuristic" | "empirical-data" | "ai-assisted";
  annotationConfidence: AnnotationConfidence;
  lastReviewedAt: string; // ISO date
  marketOutlook?: {
    trend: "growing" | "stable" | "transforming" | "emerging";
    label_zh: string;
    label_en: string;
    note_zh?: string;
    note_en?: string;
    source: string;
    lastUpdated?: string;
  };
  resilienceScore?: number;
  resilienceLevel?: number; // 0-3: 0=highly vulnerable, 1=vulnerable, 2=resilient, 3=highly resilient
  /** O*NET Job Zone (2-5). Indicates required preparation level: 2=little/some,
   *  3=medium, 4=considerable (bachelor's), 5=extensive (graduate). Null when
   *  unclassified (legacy data). Used by tier-aware ranking in engine.ts. */
  jobZone?: number | null;
  deprecationStatus?: "active" | "warning" | "sunset" | "retired";
  sunsetDate?: string; // ISO date
}

/** Filter career directions by industry preference */
export function filterByIndustry(
  directions: CareerDirectionTemplate[],
  industries: string[],
): CareerDirectionTemplate[] {
  if (industries.length === 0 || industries.includes("recommend_for_me")) {
    return directions;
  }
  return directions.filter((d) =>
    d.industries.some((i) => industries.includes(i)),
  );
}

/** Filter career directions by seniority years */
export function filterBySeniority(
  directions: CareerDirectionTemplate[],
  years: number,
): CareerDirectionTemplate[] {
  return directions.filter(
    (d) =>
      d.seniorityRange &&
      years >= d.seniorityRange.minYears &&
      years <= d.seniorityRange.maxYears,
  );
}

// ========== Archetype Map Entry ==========

export interface ArchetypeMapEntry {
  label_zh: string;
  label_en: string;
  tagline_zh: string;
  tagline_en: string;
}

// ========== Profile Algorithm Output ==========

/**
 * ProfileAlgorithmOutput — computed personality/values/interest profile
 * from the assessment pipeline (IPIP Big Five, Schwartz values, RIASEC, SJT).
 * Formerly Panel2AlgorithmOutput; renamed as part of Profile/Report split.
 */
export interface ProfileAlgorithmOutput {
  archetype: ArchetypeRef;
  archetypeContent: ArchetypeContentRef | null;
  riasecRadar: {
    build: number;
    decode: number;
    create: number;
    connect: number;
    drive: number;
    structure: number;
  };
  cognitiveStyleCode: string | null;
  cognitiveStyleDisplayMode: CognitiveStyleDisplayMode;
  cognitiveStyleDimensions: CognitiveStyleCode["dimensions"];
  cognitiveStyleConfidence: number;
  // Big Five facets (IPIP-NEO-120, IPIP-60, or IPIP-30)
  bigFiveDomains: Record<BigFiveDimension, number>; // 0-100 normalized
  bigFiveFacets: Record<string, number>; // 1-5 scale, 30 facets
  bigFivePrecision: "full" | "standard" | "screening"; // 'full' = IPIP-120, 'standard' = IPIP-60, 'screening' = IPIP-30
  // Facet pairs: structured per-domain facet data for narrative generation
  bigFiveFacetPairs: Array<{
    domain: BigFiveDimension;
    facet: string; // e.g. 'N1_Anxiety', 'E3_Assertiveness'
    score: number; // 1-5 scale (mean of item pair for IPIP-60)
    deviationFromMean: number; // distance from domain mean, for identifying extreme facets
  }>;
  // Schwartz higher-order polarity (from TwIVI, used as narrative layer, not for archetype determination)
  polarityContext: {
    otcScore: number; // higher-order Openness-to-Change centered score
    conScore: number; // higher-order Conservation centered score
    polarity: "explore" | "anchor"; // OTC > CON → 'explore', else 'anchor'
    polarityStrength: "strong" | "moderate" | "weak";
  };
  // Schwartz values (PVQ-21 or TwIVI, ipsative centered)
  schwartz: {
    raw: Record<SchwartzValue, number>;
    centered: Record<SchwartzValue, number>;
    ranking: SchwartzValue[];
    top3: SchwartzValue[];
  };
  // SJT Should-Would tensions
  sjtTensions: {
    scenarios: SJTTensionScore[];
    overallConsistency: number;
    notableTensions: string[];
  };
}

// ========== Report UI Types ==========

/** Locale-aware dictionary accessor for report panel strings */
export type ReportDict = Record<string, string>;
