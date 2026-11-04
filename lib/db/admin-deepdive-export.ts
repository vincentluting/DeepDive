// ============================================================
// Admin — Deep Dive Item-Level Export
//
// Provides per-item response export for psychometric analysis.
// ============================================================

import { sql } from "./connection";
import { createHash } from "crypto";

/**
 * IPIP-60 sorted item IDs (ascending).
 * Position N in this array → export column `ipip_N`.
 * Combines IPIP-30 item IDs with IPIP-60 item-B IDs, sorted ascending.
 */
const IPIP_60_SORTED_IDS_FOR_EXPORT = [
  1, 2, 4, 9, 11, 13, 16, 17, 20, 22, 23, 26, 27, 30, 33, 35, 37, 40, 41, 44,
  45, 47, 48, 49, 50, 51, 54, 56, 58, 59, 60, 66, 67, 68, 72, 75, 76, 81, 82,
  83, 84, 85, 88, 91, 92, 93, 94, 95, 96, 98, 99, 100, 102, 103, 104, 108, 109,
  115, 117, 119,
] as const;

/** Flat record type used by the Deep Dive item-level export. */
export type DeepDiveExportRecord = Record<string, string | number | null>;

/** Column headers for the Deep Dive item-level CSV export. */
export const DEEP_DIVE_CSV_HEADERS: string[] = [
  "participantId",
  "researchGroup",
  "language",
  "completedAt",
  "totalTimeMs",
  // SJT (6 scenarios × would/should)
  ...Array.from({ length: 6 }, (_, i) => [
    `sjt_${i + 1}_would`,
    `sjt_${i + 1}_should`,
  ]).flat(),
  // SJT tension gaps
  ...Array.from({ length: 6 }, (_, i) => `sjt_gap_${i + 1}`),
  // TwIVI raw responses
  ...Array.from({ length: 20 }, (_, i) => `ddvq_${i + 1}`),
  // IPIP-60 raw responses (positional — position N maps to sorted item ID)
  ...Array.from({ length: 60 }, (_, i) => `ipip_${i + 1}`),
  // Per-item response times (optional, semicolon-separated key:ms pairs)
  "response_times",
  // Quality flags
  "rushCount",
  "totalQuestions",
  "answeredQuestions",
  // Big Five normalized scores (0–100)
  "bf_openness",
  "bf_conscientiousness",
  "bf_extraversion",
  "bf_agreeableness",
  "bf_neuroticism",
  // Schwartz 10 values (ipsative-centered)
  "schwartz_achievement",
  "schwartz_power",
  "schwartz_stimulation",
  "schwartz_self_direction",
  "schwartz_hedonism",
  "schwartz_benevolence",
  "schwartz_universalism",
  "schwartz_conformity",
  "schwartz_tradition",
  "schwartz_security",
  // Archetype
  "archetype_code",
  "archetype_label",
  "archetype_confidence",
  // Module times (ms)
  "sjt_time_ms",
  "ddvq_time_ms",
  "ipip_time_ms",
];

export interface DeepDiveExportFilters {
  from?: string;
  to?: string;
  limit?: number;
}

