// ============================================================
// Career Direction Library — Database CRUD for admin management
// ============================================================

import { sql, ilikePattern } from "./connection";

// ── Types ────────────────────────────────────────

export interface CareerDirectionRow {
  id: string;
  source: "curated" | "onet" | "emerging";
  titleEn: string;
  titleZh: string;
  subtitleZh: string | null;
  titleLocales: Record<string, string>;
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
  aiExposureScore: number | null;
  aiImpactLabel: "low" | "medium" | "high" | null;
  aiExposureSources: string[];
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
  resilienceScore: number | null;
  resilienceLevel: number | null;
  jobZone: number | null;
  jobZoneSource: "onet-official" | "llm-batch" | "manual" | null;
  jobZoneConfidence: number | null;
  isActive: boolean;
  sunsetDate: string | null;
  deprecationStatus: "active" | "warning" | "sunset" | "retired";
  lastReviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListCareerDirectionsOptions {
  source?: "curated" | "onet" | "emerging";
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CareerDirectionStats {
  total: number;
  curated: number;
  onet: number;
  emerging: number;
  active: number;
  inactive: number;
}

// ── Row mapper ───────────────────────────────────

function mapRow(r: Record<string, unknown>): CareerDirectionRow {
  return {
    id: r.id as string,
    source: r.source as CareerDirectionRow["source"],
    titleEn: r.titleEn as string,
    titleZh: r.titleZh as string,
    subtitleZh: (r.subtitleZh as string) || null,
    titleLocales: (r.titleLocales as Record<string, string>) ?? {},
    idealRiasec: r.idealRiasec as CareerDirectionRow["idealRiasec"],
    alignedValues: (r.alignedValues ?? []) as string[],
    idealBigFive: (r.idealBigFive ?? {}) as CareerDirectionRow["idealBigFive"],
    industries: (r.industries ?? []) as string[],
    crossCulturalFit: (r.crossCulturalFit ?? []) as string[],
    seniorityMin: r.seniorityMin as number,
    seniorityMax: r.seniorityMax as number,
    tags: (r.tags ?? []) as string[],
    aiEraCategory:
      (r.aiEraCategory as CareerDirectionRow["aiEraCategory"]) ?? null,
    aiExposureScore: (r.aiExposureScore as number) ?? null,
    aiImpactLabel:
      (r.aiImpactLabel as CareerDirectionRow["aiImpactLabel"]) ?? null,
    aiExposureSources: (r.aiExposureSources ?? []) as string[],
    annotationSource:
      r.annotationSource as CareerDirectionRow["annotationSource"],
    annotationConfidence:
      r.annotationConfidence as CareerDirectionRow["annotationConfidence"],
    marketOutlook: r.marketOutlook as CareerDirectionRow["marketOutlook"],
    resilienceScore: (r.resilienceScore as number) ?? null,
    resilienceLevel: (r.resilienceLevel as number) ?? null,
    jobZone: (r.jobZone as number) ?? null,
    jobZoneSource:
      (r.jobZoneSource as CareerDirectionRow["jobZoneSource"]) ?? null,
    jobZoneConfidence: (r.jobZoneConfidence as number) ?? null,
    isActive: r.isActive as boolean,
    sunsetDate: (r.sunsetDate as string) ?? null,
    deprecationStatus:
      (r.deprecationStatus as CareerDirectionRow["deprecationStatus"]) ??
      "active",
    lastReviewedAt: r.lastReviewedAt
      ? new Date(r.lastReviewedAt as string)
      : null,
    createdAt: new Date(r.createdAt as string),
    updatedAt: new Date(r.updatedAt as string),
  };
}

// ── Queries ──────────────────────────────────────

/**
 * List career directions with filtering and pagination.
 * Uses separate tagged-template queries per filter combination
 * since our sql wrapper doesn't support dynamic query building.
 */
export async function listCareerDirections(
  opts: ListCareerDirectionsOptions = {},
): Promise<{ rows: CareerDirectionRow[]; total: number }> {
  const { source, search, isActive, limit = 50, offset = 0 } = opts;
  const searchPattern = search?.trim() ? ilikePattern(search) : null;

  let countRows: Record<string, unknown>[];
  let dataRows: Record<string, unknown>[];

  if (source && searchPattern && isActive !== undefined) {
    countRows =
      await sql`SELECT COUNT(*)::int AS count FROM "CareerDirection" WHERE "source" = ${source} AND "isActive" = ${isActive} AND ("titleEn" ILIKE ${searchPattern} OR "titleZh" ILIKE ${searchPattern} OR "id" ILIKE ${searchPattern})`;
    dataRows =
      await sql`SELECT * FROM "CareerDirection" WHERE "source" = ${source} AND "isActive" = ${isActive} AND ("titleEn" ILIKE ${searchPattern} OR "titleZh" ILIKE ${searchPattern} OR "id" ILIKE ${searchPattern}) ORDER BY "source", "id" LIMIT ${limit} OFFSET ${offset}`;
  } else if (source && searchPattern) {
    countRows =
      await sql`SELECT COUNT(*)::int AS count FROM "CareerDirection" WHERE "source" = ${source} AND ("titleEn" ILIKE ${searchPattern} OR "titleZh" ILIKE ${searchPattern} OR "id" ILIKE ${searchPattern})`;
    dataRows =
      await sql`SELECT * FROM "CareerDirection" WHERE "source" = ${source} AND ("titleEn" ILIKE ${searchPattern} OR "titleZh" ILIKE ${searchPattern} OR "id" ILIKE ${searchPattern}) ORDER BY "source", "id" LIMIT ${limit} OFFSET ${offset}`;
  } else if (source && isActive !== undefined) {
    countRows =
      await sql`SELECT COUNT(*)::int AS count FROM "CareerDirection" WHERE "source" = ${source} AND "isActive" = ${isActive}`;
    dataRows =
      await sql`SELECT * FROM "CareerDirection" WHERE "source" = ${source} AND "isActive" = ${isActive} ORDER BY "source", "id" LIMIT ${limit} OFFSET ${offset}`;
  } else if (searchPattern && isActive !== undefined) {
    countRows =
      await sql`SELECT COUNT(*)::int AS count FROM "CareerDirection" WHERE "isActive" = ${isActive} AND ("titleEn" ILIKE ${searchPattern} OR "titleZh" ILIKE ${searchPattern} OR "id" ILIKE ${searchPattern})`;
    dataRows =
      await sql`SELECT * FROM "CareerDirection" WHERE "isActive" = ${isActive} AND ("titleEn" ILIKE ${searchPattern} OR "titleZh" ILIKE ${searchPattern} OR "id" ILIKE ${searchPattern}) ORDER BY "source", "id" LIMIT ${limit} OFFSET ${offset}`;
  } else if (source) {
    countRows =
      await sql`SELECT COUNT(*)::int AS count FROM "CareerDirection" WHERE "source" = ${source}`;
    dataRows =
      await sql`SELECT * FROM "CareerDirection" WHERE "source" = ${source} ORDER BY "source", "id" LIMIT ${limit} OFFSET ${offset}`;
  } else if (searchPattern) {
    countRows =
      await sql`SELECT COUNT(*)::int AS count FROM "CareerDirection" WHERE "titleEn" ILIKE ${searchPattern} OR "titleZh" ILIKE ${searchPattern} OR "id" ILIKE ${searchPattern}`;
    dataRows =
      await sql`SELECT * FROM "CareerDirection" WHERE "titleEn" ILIKE ${searchPattern} OR "titleZh" ILIKE ${searchPattern} OR "id" ILIKE ${searchPattern} ORDER BY "source", "id" LIMIT ${limit} OFFSET ${offset}`;
  } else if (isActive !== undefined) {
    countRows =
      await sql`SELECT COUNT(*)::int AS count FROM "CareerDirection" WHERE "isActive" = ${isActive}`;
    dataRows =
      await sql`SELECT * FROM "CareerDirection" WHERE "isActive" = ${isActive} ORDER BY "source", "id" LIMIT ${limit} OFFSET ${offset}`;
  } else {
    countRows = await sql`SELECT COUNT(*)::int AS count FROM "CareerDirection"`;
    dataRows =
      await sql`SELECT * FROM "CareerDirection" ORDER BY "source", "id" LIMIT ${limit} OFFSET ${offset}`;
  }

  const total = (countRows[0]?.count as number) ?? 0;
  return {
    rows: dataRows.map((r) => mapRow(r as Record<string, unknown>)),
    total,
  };
}

/** Get a single career direction by ID */
export async function getCareerDirection(
  id: string,
): Promise<CareerDirectionRow | null> {
  const rows = await sql`
    SELECT * FROM "CareerDirection" WHERE "id" = ${id}
  `;
  if (rows.length === 0) return null;
  return mapRow(rows[0] as Record<string, unknown>);
}

/** Create a new career direction */
export async function createCareerDirection(data: {
  id: string;
  source: "curated" | "onet" | "emerging";
  titleEn: string;
  titleZh: string;
  subtitleZh?: string;
  idealRiasec: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };
  alignedValues: string[];
  idealBigFive?: Record<string, { min: number; max: number }>;
  industries: string[];
  crossCulturalFit: string[];
  seniorityMin: number;
  seniorityMax: number;
  tags: string[];
  aiEraCategory?: "stable" | "augmented" | "transformed" | "ai-native" | null;
  annotationSource: "expert-heuristic" | "empirical-data" | "ai-assisted";
  annotationConfidence:
    | "expert-estimated"
    | "data-validated"
    | "community-verified";
  marketOutlook?: CareerDirectionRow["marketOutlook"];
}): Promise<string> {
  await sql`
    INSERT INTO "CareerDirection" (
      "id", "source", "titleEn", "titleZh", "subtitleZh",
      "idealRiasec", "alignedValues", "idealBigFive",
      "industries", "crossCulturalFit", "seniorityMin", "seniorityMax",
      "tags", "aiEraCategory", "annotationSource", "annotationConfidence", "marketOutlook",
      "lastReviewedAt"
    ) VALUES (
      ${data.id}, ${data.source}, ${data.titleEn}, ${data.titleZh}, ${data.subtitleZh ?? null},
      ${JSON.stringify(data.idealRiasec)}, ${data.alignedValues}, ${JSON.stringify(data.idealBigFive ?? {})},
      ${data.industries}, ${data.crossCulturalFit}, ${data.seniorityMin}, ${data.seniorityMax},
      ${data.tags}, ${data.aiEraCategory ?? null}, ${data.annotationSource}, ${data.annotationConfidence},
      ${data.marketOutlook ? JSON.stringify(data.marketOutlook) : null},
      NOW()
    )
  `;
  return data.id;
}

/** Full update of a career direction */
export async function updateCareerDirection(
  id: string,
  data: {
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
    aiEraCategory?: "stable" | "augmented" | "transformed" | "ai-native" | null;
    annotationSource: "expert-heuristic" | "empirical-data" | "ai-assisted";
    annotationConfidence:
      | "expert-estimated"
      | "data-validated"
      | "community-verified";
    marketOutlook: CareerDirectionRow["marketOutlook"];
  },
): Promise<boolean> {
  const existing = await getCareerDirection(id);
  if (!existing) return false;

  await sql`
    UPDATE "CareerDirection" SET
      "titleEn" = ${data.titleEn},
      "titleZh" = ${data.titleZh},
      "subtitleZh" = ${data.subtitleZh},
      "idealRiasec" = ${JSON.stringify(data.idealRiasec)},
      "alignedValues" = ${data.alignedValues},
      "idealBigFive" = ${JSON.stringify(data.idealBigFive)},
      "industries" = ${data.industries},
      "crossCulturalFit" = ${data.crossCulturalFit},
      "seniorityMin" = ${data.seniorityMin},
      "seniorityMax" = ${data.seniorityMax},
      "tags" = ${data.tags},
      "aiEraCategory" = ${data.aiEraCategory ?? existing.aiEraCategory},
      "annotationSource" = ${data.annotationSource},
      "annotationConfidence" = ${data.annotationConfidence},
      "marketOutlook" = ${data.marketOutlook ? JSON.stringify(data.marketOutlook) : null},
      "isActive" = ${existing.isActive},
      "updatedAt" = NOW(),
      "lastReviewedAt" = NOW()
    WHERE "id" = ${id}
  `;
  return true;
}

/** Soft-delete (deactivate) a career direction */
export async function deactivateCareerDirection(id: string): Promise<boolean> {
  const existing = await getCareerDirection(id);
  if (!existing || !existing.isActive) return false;
  await sql`
    UPDATE "CareerDirection"
    SET "isActive" = FALSE, "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;
  return true;
}

/** Reactivate a career direction */
export async function reactivateCareerDirection(id: string): Promise<boolean> {
  const existing = await getCareerDirection(id);
  if (!existing || existing.isActive) return false;
  await sql`
    UPDATE "CareerDirection"
    SET "isActive" = TRUE, "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;
  return true;
}

/** Get aggregate stats for admin dashboard */
export async function getCareerDirectionStats(): Promise<CareerDirectionStats> {
  const rows = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "source" = 'curated')::int AS curated,
      COUNT(*) FILTER (WHERE "source" = 'onet')::int AS onet,
      COUNT(*) FILTER (WHERE "source" = 'emerging')::int AS emerging,
      COUNT(*) FILTER (WHERE "isActive" = TRUE)::int AS active,
      COUNT(*) FILTER (WHERE "isActive" = FALSE)::int AS inactive
    FROM "CareerDirection"
  `;
  const r = rows[0];
  return {
    total: r.total as number,
    curated: r.curated as number,
    onet: r.onet as number,
    emerging: r.emerging as number,
    active: r.active as number,
    inactive: r.inactive as number,
  };
}

/** Batch toggle active status for multiple career directions */
export async function batchToggleActive(
  ids: string[],
  isActive: boolean,
): Promise<number> {
  if (ids.length === 0) return 0;
  await sql`
    UPDATE "CareerDirection"
    SET "isActive" = ${isActive}, "updatedAt" = NOW()
    WHERE "id" = ANY(${ids}) AND "isActive" != ${isActive}
  `;
  // Count how many were actually changed
  const countRows = await sql`
    SELECT COUNT(*)::int AS count FROM "CareerDirection"
    WHERE "id" = ANY(${ids}) AND "isActive" = ${isActive}
  `;
  return (countRows[0]?.count as number) ?? 0;
}

/** Batch size for concurrent upsert operations */
const UPSERT_BATCH_SIZE = 50;

/**
 * Bulk upsert career directions (for CSV import).
 *
 * Uses INSERT ... ON CONFLICT DO UPDATE to eliminate the N+1 pattern
 * (previously: SELECT + INSERT/UPDATE per row = 2,282+ roundtrips for 1,141 rows).
 * Now: 1 roundtrip per row, processed in concurrent batches of UPSERT_BATCH_SIZE.
 */
export async function bulkUpsertCareerDirections(
  rows: Array<{
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
    marketOutlook: CareerDirectionRow["marketOutlook"];
    isActive: boolean;
  }>,
): Promise<{ upserted: number; skipped: number }> {
  let upserted = 0;
  let skipped = 0;

  // Process in batches to avoid overwhelming the connection pool
  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + UPSERT_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(
        (row) =>
          sql`
          INSERT INTO "CareerDirection" (
            "id", "source", "titleEn", "titleZh", "subtitleZh",
            "idealRiasec", "alignedValues", "idealBigFive",
            "industries", "crossCulturalFit", "seniorityMin", "seniorityMax",
            "tags", "aiEraCategory", "annotationSource", "annotationConfidence",
            "marketOutlook", "isActive", "lastReviewedAt"
          ) VALUES (
            ${row.id}, ${row.source}, ${row.titleEn}, ${row.titleZh}, ${row.subtitleZh},
            ${JSON.stringify(row.idealRiasec)}, ${row.alignedValues}, ${JSON.stringify(row.idealBigFive)},
            ${row.industries}, ${row.crossCulturalFit}, ${row.seniorityMin}, ${row.seniorityMax},
            ${row.tags}, ${row.aiEraCategory}, ${row.annotationSource}, ${row.annotationConfidence},
            ${row.marketOutlook ? JSON.stringify(row.marketOutlook) : null},
            ${row.isActive}, NOW()
          )
          ON CONFLICT ("id") DO UPDATE SET
            "source" = EXCLUDED."source",
            "titleEn" = EXCLUDED."titleEn",
            "titleZh" = EXCLUDED."titleZh",
            "subtitleZh" = EXCLUDED."subtitleZh",
            "idealRiasec" = EXCLUDED."idealRiasec",
            "alignedValues" = EXCLUDED."alignedValues",
            "idealBigFive" = EXCLUDED."idealBigFive",
            "industries" = EXCLUDED."industries",
            "crossCulturalFit" = EXCLUDED."crossCulturalFit",
            "seniorityMin" = EXCLUDED."seniorityMin",
            "seniorityMax" = EXCLUDED."seniorityMax",
            "tags" = EXCLUDED."tags",
            "aiEraCategory" = EXCLUDED."aiEraCategory",
            "annotationSource" = EXCLUDED."annotationSource",
            "annotationConfidence" = EXCLUDED."annotationConfidence",
            "marketOutlook" = EXCLUDED."marketOutlook",
            "isActive" = EXCLUDED."isActive",
            "updatedAt" = NOW(),
            "lastReviewedAt" = NOW()
        `,
      ),
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled") {
        upserted++;
      } else {
        const rowId = batch[j].id;
        console.warn(
          `[career-directions] Skipped row ${rowId}:`,
          result.reason instanceof Error
            ? result.reason.message
            : result.reason,
        );
        skipped++;
      }
    }
  }

  return { upserted, skipped };
}

/** Get all active career directions (for engine consumption, cached externally) */
export async function getAllActiveCareerDirections(): Promise<
  CareerDirectionRow[]
> {
  const rows = await sql`
    SELECT * FROM "CareerDirection"
    WHERE "isActive" = TRUE
      AND COALESCE("deprecationStatus", 'active') != 'retired'
    ORDER BY "source", "id"
  `;
  return rows.map((r) => mapRow(r as Record<string, unknown>));
}
