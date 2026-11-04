// ============================================================
// Deep Dive — Thesis Data Integrity Verification Script
//
// Connects to the database and validates the data completeness
// chain for each user relevant to thesis research export:
//
//   User → QuestionnaireSession → AssessmentResult → CareerReport
//                                                   → ReportEngagement
//                                                   → ReportReaction
//                                                   → ReportNPS
//
// Flags users with broken data chains, missing expected records,
// or anomalous values.
//
// Usage:
//   npx tsx scripts/verify-thesis-data.ts                   # all users, no PII in output
//   npx tsx scripts/verify-thesis-data.ts --research-only   # research participants only
//   npx tsx scripts/verify-thesis-data.ts --with-pii        # include email in output (default: off)
//   npx tsx scripts/verify-thesis-data.ts --verbose         # per-user details
//   npx tsx scripts/verify-thesis-data.ts --json            # JSON output
//
// Research-chain validation (when --research-only OR research data present):
//   • ConsentRecord but no User.researchConsentAt   → error (audit-timestamp mismatch)
//   • User.researchConsentAt but no ConsentRecord    → error (audit evidence missing)
//   • T0 (pre) but no consent evidence              → error
//   • Consent but no T0 after 24h                   → info (not yet started)
//   • T1 (post_immediate) but no coaching session   → warning
//   • T2 (post_1week) earlier than T1 + 7 days      → error (invalid sample)
//   • T1 ≥ 7 days old, T2 missing, no reminder log  → warning (should have been sent)
// ============================================================

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type SqlFn = NeonQueryFunction<false, false>;

// ── Types ────────────────────────────────────────────────────

interface FunnelEventRow {
  userId: string;
  event: string;
  count: number;
}

interface UserFunnelStatus {
  userId: string;
  email: string;
  hasQuickdiveStarted: boolean;
  hasQuickdiveCompleted: boolean;
  hasImmersiveStarted: boolean;
  hasImmersiveCompleted: boolean;
  hasDeepDiveStarted: boolean;
  hasDeepDiveCompleted: boolean;
  hasReportViewed: boolean;
  isImmersiveMode: boolean;
  hasCoreStartEvent: boolean;
  hasCoreCompleteEvent: boolean;
}

interface UserChainRow {
  userId: string;
  email: string;
  registrationDate: string;
  // Chain presence flags
  hasQuestionnaireSession: boolean;
  questionnaireStatus: string | null;
  questionnaireLanguage: string | null;
  questionnaireTotalTimeMs: number | null;
  hasAssessmentResult: boolean;
  pipelineVersion: string | null;
  assessmentCreatedAt: string | null;
  hasQuickDiveResult: boolean;
  archetypeLabel: string | null;
  hasCareerReport: boolean;
  reportGenerationTimeMs: number | null;
  hasReportEngagement: boolean;
  engagementTotalTimeMs: number | null;
  hasReportReaction: boolean;
  reportReaction: string | null;
  hasReportNPS: boolean;
  npsScore: number | null;
  hasCoachingSession: boolean;
  coachingSessionCount: number;
  hasCoachingFeedback: boolean;
  // Pipeline report status distinguishes "user has not asked for a report yet"
  // (not_requested / null) from genuine pipeline failure.
  pipelineReportStatus: string | null;
}

// Validation logic + research-chain types live in lib/research/
// thesis-validation.ts so the admin Data Quality panel shares the EXACT
// same rules. Re-exported here to keep the script's public API stable.
import {
  validateResearchChain,
  computeResearchSummary,
  type ResearchChainRow,
  type ThesisIssue,
} from "../lib/research/thesis-validation";

export { validateResearchChain, computeResearchSummary };
export type { ResearchChainRow };

type Issue = ThesisIssue;

interface TableCount {
  table: string;
  count: number;
}

interface SummaryStats {
  totalUsers: number;
  withQuestionnaire: number;
  withCompletedQuestionnaire: number;
  withAssessment: number;
  withQuickDive: number;
  withReport: number;
  withEngagement: number;
  withReaction: number;
  withNPS: number;
  withCoaching: number;
  withCoachingFeedback: number;
  fullChainComplete: number;
  // Funnel event integrity
  withAnyFunnelEvent: number;
  withCompleteFunnel: number;
  funnelGaps: number;
}

// ── CLI Arguments ────────────────────────────────────────────

export interface CliOptions {
  verbose: boolean;
  jsonOutput: boolean;
  researchOnly: boolean;
  withPii: boolean;
}

export function parseCliArgs(argv: string[]): CliOptions {
  return {
    verbose: argv.includes("--verbose"),
    jsonOutput: argv.includes("--json"),
    researchOnly: argv.includes("--research-only"),
    // PII is OFF by default — require explicit opt-in.
    withPii: argv.includes("--with-pii"),
  };
}

const args = process.argv.slice(2);
const options = parseCliArgs(args);
const verbose = options.verbose;
const jsonOutput = options.jsonOutput;
const researchOnly = options.researchOnly;
const withPii = options.withPii;

export function displayIdentity(
  userId: string,
  email: string | null | undefined,
  pii: boolean,
): string {
  if (pii && email) return email;
  // Short-id fallback: first 8 chars of userId (UUID-safe, no PII leak).
  return `user-${userId.slice(0, 8)}`;
}

// ── Database Connection ──────────────────────────────────────

function getConnectionString(): string {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error(
      "Database connection string not found. Set POSTGRES_URL, DATABASE_URL, " +
        "POSTGRES_PRISMA_URL, or POSTGRES_URL_NON_POOLING.",
    );
  }
  return connectionString;
}

// ── Table Row Counts ─────────────────────────────────────────

