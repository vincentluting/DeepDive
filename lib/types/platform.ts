// ============================================================
// Deep Dive — Platform & Infrastructure Type Definitions
// ============================================================

import type {
  RIASECDimension,
  BigFiveDimension,
  Archetype,
  CognitiveStyleDisplayMode,
  CognitiveStyleDimensionInfo,
  CollabMapping,
  SchwartzAnchorsResult,
  SchwartzConflictPair,
  SchwartzValue,
  CrossCulturalType,
} from "./dimensions";

import type { AnswerValue, ModuleCode } from "./questionnaire";

// ========== Real Conditions ==========

export interface RealConditions {
  // === Education & experience (kept for backward compat, optional) ===
  education: {
    level: "high_school" | "bachelor" | "master" | "phd" | "other";
    field: string;
  };
  experienceYears: number; // slider: 0-30
  pastIndustries: string[];

  // === Geography & visa ===
  currentCountry?: string; // country code (e.g. 'US', 'NL')
  currentCity: string;
  targetCountry?: string; // country code for target city filtering
  targetCities: string[]; // includes "remote" option
  visaStatus:
    | "citizen"
    | "permanent_resident"
    | "work_visa"
    | "student_visa"
    | "job_seeker_visa"
    | "dependent_visa"
    | "undocumented"
    | "other"
    | "";

  // New: specific visa type (shown when visaStatus is not citizen/PR)
  visaType?: string; // free text, e.g. "H1B", "Skilled Worker", "zoekjaar"

  // New: work permit restrictions
  workRestrictions: {
    canWorkFullTime: boolean;
    sponsorshipRequired: boolean; // needs employer visa sponsorship
    occupationRestricted: boolean; // limited to specific occupations
    occupationNote?: string; // if restricted, explanation (max 80 chars)
  };

  // === Languages ===
  workLanguages: Array<{
    language: string;
    proficiency: "native" | "fluent" | "professional" | "basic";
  }>;

  // === Location flexibility ===
  locationFlexibility:
    | "stay-local"
    | "relocate-home"
    | "relocate-other"
    | "remote-global"
    | "open";

  // If considering relocation, timeline
  relocationTimeline?: "1year" | "2-3years" | "5years" | "indefinite";

  // === Family ===
  familyConstraints: {
    hasPartner: boolean;
    partnerWorkRestriction: boolean;
    hasDependents: boolean;
  };

  // New: economic constraints
  economicConstraints: {
    salaryFloor?: "critical" | "important" | "flexible";
    canRelocate: boolean;
    willingToRetrain: boolean; // willing to train/certify for new career
  };

  // === Preferences (kept for backward compat) ===
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  workType: "fulltime" | "parttime" | "freelance" | "open";
  officeMode: "remote" | "hybrid" | "onsite" | "open";

  // === Industry exploration ===
  /** User's current industry (structured, from INDUSTRIES constant) */
  currentIndustry?: string;
  /** How satisfied with current industry (1-5, higher = more satisfied) */
  industrySatisfaction?: number;
  /** Career change urgency */
  careerChangeUrgency?: "exploring" | "considering" | "urgent";
  interestedIndustries: string[]; // includes "recommend_for_me"
  openToCareerChange: "yes" | "no" | "open";
  industryBackground?: string;

  // External expectations (family, social, cultural pressure on career choices)
  culturalIdentity: {
    externalExpectationPressure: "high" | "medium" | "low" | "none";
    externalExpectationNote?: string; // specific expectation detail (max 80 chars, optional)
  };
}

// ========== Social Style (Kramlinger 2×2: E×A from Big Five) ==========

export interface SocialStyleResult {
  /** Primary style: Analytical, Driver, Amiable, Expressive */
  style: "analytical" | "driver" | "amiable" | "expressive";
  /** Extraversion score (0-100, maps to Ask↔Tell axis) */
  extraversionScore: number;
  /** Agreeableness score (0-100, maps to Task↔People axis) */
  agreeablenessScore: number;
  /** How to communicate with this person */
  commTip: { en: string; zh: string };
}

// ========== Leadership Style (Goleman 6 styles from DISC + Big Five) ==========

