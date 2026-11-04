// ============================================================
// Deep Dive — Database Data Reset Script (V1 Consolidated)
// Clears ALL historical user data from all tables.
// Preserves table schemas.
//
// Usage:
//   npx tsx scripts/reset-database.ts                  # dry run
//   npx tsx scripts/reset-database.ts --confirm        # execute
//   npx tsx scripts/reset-database.ts --confirm --force-production
//
// Without --confirm, runs in dry-run mode (shows what would be deleted).
// Refuses to run if NODE_ENV=production unless --force-production is passed.
// ============================================================

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type SqlFn = NeonQueryFunction<false, false>;

// ── Configuration ─────────────────────────────────────────────

/**
 * All tables in dependency order (children first, parents last).
 *
 * Tables across 4 groups:
 *   Report & profile tables (3)
 *   Assessment tables (3)
 *   Platform feature tables (2)
 *   Core user tables (3)
 */
const TABLES_TO_CLEAR = [
  // Report & profile tables
  "PersonalProfile",
  "CareerReport",
  "RealConditions",

  // Assessment tables
  "AssessmentResult",
  "QuestionnaireSession",
  "QuickDiveResult",

  // Platform feature tables
  "CoachingSession",

  // Core tables
  "UserProfile",
  "UserSession",
  "User",
] as const;

/** Tables whose data is preserved (seed data). */
const PRESERVED_TABLES: readonly string[] = [];

// ── CLI Argument Parsing ──────────────────────────────────────

const args = process.argv.slice(2);
const confirmFlag = args.includes("--confirm");
const forceProduction = args.includes("--force-production");
const dryRun = !confirmFlag;

// ── Safety Checks ─────────────────────────────────────────────

function checkEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv === "production" && !forceProduction) {
    console.error(
      "\n============================================================",
    );
    console.error('  ABORTED: NODE_ENV is set to "production".');
    console.error("  This script refuses to run against a production database");
    console.error("  unless you pass the --force-production flag.");
    console.error("");
    console.error(
      "  Usage: npx tsx scripts/reset-database.ts --confirm --force-production",
    );
    console.error(
      "============================================================\n",
    );
    process.exit(1);
  }

  if (nodeEnv === "production" && forceProduction) {
    console.warn(
      "\n  WARNING: Running against PRODUCTION database (--force-production).\n",
    );
  }
}

function getConnectionString(): string {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    console.error(
      "\n============================================================",
    );
    console.error("  ABORTED: No database connection string found.");
    console.error("  Set one of: POSTGRES_URL, DATABASE_URL,");
    console.error("             POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING");
    console.error(
      "============================================================\n",
    );
    process.exit(1);
  }

  return connectionString;
}

// ── Database Operations ───────────────────────────────────────

/**
 * Execute a raw SQL query string and return rows as Record<string, unknown>[].
 * Table names come from our hardcoded TABLES_TO_CLEAR constant, so
 * string interpolation is safe here (no user input).
 */
async function rawQuery(
  sql: SqlFn,
  query: string,
): Promise<Record<string, unknown>[]> {
  const result = await sql([query] as unknown as TemplateStringsArray);
  return result as Record<string, unknown>[];
}

/** Belt-and-suspenders: never allow a table name outside the compile-time
 *  allowlist to reach rawQuery's string interpolation, even if a future
 *  refactor accidentally takes user input. */
function assertTableWhitelisted(tableName: string): void {
  if (!(TABLES_TO_CLEAR as readonly string[]).includes(tableName)) {
    throw new Error(
      `Refusing to operate on non-whitelisted table: "${tableName}"`,
    );
  }
}

async function getTableRowCount(
  sql: SqlFn,
  tableName: string,
): Promise<number> {
  assertTableWhitelisted(tableName);
  try {
    const rows = await rawQuery(
      sql,
      `SELECT COUNT(*) as count FROM "${tableName}"`,
    );
    return Number(rows[0]?.count ?? 0);
  } catch {
    // Table may not exist — return -1 to indicate
    return -1;
  }
}

