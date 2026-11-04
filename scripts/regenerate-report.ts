#!/usr/bin/env node
// ============================================================
// Regenerate Report — Phase 3.5 admin tool
//
// Triggers a fresh report generation for an existing CareerReport by
// mirroring the work done by POST /api/assessment/<assessmentId>/
// regenerate-report. Two-step:
//
//   1. supersedeActiveReports(assessmentId) — every active CareerReport
//      for this assessment gets supersededAt=NOW(). This matches the
//      partial unique index CareerReport_assessment_active_idx, freeing
//      up the "active" slot for a new INSERT.
//   2. UPDATE AssessmentPipeline: reportStatus → 'not_requested',
//      retryCount → 0, nextAttemptAt → NULL, lastStepError → NULL.
//      Without this step the cron worker stays on the old 'done' status
//      and never picks up the supersede. THIS WAS MISSING in the initial
//      Phase 3.5 commit — codex review caught it on 2026-05-21.
//
// After this script runs, the cron worker `pipeline-worker` (1-min tick)
// or the user revisiting `/<locale>/report/processing` will trigger a
// fresh generateCareerReport() call within ~60 seconds.
//
// Usage:
//   npm run llm:regenerate <reportId>                  # preview only
//   npm run llm:regenerate <reportId> -- --confirm
//   npm run llm:regenerate -- --user <email> --confirm
// ============================================================

import { neon } from "@neondatabase/serverless";

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return args[i + 1];
}
const reportIdArg = args.find(
  (a) => a.length === 36 && /^[0-9a-f-]+$/i.test(a),
);
const userFlag = flag("user");
const confirm = args.includes("--confirm");

function getConnectionString(): string {
  const c =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!c) throw new Error("Set POSTGRES_URL or DATABASE_URL.");
  return c;
}

interface ReportRow {
  id: string;
  assessmentId: string;
  userId: string | null;
  email: string | null;
  cohort: string | null;
  qualityScore: number | null;
  degradedSections: string[];
  llmProviderMap: Record<string, { provider: string; model: string }> | null;
  createdAt: string;
  supersededAt: string | null;
}

interface PipelineRow {
  id: string;
  reportStatus: string;
  locale: string;
  retryCount: number;
  lastStepError: string | null;
}

