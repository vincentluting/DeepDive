import { describe, it, expect } from "vitest";
import { canAccess, getUserEntitlements } from "../entitlements";
import { COHORT_CONFIG, DEFAULT_ENTITLEMENTS } from "../config";

// Two-layer access gate (cohort + per-user) for the Archetype Companion
// social discovery feature. This test pins the cohort layer; the per-user
// layer (User.socialEnabled) is enforced by the API routes in M2/M3.

describe("socialFeatures entitlement gating", () => {
  describe("config defaults", () => {
    it("DEFAULT_ENTITLEMENTS hides social features for users without a cohort", () => {
      expect(DEFAULT_ENTITLEMENTS.socialFeatures).toBe(false);
    });

    it("thesis_2026 cohort is FORBIDDEN from social features (research sample protection)", () => {
      // Critical: thesis users must never be exposed to companion discovery.
      // Mixing them with self-exploration motive contaminates the v4.1 sample.
      expect(COHORT_CONFIG.thesis_2026?.entitlements.socialFeatures).toBe(
        false,
      );
    });

    it("beta_2026 cohort is allowed to opt into social features", () => {
      expect(COHORT_CONFIG.beta_2026?.entitlements.socialFeatures).toBe(true);
    });
  });

  describe("canAccess()", () => {
    it("returns false for null/undefined cohort", () => {
      expect(canAccess(null, "socialFeatures")).toBe(false);
      expect(canAccess(undefined, "socialFeatures")).toBe(false);
    });

    it("returns false for unknown cohort id", () => {
      expect(canAccess("not_a_real_cohort", "socialFeatures")).toBe(false);
    });

    it("returns false for thesis_2026 (research-protected)", () => {
      expect(canAccess("thesis_2026", "socialFeatures")).toBe(false);
    });

    it("returns true for beta_2026 (opt-in tier)", () => {
      expect(canAccess("beta_2026", "socialFeatures")).toBe(true);
    });
  });

  describe("getUserEntitlements()", () => {
    it("falls back to DEFAULT_ENTITLEMENTS when cohort is null", () => {
      const ent = getUserEntitlements(null);
      expect(ent.socialFeatures).toBe(false);
      // Sanity-check sibling fields stayed intact:
      expect(ent.deepDive).toBe(false);
      expect(ent.aiCoaching).toBe(false);
    });

    it("returns thesis entitlements with socialFeatures: false intact", () => {
      const ent = getUserEntitlements("thesis_2026");
      expect(ent.socialFeatures).toBe(false);
      // Other thesis features remain on:
      expect(ent.deepDive).toBe(true);
      expect(ent.researchSurveys).toBe(true);
    });

    it("returns beta entitlements with socialFeatures: true", () => {
      const ent = getUserEntitlements("beta_2026");
      expect(ent.socialFeatures).toBe(true);
      // Beta has no research consent requirement:
      expect(ent.requireResearchConsent).toBe(false);
    });
  });

  describe("regression — entitlements shape stays exhaustive", () => {
    // Adding a new key to CohortEntitlements without updating every cohort
    // would silently default to undefined → falsy. This test catches that.
    it("every active cohort declares socialFeatures explicitly", () => {
      for (const [cohortId, config] of Object.entries(COHORT_CONFIG)) {
        expect(
          typeof config.entitlements.socialFeatures,
          `cohort ${cohortId} missing socialFeatures`,
        ).toBe("boolean");
      }
    });
  });
});