function mapDeepDiveRow(r: Record<string, unknown>): DeepDiveExportRecord {
  const userId = (r.userId as string) || null;
  const participantId =
    (r.researchParticipantId as string | null) ||
    (userId
      ? createHash("sha256").update(userId).digest("hex").slice(0, 8)
      : "unknown");

  // ── Parse answersJson ───────────────────────────────────────
  const sessionAnswers =
    (r.answersJson as Array<Record<string, unknown>>) || [];
  const sjtMap = new Map<string, { would: string; should: string }>();
  const ddvqMap = new Map<string, number>();
  const ipipMap = new Map<string, number>();
  const responseTimeParts: string[] = [];
  let totalQuestions = 0;
  let answeredQuestions = 0;

  for (const answer of sessionAnswers) {
    const qid = String(answer.questionId ?? "");
    const value = answer.value as Record<string, unknown> | null;
    const responseTimeMs = answer.responseTimeMs as number | undefined;
    totalQuestions++;
    if (value != null) answeredQuestions++;
    if (!value) continue;

    const type = value.type as string;
    if (type === "sjt") {
      sjtMap.set(qid, {
        would: String(value.wouldChoice ?? ""),
        should: String(value.shouldChoice ?? ""),
      });
      if (responseTimeMs != null)
        responseTimeParts.push(`sjt${qid}:${responseTimeMs}`);
    } else if (type === "pvq") {
      ddvqMap.set(qid, value.rating as number);
      if (responseTimeMs != null)
        responseTimeParts.push(`ddvq${qid}:${responseTimeMs}`);
    } else if (type === "ipip") {
      ipipMap.set(qid, value.rating as number);
      if (responseTimeMs != null)
        responseTimeParts.push(`ipip${qid}:${responseTimeMs}`);
    }
  }

  // ── Parse AssessmentResult JSON ─────────────────────────────
  const assessment = (r.resultJson as Record<string, unknown>) || null;
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
  const archetype = assessment
    ? (assessment.archetype as Record<string, unknown>) || null
    : null;

  const sjtGapMap = new Map<number, number>();
  for (const s of scenarios) {
    const sid = s.scenarioId as number;
    const gap = s.gap as number;
    if (sid != null && gap != null) sjtGapMap.set(sid, gap);
  }

  const row: DeepDiveExportRecord = {
    participantId,
    researchGroup: (r.researchGroup as string) || null,
    language: (r.language as string) || null,
    completedAt: r.completedAt
      ? new Date(r.completedAt as string).toISOString()
      : null,
    totalTimeMs: r.totalTimeMs != null ? Number(r.totalTimeMs) : null,
  };

  // SJT answers
  for (let i = 1; i <= 6; i++) {
    row[`sjt_${i}_would`] = sjtMap.get(String(i))?.would ?? null;
    row[`sjt_${i}_should`] = sjtMap.get(String(i))?.should ?? null;
  }

  // SJT tension gaps
  for (let i = 1; i <= 6; i++) {
    row[`sjt_gap_${i}`] = sjtGapMap.has(i)
      ? (sjtGapMap.get(i) as number)
      : null;
  }

  // TwIVI answers
  for (let i = 1; i <= 20; i++) {
    row[`ddvq_${i}`] = ddvqMap.get(String(i)) ?? null;
  }

  // IPIP-60 positional answers (sorted by item ID)
  for (let pos = 1; pos <= 60; pos++) {
    const itemId = IPIP_60_SORTED_IDS_FOR_EXPORT[pos - 1];
    row[`ipip_${pos}`] = ipipMap.get(String(itemId)) ?? null;
  }

  // Response times (semicolon-separated)
  row.response_times =
    responseTimeParts.length > 0 ? responseTimeParts.join(";") : null;

  // Quality
  row.rushCount = meta?.rushCount != null ? Number(meta.rushCount) : null;
  row.totalQuestions = totalQuestions;
  row.answeredQuestions = answeredQuestions;

  // Big Five
  row.bf_openness =
    domainsNorm?.openness != null ? Number(domainsNorm.openness) : null;
  row.bf_conscientiousness =
    domainsNorm?.conscientiousness != null
      ? Number(domainsNorm.conscientiousness)
      : null;
  row.bf_extraversion =
    domainsNorm?.extraversion != null ? Number(domainsNorm.extraversion) : null;
  row.bf_agreeableness =
    domainsNorm?.agreeableness != null
      ? Number(domainsNorm.agreeableness)
      : null;
  row.bf_neuroticism =
    domainsNorm?.neuroticism != null ? Number(domainsNorm.neuroticism) : null;

  // Schwartz
  row.schwartz_achievement =
    centered?.achievement != null ? Number(centered.achievement) : null;
  row.schwartz_power = centered?.power != null ? Number(centered.power) : null;
  row.schwartz_stimulation =
    centered?.stimulation != null ? Number(centered.stimulation) : null;
  row.schwartz_self_direction =
    centered?.["self-direction"] != null
      ? Number(centered["self-direction"])
      : null;
  row.schwartz_hedonism =
    centered?.hedonism != null ? Number(centered.hedonism) : null;
  row.schwartz_benevolence =
    centered?.benevolence != null ? Number(centered.benevolence) : null;
  row.schwartz_universalism =
    centered?.universalism != null ? Number(centered.universalism) : null;
  row.schwartz_conformity =
    centered?.conformity != null ? Number(centered.conformity) : null;
  row.schwartz_tradition =
    centered?.tradition != null ? Number(centered.tradition) : null;
  row.schwartz_security =
    centered?.security != null ? Number(centered.security) : null;

  // Archetype
  row.archetype_code = (archetype?.code as string) || null;
  row.archetype_label = (archetype?.label_en as string) || null;
  row.archetype_confidence =
    archetype?.confidence != null ? Number(archetype.confidence) : null;

  // Module times
  row.sjt_time_ms = moduleTimes?.sjt != null ? Number(moduleTimes.sjt) : null;
  row.ddvq_time_ms =
    (moduleTimes?.ddvq ?? moduleTimes?.pvq) != null
      ? Number((moduleTimes?.ddvq ?? moduleTimes?.pvq)!)
      : null;
  row.ipip_time_ms =
    (moduleTimes?.ipip60 ?? moduleTimes?.ipip) != null
      ? Number((moduleTimes?.ipip60 ?? moduleTimes?.ipip)!)
      : null;

  return row;
}