export type LeadershipStyleType =
  | "visionary"
  | "coaching"
  | "affiliative"
  | "democratic"
  | "pacesetting"
  | "commanding";

export interface LeadershipStyleResult {
  /** Primary leadership style */
  primary: LeadershipStyleType;
  /** Secondary style (if close) */
  secondary?: LeadershipStyleType;
  /** Score per style (0-100) */
  scores: Record<LeadershipStyleType, number>;
}

// ========== Interpersonal Energy Spectrum (IPC-inspired: Agency × Communion) ==========

export interface InterpersonalEnergySpectrum {
  /** Agency axis (0-100): drive to lead, assert, influence */
  agency: number;
  /** Communion axis (0-100): drive to connect, support, empathize */
  communion: number;
  /** IPC quadrant label */
  quadrant:
    | "assured-warm"
    | "assured-reserved"
    | "unassuming-warm"
    | "unassuming-reserved";
  /** How social energy recharges */
  energyMode: "amplifier" | "curator" | "observer";
  /** Facet-level data used for derivation */
  derivedFrom: {
    E1: number;
    E2: number;
    E3: number;
    A3: number;
    A5: number;
    A6: number;
    N4: number;
  };
}

// ========== Conflict Handling Style (TKI: Assertiveness × Cooperativeness) ==========

export type ConflictMode =
  | "competing"
  | "collaborating"
  | "compromising"
  | "avoiding"
  | "accommodating";

export interface ConflictHandlingProfile {
  /** Assertiveness axis (0-100) */
  assertiveness: number;
  /** Cooperativeness axis (0-100) */
  cooperativeness: number;
  /** Dominant conflict mode */
  dominant: ConflictMode;
  /** Secondary mode (if within 8 pts of dominant) */
  secondary?: ConflictMode;
  /** Score per mode (0-100) */
  modeScores: Record<ConflictMode, number>;
  /** Facet-level data used for derivation */
  derivedFrom: {
    E3: number;
    A3: number;
    A4: number;
    A5: number;
    N4: number;
    O_domain: number;
  };
}

// ========== Core Qualities (Ofman quadrant model from Big Five facets) ==========

/** A single Ofman quadrant: Core Quality → Pitfall → Challenge → Allergy */
export interface CoreQualityQuadrant {
  /** Big Five facet key (e.g. 'E3_Assertiveness') */
  facet: string;
  /** Parent Big Five domain */
  domain: string;
  /** Whether this is derived from a HIGH or LOW score */
  direction: "high" | "low";
  /** Facet score (1-5 scale) */
  score: number;
  /** Deviation from domain mean */
  deviation: number;
  /** Four quadrant labels (bilingual) */
  coreQuality: { en: string; zh: string };
  pitfall: { en: string; zh: string };
  challenge: { en: string; zh: string };
  allergy: { en: string; zh: string };
}

// ========== Shadow Insights (Jungian framing of Big Five low dimensions) ==========

export interface ShadowInsight {
  /** The Big Five domain key (e.g. 'extraversion') */
  facet: string;
  /** Parent Big Five dimension */
  domain:
    | "openness"
    | "conscientiousness"
    | "extraversion"
    | "agreeableness"
    | "neuroticism";
  /** Normalized score 0-100 */
  score: number;
  /** Poetic shadow label — the Jungian name for this undeveloped dimension */
  shadowLabel_zh: string;
  shadowLabel_en: string;
  /** When this "undeveloped" trait is actually an advantage */
  contextualStrength_zh: string;
  contextualStrength_en: string;
  /** How to develop without forcing */
  integrationHint_zh: string;
  integrationHint_en: string;
  /** Career contexts where this dimension's "shadow" is advantageous */
  relatedCareerContexts: string[];
  /** Spectrum bar labels (low end / high end of this dimension) */
  spectrumLowLabel: { zh: string; en: string };
  spectrumHighLabel: { zh: string; en: string };
  /** Cross-framework tension, if detected */
  tensionWith?: {
    framework: "riasec" | "schwartz";
    dimension: string;
    description_zh: string;
    description_en: string;
  };
}

export interface ShadowInsights {
  /** 2-3 most significant shadow dimensions */
  shadows: ShadowInsight[];
  /** 1-2 sentence synthesis of the overall shadow pattern */
  overallPattern_zh: string;
  overallPattern_en: string;
}

