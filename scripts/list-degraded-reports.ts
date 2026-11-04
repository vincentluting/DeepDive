#!/usr/bin/env node
// ============================================================
// List Degraded Reports — Phase 3.5 admin tool
//
// Surfaces CareerReport rows that did NOT achieve 99%+ quality:
//   - qualityScore < 1.0 (at least one section fell back to algorithmic)
//   - llmProviderMap missing OR a narrative task ran on a non-Anthropic
//     provider (silent provider degradation)
//
// Founder runs this daily during the thesis collection window to spot
// outlier reports for manual regeneration. Read-only — no mutations.
//
// Usage:
//   node --env-file=.env.local --import tsx scripts/list-degraded-reports.ts
//   tsx scripts/list-degraded-reports.ts --days 7
//   tsx scripts/list-degraded-reports.ts --user vincentluting@gmail.com
//   tsx scripts/list-degraded-reports.ts --cohort thesis_2026
//   tsx scripts/list-degraded-reports.ts --json     # machine-readable
// ============================================================

import { neon } from "@neondatabase/serverless";

// ── Args ────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return args[i + 1];
}
const days = Number(flag("days") ?? "1");
const userFilter = flag("user") ?? null;
const cohortFilter = flag("cohort") ?? null;
const jsonOutput = args.includes("--json");

// Narrative tasks whose primary provider should be Anthropic.
// Mirrors lib/ai/model-router.ts TASK_CONFIG — manually duplicated here
// because this script must not import frozen-zone code.
const NARRATIVE_TASKS_PRIMARY: Record<string, string> = {
  "profile-narrative": "anthropic",
  integration: "anthropic",
  // career-match-narrative primary is gemini by design (cost). Listed
  // for visibility but a gemini value here is the EXPECTED happy path.
  "career-match-narrative": "gemini",
  "career-pathway": "openai",
};

// ── DB ──────────────────────────────────────────────────────

function getConnectionString(): string {
  const c =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!c) throw new Error("Set POSTGRES_URL or DATABASE_URL.");
  return c;
}

// ── Query ───────────────────────────────────────────────────

interface DegradedReportRow {
  reportId: string;
  userId: string | null;
  email: string | null;
  cohort: string | null;
  researchGroup: string | null;
  qualityScore: number | null;
  degradedSections: string[];
  llmProviderMap: Record<string, { provider: string; model: string }> | null;
  createdAt: string;
}

async function main(): Promise<void> {
  const sql = neon(getConnectionString());
  const sinceIso = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const rows = (await sql`
    SELECT
      cr."id"                        AS "reportId",
      cr."userId",
      u."email",
      u."cohort",
      u."researchGroup",
      cr."qualityScore",
      cr."degradedSections",
      cr."llmProviderMap",
      cr."createdAt"
    FROM "CareerReport" cr
    LEFT JOIN "User" u ON u."id" = cr."userId"
    WHERE cr."createdAt" >= ${sinceIso}
      AND cr."supersededAt" IS NULL
      AND (${userFilter}::text IS NULL OR u."email" = ${userFilter})
      AND (${cohortFilter}::text IS NULL OR u."cohort" = ${cohortFilter})
    ORDER BY cr."createdAt" DESC
  `) as unknown as DegradedReportRow[];

  // In-memory filter: keep only rows that are actually degraded by Phase 3.5
  // definition. Doing this in JS (not SQL) so we can inspect llmProviderMap
  // JSONB without painful jsonb_path expressions.
  const degraded = rows.filter((r) => {
    const score = r.qualityScore == null ? 1 : Number(r.qualityScore);
    if (score < 1.0) return true;
    if (!r.llmProviderMap) return false; // anonymous/unattributed — skip
    for (const [task, expectedProvider] of Object.entries(
      NARRATIVE_TASKS_PRIMARY,
    )) {
      const actual = r.llmProviderMap[task];
      if (actual && actual.provider !== expectedProvider) return true;
    }
    return false;
  });

  // Also list reports MISSING llmProviderMap — useful for anonymous flow
  // detection or DB-write races we may have missed.
  const missingMap = rows.filter(
    (r) => r.llmProviderMap == null && r.userId != null,
  );

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          windowDays: days,
          totalReports: rows.length,
          degradedCount: degraded.length,
          missingMapCount: missingMap.length,
          degraded,
          missingMap,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log("=".repeat(72));
  console.log(`  Degraded Reports — last ${days} day(s)`);
  console.log(`  ${new Date().toISOString()}`);
  console.log("=".repeat(72));
  console.log(`  Total reports in window: ${rows.length}`);
  console.log(`  Degraded reports:        ${degraded.length}`);
  console.log(`  Missing llmProviderMap:  ${missingMap.length}`);
  if (rows.length > 0) {
    const rate = ((degraded.length / rows.length) * 100).toFixed(2);
    console.log(`  Degraded rate:           ${rate}%`);
  }
  console.log("");

  if (degraded.length === 0 && missingMap.length === 0) {
    console.log("  ✅ No degraded reports in window.");
    console.log("");
    return;
  }

  for (const r of degraded) {
    const score =
      r.qualityScore == null ? "n/a" : Number(r.qualityScore).toFixed(2);
    const sections =
      r.degradedSections && r.degradedSections.length > 0
        ? r.degradedSections.join(", ")
        : "(none — only provider mismatch)";
    const providerHits: string[] = [];
    if (r.llmProviderMap) {
      for (const [task, expected] of Object.entries(NARRATIVE_TASKS_PRIMARY)) {
        const actual = r.llmProviderMap[task];
        if (actual && actual.provider !== expected) {
          providerHits.push(
            `${task}: ${actual.provider} (expected ${expected})`,
          );
        }
      }
    }
    console.log(`  ── report ${r.reportId.slice(0, 8)} ──`);
    console.log(`     user:           ${r.email ?? "<anonymous>"}`);
    console.log(
      `     cohort:         ${r.cohort ?? "-"}${r.researchGroup ? ` (${r.researchGroup})` : ""}`,
    );
    console.log(`     qualityScore:   ${score}`);
    console.log(`     fallback:       ${sections}`);
    if (providerHits.length > 0) {
      console.log(`     provider drift: ${providerHits.join("; ")}`);
    }
    console.log(`     createdAt:      ${r.createdAt}`);
    console.log(`     reportId:       ${r.reportId}`);
    console.log("");
  }

  if (missingMap.length > 0) {
    console.log(`  ⚠ ${missingMap.length} report(s) MISSING llmProviderMap:`);
    for (const r of missingMap) {
      console.log(
        `     ${r.reportId.slice(0, 8)} | ${r.email ?? "?"} | ${r.createdAt}`,
      );
    }
    console.log("");
    console.log(
      "  Missing map usually means the LLM logs did not capture userId.",
    );
    console.log(
      "  This is benign for anonymous flow; for logged-in users it is a bug.",
    );
    console.log("");
  }

  console.log("  Next steps:");
  console.log("    - Inspect a single report:");
  console.log(
    "        npx tsx scripts/audit-llm-quality.ts --report <reportId>",
  );
  console.log("    - Trigger a regenerate:");
  console.log("        npx tsx scripts/regenerate-report.ts <reportId>");
  console.log("");
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.stack : err);
  process.exit(1);
});
