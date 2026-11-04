import { describe, it, expect } from "vitest";
import { canSwitchToCohort } from "../config";

// Policy gate for /api/claim-invite. Pins the matrix so we don't
// accidentally allow downgrades (which would silently leak research
// participants out of the study without going through the consent
// withdrawal flow).

describe("canSwitchToCohort", () => {
  it("allows first-time enrollment from null current cohort", () => {
    expect(canSwitchToCohort(null, "beta_2026")).toEqual({ allowed: true });
    expect(canSwitchToCohort(null, "thesis_2026")).toEqual({ allowed: true });
  });

  it("rejects re-claiming the same cohort with already_in_target", () => {
    expect(canSwitchToCohort("beta_2026", "beta_2026")).toEqual({
      allowed: false,
      reason: "already_in_target",
    });
    expect(canSwitchToCohort("thesis_2026", "thesis_2026")).toEqual({
      allowed: false,
      reason: "already_in_target",
    });
  });

  it("allows upgrading from beta_2026 → thesis_2026", () => {
    expect(canSwitchToCohort("beta_2026", "thesis_2026")).toEqual({
      allowed: true,
    });
  });

  it("rejects downgrade from thesis_2026 → beta_2026", () => {
    expect(canSwitchToCohort("thesis_2026", "beta_2026")).toEqual({
      allowed: false,
      reason: "downgrade_forbidden",
    });
  });

  it("rejects sideways non-research cohort moves", () => {
    // Hypothetical future enterprise cohort with trackingEnabled=false.
    // Without an explicit allow rule it should be rejected.
    expect(canSwitchToCohort("beta_2026", "unknown_cohort")).toEqual({
      allowed: false,
      reason: "downgrade_forbidden",
    });
  });

  it("allows null current → unknown new (caller validates newCohort, not helper)", () => {
    // Contract pin: canSwitchToCohort does NOT validate that newCohort is
    // active. The API route checks isCohortActive(newCohort) separately
    // before calling the helper. If that ordering ever changes, this test
    // should flip with it.
    expect(canSwitchToCohort(null, "unknown_cohort")).toEqual({
      allowed: true,
    });
  });

  it("rejects switching from an unknown / retired current cohort", () => {
    // Defends against data corruption or stale cohort FKs. A user whose
    // current cohort is not in COHORT_CONFIG must NOT silently satisfy
    // the non-research check and "upgrade" into thesis_2026 — admin
    // intervention is required instead.
    expect(canSwitchToCohort("unknown_cohort", "thesis_2026")).toEqual({
      allowed: false,
      reason: "downgrade_forbidden",
    });
    expect(canSwitchToCohort("retired_pilot", "thesis_2026")).toEqual({
      allowed: false,
      reason: "downgrade_forbidden",
    });
  });
});