// ========== Meaning Compass (Schwartz E/T axis × Ikigai overlap × value tensions) ==========

/** Which of the three Ikigai circles this item participates in. */
export type IkigaiCircle = "love" | "goodAt" | "need";

/**
 * A single meaning-anchor item. Same themeKey can appear in multiple circles
 * (that's how overlap works — overlap = items with circles.length >= 2).
 */
export interface IkigaiItem {
  /** Stable theme identifier used to detect cross-framework overlap */
  themeKey: string;
  /** Bilingual labels (en/zh always present; other locales fall back to en) */
  label_en: string;
  label_zh: string;
  /** Which Ikigai circles this item participates in */
  circles: IkigaiCircle[];
  /** Source frameworks contributing to this item */
  sources: Array<"schwartz" | "riasec" | "collab">;
}

/**
 * MeaningCompass — Schwartz E/T axis lifted from a one-line subtitle into a full chapter.
 *
 * Layer-A psychology only:
 * - pole comes from validated TwIVI E↔T axis (no Frankl derivation)
 * - keystones are top-3 Schwartz values + Big Five "coloring" tag for narrative use
 * - ikigai is openly framed as a "value-projection exercise," not measurement
 * - meaningTension reuses detectSchwartzConflict, repackaged as meaning-framed view
 *
 * Frankl's three currents (creative / experiential / attitudinal) are intentionally
 * NOT algorithmized — they appear only as narrative scaffolding in the LLM layer.
 */
export interface MeaningCompass {
  /** E/T axis pole + visualization data */
  pole: {
    axis: "enhancement" | "transcendence";
    /** 0..1 — confidence in the dominant pole based on E↔T gap */
    strength: number;
    /** -1 (full enhancement) to +1 (full transcendence), for spectrum bar */
    spectrumPosition: number;
  };

  /** Top-3 Schwartz value anchors with Big Five coloring tag for narrative */
  keystones: Array<{
    schwartzKey: SchwartzValue;
    label_en: string;
    label_zh: string;
    /** Hint for narrative writer, e.g. "high_extraversion", "high_openness" */
    bigFiveColoring: string;
  }>;

  /** Ikigai three circles + cross-framework overlap detection */
  ikigai: {
    love: IkigaiItem[];
    goodAt: IkigaiItem[];
    need: IkigaiItem[];
    /** Items that appear in >= 2 circles — the "ikigai zone" */
    overlap: IkigaiItem[];
  };

  /** Reuses detectSchwartzConflict; repackaged for meaning-framed narrative */
  meaningTension: {
    pair: SchwartzConflictPair | null;
    /** How to surface this tension in narrative — null when no conflict */
    surfacedAs: "creative_vs_experiential" | "agency_vs_acceptance" | null;
  };
}

// ========== Personal Profile (DB Layer) ==========

export interface PersonalProfileData {
  id: string;
  assessmentId: string;
  userId?: string;
  /** JSON shape contract for profileJson. */
  profileSchemaVersion?: string;
  /** Pure algorithm contract used to derive algoSnapshot and derived cards. */
  algorithmVersion?: string;
  /** Fingerprint of inputs that affect algorithmic profile insights. */
  profileInputHash?: string;
  archetype: Archetype;
  cognitiveStyleCode: string | null;
  cognitiveStyleDisplayMode: CognitiveStyleDisplayMode;
  collabMapping: CollabMapping; // Collaboration Style derived from Big Five
  schwartzAnchors: SchwartzAnchorsResult;
  crossCultural: {
    type: CrossCulturalType | null; // nullable (CC questions not collected)
    label_zh: string | null; // nullable (CC questions not collected)
  };
  riasecScores?: Record<RIASECDimension, number>;
  confidenceMap: Record<string, number>;

