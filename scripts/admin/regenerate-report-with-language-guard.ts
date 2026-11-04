/**
 * Admin: Regenerate a CareerReport using the language guard.
 *
 * Backfill tool for reports that were generated before the language guard
 * landed and contain mismatched-locale LLM output (e.g., Chinese text in an
 * English report, or vice versa). Runs locally against the prod/staging DB
 * using POSTGRES_URL / DATABASE_URL from .env.local.
 *
 * Usage:
 *   npx tsx scripts/admin/regenerate-report-with-language-guard.ts --report-id <uuid>
 *   npx tsx scripts/admin/regenerate-report-with-language-guard.ts --user-email <email>
 *
 * Flags:
 *   --dry-run         Compute the new report but do NOT write it back to the DB.
 *   --locale <code>   Override locale (default: the report's original locale or 'en').
 */

import { config } from "dotenv";
config({ path: ".env.local", override: true });

import type {
  AssessmentInput,
  CareerReport,
  RealConditions,
} from "../../lib/types";

interface Args {
  reportId?: string;
  userEmail?: string;
  dryRun: boolean;
  localeOverride?: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--report-id" && argv[i + 1]) out.reportId = argv[++i];
    else if (a === "--user-email" && argv[i + 1]) out.userEmail = argv[++i];
    else if (a === "--locale" && argv[i + 1]) out.localeOverride = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
  }
  if (!out.reportId && !out.userEmail) {
    console.error(
      "Error: must supply --report-id <uuid> or --user-email <email>.",
    );
    process.exit(1);
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const { neon } = await import("@neondatabase/serverless");
  const connStr = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connStr) {
    console.error(
      "Error: POSTGRES_URL or DATABASE_URL must be set in .env.local.",
    );
    process.exit(1);
  }
  const sql = neon(connStr);

  // ── 1. Resolve target report ──────────────────────────────
  // Note: CareerReport has no "locale" column — locale lives inside reportJson.
  let reportRow:
    | {
        id: string;
        assessmentId: string;
        userId: string | null;
        reportJson: unknown;
      }
    | undefined;

  if (args.reportId) {
    const rows = await sql`
      SELECT id, "assessmentId", "userId", "reportJson"
      FROM "CareerReport" WHERE id = ${args.reportId} LIMIT 1
    `;
    reportRow = rows[0] as typeof reportRow;
  } else if (args.userEmail) {
    const rows = await sql`
      SELECT r.id, r."assessmentId", r."userId", r."reportJson"
      FROM "CareerReport" r
      JOIN "User" u ON r."userId" = u.id
      WHERE LOWER(u.email) = LOWER(${args.userEmail})
      ORDER BY r."createdAt" DESC LIMIT 1
    `;
    reportRow = rows[0] as typeof reportRow;
  }

  if (!reportRow) {
    console.error("No report found.");
    process.exit(1);
  }
  const storedLocale = (reportRow.reportJson as { locale?: string } | null)
    ?.locale;
  const locale = args.localeOverride ?? storedLocale ?? "en";
  console.log(`📋 Report ${reportRow.id} (locale: ${locale})`);
  console.log(`   Assessment: ${reportRow.assessmentId}`);

  // ── 2. Load AssessmentResult (JSONB holds AssessmentInput) ─
  const assessmentRows = await sql`
    SELECT "resultJson", "sessionId"
    FROM "AssessmentResult" WHERE id = ${reportRow.assessmentId} LIMIT 1
  `;
  if (assessmentRows.length === 0) {
    console.error(`Assessment ${reportRow.assessmentId} not found.`);
    process.exit(1);
  }
  const assessmentRow = assessmentRows[0] as {
    resultJson: unknown;
    sessionId: string;
  };
  const assessment: AssessmentInput =
    typeof assessmentRow.resultJson === "string"
      ? JSON.parse(assessmentRow.resultJson)
      : (assessmentRow.resultJson as AssessmentInput);

  // ── 3. Load RealConditions (by sessionId) ─────────────────
  const conditionsRows = await sql`
    SELECT "conditionsJson"
    FROM "RealConditions"
    WHERE "sessionId" = ${assessmentRow.sessionId}
    ORDER BY "createdAt" DESC LIMIT 1
  `;
  let realConditions: RealConditions | null = null;
  if (conditionsRows.length > 0) {
    const raw = (conditionsRows[0] as { conditionsJson: unknown })
      .conditionsJson;
    const parsed =
      typeof raw === "string"
        ? JSON.parse(raw)
        : (raw as Record<string, unknown>);
    // Shape is already sanitized server-side before insert; cast is safe here.
    realConditions = parsed as unknown as RealConditions;
  }
  console.log(
    `   RealConditions: ${realConditions ? "loaded" : "none"} | sessionId: ${assessmentRow.sessionId}`,
  );

  // ── 4. Regenerate the report ─────────────────────────────
  const { generateCareerReport } = await import("../../lib/report-generation");

  console.log("⚙️  Regenerating report (this can take up to 3 min)...");
  const t0 = Date.now();
  const newReport: CareerReport = await generateCareerReport(
    assessment,
    realConditions,
    locale,
  );
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`✅ Regenerated in ${elapsed}s`);

  // ── 5. Quick sanity check: scan for locale leaks ─────────
  const { findMismatchedFields } =
    await import("../../lib/i18n/language-detect");
  const mismatches = findMismatchedFields(newReport, locale);
  if (mismatches.length > 0) {
    console.warn(
      `⚠️  Regenerated report still has ${mismatches.length} locale mismatches:`,
    );
    for (const m of mismatches.slice(0, 5)) {
      console.warn(`   ${m.path} — "${m.value.slice(0, 60)}..."`);
    }
    console.warn(
      "   (Guard sanitization should have cleaned these; investigate.)",
    );
  } else {
    console.log("✅ No locale mismatches detected in new report.");
  }

  // ── 6. Save or dry-run ───────────────────────────────────
  if (args.dryRun) {
    console.log("🔍 Dry run — no DB write performed. New report summary:");
    console.log(
      `   jobDirections: ${newReport.careerPathway?.jobDirections?.length ?? 0}`,
    );
    console.log(
      `   constraintStrategies: ${newReport.careerPathway?.jobSearchStrategy?.constraintStrategies?.length ?? 0}`,
    );
    return;
  }

  // Preserve the original report id — so frontend URLs keep working.
  const withOriginalId = { ...newReport, id: reportRow.id };
  const { updateReportJson } = await import("../../lib/db/reports");
  await updateReportJson(reportRow.id, withOriginalId);
  console.log(`💾 Saved. Report ${reportRow.id} updated in DB.`);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
