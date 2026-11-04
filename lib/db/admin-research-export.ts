// ============================================================
// Admin — Research Export (Between-Subjects Study Data)
//
// Provides anonymized research data export for thesis analysis.
// hashUserId() ensures participant privacy in exported data.
// ============================================================

import { sql } from "./connection";
import { createHash } from "crypto";
import { getQuickDiveModeAliases } from "@/lib/quickdive/explore-mode";

/** SHA-256 hash of raw userId for anonymised export */
function hashUserId(userId: string | null): string | null {
  if (!userId) return null;
  return createHash("sha256").update(userId).digest("hex");
}

export interface ResearchExportRow {
  // ── Identity ──────────────────────────────────────────────
  id: string;
  archetypeCode: string;
  archetypeLabel: string;
  exploreMode: string;
  language: string;
  /** SHA-256 hash of raw userId — anonymised */
  userId: string | null;
  createdAt: string;
  userRegisteredAt: string | null;
  researchGroup: string | null;
  researchParticipantId: string | null;

  // ── Quick Dive: RIASEC scores ─────────────────────────────
  score_R: number | null;
  score_I: number | null;
  score_A: number | null;
  score_S: number | null;
  score_E: number | null;
  score_C: number | null;

  // ── Quick Dive: metadata ──────────────────────────────────
  confidenceTier: string | null;
  assessmentType: string | null;
  scoringMethod: string | null;
  rawResponses: number[] | null;

  // ── Quick Dive: behavioral ────────────────────────────────
  totalDurationMs: number | null;
  perItemDurationMs: number[] | null;
  medianItemDurationMs: number | null;
  fastResponseCount: number | null;
  sessionStartedAt: string | null;
  sessionCompletedAt: string | null;
  deviceType: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  viewportWidth: number | null;
  userAgent: string | null;

  // ── Deep Dive raw answers: SJT (6 scenarios × would/should) ─
  sjt_1_would: string | null;
  sjt_1_should: string | null;
  sjt_2_would: string | null;
  sjt_2_should: string | null;
  sjt_3_would: string | null;
  sjt_3_should: string | null;
  sjt_4_would: string | null;
  sjt_4_should: string | null;
  sjt_5_would: string | null;
  sjt_5_should: string | null;
  sjt_6_would: string | null;
  sjt_6_should: string | null;

  // ── Deep Dive raw answers: PVQ / TwIVI (1-6 Likert) ────
  pvq_1: number | null;
  pvq_2: number | null;
  pvq_3: number | null;
  pvq_4: number | null;
  pvq_5: number | null;
  pvq_6: number | null;
  pvq_7: number | null;
  pvq_8: number | null;
  pvq_9: number | null;
  pvq_10: number | null;
  pvq_11: number | null;
  pvq_12: number | null;
  pvq_13: number | null;
  pvq_14: number | null;
  pvq_15: number | null;
  pvq_16: number | null;
  pvq_17: number | null;
  pvq_18: number | null;
  pvq_19: number | null;
  pvq_20: number | null;
  pvq_21: number | null;

  // ── Deep Dive raw answers: IPIP-30 (1-5 Likert, by IPIP item ID) ──
  ipip_id1: number | null; // N1_Anxiety
  ipip_id2: number | null; // N2_Anger
  ipip_id4: number | null; // N4_Self-Consciousness
  ipip_id9: number | null; // E3_Assertiveness
  ipip_id13: number | null; // O1_Imagination
  ipip_id20: number | null; // A2_Morality
  ipip_id27: number | null; // C3_Dutifulness
  ipip_id40: number | null; // E4_Activity_Level
  ipip_id41: number | null; // E5_Excitement-Seeking
  ipip_id44: number | null; // O2_Artistic_Interests
  ipip_id47: number | null; // O5_Intellect
  ipip_id48: number | null; // O6_Liberalism
  ipip_id49: number | null; // A1_Trust
  ipip_id51: number | null; // A3_Altruism
  ipip_id54: number | null; // A6_Sympathy
  ipip_id56: number | null; // C2_Orderliness
  ipip_id59: number | null; // C5_Self-Discipline
  ipip_id60: number | null; // C6_Cautiousness
  ipip_id67: number | null; // E1_Friendliness
  ipip_id72: number | null; // E6_Cheerfulness
  ipip_id75: number | null; // O3_Emotionality
  ipip_id76: number | null; // O4_Adventurousness
  ipip_id82: number | null; // A4_Cooperation
  ipip_id83: number | null; // A5_Modesty
  ipip_id85: number | null; // C1_Self-Efficacy
  ipip_id88: number | null; // C4_Achievement-Striving
  ipip_id93: number | null; // N3_Depression
  ipip_id95: number | null; // N5_Immoderation
  ipip_id96: number | null; // N6_Vulnerability
  ipip_id98: number | null; // E2_Gregariousness

