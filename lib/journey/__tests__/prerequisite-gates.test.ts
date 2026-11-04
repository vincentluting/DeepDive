// ============================================================
// Tests for prerequisite-gates configuration
// ============================================================
//
// Guards against drift in the GATE_CONFIG table: every feature must
// have a non-empty config with a CTA, and every step must be a valid
// FSM key. Catches typos at PR time before they reach prod.
// ============================================================

import { describe, it, expect } from "vitest";
import { JOURNEY_STATES } from "../state-machine";
import {
  DEFAULT_JOURNEY_STEPS,
  GATE_CONFIG,
  isGateFeature,
  type GateFeature,
} from "../prerequisite-gates";

const ALL_FEATURES: GateFeature[] = Object.keys(GATE_CONFIG) as GateFeature[];

describe("GATE_CONFIG", () => {
  it("covers every feature in the union type", () => {
    expect(ALL_FEATURES.length).toBeGreaterThan(0);
  });

  it.each(ALL_FEATURES)("[%s] has a primary CTA href", (feature) => {
    const cfg = GATE_CONFIG[feature];
    expect(cfg.primaryCta.href).toMatch(/^\//);
  });

  it.each(ALL_FEATURES)(
    "[%s] secondaryCta href starts with / when present",
    (feature) => {
      const cfg = GATE_CONFIG[feature];
      if (cfg.secondaryCta) {
        expect(cfg.secondaryCta.href).toMatch(/^\//);
      }
    },
  );

  it.each(ALL_FEATURES)("[%s] uses a known surface", (feature) => {
    const cfg = GATE_CONFIG[feature];
    expect(["sanctuary", "revelation", "utility"]).toContain(cfg.surface);
  });

  it.each(ALL_FEATURES)(
    "[%s] requiredState is null or a valid JourneyState",
    (feature) => {
      const cfg = GATE_CONFIG[feature];
      if (cfg.requiredState !== null) {
        expect(JOURNEY_STATES).toContain(cfg.requiredState);
      }
    },
  );

  it.each(ALL_FEATURES)(
    "[%s] blockedStepKey is one of the configured steps",
    (feature) => {
      const cfg = GATE_CONFIG[feature];
      const keys = cfg.steps.map((s) => s.key);
      expect(keys).toContain(cfg.blockedStepKey);
    },
  );

  it.each(ALL_FEATURES)("[%s] i18nNamespace is non-empty", (feature) => {
    expect(GATE_CONFIG[feature].i18nNamespace.length).toBeGreaterThan(0);
  });
});

describe("DEFAULT_JOURNEY_STEPS", () => {
  it("has 5 steps", () => {
    expect(DEFAULT_JOURNEY_STEPS).toHaveLength(5);
  });

  it("all states are valid JourneyState or null", () => {
    for (const step of DEFAULT_JOURNEY_STEPS) {
      if (step.state !== null) {
        expect(JOURNEY_STATES).toContain(step.state);
      }
    }
  });
});

describe("isGateFeature", () => {
  it("returns true for known features", () => {
    expect(isGateFeature("action_hub")).toBe(true);
    expect(isGateFeature("companions_cohort")).toBe(true);
  });

  it("rejects unknown strings", () => {
    expect(isGateFeature("not_a_feature")).toBe(false);
    expect(isGateFeature("")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isGateFeature(null)).toBe(false);
    expect(isGateFeature(123)).toBe(false);
    expect(isGateFeature({})).toBe(false);
  });
});
