// ============================================================
// Document Upload — Type Definitions
// ============================================================

// Currently only resume is supported
export type DocumentSourceType = 'resume';

// ─── Result type ────────────────────────────────────────────

export type DocumentUploadResult = {
  type: 'resume';
  data: import('@/lib/resume/types').ResumeMatchResult;
};