async function getTableCounts(sql: SqlFn): Promise<TableCount[]> {
  const rows = await sql`
    SELECT 'User' AS "table", COUNT(*)::int AS count FROM "User"
    UNION ALL SELECT 'QuestionnaireSession', COUNT(*)::int FROM "QuestionnaireSession"
    UNION ALL SELECT 'AssessmentResult', COUNT(*)::int FROM "AssessmentResult"
    UNION ALL SELECT 'QuickDiveResult', COUNT(*)::int FROM "QuickDiveResult"
    UNION ALL SELECT 'CareerReport', COUNT(*)::int FROM "CareerReport"
    UNION ALL SELECT 'ReportEngagement', COUNT(*)::int FROM "ReportEngagement"
    UNION ALL SELECT 'ReportReaction', COUNT(*)::int FROM "ReportReaction"
    UNION ALL SELECT 'ReportNPS', COUNT(*)::int FROM "ReportNPS"
    UNION ALL SELECT 'CoachingSession', COUNT(*)::int FROM "CoachingSession"
    UNION ALL SELECT 'CoachingFeedback', COUNT(*)::int FROM "CoachingFeedback"
    UNION ALL SELECT 'PersonalProfile', COUNT(*)::int FROM "PersonalProfile"
    UNION ALL SELECT 'UserProfile', COUNT(*)::int FROM "UserProfile"
    UNION ALL SELECT 'UserMemory', COUNT(*)::int FROM "UserMemory"
  `;

  return rows.map((r: Record<string, unknown>) => ({
    table: r.table as string,
    count: Number(r.count),
  }));
}

// ── Per-User Chain Query ─────────────────────────────────────

