// ============================================================
// Deep Dive — Database Migration Runner
//
// Reads numbered SQL files from scripts/migrations/, checks the
// _migrations tracking table for which have already been applied,
// and executes pending ones in numeric order.
//
// Usage:
//   npx tsx scripts/run-migrations.ts                  # apply pending migrations
//   npx tsx scripts/run-migrations.ts --status         # show migration status only
//   npx tsx scripts/run-migrations.ts --dry-run        # show what would be applied
//   npx tsx scripts/run-migrations.ts --check          # exit 1 if any migration is unapplied (CI drift gate)
//   npx tsx scripts/run-migrations.ts --mark-applied   # mark all as applied without executing
//
// Environment:
//   POSTGRES_URL (or DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING)
// ============================================================

import { config } from "dotenv";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

// Load .env.local (then .env) so `npm run db:migrate` works without
// manually prefixing POSTGRES_URL on the command line.
config({ path: join(__dirname, "..", ".env.local") });
config({ path: join(__dirname, "..", ".env") });

// neon() returns a callable that also has a .query() method.
// Newer versions of @neondatabase/serverless require tagged-template
// syntax for the callable form, so we use .query() for raw SQL strings.
type SqlFn = NeonQueryFunction<false, false> & {
  query: (
    sql: string,
    params?: unknown[],
  ) => Promise<Record<string, unknown>[]>;
};

// ── Configuration ─────────────────────────────────────────────

const MIGRATIONS_DIR = join(__dirname, "migrations");
const MIGRATION_FILE_PATTERN = /^(\d{3})-.*\.sql$/;

// ── CLI Arguments ─────────────────────────────────────────────

const args = process.argv.slice(2);
const statusOnly = args.includes("--status");
const dryRun = args.includes("--dry-run");
const checkOnly = args.includes("--check");
const markApplied = args.includes("--mark-applied");

// ── Helpers ───────────────────────────────────────────────────

function getConnectionString(): string {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    console.error("\n  ABORTED: No database connection string found.");
    console.error("  Set one of: POSTGRES_URL, DATABASE_URL,");
    console.error(
      "             POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING\n",
    );
    process.exit(1);
  }

  return connectionString;
}

/**
 * Execute a raw SQL string. Table/column names come from our own migration
 * files, so string interpolation is safe here (no user input).
 *
 * Uses sql.query() (conventional function call) instead of tagged-template
 * syntax, since migration SQL is a plain string, not a template literal.
 */
async function rawQuery(
  sql: SqlFn,
  query: string,
): Promise<Record<string, unknown>[]> {
  const result = await sql.query(query);
  return result as Record<string, unknown>[];
}

/**
 * Discover all migration files in the migrations directory, sorted by
 * numeric prefix.
 */
function discoverMigrations(): { number: number; filename: string }[] {
  let files: string[];
  try {
    files = readdirSync(MIGRATIONS_DIR);
  } catch {
    console.error(
      `\n  ABORTED: Could not read migrations directory: ${MIGRATIONS_DIR}\n`,
    );
    process.exit(1);
  }

  const migrations: { number: number; filename: string }[] = [];

  for (const file of files) {
    const match = file.match(MIGRATION_FILE_PATTERN);
    if (match) {
      migrations.push({
        number: parseInt(match[1], 10),
        filename: file,
      });
    }
  }

  // Sort by numeric prefix
  migrations.sort((a, b) => a.number - b.number);
  return migrations;
}

/**
 * Ensure the _migrations tracking table exists.
 */
async function ensureMigrationsTable(sql: SqlFn): Promise<void> {
  await rawQuery(
    sql,
    `
    CREATE TABLE IF NOT EXISTS "_migrations" (
      "id"         SERIAL PRIMARY KEY,
      "filename"   TEXT UNIQUE NOT NULL,
      "appliedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `,
  );
}

/**
 * Get the set of already-applied migration filenames.
 */
