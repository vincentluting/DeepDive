import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { INDUSTRY_IDS } from "@/lib/constants/industries";
import { bulkUpsertCareerDirections } from "@/lib/db/career-directions";
import { invalidateCareerPoolCache } from "@/lib/career-matching/career-pool";

// ── Zod row schema (final type-safe gate before DB upsert) ──────
// The handwritten parseCsvLine handles CSV splitting; rowSchema enforces
// types, ranges, and string-length caps on the parsed result so a broken
// CSV can't inject oversized strings or malformed enum values into the DB.

const MAX_ROWS = 5000;
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB CSV

const riasecScore = z.number().int().min(0).max(100);
const shortStr = (max: number) => z.string().max(max);

const rowSchema = z.object({
  id: z.string().min(1).max(128),
  source: z.enum(["curated", "onet", "emerging"]),
  titleEn: z.string().min(1).max(200),
  titleZh: z.string().min(1).max(200),
  subtitleZh: shortStr(500).nullable(),
  idealRiasec: z.object({
    R: riasecScore,
    I: riasecScore,
    A: riasecScore,
    S: riasecScore,
    E: riasecScore,
    C: riasecScore,
  }),
  alignedValues: z.array(shortStr(100)).min(1).max(20),
  idealBigFive: z
    .record(
      z.string().max(50),
      z.object({
        min: z.number().min(0).max(100),
        max: z.number().min(0).max(100),
      }),
    )
    .refine(
      (r) => Object.keys(r).length <= 10,
      "idealBigFive: at most 10 keys",
    ),
  industries: z.array(shortStr(100)).max(20),
  crossCulturalFit: z.array(shortStr(100)).max(20),
  seniorityMin: z.number().int().min(0).max(50),
  seniorityMax: z.number().int().min(0).max(50),
  tags: z.array(shortStr(100)).max(50),
  aiEraCategory: z
    .enum(["stable", "augmented", "transformed", "ai-native"])
    .nullable(),
  annotationSource: z.enum([
    "expert-heuristic",
    "empirical-data",
    "ai-assisted",
  ]),
  annotationConfidence: z.enum([
    "expert-estimated",
    "data-validated",
    "community-verified",
  ]),
  marketOutlook: z
    .object({
      trend: shortStr(100),
      label_zh: shortStr(200),
      label_en: shortStr(200),
      note_zh: shortStr(1000).optional(),
      note_en: shortStr(1000).optional(),
      source: shortStr(500),
      lastUpdated: shortStr(50),
    })
    .nullable(),
  isActive: z.boolean(),
});

// ── CSV Parser ──────────────────────────────────────────────

const REQUIRED_COLUMNS = [
  "id",
  "source",
  "titleEn",
  "titleZh",
  "R",
  "I",
  "A",
  "S",
  "E",
  "C",
  "alignedValues",
  "annotationSource",
  "annotationConfidence",
] as const;

const VALID_SOURCES = new Set(["curated", "onet", "emerging"]);
const VALID_AI_ERA = new Set([
  "stable",
  "augmented",
  "transformed",
  "ai-native",
  "",
]);
const VALID_ANNOTATION_SOURCE = new Set([
  "expert-heuristic",
  "empirical-data",
  "ai-assisted",
]);
const VALID_CONFIDENCE = new Set([
  "expert-estimated",
  "data-validated",
  "community-verified",
]);

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

interface ParsedRow {
  id: string;
  source: "curated" | "onet" | "emerging";
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
  aiEraCategory: "stable" | "augmented" | "transformed" | "ai-native" | null;
  annotationSource: "expert-heuristic" | "empirical-data" | "ai-assisted";
  annotationConfidence:
    | "expert-estimated"
    | "data-validated"
    | "community-verified";
  marketOutlook: {
    trend: string;
    label_zh: string;
    label_en: string;
    note_zh?: string;
    note_en?: string;
    source: string;
    lastUpdated: string;
  } | null;
  isActive: boolean;
}

interface ParseError {
  row: number;
  field: string;
  message: string;
}

