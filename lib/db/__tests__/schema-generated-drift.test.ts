// ============================================================
// Schema Generated Drift Test
//
// Runs the schema-types generator in-memory against the current
// scripts/schema.sql and compares its output to the checked-in
// lib/db/schema-generated.ts. If they differ, the generated file
// is stale — re-run `npm run db:generate-types` and commit.
//
// Replaces the old table-name-only schema-consistency.test.ts
// (removed 2026-04-08 along with lib/db/schema-init.ts).
// ============================================================

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  parseSchemaSql,
  renderTypesFile,
} from "../../../scripts/generate-db-types";

describe("Schema generated types drift", () => {
  const projectRoot = path.resolve(__dirname, "../../..");
  const schemaPath = path.join(projectRoot, "scripts/schema.sql");
  const generatedPath = path.join(projectRoot, "lib/db/schema-generated.ts");

  it("lib/db/schema-generated.ts must be up-to-date with scripts/schema.sql", () => {
    const sql = fs.readFileSync(schemaPath, "utf8");
    const tables = parseSchemaSql(sql);
    const expected = renderTypesFile(tables);
    const actual = fs.readFileSync(generatedPath, "utf8");

    if (actual !== expected) {
      throw new Error(
        [
          "schema-generated.ts is stale.",
          "",
          "scripts/schema.sql has changed but lib/db/schema-generated.ts",
          "has not been regenerated. Run:",
          "",
          "    npm run db:generate-types",
          "",
          "then commit the updated lib/db/schema-generated.ts.",
        ].join("\n"),
      );
    }
    expect(actual).toBe(expected);
  });

  it("parser should find all 40 tables (sanity check)", () => {
    const sql = fs.readFileSync(schemaPath, "utf8");
    const tables = parseSchemaSql(sql);
    expect(tables.length).toBeGreaterThanOrEqual(40);
  });
});
