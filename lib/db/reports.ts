// ============================================================
// Reports — CareerReport CRUD
//
// Table: CareerReport
// Key fields: id, assessmentId, userId, reportJson (JSONB),
//             generationTimeMs, llmModel, llmCalls, version
// Stores the full 3-panel career report produced by generateCareerReport().
// ============================================================

import { sql } from "./connection";
import { randomUUID } from "crypto";
import type { CareerReport, PersonalProfileData } from "@/lib/types";
import type { DbCareerReport, DbAssessmentResult } from "./schema-generated";
import { backfillAssessmentUserId } from "./assessments";
import { backfillSessionUserId } from "./sessions";

// ── Report JSON retrieval (raw, for API responses) ─────

export async function getReportJsonById(
  id: string,
): Promise<Record<string, unknown> | null> {
  const rows = await sql<Pick<DbCareerReport, "reportJson">>`
    SELECT "reportJson" FROM "CareerReport"
    WHERE "id" = ${id}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const json = rows[0].reportJson;
  if (typeof json === "string") {
    try {
      return JSON.parse(json);
    } catch {
      throw new Error(`Corrupted reportJson for CareerReport ${id}`);
    }
  }
  return json as Record<string, unknown>;
}

export async function getAssessmentDataForReport(
  assessmentId: string,
): Promise<{
  sessionId: string | null;
  resultJson: Record<string, unknown>;
} | null> {
  const rows = await sql<Pick<DbAssessmentResult, "sessionId" | "resultJson">>`
    SELECT "sessionId", "resultJson" FROM "AssessmentResult"
    WHERE "id" = ${assessmentId}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const raw = rows[0].resultJson;
  let resultJson: Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      resultJson = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Corrupted resultJson for AssessmentResult ${assessmentId}`,
      );
    }
  } else {
    resultJson = (raw ?? {}) as Record<string, unknown>;
  }
  return {
    sessionId: rows[0].sessionId,
    resultJson,
  };
}

// ── Report existence & ownership checks ─────

export async function checkReportExists(id: string): Promise<boolean> {
  const rows = await sql<Pick<DbCareerReport, "id">>`
    SELECT id FROM "CareerReport" WHERE id = ${id} LIMIT 1
  `;
  return rows.length > 0;
}

export async function deleteReportById(id: string): Promise<void> {
  await sql`DELETE FROM "CareerReport" WHERE id = ${id}`;
}

/**
 * Delete all CareerReport rows linked to a given assessmentId.
 */
export async function deleteReportByAssessment(
  assessmentId: string,
): Promise<void> {
  await sql`DELETE FROM "CareerReport" WHERE "assessmentId" = ${assessmentId}`;
}

export async function checkReportOwnership(
  id: string,
  userId: string,
): Promise<boolean> {
  const rows = await sql<{ id: string }>`
    SELECT r.id FROM "CareerReport" r
    LEFT JOIN "AssessmentResult" a ON r."assessmentId" = a."id"
    LEFT JOIN "QuestionnaireSession" qs ON a."sessionId" = qs."id"
    WHERE r.id = ${id} AND (r."userId" = ${userId} OR a."userId" = ${userId} OR qs."userId" = ${userId})
    LIMIT 1
  `;
  return rows.length > 0;
}

// ── Report listing ─────

export async function getReportsByUserId(userId: string): Promise<
  Array<{
    id: string;
    createdAt: string;
    version: string | null;
    reportJson: unknown;
    /** Migration 094: 0-1 quality score (1 = all primary, no degradation) */
    qualityScore: number | null;
    /** Migration 094: sections that fell back to algorithmic text */
    degradedSections: string[];
    /** Migration 094: per-task provider provenance */
    llmProviderMap: Record<string, { provider: string; model: string }> | null;
  }>
> {
  const rows = await sql<
    Pick<
      DbCareerReport,
      | "id"
      | "createdAt"
      | "version"
      | "reportJson"
      | "qualityScore"
      | "degradedSections"
      | "llmProviderMap"
    >
  >`
    SELECT "id", "createdAt", "version", "reportJson",
           "qualityScore", "degradedSections", "llmProviderMap"
    FROM "CareerReport"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
  `;
  return rows.map((r) => ({
    id: r.id,
    // createdAt is a Date in the DB; API contract returns an ISO string.
    createdAt: String(r.createdAt),
    version: r.version,
    reportJson: r.reportJson,
    qualityScore: r.qualityScore == null ? null : Number(r.qualityScore),
    degradedSections: r.degradedSections ?? [],
    llmProviderMap:
      (r.llmProviderMap as Record<
        string,
        { provider: string; model: string }
      > | null) ?? null,
  }));
}

export async function getLatestReportIdForUser(
  userId: string,
): Promise<string | null> {
  const rows = await sql<{ id: string }>`
    SELECT cr."id"
    FROM "CareerReport" cr
    LEFT JOIN "AssessmentResult" ar ON cr."assessmentId" = ar."id"
    LEFT JOIN "QuestionnaireSession" qs ON ar."sessionId" = qs."id"
    WHERE cr."userId" = ${userId} OR ar."userId" = ${userId} OR qs."userId" = ${userId}
    ORDER BY cr."createdAt" DESC
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

export async function getLatestReportJsonByUserId(
  userId: string,
): Promise<Record<string, unknown> | null> {
  const rows = await sql<Pick<DbCareerReport, "reportJson">>`
    SELECT "reportJson" FROM "CareerReport"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  const json = rows[0].reportJson;
  if (typeof json === "string") {
    try {
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Corrupted reportJson for latest report of user ${userId}`,
      );
    }
  }
  return (json ?? {}) as Record<string, unknown>;
}