/**
 * Fetch Deep Dive item-level data for research export.
 * One row per completed Deep Dive session.
 * Joins QuestionnaireSession (answersJson) + AssessmentResult (resultJson) + User.
 * participantId uses researchParticipantId or SHA-256(userId)[:8].
 *
 * Consent gate: only consented research participants are included
 * (researchGroup IS NOT NULL AND researchConsentAt IS NOT NULL),
 * matching the thesis export semantics. Non-research / non-consented
 * platform sessions are never returned by this endpoint.
 */
export async function getDeepDiveExportData(
  filters: DeepDiveExportFilters,
): Promise<DeepDiveExportRecord[]> {
  const { from, to, limit = 10000 } = filters;
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  let rows: Record<string, unknown>[];

  if (!fromDate && !toDate) {
    rows = await sql`
      SELECT
        qs."id", qs."userId", qs."language", qs."completedAt", qs."totalTimeMs",
        qs."answersJson",
        a."resultJson",
        u."researchGroup",
        u."researchParticipantId"
      FROM "QuestionnaireSession" qs
      JOIN "AssessmentResult" a ON a."sessionId" = qs."id"
      JOIN "User" u ON u."id" = qs."userId"
      WHERE qs."tier" = 'deep' AND qs."status" = 'completed'
        AND u."researchGroup" IS NOT NULL
        AND u."researchConsentAt" IS NOT NULL
        AND u."isAdmin" = FALSE
        AND EXISTS (
          SELECT 1 FROM "ConsentRecord" cr
          WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
        )
      ORDER BY qs."completedAt" DESC
      LIMIT ${limit}
    `;
  } else if (fromDate && !toDate) {
    rows = await sql`
      SELECT
        qs."id", qs."userId", qs."language", qs."completedAt", qs."totalTimeMs",
        qs."answersJson",
        a."resultJson",
        u."researchGroup",
        u."researchParticipantId"
      FROM "QuestionnaireSession" qs
      JOIN "AssessmentResult" a ON a."sessionId" = qs."id"
      JOIN "User" u ON u."id" = qs."userId"
      WHERE qs."tier" = 'deep' AND qs."status" = 'completed'
        AND u."researchGroup" IS NOT NULL
        AND u."researchConsentAt" IS NOT NULL
        AND u."isAdmin" = FALSE
        AND EXISTS (
          SELECT 1 FROM "ConsentRecord" cr
          WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
        )
        AND qs."completedAt" >= ${fromDate}
      ORDER BY qs."completedAt" DESC
      LIMIT ${limit}
    `;
  } else if (!fromDate && toDate) {
    rows = await sql`
      SELECT
        qs."id", qs."userId", qs."language", qs."completedAt", qs."totalTimeMs",
        qs."answersJson",
        a."resultJson",
        u."researchGroup",
        u."researchParticipantId"
      FROM "QuestionnaireSession" qs
      JOIN "AssessmentResult" a ON a."sessionId" = qs."id"
      JOIN "User" u ON u."id" = qs."userId"
      WHERE qs."tier" = 'deep' AND qs."status" = 'completed'
        AND u."researchGroup" IS NOT NULL
        AND u."researchConsentAt" IS NOT NULL
        AND u."isAdmin" = FALSE
        AND EXISTS (
          SELECT 1 FROM "ConsentRecord" cr
          WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
        )
        AND qs."completedAt" <= ${toDate}
      ORDER BY qs."completedAt" DESC
      LIMIT ${limit}
    `;
  } else {
    rows = await sql`
      SELECT
        qs."id", qs."userId", qs."language", qs."completedAt", qs."totalTimeMs",
        qs."answersJson",
        a."resultJson",
        u."researchGroup",
        u."researchParticipantId"
      FROM "QuestionnaireSession" qs
      JOIN "AssessmentResult" a ON a."sessionId" = qs."id"
      JOIN "User" u ON u."id" = qs."userId"
      WHERE qs."tier" = 'deep' AND qs."status" = 'completed'
        AND u."researchGroup" IS NOT NULL
        AND u."researchConsentAt" IS NOT NULL
        AND u."isAdmin" = FALSE
        AND EXISTS (
          SELECT 1 FROM "ConsentRecord" cr
          WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
        )
        AND qs."completedAt" >= ${fromDate} AND qs."completedAt" <= ${toDate}
      ORDER BY qs."completedAt" DESC
      LIMIT ${limit}
    `;
  }

  return rows.map(mapDeepDiveRow);
}

