/**
 * scripts/generate-db-types.ts
 *
 * Generates `lib/db/schema-generated.ts` from `scripts/schema.sql`.
 * The generated file is the single source of truth for DB row types
 * — `lib/db/*.ts` should import these instead of hand-writing interfaces
 * and casting `as unknown as Foo`.
 *
 * Re-run with: `npm run db:generate-types`
 *
 * The generator is deliberately minimal — it parses only what's needed
 * for row-shape TypeScript types: table name, column name, column type,
 * nullability. CHECK constraints, foreign keys, indexes, and defaults
 * are ignored because they don't affect row types.
 *
 * Type mapping (PostgreSQL → TypeScript):
 *   TEXT, VARCHAR, CHAR, UUID              → string
 *   BOOLEAN                                → boolean
 *   INTEGER, BIGINT, SMALLINT, NUMERIC,    → number
 *     REAL, DOUBLE PRECISION
 *   TIMESTAMP, TIMESTAMPTZ, DATE, TIME     → Date
 *   JSON, JSONB                            → unknown (narrow in app code)
 *   T[]  (postfix array form)              → T[]  (e.g. TEXT[] → string[])
 *   (anything else)                        → unknown
 *
 * Nullability: a column is `T | null` unless it has `NOT NULL` or
 * `PRIMARY KEY`. Array columns with `NOT NULL DEFAULT '{}'` become `T[]`
 * (non-null); nullable array columns become `T[] | null`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// ── Types ───────────────────────────────────────────────────

type TsType = "string" | "number" | "boolean" | "Date" | "unknown";

interface ParsedColumn {
  name: string;
  tsType: TsType;
  nullable: boolean;
  isArray: boolean;
  pgType: string; // kept for comments (includes `[]` suffix for arrays)
}

interface ParsedTable {
  name: string;
  columns: ParsedColumn[];
}

// ── Parser ──────────────────────────────────────────────────

export function parseSchemaSql(sql: string): ParsedTable[] {
  // Strip line comments (-- ...) to simplify parsing; block comments are
  // not used in schema.sql.
  const stripped = sql.replace(/--[^\n]*/g, "");

  const tableRegex =
    /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+"([^"]+)"\s*\(([\s\S]*?)\);/g;
  const tables: ParsedTable[] = [];

  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(stripped)) !== null) {
    const [, tableName, body] = match;
    const columns = parseColumns(body);
    if (columns.length > 0) {
      tables.push({ name: tableName, columns });
    }
  }

  tables.sort((a, b) => a.name.localeCompare(b.name));
  return tables;
}

/**
 * Split a CREATE TABLE body into top-level entries (columns + table-level
 * constraints). Commas inside parentheses (e.g. CHECK (x IN (1, 2))) are
 * ignored.
 */
function splitTopLevelCommas(body: string): string[] {
  const entries: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      entries.push(body.slice(start, i));
      start = i + 1;
    }
  }
  entries.push(body.slice(start));
  return entries.map((e) => e.trim()).filter((e) => e.length > 0);
}

function parseColumns(body: string): ParsedColumn[] {
  const columns: ParsedColumn[] = [];
  for (const entry of splitTopLevelCommas(body)) {
    // A column entry starts with a double-quoted identifier.
    // Table-level constraints (CONSTRAINT, CHECK, FOREIGN KEY, PRIMARY KEY
    // on multiple columns) start with a keyword and are skipped.
    const colMatch = entry.match(/^"([^"]+)"\s+([\s\S]+)$/);
    if (!colMatch) continue;
    const [, name, rest] = colMatch;

    // Extract the type. PostgreSQL types can be multi-word:
    //   TIMESTAMP WITHOUT TIME ZONE
    //   TIMESTAMP WITH TIME ZONE
    //   DOUBLE PRECISION
    //   VARCHAR(30), NUMERIC(10, 2)
    // Arrays use the `T[]` postfix form (e.g. TEXT[]).
    const typeMatch = rest.match(
      /^(TIMESTAMP(?:TZ)?(?:\s+(?:WITHOUT|WITH)\s+TIME\s+ZONE)?|DOUBLE\s+PRECISION|VARCHAR\s*\(\s*\d+\s*\)|CHAR\s*\(\s*\d+\s*\)|NUMERIC\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\)|DECIMAL\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\)|[A-Z]+)(\s*\[\s*\])?/i,
    );
    if (!typeMatch) continue;
    const baseType = typeMatch[1].replace(/\s+/g, " ").toUpperCase();
    const isArray = Boolean(typeMatch[2]);
    const pgType = isArray ? `${baseType}[]` : baseType;
    const afterType = rest.slice(typeMatch[0].length);

    const tsType = pgTypeToTs(baseType);
    const nullable =
      !/\bNOT\s+NULL\b/i.test(afterType) &&
      !/\bPRIMARY\s+KEY\b/i.test(afterType);

    columns.push({ name, tsType, nullable, isArray, pgType });
  }
  return columns;
}

