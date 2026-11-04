/**
 * Research Retention — Dry Run
 *
 * Read-only preview of what the post-thesis decommission will affect.
 * Lists every research-only table's row count, consented research
 * participant count, and which columns will be cleared from the User /
 * InviteCode tables.
 *
 * **This script never mutates data.** It only runs SELECT/COUNT queries.
 * Safe to execute during active thesis data collection — there is no
 * --commit flag because there is nothing to commit.
 *
 * Usage:
 *   npx tsx scripts/research-retention-dry-run.ts
 *
 * What it surfaces:
 *   - Row counts for each research-only table
 *   - Number of users with researchGroup set (raw vs consented)
 *   - Number of invite codes with researchGroup assignment
 *   - Sample of ReportEngagement.scrollbacks payload sizes (research-only column)
 *   - User columns that will be NULL'd at decommission
 *
 * The actual decommission happens at trigger date (thesis defense + grade +
 * 6 months retention) per docs/architecture/research-lifecycle.md. This script
 * is the "preview" step that runs ahead of any drop migration.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

interface CountRow {
  count: string;
}

function pad(n: string | number, width = 10): string {
  return String(n).padStart(width);
}

async function main() {
  if (
    !process.env.POSTGRES_URL &&
    !process.env.DATABASE_URL &&
    !process.env.POSTGRES_PRISMA_URL &&
    !process.env.POSTGRES_URL_NON_POOLING
  ) {
    console.error(
      "ERROR: No database connection string found. Source .env.local first.",
    );
    process.exit(1);
  }

  // Import sql lazily so dotenv has set env vars by the time the connection
  // module reads them.
  const { sql } = await import("../lib/db/connection");

  console.log("");
  console.log("============================================================");
  console.log("Research Retention — Dry Run");
  console.log("Generated:", new Date().toISOString());
  console.log("Mode: READ-ONLY (no mutations)");
  console.log("============================================================");

  // ── Section 1: Research-only tables (will be dropped) ────────────
  console.log("\n## Tables that will be dropped at decommission\n");

  const prePost = (await sql`
    SELECT COUNT(*)::text AS count FROM "PrePostAssessment"
  `) as CountRow[];
  console.log(
    `  PrePostAssessment          ${pad(prePost[0]?.count ?? "0")} rows`,
  );

  const reminders = (await sql`
    SELECT COUNT(*)::text AS count FROM "Post1WeekReminderLog"
  `) as CountRow[];
  console.log(
    `  Post1WeekReminderLog       ${pad(reminders[0]?.count ?? "0")} rows`,
  );

  // ConsentRecord — retained per IRB policy (longer than thesis decommission)
  const consent = (await sql`
    SELECT COUNT(*)::text AS count FROM "ConsentRecord"
  `) as CountRow[];
  console.log(
    `  ConsentRecord (IRB-retained, NOT dropped at decommission): ${
      consent[0]?.count ?? "0"
    } rows`,
  );

  // ── Section 2: User columns to clear ─────────────────────────────
  console.log("\n## User columns to clear at decommission\n");

  const userTotal = (await sql`
    SELECT COUNT(*)::text AS count FROM "User"
  `) as CountRow[];
  const userWithGroup = (await sql`
    SELECT COUNT(*)::text AS count FROM "User" WHERE "researchGroup" IS NOT NULL
  `) as CountRow[];
  const userConsented = (await sql`
    SELECT COUNT(*)::text AS count FROM "User"
    WHERE "researchGroup" IS NOT NULL AND "researchConsentAt" IS NOT NULL
  `) as CountRow[];
  const userWithParticipantId = (await sql`
    SELECT COUNT(*)::text AS count FROM "User" WHERE "researchParticipantId" IS NOT NULL
  `) as CountRow[];

  console.log(
    `  Total users:                                    ${pad(
      userTotal[0]?.count ?? "0",
    )}`,
  );
  console.log(
    `  Users with researchGroup set:                   ${pad(
      userWithGroup[0]?.count ?? "0",
    )}`,
  );
  console.log(
    `  Users with consent (researchGroup + consentAt): ${pad(
      userConsented[0]?.count ?? "0",
    )}`,
  );
  console.log(
    `  Users with researchParticipantId:               ${pad(
      userWithParticipantId[0]?.count ?? "0",
    )}`,
  );

  // Group breakdown for consented participants
  const groupBreakdown = (await sql`
    SELECT "researchGroup" AS "group", COUNT(*)::text AS count
    FROM "User"
    WHERE "researchGroup" IS NOT NULL AND "researchConsentAt" IS NOT NULL
    GROUP BY "researchGroup"
    ORDER BY "researchGroup"
  `) as Array<{ group: string; count: string }>;

  if (groupBreakdown.length > 0) {
    console.log("\n  Consented participants by group:");
    for (const row of groupBreakdown) {
      console.log(`    ${row.group.padEnd(12)} ${pad(row.count)}`);
    }
  }

  // ── Section 3: InviteCode column to clear ────────────────────────
  console.log("\n## InviteCode columns to clear at decommission\n");

  const inviteWithGroup = (await sql`
    SELECT COUNT(*)::text AS count FROM "InviteCode" WHERE "researchGroup" IS NOT NULL
  `) as CountRow[];
  console.log(
    `  Invite codes with researchGroup assignment:     ${pad(
      inviteWithGroup[0]?.count ?? "0",
    )}`,
  );

  // ── Section 4: ReportEngagement.scrollbacks (column drop) ────────
  console.log("\n## Columns to drop at decommission (not full table)\n");

  const engagementTotal = (await sql`
    SELECT COUNT(*)::text AS count FROM "ReportEngagement"
  `) as CountRow[];
  const engagementWithScrollbacks = (await sql`
    SELECT COUNT(*)::text AS count FROM "ReportEngagement"
    WHERE jsonb_array_length("scrollbacks") > 0
  `) as CountRow[];

  console.log(
    `  ReportEngagement total rows:                    ${pad(
      engagementTotal[0]?.count ?? "0",
    )} (table KEPT)`,
  );
  console.log(
    `  Rows with non-empty scrollbacks (column drops): ${pad(
      engagementWithScrollbacks[0]?.count ?? "0",
    )}`,
  );

  // ── Section 5: KEEP tables (informational only) ──────────────────
  console.log("\n## Tables KEPT post-decommission (informational only)\n");

  const nps = (await sql`
    SELECT COUNT(*)::text AS count FROM "ReportNPS"
  `) as CountRow[];
  const reaction = (await sql`
    SELECT COUNT(*)::text AS count FROM "ReportReaction"
  `) as CountRow[];
  const coachingFeedback = (await sql`
    SELECT COUNT(*)::text AS count FROM "CoachingFeedback"
  `) as CountRow[];

  console.log(
    `  ReportNPS                  ${pad(
      nps[0]?.count ?? "0",
    )} rows (kept as product analytics)`,
  );
  console.log(
    `  ReportReaction             ${pad(
      reaction[0]?.count ?? "0",
    )} rows (kept as product analytics)`,
  );
  console.log(
    `  ReportEngagement           ${pad(
      engagementTotal[0]?.count ?? "0",
    )} rows (kept as product analytics; scrollbacks column drops)`,
  );
  console.log(
    `  CoachingFeedback           ${pad(
      coachingFeedback[0]?.count ?? "0",
    )} rows (kept as product analytics)`,
  );

  // ── Summary ──────────────────────────────────────────────────────
  console.log("\n============================================================");
  console.log("Summary");
  console.log("============================================================");
  console.log("  2 tables to DROP at decommission:");
  console.log("    - PrePostAssessment, Post1WeekReminderLog");
  console.log(
    "  3 columns on User to clear/drop (researchGroup, researchParticipantId, researchConsentAt)",
  );
  console.log("  1 column on InviteCode to clear/drop (researchGroup)");
  console.log("  1 column on ReportEngagement to drop (scrollbacks)");
  console.log(
    "  ConsentRecord retained per IRB policy (5+ years post-publication)",
  );
  console.log("");
  console.log(
    "Trigger: thesis defense passed + grade received + 6 months retention",
  );
  console.log("Runbook: docs/architecture/research-lifecycle.md");
  console.log("");
}

main().catch((err) => {
  console.error("research-retention-dry-run failed:", err);
  process.exit(1);
});
