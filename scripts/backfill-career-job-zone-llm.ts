// ============================================================
// Phase 2.2 — LLM backfill for curated/emerging CareerDirection rows.
//
// These rows (~225) have no O*NET SOC code, so Phase 2.1 official mapping
// did not cover them. We use the dedicated `career-tier-inference` LLM task
// (GPT-4o-mini, temperature 0.1, JSON output, 300 max tokens), added once
// for this backfill in lib/ai/model-router.ts.
//
// The prompt embeds O*NET Job Zone definitions verbatim so the model
// classifies against the same scale as official data.
//
// Usage:
//   npx tsx scripts/backfill-career-job-zone-llm.ts            # apply
//   npx tsx scripts/backfill-career-job-zone-llm.ts --dry-run  # report only
//   npx tsx scripts/backfill-career-job-zone-llm.ts --limit 10 # only first 10
// ============================================================

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { z } from "zod/v4";

config({ path: join(__dirname, "..", ".env.local") });
config({ path: join(__dirname, "..", ".env") });

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? Number(process.argv[LIMIT_IDX + 1]) : Infinity;

const REPORT_DIR = join(__dirname, "..", "tmp");
const CONCURRENCY = 5;

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

// ── Prompt ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an occupational classifier. Given a career title, industries, RIASEC profile, and tags, classify it into one of the five O*NET Job Zones (preparation level required to enter the occupation).

O*NET Job Zone definitions (US Department of Labor, CC BY 4.0):

Job Zone 2 — Little to Some Preparation Needed.
  Education: High school diploma or GED, sometimes none.
  Experience: Few months to one year of related experience or on-the-job training.
  Examples: dishwashers, landscaping workers, security guards, dental laboratory technicians, waiters, dining attendants, retail clerks.

Job Zone 3 — Medium Preparation Needed.
  Education: Vocational school training, related on-the-job experience, or an associate's degree.
  Experience: 1-2 years training/apprenticeship; may require licensing exams.
  Examples: electricians, barbers, medical assistants, court reporters, tour guides, skincare specialists, paralegals.

Job Zone 4 — Considerable Preparation Needed.
  Education: Four-year bachelor's degree (usually).
  Experience: Several years of work-related experience plus on-the-job training.
  Examples: accountants, real estate brokers, sales managers, database administrators, graphic designers, art directors, software engineers, UX designers, teachers, journalists, product managers, marketing managers.

Job Zone 5 — Extensive Preparation Needed.
  Education: Graduate school (master's, Ph.D., M.D., or J.D.).
  Experience: 5+ years of advanced work, often in specialized domains.
  Examples: physicians, surgeons, lawyers, pharmacists, university professors, executives (CEO/CFO), management consultants at partner level, scientists, judges, investment bankers (managing director).

Note: Job Zone 1 was merged with Zone 2 in O*NET 30.2 — do not use 1 unless the occupation truly requires no preparation whatsoever (extremely rare in professional contexts).

Output strict JSON only: {"jobZone": <2|3|4|5>, "confidence": <0..1>, "reasoning": "<one sentence>"}.`;

interface CareerInput {
  id: string;
  titleEn: string;
  titleZh: string;
  industries: string[];
  tags: string[];
  idealRiasec: Record<string, number>;
}

function buildUserPrompt(c: CareerInput): string {
  const top3Riasec = Object.entries(c.idealRiasec)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d, v]) => `${d}:${v}`)
    .join(" ");
  return `Career: ${c.titleEn} / ${c.titleZh}
Industries: ${c.industries.join(", ") || "—"}
Tags: ${c.tags.join(", ") || "—"}
Top RIASEC: ${top3Riasec}

Classify Job Zone (2-5).`;
}

// ── LLM output schema ────────────────────────────────────────

const ResultSchema = z.object({
  jobZone: z.number().int().min(1).max(5),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(500),
});

// ── Step 1: Fetch rows that need LLM inference ───────────────

async function fetchPending(): Promise<CareerInput[]> {
  const rows = await sql`
    SELECT id, "titleEn", "titleZh", industries, tags, "idealRiasec"
    FROM "CareerDirection"
    WHERE "jobZone" IS NULL
    ORDER BY source, id
  `;
  return rows as unknown as CareerInput[];
}

// ── Step 2: Call LLM via model-router ────────────────────────

interface InferenceResult {
  id: string;
  titleEn: string;
  titleZh: string;
  jobZone: number | null;
  confidence: number | null;
  reasoning: string;
  error?: string;
}

async function inferOne(c: CareerInput): Promise<InferenceResult> {
  const { callLLM } = await import("../lib/ai/model-router");
  try {
    const userPrompt = buildUserPrompt(c);
    const raw = await callLLM(
      "career-tier-inference",
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        responseFormat: "json",
      },
    );
    const parsed = ResultSchema.parse(JSON.parse(raw));
    return {
      id: c.id,
      titleEn: c.titleEn,
      titleZh: c.titleZh,
      jobZone: parsed.jobZone,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (err) {
    return {
      id: c.id,
      titleEn: c.titleEn,
      titleZh: c.titleZh,
      jobZone: null,
      confidence: null,
      reasoning: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// Simple concurrent processor with bounded parallelism.
async function inferAll(items: CareerInput[]): Promise<InferenceResult[]> {
  const results: InferenceResult[] = [];
  let processed = 0;
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(inferOne));
    results.push(...batchResults);
    processed += batch.length;
    console.log(`  ... ${processed} / ${items.length} processed`);
  }
  return results;
}

// ── Step 3: Apply DB updates ─────────────────────────────────

async function applyUpdates(results: InferenceResult[]): Promise<number> {
  let written = 0;
  for (const r of results) {
    if (r.jobZone === null || r.confidence === null) continue;
    await sql`
      UPDATE "CareerDirection"
      SET "jobZone" = ${r.jobZone},
          "jobZoneSource" = 'llm-batch',
          "jobZoneConfidence" = ${r.confidence},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
    written++;
  }
  return written;
}

