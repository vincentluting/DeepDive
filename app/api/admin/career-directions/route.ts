import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { escapeCsvField } from "@/lib/api/csv";
import { parseBody } from "@/lib/validation/parse-body";
import {
  listCareerDirections,
  createCareerDirection,
  updateCareerDirection,
  deactivateCareerDirection,
  reactivateCareerDirection,
  getCareerDirectionStats,
  batchToggleActive,
} from "@/lib/db/career-directions";
import { invalidateCareerPoolCache } from "@/lib/career-matching/career-pool";

// ── CSV export helper ────────────────────────────────────────

const CSV_COLUMNS = [
  "id",
  "source",
  "titleEn",
  "titleZh",
  "subtitleZh",
  "R",
  "I",
  "A",
  "S",
  "E",
  "C",
  "alignedValues",
  "idealBigFive",
  "industries",
  "crossCulturalFit",
  "seniorityMin",
  "seniorityMax",
  "tags",
  "aiEraCategory",
  "annotationSource",
  "annotationConfidence",
  "marketOutlook",
  "isActive",
  "lastReviewedAt",
] as const;

interface CsvRow {
  id: string;
  source: string;
  titleEn: string;
  titleZh: string;
  subtitleZh: string | null;
  idealRiasec: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };
  alignedValues: string[];
  idealBigFive: Record<string, { min: number; max: number }>;
  industries: string[];
  crossCulturalFit: string[];
  seniorityMin: number;
  seniorityMax: number;
  tags: string[];
  aiEraCategory: string | null;
  annotationSource: string;
  annotationConfidence: string;
  marketOutlook: Record<string, unknown> | null;
  isActive: boolean;
  lastReviewedAt: Date | string | null;
}

function buildCsv(rows: CsvRow[]): string {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((row) => {
    const values: string[] = [
      row.id,
      row.source,
      escapeCsvField(row.titleEn),
      escapeCsvField(row.titleZh),
      escapeCsvField(row.subtitleZh || ""),
      String(row.idealRiasec.R),
      String(row.idealRiasec.I),
      String(row.idealRiasec.A),
      String(row.idealRiasec.S),
      String(row.idealRiasec.E),
      String(row.idealRiasec.C),
      escapeCsvField(row.alignedValues.join("; ")),
      escapeCsvField(JSON.stringify(row.idealBigFive)),
      escapeCsvField(row.industries.join("; ")),
      escapeCsvField(row.crossCulturalFit.join("; ")),
      String(row.seniorityMin),
      String(row.seniorityMax),
      escapeCsvField(row.tags.join("; ")),
      row.aiEraCategory || "",
      row.annotationSource,
      row.annotationConfidence,
      escapeCsvField(
        row.marketOutlook ? JSON.stringify(row.marketOutlook) : "",
      ),
      row.isActive ? "true" : "false",
      row.lastReviewedAt
        ? new Date(row.lastReviewedAt as string).toISOString()
        : "",
    ];
    return values.join(",");
  });
  return "\uFEFF" + [header, ...lines].join("\n");
}

// ── Shared sub-schemas ──────────────────────────────────────

const riasecSchema = z.object({
  R: z.number().min(0).max(100),
  I: z.number().min(0).max(100),
  A: z.number().min(0).max(100),
  S: z.number().min(0).max(100),
  E: z.number().min(0).max(100),
  C: z.number().min(0).max(100),
});

const bigFiveRangeSchema = z.object({
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
});

const marketOutlookSchema = z
  .object({
    trend: z.enum(["growing", "stable", "transforming", "emerging"]),
    label_zh: z.string().min(1),
    label_en: z.string().min(1),
    note_zh: z.string().optional(),
    note_en: z.string().optional(),
    source: z.string().min(1),
    lastUpdated: z.string().min(1),
  })
  .nullable()
  .optional();

const sourceEnum = z.enum(["curated", "onet", "emerging"]);
const aiEraCategoryEnum = z
  .enum(["stable", "augmented", "transformed", "ai-native"])
  .nullable()
  .optional();
const annotationSourceEnum = z.enum([
  "expert-heuristic",
  "empirical-data",
  "ai-assisted",
]);
const annotationConfidenceEnum = z.enum([
  "expert-estimated",
  "data-validated",
  "community-verified",
]);

// ── GET: List career directions (paginated, filterable) ─────

