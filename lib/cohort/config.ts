// ============================================================
// Declarative Cohort Configuration
//
// Add / remove cohorts here. After thesis, delete entries and
// infrastructure stays for future enterprise use.
// ============================================================

import type {
  CohortConfigMap,
  CohortEntitlements,
  CohortJourneyStep,
} from "./types";

export const COHORT_CONFIG: CohortConfigMap = {
  /**
   * Thesis 2026 — Cross-cultural career exploration research study.
   * Pre-assessment → Quick Dive → Deep Dive → Coaching → Post-immediate → Post-1week.
   * Research A/B: random classic/immersive assignment.
   * Delete this entry when thesis fieldwork ends.
   */
  thesis_2026: {
    displayName: "Thesis 2026",
    description: "Cross-cultural career exploration research study",
    steps: [
      "pre_assessment",
      "quick_dive",
      "deep_dive",
      "coaching",
      "post_immediate",
      "post_1week",
    ],
    trackingEnabled: true,
    autoAssignResearchGroup: "random",
    entitlements: {
      immersiveDive: true,
      deepDive: true,
      aiProfile: true,
      aiReport: true,
      aiCoaching: true,
      coachingDailyLimit: 20,
      requireResearchConsent: true,
      researchSurveys: true,
      resumeEnhancement: true,
      socialFeatures: false,
    },
  },

  /**
   * Beta 2026 — Early access product testing.
   * No research questionnaires, no A/B assignment.
   * Users freely choose Classic or Immersive Quick Dive.
   */
  beta_2026: {
    displayName: "Beta Tester",
    description: "Early access product testing",
    steps: ["quick_dive", "deep_dive"],
    trackingEnabled: false,
    entitlements: {
      immersiveDive: true,
      deepDive: true,
      aiProfile: true,
      aiReport: true,
      aiCoaching: true,
      coachingDailyLimit: 10,
      requireResearchConsent: false,
      researchSurveys: false,
      resumeEnhancement: true,
      socialFeatures: true,
    },
  },

  // ──────────────────────────────────────────────
  // Future examples:
  //
  // enterprise_acme: {
  //   displayName: 'Acme Corp Pilot',
  //   ...
  //   entitlements: { ... },
  // },
  // ──────────────────────────────────────────────
};

/** Default entitlements for users without a cohort — free tier only */
export const DEFAULT_ENTITLEMENTS: CohortEntitlements = {
  immersiveDive: false,
  deepDive: false,
  aiProfile: false,
  aiReport: false,
  aiCoaching: false,
  coachingDailyLimit: 0,
  requireResearchConsent: false,
  researchSurveys: false,
  resumeEnhancement: false,
  socialFeatures: false,
};

// ── Helpers ──────────────────────────────────────

/** Check if a cohort exists in the active config */
export function isCohortActive(cohortId: string): boolean {
  return cohortId in COHORT_CONFIG;
}

/**
 * Check if a cohort is a research cohort (requires pre/post measurements).
 * Use this instead of isCohortActive() when gating research-only features
 * like pre-assessment redirects, etc.
 */
export function isResearchCohort(cohortId: string): boolean {
  const config = COHORT_CONFIG[cohortId];
  return !!config?.trackingEnabled;
}

/** Get journey steps for a given cohort, or empty array if not found */
export function getCohortSteps(cohortId: string): CohortJourneyStep[] {
  return COHORT_CONFIG[cohortId]?.steps ?? [];
}

/**
 * Decide whether a user can move from `currentCohort` to `newCohort`
 * (by claiming an invite code that maps to `newCohort`).
 *
 * Policy: a user with no cohort can claim any active cohort. A user
 * already in a non-research cohort may upgrade into a research cohort
 * (e.g. beta_2026 → thesis_2026). Any other transition is rejected:
 * sideways non-research moves, research-to-non-research downgrades
 * (research-ethics: leaving the study requires the consent withdrawal
 * flow, not an invite code), and re-claiming the same cohort.
 *
 * The caller is responsible for triggering re-consent on the dashboard
 * — `researchConsentAt` is not touched by the claim path.
 */
export function canSwitchToCohort(
  currentCohort: string | null,
  newCohort: string,
):
  | { allowed: true }
  | { allowed: false; reason: "already_in_target" | "downgrade_forbidden" } {
  if (!currentCohort) return { allowed: true };
  // Current must be a known active cohort. Unknown / retired values
  // (data corruption, stale FK, manually edited rows) must NOT pass the
  // non-research check below — otherwise an unknown cohort would silently
  // satisfy `!isResearchCohort(unknown)` and let the user "upgrade" out
  // of an undefined state without admin oversight.
  if (!isCohortActive(currentCohort)) {
    return { allowed: false, reason: "downgrade_forbidden" };
  }
  if (currentCohort === newCohort) {
    return { allowed: false, reason: "already_in_target" };
  }
  if (!isResearchCohort(currentCohort) && isResearchCohort(newCohort)) {
    return { allowed: true };
  }
  return { allowed: false, reason: "downgrade_forbidden" };
}

/**
 * Resolve the researchGroup to assign for a cohort.
 * Returns null if the cohort has no auto-assignment configured.
 *
 * When autoAssignResearchGroup is 'random', uses forced balancing:
 * queries current group counts and assigns to the smaller group.
 * Ties are broken randomly to avoid deterministic bias.
 */
export async function resolveResearchGroup(
  cohortId: string,
): Promise<"classic" | "immersive" | null> {
  const config = COHORT_CONFIG[cohortId];
  if (!config?.autoAssignResearchGroup) return null;
  if (config.autoAssignResearchGroup === "random") {
    // Forced balancing: assign to the group with fewer members
    const { sql } = await import("@/lib/db/connection");
    const rows = await sql`
      SELECT "researchGroup", COUNT(*)::int as count
      FROM "User"
      WHERE "researchGroup" IN ('classic', 'immersive')
        AND "cohort" = ${cohortId}
      GROUP BY "researchGroup"
    `;
    const counts: Record<string, number> = { classic: 0, immersive: 0 };
    for (const row of rows) {
      counts[row.researchGroup as string] = row.count as number;
    }
    if (counts.classic === counts.immersive) {
      return Math.random() < 0.5 ? "classic" : "immersive";
    }
    return counts.classic < counts.immersive ? "classic" : "immersive";
  }
  return config.autoAssignResearchGroup;
}
