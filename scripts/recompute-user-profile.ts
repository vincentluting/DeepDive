/**
 * Recompute PersonalProfile rows after the facet-name (hyphen vs underscore)
 * fix that landed 2026-05-10.
 *
 * Re-runs generateProfile() on the stored AssessmentResult.resultJson and
 * upserts the result. Pure algorithm — zero LLM calls.
 *
 * Narrative preservation:
 *   - saveProfile()'s ON CONFLICT merges narrativeSnapshots when the
 *     profileInputHash is unchanged. Pre-fix profiles have NO
 *     profileInputHash (null), so the ELSE branch runs and copies whatever
 *     narrative is on the new profile (which generateProfile builds empty).
 *   - To avoid silently dropping narratives, this script reads the existing
 *     narrativeSnapshots first and re-attaches them to the new profile
 *     before saveProfile.
 *
 * Modes:
 *   --email=<addr>   recompute one user
 *   --all            scan every user
 *   --safe-only      with --commit: skip rows where the recompute would
 *                    visibly change the user's UI (quadrant / dominant
 *                    conflict mode / coreQualities facet list). Default ON.
 *   --include-perceived  override --safe-only: also commit visible changes.
 *   --commit         actually write to DB. Without this flag, dry-run only.
 *   --verbose        print per-row diff (auto-on for --email mode)
 *
 * Usage:
 *   npx tsx scripts/recompute-user-profile.ts --email=foo@bar.com
 *   npx tsx scripts/recompute-user-profile.ts --all
 *   npx tsx scripts/recompute-user-profile.ts --all --commit
 *   npx tsx scripts/recompute-user-profile.ts --all --commit --include-perceived
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import type { AssessmentInput, PersonalProfileData } from "../lib/types";

const COMMIT = process.argv.includes("--commit");
const ALL = process.argv.includes("--all");
const INCLUDE_PERCEIVED = process.argv.includes("--include-perceived");
const SAFE_ONLY = !INCLUDE_PERCEIVED;
const VERBOSE_FLAG = process.argv.includes("--verbose");
const EMAIL_ARG = process.argv
  .find((a) => a.startsWith("--email="))
  ?.split("=")[1];

if (!ALL && !EMAIL_ARG) {
  console.error("Specify --email=<addr> or --all");
  process.exit(1);
}

const VERBOSE = VERBOSE_FLAG || !ALL;

interface UserRow {
  id: string;
  email: string;
}

interface AssessmentRow {
  id: string;
  userId: string;
  sessionId: string;
  version: string;
  createdAt: string;
  resultJson: AssessmentInput;
}

interface ProfileRow {
  id: string;
  assessmentId: string;
  profileJson: PersonalProfileData;
}

interface ChangeReport {
  userId: string;
  email: string;
  assessmentId: string;
  existingProfileId: string | null;
  algoChanged: boolean;
  perceivedChanged: boolean;
  perceivedReasons: string[];
  oldP: PersonalProfileData | null;
  newP: PersonalProfileData;
  failed?: string;
}

function fmt(label: string, before: unknown, after: unknown): string {
  const b = before === undefined || before === null ? "(null)" : String(before);
  const a = after === undefined || after === null ? "(null)" : String(after);
  const changed = b !== a;
  const arrow = changed ? "→" : "=";
  const tag = changed ? " ★" : "";
  return `  ${label.padEnd(28)} ${b.padStart(10)}  ${arrow}  ${a}${tag}`;
}

function facetList(p: PersonalProfileData): string {
  return (p.coreQualities ?? []).map((q) => q.facet).join(", ");
}

function classify(
  oldP: PersonalProfileData | null,
  newP: PersonalProfileData,
): { algoChanged: boolean; perceivedChanged: boolean; reasons: string[] } {
  if (!oldP) {
    return {
      algoChanged: true,
      perceivedChanged: true,
      reasons: ["new profile (no prior row)"],
    };
  }

  const reasons: string[] = [];

  const oldQuadrant = oldP.interpersonalEnergy?.quadrant;
  const newQuadrant = newP.interpersonalEnergy?.quadrant;
  if (oldQuadrant !== newQuadrant) {
    reasons.push(
      `quadrant ${oldQuadrant ?? "(null)"} → ${newQuadrant ?? "(null)"}`,
    );
  }

  const oldEnergyMode = oldP.interpersonalEnergy?.energyMode;
  const newEnergyMode = newP.interpersonalEnergy?.energyMode;
  if (oldEnergyMode !== newEnergyMode) {
    reasons.push(
      `energyMode ${oldEnergyMode ?? "(null)"} → ${newEnergyMode ?? "(null)"}`,
    );
  }

  const oldDominant = oldP.conflictHandling?.dominant;
  const newDominant = newP.conflictHandling?.dominant;
  if (oldDominant !== newDominant) {
    reasons.push(
      `conflict.dominant ${oldDominant ?? "(null)"} → ${newDominant ?? "(null)"}`,
    );
  }

  const oldSecondary = oldP.conflictHandling?.secondary;
  const newSecondary = newP.conflictHandling?.secondary;
  if (oldSecondary !== newSecondary) {
    reasons.push(
      `conflict.secondary ${oldSecondary ?? "(none)"} → ${newSecondary ?? "(none)"}`,
    );
  }

  const oldFacets = facetList(oldP);
  const newFacets = facetList(newP);
  if (oldFacets !== newFacets) {
    reasons.push(`coreQualities.facets list changed`);
  }

  const algoChanged =
    oldP.interpersonalEnergy?.agency !== newP.interpersonalEnergy?.agency ||
    oldP.interpersonalEnergy?.communion !==
      newP.interpersonalEnergy?.communion ||
    oldP.conflictHandling?.assertiveness !==
      newP.conflictHandling?.assertiveness ||
    oldP.conflictHandling?.cooperativeness !==
      newP.conflictHandling?.cooperativeness ||
    oldFacets !== newFacets ||
    oldQuadrant !== newQuadrant ||
    oldEnergyMode !== newEnergyMode ||
    oldDominant !== newDominant ||
    oldSecondary !== newSecondary;

  return { algoChanged, perceivedChanged: reasons.length > 0, reasons };
}

function printDiff(report: ChangeReport): void {
  const oldP = report.oldP;
  const next = report.newP;
  if (!oldP) {
    console.log("  (no prior profile — full creation)");
    return;
  }
  console.log("  Field diff (★ = changed):");
  console.log(
    fmt(
      "interpEnergy.agency",
      oldP.interpersonalEnergy?.agency,
      next.interpersonalEnergy?.agency,
    ),
  );
  console.log(
    fmt(
      "interpEnergy.communion",
      oldP.interpersonalEnergy?.communion,
      next.interpersonalEnergy?.communion,
    ),
  );
  console.log(
    fmt(
      "interpEnergy.quadrant",
      oldP.interpersonalEnergy?.quadrant,
      next.interpersonalEnergy?.quadrant,
    ),
  );
  console.log(
    fmt(
      "interpEnergy.energyMode",
      oldP.interpersonalEnergy?.energyMode,
      next.interpersonalEnergy?.energyMode,
    ),
  );
  console.log(
    fmt(
      "interpEnergy.derived.N4",
      oldP.interpersonalEnergy?.derivedFrom?.N4,
      next.interpersonalEnergy?.derivedFrom?.N4,
    ),
  );
  console.log(
    fmt(
      "conflict.assertiveness",
      oldP.conflictHandling?.assertiveness,
      next.conflictHandling?.assertiveness,
    ),
  );
  console.log(
    fmt(
      "conflict.cooperativeness",
      oldP.conflictHandling?.cooperativeness,
      next.conflictHandling?.cooperativeness,
    ),
  );
  console.log(
    fmt(
      "conflict.dominant",
      oldP.conflictHandling?.dominant,
      next.conflictHandling?.dominant,
    ),
  );
  console.log(
    fmt(
      "conflict.secondary",
      oldP.conflictHandling?.secondary,
      next.conflictHandling?.secondary,
    ),
  );
  console.log(
    fmt(
      "conflict.derived.N4",
      oldP.conflictHandling?.derivedFrom?.N4,
      next.conflictHandling?.derivedFrom?.N4,
    ),
  );
  console.log(fmt("coreQualities.facets", facetList(oldP), facetList(next)));
  console.log(
    fmt(
      "profileInputHash",
      oldP.profileInputHash ?? "(null)",
      next.profileInputHash ?? "(null)",
    ),
  );
}

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const { generateProfile } =
    await import("../lib/profile-generation/generate-profile");
  const { saveProfile } = await import("../lib/db/profiles");

  const sql = neon(process.env.DATABASE_URL!);

  console.log("=== Recompute PersonalProfile (post-facet-name-fix) ===");
  console.log(
    `Mode:           ${COMMIT ? "COMMIT (will write to DB)" : "DRY-RUN (no writes)"}`,
  );
  console.log(`Scope:          ${ALL ? "ALL users" : `email=${EMAIL_ARG}`}`);
  console.log(
    `Perceived UI:   ${SAFE_ONLY ? "SKIP visible changes (safe-only)" : "INCLUDE visible changes"}`,
  );
  console.log();

  const userRows = (ALL
    ? await sql`SELECT id, email FROM "User" ORDER BY "createdAt" ASC`
    : await sql`SELECT id, email FROM "User" WHERE LOWER(email) = LOWER(${EMAIL_ARG!})`) as unknown as UserRow[];

  if (userRows.length === 0) {
    console.error("No users found.");
    process.exit(1);
  }
  console.log(`Users:          ${userRows.length}`);

  const userIds = userRows.map((u) => u.id);
  const userEmailById = new Map(userRows.map((u) => [u.id, u.email]));

  const assessments = (await sql`
    SELECT id, "userId", "sessionId", version, "createdAt", "resultJson"
    FROM "AssessmentResult"
    WHERE "userId" = ANY(${userIds})
    ORDER BY "createdAt" DESC
  `) as unknown as AssessmentRow[];
  console.log(`Assessments:    ${assessments.length}`);
  console.log();

  const reports: ChangeReport[] = [];

  for (const assessment of assessments) {
    const email = userEmailById.get(assessment.userId) ?? "(unknown)";
    if (VERBOSE) {
      console.log(
        `--- ${email} | assess ${assessment.id.slice(0, 8)} (${assessment.version}) ---`,
      );
    }

    const existingRows = (await sql`
      SELECT id, "assessmentId", "profileJson"
      FROM "PersonalProfile"
      WHERE "assessmentId" = ${assessment.id}
    `) as unknown as ProfileRow[];
    const existing = existingRows[0];

    let next: PersonalProfileData;
    try {
      next = generateProfile(assessment.resultJson, assessment.userId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      reports.push({
        userId: assessment.userId,
        email,
        assessmentId: assessment.id,
        existingProfileId: existing?.id ?? null,
        algoChanged: false,
        perceivedChanged: false,
        perceivedReasons: [],
        oldP: existing?.profileJson ?? null,
        newP: {} as PersonalProfileData,
        failed: msg,
      });
      console.error(`  ✗ generateProfile threw: ${msg}`);
      continue;
    }

    if (existing?.profileJson?.narrativeSnapshots) {
      next.narrativeSnapshots = existing.profileJson.narrativeSnapshots;
    }

    const cls = classify(existing?.profileJson ?? null, next);
    const report: ChangeReport = {
      userId: assessment.userId,
      email,
      assessmentId: assessment.id,
      existingProfileId: existing?.id ?? null,
      algoChanged: cls.algoChanged,
      perceivedChanged: cls.perceivedChanged,
      perceivedReasons: cls.reasons,
      oldP: existing?.profileJson ?? null,
      newP: next,
    };
    reports.push(report);

    if (VERBOSE) {
      printDiff(report);
      if (cls.perceivedChanged) {
        console.log("  ⚠ perceived UI change:", cls.reasons.join("; "));
      } else if (cls.algoChanged) {
        console.log("  ✓ algo only (no UI change)");
      } else {
        console.log("  · algo no-op");
      }
      console.log();
    }
  }

  // Buckets
  const algoNoop = reports.filter((r) => !r.algoChanged && !r.failed);
  const safeChanges = reports.filter(
    (r) => r.algoChanged && !r.perceivedChanged && !r.failed,
  );
  const perceivedChanges = reports.filter(
    (r) => r.perceivedChanged && !r.failed,
  );
  const failures = reports.filter((r) => r.failed);

  console.log("=== Bucket distribution ===");
  console.log(`Total:                                  ${reports.length}`);
  console.log(`Algo no-op (no recompute change):       ${algoNoop.length}`);
  console.log(`Safe (algo changed, UI text unchanged): ${safeChanges.length}`);
  console.log(
    `Perceived UI change:                    ${perceivedChanges.length}`,
  );
  console.log(`Failed:                                 ${failures.length}`);
  console.log();

  if (perceivedChanges.length > 0) {
    console.log("--- Perceived UI changes (top 20) ---");
    for (const r of perceivedChanges.slice(0, 20)) {
      console.log(
        `  ${r.email} (assess ${r.assessmentId.slice(0, 8)}): ${r.perceivedReasons.join("; ")}`,
      );
    }
    if (perceivedChanges.length > 20) {
      console.log(`  ...and ${perceivedChanges.length - 20} more`);
    }
    console.log();
  }

  if (failures.length > 0) {
    console.log("--- Failures ---");
    for (const r of failures.slice(0, 10)) {
      console.log(`  ${r.email}: ${r.failed}`);
    }
    console.log();
  }

  if (!COMMIT) {
    console.log(
      `Dry-run complete. To apply changes:\n` +
        `  --safe-only (default): re-run with --commit  → would write ${safeChanges.length}\n` +
        `  --include-perceived:   re-run with --commit --include-perceived  → would write ${
          safeChanges.length + perceivedChanges.length
        }`,
    );
    return;
  }

  // COMMIT path
  const toWrite = SAFE_ONLY
    ? safeChanges
    : [...safeChanges, ...perceivedChanges];

  console.log(`Writing ${toWrite.length} row(s)...`);
  let written = 0;
  let writeFailed = 0;
  for (const r of toWrite) {
    try {
      if (r.existingProfileId) r.newP.id = r.existingProfileId;
      await saveProfile(r.newP);
      written++;
    } catch (err) {
      writeFailed++;
      console.error(
        `  ✗ ${r.email} (assess ${r.assessmentId.slice(0, 8)}):`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log();
  console.log("=== Write summary ===");
  console.log(`Eligible:  ${toWrite.length}`);
  console.log(`Written:   ${written}`);
  console.log(`Failed:    ${writeFailed}`);
  console.log(
    `Skipped (perceived UI, --safe-only): ${
      SAFE_ONLY ? perceivedChanges.length : 0
    }`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