function pgTypeToTs(pgType: string): TsType {
  const t = pgType.trim().toUpperCase();
  if (
    t === "TEXT" ||
    t.startsWith("VARCHAR") ||
    t.startsWith("CHAR") ||
    t === "UUID" ||
    t === "CITEXT"
  ) {
    return "string";
  }
  if (t === "BOOLEAN" || t === "BOOL") {
    return "boolean";
  }
  if (
    t === "INTEGER" ||
    t === "INT" ||
    t === "INT4" ||
    t === "BIGINT" ||
    t === "INT8" ||
    t === "SMALLINT" ||
    t === "INT2" ||
    t === "REAL" ||
    t === "FLOAT4" ||
    t === "DOUBLE PRECISION" ||
    t === "FLOAT8" ||
    t.startsWith("NUMERIC") ||
    t.startsWith("DECIMAL") ||
    t === "SERIAL" ||
    t === "BIGSERIAL"
  ) {
    return "number";
  }
  if (
    t.startsWith("TIMESTAMP") ||
    t === "DATE" ||
    t === "TIME" ||
    t === "INTERVAL"
  ) {
    return "Date";
  }
  if (t === "JSONB" || t === "JSON") {
    return "unknown";
  }
  return "unknown";
}

// ── Code generation ─────────────────────────────────────────

export function renderTypesFile(tables: ParsedTable[]): string {
  const header = `// ============================================================
// AUTO-GENERATED — DO NOT EDIT BY HAND.
// Source:    scripts/schema.sql
// Generator: scripts/generate-db-types.ts
// Re-run:    npm run db:generate-types
//
// This file is the single source of truth for raw DB row types.
// Import these in lib/db/*.ts instead of hand-writing interfaces
// and casting \`as unknown as T\`.
//
// Narrowing JSONB columns: the generator emits \`unknown\` for JSON
// columns. In callers, cast explicitly via a typed helper at the
// boundary between raw row and app type.
// ============================================================

`;

  const interfaces = tables
    .map((table) => {
      const interfaceName = `Db${table.name}`;
      const fields = table.columns
        .map((col) => {
          const rendered = col.isArray ? `${col.tsType}[]` : col.tsType;
          const optional = col.nullable ? " | null" : "";
          const comment = ` // ${col.pgType}${col.nullable ? " NULL" : ""}`;
          const safeName = needsQuotes(col.name) ? `"${col.name}"` : col.name;
          return `  ${safeName}: ${rendered}${optional};${comment}`;
        })
        .join("\n");
      return `export interface ${interfaceName} {\n${fields}\n}`;
    })
    .join("\n\n");

  const tableMap = [
    "",
    "/** Map of table name → row interface. */",
    "export interface DbTables {",
    ...tables.map((t) => `  ${JSON.stringify(t.name)}: Db${t.name};`),
    "}",
    "",
    "export type DbTableName = keyof DbTables;",
    "export type DbRow<T extends DbTableName> = DbTables[T];",
    "",
  ].join("\n");

  return header + interfaces + "\n" + tableMap;
}

function needsQuotes(ident: string): boolean {
  return !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ident);
}

// ── Entrypoint ──────────────────────────────────────────────

function main() {
  const schemaPath = path.join(projectRoot, "scripts/schema.sql");
  const outPath = path.join(projectRoot, "lib/db/schema-generated.ts");
  const sql = fs.readFileSync(schemaPath, "utf8");
  const tables = parseSchemaSql(sql);
  const content = renderTypesFile(tables);
  fs.writeFileSync(outPath, content, "utf8");
  const totalCols = tables.reduce((sum, t) => sum + t.columns.length, 0);
  console.log(
    `✅ Generated ${outPath}: ${tables.length} tables, ${totalCols} columns`,
  );
}

// Run if invoked directly (not when imported by tests).
const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1] ?? "");
if (invokedDirectly) {
  main();
}