async function main(): Promise<void> {
  if (!reportIdArg && !userFlag) {
    console.error("Usage: regenerate-report.ts <reportId> [--confirm]");
    console.error("       regenerate-report.ts --user <email> [--confirm]");
    process.exit(2);
  }

  const sql = neon(getConnectionString());

  // Look up candidate report
  let rows: ReportRow[];
  if (reportIdArg) {
    rows = (await sql`
      SELECT
        cr."id", cr."assessmentId", cr."userId", u."email", u."cohort",
        cr."qualityScore", cr."degradedSections", cr."llmProviderMap",
        cr."createdAt", cr."supersededAt"
      FROM "CareerReport" cr
      LEFT JOIN "User" u ON u."id" = cr."userId"
      WHERE cr."id" = ${reportIdArg}
      LIMIT 1
    `) as unknown as ReportRow[];
  } else {
    rows = (await sql`
      SELECT
        cr."id", cr."assessmentId", cr."userId", u."email", u."cohort",
        cr."qualityScore", cr."degradedSections", cr."llmProviderMap",
        cr."createdAt", cr."supersededAt"
      FROM "CareerReport" cr
      LEFT JOIN "User" u ON u."id" = cr."userId"
      WHERE u."email" = ${userFlag}
        AND cr."supersededAt" IS NULL
      ORDER BY cr."createdAt" DESC
      LIMIT 1
    `) as unknown as ReportRow[];
  }

  if (rows.length === 0) {
    console.error("No matching report found.");
    process.exit(1);
  }

  const r = rows[0];

  // Look up the pipeline so we can show what step 2 will do.
  const pipelineRows = (await sql`
    SELECT "id", "reportStatus", "locale", "retryCount", "lastStepError"
    FROM "AssessmentPipeline"
    WHERE "assessmentId" = ${r.assessmentId}
    LIMIT 1
  `) as unknown as PipelineRow[];
  const pipeline = pipelineRows[0];

  console.log("=".repeat(72));
  console.log(`  Regenerate Report — preview`);
  console.log("=".repeat(72));
  console.log(`  reportId:       ${r.id}`);
  console.log(`  assessmentId:   ${r.assessmentId}`);
  console.log(`  user:           ${r.email ?? "<anonymous>"}`);
  console.log(`  cohort:         ${r.cohort ?? "-"}`);
  console.log(`  qualityScore:   ${r.qualityScore ?? "n/a"}`);
  console.log(
    `  degraded:       ${r.degradedSections && r.degradedSections.length > 0 ? r.degradedSections.join(", ") : "(none)"}`,
  );
  console.log(`  createdAt:      ${r.createdAt}`);
  console.log(`  supersededAt:   ${r.supersededAt ?? "(active)"}`);
  if (r.llmProviderMap) {
    console.log(`  providerMap:`);
    for (const [task, info] of Object.entries(r.llmProviderMap)) {
      console.log(`    - ${task}: ${info.provider} / ${info.model}`);
    }
  } else {
    console.log("  providerMap:    (not recorded)");
  }
  if (pipeline) {
    console.log(`  pipelineId:     ${pipeline.id}`);
    console.log(`  pipelineState:  reportStatus=${pipeline.reportStatus}`);
    console.log(`                  locale=${pipeline.locale}`);
    console.log(`                  retryCount=${pipeline.retryCount}`);
    if (pipeline.lastStepError) {
      console.log(`                  lastError=${pipeline.lastStepError}`);
    }
  } else {
    console.log("  pipelineId:     (no AssessmentPipeline row)");
  }
  console.log("");

  if (!confirm) {
    console.log("  --confirm not set. No DB mutation performed.");
    console.log("");
    console.log("  With --confirm this script will:");
    console.log(`    1. UPDATE every active CareerReport WHERE assessmentId =`);
    console.log(`         ${r.assessmentId}`);
    console.log("       SET supersededAt = NOW().");
    if (pipeline) {
      console.log(`    2. UPDATE AssessmentPipeline ${pipeline.id}`);
      console.log("       SET reportStatus = 'not_requested',");
      console.log("           retryCount = 0,");
      console.log("           nextAttemptAt = NULL,");
      console.log("           lastStepError = NULL.");
    } else {
      console.log(
        "    2. (no pipeline row → /api/assessment/.../regenerate-report",
      );
      console.log("        endpoint will lazily create one on next request)");
    }
    console.log("");
    console.log(
      "  After --confirm the cron `pipeline-worker` (1-min tick) will",
    );
    console.log("  pick up the assessment and produce a fresh CareerReport.");
    console.log("");
    return;
  }

  // ── Mutation path ──
  // Step 1: supersede every active CareerReport for this assessment.
  // (Matches lib/db/reports.ts:supersedeActiveReports exactly so the
  // server-side regenerate endpoint and this admin script have identical
  // semantics.)
  const superseded = (await sql`
    UPDATE "CareerReport"
      SET "supersededAt" = NOW()
    WHERE "assessmentId" = ${r.assessmentId}
      AND "supersededAt" IS NULL
    RETURNING "id"
  `) as unknown as Array<{ id: string }>;

  if (superseded.length === 0) {
    console.log("  ⚠ No active report to supersede (already superseded?).");
  } else {
    console.log(
      `  ✅ Step 1: superseded ${superseded.length} active CareerReport row(s).`,
    );
  }

  // Step 2: reset pipeline.reportStatus so the cron worker treats this as
  // a fresh request. Mirrors the production endpoint's atomic UPDATE so
  // both retry paths leave the row in the same state.
  if (pipeline) {
    const reset = (await sql`
      UPDATE "AssessmentPipeline"
        SET "reportStatus"   = 'not_requested',
            "retryCount"     = 0,
            "nextAttemptAt"  = NULL,
            "lastStepError"  = NULL,
            "updatedAt"      = NOW()
      WHERE "id" = ${pipeline.id}
      RETURNING "id", "reportStatus"
    `) as unknown as Array<{ id: string; reportStatus: string }>;
    if (reset.length > 0) {
      console.log(
        `  ✅ Step 2: pipeline ${pipeline.id} → reportStatus='${reset[0].reportStatus}'.`,
      );
    } else {
      console.log("  ⚠ Pipeline UPDATE matched 0 rows. Manual check needed.");
    }
  } else {
    console.log("  ⚠ Step 2 skipped (no pipeline row). The user should hit");
    console.log(
      `     POST /api/assessment/${r.assessmentId}/regenerate-report`,
    );
    console.log(
      "     once, which creates a pipeline row lazily AND triggers regen.",
    );
  }

  console.log("");
  console.log("  The cron `pipeline-worker` (1-min tick) will produce a fresh");
  console.log("  CareerReport. To watch it land:");
  console.log("");
  console.log(
    `     npm run llm:degraded -- --user ${r.email ?? "<email>"} --days 1`,
  );
  console.log("");
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.stack : err);
  process.exit(1);
});