async function getUserChains(
  sql: SqlFn,
  opts: { researchOnly: boolean } = { researchOnly: false },
): Promise<UserChainRow[]> {
  const rows = opts.researchOnly
    ? await sql`
    WITH
      latest_sessions AS (
        SELECT DISTINCT ON ("userId") "userId", "status", "language", "totalTimeMs"
        FROM "QuestionnaireSession"
        WHERE "userId" IS NOT NULL AND "tier" = 'deep'
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_assessments AS (
        SELECT DISTINCT ON ("userId") "userId", "version", "createdAt" AS "assessmentCreatedAt"
        FROM "AssessmentResult"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_archetypes AS (
        SELECT DISTINCT ON ("userId") "userId", "archetypeLabel"
        FROM "QuickDiveResult"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_reports AS (
        SELECT DISTINCT ON ("userId") "userId", "generationTimeMs"
        FROM "CareerReport"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_engagement AS (
        SELECT DISTINCT ON ("userId") "userId", "totalTimeMs"
        FROM "ReportEngagement"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_reactions AS (
        SELECT DISTINCT ON ("userId") "userId", "reaction"
        FROM "ReportReaction"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_nps AS (
        SELECT DISTINCT ON ("userId") "userId", "score"
        FROM "ReportNPS"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      coaching_agg AS (
        SELECT "userId", COUNT(*)::int AS "sessionCount"
        FROM "CoachingSession"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      ),
      latest_coaching_feedback AS (
        SELECT DISTINCT ON ("userId") "userId"
        FROM "CoachingFeedback"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_pipeline AS (
        SELECT DISTINCT ON ("userId") "userId", "reportStatus"
        FROM "AssessmentPipeline"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "updatedAt" DESC
      )
    SELECT
      u."id"                                                AS "userId",
      u."email",
      u."createdAt"                                         AS "registrationDate",
      (s."userId" IS NOT NULL)                              AS "hasQuestionnaireSession",
      s."status"                                            AS "questionnaireStatus",
      s."language"                                          AS "questionnaireLanguage",
      s."totalTimeMs"                                       AS "questionnaireTotalTimeMs",
      (a."userId" IS NOT NULL)                              AS "hasAssessmentResult",
      a."version"                                           AS "pipelineVersion",
      a."assessmentCreatedAt"                               AS "assessmentCreatedAt",
      (la."userId" IS NOT NULL)                             AS "hasQuickDiveResult",
      la."archetypeLabel",
      (lr."userId" IS NOT NULL)                             AS "hasCareerReport",
      lr."generationTimeMs"                                 AS "reportGenerationTimeMs",
      (eng."userId" IS NOT NULL)                            AS "hasReportEngagement",
      eng."totalTimeMs"                                     AS "engagementTotalTimeMs",
      (rr."userId" IS NOT NULL)                             AS "hasReportReaction",
      rr."reaction"                                         AS "reportReaction",
      (nps."userId" IS NOT NULL)                            AS "hasReportNPS",
      nps."score"                                           AS "npsScore",
      (ca."userId" IS NOT NULL)                             AS "hasCoachingSession",
      COALESCE(ca."sessionCount", 0)                       AS "coachingSessionCount",
      (cf."userId" IS NOT NULL)                             AS "hasCoachingFeedback",
      lp."reportStatus"                                     AS "pipelineReportStatus"
    FROM "User" u
    LEFT JOIN latest_sessions         s     ON s."userId"     = u."id"
    LEFT JOIN latest_assessments      a     ON a."userId"     = u."id"
    LEFT JOIN latest_archetypes       la    ON la."userId"    = u."id"
    LEFT JOIN latest_reports          lr    ON lr."userId"    = u."id"
    LEFT JOIN latest_engagement       eng   ON eng."userId"   = u."id"
    LEFT JOIN latest_reactions        rr    ON rr."userId"    = u."id"
    LEFT JOIN latest_nps              nps   ON nps."userId"   = u."id"
    LEFT JOIN coaching_agg            ca    ON ca."userId"    = u."id"
    LEFT JOIN latest_coaching_feedback cf   ON cf."userId"    = u."id"
    LEFT JOIN latest_pipeline          lp   ON lp."userId"    = u."id"
    WHERE u."researchGroup" IS NOT NULL
      AND u."researchConsentAt" IS NOT NULL
      AND u."isAdmin" = FALSE
      AND EXISTS (
        SELECT 1 FROM "ConsentRecord" cr
        WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
      )
    ORDER BY u."createdAt" ASC
  `
    : await sql`
    WITH
      latest_sessions AS (
        SELECT DISTINCT ON ("userId")
          "userId", "status", "language", "totalTimeMs"
        FROM "QuestionnaireSession"
        WHERE "userId" IS NOT NULL AND "tier" = 'deep'
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_assessments AS (
        SELECT DISTINCT ON ("userId")
          "userId", "version", "createdAt" AS "assessmentCreatedAt"
        FROM "AssessmentResult"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_archetypes AS (
        SELECT DISTINCT ON ("userId")
          "userId", "archetypeLabel"
        FROM "QuickDiveResult"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_reports AS (
        SELECT DISTINCT ON ("userId")
          "userId", "generationTimeMs"
        FROM "CareerReport"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_engagement AS (
        SELECT DISTINCT ON ("userId")
          "userId", "totalTimeMs"
        FROM "ReportEngagement"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_reactions AS (
        SELECT DISTINCT ON ("userId")
          "userId", "reaction"
        FROM "ReportReaction"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_nps AS (
        SELECT DISTINCT ON ("userId")
          "userId", "score"
        FROM "ReportNPS"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      coaching_agg AS (
        SELECT
          "userId",
          COUNT(*)::int AS "sessionCount"
        FROM "CoachingSession"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      ),
      latest_coaching_feedback AS (
        SELECT DISTINCT ON ("userId")
          "userId"
        FROM "CoachingFeedback"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_pipeline AS (
        SELECT DISTINCT ON ("userId") "userId", "reportStatus"
        FROM "AssessmentPipeline"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "updatedAt" DESC
      )
    SELECT
      u."id"                                                AS "userId",
      u."email",
      u."createdAt"                                         AS "registrationDate",
      (s."userId" IS NOT NULL)                              AS "hasQuestionnaireSession",
      s."status"                                            AS "questionnaireStatus",
      s."language"                                          AS "questionnaireLanguage",
      s."totalTimeMs"                                       AS "questionnaireTotalTimeMs",
      (a."userId" IS NOT NULL)                              AS "hasAssessmentResult",
      a."version"                                           AS "pipelineVersion",
      a."assessmentCreatedAt"                               AS "assessmentCreatedAt",
      (la."userId" IS NOT NULL)                             AS "hasQuickDiveResult",
      la."archetypeLabel",
      (lr."userId" IS NOT NULL)                             AS "hasCareerReport",
      lr."generationTimeMs"                                 AS "reportGenerationTimeMs",
      (eng."userId" IS NOT NULL)                            AS "hasReportEngagement",
      eng."totalTimeMs"                                     AS "engagementTotalTimeMs",
      (rr."userId" IS NOT NULL)                             AS "hasReportReaction",
      rr."reaction"                                         AS "reportReaction",
      (nps."userId" IS NOT NULL)                            AS "hasReportNPS",
      nps."score"                                           AS "npsScore",
      (ca."userId" IS NOT NULL)                             AS "hasCoachingSession",
      COALESCE(ca."sessionCount", 0)                       AS "coachingSessionCount",
      (cf."userId" IS NOT NULL)                             AS "hasCoachingFeedback",
      lp."reportStatus"                                     AS "pipelineReportStatus"
    FROM "User" u
    LEFT JOIN latest_sessions         s     ON s."userId"     = u."id"
    LEFT JOIN latest_assessments      a     ON a."userId"     = u."id"
    LEFT JOIN latest_archetypes       la    ON la."userId"    = u."id"
    LEFT JOIN latest_reports          lr    ON lr."userId"    = u."id"
    LEFT JOIN latest_engagement       eng   ON eng."userId"   = u."id"
    LEFT JOIN latest_reactions        rr    ON rr."userId"    = u."id"
    LEFT JOIN latest_nps              nps   ON nps."userId"   = u."id"
    LEFT JOIN coaching_agg            ca    ON ca."userId"    = u."id"
    LEFT JOIN latest_coaching_feedback cf   ON cf."userId"    = u."id"
    LEFT JOIN latest_pipeline          lp   ON lp."userId"    = u."id"
    ORDER BY u."createdAt" ASC
  `;

  return rows.map((r: Record<string, unknown>) => ({
    userId: r.userId as string,
    email: r.email as string,
    registrationDate: r.registrationDate
      ? new Date(r.registrationDate as string).toISOString()
      : "",
    hasQuestionnaireSession: r.hasQuestionnaireSession === true,
    questionnaireStatus: (r.questionnaireStatus as string) || null,
    questionnaireLanguage: (r.questionnaireLanguage as string) || null,
    questionnaireTotalTimeMs:
      r.questionnaireTotalTimeMs != null
        ? Number(r.questionnaireTotalTimeMs)
        : null,
    hasAssessmentResult: r.hasAssessmentResult === true,
    pipelineVersion: (r.pipelineVersion as string) || null,
    assessmentCreatedAt: r.assessmentCreatedAt
      ? new Date(r.assessmentCreatedAt as string).toISOString()
      : null,
    hasQuickDiveResult: r.hasQuickDiveResult === true,
    archetypeLabel: (r.archetypeLabel as string) || null,
    hasCareerReport: r.hasCareerReport === true,
    reportGenerationTimeMs:
      r.reportGenerationTimeMs != null
        ? Number(r.reportGenerationTimeMs)
        : null,
    hasReportEngagement: r.hasReportEngagement === true,
    engagementTotalTimeMs:
      r.engagementTotalTimeMs != null ? Number(r.engagementTotalTimeMs) : null,
    hasReportReaction: r.hasReportReaction === true,
    reportReaction: (r.reportReaction as string) || null,
    hasReportNPS: r.hasReportNPS === true,
    npsScore: r.npsScore != null ? Number(r.npsScore) : null,
    hasCoachingSession: r.hasCoachingSession === true,
    coachingSessionCount: Number(r.coachingSessionCount) || 0,
    hasCoachingFeedback: r.hasCoachingFeedback === true,
    pipelineReportStatus: (r.pipelineReportStatus as string) || null,
  }));
}

// ── Funnel Event Query ───────────────────────────────────────

async function getFunnelEvents(sql: SqlFn): Promise<FunnelEventRow[]> {
  const rows = await sql`
    SELECT "userId", "event", COUNT(*)::int AS "count"
    FROM "UserFunnel"
    WHERE "userId" IS NOT NULL
    GROUP BY "userId", "event"
    ORDER BY "userId", "event"
  `;

  return rows.map((r: Record<string, unknown>) => ({
    userId: r.userId as string,
    event: r.event as string,
    count: Number(r.count),
  }));
}

// ── Research Chain Query ─────────────────────────────────────

