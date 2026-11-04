import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import {
  getResearchExportData,
  getResearchExportCount,
  type ResearchExportRow,
} from "@/lib/db/admin";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { escapeCsvField } from "@/lib/api/csv";

const CSV_HEADERS: (keyof ResearchExportRow)[] = [
  // Identity / demographics
  "id",
  "archetypeCode",
  "archetypeLabel",
  "exploreMode",
  "language",
  "userId", // SHA-256 hash
  "createdAt",
  "userRegisteredAt",
  "researchGroup",
  "researchParticipantId",

  // Quick Dive: RIASEC scores
  "score_R",
  "score_I",
  "score_A",
  "score_S",
  "score_E",
  "score_C",

  // Quick Dive: metadata
  "confidenceTier",
  "assessmentType",
  "scoringMethod",
  "rawResponses",

  // Quick Dive: behavioral
  "totalDurationMs",
  "perItemDurationMs",
  "medianItemDurationMs",
  "fastResponseCount",
  "sessionStartedAt",
  "sessionCompletedAt",
  "deviceType",
  "screenWidth",
  "screenHeight",
  "viewportWidth",
  "userAgent",

  // Deep Dive raw answers: SJT (6 scenarios × would/should)
  "sjt_1_would",
  "sjt_1_should",
  "sjt_2_would",
  "sjt_2_should",
  "sjt_3_would",
  "sjt_3_should",
  "sjt_4_would",
  "sjt_4_should",
  "sjt_5_would",
  "sjt_5_should",
  "sjt_6_would",
  "sjt_6_should",

  // Deep Dive raw answers: PVQ / TwIVI (6-point Likert)
  "pvq_1",
  "pvq_2",
  "pvq_3",
  "pvq_4",
  "pvq_5",
  "pvq_6",
  "pvq_7",
  "pvq_8",
  "pvq_9",
  "pvq_10",
  "pvq_11",
  "pvq_12",
  "pvq_13",
  "pvq_14",
  "pvq_15",
  "pvq_16",
  "pvq_17",
  "pvq_18",
  "pvq_19",
  "pvq_20",
  "pvq_21",

  // Deep Dive raw answers: IPIP-30 (5-point Likert, by IPIP item ID)
  "ipip_id1",
  "ipip_id2",
  "ipip_id4",
  "ipip_id9",
  "ipip_id13",
  "ipip_id20",
  "ipip_id27",
  "ipip_id40",
  "ipip_id41",
  "ipip_id44",
  "ipip_id47",
  "ipip_id48",
  "ipip_id49",
  "ipip_id51",
  "ipip_id54",
  "ipip_id56",
  "ipip_id59",
  "ipip_id60",
  "ipip_id67",
  "ipip_id72",
  "ipip_id75",
  "ipip_id76",
  "ipip_id82",
  "ipip_id83",
  "ipip_id85",
  "ipip_id88",
  "ipip_id93",
  "ipip_id95",
  "ipip_id96",
  "ipip_id98",

  // Scoring results: Big Five normalized (0–100)
  "bf_openness",
  "bf_conscientiousness",
  "bf_extraversion",
  "bf_agreeableness",
  "bf_neuroticism",

  // Scoring results: Schwartz 10 values (ipsative-centered)
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

  // Scoring results: SJT tension gaps (should − would)
  "sjt_gap_1",
  "sjt_gap_2",
  "sjt_gap_3",
  "sjt_gap_4",
  "sjt_gap_5",
  "sjt_gap_6",

  // Behavioral: Deep Dive
  "dd_totalDurationMs",
  "dd_sjtTimeMs",
  "dd_pvqTimeMs",
  "dd_ipipTimeMs",
  "dd_rushCount",

  // Feedback
  "npsScore",
  "reportReaction",

  // Coaching (no raw text)
  "coachingSessionCount",
  "coachingTotalRounds",
  "coachingTotalDurationMs",
];

function rowToCSVLine(row: ResearchExportRow): string {
  return CSV_HEADERS.map((key) => escapeCsvField(row[key])).join(",");
}

// Metadata comments prepended to the CSV for research clarity.
// Using "# " prefix so most data tools can skip comment lines.
const CSV_METADATA_COMMENTS = [
  "# DeepDive Career Exploration — Research Export",
  "# All timestamps (createdAt, userRegisteredAt, sessionStartedAt, sessionCompletedAt)",
  "#   are in ISO 8601 UTC format (e.g. 2026-03-01T14:30:00.000Z).",
  "#",
  "# Scale metadata:",
  "# SCC: 12-item Self-Concept Clarity Scale (Campbell et al., 1996). Range 12-60.",
  "#   Reverse-scored items: 1,2,3,4,5,7,8,9,10,12. Forward-scored items: 6,11.",
  "#",
];

function buildCSV(rows: ResearchExportRow[]): string {
  const bom = "\uFEFF"; // UTF-8 BOM — ensures Excel opens CJK characters correctly
  const meta = CSV_METADATA_COMMENTS.join("\r\n");
  const header = CSV_HEADERS.join(",");
  const lines = rows.map(rowToCSVLine);
  return bom + [meta, header, ...lines].join("\r\n");
}

export const GET = withLogging(
  "/api/admin/research-export",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const { searchParams } = new URL(request.url);
      const modeParam = searchParams.get("mode") || "all";
      const fromParam = searchParams.get("from") || undefined;
      const toParam = searchParams.get("to") || undefined;
      const format = searchParams.get("format") === "csv" ? "csv" : "json";
      const countOnly = searchParams.get("countOnly") === "true";

      // Validate mode
      const mode = (
        ["classic", "narrative", "immersive", "all"].includes(modeParam)
          ? modeParam
          : "all"
      ) as "classic" | "narrative" | "immersive" | "all";

      // Validate dates
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

      const filters = {
        mode,
        from: fromDate?.toISOString(),
        to: toDate?.toISOString(),
      };

      // Count-only mode for the admin panel preview
      if (countOnly) {
        const count = await getResearchExportCount(filters);
        return NextResponse.json({ count });
      }

      const rows = await getResearchExportData({ ...filters, limit: 10000 });
      const today = new Date().toISOString().split("T")[0];

      if (format === "csv") {
        const csv = buildCSV(rows);
        return new NextResponse(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="deepdive-research-export-${today}-UTC.csv"`,
            "Cache-Control": "no-store",
          },
        });
      }

      return new NextResponse(JSON.stringify(rows, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="deepdive-research-export-${today}-UTC.json"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      logApiError("/api/admin/research-export", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to generate research export",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);
