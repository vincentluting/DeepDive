import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { getThesisExportData, type ThesisExportRow } from "@/lib/db/admin";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { createHash } from "crypto";
import { escapeCsvField } from "@/lib/api/csv";

const CSV_HEADERS_FULL: (keyof ThesisExportRow)[] = [
  "userId",
  "email",
  "registrationDate",
  "country",
  "careerStage",
  "researchGroup",
  "researchParticipantId",
  "questionnaireCompleted",
  "questionnaireLanguage",
  "questionnaireTotalTimeMs",
  "pipelineVersion",
  "moduleTime_sjtMs",
  "moduleTime_valuesMs",
  "moduleTime_ipipMs",
  "rushCount",
  "quickDiveMode",
  "archetypeLabel",
  "reportGenerationTimeMs",
  "reportReaction",
  "npsScore",
  "npsFeedback",
  "coachingSessionCount",
  "totalCoachingRounds",
  "coachingFeedbackRating",
  "coachingFeedbackHighlight",
  "sccPre",
  "sccPost",
  "sccDelta",
  "postImmediate_sccTotal",
  "postImmediate_sccDelta",
  "post1week_sccTotal",
  "post1week_sccDelta",
  "cdcPre",
  "cdcPostImmediate",
  "cdcPost1week",
  "cdcDelta",
  "demo_age",
  "demo_gender",
  "demo_employment",
  "demo_experience",
  "trust_willing_to_disclose",
  "trust_felt_understood",
  "trust_comfortable_sharing",
  "trust_ai_competence",
  "trust_emotional_safety",
  "trust_mean",
  "constraints_adequately_considered",
  "constraints_increased_confidence",
  "constraints_actionable",
  "constraints_mean",
  "attn_check_1",
  "attn_check_passed",
  "ux1",
  "ux2",
  "ux3",
  "ux4",
  "ux5",
  "ux6",
  "ux7",
  "ux8",
  "ux9",
  "ux10",
  "ux11",
  "ux12",
  "ux4_reversed",
  "ux5_reversed",
  "ux6_reversed",
  "delayed_continued_thinking",
  "delayed_took_action",
  "delayed_perspective_shift",
  "most_valuable_features",
  "feature_ranking",
  "t1_open_feedback",
  "t2_open_feedback",
  "experienceFeedback_satisfaction",
  "experienceFeedback_nps",
  "experienceFeedback_valuableFeatures",
  "experienceFeedback_openFeedback",
  "reportEngagement_totalTimeMs",
  "reportEngagement_maxScrollDepth",
  "reportEngagement_scrollbackCount",
  "reportEngagement_panel1Ms",
  "reportEngagement_panel2Ms",
  "reportEngagement_panel3Ms",
  "reportEngagement_integrationMs",
];

// Anonymized version — omits PII columns, replaces userId with participant ID
const CSV_HEADERS_ANON: string[] = [
  "participantId", // replaces userId
  // email omitted
  "registrationDate",
  "country",
  "careerStage",
  "researchGroup",
  "researchParticipantId",
  "questionnaireCompleted",
  "questionnaireLanguage",
  "questionnaireTotalTimeMs",
  "pipelineVersion",
  "moduleTime_sjtMs",
  "moduleTime_valuesMs",
  "moduleTime_ipipMs",
  "rushCount",
  "quickDiveMode",
  "archetypeLabel",
  "reportGenerationTimeMs",
  "reportReaction",
  "npsScore",
  "npsFeedback",
  "coachingSessionCount",
  "totalCoachingRounds",
  "coachingFeedbackRating",
  "coachingFeedbackHighlight",
  "sccPre",
  "sccPost",
  "sccDelta",
  "postImmediate_sccTotal",
  "postImmediate_sccDelta",
  "post1week_sccTotal",
  "post1week_sccDelta",
  "cdcPre",
  "cdcPostImmediate",
  "cdcPost1week",
  "cdcDelta",
  "demo_age",
  "demo_gender",
  "demo_employment",
  "demo_experience",
  "trust_willing_to_disclose",
  "trust_felt_understood",
  "trust_comfortable_sharing",
  "trust_ai_competence",
  "trust_emotional_safety",
  "trust_mean",
  "constraints_adequately_considered",
  "constraints_increased_confidence",
  "constraints_actionable",
  "constraints_mean",
  "attn_check_1",
  "attn_check_passed",
  "ux1",
  "ux2",
  "ux3",
  "ux4",
  "ux5",
  "ux6",
  "ux7",
  "ux8",
  "ux9",
  "ux10",
  "ux11",
  "ux12",
  "ux4_reversed",
  "ux5_reversed",
  "ux6_reversed",
  "delayed_continued_thinking",
  "delayed_took_action",
  "delayed_perspective_shift",
  "most_valuable_features",
  "feature_ranking",
  "t1_open_feedback",
  "t2_open_feedback",
  "experienceFeedback_satisfaction",
  "experienceFeedback_nps",
  "experienceFeedback_valuableFeatures",
  "experienceFeedback_openFeedback",
  "reportEngagement_totalTimeMs",
  "reportEngagement_maxScrollDepth",
  "reportEngagement_scrollbackCount",
  "reportEngagement_panel1Ms",
  "reportEngagement_panel2Ms",
  "reportEngagement_panel3Ms",
  "reportEngagement_integrationMs",
];