async function getResearchChains(sql: SqlFn): Promise<ResearchChainRow[]> {
  const rows = await sql`
    WITH
      consent_rows AS (
        SELECT "userId",
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE "withdrawnAt" IS NULL)::int AS active
        FROM "ConsentRecord"
        GROUP BY "userId"
      ),
      -- Canonical timepoint rule (lib/research/pairing.ts):
      -- T0 = FIRST pre (MIN), T1/T2 = LATEST post (MAX).
      t0 AS (
        SELECT "userId", MIN("createdAt") AS "createdAt"
        FROM "PrePostAssessment"
        WHERE "assessmentType" = 'pre'
        GROUP BY "userId"
      ),
      t1 AS (
        SELECT "userId", MAX("createdAt") AS "createdAt"
        FROM "PrePostAssessment"
        WHERE "assessmentType" = 'post_immediate'
        GROUP BY "userId"
      ),
      t2 AS (
        SELECT "userId", MAX("createdAt") AS "createdAt"
        FROM "PrePostAssessment"
        WHERE "assessmentType" = 'post_1week'
        GROUP BY "userId"
      ),
      coaching AS (
        SELECT "userId", COUNT(*)::int AS c
        FROM "CoachingSession"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      ),
      reminder AS (
        SELECT "userId", "sendStatus"
        FROM "Post1WeekReminderLog"
      )
    SELECT
      u."id"                                AS "userId",
      u."email",
      u."researchGroup"                     AS "researchGroup",
      u."researchConsentAt"                 AS "researchConsentAt",
      u."isAdmin"                           AS "isAdmin",
      (COALESCE(cr.total, 0) > 0)           AS "hasConsentRecord",
      (COALESCE(cr.active, 0) > 0)          AS "hasActiveConsentRecord",
      t0."createdAt"                        AS "t0At",
      t1."createdAt"                        AS "t1At",
      t2."createdAt"                        AS "t2At",
      COALESCE(ch.c, 0)                     AS "coachingSessionCount",
      COALESCE(r."sendStatus", 'none')      AS "reminderLogStatus"
    FROM "User" u
    LEFT JOIN consent_rows cr ON cr."userId" = u."id"
    LEFT JOIN t0           ON t0."userId" = u."id"
    LEFT JOIN t1           ON t1."userId" = u."id"
    LEFT JOIN t2           ON t2."userId" = u."id"
    LEFT JOIN coaching ch  ON ch."userId" = u."id"
    LEFT JOIN reminder r   ON r."userId" = u."id"
    WHERE u."researchGroup" IS NOT NULL
       OR cr."userId" IS NOT NULL
       OR t0."userId" IS NOT NULL
       OR t1."userId" IS NOT NULL
       OR t2."userId" IS NOT NULL
    ORDER BY u."createdAt" ASC
  `;

  return rows.map((r: Record<string, unknown>) => ({
    userId: r.userId as string,
    email: (r.email as string) || "",
    researchGroup: (r.researchGroup as string) || null,
    researchConsentAt: r.researchConsentAt
      ? new Date(r.researchConsentAt as string).toISOString()
      : null,
    hasConsentRecord: r.hasConsentRecord === true,
    hasActiveConsentRecord: r.hasActiveConsentRecord === true,
    isAdmin: r.isAdmin === true,
    t0At: r.t0At ? new Date(r.t0At as string).toISOString() : null,
    t1At: r.t1At ? new Date(r.t1At as string).toISOString() : null,
    t2At: r.t2At ? new Date(r.t2At as string).toISOString() : null,
    coachingSessionCount: Number(r.coachingSessionCount) || 0,
    reminderLogStatus:
      (r.reminderLogStatus as "none" | "claimed" | "sent" | "failed") || "none",
  }));
}

function buildUserFunnelStatuses(
  chains: UserChainRow[],
  funnelEvents: FunnelEventRow[],
): Map<string, UserFunnelStatus> {
  // Build a lookup: userId → Set<event>
  const eventsByUser = new Map<string, Set<string>>();
  for (const row of funnelEvents) {
    if (!eventsByUser.has(row.userId)) {
      eventsByUser.set(row.userId, new Set());
    }
    eventsByUser.get(row.userId)!.add(row.event);
  }

  const statuses = new Map<string, UserFunnelStatus>();
  for (const user of chains) {
    const events = eventsByUser.get(user.userId) ?? new Set<string>();
    const hasQuickdiveStarted = events.has("quickdive_started");
    const hasQuickdiveCompleted = events.has("quickdive_completed");
    const hasImmersiveStarted = events.has("immersive_explore_started");
    const hasImmersiveCompleted = events.has("immersive_explore_completed");
    const isImmersiveMode = hasImmersiveStarted || hasImmersiveCompleted;

    statuses.set(user.userId, {
      userId: user.userId,
      email: user.email,
      hasQuickdiveStarted,
      hasQuickdiveCompleted,
      hasImmersiveStarted,
      hasImmersiveCompleted,
      hasDeepDiveStarted: events.has("deepdive_started"),
      hasDeepDiveCompleted: events.has("deepdive_completed"),
      hasReportViewed: events.has("report_viewed"),
      isImmersiveMode,
      hasCoreStartEvent: hasQuickdiveStarted || hasImmersiveStarted,
      hasCoreCompleteEvent: hasQuickdiveCompleted || hasImmersiveCompleted,
    });
  }
  return statuses;
}

// ── Funnel Validation Logic ───────────────────────────────────

function validateUserFunnel(
  user: UserChainRow,
  funnel: UserFunnelStatus,
): Issue[] {
  const issues: Issue[] = [];
  const ctx = { userId: user.userId, email: user.email };

  // Only check funnel for users who have reached meaningful milestones
  if (!user.hasAssessmentResult && !user.hasCareerReport) {
    return issues;
  }

  // Immersive mode info note
  if (funnel.isImmersiveMode) {
    issues.push({
      ...ctx,
      severity: "info",
      category: "funnel-mode",
      message:
        "User completed flow via immersive mode (immersive_explore events present)",
    });
  }

  // AssessmentResult present → expect deepdive_completed
  if (user.hasAssessmentResult && !funnel.hasDeepDiveCompleted) {
    issues.push({
      ...ctx,
      severity: "warning",
      category: "funnel-gap",
      message: "User has AssessmentResult but no deepdive_completed event",
    });
  }

  // CareerReport present → expect report_viewed
  if (user.hasCareerReport && !funnel.hasReportViewed) {
    issues.push({
      ...ctx,
      severity: "warning",
      category: "funnel-gap",
      message: "User has CareerReport but no report_viewed event",
    });
  }

  // quickdive_completed without quickdive_started (ordering anomaly)
  if (funnel.hasQuickdiveCompleted && !funnel.hasQuickdiveStarted) {
    issues.push({
      ...ctx,
      severity: "warning",
      category: "funnel-ordering",
      message: "User has quickdive_completed but no quickdive_started event",
    });
  }

  // immersive_explore_completed without immersive_explore_started
  if (funnel.hasImmersiveCompleted && !funnel.hasImmersiveStarted) {
    issues.push({
      ...ctx,
      severity: "warning",
      category: "funnel-ordering",
      message:
        "User has immersive_explore_completed but no immersive_explore_started event",
    });
  }

  return issues;
}

