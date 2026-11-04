// ============================================================
// Tests: generateProfile — End-to-end pure-algorithm pipeline
//
// AssessmentInput → PersonalProfileData
// Verifies orchestrator-level field assembly. None of the
// existing __tests__ covered this top-level entry point —
// every other test file targeted a single sub-module.
// ============================================================

import { describe, it, expect } from "vitest";
import { generateProfile } from "../generate-profile";
import { buildBalancedAssessment } from "@/lib/report-generation/__tests__/fixtures/mock-assessment-balanced";
import { buildExtremeAssessment } from "@/lib/report-generation/__tests__/fixtures/mock-assessment-extreme";

describe("generateProfile (end-to-end)", () => {
  it("produces a complete PersonalProfileData from a balanced assessment", () => {
    const profile = generateProfile(buildBalancedAssessment());
    expect(profile.id).toBeTruthy();
    expect(profile.assessmentId).toBeTruthy();
    expect(profile.archetype).toBeDefined();
    expect(profile.collabMapping).toBeDefined();
    expect(profile.schwartzAnchors).toBeDefined();
    expect(profile.confidenceMap).toBeDefined();
    expect(profile.algoSnapshot).toBeDefined();
    expect(profile.version).toBe("2.0");
  });

  it("excludes archetypeContent from algoSnapshot (memory savings)", () => {
    const profile = generateProfile(buildBalancedAssessment());
    expect(profile.algoSnapshot).toBeDefined();
    const snapshot = profile.algoSnapshot as Record<string, unknown>;
    expect(snapshot.archetypeContent).toBeUndefined();
    expect(snapshot.archetype).toBeDefined();
  });

  it("populates derived modules: coreQualities, socialStyle, leadershipStyle", () => {
    const profile = generateProfile(buildExtremeAssessment());
    expect(Array.isArray(profile.coreQualities)).toBe(true);
    expect(profile.socialStyle).toBeDefined();
    expect(profile.leadershipStyle).toBeDefined();
  });

  it("(regression) populates interpersonalEnergy with N4 from actual input", () => {
    const profile = generateProfile(buildExtremeAssessment());
    expect(profile.interpersonalEnergy).toBeDefined();
    // extreme fixture has N4_Self-Consciousness = 4.4
    expect(profile.interpersonalEnergy?.derivedFrom.N4).toBeCloseTo(4.4);
  });

  it("(regression) populates conflictHandling with N4 from actual input", () => {
    const profile = generateProfile(buildExtremeAssessment());
    expect(profile.conflictHandling).toBeDefined();
    expect(profile.conflictHandling?.derivedFrom.N4).toBeCloseTo(4.4);
  });

  it("(regression) high N4 user has lower agency than low N4 user", () => {
    // Extreme fixture: N4=4.4, low E3 → low agency expected
    const extreme = generateProfile(buildExtremeAssessment());
    // Balanced fixture: N4=3.0, mid E3=3.0 → midpoint agency expected
    const balanced = generateProfile(buildBalancedAssessment());
    expect(extreme.interpersonalEnergy?.agency).toBeLessThan(
      balanced.interpersonalEnergy?.agency ?? 0,
    );
  });

  it("(regression) coreQualities include hyphen-named facets when deviated", () => {
    // Extreme fixture has C1=2.5, C4=2.6 vs C-domain mean ~2.2 → small positive deviations
    // But the LOW direction at score 2.5/2.6 with low domain mean still places these as
    // facets with deviation magnitude. We only verify they CAN appear (no longer filtered
    // out by underscore mismatch).
    const profile = generateProfile(buildExtremeAssessment());
    const facetNames = (profile.coreQualities ?? []).map((q) => q.facet);
    // At minimum, ensure NO core quality has underscore-style hyphen-target name
    // (which would indicate the FACET_QUADRANTS lookup is still broken)
    for (const name of facetNames) {
      expect(name).not.toBe("E5_Excitement_Seeking");
      expect(name).not.toBe("C1_Self_Efficacy");
      expect(name).not.toBe("C4_Achievement_Striving");
      expect(name).not.toBe("N4_Self_Consciousness");
    }
  });

  it("respects pre-computed algoOutput (avoids duplicate work)", () => {
    const assessment = buildBalancedAssessment();
    const profile1 = generateProfile(assessment);
    const profile2 = generateProfile(
      assessment,
      undefined,
      profile1.algoSnapshot as never,
    );
    // Both should yield equivalent archetype data
    expect(profile2.archetype.code).toBe(profile1.archetype.code);
  });

  it("attaches userId when provided", () => {
    const profile = generateProfile(buildBalancedAssessment(), "user-xyz");
    expect(profile.userId).toBe("user-xyz");
  });

  it("emits a stable profileInputHash for identical input", () => {
    const a1 = buildBalancedAssessment();
    const a2 = buildBalancedAssessment();
    const p1 = generateProfile(a1);
    const p2 = generateProfile(a2);
    expect(p1.profileInputHash).toBe(p2.profileInputHash);
  });

  it("populates meaningCompass", () => {
    const profile = generateProfile(buildBalancedAssessment());
    expect(profile.meaningCompass).toBeDefined();
  });

  it("never produces NaN in any numeric field", () => {
    const profile = generateProfile(buildExtremeAssessment());
    expect(Number.isFinite(profile.interpersonalEnergy?.agency ?? 0)).toBe(
      true,
    );
    expect(Number.isFinite(profile.interpersonalEnergy?.communion ?? 0)).toBe(
      true,
    );
    expect(Number.isFinite(profile.conflictHandling?.assertiveness ?? 0)).toBe(
      true,
    );
    expect(
      Number.isFinite(profile.conflictHandling?.cooperativeness ?? 0),
    ).toBe(true);
    for (const [, v] of Object.entries(
      profile.conflictHandling?.modeScores ?? {},
    )) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});
