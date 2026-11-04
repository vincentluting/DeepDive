#!/usr/bin/env node
// ============================================================
// LLM Quality Audit — Phase 3.5 admin tool
//
// One-shot read-only audit of LLM quality across the last N days.
// Reports five things the founder needs to glance at every morning during
// the thesis collection window:
//
//   1. Per-task call counts, success %, primary-hit %, quality-gate pass %
//   2. Per-day report quality distribution (qualityScore histogram)
//   3. Top error messages (provider failures grouped)
//   4. Provider health snapshot (last 10-minute window — same source the
//      live model-router consults)
//   5. Reports with degraded sections (count by section)
//
// Usage:
//   node --env-file=.env.local --import tsx scripts/audit-llm-quality.ts
//   tsx scripts/audit-llm-quality.ts --days 14
//   tsx scripts/audit-llm-quality.ts --json
// ============================================================

import { neon } from "@neondatabase/serverless";

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return args[i + 1];
}
const days = Number(flag("days") ?? "7");
const jsonOutput = args.includes("--json");

// Mirrors lib/ai/model-router.ts TASK_CONFIG primary provider per task.
// Keep in sync manually — this script must not import the frozen zone.
const NARRATIVE_TASKS_PRIMARY: Record<string, string> = {
  "profile-narrative": "anthropic",
  integration: "anthropic",
  "career-match-narrative": "gemini",
  "career-pathway": "openai",
  coaching: "anthropic",
  "coaching-first": "anthropic",
  // coaching-summary primary is openai per TASK_CONFIG (cost — structured
  // memory extraction does not need narrative quality). Was incorrectly
  // listed as "anthropic" in the initial Phase 3.5 commit, which made the
  // daily audit flag every healthy production call as provider drift.
  // (Codex review P3 finding, 2026-05-21.)
  "coaching-summary": "openai",
  "career-tier-inference": "openai",
  "resume-parse": "openai",
  "memory-extract": "openai",
};

function getConnectionString(): string {
  const c =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!c) throw new Error("Set POSTGRES_URL or DATABASE_URL.");
  return c;
}

interface TaskStatsRow {
  taskName: string;
  provider: string;
  total: number;
  success: number;
  degraded: number;
  qualityPass: number;
  qualityFail: number;
  qualityNotChecked: number;
}

interface ErrorRow {
  errorMessage: string;
  provider: string;
  count: number;
}

interface ProviderHealthRow {
  provider: string;
  total: number;
  succeeded: number;
  successPct: number;
}

interface ReportQualityRow {
  day: string;
  total: number;
  qsAvg: number | null;
  qsBelowOne: number;
  qsNull: number;
}

interface SectionDegRow {
  section: string;
  count: number;
}

