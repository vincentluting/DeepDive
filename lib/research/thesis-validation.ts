// ============================================================
// Thesis data validation — pure functions shared by the CLI
// (`npm run verify:thesis` → scripts/verify-thesis-data.ts) and the
// admin Data Quality panel (GET /api/admin/research-quality).
//
// Keeping one implementation guarantees the web panel and the CLI can
// never disagree about what counts as a data-quality issue.
// ============================================================

export type ThesisIssueSeverity = "error" | "warning" | "info";

export interface ThesisIssue {
  userId: string;
  email: string;
  severity: ThesisIssueSeverity;
  category: string;
  message: string;
}

export interface ResearchChainRow {
  userId: string;
  email: string;
  researchGroup: string | null;
  researchConsentAt: string | null;
  hasConsentRecord: boolean;
  hasActiveConsentRecord: boolean;
  isAdmin: boolean;
  t0At: string | null;
  t1At: string | null;
  t2At: string | null;
  coachingSessionCount: number;
  reminderLogStatus: "none" | "claimed" | "sent" | "failed";
}

export interface ResearchSummary {
  totalResearch: number;
  consentedUsers: number;
  t0Count: number;
  t1Count: number;
  t2Count: number;
  fullChain: number;
  invalidT2Timing: number;
  missingT2Due: number;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Validate one participant's research chain (consent audit ↔ timestamps,
 * T0/T1/T2 ordering, the T2 ≥ T1+7d protocol rule, reminder hygiene).
 */
export function validateResearchChain(
  row: ResearchChainRow,
  nowMs: number = Date.now(),
): ThesisIssue[] {
  const issues: ThesisIssue[] = [];
  const ctx = { userId: row.userId, email: row.email };

  const hasConsentEvidence = row.hasConsentRecord || row.hasActiveConsentRecord;
  const hasConsentTimestamp = row.researchConsentAt !== null;

  // 1. Timestamp vs audit record mismatch
  if (hasConsentTimestamp && !hasConsentEvidence) {
    issues.push({
      ...ctx,
      severity: "error",
      category: "research-consent",
      message:
        "User.researchConsentAt set but no ConsentRecord audit row (GDPR evidence missing)",
    });
  }
  if (hasConsentEvidence && !hasConsentTimestamp) {
    issues.push({
      ...ctx,
      severity: "error",
      category: "research-consent",
      message: "ConsentRecord present but User.researchConsentAt is NULL",
    });
  }

  // 2. T0 without consent evidence
  if (row.t0At && !hasConsentEvidence && !hasConsentTimestamp) {
    issues.push({
      ...ctx,
      severity: "error",
      category: "research-consent",
      message: "T0 (pre) assessment recorded but no consent evidence found",
    });
  }

  // 3. Consent given but no T0 after sufficient delay
  if (hasConsentTimestamp && !row.t0At && row.researchConsentAt) {
    const consentAge = nowMs - new Date(row.researchConsentAt).getTime();
    if (consentAge > ONE_DAY_MS) {
      issues.push({
        ...ctx,
        severity: "info",
        category: "research-t0",
        message: `Consented ${Math.round(consentAge / ONE_DAY_MS)}d ago but no T0 recorded (user dropped before pre-assessment)`,
      });
    }
  }

  // 4. T1 but no coaching session (design expectation)
  if (row.t1At && row.coachingSessionCount === 0) {
    issues.push({
      ...ctx,
      severity: "warning",
      category: "research-t1",
      message:
        "T1 (post_immediate) recorded but user never used coaching (experience treatment incomplete)",
    });
  }

  // 5. T2 earlier than T1 + 7 days → invalid sample
  if (row.t1At && row.t2At) {
    const t1Ms = new Date(row.t1At).getTime();
    const t2Ms = new Date(row.t2At).getTime();
    if (t2Ms < t1Ms + SEVEN_DAYS_MS) {
      const delayDays = Math.round((t2Ms - t1Ms) / ONE_DAY_MS);
      issues.push({
        ...ctx,
        severity: "error",
        category: "research-t2",
        message: `T2 completed only ${delayDays}d after T1 (must be ≥7d; sample invalid)`,
      });
    }
  }

  // 6. T1 ≥7 days old, T2 missing, no reminder claimed
  if (row.t1At && !row.t2At) {
    const t1Age = nowMs - new Date(row.t1At).getTime();
    if (t1Age >= SEVEN_DAYS_MS) {
      const ageDays = Math.round(t1Age / ONE_DAY_MS);
      if (row.reminderLogStatus === "none") {
        issues.push({
          ...ctx,
          severity: "warning",
          category: "research-reminder",
          message: `T1 is ${ageDays}d old, T2 missing, and no reminder log row — daily cron may not be running`,
        });
      } else if (row.reminderLogStatus === "failed") {
        issues.push({
          ...ctx,
          severity: "error",
          category: "research-reminder",
          message: `T1 is ${ageDays}d old, T2 missing, reminder send failed — manual follow-up required`,
        });
      }
    }
  }

  return issues;
}

export function computeResearchSummary(
  rows: ResearchChainRow[],
  nowMs: number = Date.now(),
): ResearchSummary {
  let consented = 0;
  let t0 = 0;
  let t1 = 0;
  let t2 = 0;
  let full = 0;
  let invalidT2 = 0;
  let missingT2Due = 0;
  for (const row of rows) {
    if (row.researchConsentAt || row.hasConsentRecord) consented += 1;
    if (row.t0At) t0 += 1;
    if (row.t1At) t1 += 1;
    if (row.t2At) t2 += 1;
    if (row.t0At && row.t1At && row.t2At) full += 1;
    if (row.t1At && row.t2At) {
      const t1Ms = new Date(row.t1At).getTime();
      const t2Ms = new Date(row.t2At).getTime();
      if (t2Ms < t1Ms + SEVEN_DAYS_MS) invalidT2 += 1;
    }
    if (row.t1At && !row.t2At) {
      const t1Age = nowMs - new Date(row.t1At).getTime();
      if (t1Age >= SEVEN_DAYS_MS) missingT2Due += 1;
    }
  }
  return {
    totalResearch: rows.length,
    consentedUsers: consented,
    t0Count: t0,
    t1Count: t1,
    t2Count: t2,
    fullChain: full,
    invalidT2Timing: invalidT2,
    missingT2Due,
  };
}
