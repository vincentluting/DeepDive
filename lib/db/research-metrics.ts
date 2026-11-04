// ============================================================
// Research metrics — THE canonical definition of the thesis
// population and T0/T1/T2 timepoints.
//
// CANONICAL RESEARCH POPULATION (every thesis statistic uses this):
//   1. researchGroup IS NOT NULL          — assigned to classic/immersive
//   2. researchConsentAt IS NOT NULL      — consent timestamp present
//   3. isAdmin = FALSE                    — exclude internal/test accounts
//   4. EXISTS active ConsentRecord        — consent NOT withdrawn
//      (withdrawnAt IS NULL; ConsentRecord is the audit source of truth,
//       mirrors lib/db/consent-records.ts hasResearchConsent())
//
// CANONICAL TIMEPOINTS: see lib/research/pairing.ts —
//   T0 = first 'pre', T1 = latest 'post_immediate', T2 = latest 'post_1week',
//   exactly one row per user per timepoint.
//
// Any query that defines the thesis population differently is a bug.
// Documented in docs/architecture/admin-metrics.md.
// ============================================================

import { sql } from "./connection";
import {
  selectCanonicalTimepoints,
  pairScores,
  type AssessmentRow,
  type AssessmentTimepointType,
  type CanonicalTimepoints,
  type MultiRecordUser,
  type PairedSccData,
} from "@/lib/research/pairing";

export type { MultiRecordUser, PairedSccData };

/**
 * Fetch all PrePostAssessment rows belonging to the canonical research
 * population, ordered chronologically. Raw rows — canonical timepoint
 * selection happens in lib/research/pairing.ts (pure, unit-tested).
 */
export async function getResearchPrePostRows(): Promise<AssessmentRow[]> {
  const rows = await sql`
    SELECT
      p."userId",
      p."assessmentType",
      p."sccTotalScore",
      p."cdseTotalScore",
      p."createdAt"
    FROM "PrePostAssessment" p
    JOIN "User" u ON u."id" = p."userId"
    WHERE p."userId" IS NOT NULL
      AND u."researchGroup" IS NOT NULL
      AND u."researchConsentAt" IS NOT NULL
      AND u."isAdmin" = FALSE
      AND EXISTS (
        SELECT 1 FROM "ConsentRecord" cr
        WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
      )
    ORDER BY p."userId", p."createdAt" ASC
  `;

  return rows.map((r) => ({
    userId: r.userId as string,
    assessmentType: r.assessmentType as AssessmentTimepointType,
    sccTotalScore: r.sccTotalScore != null ? Number(r.sccTotalScore) : null,
    cdseTotalScore: r.cdseTotalScore != null ? Number(r.cdseTotalScore) : null,
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : String(r.createdAt),
  }));
}

/**
 * Canonical timepoints per user (T0 first / T1 latest / T2 latest),
 * restricted to the canonical research population.
 */
export async function getCanonicalTimepoints(): Promise<{
  byUser: Map<string, CanonicalTimepoints>;
  multiRecordUsers: MultiRecordUser[];
}> {
  const rows = await getResearchPrePostRows();
  return selectCanonicalTimepoints(rows);
}

/**
 * Paired SCC scores for the thesis headline statistics.
 * T0→T1 and T0→T2 are SEPARATE pair sets — never pool them into one test.
 */
export async function getPairedSccData(): Promise<PairedSccData> {
  const { byUser, multiRecordUsers } = await getCanonicalTimepoints();
  const { t0t1, t0t2 } = pairScores(byUser, "scc");
  return { t0t1, t0t2, multiRecordUsers };
}

/**
 * Users with more than one record of the same assessment type —
 * surfaced as data-quality warnings in the admin Research section.
 */
export async function getMultiRecordUsers(): Promise<MultiRecordUser[]> {
  const { multiRecordUsers } = await getCanonicalTimepoints();
  return multiRecordUsers;
}