  // ── Scoring results: Big Five (normalized 0-100) ──────────
  bf_openness: number | null;
  bf_conscientiousness: number | null;
  bf_extraversion: number | null;
  bf_agreeableness: number | null;
  bf_neuroticism: number | null;

  // ── Scoring results: Schwartz 10 values (ipsative-centered) ─
  schwartz_achievement: number | null;
  schwartz_power: number | null;
  schwartz_stimulation: number | null;
  schwartz_self_direction: number | null;
  schwartz_hedonism: number | null;
  schwartz_benevolence: number | null;
  schwartz_universalism: number | null;
  schwartz_conformity: number | null;
  schwartz_tradition: number | null;
  schwartz_security: number | null;

  // ── Scoring results: SJT tension gaps (should − would) ────
  sjt_gap_1: number | null;
  sjt_gap_2: number | null;
  sjt_gap_3: number | null;
  sjt_gap_4: number | null;
  sjt_gap_5: number | null;
  sjt_gap_6: number | null;

  // ── Behavioral: Deep Dive ─────────────────────────────────
  dd_totalDurationMs: number | null;
  dd_sjtTimeMs: number | null;
  dd_pvqTimeMs: number | null;
  dd_ipipTimeMs: number | null;
  dd_rushCount: number | null;

  // ── Feedback ──────────────────────────────────────────────
  npsScore: number | null;
  reportReaction: string | null;

  // ── Coaching (aggregate, no raw text) ─────────────────────
  coachingSessionCount: number;
  coachingTotalRounds: number;
  coachingTotalDurationMs: number | null;
}

export interface ResearchExportFilters {
  mode: "classic" | "narrative" | "immersive" | "all";
  from?: string;
  to?: string;
  limit?: number;
}

