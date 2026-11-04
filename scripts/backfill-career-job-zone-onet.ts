// ============================================================
// Phase 2.1 — Backfill CareerDirection.jobZone from O*NET Job Zones.txt
//
// Reads data/onet-30.2/Job Zones.txt (CC-BY 4.0, U.S. Department of Labor)
// and applies SOC-code → Job Zone (1-5) mapping to all CareerDirection rows
// with source='onet'. CareerDirection.id format is "onet-{SOC-CODE}" so we
// strip the prefix to look up the map.
//
// Coverage expectation: ~920+ / 923 onet-source rows. Unmatched rows go to
// the fallback queue for Phase 2.2 (LLM inference).
//
// Usage:
//   npx tsx scripts/backfill-career-job-zone-onet.ts            # apply
//   npx tsx scripts/backfill-career-job-zone-onet.ts --dry-run  # report only
// ============================================================

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

config({ path: join(__dirname, "..", ".env.local") });
config({ path: join(__dirname, "..", ".env") });

const DRY_RUN = process.argv.includes("--dry-run");
const ONET_JOB_ZONES_PATH = join(
  __dirname,
  "..",
  "data",
  "onet-30.2",
  "Job Zones.txt",
);
const REPORT_DIR = join(__dirname, "..", "tmp");

const url =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  console.error("Missing POSTGRES_URL / DATABASE_URL");
  process.exit(1);
}

const sql = neon(url);

// ── Step 1: Parse Job Zones.txt ──────────────────────────────

function parseJobZones(): Map<string, number> {
  const raw = readFileSync(ONET_JOB_ZONES_PATH, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const header = lines[0].split("\t");
  if (
    header[0] !== "O*NET-SOC Code" ||
    !header[1].toLowerCase().includes("job zone")
  ) {
    throw new Error(`Unexpected Job Zones.txt header: ${header.join(" | ")}`);
  }

  const map = new Map<string, number>();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const socCode = cols[0]?.trim();
    const zoneStr = cols[1]?.trim();
    const zone = Number(zoneStr);
    if (!socCode || !Number.isInteger(zone) || zone < 1 || zone > 5) continue;
    map.set(socCode, zone);
  }
  return map;
}

// ── Step 2: Fetch all onet-source CareerDirection rows ───────

interface OnetRow {
  id: string;
  titleEn: string;
  titleZh: string;
}

async function fetchOnetRows(): Promise<OnetRow[]> {
  const rows = await sql`
    SELECT id, "titleEn", "titleZh"
    FROM "CareerDirection"
    WHERE source = 'onet'
    ORDER BY id
  `;
  return rows as OnetRow[];
}

// ── Step 3: Apply mapping ────────────────────────────────────

interface MappingResult {
  id: string;
  titleEn: string;
  titleZh: string;
  socCode: string | null;
  jobZone: number | null;
  matched: boolean;
}

function buildResults(
  rows: OnetRow[],
  zoneMap: Map<string, number>,
): MappingResult[] {
  return rows.map((row) => {
    // id format: "onet-{SOC-CODE}" e.g. "onet-11-1011.00"
    const match = row.id.match(/^onet-(.+)$/);
    const socCode = match ? match[1] : null;
    const jobZone = socCode ? (zoneMap.get(socCode) ?? null) : null;
    return {
      id: row.id,
      titleEn: row.titleEn,
      titleZh: row.titleZh,
      socCode,
      jobZone,
      matched: jobZone !== null,
    };
  });
}

// ── Step 4: Write DB updates in batches ──────────────────────

