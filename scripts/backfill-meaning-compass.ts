/**
 * One-shot backfill: compute MeaningCompass for existing PersonalProfile rows
 * that lack the field (pre-v3.1 profiles).
 *
 * - Pure algorithm, zero LLM calls. Safe to run during cohort recruitment.
 * - meaningCompassNarrative stays empty — fills naturally on next narrative
 *   regeneration (or user can trigger via the locale-mismatch banner).
 * - Idempotent: skips profiles that already have meaningCompass.
 *
 * Usage:
 *   npx tsx scripts/backfill-meaning-compass.ts          # dry-run (logs only)
 *   npx tsx scripts/backfill-meaning-compass.ts --commit # actually update DB
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

const COMMIT = process.argv.includes("--commit");

interface BackfillRow {
  id: string;
  profileJson: unknown;
}

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const { computeMeaningCompass } =
    await import("../lib/profile-generation/meaning-compass");

  const sql = neon(process.env.DATABASE_URL!);

  console.log("=== Backfill MeaningCompass ===");
  console.log(
    `Mode: ${COMMIT ? "COMMIT (will write to DB)" : "DRY-RUN (no writes)"}`,
  );

  const rows = (await sql`
    SELECT id, "profileJson"
    FROM "PersonalProfile"
    ORDER BY "createdAt" DESC
  `) as unknown as BackfillRow[];

  console.log(`\nScanned ${rows.length} profile rows.`);

  let computed = 0;
  let skippedAlready = 0;
  let skippedNoData = 0;
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DB JSONB column has no static type
    const profile = row.profileJson as any;
    if (!profile) {
      skippedNoData++;
      continue;
    }
    if (profile.meaningCompass) {
      skippedAlready++;
      continue;
    }
    const algo = profile.algoSnapshot;
    if (!algo) {
      skippedNoData++;
      continue;
    }
    if (!profile.schwartzAnchors?.top3) {
      skippedNoData++;
      continue;
    }

    try {
      const compass = computeMeaningCompass(profile, algo);
      computed++;

      if (COMMIT) {
        const updatedProfile = { ...profile, meaningCompass: compass };
        await sql`
          UPDATE "PersonalProfile"
          SET "profileJson" = ${JSON.stringify(updatedProfile)}::jsonb
          WHERE id = ${row.id}
        `;
        updated++;
      }

      const overlapCount = compass.ikigai.overlap.length;
      const top3 = profile.schwartzAnchors.top3.join(", ");
      console.log(
        `  ✓ ${row.id.slice(0, 8)} pole=${compass.pole.axis}/${compass.pole.strength.toFixed(2)} overlap=${overlapCount} top3=[${top3}]`,
      );
    } catch (err) {
      failed++;
      console.error(
        `  ✗ ${row.id.slice(0, 8)} failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Computed:           ${computed}`);
  console.log(`Updated DB:         ${updated} (commit=${COMMIT})`);
  console.log(`Skipped (already):  ${skippedAlready}`);
  console.log(`Skipped (no data):  ${skippedNoData}`);
  console.log(`Failed:             ${failed}`);

  if (!COMMIT && computed > 0) {
    console.log(
      `\nDry-run complete. Re-run with --commit to actually update ${computed} rows.`,
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
