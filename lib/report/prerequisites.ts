// ============================================================
// Report Prerequisites — Gate + Staleness Detection
//
// 1. checkPrerequisites(): determines if report can be generated
//    and whether optional data (reality conditions) is missing
// 2. computeInputHash(): deterministic hash of all report inputs,
//    stored in CareerReport.inputHash for staleness detection
// 3. isReportStale(): compares stored hash with current inputs
// ============================================================

import { createHash } from 'crypto';
import type { RealConditions } from '@/lib/types/platform';

// ── Prerequisites Gate ───────────────────────────────────────

export interface ReportPrerequisites {
  /** All required inputs are present */
  canGenerate: boolean;
  /** Reality conditions were skipped — report will be less personalized */
  missingConditions: boolean;
  /** Assessment ID (required) */
  assessmentId: string | null;
}

export function checkPrerequisites(opts: {
  assessmentId: string | null;
  hasProfile: boolean;
  realConditions: RealConditions | null;
}): ReportPrerequisites {
  return {
    canGenerate: !!opts.assessmentId && opts.hasProfile,
    missingConditions: !opts.realConditions,
    assessmentId: opts.assessmentId,
  };
}

// ── Input Hash for Staleness Detection ───────────────────────

/**
 * Compute a deterministic hash of all inputs that affect report content.
 * If any of these change after report generation, the report is stale.
 *
 * Inputs: assessmentId + RIASEC scores + reality conditions.
 * RIASEC can change when user retakes Quick Dive (partial rescore).
 */
export function computeInputHash(opts: {
  assessmentId: string;
  realConditions: RealConditions | null;
  riasecNormalized?: Record<string, number> | null;
}): string {
  const payload = JSON.stringify({
    a: opts.assessmentId,
    c: opts.realConditions ?? null,
    r: opts.riasecNormalized ?? null,
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

// ── Staleness Check ──────────────────────────────────────────

export type ReportFreshness = 'fresh' | 'stale' | 'missing';

export function checkReportFreshness(
  storedHash: string | null | undefined,
  currentHash: string,
): ReportFreshness {
  if (!storedHash) return 'missing';
  return storedHash === currentHash ? 'fresh' : 'stale';
}