async function getAppliedMigrations(sql: SqlFn): Promise<Set<string>> {
  const rows = await rawQuery(
    sql,
    `
    SELECT "filename" FROM "_migrations" ORDER BY "filename"
  `,
  );
  return new Set(rows.map((r) => r.filename as string));
}

/**
 * Split a migration file into individual SQL statements.
 *
 * Neon serverless driver only supports single-statement execution via
 * sql.query(), so we must split multi-statement migrations. This handles:
 *  - Semicolon-delimited statements
 *  - DO $$ ... $$ blocks (preserved as a single statement)
 *  - Comment-only lines (stripped)
 *  - BEGIN/COMMIT wrappers (stripped — Neon auto-commits each statement)
 */
function splitStatements(content: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inDollarBlock = false;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    // Skip pure comments and blank lines when not in a block
    if (!inDollarBlock && (trimmed === "" || trimmed.startsWith("--")))
      continue;

    // Skip BEGIN/COMMIT transaction wrappers (Neon auto-commits)
    if (!inDollarBlock && /^(BEGIN|COMMIT)\s*;?\s*$/i.test(trimmed)) continue;

    // Track DO $$ ... $$ blocks
    if (!inDollarBlock && /\$\$/.test(trimmed)) {
      inDollarBlock = true;
      current += line + "\n";
      // Check if both opening and closing $$ are on the same line (rare)
      const dollarCount = (trimmed.match(/\$\$/g) || []).length;
      if (dollarCount >= 2) {
        inDollarBlock = false;
        // Check if statement ends with semicolon after closing $$
        if (/\$\$\s*;?\s*$/.test(trimmed)) {
          const stmt = current.trim().replace(/;\s*$/, "");
          if (stmt) statements.push(stmt);
          current = "";
        }
      }
      continue;
    }

    if (inDollarBlock) {
      current += line + "\n";
      if (/\$\$\s*;?\s*$/.test(trimmed)) {
        inDollarBlock = false;
        const stmt = current.trim().replace(/;\s*$/, "");
        if (stmt) statements.push(stmt);
        current = "";
      }
      continue;
    }

    // Normal line — accumulate until semicolon
    current += line + "\n";
    if (trimmed.endsWith(";")) {
      const stmt = current.trim().replace(/;\s*$/, "");
      if (stmt) statements.push(stmt);
      current = "";
    }
  }

  // Flush remaining (statement without trailing semicolon)
  const remaining = current.trim().replace(/;\s*$/, "");
  if (remaining) statements.push(remaining);

  return statements;
}

/**
 * Apply a single migration file, executing each statement individually.
 *
 * Neon serverless driver requires single-statement execution. Multi-statement
 * migrations are split by splitStatements() and run sequentially.
 */
async function applyMigration(sql: SqlFn, filename: string): Promise<void> {
  const filePath = join(MIGRATIONS_DIR, filename);
  const content = readFileSync(filePath, "utf-8");

  const statements = splitStatements(content);

  for (const stmt of statements) {
    await rawQuery(sql, stmt);
  }

  // Record it in the tracking table
  await rawQuery(
    sql,
    `
    INSERT INTO "_migrations" ("filename") VALUES ('${filename.replace(/'/g, "''")}')
    ON CONFLICT ("filename") DO NOTHING
  `,
  );
}

/**
 * Mark a migration as applied without executing it.
 */
async function markMigrationApplied(
  sql: SqlFn,
  filename: string,
): Promise<void> {
  await rawQuery(
    sql,
    `
    INSERT INTO "_migrations" ("filename") VALUES ('${filename.replace(/'/g, "''")}')
    ON CONFLICT ("filename") DO NOTHING
  `,
  );
}