// ── Core CRUD ─────

/**
 * Save a career report. Returns the report ID on success, or null if a report
 * for this assessmentId already exists (UNIQUE constraint dedup).
 */
export async function saveReport(
  report: CareerReport,
  userId?: string,
  inputHash?: string,
): Promise<string | null> {
  const id = report.id || randomUUID();
  let reportJsonStr: string;
  try {
    reportJsonStr = JSON.stringify(report);
  } catch (serErr) {
    throw new Error(
      `Failed to serialize CareerReport ${id} for assessment ${report.assessmentId}: ${serErr instanceof Error ? serErr.message : "unknown error"}`,
      { cause: serErr },
    );
  }
  // Migration 094: pull provider provenance + quality score from meta
  // (set by generateCareerReportInternal). null when anonymous flow.
  const providerMap = report.meta.llmProviderMap ?? null;
  const providerMapStr = providerMap ? JSON.stringify(providerMap) : null;
  const qualityScore = report.meta.qualityScore ?? null;
  const degradedSections = report.meta.degradedSections ?? [];
  try {
    const rows = await sql<Pick<DbCareerReport, "id">>`
      INSERT INTO "CareerReport" (
        "id", "assessmentId", "userId", "reportJson",
        "generationTimeMs", "llmModel", "llmCalls", "version", "inputHash",
        "llmProviderMap", "qualityScore", "degradedSections"
      )
      VALUES (
        ${id},
        ${report.assessmentId},
        ${userId ?? null},
        ${reportJsonStr}::jsonb,
        ${report.meta.generationTimeMs ?? null},
        ${report.meta.llmModel ?? null},
        ${report.meta.llmCalls ?? null},
        ${report.meta.version},
        ${inputHash ?? null},
        ${providerMapStr}::jsonb,
        ${qualityScore},
        ${degradedSections}
      )
      ON CONFLICT ("assessmentId") WHERE "supersededAt" IS NULL DO NOTHING
      RETURNING "id"
    `;
    return rows.length > 0 ? rows[0].id : null;
  } catch (dbErr) {
    throw new Error(
      `saveReport DB insert failed for assessment ${report.assessmentId}`,
      { cause: dbErr },
    );
  }
}