  // === Extended data (v6.0+) ===
  /** Big Five normalized scores (0-100) — for personality visualization */
  bigFiveScores?: Record<BigFiveDimension, number>;
  /** Cognitive style 4-axis dimensional breakdown */
  cognitiveStyleDimensions?: Record<
    "EI" | "SN" | "TF" | "JP",
    CognitiveStyleDimensionInfo
  >;
  /**
   * Schema version for cognitiveStyleDimensions.score units.
   *   undefined / 1 → legacy raw 1-5 Big Five domain mean (pre 2026-05-10)
   *   2             → 0-100 normalized, EI/JP forward + SN/TF reverse
   * normalize-profile reads this to decide whether lazy migration runs.
   */
  cognitiveStyleSchemaVersion?: number;
  /** Cognitive style model confidence (0-1, expressed as a fraction). UI multiplies by 100 for display. */
  cognitiveStyleConfidence?: number;
  /** Response quality metadata from assessment */
  qualityMeta?: {
    totalTimeMs: number;
    rushCount: number;
    hesitationCount: number;
    totalQuestions: number;
    answeredQuestions: number;
  };

  /** SJT behavioral consistency index from assessment */
  sjtBehavioralConsistency?: {
    overallConsistency: number; // 0-1 from assessment.tensions.overallConsistency
    notableTensions: string[]; // from assessment.tensions.notableTensions
    scenarioCount: number; // 6
  };

  /** Shadow insights (Jungian framing of Big Five low dimensions) — computed during profile generation */
  shadowInsights?: ShadowInsights;

  /** Ofman Core Qualities quadrants — computed from Big Five facets during profile generation */
  coreQualities?: CoreQualityQuadrant[];

  /** Social Style (Kramlinger 2×2) — derived from Big Five E×A during profile generation */
  socialStyle?: SocialStyleResult;

  /** Leadership Style (Goleman 6 styles) — derived from Big Five + DISC during profile generation */
  leadershipStyle?: LeadershipStyleResult;

  /** Interpersonal Energy Spectrum (IPC-inspired) — derived from Big Five facets during profile generation */
  interpersonalEnergy?: InterpersonalEnergySpectrum;

  /** Conflict Handling Style (TKI 5 modes) — derived from Big Five facets during profile generation */
  conflictHandling?: ConflictHandlingProfile;

  /**
   * Meaning Compass — Schwartz E/T axis × top-3 keystones × Ikigai overlap × value tension.
   * Pure algorithm (no LLM); narrative is in narrativeSnapshots.meaningCompassNarrative.
   * Computed during profile generation. Existing pre-v3.1 profiles lack this — guard with `?`.
   */
  meaningCompass?: MeaningCompass;

  /**
   * LLM-generated narrative interpretations of the profile data.
   *
   * v3.0+: Generated directly during profile generation (1-2 LLM calls).
   * Pre-v3.0: Backfilled from career report Panel 2 narratives.
   *
   * This is the primary home for all identity/personality narratives.
   * The career report references the profile but does not duplicate these.
   */
  narrativeSnapshots?: {
    /** Archetype narrative — the "this is who you are" story */
    archetypeNarrative?: string;
    /** Big Five narrative — personality dynamics explanation */
    bigFiveNarrative?: string;
    /** SJT tension narrative — should vs would analysis */
    sjtTensionNarrative?: string;
    /** Schwartz value narrative — value interpretation */
    valueNarrative?: string;
    /** Cross-dimension synthesis — how frameworks connect */
    crossDimensionNarrative?: string;
    /** Identity summary — 2-3 sentence core identity statement */
    identitySummary?: string;
    /** Growth map narrative — interpretive layer for inner tensions tab */
    growthMapInsight?: string;
    /**
     * Meaning Compass narrative — the "why you live this way / what you'd regret" letter.
     * Speaks in the language of values, currents, and what-you-would-regret.
     * MUST NOT restate archetype label or RIASEC behavior scenes (handled by archetypeNarrative).
     * Generated lazily on first Ch3 visit (most users never reach Ch3, so eager
     * generation would waste ~30% of the soul-call output budget). Until then,
     * MeaningCompass renders an algorithmic empty-state copy.
     */
    meaningCompassNarrative?: string;
    /** @deprecated v3.0 — use identitySummary. Kept for backward compat with pre-v3.0 profiles. */
    coreInsight?: string;
    /** @deprecated v3.0 — letterToUser now lives in CareerReport.integration only. */
    letterToUser?: string;
    /** @deprecated v3.0 — careerDrain now lives in CareerReport only. */
    careerDrainSummary?: string;
    /** Timestamp when narratives were generated or populated */
    populatedAt?: string;
    /** Locale used to generate identity narratives. */
    narrativeLocale?: string;
    /** Fingerprint of profile inputs + locale used by identity narratives. */
    narrativeInputHash?: string;
    /** Timestamp when narrative generation permanently failed (all retries exhausted) */
    failedAt?: string;
  };