async function main(): Promise<void> {
  const sql = neon(getConnectionString());
  const sinceIso = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  ).toISOString();

  // 1) Per-task LLM stats (production env only)
  const taskStats = (await sql`
    SELECT
      "taskName",
      "provider",
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "success" = true)::int AS success,
      COUNT(*) FILTER (WHERE "degraded" = true)::int AS degraded,
      COUNT(*) FILTER (WHERE "qualityCheckResult" = 'pass')::int AS "qualityPass",
      COUNT(*) FILTER (
        WHERE "qualityCheckResult" IS NOT NULL
          AND "qualityCheckResult" NOT IN ('pass', 'not-checked')
      )::int AS "qualityFail",
      COUNT(*) FILTER (WHERE "qualityCheckResult" IS NULL)::int AS "qualityNotChecked"
    FROM "LLMUsageLog"
    WHERE "createdAt" >= ${sinceIso}
      AND "environment" = 'production'
    GROUP BY "taskName", "provider"
    ORDER BY total DESC
  `) as unknown as TaskStatsRow[];

  // 2) Top errors
  const errorRows = (await sql`
    SELECT "errorMessage", "provider", COUNT(*)::int AS count
    FROM "LLMUsageLog"
    WHERE "createdAt" >= ${sinceIso}
      AND "success" = false
      AND "errorMessage" IS NOT NULL
      AND "environment" = 'production'
    GROUP BY "errorMessage", "provider"
    ORDER BY count DESC
    LIMIT 10
  `) as unknown as ErrorRow[];

  // 3) Provider health — same 10-min window as model-router
  const healthRows = (await sql`
    SELECT
      "provider",
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "success" = true)::int AS succeeded,
      ROUND(
        COUNT(*) FILTER (WHERE "success" = true)::numeric
          / NULLIF(COUNT(*), 0) * 100, 1
      )::float AS "successPct"
    FROM "LLMUsageLog"
    WHERE "createdAt" > NOW() - INTERVAL '10 minutes'
      AND "environment" = 'production'
    GROUP BY "provider"
    ORDER BY total DESC
  `) as unknown as ProviderHealthRow[];

  // 4) Report-level quality distribution by day
  const reportDay = (await sql`
    SELECT
      DATE("createdAt")::text AS day,
      COUNT(*)::int AS total,
      ROUND(AVG("qualityScore")::numeric, 3)::float AS "qsAvg",
      COUNT(*) FILTER (WHERE "qualityScore" < 1.0)::int AS "qsBelowOne",
      COUNT(*) FILTER (WHERE "qualityScore" IS NULL)::int AS "qsNull"
    FROM "CareerReport"
    WHERE "createdAt" >= ${sinceIso}
      AND "supersededAt" IS NULL
    GROUP BY DATE("createdAt")
    ORDER BY day DESC
  `) as unknown as ReportQualityRow[];

  // 5) Degraded section counts (jsonb array unnest)
  const sectionRows = (await sql`
    SELECT
      section AS "section",
      COUNT(*)::int AS count
    FROM (
      SELECT unnest("degradedSections") AS section
      FROM "CareerReport"
      WHERE "createdAt" >= ${sinceIso}
        AND "supersededAt" IS NULL
        AND array_length("degradedSections", 1) > 0
    ) s
    GROUP BY section
    ORDER BY count DESC
  `) as unknown as SectionDegRow[];

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          windowDays: days,
          taskStats,
          errors: errorRows,
          providerHealth: healthRows,
          reportQuality: reportDay,
          degradedSections: sectionRows,
        },
        null,
        2,
      ),
    );
    return;
  }

  // ── Text report ──
  console.log("=".repeat(72));
  console.log(`  LLM Quality Audit — last ${days} day(s) (production env)`);
  console.log(`  ${new Date().toISOString()}`);
  console.log("=".repeat(72));

  console.log("");
  console.log("1) Per-task call stats");
  console.log("   ──────────────────────────────────────────────────────────");
  console.log(
    `   ${"task".padEnd(24)}${"provider".padEnd(12)}${"calls".padStart(6)}${"  ok%".padStart(7)}${"  qPass%".padStart(8)}${"  qFail".padStart(7)}${"  expects".padStart(10)}`,
  );
  if (taskStats.length === 0) {
    console.log("   (no LLM calls in window)");
  }
  for (const r of taskStats) {
    const total = Number(r.total);
    const okPct =
      total === 0 ? "—" : ((Number(r.success) / total) * 100).toFixed(1);
    const checked = Number(r.qualityPass) + Number(r.qualityFail);
    const qPct =
      checked === 0
        ? "—"
        : ((Number(r.qualityPass) / checked) * 100).toFixed(1);
    const expectedProvider = NARRATIVE_TASKS_PRIMARY[r.taskName] ?? "?";
    const marker = r.provider === expectedProvider ? " " : "⚠";
    console.log(
      `   ${marker} ${r.taskName.padEnd(22)}${r.provider.padEnd(12)}${String(total).padStart(6)}${okPct.padStart(7)}${qPct.padStart(8)}${String(r.qualityFail).padStart(7)}${expectedProvider.padStart(10)}`,
    );
  }

  console.log("");
  console.log("2) Per-day report quality (CareerReport)");
  console.log("   ──────────────────────────────────────────────────────────");
  console.log(
    `   ${"date".padEnd(12)}${"reports".padStart(8)}${"qsAvg".padStart(8)}${"  <1.00".padStart(8)}${"  null".padStart(8)}`,
  );
  if (reportDay.length === 0) {
    console.log("   (no reports generated in window)");
  }
  for (const r of reportDay) {
    console.log(
      `   ${r.day.padEnd(12)}${String(r.total).padStart(8)}${(r.qsAvg ?? 0).toFixed(2).padStart(8)}${String(r.qsBelowOne).padStart(8)}${String(r.qsNull).padStart(8)}`,
    );
  }

  console.log("");
  console.log("3) Top error messages (last " + days + " days)");
  console.log("   ──────────────────────────────────────────────────────────");
  if (errorRows.length === 0) {
    console.log("   ✅ No errors.");
  }
  for (const e of errorRows) {
    const msg = e.errorMessage.slice(0, 80);
    console.log(
      `   ${String(e.count).padStart(4)} × ${e.provider.padEnd(10)} ${msg}`,
    );
  }

  console.log("");
  console.log("4) Provider health (last 10 min — model-router live window)");
  console.log("   ──────────────────────────────────────────────────────────");
  console.log(
    `   ${"provider".padEnd(12)}${"calls".padStart(6)}${"  success%".padStart(10)}`,
  );
  if (healthRows.length === 0) {
    console.log("   (no recent calls)");
  }
  for (const h of healthRows) {
    const flag =
      Number(h.successPct) >= 95
        ? "🟢"
        : Number(h.successPct) >= 80
          ? "🟡"
          : "🔴";
    console.log(
      `   ${flag} ${h.provider.padEnd(10)}${String(h.total).padStart(6)}${(h.successPct ?? 0).toFixed(1).padStart(10)}`,
    );
  }

  console.log("");
  console.log("5) Degraded sections in window");
  console.log("   ──────────────────────────────────────────────────────────");
  if (sectionRows.length === 0) {
    console.log("   ✅ No section fell back to algorithmic text.");
  }
  for (const s of sectionRows) {
    console.log(`   ${String(s.count).padStart(4)} × ${s.section}`);
  }

  console.log("");
  console.log(
    "  Run `tsx scripts/list-degraded-reports.ts` for the row-level list.",
  );
  console.log("");
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.stack : err);
  process.exit(1);
});
