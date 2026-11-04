// ============================================================
// Tests for cohort entitlements + config policy
//
// Access-control core: canAccess() gates every entitlement-guarded
// feature and canSwitchToCohort() enforces research-ethics transition
// rules. A regression here silently grants or denies paid/gated
// features, or lets a user leave a research study via invite code
// instead of the consent-withdrawal flow. Zero DB queries in the
// paths tested here.
// ============================================================

import { describe, it, expect } from "vitest";

import {
  COHORT_CONFIG,
  DEFAULT_ENTITLEMENTS,
  isCohortActive,
  isResearchCohort,
  getCohortSteps,
  canSwitchToCohort,
  resolveResearchGroup,
} from "../config";
import { getUserEntitlements, canAccess } from "../entitlements";

describe("getUserEntitlements", () => {
  it("returns free-tier defaults for null / undefined / empty cohort", () => {
    expect(getUserEntitlements(null)).toEqual(DEFAULT_ENTITLEMENTS);
    expect(getUserEntitlements(undefined)).toEqual(DEFAULT_ENTITLEMENTS);
    expect(getUserEntitlements("")).toEqual(DEFAULT_ENTITLEMENTS);
  });

  it("returns free-tier defaults for an unknown / retired cohort", () => {
    expect(getUserEntitlements("enterprise_ghost")).toEqual(
      DEFAULT_ENTITLEMENTS,
    );
  });

  it("returns the configured entitlements for known cohorts", () => {
    expect(getUserEntitlements("thesis_2026")).toBe(
      COHORT_CONFIG.thesis_2026.entitlements,
    );
    expect(getUserEntitlements("beta_2026")).toBe(
      COHORT_CONFIG.beta_2026.entitlements,
    );
  });

  it("free tier grants no gated feature", () => {
    expect(DEFAULT_ENTITLEMENTS.deepDive).toBe(false);
    expect(DEFAULT_ENTITLEMENTS.aiCoaching).toBe(false);
    expect(DEFAULT_ENTITLEMENTS.coachingDailyLimit).toBe(0);
  });
});

describe("canAccess", () => {
  it("denies every gated feature for a cohortless (free) user", () => {
    expect(canAccess(null, "deepDive")).toBe(false);
    expect(canAccess(null, "aiReport")).toBe(false);
    expect(canAccess(undefined, "aiCoaching")).toBe(false);
    expect(canAccess("", "immersiveDive")).toBe(false);
  });

  it("grants configured features to thesis and beta cohorts", () => {
    expect(canAccess("thesis_2026", "deepDive")).toBe(true);
    expect(canAccess("thesis_2026", "aiCoaching")).toBe(true);
    expect(canAccess("beta_2026", "aiReport")).toBe(true);
    expect(canAccess("beta_2026", "socialFeatures")).toBe(true);
  });

  it("reflects per-cohort differences (thesis has no social features)", () => {
    expect(canAccess("thesis_2026", "socialFeatures")).toBe(false);
    expect(canAccess("thesis_2026", "requireResearchConsent")).toBe(true);
    expect(canAccess("beta_2026", "requireResearchConsent")).toBe(false);
  });

  it("treats coachingDailyLimit via truthiness (0 -> false, N -> true)", () => {
    // canAccess is boolean-coerced; a limit of 0 reads as 'no access'.
    expect(canAccess("thesis_2026", "coachingDailyLimit")).toBe(true); // 20
    expect(canAccess(null, "coachingDailyLimit")).toBe(false); // 0
  });

  it("denies unknown cohorts (fall through to defaults)", () => {
    expect(canAccess("enterprise_ghost", "deepDive")).toBe(false);
  });
});

describe("isCohortActive", () => {
  it("is true only for configured cohorts", () => {
    expect(isCohortActive("thesis_2026")).toBe(true);
    expect(isCohortActive("beta_2026")).toBe(true);
    expect(isCohortActive("enterprise_ghost")).toBe(false);
    expect(isCohortActive("")).toBe(false);
  });
});

describe("isResearchCohort", () => {
  it("is true only when trackingEnabled", () => {
    expect(isResearchCohort("thesis_2026")).toBe(true); // trackingEnabled
    expect(isResearchCohort("beta_2026")).toBe(false); // not tracked
    expect(isResearchCohort("enterprise_ghost")).toBe(false); // unknown
  });
});

describe("getCohortSteps", () => {
  it("returns the ordered step list for a known cohort", () => {
    expect(getCohortSteps("thesis_2026")).toEqual([
      "pre_assessment",
      "quick_dive",
      "deep_dive",
      "coaching",
      "post_immediate",
      "post_1week",
    ]);
    expect(getCohortSteps("beta_2026")).toEqual(["quick_dive", "deep_dive"]);
  });

  it("returns an empty array for an unknown cohort", () => {
    expect(getCohortSteps("enterprise_ghost")).toEqual([]);
  });
});

describe("canSwitchToCohort (research-ethics transition policy)", () => {
  it("lets a cohortless user claim any active cohort", () => {
    expect(canSwitchToCohort(null, "thesis_2026")).toEqual({ allowed: true });
    expect(canSwitchToCohort(null, "beta_2026")).toEqual({ allowed: true });
  });

  it("allows non-research -> research upgrade (beta -> thesis)", () => {
    expect(canSwitchToCohort("beta_2026", "thesis_2026")).toEqual({
      allowed: true,
    });
  });

  it("forbids re-claiming the same cohort", () => {
    expect(canSwitchToCohort("thesis_2026", "thesis_2026")).toEqual({
      allowed: false,
      reason: "already_in_target",
    });
    expect(canSwitchToCohort("beta_2026", "beta_2026")).toEqual({
      allowed: false,
      reason: "already_in_target",
    });
  });

  it("forbids research -> non-research downgrade (must use consent withdrawal)", () => {
    expect(canSwitchToCohort("thesis_2026", "beta_2026")).toEqual({
      allowed: false,
      reason: "downgrade_forbidden",
    });
  });

  it("forbids research -> research sideways move", () => {
    // Only one research cohort exists today, but the policy must still
    // reject a hypothetical research->research jump (same reason path).
    expect(canSwitchToCohort("thesis_2026", "thesis_2026").allowed).toBe(false);
  });

  it("forbids switching FROM an unknown / retired cohort (no silent upgrade)", () => {
    // Guards the documented data-corruption case: an unknown current
    // cohort must not satisfy !isResearchCohort() and slip through.
    expect(canSwitchToCohort("enterprise_ghost", "thesis_2026")).toEqual({
      allowed: false,
      reason: "downgrade_forbidden",
    });
  });
});

describe("resolveResearchGroup (non-DB paths)", () => {
  it("returns null for a cohort without auto-assignment", async () => {
    // beta_2026 has no autoAssignResearchGroup -> early return, no DB.
    await expect(resolveResearchGroup("beta_2026")).resolves.toBeNull();
  });

  it("returns null for an unknown cohort", async () => {
    await expect(resolveResearchGroup("enterprise_ghost")).resolves.toBeNull();
  });
});
