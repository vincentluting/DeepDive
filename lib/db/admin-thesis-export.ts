// ============================================================
// Admin Thesis Export — Per-user thesis data export across all
// relevant tables (User, QuestionnaireSession, AssessmentResult,
// QuickDiveResult, CareerReport, ReportReaction, ReportNPS,
// CoachingSession, CoachingFeedback, PrePostAssessment,
// ReportEngagement).
// ============================================================

import { sql } from "./connection";

export interface ThesisExportRow {
  userId: string;
  email: string;
  registrationDate: string;
  country: string | null;
  careerStage: string | null;
  researchGroup: string | null;
  researchParticipantId: string | null;
  questionnaireCompleted: boolean;
  questionnaireLanguage: string | null;
  questionnaireTotalTimeMs: number | null;
  pipelineVersion: string | null;
  moduleTime_sjtMs: number | null;
  moduleTime_valuesMs: number | null;
  moduleTime_ipipMs: number | null;
  rushCount: number | null;
  quickDiveMode: string | null;
  archetypeLabel: string | null;
  reportGenerationTimeMs: number | null;
  reportReaction: string | null;
  npsScore: number | null;
  npsFeedback: string | null;
  coachingSessionCount: number;
  totalCoachingRounds: number;
  coachingFeedbackRating: string | null;
  coachingFeedbackHighlight: string | null;
  sccPre: number | null;
  sccPost: number | null;
  sccDelta: number | null;
  // Post-immediate scores (split timepoint)
  postImmediate_sccTotal: number | null;
  postImmediate_sccDelta: number | null;
  // Post-1week scores (split timepoint)
  post1week_sccTotal: number | null;
  post1week_sccDelta: number | null;
  // CDC-5 scores per timepoint (repurposed cdseTotalScore column)
  cdcPre: number | null;
  cdcPostImmediate: number | null;
  cdcPost1week: number | null;
  cdcDelta: number | null;
  // Demographics (T0)
  demo_age: string | null;
  demo_gender: string | null;
  demo_employment: string | null;
  demo_experience: string | null;
  // Q1: Trust & Psychological Safety (5 items, 1–5 Likert)
  trust_willing_to_disclose: number | null;
  trust_felt_understood: number | null;
  trust_comfortable_sharing: number | null;
  trust_ai_competence: number | null;
  trust_emotional_safety: number | null;
  trust_mean: number | null;
  // Q2: Real-World Constraints Confidence (3 items, 1–5 Likert)
  constraints_adequately_considered: number | null;
  constraints_increased_confidence: number | null;
  constraints_actionable: number | null;
  constraints_mean: number | null;
  // Attention check (T1 only, 1 item). attn_check_passed = (raw == 4); use
  // for filtering inattentive responders at analysis time per Meade & Craig
  // (2012). Null when participant did not reach T1.
  attn_check_1: number | null;
  attn_check_passed: boolean | null;
  // UES-SF-12 (12 items, 1–5 Likert). ux1-ux12 are the raw Likert answers.
  // ux4/ux5/ux6 are Perceived Usability items that must be reverse-scored
  // (6 − raw) before they can be summed/averaged with the other 9 items.
  // The ux{N}_reversed columns carry the already-reversed values so that
  // downstream analysis (SPSS/R) can use them directly without a transform.
  ux1: number | null;
  ux2: number | null;
  ux3: number | null;
  ux4: number | null;
  ux5: number | null;
  ux6: number | null;
  ux7: number | null;
  ux8: number | null;
  ux9: number | null;
  ux10: number | null;
  ux11: number | null;
  ux12: number | null;
  ux4_reversed: number | null;
  ux5_reversed: number | null;
  ux6_reversed: number | null;
  // DR-3: Delayed Reflection (3 items, T2 only)
  delayed_continued_thinking: number | null;
  delayed_took_action: number | null;
  delayed_perspective_shift: number | null;
  // Q3: Feature Attribution
  most_valuable_features: string | null;
  feature_ranking: string | null;
  // Open feedback (T1 and T2)
  t1_open_feedback: string | null;
  t2_open_feedback: string | null;
  // Legacy fields
  experienceFeedback_satisfaction: number | null;
  experienceFeedback_nps: number | null;
  experienceFeedback_valuableFeatures: string | null;
  experienceFeedback_openFeedback: string | null;
  reportEngagement_totalTimeMs: number | null;
  reportEngagement_maxScrollDepth: number | null;
  reportEngagement_scrollbackCount: number | null;
  reportEngagement_panel1Ms: number | null;
  reportEngagement_panel2Ms: number | null;
  reportEngagement_panel3Ms: number | null;
  reportEngagement_integrationMs: number | null;
}