// ── Main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n============================================================");
  console.log("  Deep Dive — Database Migration Runner");
  console.log("============================================================\n");

  // Connect
  const connectionString = getConnectionString();
  const sql = neon(connectionString) as unknown as SqlFn;
  const maskedUrl = connectionString.replace(
    /:\/\/([^:]+):([^@]+)@/,
    "://$1:****@",
  );
  console.log(`  Database: ${maskedUrl}\n`);

  // Ensure tracking table
  await ensureMigrationsTable(sql);

  // Discover migrations
  const allMigrations = discoverMigrations();
  const applied = await getAppliedMigrations(sql);

  const pending = allMigrations.filter((m) => !applied.has(m.filename));

  // ── Status display ──────────────────────────────────────────

  console.log("── Migration Status ─────────────────────────────────────\n");

  for (const m of allMigrations) {
    const status = applied.has(m.filename) ? "APPLIED" : "PENDING";
    const marker = applied.has(m.filename) ? "  ✓" : "  ○";
    console.log(`${marker}  ${m.filename.padEnd(45)} ${status}`);
  }

  if (allMigrations.length === 0) {
    console.log("  (no migration files found)\n");
  }

  console.log(
    `\n  Total: ${allMigrations.length} migrations, ${applied.size} applied, ${pending.length} pending\n`,
  );

  // ── Status-only mode ────────────────────────────────────────

  if (statusOnly) {
    return;
  }

  // ── Check mode (CI drift gate) ──────────────────────────────
  // Exit non-zero when committed migrations have not reached this DB.
  // Wired into CI against the production connection string so schema
  // drift (e.g. a migration merged but never applied) turns CI red
  // instead of surfacing as a runtime 500 to the user.
  if (checkOnly) {
    if (pending.length > 0) {
      console.error(
        `\n  DRIFT: ${pending.length} migration(s) committed but NOT applied to this database:`,
      );
      for (const m of pending) console.error(`    ✗ ${m.filename}`);
      console.error("\n  Apply them with `npm run db:migrate`.\n");
      process.exit(1);
    }
    console.log("  No drift — every migration file is applied.\n");
    process.exit(0);
  }

  // ── No pending migrations ───────────────────────────────────

  if (pending.length === 0) {
    console.log("  All migrations are up to date. Nothing to do.\n");
    return;
  }

  // ── Dry-run mode ────────────────────────────────────────────

  if (dryRun) {
    console.log("── Dry Run (no changes made) ────────────────────────────\n");
    for (const m of pending) {
      console.log(`  Would apply: ${m.filename}`);
    }
    console.log(
      `\n  Run without --dry-run to apply these ${pending.length} migrations.\n`,
    );
    return;
  }

  // ── Mark-applied mode ───────────────────────────────────────

  if (markApplied) {
    console.log("── Marking as Applied (no SQL executed) ─────────────────\n");
    for (const m of pending) {
      await markMigrationApplied(sql, m.filename);
      console.log(`  MARKED  ${m.filename}`);
    }
    console.log(`\n  ${pending.length} migrations marked as applied.\n`);
    return;
  }

  // ── Apply pending migrations ────────────────────────────────

  console.log("── Applying Pending Migrations ──────────────────────────\n");

  let applied_count = 0;
  const errors: { filename: string; error: string }[] = [];

  for (const m of pending) {
    try {
      await applyMigration(sql, m.filename);
      applied_count++;
      console.log(`  OK      ${m.filename}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ filename: m.filename, error: message });
      console.error(`  FAIL    ${m.filename}: ${message}`);
      // Stop on first failure — migrations must run in order
      console.error("\n  Stopping: migrations must be applied in order.");
      console.error("  Fix the failing migration and re-run.\n");
      break;
    }
  }

  // ── Summary ─────────────────────────────────────────────────

  console.log("\n============================================================");
  console.log("  Summary");
  console.log("============================================================");
  console.log(`  Applied:  ${applied_count}`);
  console.log(`  Failed:   ${errors.length}`);
  console.log(`  Remaining: ${pending.length - applied_count - errors.length}`);

  if (errors.length > 0) {
    console.log("\n  Errors:");
    for (const { filename, error } of errors) {
      console.log(`    ${filename}: ${error}`);
    }
  }

  console.log("============================================================\n");

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