function mapResearchRow(r: Record<string, unknown>): ResearchExportRow {
  const scores = (r.scoresJson as Record<string, number>) || {};
  const data = (r.resultDataJson as Record<string, unknown>) || {};

  // ── Parse Deep Dive AssessmentResult JSON ──────────────────
  const assessment =
    (r.assessmentResultJson as Record<string, unknown>) || null;
  const bigFive = assessment
    ? (assessment.bigFive as Record<string, unknown>) || null
    : null;
  const domainsNorm = bigFive
    ? (bigFive.domainsNormalized as Record<string, number>) || null
    : null;
  const schwartz = assessment
    ? (assessment.schwartz as Record<string, unknown>) || null
    : null;
  const centered = schwartz
    ? (schwartz.centered as Record<string, number>) || null
    : null;
  const tensionsData = assessment
    ? (assessment.tensions as Record<string, unknown>) || null
    : null;
  const scenarios = tensionsData
    ? (tensionsData.scenarios as Array<Record<string, unknown>>) || []
    : [];
  const meta = assessment
    ? (assessment.meta as Record<string, unknown>) || null
    : null;
  const moduleTimes = meta
    ? (meta.moduleTimes as Record<string, number>) || null
    : null;

  // Build SJT gap lookup keyed by scenarioId
  const sjtGapMap = new Map<number, number>();
  for (const s of scenarios) {
    const sid = s.scenarioId as number;
    const gap = s.gap as number;
    if (sid != null && gap != null) sjtGapMap.set(sid, gap);
  }

  // ── Parse QuestionnaireSession answersJson ─────────────────
  const sessionAnswers =
    (r.sessionAnswersJson as Array<Record<string, unknown>>) || [];
  const sjtMap = new Map<string, { would: string; should: string }>();
  const pvqMap = new Map<string, number>();
  const ipipMap = new Map<string, number>();

  for (const answer of sessionAnswers) {
    const qid = String(answer.questionId ?? "");
    const value = answer.value as Record<string, unknown> | null;
    if (!value) continue;
    const type = value.type as string;
    if (type === "sjt") {
      sjtMap.set(qid, {
        would: String(value.wouldChoice ?? ""),
        should: String(value.shouldChoice ?? ""),
      });
    } else if (type === "pvq") {
      pvqMap.set(qid, value.rating as number);
    } else if (type === "ipip") {
      ipipMap.set(qid, value.rating as number);
    }
  }

  return {
    id: r.id as string,
    archetypeCode: r.archetypeCode as string,
    archetypeLabel: r.archetypeLabel as string,
    exploreMode: r.exploreMode as string,
    language: r.language as string,
    userId: hashUserId((r.userId as string) || null),
    createdAt: new Date(r.createdAt as string).toISOString(),
    userRegisteredAt: r.userRegisteredAt
      ? new Date(r.userRegisteredAt as string).toISOString()
      : null,
    researchGroup: (r.researchGroup as string) || null,
    researchParticipantId: (r.researchParticipantId as string) || null,

    score_R: scores.R != null ? Number(scores.R) : null,
    score_I: scores.I != null ? Number(scores.I) : null,
    score_A: scores.A != null ? Number(scores.A) : null,
    score_S: scores.S != null ? Number(scores.S) : null,
    score_E: scores.E != null ? Number(scores.E) : null,
    score_C: scores.C != null ? Number(scores.C) : null,
    confidenceTier: (data.confidenceTier as string) || null,
    assessmentType: (data.assessmentType as string) || null,
    scoringMethod: (data.scoringMethod as string) || null,
    rawResponses: Array.isArray(data.rawResponses)
      ? (data.rawResponses as number[])
      : null,
    totalDurationMs:
      data.totalDurationMs != null ? Number(data.totalDurationMs) : null,
    perItemDurationMs: Array.isArray(data.perItemDurationMs)
      ? (data.perItemDurationMs as number[])
      : null,
    medianItemDurationMs:
      data.medianItemDurationMs != null
        ? Number(data.medianItemDurationMs)
        : null,
    fastResponseCount:
      data.fastResponseCount != null ? Number(data.fastResponseCount) : null,
    sessionStartedAt: (data.sessionStartedAt as string) || null,
    sessionCompletedAt: (data.sessionCompletedAt as string) || null,
    deviceType: (data.deviceType as string) || null,
    screenWidth: data.screenWidth != null ? Number(data.screenWidth) : null,
    screenHeight: data.screenHeight != null ? Number(data.screenHeight) : null,
    viewportWidth:
      data.viewportWidth != null ? Number(data.viewportWidth) : null,
    userAgent: (data.userAgent as string) || null,

    // SJT raw answers
    sjt_1_would: sjtMap.get("1")?.would ?? null,
    sjt_1_should: sjtMap.get("1")?.should ?? null,
    sjt_2_would: sjtMap.get("2")?.would ?? null,
    sjt_2_should: sjtMap.get("2")?.should ?? null,
    sjt_3_would: sjtMap.get("3")?.would ?? null,
    sjt_3_should: sjtMap.get("3")?.should ?? null,
    sjt_4_would: sjtMap.get("4")?.would ?? null,
    sjt_4_should: sjtMap.get("4")?.should ?? null,
    sjt_5_would: sjtMap.get("5")?.would ?? null,
    sjt_5_should: sjtMap.get("5")?.should ?? null,
    sjt_6_would: sjtMap.get("6")?.would ?? null,
    sjt_6_should: sjtMap.get("6")?.should ?? null,

    // PVQ / TwIVI raw answers
    pvq_1: pvqMap.get("1") ?? null,
    pvq_2: pvqMap.get("2") ?? null,
    pvq_3: pvqMap.get("3") ?? null,
    pvq_4: pvqMap.get("4") ?? null,
    pvq_5: pvqMap.get("5") ?? null,
    pvq_6: pvqMap.get("6") ?? null,
    pvq_7: pvqMap.get("7") ?? null,
    pvq_8: pvqMap.get("8") ?? null,
    pvq_9: pvqMap.get("9") ?? null,
    pvq_10: pvqMap.get("10") ?? null,
    pvq_11: pvqMap.get("11") ?? null,
    pvq_12: pvqMap.get("12") ?? null,
    pvq_13: pvqMap.get("13") ?? null,
    pvq_14: pvqMap.get("14") ?? null,
    pvq_15: pvqMap.get("15") ?? null,
    pvq_16: pvqMap.get("16") ?? null,
    pvq_17: pvqMap.get("17") ?? null,
    pvq_18: pvqMap.get("18") ?? null,
    pvq_19: pvqMap.get("19") ?? null,
    pvq_20: pvqMap.get("20") ?? null,
    pvq_21: pvqMap.get("21") ?? null,

    // IPIP-30 raw answers (keyed by IPIP item ID)
    ipip_id1: ipipMap.get("1") ?? null,
    ipip_id2: ipipMap.get("2") ?? null,
    ipip_id4: ipipMap.get("4") ?? null,
    ipip_id9: ipipMap.get("9") ?? null,
    ipip_id13: ipipMap.get("13") ?? null,
    ipip_id20: ipipMap.get("20") ?? null,
    ipip_id27: ipipMap.get("27") ?? null,
    ipip_id40: ipipMap.get("40") ?? null,
    ipip_id41: ipipMap.get("41") ?? null,
    ipip_id44: ipipMap.get("44") ?? null,
    ipip_id47: ipipMap.get("47") ?? null,
    ipip_id48: ipipMap.get("48") ?? null,
    ipip_id49: ipipMap.get("49") ?? null,
    ipip_id51: ipipMap.get("51") ?? null,
    ipip_id54: ipipMap.get("54") ?? null,
    ipip_id56: ipipMap.get("56") ?? null,
    ipip_id59: ipipMap.get("59") ?? null,
    ipip_id60: ipipMap.get("60") ?? null,
    ipip_id67: ipipMap.get("67") ?? null,
    ipip_id72: ipipMap.get("72") ?? null,
    ipip_id75: ipipMap.get("75") ?? null,
    ipip_id76: ipipMap.get("76") ?? null,
    ipip_id82: ipipMap.get("82") ?? null,
    ipip_id83: ipipMap.get("83") ?? null,
    ipip_id85: ipipMap.get("85") ?? null,
    ipip_id88: ipipMap.get("88") ?? null,
    ipip_id93: ipipMap.get("93") ?? null,
    ipip_id95: ipipMap.get("95") ?? null,
    ipip_id96: ipipMap.get("96") ?? null,
    ipip_id98: ipipMap.get("98") ?? null,

    // Big Five normalized scores (0-100)
    bf_openness:
      domainsNorm?.openness != null ? Number(domainsNorm.openness) : null,
    bf_conscientiousness:
      domainsNorm?.conscientiousness != null
        ? Number(domainsNorm.conscientiousness)
        : null,
    bf_extraversion:
      domainsNorm?.extraversion != null
        ? Number(domainsNorm.extraversion)
        : null,
    bf_agreeableness:
      domainsNorm?.agreeableness != null
        ? Number(domainsNorm.agreeableness)
        : null,
    bf_neuroticism:
      domainsNorm?.neuroticism != null ? Number(domainsNorm.neuroticism) : null,

    // Schwartz ipsative-centered scores
    schwartz_achievement:
      centered?.achievement != null ? Number(centered.achievement) : null,
    schwartz_power: centered?.power != null ? Number(centered.power) : null,
    schwartz_stimulation:
      centered?.stimulation != null ? Number(centered.stimulation) : null,
    schwartz_self_direction:
      centered?.["self-direction"] != null
        ? Number(centered["self-direction"])
        : null,
    schwartz_hedonism:
      centered?.hedonism != null ? Number(centered.hedonism) : null,
    schwartz_benevolence:
      centered?.benevolence != null ? Number(centered.benevolence) : null,
    schwartz_universalism:
      centered?.universalism != null ? Number(centered.universalism) : null,
    schwartz_conformity:
      centered?.conformity != null ? Number(centered.conformity) : null,
    schwartz_tradition:
      centered?.tradition != null ? Number(centered.tradition) : null,
    schwartz_security:
      centered?.security != null ? Number(centered.security) : null,

    // SJT tension gaps (should − would per scenario)
    sjt_gap_1: sjtGapMap.has(1) ? (sjtGapMap.get(1) as number) : null,
    sjt_gap_2: sjtGapMap.has(2) ? (sjtGapMap.get(2) as number) : null,
    sjt_gap_3: sjtGapMap.has(3) ? (sjtGapMap.get(3) as number) : null,
    sjt_gap_4: sjtGapMap.has(4) ? (sjtGapMap.get(4) as number) : null,
    sjt_gap_5: sjtGapMap.has(5) ? (sjtGapMap.get(5) as number) : null,
    sjt_gap_6: sjtGapMap.has(6) ? (sjtGapMap.get(6) as number) : null,

    // Deep Dive behavioral metadata
    dd_totalDurationMs:
      meta?.totalTimeMs != null ? Number(meta.totalTimeMs) : null,
    dd_sjtTimeMs: moduleTimes?.sjt != null ? Number(moduleTimes.sjt) : null,
    dd_pvqTimeMs:
      (moduleTimes?.ddvq ?? moduleTimes?.pvq) != null
        ? Number((moduleTimes?.ddvq ?? moduleTimes?.pvq)!)
        : null,
    dd_ipipTimeMs:
      (moduleTimes?.ipip60 ?? moduleTimes?.ipip30 ?? moduleTimes?.ipip) != null
        ? Number(
            (moduleTimes?.ipip60 ?? moduleTimes?.ipip30 ?? moduleTimes?.ipip)!,
          )
        : null,
    dd_rushCount: meta?.rushCount != null ? Number(meta.rushCount) : null,

    // Feedback
    npsScore: r.npsScore != null ? Number(r.npsScore) : null,
    reportReaction: (r.reportReaction as string) || null,

    // Coaching aggregate
    coachingSessionCount: Number(r.coachingSessionCount) || 0,
    coachingTotalRounds: Number(r.coachingTotalRounds) || 0,
    coachingTotalDurationMs:
      r.coachingTotalDurationMs != null
        ? Number(r.coachingTotalDurationMs)
        : null,
  };
}