/**
 * Count completed Deep Dive sessions matching the given filters.
 * Used by the admin panel to preview the export size before downloading.
 * Applies the same consent gate as getDeepDiveExportData
 * (researchGroup IS NOT NULL AND researchConsentAt IS NOT NULL).
 */
export async function getDeepDiveExportCount(
  filters: DeepDiveExportFilters,
): Promise<number> {
  const { from, to } = filters;
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  let result: Record<string, unknown>[];

  if (!fromDate && !toDate) {
    result = await sql`
      SELECT COUNT(*) as count
      FROM "QuestionnaireSession" qs
      JOIN "AssessmentResult" a ON a."sessionId" = qs."id"
      JOIN "User" u ON u."id" = qs."userId"
      WHERE qs."tier" = 'deep' AND qs."status" = 'completed'
        AND u."researchGroup" IS NOT NULL
        AND u."researchConsentAt" IS NOT NULL
        AND u."isAdmin" = FALSE
        AND EXISTS (
          SELECT 1 FROM "ConsentRecord" cr
          WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
        )
    `;
  } else if (fromDate && !toDate) {
    result = await sql`
      SELECT COUNT(*) as count
      FROM "QuestionnaireSession" qs
      JOIN "AssessmentResult" a ON a."sessionId" = qs."id"
      JOIN "User" u ON u."id" = qs."userId"
      WHERE qs."tier" = 'deep' AND qs."status" = 'completed'
        AND u."researchGroup" IS NOT NULL
        AND u."researchConsentAt" IS NOT NULL
        AND u."isAdmin" = FALSE
        AND EXISTS (
          SELECT 1 FROM "ConsentRecord" cr
          WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
        )
        AND qs."completedAt" >= ${fromDate}
    `;
  } else if (!fromDate && toDate) {
    result = await sql`
      SELECT COUNT(*) as count
      FROM "QuestionnaireSession" qs
      JOIN "AssessmentResult" a ON a."sessionId" = qs."id"
      JOIN "User" u ON u."id" = qs."userId"
      WHERE qs."tier" = 'deep' AND qs."status" = 'completed'
        AND u."researchGroup" IS NOT NULL
        AND u."researchConsentAt" IS NOT NULL
        AND u."isAdmin" = FALSE
        AND EXISTS (
          SELECT 1 FROM "ConsentRecord" cr
          WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
        )
        AND qs."completedAt" <= ${toDate}
    `;
  } else {
    result = await sql`
      SELECT COUNT(*) as count
      FROM "QuestionnaireSession" qs
      JOIN "AssessmentResult" a ON a."sessionId" = qs."id"
      JOIN "User" u ON u."id" = qs."userId"
      WHERE qs."tier" = 'deep' AND qs."status" = 'completed'
        AND u."researchGroup" IS NOT NULL
        AND u."researchConsentAt" IS NOT NULL
        AND u."isAdmin" = FALSE
        AND EXISTS (
          SELECT 1 FROM "ConsentRecord" cr
          WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
        )
        AND qs."completedAt" >= ${fromDate} AND qs."completedAt" <= ${toDate}
    `;
  }

  return parseInt(result[0]?.count as string, 10) || 0;
}