// ── Validation Logic ─────────────────────────────────────────

function validateUserChain(user: UserChainRow): Issue[] {
  const issues: Issue[] = [];
  const ctx = { userId: user.userId, email: user.email };

  // ── Core data chain: Questionnaire → Assessment → Report ──

  if (!user.hasQuestionnaireSession) {
    // Registered-but-never-started is natural funnel drop-off, not a data
    // integrity break. Keep it visible as INFO (so it still shows up in the
    // user breakdown) but don't count it toward chain-break errors that gate
    // CI. Real chain breaks below (completed questionnaire with no assessment,
    // or assessment with no report) still trip ERROR as they should.
    issues.push({
      ...ctx,
      severity: "info",
      category: "missing-optional",
      message:
        "No QuestionnaireSession (Deep Dive never started — funnel drop)",
    });
  } else {
    if (user.questionnaireStatus !== "completed") {
      issues.push({
        ...ctx,
        severity: "warning",
        category: "incomplete",
        message: `QuestionnaireSession status is "${user.questionnaireStatus}" (not completed)`,
      });
    }
    if (user.questionnaireTotalTimeMs == null) {
      issues.push({
        ...ctx,
        severity: "warning",
        category: "missing-field",
        message: "QuestionnaireSession.totalTimeMs is NULL",
      });
    } else if (user.questionnaireTotalTimeMs < 60_000) {
      issues.push({
        ...ctx,
        severity: "warning",
        category: "anomaly",
        message: `QuestionnaireSession completed in ${Math.round(user.questionnaireTotalTimeMs / 1000)}s (suspiciously fast, <60s)`,
      });
    }
  }

  if (!user.hasAssessmentResult) {
    if (
      user.hasQuestionnaireSession &&
      user.questionnaireStatus === "completed"
    ) {
      issues.push({
        ...ctx,
        severity: "error",
        category: "chain-break",
        message:
          "Questionnaire completed but no AssessmentResult (scoring pipeline failed?)",
      });
    }
  }

  if (!user.hasQuickDiveResult) {
    issues.push({
      ...ctx,
      severity: "info",
      category: "missing-optional",
      message: "No QuickDiveResult (user skipped Quick Dive or did not link)",
    });
  }

  if (!user.hasCareerReport) {
    if (user.hasAssessmentResult) {
      // Distinguish "abandoned in old flow" from "generation actually failed".
      // Before the server-orchestrated pipeline (shipped 2026-04-22), report
      // generation was user-triggered — an assessment older than 7 days with
      // no report is almost certainly an abandoned session, not a pipeline
      // failure. Mark those INFO so they don't gate CI.
      // (For recent assessments, the server pipeline now guarantees a report
      // row is attempted; a missing one is a real failure → keep ERROR.)
      const ageMs = user.assessmentCreatedAt
        ? Date.now() - new Date(user.assessmentCreatedAt).getTime()
        : 0;
      const STALE_MS = 7 * 24 * 60 * 60 * 1000;
      // Pipeline row tells us whether the user ever *asked for* a report.
      // `not_requested` / NULL = user hasn't clicked "generate report" yet —
      // that's a product funnel drop, not a data-chain break. Only treat
      // "requested but didn't finish" as an error.
      const reportRequested =
        user.pipelineReportStatus !== null &&
        user.pipelineReportStatus !== "not_requested";
      if (!reportRequested) {
        issues.push({
          ...ctx,
          severity: "info",
          category: "missing-optional",
          message: `AssessmentResult from ${user.assessmentCreatedAt?.slice(0, 10)} has no CareerReport (user has not requested one; pipeline status=${user.pipelineReportStatus ?? "null"})`,
        });
      } else if (ageMs > STALE_MS) {
        issues.push({
          ...ctx,
          severity: "info",
          category: "missing-optional",
          message: `AssessmentResult from ${user.assessmentCreatedAt?.slice(0, 10)} has no CareerReport (legacy pre-pipeline flow, likely abandoned)`,
        });
      } else {
        issues.push({
          ...ctx,
          severity: "error",
          category: "chain-break",
          message: `AssessmentResult exists, report was requested (pipeline status=${user.pipelineReportStatus}), but no CareerReport row`,
        });
      }
    }
  } else {
    if (
      user.reportGenerationTimeMs != null &&
      user.reportGenerationTimeMs > 100_000
    ) {
      issues.push({
        ...ctx,
        severity: "warning",
        category: "anomaly",
        message: `Report generation took ${Math.round(user.reportGenerationTimeMs / 1000)}s (exceeded 100s timeout threshold)`,
      });
    }
  }

  // ── Report engagement / feedback ──

  if (user.hasCareerReport && !user.hasReportEngagement) {
    issues.push({
      ...ctx,
      severity: "warning",
      category: "missing-tracking",
      message:
        "CareerReport exists but no ReportEngagement data (sendBeacon may have failed)",
    });
  }

  if (user.hasCareerReport && !user.hasReportReaction) {
    issues.push({
      ...ctx,
      severity: "info",
      category: "missing-optional",
      message: "CareerReport exists but no ReportReaction (user did not react)",
    });
  }

  if (user.hasCareerReport && !user.hasReportNPS) {
    issues.push({
      ...ctx,
      severity: "info",
      category: "missing-optional",
      message: "CareerReport exists but no ReportNPS (user did not submit NPS)",
    });
  }

  if (user.hasReportNPS && user.npsScore != null) {
    if (user.npsScore < 1 || user.npsScore > 10) {
      issues.push({
        ...ctx,
        severity: "error",
        category: "anomaly",
        message: `NPS score ${user.npsScore} is out of valid range (1-10)`,
      });
    }
  }

  // ── Coaching ──

  if (user.hasCoachingSession && !user.hasCoachingFeedback) {
    issues.push({
      ...ctx,
      severity: "info",
      category: "missing-optional",
      message: `${user.coachingSessionCount} coaching session(s) but no CoachingFeedback`,
    });
  }

  return issues;
}

