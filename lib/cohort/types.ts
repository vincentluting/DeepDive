// ============================================================
// Cohort Journey System — Type Definitions
// ============================================================

/** Ordered steps a cohort user may need to complete */
export type CohortJourneyStep =
  | "pre_assessment"
  | "quick_dive"
  | "deep_dive"
  | "coaching"
  | "post_immediate"
  | "post_1week";

/** Feature entitlements granted by a cohort */
export interface CohortEntitlements {
  /** Can access Immersive Dive experience */
  immersiveDive: boolean;
  /** Can access 86-question Deep Dive */
  deepDive: boolean;
  /** Can generate AI Profile (identity narratives) */
  aiProfile: boolean;
  /** Can generate Career Report */
  aiReport: boolean;
  /** Can use AI Coaching */
  aiCoaching: boolean;
  /** Coaching messages per day (null = unlimited) */
  coachingDailyLimit: number | null;
  /** Must sign research informed consent */
  requireResearchConsent: boolean;
  /** Shows research surveys (SCC, pre/post assessments) */
  researchSurveys: boolean;
  /** Can use resume-enhanced report generation (depth dialog + regenerate) */
  resumeEnhancement: boolean;
  /** Can opt into Archetype Companion (social discovery + friend connections) */
  socialFeatures: boolean;
}

/** Configuration for a single cohort journey */
export interface CohortJourneyConfig {
  /** Human-readable name (admin display) */
  displayName: string;
  /** Brief description */
  description: string;
  /** Ordered list of steps in this journey */
  steps: CohortJourneyStep[];
  /** Whether this cohort's data is research-tracked */
  trackingEnabled: boolean;
  /**
   * If set, users enrolling in this cohort are auto-assigned this
   * researchGroup value (for Quick Dive A/B testing).
   * Set to 'random' to randomly assign 'classic' or 'immersive'.
   */
  autoAssignResearchGroup?: "classic" | "immersive" | "random";
  /** Feature access granted to users in this cohort */
  entitlements: CohortEntitlements;
}

/** Map of cohort IDs to their journey configs */
export type CohortConfigMap = Record<string, CohortJourneyConfig>;

/** Computed journey progress for a user in a cohort */
export interface CohortJourneyProgress {
  cohortId: string;
  completedSteps: CohortJourneyStep[];
  currentStep: CohortJourneyStep | null;
  isComplete: boolean;
  progressPercent: number;
}