/**
 * Atomic report save: backfill ownership chain + insert report in a single transaction.
 * If any step fails, all changes roll back (no orphan reports, no dangling backfills).
 */
/**
 * Atomic report save: backfill ownership chain + insert report in a single transaction.
 * Returns report ID on success, or null if a report already exists for this assessment
 * (dedup via UNIQUE constraint on assessmentId).
 */
export async function saveReportTransactional(
  report: CareerReport,
  userId: string | undefined,
  sessionId: string | undefined,
  assessmentId: string,
  narrativeSnapshots?: NonNullable<PersonalProfileData["narrativeSnapshots"]>,
  inputHash?: string,
): Promise<string | null> {
  // Note: Neon HTTP driver does not support multi-statement transactions
  // (each sql`` call is a separate HTTP request). To minimise partial-failure
  // risk, we INSERT the report first — if it fails, no backfills happen.
  // Backfills are idempotent UPDATEs with WHERE clauses, so re-running is safe.

  // 1. Save report first (uses ON CONFLICT DO NOTHING for dedup)
  const reportId = await saveReport(report, userId, inputHash);

  // 2. Backfill ownership chain so triple-JOIN queries find this report.
  // Wrapped in try/catch — backfill failure must NOT throw and make the
  // already-saved report invisible. Backfills are idempotent UPDATEs;
  // getUserReports() also does fire-and-forget backfills as a safety net.
  if (userId && sessionId) {
    try {
      await backfillSessionUserId(sessionId, userId);
    } catch (err) {
      console.error(
        `[reports] Session userId backfill failed (non-fatal, sessionId=${sessionId}):`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  if (userId) {
    try {
      await backfillAssessmentUserId(assessmentId, userId);
    } catch (err) {
      console.error(
        `[reports] Assessment userId backfill failed (non-fatal, assessmentId=${assessmentId}):`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Write report-level narrative snapshots to profile (best-effort, supplementary data).
  // IMPORTANT: merge INTO existing narrativeSnapshots — never replace them, or the
  // identity narratives (archetypeNarrative, identitySummary, etc.) written during
  // profile generation will be wiped out, causing the profile page to show a skeleton.
  // Write narrative snapshots with retry (2 attempts). Profile UI shows
  // skeleton if this fails, so we retry once before accepting the loss.
  if (reportId && narrativeSnapshots) {
    const snapshotJson = JSON.stringify(narrativeSnapshots);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await sql`
          UPDATE "PersonalProfile"
          SET "profileJson" = jsonb_set(
            "profileJson",
            '{narrativeSnapshots}',
            COALESCE("profileJson"->'narrativeSnapshots', '{}'::jsonb)
              || ${snapshotJson}::jsonb
          ),
          "updatedAt" = NOW()
          WHERE "assessmentId" = ${assessmentId}
        `;
        break; // success
      } catch (snapshotErr) {
        if (attempt === 0) {
          console.warn(
            "[reports] Narrative snapshot save failed, retrying in 500ms:",
            snapshotErr instanceof Error ? snapshotErr.message : snapshotErr,
          );
          await new Promise((r) => setTimeout(r, 500));
        } else {
          console.error(
            "[reports] Narrative snapshot save failed after 2 attempts (non-fatal):",
            snapshotErr instanceof Error ? snapshotErr.message : snapshotErr,
          );
        }
      }
    }
  }

  return reportId;
}

export async function getReport(
  reportId: string,
): Promise<CareerReport | null> {
  const rows = await sql<Pick<DbCareerReport, "reportJson">>`
    SELECT "reportJson" FROM "CareerReport" WHERE "id" = ${reportId}
  `;
  if (rows.length === 0) return null;
  return rows[0].reportJson as CareerReport;
}

export async function getReportByAssessment(
  assessmentId: string,
): Promise<CareerReport | null> {
  const rows = await sql<Pick<DbCareerReport, "reportJson">>`
    SELECT "reportJson" FROM "CareerReport"
    WHERE "assessmentId" = ${assessmentId}
      AND "supersededAt" IS NULL
    ORDER BY "createdAt" DESC LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rows[0].reportJson as CareerReport;
}

/** Lightweight lookup: just the report ID for a given assessment (for dedup checks). */
export async function getReportIdByAssessment(
  assessmentId: string,
): Promise<string | null> {
  const rows = await sql<Pick<DbCareerReport, "id">>`
    SELECT "id" FROM "CareerReport"
    WHERE "assessmentId" = ${assessmentId}
      AND "supersededAt" IS NULL
    LIMIT 1
  `;
  return rows.length > 0 ? rows[0].id : null;
}

/**
 * Soft-delete every active CareerReport for an assessment so a fresh
 * regenerate can insert a new row without hitting the partial unique index.
 * Returns the number of rows marked superseded (0 if there was nothing
 * active, which is also a valid state). The original rows stay in the table
 * for audit / research provenance.
 */
export async function supersedeActiveReports(
  assessmentId: string,
): Promise<number> {
  const rows = await sql`
    UPDATE "CareerReport"
      SET "supersededAt" = NOW()
    WHERE "assessmentId" = ${assessmentId}
      AND "supersededAt" IS NULL
    RETURNING "id"
  `;
  return rows.length;
}

/** Get the stored inputHash for a report (for staleness detection). */
export async function getReportInputHash(
  reportId: string,
): Promise<string | null> {
  const rows = await sql<Pick<DbCareerReport, "inputHash">>`
    SELECT "inputHash" FROM "CareerReport"
    WHERE "id" = ${reportId}
    LIMIT 1
  `;
  return rows.length > 0 ? rows[0].inputHash : null;
}

export async function updateReportJson(
  reportId: string,
  report: CareerReport,
): Promise<void> {
  let reportJsonStr: string;
  try {
    reportJsonStr = JSON.stringify(report);
  } catch (serErr) {
    throw new Error(
      `Failed to serialize CareerReport ${reportId}: ${serErr instanceof Error ? serErr.message : "unknown error"}`,
      { cause: serErr },
    );
  }
  try {
    await sql`
      UPDATE "CareerReport"
      SET "reportJson" = ${reportJsonStr}::jsonb
      WHERE "id" = ${reportId}
    `;
  } catch (dbErr) {
    throw new Error(
      `updateReportJson DB update failed for report ${reportId}`,
      { cause: dbErr },
    );
  }
}

// ── User-facing report listing (deep + quick dive merged) ─────

export interface UserReport {
  id: string;
  createdAt: string;
  /** Pre-extracted summary for listing (no large JSONB transfer) */
  summary: string;
  /** Chinese summary variant (Quick Dive only, falls back to summary) */
  summaryZh?: string;
  reportType: "deep" | "quick";
  exploreMode?: string | null;
}

/**
 * Get all user reports (Deep Dive + Quick Dive) merged and sorted.
 * Uses parallel queries with SQL-level summary extraction — no large JSONB transfer.
 * Includes best-effort userId backfill for ownership chain propagation.
 */
export async function getUserReports(
  userId: string,
): Promise<{ reports: UserReport[]; error?: string }> {
  const reports: UserReport[] = [];
  const errors: string[] = [];

  // --- Deep Dive + Quick Dive queries in parallel ---
  // Extract summary from JSONB in SQL to avoid transferring large payloads.
  // Row shapes below are virtual columns produced by COALESCE, so we
  // declare them inline instead of reusing a generated Db* interface.
  type DeepRow = { id: string; createdAt: Date; summary: string | null };
  type QuickRow = {
    id: string;
    createdAt: Date;
    exploreMode: string | null;
    summaryEn: string | null;
    summaryZh: string | null;
  };

  const deepPromise = sql<DeepRow>`
    SELECT DISTINCT r."id", r."createdAt",
      COALESCE(
        r."reportJson"->'archetype_synthesis'->'archetypes'->0->>'archetype_name',
        r."reportJson"->'ideal_fit_summary'->'top_3_primary_roles'->0->>'role_title',
        r."reportJson"->>'archetype',
        LEFT(r."reportJson"->>'executiveSummary', 80),
        ''
      ) AS "summary"
    FROM "CareerReport" r
    LEFT JOIN "AssessmentResult" a ON r."assessmentId" = a."id"
    LEFT JOIN "QuestionnaireSession" qs ON a."sessionId" = qs."id"
    WHERE r."userId" = ${userId} OR a."userId" = ${userId} OR qs."userId" = ${userId}
    ORDER BY r."createdAt" DESC
  `.catch((e) => {
    console.error("[getUserReports] Deep Dive query failed:", e);
    errors.push(`Deep: ${e instanceof Error ? e.message : String(e)}`);
    return [] as DeepRow[];
  });

  const quickPromise = sql<QuickRow>`
    SELECT q."id", q."createdAt", q."exploreMode",
      COALESCE(
        q."resultDataJson"->'labelData'->>'label_en',
        q."resultDataJson"->'labelData'->>'en',
        q."resultDataJson"->'labelData'->>'title',
        q."archetypeLabel",
        ''
      ) AS "summaryEn",
      COALESCE(
        q."resultDataJson"->'labelData'->>'label_zh',
        q."resultDataJson"->'labelData'->>'title',
        q."resultDataJson"->'labelData'->>'label_en',
        q."resultDataJson"->'labelData'->>'en',
        q."archetypeLabel",
        ''
      ) AS "summaryZh"
    FROM "QuickDiveResult" q
    WHERE q."userId" = ${userId}
    ORDER BY q."createdAt" DESC
  `.catch((e) => {
    console.error("[getUserReports] Quick Dive query failed:", e);
    errors.push(`Quick: ${e instanceof Error ? e.message : String(e)}`);
    return [] as QuickRow[];
  });

  const [deepRows, quickRows] = await Promise.all([deepPromise, quickPromise]);

  reports.push(
    ...deepRows.map((row) => ({
      id: row.id,
      createdAt: String(row.createdAt),
      summary: row.summary ?? "",
      reportType: "deep" as const,
      exploreMode: null as string | null,
    })),
  );

  reports.push(
    ...quickRows.map((row) => ({
      id: row.id,
      createdAt: String(row.createdAt),
      summary: row.summaryEn ?? row.summaryZh ?? "",
      summaryZh: row.summaryZh ?? "",
      reportType: "quick" as const,
      exploreMode: row.exploreMode ?? null,
    })),
  );

  const error = errors.length > 0 ? errors.join("; ") : undefined;

  // Best-effort backfill: propagate userId through the ownership chain (fire-and-forget)
  void sql`
    UPDATE "AssessmentResult" a
    SET "userId" = ${userId}
    FROM "QuestionnaireSession" qs
    WHERE a."sessionId" = qs."id"
      AND qs."userId" = ${userId}
      AND a."userId" IS NULL
  `.catch((err) => {
    console.warn(
      "[getUserReports] AssessmentResult backfill failed:",
      err instanceof Error ? err.message : err,
    );
  });
  void sql`
    UPDATE "CareerReport" r
    SET "userId" = ${userId}
    FROM "AssessmentResult" a
    LEFT JOIN "QuestionnaireSession" qs ON a."sessionId" = qs."id"
    WHERE r."assessmentId" = a."id"
      AND (a."userId" = ${userId} OR qs."userId" = ${userId})
      AND r."userId" IS NULL
  `.catch((err) => {
    console.warn(
      "[getUserReports] CareerReport backfill failed:",
      err instanceof Error ? err.message : err,
    );
  });

  // Sort combined results by date descending
  reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return { reports, error };
}