// ── Summary Statistics ───────────────────────────────────────

function computeSummary(
  chains: UserChainRow[],
  funnelStatuses: Map<string, UserFunnelStatus>,
): SummaryStats {
  // Users with at least one funnel event recorded
  const withAnyFunnelEvent = chains.filter((u) => {
    const f = funnelStatuses.get(u.userId);
    return (
      f &&
      (f.hasQuickdiveStarted ||
        f.hasQuickdiveCompleted ||
        f.hasImmersiveStarted ||
        f.hasImmersiveCompleted ||
        f.hasDeepDiveStarted ||
        f.hasDeepDiveCompleted ||
        f.hasReportViewed)
    );
  }).length;

  // Users with CareerReport who have all expected funnel events
  const reportUsers = chains.filter((u) => u.hasCareerReport);
  const withCompleteFunnel = reportUsers.filter((u) => {
    const f = funnelStatuses.get(u.userId);
    if (!f) return false;
    return (
      f.hasCoreStartEvent &&
      f.hasCoreCompleteEvent &&
      f.hasDeepDiveStarted &&
      f.hasDeepDiveCompleted &&
      f.hasReportViewed
    );
  }).length;

  const funnelGaps = reportUsers.filter((u) => {
    const f = funnelStatuses.get(u.userId);
    if (!f) return true;
    return !(
      f.hasCoreStartEvent &&
      f.hasCoreCompleteEvent &&
      f.hasDeepDiveStarted &&
      f.hasDeepDiveCompleted &&
      f.hasReportViewed
    );
  }).length;

  return {
    totalUsers: chains.length,
    withQuestionnaire: chains.filter((u) => u.hasQuestionnaireSession).length,
    withCompletedQuestionnaire: chains.filter(
      (u) => u.hasQuestionnaireSession && u.questionnaireStatus === "completed",
    ).length,
    withAssessment: chains.filter((u) => u.hasAssessmentResult).length,
    withQuickDive: chains.filter((u) => u.hasQuickDiveResult).length,
    withReport: chains.filter((u) => u.hasCareerReport).length,
    withEngagement: chains.filter((u) => u.hasReportEngagement).length,
    withReaction: chains.filter((u) => u.hasReportReaction).length,
    withNPS: chains.filter((u) => u.hasReportNPS).length,
    withCoaching: chains.filter((u) => u.hasCoachingSession).length,
    withCoachingFeedback: chains.filter((u) => u.hasCoachingFeedback).length,
    fullChainComplete: chains.filter(
      (u) =>
        u.hasQuestionnaireSession &&
        u.questionnaireStatus === "completed" &&
        u.hasAssessmentResult &&
        u.hasCareerReport,
    ).length,
    withAnyFunnelEvent,
    withCompleteFunnel,
    funnelGaps,
  };
}

// ── Output Formatting ────────────────────────────────────────

function printTableCounts(counts: TableCount[]): void {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║            TABLE ROW COUNTS                         ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  for (const { table, count } of counts) {
    const status = count === -1 ? "TABLE MISSING" : String(count);
    const indicator = count === 0 ? " ⚠" : count === -1 ? " ✗" : "";
    console.log(
      `║  ${table.padEnd(28)} ${String(status).padStart(8)}${indicator.padEnd(12)} ║`,
    );
  }
  console.log("╚══════════════════════════════════════════════════════╝");
}

function printSummary(stats: SummaryStats): void {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║            DATA CHAIN SUMMARY                       ║");
  console.log("╠══════════════════════════════════════════════════════╣");

  const pct = (n: number) =>
    stats.totalUsers > 0
      ? ` (${Math.round((n / stats.totalUsers) * 100)}%)`
      : "";

  const lines = [
    ["Total Users", stats.totalUsers, ""],
    ["---", 0, ""],
    [
      "With Questionnaire (started)",
      stats.withQuestionnaire,
      pct(stats.withQuestionnaire),
    ],
    [
      "With Questionnaire (completed)",
      stats.withCompletedQuestionnaire,
      pct(stats.withCompletedQuestionnaire),
    ],
    ["With AssessmentResult", stats.withAssessment, pct(stats.withAssessment)],
    ["With QuickDiveResult", stats.withQuickDive, pct(stats.withQuickDive)],
    ["With CareerReport", stats.withReport, pct(stats.withReport)],
    [
      "Full Core Chain (Q→A→R)",
      stats.fullChainComplete,
      pct(stats.fullChainComplete),
    ],
    ["---", 0, ""],
    ["With ReportEngagement", stats.withEngagement, pct(stats.withEngagement)],
    ["With ReportReaction", stats.withReaction, pct(stats.withReaction)],
    ["With ReportNPS", stats.withNPS, pct(stats.withNPS)],
    ["---", 0, ""],
    ["With Coaching Session", stats.withCoaching, pct(stats.withCoaching)],
    [
      "With Coaching Feedback",
      stats.withCoachingFeedback,
      pct(stats.withCoachingFeedback),
    ],
  ];

  for (const [label, value, suffix] of lines) {
    if (label === "---") {
      console.log("║──────────────────────────────────────────────────────║");
    } else {
      console.log(
        `║  ${String(label).padEnd(34)} ${String(value).padStart(6)}${String(suffix).padEnd(10)} ║`,
      );
    }
  }
  console.log("╚══════════════════════════════════════════════════════╝");
}