function rowToCSVLineFull(row: ThesisExportRow): string {
  return CSV_HEADERS_FULL.map((key) => escapeCsvField(row[key])).join(",");
}

function rowToCSVLineAnon(row: ThesisExportRow): string {
  // participantId: use researchParticipantId if set, else SHA-256(email)[:8]
  const participantId =
    row.researchParticipantId ||
    createHash("sha256")
      .update(row.email || row.userId)
      .digest("hex")
      .slice(0, 8);

  const values: unknown[] = [
    participantId,
    // email omitted
    row.registrationDate,
    row.country,
    row.careerStage,
    row.researchGroup,
    row.researchParticipantId,
    row.questionnaireCompleted,
    row.questionnaireLanguage,
    row.questionnaireTotalTimeMs,
    row.pipelineVersion,
    row.moduleTime_sjtMs,
    row.moduleTime_valuesMs,
    row.moduleTime_ipipMs,
    row.rushCount,
    row.quickDiveMode,
    row.archetypeLabel,
    row.reportGenerationTimeMs,
    row.reportReaction,
    row.npsScore,
    row.npsFeedback,
    row.coachingSessionCount,
    row.totalCoachingRounds,
    row.coachingFeedbackRating,
    row.coachingFeedbackHighlight,
    row.sccPre,
    row.sccPost,
    row.sccDelta,
    row.postImmediate_sccTotal,
    row.postImmediate_sccDelta,
    row.post1week_sccTotal,
    row.post1week_sccDelta,
    row.cdcPre,
    row.cdcPostImmediate,
    row.cdcPost1week,
    row.cdcDelta,
    row.demo_age,
    row.demo_gender,
    row.demo_employment,
    row.demo_experience,
    row.trust_willing_to_disclose,
    row.trust_felt_understood,
    row.trust_comfortable_sharing,
    row.trust_ai_competence,
    row.trust_emotional_safety,
    row.trust_mean,
    row.constraints_adequately_considered,
    row.constraints_increased_confidence,
    row.constraints_actionable,
    row.constraints_mean,
    row.attn_check_1,
    row.attn_check_passed,
    row.ux1,
    row.ux2,
    row.ux3,
    row.ux4,
    row.ux5,
    row.ux6,
    row.ux7,
    row.ux8,
    row.ux9,
    row.ux10,
    row.ux11,
    row.ux12,
    row.ux4_reversed,
    row.ux5_reversed,
    row.ux6_reversed,
    row.delayed_continued_thinking,
    row.delayed_took_action,
    row.delayed_perspective_shift,
    row.most_valuable_features,
    row.feature_ranking,
    row.t1_open_feedback,
    row.t2_open_feedback,
    row.experienceFeedback_satisfaction,
    row.experienceFeedback_nps,
    row.experienceFeedback_valuableFeatures,
    row.experienceFeedback_openFeedback,
    row.reportEngagement_totalTimeMs,
    row.reportEngagement_maxScrollDepth,
    row.reportEngagement_scrollbackCount,
    row.reportEngagement_panel1Ms,
    row.reportEngagement_panel2Ms,
    row.reportEngagement_panel3Ms,
    row.reportEngagement_integrationMs,
  ];
  return values.map(escapeCsvField).join(",");
}

