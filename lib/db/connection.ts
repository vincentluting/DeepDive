// ============================================================
// DB Connection — Neon Serverless Postgres singleton
//
// Lazily initializes a single `sql` tagged-template instance.
// All db modules import `sql` from this file.
// Env: POSTGRES_URL | DATABASE_URL | POSTGRES_PRISMA_URL | POSTGRES_URL_NON_POOLING
// ============================================================

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlInstance: NeonQueryFunction<false, false> | null = null;

function getConnectionString(): string {
  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error(
      "Database connection string not found. Please ensure POSTGRES_URL or DATABASE_URL environment variable is set.",
    );
  }

  return connectionString;
}

function getSql(): NeonQueryFunction<false, false> {
  if (!sqlInstance) {
    const connString = getConnectionString();
    sqlInstance = neon(connString);
  }
  return sqlInstance;
}

/** Retryable error codes: connection issues, not logical errors */
const RETRYABLE_CODES = new Set([
  "08000", // connection_exception
  "08003", // connection_does_not_exist
  "08006", // connection_failure
  "57P01", // admin_shutdown
  "57P03", // cannot_connect_now
]);

function isRetryable(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  if (code && RETRYABLE_CODES.has(code)) return true;
  const msg = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNRESET|ETIMEDOUT|socket hang up/i.test(msg);
}

const MAX_RETRIES = 2;
const BACKOFF_MS = [0, 500, 1500]; // immediate, 500ms, 1.5s

/**
 * Tagged-template SQL executor. Generic `T` is the row shape.
 *
 * Default (`T = any`) preserves back-compat with legacy callers that
 * use hand-written interfaces + `as unknown as Foo`. New code should
 * pass an explicit row type to get end-to-end type safety.
 *
 * Usage:
 * ```ts
 * // Legacy / untyped — returns any[]
 * const rows = await sql`SELECT id FROM "User"`;
 *
 * // Typed with a generated row type (preferred for new code)
 * const rows = await sql<DbUser>`SELECT * FROM "User"`;
 *
 * // Partial projection
 * const rows = await sql<Pick<DbUser, 'id' | 'email'>>`
 *   SELECT id, email FROM "User"
 * `;
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql = async <T = any>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> => {
  const queryHint = strings[0]?.trim().slice(0, 100) || "(unknown query)";
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
    }
    const start = Date.now();
    try {
      const instance = getSql();
      const result = (await instance(strings, ...values)) as T[];
      const duration = Date.now() - start;
      if (
        duration > 500 &&
        (process.env.NODE_ENV !== "production" ||
          process.env.DB_SLOW_QUERY_LOG === "true")
      ) {
        console.warn(`[db] Slow query (${duration}ms): ${queryHint}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      const pgCode = (error as { code?: string })?.code;
      if (attempt < MAX_RETRIES && isRetryable(error)) {
        console.warn(
          `[db] Retry ${attempt + 1}/${MAX_RETRIES}${pgCode ? ` (${pgCode})` : ""}: ${queryHint}`,
        );
        continue;
      }
      console.error(
        `[db] Query failed${pgCode ? ` (${pgCode})` : ""}: ${queryHint}`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  throw lastError;
};

/**
 * Escape ILIKE special characters in a search term.
 * Wraps the result with `%…%` for substring matching.
 *
 * Without this, user input containing `%` or `_` would act as
 * wildcard operators, potentially matching unintended rows or
 * triggering expensive full-table scans.
 */
export function ilikePattern(raw: string): string {
  const escaped = raw.trim().replace(/[%_\\]/g, "\\$&");
  return `%${escaped}%`;
}