function parseCsvBody(csvText: string): {
  rows: ParsedRow[];
  errors: ParseError[];
} {
  // Strip BOM
  const clean = csvText.startsWith("\uFEFF") ? csvText.slice(1) : csvText;
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          field: "header",
          message: "CSV must have a header row and at least one data row",
        },
      ],
    };
  }

  const header = parseCsvLine(lines[0]);
  const colIndex: Record<string, number> = {};
  header.forEach((col, i) => {
    colIndex[col.trim()] = i;
  });

  // Validate required columns exist
  const missingCols = REQUIRED_COLUMNS.filter((c) => colIndex[c] === undefined);
  if (missingCols.length > 0) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          field: "header",
          message: `Missing required columns: ${missingCols.join(", ")}`,
        },
      ],
    };
  }

  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];

  const col = (fields: string[], name: string): string => {
    const idx = colIndex[name];
    return idx !== undefined ? (fields[idx] ?? "").trim() : "";
  };

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const rowNum = i + 1;

    const id = col(fields, "id");
    if (!id) {
      errors.push({ row: rowNum, field: "id", message: "ID is required" });
      continue;
    }

    const source = col(fields, "source");
    if (!VALID_SOURCES.has(source)) {
      errors.push({
        row: rowNum,
        field: "source",
        message: `Invalid source: "${source}"`,
      });
      continue;
    }

    const titleEn = col(fields, "titleEn");
    const titleZh = col(fields, "titleZh");
    if (!titleEn || !titleZh) {
      errors.push({
        row: rowNum,
        field: "title",
        message: "Both titleEn and titleZh are required",
      });
      continue;
    }

    const R = parseInt(col(fields, "R"), 10);
    const I = parseInt(col(fields, "I"), 10);
    const A = parseInt(col(fields, "A"), 10);
    const S = parseInt(col(fields, "S"), 10);
    const E = parseInt(col(fields, "E"), 10);
    const C = parseInt(col(fields, "C"), 10);
    if ([R, I, A, S, E, C].some((v) => isNaN(v) || v < 0 || v > 100)) {
      errors.push({
        row: rowNum,
        field: "RIASEC",
        message: "RIASEC values must be 0-100",
      });
      continue;
    }

    const alignedValuesStr = col(fields, "alignedValues");
    const alignedValues = alignedValuesStr
      ? alignedValuesStr
          .split(";")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];
    if (alignedValues.length === 0) {
      errors.push({
        row: rowNum,
        field: "alignedValues",
        message: "At least one aligned value required",
      });
      continue;
    }

    const annotationSource = col(fields, "annotationSource");
    if (!VALID_ANNOTATION_SOURCE.has(annotationSource)) {
      errors.push({
        row: rowNum,
        field: "annotationSource",
        message: `Invalid: "${annotationSource}"`,
      });
      continue;
    }

    const annotationConfidence = col(fields, "annotationConfidence");
    if (!VALID_CONFIDENCE.has(annotationConfidence)) {
      errors.push({
        row: rowNum,
        field: "annotationConfidence",
        message: `Invalid: "${annotationConfidence}"`,
      });
      continue;
    }

    const aiEra = col(fields, "aiEraCategory");
    if (aiEra && !VALID_AI_ERA.has(aiEra)) {
      errors.push({
        row: rowNum,
        field: "aiEraCategory",
        message: `Invalid: "${aiEra}"`,
      });
      continue;
    }

    // Parse optional JSON fields
    let idealBigFive: Record<string, { min: number; max: number }> = {};
    const bigFiveStr = col(fields, "idealBigFive");
    if (bigFiveStr) {
      try {
        idealBigFive = JSON.parse(bigFiveStr);
      } catch {
        errors.push({
          row: rowNum,
          field: "idealBigFive",
          message: "Invalid JSON",
        });
        continue;
      }
    }

    let marketOutlook: ParsedRow["marketOutlook"] = null;
    const moStr = col(fields, "marketOutlook");
    if (moStr) {
      try {
        marketOutlook = JSON.parse(moStr);
      } catch {
        errors.push({
          row: rowNum,
          field: "marketOutlook",
          message: "Invalid JSON",
        });
        continue;
      }
    }

    const isActiveStr = col(fields, "isActive");
    const isActive = isActiveStr !== "false";

    const candidate = {
      id,
      source,
      titleEn,
      titleZh,
      subtitleZh: col(fields, "subtitleZh") || null,
      idealRiasec: { R, I, A, S, E, C },
      alignedValues,
      idealBigFive,
      industries: col(fields, "industries")
        ? col(fields, "industries")
            .split(";")
            .map((v) => v.trim())
            .filter(Boolean)
        : [],
      crossCulturalFit: col(fields, "crossCulturalFit")
        ? col(fields, "crossCulturalFit")
            .split(";")
            .map((v) => v.trim())
            .filter(Boolean)
        : [],
      seniorityMin: parseInt(col(fields, "seniorityMin") || "0", 10) || 0,
      seniorityMax: parseInt(col(fields, "seniorityMax") || "20", 10) || 20,
      tags: col(fields, "tags")
        ? col(fields, "tags")
            .split(";")
            .map((v) => v.trim())
            .filter(Boolean)
        : [],
      aiEraCategory: aiEra || null,
      annotationSource,
      annotationConfidence,
      marketOutlook,
      isActive,
    };

    const parsed = rowSchema.safeParse(candidate);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      errors.push({
        row: rowNum,
        field: first?.path.join(".") || "row",
        message: first?.message || "Row failed schema validation",
      });
      continue;
    }
    rows.push(parsed.data);
  }

  return { rows, errors };
}