  /**
   * Cached ProfileAlgorithmOutput snapshot.
   * Stored so the career report pipeline can read it directly
   * instead of recomputing from the assessment.
   * Excludes archetypeContent (static, looked up from content library).
   */
  algoSnapshot?: Omit<
    import("./report").ProfileAlgorithmOutput,
    "archetypeContent"
  >;

  version: string;
  createdAt: string;
  updatedAt: string;
}

// ========== Session Types ==========

export interface SessionQuestionAnswer {
  /** Optional — v2 store uses questionIndex + moduleCode + itemId instead */
  questionId?: string;
  value: AnswerValue;
  responseTimeMs: number;
  timestamp: number;
  questionIndex?: number;
  moduleCode?: string;
  itemId?: number;
  /** Preserved across reconsider-flow rewrites so research analysis keeps the first-reaction signal. */
  firstResponseTimeMs?: number;
  /** Number of times the user has revised this item (undefined or 0 for un-revised). */
  revisionCount?: number;
}

export interface QuestionnaireSession {
  id: string;
  userId?: string;
  tier: "quick" | "deep" | "ultra";
  language: string;
  answers: SessionQuestionAnswer[];
  startedAt: number;
  completedAt?: number;
  totalTimeMs?: number;
  currentModule: ModuleCode;
  currentQuestionIndex: number;
  answerAssistantEnabled: boolean;
  explorationProgress?: Record<string, unknown>;
}

// ========== Assessment Completion Registry ==========

/** All assessment types tracked by AssessmentCompletion table */
export type AssessmentType =
  | "quick_dive"
  | "immersive_dive"
  | "deep_dive"
  | "ultra_deep_dive"
  | "pvq_quick";

// ========== Research Schema Types ==========

/** Assessment time point type for PrePostAssessment table */
export type PrePostAssessmentType = "pre" | "post_immediate" | "post_1week";

/**
 * experienceFeedback JSONB schema for PrePostAssessment.
 * Post measurements: Trust/UES/Constraints/Features/DR-3.
 * Pre measurement: demographics (demo_age, demo_employment, demo_experience).
 */
export interface ExperienceFeedback {
  // Demographics (T0 pre only — 4 select items per Research Survey v5.2)
  demo_age?: string;
  demo_gender?: string;
  demo_employment?: string;
  demo_experience?: string;

  // Q1: Trust & Psychological Safety (5 items, 1-5 Likert)
  trust_willing_to_disclose?: number;
  trust_felt_understood?: number;
  trust_comfortable_sharing?: number;
  trust_ai_competence?: number;
  trust_emotional_safety?: number;

  // Q2: Real-World Constraints Confidence (3 items, 1-5 Likert)
  constraints_adequately_considered?: number;
  constraints_increased_confidence?: number;
  constraints_actionable?: number;

  // Attention check (T1 only, 1 item, 1-5 Likert; expected value = 4)
  attn_check_1?: number;

  // Q3: Feature Attribution (ranking only — fc_* Likert deprecated 2026-03-22)
  most_valuable_features?: Array<
    "quick_dive" | "profile" | "deep_dive_report" | "ai_coach" | "action_hub"
  >;
  feature_ranking?: string[];

  // UES-SF-12: User Engagement Scale (12 items, 1-5 Likert; ux4/5/6 reverse-scored)
  ux1?: number;
  ux2?: number;
  ux3?: number;
  ux4?: number;
  ux5?: number;
  ux6?: number;
  ux7?: number;
  ux8?: number;
  ux9?: number;
  ux10?: number;
  ux11?: number;
  ux12?: number;

  // DR-3: Delayed Reflection (3 items, T2 only)
  delayed_continued_thinking?: number;
  delayed_took_action?: number;
  delayed_perspective_shift?: number;

  // Open feedback
  comments?: string;

  // Legacy / general fields
  clarity?: number;
  usefulness?: number;
}