async function applyUpdates(results: MappingResult[]): Promise<number> {
  const matched = results.filter((r) => r.matched);
  let written = 0;
  let skippedManual = 0;
  // Update one-by-one for clarity; 920 rows is tiny.
  // WHERE clause makes this re-runnable: rows manually overridden by a human
  // (jobZoneSource='manual') are preserved; LLM-batch rows are upgraded to
  // O*NET-official authority on rerun.
  for (const r of matched) {
    const result = await sql`
      UPDATE "CareerDirection"
      SET "jobZone" = ${r.jobZone},
          "jobZoneSource" = 'onet-official',
          "jobZoneConfidence" = 1.0,
          "updatedAt" = NOW()
      WHERE id = ${r.id}
        AND ("jobZoneSource" IS NULL OR "jobZoneSource" <> 'manual')
    `;
    // Neon's sql tag returns the rows array on SELECT; on UPDATE without
    // RETURNING, it returns an empty array but exposes `rowCount` on the
    // underlying object. Cast through unknown to access it without TS error.
    const meta = result as unknown as { rowCount?: number };
    const rowCount = typeof meta.rowCount === "number" ? meta.rowCount : 0;
    if (rowCount > 0) {
      written++;
    } else {
      skippedManual++;
    }
    if ((written + skippedManual) % 100 === 0) {
      console.log(
        `  ... ${written} written, ${skippedManual} skipped (manual override) / ${matched.length}`,
      );
    }
  }
  return written;
}

// ── Step 5: Write CSV report ─────────────────────────────────

function writeReport(results: MappingResult[]): string {
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }
  const today = new Date().toISOString().slice(0, 10);
  const reportPath = join(REPORT_DIR, `onet-mapping-${today}.csv`);
  const header = "id,titleEn,titleZh,socCode,jobZone,matched";
  const lines = results.map((r) => {
    const titleEn = r.titleEn.replace(/"/g, '""');
    const titleZh = r.titleZh.replace(/"/g, '""');
    return `${r.id},"${titleEn}","${titleZh}",${r.socCode ?? ""},${r.jobZone ?? ""},${r.matched}`;
  });
  writeFileSync(reportPath, [header, ...lines].join("\n") + "\n", "utf-8");
  return reportPath;
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Phase 2.1 — O*NET Job Zone Backfill");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Mode: ${DRY_RUN ? "DRY-RUN (no DB writes)" : "APPLY"}`);
  console.log();

  console.log("→ Parsing Job Zones.txt ...");
  const zoneMap = parseJobZones();
  console.log(`  ${zoneMap.size} SOC codes loaded`);

  console.log("→ Fetching CareerDirection rows (source='onet') ...");
  const rows = await fetchOnetRows();
  console.log(`  ${rows.length} rows fetched`);

  console.log("→ Building mapping ...");
  const results = buildResults(rows, zoneMap);
  const matched = results.filter((r) => r.matched).length;
  const unmatched = results.length - matched;
  console.log(
    `  Matched:   ${matched} (${((matched / results.length) * 100).toFixed(1)}%)`,
  );
  console.log(`  Unmatched: ${unmatched}`);

  // Distribution
  const dist = new Map<number, number>();
  for (const r of results) {
    if (r.jobZone !== null) {
      dist.set(r.jobZone, (dist.get(r.jobZone) ?? 0) + 1);
    }
  }
  console.log("\n  Job Zone distribution:");
  for (const zone of [1, 2, 3, 4, 5]) {
    const c = dist.get(zone) ?? 0;
    if (c > 0) console.log(`    Job Zone ${zone}: ${c}`);
  }

  // Sample unmatched
  if (unmatched > 0) {
    console.log(`\n  Sample unmatched (first 10):`);
    const samples = results.filter((r) => !r.matched).slice(0, 10);
    for (const s of samples) {
      console.log(`    ${s.id} | ${s.titleEn}`);
    }
  }

  const reportPath = writeReport(results);
  console.log(`\n→ Report written: ${reportPath}`);

  if (!DRY_RUN) {
    console.log("\n→ Applying UPDATE statements ...");
    const written = await applyUpdates(results);
    console.log(`  ${written} rows updated`);
  } else {
    console.log("\n→ DRY-RUN: no DB writes performed");
  }

  console.log("\n✓ Phase 2.1 complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