// ── Industry vocabulary warnings (non-blocking) ─────────────
// Values outside lib/constants/industries.ts never match the industry
// pre-filter (exact string comparison), making the career invisible when
// a user filters by industry. 1,142 legacy rows were normalized by
// migration 102 — warn (don't reject) so a fix-up re-import of old CSVs
// is never blocked, but new drift gets surfaced in the admin UI.
const INDUSTRY_ID_SET = new Set<string>(INDUSTRY_IDS);

function collectIndustryWarnings(
  rows: ParsedRow[],
): Array<{ id: string; badValues: string[] }> {
  const warnings: Array<{ id: string; badValues: string[] }> = [];
  for (const row of rows) {
    const badValues = row.industries.filter((v) => !INDUSTRY_ID_SET.has(v));
    if (badValues.length > 0) warnings.push({ id: row.id, badValues });
  }
  return warnings;
}

// ── POST: Import CSV ────────────────────────────────────────

export const POST = withLogging(
  "/api/admin/career-directions/import",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const dryRun = formData.get("dryRun") === "true";

      if (!file) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "No file provided",
          400,
        );
      }

      if (!file.name.endsWith(".csv")) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "File must be a .csv",
          400,
        );
      }

      if (file.size > MAX_FILE_BYTES) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          `CSV exceeds ${MAX_FILE_BYTES / 1024 / 1024}MB size limit`,
          413,
        );
      }

      const text = await file.text();
      const { rows, errors } = parseCsvBody(text);

      if (rows.length > MAX_ROWS) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          `CSV has ${rows.length} rows, exceeds ${MAX_ROWS} limit`,
          400,
        );
      }

      const warnings = collectIndustryWarnings(rows);

      // Dry run — return validation results only
      if (dryRun) {
        return NextResponse.json({
          dryRun: true,
          totalParsed: rows.length,
          errors,
          warnings,
          preview: rows
            .slice(0, 5)
            .map((r) => ({ id: r.id, titleEn: r.titleEn, source: r.source })),
        });
      }

      // Abort if too many errors
      if (errors.length > 0 && errors.length > rows.length * 0.1) {
        return NextResponse.json(
          {
            success: false,
            message: "Too many errors — aborting import. Fix errors and retry.",
            totalParsed: rows.length,
            errors,
          },
          { status: 400 },
        );
      }

      // Execute bulk upsert
      const result = await bulkUpsertCareerDirections(rows);
      invalidateCareerPoolCache();

      return NextResponse.json({
        success: true,
        imported: result.upserted,
        skipped: result.skipped,
        errors,
        warnings,
      });
    } catch (error) {
      logApiError(
        "/api/admin/career-directions/import",
        ApiErrorCode.INTERNAL_ERROR,
        {
          message: "Failed to import career directions",
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