// ── Step 4: Write CSV report ─────────────────────────────────

function writeReport(results: InferenceResult[]): string {
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }
  const today = new Date().toISOString().slice(0, 10);
  const reportPath = join(REPORT_DIR, `job-zone-backfill-llm-${today}.csv`);
  const header = "id,titleEn,titleZh,jobZone,confidence,reasoning,error";
  const lines = results.map((r) => {
    const titleEn = r.titleEn.replace(/"/g, '""');
    const titleZh = r.titleZh.replace(/"/g, '""');
    const reasoning = r.reasoning.replace(/"/g, '""').replace(/\n/g, " ");
    const error = (r.error ?? "").replace(/"/g, '""');
    return `${r.id},"${titleEn}","${titleZh}",${r.jobZone ?? ""},${r.confidence ?? ""},"${reasoning}","${error}"`;
  });
  writeFileSync(reportPath, [header, ...lines].join("\n") + "\n", "utf-8");
  return reportPath;
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Phase 2.2 — LLM backfill (curated + emerging)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Mode: ${DRY_RUN ? "DRY-RUN (no DB writes)" : "APPLY"}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log();

  console.log("→ Fetching pending rows (jobZone IS NULL) ...");
  const pending = await fetchPending();
  console.log(`  ${pending.length} rows pending`);

  if (pending.length === 0) {
    console.log("\n✓ Nothing to do — all rows already have jobZone");
    return;
  }

  const slice = pending.slice(0, LIMIT === Infinity ? pending.length : LIMIT);
  if (slice.length < pending.length) {
    console.log(`  Limited to first ${slice.length} (--limit ${LIMIT})`);
  }

  console.log("\n→ Calling LLM (model-router task: career-tier-inference) ...");
  const results = await inferAll(slice);

  const succeeded = results.filter((r) => r.jobZone !== null).length;
  const failed = results.length - succeeded;
  const avgConf =
    results
      .filter((r) => r.confidence !== null)
      .reduce((sum, r) => sum + (r.confidence ?? 0), 0) / (succeeded || 1);

  console.log(`\n  Succeeded: ${succeeded}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Avg confidence: ${avgConf.toFixed(3)}`);

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

  if (failed > 0) {
    console.log(`\n  Failed samples (first 5):`);
    const samples = results.filter((r) => r.error).slice(0, 5);
    for (const s of samples) {
      console.log(`    ${s.id} | ${s.titleEn} | ${s.error}`);
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

  console.log("\n✓ Phase 2.2 complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