/**
 * Fetch QuickDiveResult rows for research/statistical export.
 * Joins User, AssessmentResult, QuestionnaireSession, ReportNPS,
 * ReportReaction, and CoachingSession to produce a comprehensive
 * flat row suitable for SPSS / R import.
 * userId is SHA-256 hashed for anonymisation.
 *
 * Consent gate: only consented research participants are included
 * (researchGroup IS NOT NULL AND researchConsentAt IS NOT NULL),
 * matching the thesis export semantics. Non-research / non-consented
 * platform users are never returned by this endpoint.
 */
export async function getResearchExportData(
  filters: ResearchExportFilters,
): Promise<ResearchExportRow[]> {
  const { mode, from, to, limit = 10000 } = filters;
  const modes = getQuickDiveModeAliases(mode);
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  // Single query with parameterized date conditions (NULL = no filter).
  // Avoids 4× SQL duplication that previously caused sync drift.
  const rows = await sql`
    WITH
      latest_assessment AS (
        SELECT DISTINCT ON ("userId")
          "userId", "resultJson", "sessionId"
        FROM "AssessmentResult"
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
      latest_reaction AS (
        SELECT DISTINCT ON ("userId")
          "userId", "reaction"
        FROM "ReportReaction"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      ),
      coaching_agg AS (
        SELECT
          "userId",
          COUNT(*)::int AS "sessionCount",
          COALESCE(SUM("roundNumber"), 0)::int AS "totalRounds",
          SUM(
            CASE WHEN "endedAt" IS NOT NULL
              THEN EXTRACT(EPOCH FROM ("endedAt" - "startedAt"))::bigint * 1000
              ELSE 0 END
          )::bigint AS "totalDurationMs"
        FROM "CoachingSession"
        WHERE "userId" IS NOT NULL
        GROUP BY "userId"
      )
    SELECT
      qd."id", qd."archetypeCode", qd."archetypeLabel", qd."scoresJson",
      qd."resultDataJson", qd."language", qd."userId", qd."exploreMode", qd."createdAt",
      u."createdAt"            AS "userRegisteredAt",
      u."researchGroup"        AS "researchGroup",
      u."researchParticipantId" AS "researchParticipantId",
      a."resultJson"           AS "assessmentResultJson",
      qs."answersJson"         AS "sessionAnswersJson",
      nps."score"              AS "npsScore",
      rr."reaction"            AS "reportReaction",
      COALESCE(ca."sessionCount", 0) AS "coachingSessionCount",
      COALESCE(ca."totalRounds",  0) AS "coachingTotalRounds",
      ca."totalDurationMs"           AS "coachingTotalDurationMs"
    FROM "QuickDiveResult" qd
    JOIN "User"                      u   ON u."id"     = qd."userId"
    LEFT JOIN latest_assessment      a   ON a."userId" = qd."userId"
    LEFT JOIN "QuestionnaireSession" qs  ON qs."id"    = a."sessionId"
    LEFT JOIN latest_nps             nps ON nps."userId" = qd."userId"
    LEFT JOIN latest_reaction        rr  ON rr."userId"  = qd."userId"
    LEFT JOIN coaching_agg           ca  ON ca."userId"  = qd."userId"
    WHERE qd."resultDataJson" IS NOT NULL
      AND qd."exploreMode" = ANY(${modes})
      AND u."researchGroup" IS NOT NULL
      AND u."researchConsentAt" IS NOT NULL
      AND u."isAdmin" = FALSE
      AND EXISTS (
        SELECT 1 FROM "ConsentRecord" cr
        WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
      )
      AND (${fromDate}::timestamptz IS NULL OR qd."createdAt" >= ${fromDate})
      AND (${toDate}::timestamptz IS NULL OR qd."createdAt" <= ${toDate})
    ORDER BY qd."createdAt" DESC
    LIMIT ${limit}
  `;

  return rows.map(mapResearchRow);
}

/**
 * Count QuickDiveResult rows matching the given filters.
 * Used by the admin panel to preview the export size before downloading.
 * Applies the same consent gate as getResearchExportData
 * (researchGroup IS NOT NULL AND researchConsentAt IS NOT NULL).
 */
export async function getResearchExportCount(
  filters: Omit<ResearchExportFilters, "limit">,
): Promise<number> {
  const { mode, from, to } = filters;
  const modes = getQuickDiveModeAliases(mode);
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const result = await sql`
    SELECT COUNT(*) as count FROM "QuickDiveResult" qd
    JOIN "User" u ON u."id" = qd."userId"
    WHERE qd."resultDataJson" IS NOT NULL
      AND qd."exploreMode" = ANY(${modes})
      AND u."researchGroup" IS NOT NULL
      AND u."researchConsentAt" IS NOT NULL
      AND u."isAdmin" = FALSE
      AND EXISTS (
        SELECT 1 FROM "ConsentRecord" cr
        WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
      )
      AND (${fromDate}::timestamptz IS NULL OR qd."createdAt" >= ${fromDate})
      AND (${toDate}::timestamptz IS NULL OR qd."createdAt" <= ${toDate})
  `;

  return parseInt(result[0]?.count as string, 10) || 0;
}