/**
 * Fetch per-user thesis export data across all relevant tables.
 * Each user maps to one row using their latest records from each table.
 *
 * Data sources:
 * - User: demographics, research cohort flag
 * - QuestionnaireSession: completion status, language, total time
 * - AssessmentResult: pipeline version, module times, rush count
 * - QuickDiveResult: A/B explore mode, archetype label
 * - CareerReport: generation time
 * - ReportReaction / ReportNPS: user feedback
 * - CoachingSession + CoachingFeedback: coaching engagement & satisfaction
 * - PrePostAssessment: SCC pre/post scores, experience feedback
 * - ReportEngagement: panel dwell times, scroll depth, scrollbacks
 *
 * By default only rows with a valid research group AND explicit consent are
 * returned — this keeps thesis samples free of non-research traffic. Callers
 * that need the full table (platform ops, debugging) must set
 * `includeAllUsers: true` to opt in.
 * Optional date filters apply to User.createdAt / registrationDate.
 */
export async function getThesisExportData(opts?: {
  limit?: number;
  includeAllUsers?: boolean;
  from?: string;
  to?: string;
}): Promise<ThesisExportRow[]> {
  const limit = opts?.limit ?? 5000;
  const includeAllUsers = opts?.includeAllUsers ?? false;
  const fromDate = opts?.from ? new Date(opts.from) : null;
  const toDate = opts?.to ? new Date(opts.to) : null;
  const rows = await sql`
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
          "userId", "version", "resultJson"
        FROM "AssessmentResult"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_archetypes AS (
        SELECT DISTINCT ON ("userId")
          "userId", "archetypeLabel", "exploreMode"
        FROM "QuickDiveResult"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_reports AS (
        SELECT DISTINCT ON ("userId")
          "userId", "id" AS "reportId", "generationTimeMs"
        FROM "CareerReport"
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
          "userId", "score", "feedback"
        FROM "ReportNPS"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      coaching_agg AS (
        SELECT
          "userId",
          COUNT(*)::int AS "sessionCount",
          COALESCE(SUM("roundNumber"), 0)::int AS "totalRounds"
        FROM "CoachingSession"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      ),
      latest_coaching_feedback AS (
        SELECT DISTINCT ON ("userId")
          "userId", "rating", "highlight"
        FROM "CoachingFeedback"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      prepost_pre AS (
        -- T0 canonical rule: FIRST pre record (baseline predates intervention).
        -- T1/T2 below keep DESC (latest). See lib/research/pairing.ts.
        SELECT DISTINCT ON ("userId")
          "userId", "sccTotalScore", "cdseTotalScore", "experienceFeedback"
        FROM "PrePostAssessment"
        WHERE "userId" IS NOT NULL AND "assessmentType" = 'pre'
        ORDER BY "userId", "createdAt" ASC
      ),
      prepost_post_imm AS (
        SELECT DISTINCT ON ("userId")
          "userId", "sccTotalScore", "cdseTotalScore",
          "experienceFeedback"
        FROM "PrePostAssessment"
        WHERE "userId" IS NOT NULL AND "assessmentType" = 'post_immediate'
        ORDER BY "userId", "createdAt" DESC
      ),
      prepost_post_1wk AS (
        SELECT DISTINCT ON ("userId")
          "userId", "sccTotalScore", "cdseTotalScore",
          "experienceFeedback"
        FROM "PrePostAssessment"
        WHERE "userId" IS NOT NULL AND "assessmentType" = 'post_1week'
        ORDER BY "userId", "createdAt" DESC
      ),
      latest_engagement AS (
        SELECT DISTINCT ON ("userId")
          "userId", "panelTimes", "totalTimeMs",
          "maxScrollDepth", "scrollbacks"
        FROM "ReportEngagement"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      )
    SELECT
      u."id"                                                              AS "userId",
      u."email",
      u."createdAt"                                                       AS "registrationDate",
      u."registrationCountry"                                             AS "country",
      u."careerStage",
      u."researchGroup",
      u."researchParticipantId",
      COALESCE(s."status" = 'completed', FALSE)                          AS "questionnaireCompleted",
      s."language"                                                        AS "questionnaireLanguage",
      s."totalTimeMs"                                                     AS "questionnaireTotalTimeMs",
      a."version"                                                         AS "pipelineVersion",
      (a."resultJson"->'meta'->'moduleTimes'->>'sjt')::int               AS "moduleTime_sjtMs",
      COALESCE(
        (a."resultJson"->'meta'->'moduleTimes'->>'ddvq')::int,
        (a."resultJson"->'meta'->'moduleTimes'->>'pvq')::int
      )                                                                   AS "moduleTime_valuesMs",
      COALESCE(
        (a."resultJson"->'meta'->'moduleTimes'->>'ipip60')::int,
        (a."resultJson"->'meta'->'moduleTimes'->>'ipip30')::int,
        (a."resultJson"->'meta'->'moduleTimes'->>'ipip')::int
      )                                                                   AS "moduleTime_ipipMs",
      (a."resultJson"->'meta'->>'rushCount')::int                        AS "rushCount",
      la."exploreMode"                                                    AS "quickDiveMode",
      la."archetypeLabel",
      lr."generationTimeMs"                                               AS "reportGenerationTimeMs",
      rr."reaction"                                                       AS "reportReaction",
      nps."score"                                                         AS "npsScore",
      nps."feedback"                                                      AS "npsFeedback",
      COALESCE(ca."sessionCount", 0)                                     AS "coachingSessionCount",
      COALESCE(ca."totalRounds", 0)                                      AS "totalCoachingRounds",
      cf."rating"                                                         AS "coachingFeedbackRating",
      cf."highlight"                                                      AS "coachingFeedbackHighlight",
      pp_pre."sccTotalScore"                                             AS "sccPre",
      COALESCE(pp_imm."sccTotalScore", pp_1wk."sccTotalScore")          AS "sccPost",
      (COALESCE(pp_imm."sccTotalScore", pp_1wk."sccTotalScore")
        - pp_pre."sccTotalScore")                                        AS "sccDelta",
      -- Post-immediate scores
      pp_imm."sccTotalScore"                                             AS "postImmediate_sccTotal",
      (pp_imm."sccTotalScore" - pp_pre."sccTotalScore")                  AS "postImmediate_sccDelta",
      -- Post-1week scores
      pp_1wk."sccTotalScore"                                             AS "post1week_sccTotal",
      (pp_1wk."sccTotalScore" - pp_pre."sccTotalScore")                  AS "post1week_sccDelta",
      -- CDC-5 scores per timepoint
      pp_pre."cdseTotalScore"                                              AS "cdcPre",
      pp_imm."cdseTotalScore"                                              AS "cdcPostImmediate",
      pp_1wk."cdseTotalScore"                                              AS "cdcPost1week",
      (pp_imm."cdseTotalScore" - pp_pre."cdseTotalScore")                  AS "cdcDelta",
      -- Demographics (from T0 experienceFeedback)
      pp_pre."experienceFeedback"->>'demo_age'                             AS "demo_age",
      pp_pre."experienceFeedback"->>'demo_gender'                          AS "demo_gender",
      pp_pre."experienceFeedback"->>'demo_employment'                      AS "demo_employment",
      pp_pre."experienceFeedback"->>'demo_experience'                      AS "demo_experience",
      -- Q1: Trust & Psychological Safety (5 items from T1)
      (pp_imm."experienceFeedback"->>'trust_willing_to_disclose')::numeric AS "trust_willing_to_disclose",
      (pp_imm."experienceFeedback"->>'trust_felt_understood')::numeric     AS "trust_felt_understood",
      (pp_imm."experienceFeedback"->>'trust_comfortable_sharing')::numeric AS "trust_comfortable_sharing",
      (pp_imm."experienceFeedback"->>'trust_ai_competence')::numeric       AS "trust_ai_competence",
      (pp_imm."experienceFeedback"->>'trust_emotional_safety')::numeric    AS "trust_emotional_safety",
      -- Q2: Constraints Confidence (3 items from T1)
      (pp_imm."experienceFeedback"->>'constraints_adequately_considered')::numeric AS "constraints_adequately_considered",
      (pp_imm."experienceFeedback"->>'constraints_increased_confidence')::numeric AS "constraints_increased_confidence",
      (pp_imm."experienceFeedback"->>'constraints_actionable')::numeric    AS "constraints_actionable",
      -- Attention check (T1 only, 1 item)
      (pp_imm."experienceFeedback"->>'attn_check_1')::numeric              AS "attn_check_1",
      -- UES-SF-12 (12 items from T1)
      (pp_imm."experienceFeedback"->>'ux1')::numeric                       AS "ux1",
      (pp_imm."experienceFeedback"->>'ux2')::numeric                       AS "ux2",
      (pp_imm."experienceFeedback"->>'ux3')::numeric                       AS "ux3",
      (pp_imm."experienceFeedback"->>'ux4')::numeric                       AS "ux4",
      (pp_imm."experienceFeedback"->>'ux5')::numeric                       AS "ux5",
      (pp_imm."experienceFeedback"->>'ux6')::numeric                       AS "ux6",
      (pp_imm."experienceFeedback"->>'ux7')::numeric                       AS "ux7",
      (pp_imm."experienceFeedback"->>'ux8')::numeric                       AS "ux8",
      (pp_imm."experienceFeedback"->>'ux9')::numeric                       AS "ux9",
      (pp_imm."experienceFeedback"->>'ux10')::numeric                      AS "ux10",
      (pp_imm."experienceFeedback"->>'ux11')::numeric                      AS "ux11",
      (pp_imm."experienceFeedback"->>'ux12')::numeric                      AS "ux12",
      -- DR-3: Delayed Reflection (3 items from T2)
      (pp_1wk."experienceFeedback"->>'delayed_continued_thinking')::numeric AS "delayed_continued_thinking",
      (pp_1wk."experienceFeedback"->>'delayed_took_action')::numeric       AS "delayed_took_action",
      (pp_1wk."experienceFeedback"->>'delayed_perspective_shift')::numeric AS "delayed_perspective_shift",
      -- Q3: Feature Attribution (arrays returned as JSONB, from T1)
      pp_imm."experienceFeedback"->'most_valuable_features'                AS "most_valuable_features",
      pp_imm."experienceFeedback"->'feature_ranking'                       AS "feature_ranking",
      -- Open feedback
      pp_imm."experienceFeedback"->>'comments'                             AS "t1_open_feedback",
      pp_1wk."experienceFeedback"->>'comments'                             AS "t2_open_feedback",
      -- Backward-compat experienceFeedback legacy fields
      (COALESCE(pp_imm."experienceFeedback", pp_1wk."experienceFeedback")->>'satisfaction')::int AS "experienceFeedback_satisfaction",
      (COALESCE(pp_imm."experienceFeedback", pp_1wk."experienceFeedback")->>'nps')::int AS "experienceFeedback_nps",
      COALESCE(pp_imm."experienceFeedback", pp_1wk."experienceFeedback")->'valuableFeatures' AS "experienceFeedback_valuableFeatures",
      COALESCE(pp_imm."experienceFeedback", pp_1wk."experienceFeedback")->>'openFeedback'   AS "experienceFeedback_openFeedback",
      eng."totalTimeMs"                                                   AS "reportEngagement_totalTimeMs",
      eng."maxScrollDepth"                                                AS "reportEngagement_maxScrollDepth",
      COALESCE(jsonb_array_length(eng."scrollbacks"), 0)::int            AS "reportEngagement_scrollbackCount",
      (eng."panelTimes"->>'panel1')::int                                 AS "reportEngagement_panel1Ms",
      (eng."panelTimes"->>'panel2')::int                                 AS "reportEngagement_panel2Ms",
      (eng."panelTimes"->>'panel3')::int                                 AS "reportEngagement_panel3Ms",
      (eng."panelTimes"->>'integration')::int                            AS "reportEngagement_integrationMs"
    FROM "User" u
    LEFT JOIN latest_sessions    s    ON s."userId"    = u."id"
    LEFT JOIN latest_assessments a    ON a."userId"    = u."id"
    LEFT JOIN latest_archetypes  la   ON la."userId"   = u."id"
    LEFT JOIN latest_reports     lr   ON lr."userId"   = u."id"
    LEFT JOIN latest_reactions   rr   ON rr."userId"   = u."id"
    LEFT JOIN latest_nps         nps  ON nps."userId"  = u."id"
    LEFT JOIN coaching_agg       ca   ON ca."userId"   = u."id"
    LEFT JOIN latest_coaching_feedback cf ON cf."userId" = u."id"
    LEFT JOIN prepost_pre        pp_pre  ON pp_pre."userId"  = u."id"
    LEFT JOIN prepost_post_imm   pp_imm  ON pp_imm."userId"  = u."id"
    LEFT JOIN prepost_post_1wk   pp_1wk  ON pp_1wk."userId"  = u."id"
    LEFT JOIN latest_engagement  eng  ON eng."userId"  = u."id"
    WHERE (
      ${includeAllUsers}::boolean
      OR (
        u."researchGroup" IS NOT NULL
        AND u."researchConsentAt" IS NOT NULL
        AND u."isAdmin" = FALSE
        AND EXISTS (
          SELECT 1 FROM "ConsentRecord" cr
          WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
        )
      )
    )
      AND (${fromDate}::timestamptz IS NULL OR u."createdAt" >= ${fromDate})
      AND (${toDate}::timestamptz IS NULL OR u."createdAt" <= ${toDate})
    ORDER BY u."createdAt" ASC
    LIMIT ${limit}
  `;

  return rows.map((r: Record<string, unknown>) => ({
    userId: r.userId as string,
    email: r.email as string,
    registrationDate: r.registrationDate
      ? new Date(r.registrationDate as string).toISOString()
      : "",
    country: (r.country as string) || null,
    careerStage: (r.careerStage as string) || null,
    researchGroup: (r.researchGroup as string) || null,
    researchParticipantId: (r.researchParticipantId as string) || null,
    questionnaireCompleted: r.questionnaireCompleted === true,
    questionnaireLanguage: (r.questionnaireLanguage as string) || null,
    questionnaireTotalTimeMs:
      r.questionnaireTotalTimeMs != null
        ? Number(r.questionnaireTotalTimeMs)
        : null,
    pipelineVersion: (r.pipelineVersion as string) || null,
    moduleTime_sjtMs:
      r.moduleTime_sjtMs != null ? Number(r.moduleTime_sjtMs) : null,
    moduleTime_valuesMs:
      r.moduleTime_valuesMs != null ? Number(r.moduleTime_valuesMs) : null,
    moduleTime_ipipMs:
      r.moduleTime_ipipMs != null ? Number(r.moduleTime_ipipMs) : null,
    rushCount: r.rushCount != null ? Number(r.rushCount) : null,
    quickDiveMode: (r.quickDiveMode as string) || null,
    archetypeLabel: (r.archetypeLabel as string) || null,
    reportGenerationTimeMs:
      r.reportGenerationTimeMs != null
        ? Number(r.reportGenerationTimeMs)
        : null,
    reportReaction: (r.reportReaction as string) || null,
    npsScore: r.npsScore != null ? Number(r.npsScore) : null,
    npsFeedback: (r.npsFeedback as string) || null,
    coachingSessionCount: Number(r.coachingSessionCount) || 0,
    totalCoachingRounds: Number(r.totalCoachingRounds) || 0,
    coachingFeedbackRating: (r.coachingFeedbackRating as string) || null,
    coachingFeedbackHighlight: (r.coachingFeedbackHighlight as string) || null,
    sccPre: r.sccPre != null ? Number(r.sccPre) : null,
    sccPost: r.sccPost != null ? Number(r.sccPost) : null,
    sccDelta: r.sccDelta != null ? Number(r.sccDelta) : null,
    // Post-immediate
    postImmediate_sccTotal:
      r.postImmediate_sccTotal != null
        ? Number(r.postImmediate_sccTotal)
        : null,
    postImmediate_sccDelta:
      r.postImmediate_sccDelta != null
        ? Number(r.postImmediate_sccDelta)
        : null,
    // Post-1week
    post1week_sccTotal:
      r.post1week_sccTotal != null ? Number(r.post1week_sccTotal) : null,
    post1week_sccDelta:
      r.post1week_sccDelta != null ? Number(r.post1week_sccDelta) : null,
    // CDC-5
    cdcPre: r.cdcPre != null ? Number(r.cdcPre) : null,
    cdcPostImmediate:
      r.cdcPostImmediate != null ? Number(r.cdcPostImmediate) : null,
    cdcPost1week: r.cdcPost1week != null ? Number(r.cdcPost1week) : null,
    cdcDelta: r.cdcDelta != null ? Number(r.cdcDelta) : null,
    // Demographics
    demo_age: (r.demo_age as string) || null,
    demo_gender: (r.demo_gender as string) || null,
    demo_employment: (r.demo_employment as string) || null,
    demo_experience: (r.demo_experience as string) || null,
    // Q1: Trust (5 items)
    trust_willing_to_disclose:
      r.trust_willing_to_disclose != null
        ? Number(r.trust_willing_to_disclose)
        : null,
    trust_felt_understood:
      r.trust_felt_understood != null ? Number(r.trust_felt_understood) : null,
    trust_comfortable_sharing:
      r.trust_comfortable_sharing != null
        ? Number(r.trust_comfortable_sharing)
        : null,
    trust_ai_competence:
      r.trust_ai_competence != null ? Number(r.trust_ai_competence) : null,
    trust_emotional_safety:
      r.trust_emotional_safety != null
        ? Number(r.trust_emotional_safety)
        : null,
    trust_mean: (() => {
      const vals = [
        r.trust_willing_to_disclose,
        r.trust_felt_understood,
        r.trust_comfortable_sharing,
        r.trust_ai_competence,
        r.trust_emotional_safety,
      ]
        .filter((v) => v != null)
        .map((v) => Number(v));
      return vals.length > 0
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) /
            100
        : null;
    })(),
    // Q2: Constraints (3 items)
    constraints_adequately_considered:
      r.constraints_adequately_considered != null
        ? Number(r.constraints_adequately_considered)
        : null,
    constraints_increased_confidence:
      r.constraints_increased_confidence != null
        ? Number(r.constraints_increased_confidence)
        : null,
    constraints_actionable:
      r.constraints_actionable != null
        ? Number(r.constraints_actionable)
        : null,
    constraints_mean: (() => {
      const vals = [
        r.constraints_adequately_considered,
        r.constraints_increased_confidence,
        r.constraints_actionable,
      ]
        .filter((v) => v != null)
        .map((v) => Number(v));
      return vals.length > 0
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) /
            100
        : null;
    })(),
    // Attention check — raw + computed pass flag (raw == 4)
    attn_check_1: r.attn_check_1 != null ? Number(r.attn_check_1) : null,
    attn_check_passed:
      r.attn_check_1 != null ? Number(r.attn_check_1) === 4 : null,
    // UES-SF-12 — raw Likert answers preserved as-is
    ux1: r.ux1 != null ? Number(r.ux1) : null,
    ux2: r.ux2 != null ? Number(r.ux2) : null,
    ux3: r.ux3 != null ? Number(r.ux3) : null,
    ux4: r.ux4 != null ? Number(r.ux4) : null,
    ux5: r.ux5 != null ? Number(r.ux5) : null,
    ux6: r.ux6 != null ? Number(r.ux6) : null,
    ux7: r.ux7 != null ? Number(r.ux7) : null,
    ux8: r.ux8 != null ? Number(r.ux8) : null,
    ux9: r.ux9 != null ? Number(r.ux9) : null,
    ux10: r.ux10 != null ? Number(r.ux10) : null,
    ux11: r.ux11 != null ? Number(r.ux11) : null,
    ux12: r.ux12 != null ? Number(r.ux12) : null,
    // Reverse-scored PU items (1-5 Likert → 6 − raw). Nulls pass through.
    ux4_reversed: r.ux4 != null ? 6 - Number(r.ux4) : null,
    ux5_reversed: r.ux5 != null ? 6 - Number(r.ux5) : null,
    ux6_reversed: r.ux6 != null ? 6 - Number(r.ux6) : null,
    // DR-3
    delayed_continued_thinking:
      r.delayed_continued_thinking != null
        ? Number(r.delayed_continued_thinking)
        : null,
    delayed_took_action:
      r.delayed_took_action != null ? Number(r.delayed_took_action) : null,
    delayed_perspective_shift:
      r.delayed_perspective_shift != null
        ? Number(r.delayed_perspective_shift)
        : null,
    // Q3: Feature Attribution
    most_valuable_features: Array.isArray(r.most_valuable_features)
      ? (r.most_valuable_features as string[]).join(",")
      : null,
    feature_ranking: Array.isArray(r.feature_ranking)
      ? (r.feature_ranking as string[]).join(",")
      : null,
    // Open feedback
    t1_open_feedback: (r.t1_open_feedback as string) || null,
    t2_open_feedback: (r.t2_open_feedback as string) || null,
    experienceFeedback_satisfaction:
      r.experienceFeedback_satisfaction != null
        ? Number(r.experienceFeedback_satisfaction)
        : null,
    experienceFeedback_nps:
      r.experienceFeedback_nps != null
        ? Number(r.experienceFeedback_nps)
        : null,
    experienceFeedback_valuableFeatures:
      r.experienceFeedback_valuableFeatures != null
        ? JSON.stringify(r.experienceFeedback_valuableFeatures)
        : null,
    experienceFeedback_openFeedback:
      (r.experienceFeedback_openFeedback as string) || null,
    reportEngagement_totalTimeMs:
      r.reportEngagement_totalTimeMs != null
        ? Number(r.reportEngagement_totalTimeMs)
        : null,
    reportEngagement_maxScrollDepth:
      r.reportEngagement_maxScrollDepth != null
        ? Number(r.reportEngagement_maxScrollDepth)
        : null,
    reportEngagement_scrollbackCount:
      r.reportEngagement_scrollbackCount != null
        ? Number(r.reportEngagement_scrollbackCount)
        : null,
    reportEngagement_panel1Ms:
      r.reportEngagement_panel1Ms != null
        ? Number(r.reportEngagement_panel1Ms)
        : null,
    reportEngagement_panel2Ms:
      r.reportEngagement_panel2Ms != null
        ? Number(r.reportEngagement_panel2Ms)
        : null,
    reportEngagement_panel3Ms:
      r.reportEngagement_panel3Ms != null
        ? Number(r.reportEngagement_panel3Ms)
        : null,
    reportEngagement_integrationMs:
      r.reportEngagement_integrationMs != null
        ? Number(r.reportEngagement_integrationMs)
        : null,
  }));
}