function printFunnelSummary(
  stats: SummaryStats,
  chains: UserChainRow[],
  funnelStatuses: Map<string, UserFunnelStatus>,
  verbose: boolean,
): void {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║         FUNNEL EVENT INTEGRITY                      ║");
  console.log("╠══════════════════════════════════════════════════════╣");

  const reportCount = stats.withReport;
  const pct = (n: number) =>
    reportCount > 0
      ? ` (${Math.round((n / reportCount) * 100)}% of report users)`
      : "";

  const lines: Array<[string, number | string, string]> = [
    ["Total users with funnel events", stats.withAnyFunnelEvent, ""],
    ["---", 0, ""],
    ["Report users (base)", reportCount, ""],
    [
      "  With complete funnel chain",
      stats.withCompleteFunnel,
      pct(stats.withCompleteFunnel),
    ],
    ["  With funnel gaps", stats.funnelGaps, pct(stats.funnelGaps)],
  ];

  for (const [label, value, suffix] of lines) {
    if (label === "---") {
      console.log("║──────────────────────────────────────────────────────║");
    } else {
      console.log(
        `║  ${String(label).padEnd(34)} ${String(value).padStart(6)}${String(suffix).padEnd(10)} ║`,
      );
    }
  }
  console.log("╚══════════════════════════════════════════════════════╝");

  if (verbose && stats.funnelGaps > 0) {
    const reportUsers = chains.filter((u) => u.hasCareerReport);
    console.log("\n── FUNNEL GAPS (users with CareerReport) ──────────────");
    for (const user of reportUsers) {
      const f = funnelStatuses.get(user.userId);
      const missing: string[] = [];
      if (!f || !f.hasCoreStartEvent) {
        missing.push("quickdive_started / immersive_explore_started");
      }
      if (!f || !f.hasCoreCompleteEvent) {
        missing.push("quickdive_completed / immersive_explore_completed");
      }
      if (!f || !f.hasDeepDiveStarted) missing.push("deepdive_started");
      if (!f || !f.hasDeepDiveCompleted) missing.push("deepdive_completed");
      if (!f || !f.hasReportViewed) missing.push("report_viewed");

      if (missing.length > 0) {
        console.log(`  ${displayIdentity(user.userId, user.email, withPii)}`);
        for (const m of missing) {
          console.log(`    missing: ${m}`);
        }
      }
    }
  }
}

function printIssues(issues: Issue[], verbose: boolean): void {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║            ISSUES FOUND                             ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(
    `║  Errors:   ${String(errors.length).padStart(5)}  (data chain breaks)                 ║`,
  );
  console.log(
    `║  Warnings: ${String(warnings.length).padStart(5)}  (missing/anomalous data)            ║`,
  );
  console.log(
    `║  Info:     ${String(infos.length).padStart(5)}  (missing optional data)              ║`,
  );
  console.log("╚══════════════════════════════════════════════════════╝");

  if (verbose) {
    if (errors.length > 0) {
      console.log("\n── ERRORS (chain breaks) ──────────────────────────────");
      for (const issue of errors) {
        console.log(
          `  [ERROR] ${displayIdentity(issue.userId, issue.email, withPii)}`,
        );
        console.log(`          ${issue.category}: ${issue.message}`);
      }
    }

    if (warnings.length > 0) {
      console.log("\n── WARNINGS ───────────────────────────────────────────");
      for (const issue of warnings) {
        console.log(
          `  [WARN]  ${displayIdentity(issue.userId, issue.email, withPii)}`,
        );
        console.log(`          ${issue.category}: ${issue.message}`);
      }
    }

    if (infos.length > 0) {
      console.log("\n── INFO ───────────────────────────────────────────────");
      for (const issue of infos) {
        console.log(
          `  [INFO]  ${displayIdentity(issue.userId, issue.email, withPii)}`,
        );
        console.log(`          ${issue.category}: ${issue.message}`);
      }
    }
  } else {
    // Compact: group errors by category
    const byCategory = new Map<string, number>();
    for (const issue of issues) {
      const key = `${issue.severity}:${issue.category}`;
      byCategory.set(key, (byCategory.get(key) || 0) + 1);
    }
    console.log("\n  Issue breakdown by category:");
    for (const [key, count] of [...byCategory.entries()].sort()) {
      const [severity, category] = key.split(":");
      const icon =
        severity === "error"
          ? "ERR "
          : severity === "warning"
            ? "WARN"
            : "INFO";
      console.log(`    [${icon}] ${category}: ${count} user(s)`);
    }
    console.log("\n  Tip: Use --verbose to see per-user details.");
  }
}

function printBrokenChainUsers(chains: UserChainRow[], issues: Issue[]): void {
  // Find users with errors (broken chains)
  const errorUserIds = new Set(
    issues.filter((i) => i.severity === "error").map((i) => i.userId),
  );
  const brokenUsers = chains.filter((u) => errorUserIds.has(u.userId));

  if (brokenUsers.length === 0) {
    console.log("\n  No broken data chains detected.");
    return;
  }

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║        USERS WITH BROKEN DATA CHAINS                ║");
  console.log("╠══════════════════════════════════════════════════════╣");

  for (const user of brokenUsers) {
    const chain = [
      user.hasQuestionnaireSession ? "Q" : "✗",
      user.hasAssessmentResult ? "A" : "✗",
      user.hasCareerReport ? "R" : "✗",
    ].join(" → ");

    const extras = [
      user.hasReportEngagement ? "Eng" : null,
      user.hasReportReaction ? "Rxn" : null,
      user.hasReportNPS ? "NPS" : null,
    ].filter(Boolean);

    console.log(`║  ${displayIdentity(user.userId, user.email, withPii)}`);
    console.log(
      `║    Chain: ${chain}  |  Optional: ${extras.length > 0 ? extras.join(", ") : "none"}`,
    );
  }
  console.log("╚══════════════════════════════════════════════════════╝");
}

// ── JSON Output ──────────────────────────────────────────────

function sanitizeIssue(issue: Issue): Issue {
  if (withPii) return issue;
  return { ...issue, email: displayIdentity(issue.userId, issue.email, false) };
}

