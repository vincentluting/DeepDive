// ============================================================
// Deep Dive — Resume Upload & Re-matching Barrel Export
// ============================================================

export type {
  ResumeData,
  ResumeExperience,
  ResumeEducation,
  ResumeLanguage,
  ResumeMatchResult,
  AlignedDimension,
  ConflictingDimension,
} from './types';

export { parseResume } from './parse-resume';
export { matchResumeToAssessment } from './match-resume';
