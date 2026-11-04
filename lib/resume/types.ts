// ============================================================
// Deep Dive — Resume Upload & Re-matching Type Definitions
// ============================================================

import type { RealConditions } from "@/lib/types";

// ========== Parsed Resume Data ==========

export interface ResumeExperience {
  title: string;
  company: string;
  industry: string;
  durationMonths: number;
  responsibilities: string[];
}

export interface ResumeEducation {
  degree: string;
  field: string;
  institution: string;
}

export interface ResumeLanguage {
  language: string;
  proficiency: "native" | "fluent" | "professional" | "basic";
}

export interface ResumeData {
  experience: ResumeExperience[];
  skills: string[];
  languages: ResumeLanguage[];
  industries: string[];
  education: ResumeEducation[];
  yearsOfExperience: number;
  seniority: "entry" | "mid" | "senior" | "executive" | "unknown";
}

// ========== Resume Match Result ==========

export interface AlignedDimension {
  dimension: string;
  assessmentSignal: string;
  resumeEvidence: string;
  confidenceBoost: number;
}

export interface ConflictingDimension {
  dimension: string;
  assessmentSignal: string;
  resumeEvidence: string;
  tensionInsight_zh: string;
  tensionInsight_en: string;
}

/** Inferred from the resume — anchors career match `targetTier` so
 *  recommendations match the user's existing professional level + one tier
 *  of upward stretch. Optional: present only when seniority can be inferred. */
export interface UserTargetTier {
  /** Current O*NET Job Zone (2-5) based on most-recent work + education. */
  currentTier: number;
  /** Aspirational tier — typically currentTier or currentTier+1. */
  aspirationalTier: number;
  /** Effective band fed into engine: [currentTier-1, aspirationalTier]
   *  clamped to [2,5]. Gives one tier of downward flexibility. */
  min: number;
  max: number;
  /** 0-1 self-reported confidence based on signal strength. */
  confidence: number;
  /** One-sentence justification (locale-agnostic). */
  reasoning: string;
}

export interface ResumeMatchResult {
  alignedDimensions: AlignedDimension[];
  conflictingDimensions: ConflictingDimension[];
  autoFillRealConditions: Partial<
    Pick<
      RealConditions,
      "workLanguages" | "pastIndustries" | "experienceYears" | "education"
    >
  >;
  summary_zh: string;
  summary_en: string;
  /** Inferred user target Job Zone band. Optional — older rows may lack it. */
  userTargetTier?: UserTargetTier;
}