export const GET = withLogging(
  "/api/admin/career-directions",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    const url = new URL(request.url);
    const source = url.searchParams.get("source") as
      | "curated"
      | "onet"
      | "emerging"
      | null;
    const search = url.searchParams.get("search") || undefined;
    const isActiveParam = url.searchParams.get("isActive");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50", 10) || 50,
      200,
    );
    const offset = parseInt(url.searchParams.get("offset") || "0", 10) || 0;
    const statsOnly = url.searchParams.get("stats") === "true";

    try {
      if (statsOnly) {
        const stats = await getCareerDirectionStats();
        return NextResponse.json({ stats });
      }

      const isActive =
        isActiveParam === "true"
          ? true
          : isActiveParam === "false"
            ? false
            : undefined;
      const format = url.searchParams.get("format");

      // CSV export — fetch all matching rows (no pagination)
      if (format === "csv") {
        const result = await listCareerDirections({
          source: source || undefined,
          search,
          isActive,
          limit: 9999,
          offset: 0,
        });

        const csvContent = buildCsv(result.rows);
        return new Response(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="career-directions-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        });
      }

      const result = await listCareerDirections({
        source: source || undefined,
        search,
        isActive,
        limit,
        offset,
      });

      return NextResponse.json({
        rows: result.rows,
        total: result.total,
        limit,
        offset,
      });
    } catch (error) {
      logApiError("/api/admin/career-directions", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to list career directions",
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

// ── POST: Create a new career direction ─────────────────────

const createSchema = z.object({
  id: z.string().min(1).max(100),
  source: sourceEnum,
  titleEn: z.string().min(1).max(200),
  titleZh: z.string().min(1).max(200),
  subtitleZh: z.string().max(500).optional(),
  idealRiasec: riasecSchema,
  alignedValues: z.array(z.string()).min(1).max(6),
  idealBigFive: z.record(z.string(), bigFiveRangeSchema).optional().default({}),
  industries: z.array(z.string()).max(20).default([]),
  crossCulturalFit: z
    .array(z.enum(["bridge", "integrate", "root", "global"]))
    .default([]),
  seniorityMin: z.number().int().min(0).max(50).default(0),
  seniorityMax: z.number().int().min(0).max(50).default(20),
  tags: z.array(z.string()).max(30).default([]),
  aiEraCategory: aiEraCategoryEnum,
  annotationSource: annotationSourceEnum,
  annotationConfidence: annotationConfidenceEnum,
  marketOutlook: marketOutlookSchema,
});

export const POST = withLogging(
  "/api/admin/career-directions",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, createSchema);
    if ("error" in parsed) return parsed.error;

    try {
      const id = await createCareerDirection(parsed.data);
      invalidateCareerPoolCache();
      return NextResponse.json({ id }, { status: 201 });
    } catch (error) {
      const pgCode = (error as { code?: string }).code;
      if (pgCode === "23505") {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          `Career direction "${parsed.data.id}" already exists`,
          409,
        );
      }
      logApiError("/api/admin/career-directions", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to create career direction",
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

// ── PATCH: Update, toggle, or batch operations ──────────────

const singleUpdateSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["update", "deactivate", "reactivate"]),
  data: z
    .object({
      titleEn: z.string().min(1).max(200),
      titleZh: z.string().min(1).max(200),
      subtitleZh: z.string().max(500).nullable(),
      idealRiasec: riasecSchema,
      alignedValues: z.array(z.string()).min(1).max(6),
      idealBigFive: z.record(z.string(), bigFiveRangeSchema),
      industries: z.array(z.string()).max(20),
      crossCulturalFit: z.array(
        z.enum(["bridge", "integrate", "root", "global"]),
      ),
      seniorityMin: z.number().int().min(0).max(50),
      seniorityMax: z.number().int().min(0).max(50),
      tags: z.array(z.string()).max(30),
      aiEraCategory: aiEraCategoryEnum,
      annotationSource: annotationSourceEnum,
      annotationConfidence: annotationConfidenceEnum,
      marketOutlook: marketOutlookSchema,
    })
    .optional(),
});

const batchSchema = z.object({
  action: z.enum(["batch-deactivate", "batch-reactivate"]),
  ids: z.array(z.string().min(1)).min(1).max(500),
});

const patchSchema = z.union([singleUpdateSchema, batchSchema]);

export const PATCH = withLogging(
  "/api/admin/career-directions",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, patchSchema);
    if ("error" in parsed) return parsed.error;

    const body = parsed.data;

    try {
      // Batch operations
      if (
        body.action === "batch-deactivate" ||
        body.action === "batch-reactivate"
      ) {
        const ids = (body as { ids: string[] }).ids;
        const isActive = body.action === "batch-reactivate";
        const result = await batchToggleActive(ids, isActive);
        invalidateCareerPoolCache();
        return NextResponse.json({ success: true, affected: result });
      }

      // Single operations
      const { id, action, data } = body as z.infer<typeof singleUpdateSchema>;
      let success = false;

      if (action === "deactivate") {
        success = await deactivateCareerDirection(id);
      } else if (action === "reactivate") {
        success = await reactivateCareerDirection(id);
      } else if (action === "update" && data) {
        success = await updateCareerDirection(id, {
          ...data,
          marketOutlook: data.marketOutlook ?? null,
        });
      } else {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Update action requires data",
          400,
        );
      }

      if (!success) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          `Career direction "${id}" not found or no change needed`,
          404,
        );
      }

      invalidateCareerPoolCache();
      return NextResponse.json({ success: true });
    } catch (error) {
      logApiError("/api/admin/career-directions", ApiErrorCode.INTERNAL_ERROR, {
        message: `Failed to ${body.action} career direction`,
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