// Metadata comments prepended to the CSV for research clarity.
// Using "# " prefix so most data tools can skip comment lines.
const CSV_METADATA_COMMENTS = [
  "# DeepDive Career Exploration — Thesis Data Export",
  "# All timestamps are in ISO 8601 UTC format (e.g. 2026-03-01T14:30:00.000Z).",
  "#",
  "# Scale metadata:",
  "# SCC (sccPre / sccPost / sccDelta): 12-item Self-Concept Clarity Scale",
  "#   (Campbell et al., 1996). Range 12-60. Higher = greater self-concept clarity.",
  "#   Reverse-scored items: 1,2,3,4,5,7,8,9,10,12. Forward-scored items: 6,11.",
  "#",
  "# CDC (cdcPre / cdcPostImmediate / cdcPost1week / cdcDelta): 5-item Career Direction Confidence.",
  "#   Range 5-25. Higher = greater career direction confidence.",
  "#",
  "# UES (ux1-ux12): User Engagement Scale Short Form (O'Brien et al., 2018). 12-item Likert (1-5).",
  "#   Subscales: FA(1-3), PU(4-6), AE(7-9), RW(10-12).",
  "#   ux1-ux12 are raw Likert answers (as entered by participant).",
  "#   ux4_reversed, ux5_reversed, ux6_reversed are PRE-COMPUTED reverse scores (6 − raw).",
  "#   Use the *_reversed columns when summing/averaging UES subscales or total score.",
  "#",
  "# Q1 (trust_*): Trust & Psychological Safety — 5-item Likert (1-5). trust_mean = average of 5 items.",
  "# Q2 (constraints_*): Real-World Constraints Confidence — 3-item Likert (1-5). constraints_mean = average of 3 items.",
  "# Attention check (attn_check_*): T1-only instructed-response item per Meade & Craig (2012).",
  "#   attn_check_1 = raw Likert (1-5); expected value = 4 (Agree). attn_check_passed = (raw == 4).",
  "#   Blank (null) means the participant never reached T1 (no row to score against).",
  "#   Use attn_check_passed=false rows for sensitivity analysis (exclude/include comparison).",
  "# Q3 (most_valuable_features, feature_ranking): comma-separated multi-select (max 2) + ranking.",
  "#",
  "# DR-3 (delayed_*): Delayed Reflection — 3-item Likert (1-5). T2 only. Report item-level, not composite.",
  "#",
];

function buildCSV(rows: ThesisExportRow[], anonymize: boolean): string {
  const meta = CSV_METADATA_COMMENTS.join("\r\n");
  const header = anonymize
    ? CSV_HEADERS_ANON.join(",")
    : CSV_HEADERS_FULL.join(",");
  const lines = anonymize
    ? rows.map(rowToCSVLineAnon)
    : rows.map(rowToCSVLineFull);
  return [meta, header, ...lines].join("\r\n");
}

export const GET = withLogging(
  "/api/admin/export/thesis-data",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const { searchParams } = new URL(request.url);
      // Privacy-first default: thesis exports are anonymized unless an admin
      // explicitly asks for identifiable fields for compensation/reconciliation.
      const includePii = searchParams.get("includePii") === "true";
      const anonymize = !includePii;
      const fromParam = searchParams.get("from") || undefined;
      const toParam = searchParams.get("to") || undefined;
      const fromDate = fromParam ? new Date(fromParam) : null;
      const toDate = toParam ? new Date(toParam) : null;

      if (fromDate && isNaN(fromDate.getTime())) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Invalid 'from' date",
          400,
        );
      }
      if (toDate && isNaN(toDate.getTime())) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Invalid 'to' date",
          400,
        );
      }

      const rows = await getThesisExportData({
        from: fromDate?.toISOString(),
        to: toDate?.toISOString(),
      });
      const csv = buildCSV(rows, anonymize);

      const today = new Date().toISOString().split("T")[0];
      const suffix = anonymize ? "-anonymized" : "-pii";
      const filename = `deepdive-thesis-data-${today}${suffix}-UTC.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      logApiError(
        "/api/admin/export/thesis-data",
        ApiErrorCode.INTERNAL_ERROR,
        {
          message: "Failed to generate thesis export",
          cause: error,
        },
      );
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);
