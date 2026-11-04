// ============================================================
// Migration drift status — shared helper
//
// Compares the migration files on disk (scripts/migrations/*.sql)
// against the "_migrations" tracking table, so we can detect when a
// migration has been committed but never applied to a given database.
//
// Used by:
//   - app/api/health/db/route.ts        (runtime drift visibility)
//
// The standalone CLI runner (scripts/run-migrations.ts) keeps its own
// inline copy of this logic because it must run without the app's
// connection module (dotenv + a throwaway neon() client).
//
// NOTE: at runtime on Vercel, the .sql files are bundled into this
// function via `outputFileTracingIncludes` in next.config.mjs. Without
// that, readdirSync would throw ENOENT.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { sql } from "./connection";

const MIGRATION_FILE_PATTERN = /^(\d{3})-.*\.sql$/;

/** All migration filenames on disk, sorted by numeric prefix. */
export function listMigrationFiles(): string[] {
  const dir = path.join(process.cwd(), "scripts", "migrations");
  return fs
    .readdirSync(dir)
    .filter((f) => MIGRATION_FILE_PATTERN.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(MIGRATION_FILE_PATTERN)![1], 10);
      const nb = parseInt(b.match(MIGRATION_FILE_PATTERN)![1], 10);
      return na - nb;
    });
}

/** Filenames recorded as applied in the "_migrations" tracking table. */
export async function getAppliedMigrationFilenames(): Promise<Set<string>> {
  const rows = await sql<{ filename: string }>`
    SELECT "filename" FROM "_migrations"
  `;
  return new Set(rows.map((r) => r.filename));
}

export interface MigrationDriftStatus {
  /** Total migration files on disk. */
  totalFiles: number;
  /** Rows in the _migrations table (may exceed totalFiles if files were renamed). */
  appliedRecords: number;
  /** Migration files present on disk but not yet recorded as applied. */
  pending: string[];
  pendingCount: number;
}

/**
 * Diff disk migration files against the tracking table.
 * `pending` = committed-but-not-applied migrations (the drift we care about).
 */
export async function getMigrationDriftStatus(): Promise<MigrationDriftStatus> {
  const files = listMigrationFiles();
  const applied = await getAppliedMigrationFilenames();
  const pending = files.filter((f) => !applied.has(f));
  return {
    totalFiles: files.length,
    appliedRecords: applied.size,
    pending,
    pendingCount: pending.length,
  };
}
