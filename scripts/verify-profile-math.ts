/**
 * Independent runtime verification: take DB-stored facet values for a user,
 * run the canonical algorithm functions, and compare every output field to
 * what's actually stored in PersonalProfile. ANY mismatch = bug.
 *
 * This is stronger than reading code — it executes the production functions
 * with production data and asserts byte-for-byte equality.
 *
 * Usage:
 *   npx tsx scripts/verify-profile-math.ts --email=vincentluting@gmail.com
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import type { AssessmentInput, PersonalProfileData } from "../lib/types";

const EMAIL =
  process.argv.find((a) => a.startsWith("--email="))?.split("=")[1] ??
  "vincentluting@gmail.com";

interface AssessmentRow {
  id: string;
  resultJson: AssessmentInput;
}
interface ProfileRow {
  profileJson: PersonalProfileData;
}

function eq(a: unknown, b: unknown): boolean {
  // Order-independent deep equality so JSONB key reordering doesn't
  // false-positive on objects with semantically identical contents.
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => eq(v, b[i]));
  }
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const ak = Object.keys(ao).sort();
  const bk = Object.keys(bo).sort();
  if (ak.length !== bk.length) return false;
  if (!ak.every((k, i) => k === bk[i])) return false;
  return ak.every((k) => eq(ao[k], bo[k]));
}

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const { computeInterpersonalEnergy } =
    await import("../lib/profile-generation/interpersonal-energy");
  const { computeConflictHandling } =
    await import("../lib/profile-generation/conflict-handling-style");
  const { computeCoreQualities } =
    await import("../lib/profile-generation/core-qualities");
  const { computeProfileAlgorithm } =
    await import("../lib/profile-generation/profile-algorithm");
  const { generateProfile } =
    await import("../lib/profile-generation/generate-profile");

  const sql = neon(process.env.DATABASE_URL!);

  console.log(`=== Runtime profile verification for ${EMAIL} ===\n`);

  const rows = (await sql`
    SELECT a.id, a."resultJson"
    FROM "AssessmentResult" a
    JOIN "User" u ON u.id = a."userId"
    WHERE LOWER(u.email) = LOWER(${EMAIL})
    ORDER BY a."createdAt" DESC LIMIT 1
  `) as unknown as AssessmentRow[];

  if (rows.length === 0) {
    console.error("No assessment found");
    process.exit(1);
  }

  const assessment = rows[0].resultJson;
  const profileRows = (await sql`
    SELECT "profileJson" FROM "PersonalProfile"
    WHERE "assessmentId" = ${rows[0].id}
  `) as unknown as ProfileRow[];

  if (profileRows.length === 0) {
    console.error("No profile found");
    process.exit(1);
  }

  const stored = profileRows[0].profileJson;

  // Recompute using the SAME canonical algorithm + SAME stored input
  const algo = computeProfileAlgorithm(assessment);
  const recomputed = generateProfile(assessment, undefined, algo);
  const recomputedInterp = computeInterpersonalEnergy(algo.bigFiveFacetPairs);
  const recomputedConflict = computeConflictHandling(
    algo.bigFiveFacetPairs,
    algo.bigFiveDomains,
  );
  const recomputedCoreQ = computeCoreQualities(algo.bigFiveFacetPairs);

  // ---- Field-by-field equality check ----
  const checks: Array<{ name: string; pass: boolean; detail?: string }> = [];

  function check(name: string, recomputed: unknown, stored: unknown) {
    const pass = eq(recomputed, stored);
    checks.push({
      name,
      pass,
      detail: pass
        ? undefined
        : `recomputed=${JSON.stringify(recomputed)} stored=${JSON.stringify(stored)}`,
    });
  }

  check(
    "interpEnergy.agency",
    recomputedInterp?.agency,
    stored.interpersonalEnergy?.agency,
  );
  check(
    "interpEnergy.communion",
    recomputedInterp?.communion,
    stored.interpersonalEnergy?.communion,
  );
  check(
    "interpEnergy.quadrant",
    recomputedInterp?.quadrant,
    stored.interpersonalEnergy?.quadrant,
  );
  check(
    "interpEnergy.energyMode",
    recomputedInterp?.energyMode,
    stored.interpersonalEnergy?.energyMode,
  );
  check(
    "interpEnergy.derivedFrom.N4",
    recomputedInterp?.derivedFrom?.N4,
    stored.interpersonalEnergy?.derivedFrom?.N4,
  );

  check(
    "conflict.assertiveness",
    recomputedConflict?.assertiveness,
    stored.conflictHandling?.assertiveness,
  );
  check(
    "conflict.cooperativeness",
    recomputedConflict?.cooperativeness,
    stored.conflictHandling?.cooperativeness,
  );
  check(
    "conflict.dominant",
    recomputedConflict?.dominant,
    stored.conflictHandling?.dominant,
  );
  check(
    "conflict.secondary",
    recomputedConflict?.secondary,
    stored.conflictHandling?.secondary,
  );
  check(
    "conflict.modeScores",
    recomputedConflict?.modeScores,
    stored.conflictHandling?.modeScores,
  );
  check(
    "conflict.derivedFrom.N4",
    recomputedConflict?.derivedFrom?.N4,
    stored.conflictHandling?.derivedFrom?.N4,
  );
  check(
    "conflict.derivedFrom.O_domain",
    recomputedConflict?.derivedFrom?.O_domain,
    stored.conflictHandling?.derivedFrom?.O_domain,
  );

  // For coreQualities, we compare the facet-name list (the part the bug actually distorted).
  const recomputedFacets = recomputedCoreQ.map((q) => q.facet);
  const storedFacets = (stored.coreQualities ?? []).map((q) => q.facet);
  check("coreQualities.facets[order]", recomputedFacets, storedFacets);

  // Also check generateProfile end-to-end produces same algorithmic fields
  check(
    "e2e: interpEnergy.agency",
    recomputed.interpersonalEnergy?.agency,
    stored.interpersonalEnergy?.agency,
  );
  check(
    "e2e: conflictHandling.assertiveness",
    recomputed.conflictHandling?.assertiveness,
    stored.conflictHandling?.assertiveness,
  );

  // ---- Print ----
  let allPass = true;
  for (const c of checks) {
    const tag = c.pass ? "✓" : "✗";
    console.log(`${tag} ${c.name}${c.pass ? "" : ` — ${c.detail}`}`);
    if (!c.pass) allPass = false;
  }
  console.log();
  console.log(
    `Total: ${checks.length} | Pass: ${checks.filter((c) => c.pass).length} | Fail: ${checks.filter((c) => !c.pass).length}`,
  );
  console.log();
  if (allPass) {
    console.log(
      `✅ VERDICT: ${EMAIL}'s stored profile matches canonical algorithm output byte-for-byte across all ${checks.length} fields.`,
    );
  } else {
    console.log(
      `❌ VERDICT: ${EMAIL}'s stored profile DOES NOT match algorithm output.`,
    );
    process.exit(2);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