async function truncateTable(
  sql: SqlFn,
  tableName: string,
): Promise<{ success: boolean; error?: string }> {
  assertTableWhitelisted(tableName);
  try {
    await rawQuery(sql, `TRUNCATE TABLE "${tableName}" CASCADE`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ── Main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n============================================================");
  console.log("  Deep Dive — Database Data Reset");
  console.log("============================================================");
  console.log(
    `  Mode: ${dryRun ? "DRY RUN (pass --confirm to execute)" : "LIVE — will delete data"}`,
  );
  console.log(`  Environment: NODE_ENV=${process.env.NODE_ENV ?? "(not set)"}`);
  console.log("");

  // Safety checks
  checkEnvironment();

  // Connect
  const connectionString = getConnectionString();
  const sql = neon(connectionString);

  // Mask the connection string for display
  const maskedUrl = connectionString.replace(
    /:\/\/([^:]+):([^@]+)@/,
    "://$1:****@",
  );
  console.log(`  Database: ${maskedUrl}`);
  console.log("");

  // ── Phase 1: Show current state ──────────────────────────

  console.log("── Current Table Row Counts ──────────────────────────────\n");

  const tableCounts: { table: string; count: number }[] = [];

  for (const table of TABLES_TO_CLEAR) {
    const count = await getTableRowCount(sql, table);
    tableCounts.push({ table, count });
    if (count === -1) {
      console.log(`  ${table.padEnd(30)} (table does not exist)`);
    } else {
      console.log(`  ${table.padEnd(30)} ${count} rows`);
    }
  }

  console.log("");
  console.log("  Preserved tables (not cleared):");
  for (const table of PRESERVED_TABLES) {
    const count = await getTableRowCount(sql, table);
    console.log(
      `  ${table.padEnd(30)} ${count === -1 ? "(does not exist)" : `${count} rows (kept)`}`,
    );
  }

  const totalRows = tableCounts
    .filter((t) => t.count > 0)
    .reduce((sum, t) => sum + t.count, 0);

  console.log(`\n  Total rows to delete: ${totalRows}`);
  console.log("");

  // ── Phase 2: Execute or show dry-run message ─────────────

  if (dryRun) {
    console.log("============================================================");
    console.log("  DRY RUN complete. No data was modified.");
    console.log("  To execute, run:");
    console.log("    npx tsx scripts/reset-database.ts --confirm");
    console.log(
      "============================================================\n",
    );
    return;
  }

  // Live execution
  console.log("── Clearing Tables ──────────────────────────────────────\n");

  const cleared: string[] = [];
  const skipped: string[] = [];
  const errors: { table: string; error: string }[] = [];

  for (const table of TABLES_TO_CLEAR) {
    const count = tableCounts.find((t) => t.table === table)?.count ?? 0;

    if (count === -1) {
      skipped.push(table);
      console.log(`  SKIP  ${table} (table does not exist)`);
      continue;
    }

    if (count === 0) {
      cleared.push(table);
      console.log(`  OK    ${table} (already empty)`);
      continue;
    }

    const result = await truncateTable(sql, table);
    if (result.success) {
      cleared.push(table);
      console.log(`  OK    ${table} (${count} rows cleared)`);
    } else {
      errors.push({ table, error: result.error! });
      console.log(`  FAIL  ${table}: ${result.error}`);
    }
  }

  // ── Phase 3: Verify ──────────────────────────────────────

  console.log("\n── Verification ─────────────────────────────────────────\n");

  let allEmpty = true;
  for (const table of TABLES_TO_CLEAR) {
    const count = await getTableRowCount(sql, table);
    if (count > 0) {
      console.log(`  WARN  ${table} still has ${count} rows`);
      allEmpty = false;
    } else if (count === 0) {
      console.log(`  OK    ${table} is empty`);
    }
    // Skip tables that don't exist (count === -1)
  }

  // Verify preserved tables still have data
  for (const table of PRESERVED_TABLES) {
    const count = await getTableRowCount(sql, table);
    if (count > 0) {
      console.log(`  OK    ${table} preserved (${count} rows)`);
    } else if (count === 0) {
      console.log(
        `  WARN  ${table} is empty (seed data may need re-insertion)`,
      );
    }
  }

  // ── Phase 4: Summary ─────────────────────────────────────

  console.log("\n============================================================");
  console.log("  Summary");
  console.log("============================================================");
  console.log(`  Tables cleared:  ${cleared.length}`);
  console.log(`  Tables skipped:  ${skipped.length} (not found)`);
  console.log(`  Errors:          ${errors.length}`);
  console.log(`  Data preserved:  ${PRESERVED_TABLES.join(", ")}`);
  console.log(
    `  All tables empty: ${allEmpty ? "YES" : "NO (check warnings above)"}`,
  );
  console.log("");

  if (errors.length > 0) {
    console.log("  Errors detail:");
    for (const { table, error } of errors) {
      console.log(`    ${table}: ${error}`);
    }
    console.log("");
  }

  console.log("  Next steps:");
  console.log("    1. Start the application: npm run dev");
  console.log("    2. Verify it loads without errors");
  console.log(
    "    3. Complete a new assessment to verify data saves correctly",
  );
  console.log("============================================================\n");

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