function printResearchSummary(
  researchRows: ResearchChainRow[],
  researchIssues: Issue[],
): void {
  const summary = computeResearchSummary(researchRows);
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║         RESEARCH CHAIN (consent → T0 → T1 → T2)     ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  const lines: Array<[string, number]> = [
    ["Research participants", summary.totalResearch],
    ["With consent (timestamp or audit)", summary.consentedUsers],
    ["Completed T0 (pre)", summary.t0Count],
    ["Completed T1 (post_immediate)", summary.t1Count],
    ["Completed T2 (post_1week)", summary.t2Count],
    ["Full chain T0+T1+T2", summary.fullChain],
    ["T2 recorded < T1+7d (invalid)", summary.invalidT2Timing],
    ["T1 ≥7d old, T2 missing", summary.missingT2Due],
  ];
  for (const [label, value] of lines) {
    console.log(
      `║  ${String(label).padEnd(36)} ${String(value).padStart(6)}          ║`,
    );
  }
  console.log("╚══════════════════════════════════════════════════════╝");

  const researchErrors = researchIssues.filter(
    (i) => i.severity === "error" && i.category.startsWith("research-"),
  );
  const researchWarnings = researchIssues.filter(
    (i) => i.severity === "warning" && i.category.startsWith("research-"),
  );
  if (researchErrors.length === 0 && researchWarnings.length === 0) {
    console.log("\n  Research chain: no issues detected.");
  }
}

function outputJson(
  tableCounts: TableCount[],
  summary: SummaryStats,
  issues: Issue[],
  chains: UserChainRow[],
  funnelStatuses: Map<string, UserFunnelStatus>,
  researchRows: ResearchChainRow[],
): void {
  const sanitizedIssues = issues.map(sanitizeIssue);
  const researchSummary = computeResearchSummary(researchRows);
  const output = {
    generatedAt: new Date().toISOString(),
    options: { researchOnly, withPii },
    tableCounts: Object.fromEntries(tableCounts.map((t) => [t.table, t.count])),
    summary,
    researchSummary,
    issues: {
      total: sanitizedIssues.length,
      errors: sanitizedIssues.filter((i) => i.severity === "error").length,
      warnings: sanitizedIssues.filter((i) => i.severity === "warning").length,
      info: sanitizedIssues.filter((i) => i.severity === "info").length,
      details: sanitizedIssues,
    },
    users: chains.map((u) => {
      const f = funnelStatuses.get(u.userId);
      return {
        userId: u.userId,
        // PII is stripped from JSON by default — only include email on --with-pii.
        email: withPii ? u.email : undefined,
        chain: {
          questionnaire: u.hasQuestionnaireSession,
          questionnaireCompleted: u.questionnaireStatus === "completed",
          assessment: u.hasAssessmentResult,
          quickDive: u.hasQuickDiveResult,
          report: u.hasCareerReport,
          engagement: u.hasReportEngagement,
          reaction: u.hasReportReaction,
          nps: u.hasReportNPS,
          coaching: u.hasCoachingSession,
          coachingFeedback: u.hasCoachingFeedback,
        },
        funnel: f
          ? {
              quickdiveStarted: f.hasQuickdiveStarted,
              quickdiveCompleted: f.hasQuickdiveCompleted,
              immersiveStarted: f.hasImmersiveStarted,
              immersiveCompleted: f.hasImmersiveCompleted,
              deepdiveStarted: f.hasDeepDiveStarted,
              deepdiveCompleted: f.hasDeepDiveCompleted,
              reportViewed: f.hasReportViewed,
              isImmersiveMode: f.isImmersiveMode,
              completeFunnel:
                f.hasCoreStartEvent &&
                f.hasCoreCompleteEvent &&
                f.hasDeepDiveStarted &&
                f.hasDeepDiveCompleted &&
                f.hasReportViewed,
            }
          : null,
      };
    }),
  };
  console.log(JSON.stringify(output, null, 2));
}

// ── Main ─────────────────────────────────────────────────────

async function main(): Promise<void> {
  const connectionString = getConnectionString();
  const sql: SqlFn = neon(connectionString);

  if (!jsonOutput) {
    console.log("============================================================");
    console.log("  Deep Dive — Thesis Data Integrity Verification");
    console.log(`  ${new Date().toISOString()}`);
    console.log("============================================================");
  }

  // Step 1: Table row counts
  const tableCounts = await getTableCounts(sql);

  // Step 2: Per-user chain query (research-only applies WHERE filter)
  const chains = await getUserChains(sql, { researchOnly });

  // Step 3: Funnel event query
  const funnelEvents = await getFunnelEvents(sql);
  const funnelStatuses = buildUserFunnelStatuses(chains, funnelEvents);

  // Step 4: Research chain query (consent / T0 / T1 / T2 / coaching / reminder).
  // Always fetched — research users exist regardless of --research-only flag.
  const researchRows = await getResearchChains(sql);

  // Step 5: Validate each user (chain + funnel + research)
  const allIssues: Issue[] = [];
  for (const user of chains) {
    allIssues.push(...validateUserChain(user));
    const funnel = funnelStatuses.get(user.userId);
    if (funnel) {
      allIssues.push(...validateUserFunnel(user, funnel));
    }
  }
  for (const row of researchRows) {
    allIssues.push(...validateResearchChain(row));
  }

  // Step 6: Compute summary
  const summary = computeSummary(chains, funnelStatuses);

  // Output
  if (jsonOutput) {
    outputJson(
      tableCounts,
      summary,
      allIssues,
      chains,
      funnelStatuses,
      researchRows,
    );
  } else {
    printTableCounts(tableCounts);
    printSummary(summary);
    printFunnelSummary(summary, chains, funnelStatuses, verbose);
    printResearchSummary(researchRows, allIssues);
    printIssues(allIssues, verbose);
    printBrokenChainUsers(chains, allIssues);

    // Final verdict
    const errorCount = allIssues.filter((i) => i.severity === "error").length;
    console.log(
      "\n" +
        (errorCount > 0
          ? `  RESULT: ${errorCount} data chain error(s) found. Review above for details.`
          : "  RESULT: All data chains intact. No critical issues."),
    );
    console.log("");
  }

  process.exit(allIssues.some((i) => i.severity === "error") ? 1 : 0);
}

// Only run main() when invoked as a script, not when imported by tests.
if (!process.env.VITEST) {
  main().catch((err) => {
    console.error("\nFatal error:", err);
    process.exit(1);
  });
}
