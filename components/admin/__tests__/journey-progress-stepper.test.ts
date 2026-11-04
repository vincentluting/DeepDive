// ============================================================
// JourneyProgressStepper — pure funnel-logic regression tests
//
// The repo deliberately has no DOM test harness (no jsdom /
// @testing-library), so the *rendering* is verified visually via /preview.
// Here we lock down the exported pure logic the roster relies on:
// step ordering (drives summary "reached" counts + stage filter) and the
// localized label fallback.
// ============================================================

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/i18n/get-dictionary-client", () => ({
  // Empty dict → component/helper must fall back to English defaults.
  getDictionaryClient: () => ({ admin: { inviteCodes: {} } }),
}));

import {
  JOURNEY_STEP_ORDER,
  stepIndex,
  stepLabel,
} from "../journey-progress-stepper";

describe("JOURNEY_STEP_ORDER", () => {
  it("is the canonical 5-step recruitment funnel, in order", () => {
    expect(JOURNEY_STEP_ORDER).toEqual([
      "registered",
      "quickDive",
      "deepDive",
      "report",
      "coaching",
    ]);
  });
});

describe("stepIndex", () => {
  it("maps each step to its funnel position", () => {
    expect(stepIndex("registered")).toBe(0);
    expect(stepIndex("quickDive")).toBe(1);
    expect(stepIndex("deepDive")).toBe(2);
    expect(stepIndex("report")).toBe(3);
    expect(stepIndex("coaching")).toBe(4);
  });

  it("ranks later milestones above earlier ones", () => {
    expect(stepIndex("report")).toBeGreaterThan(stepIndex("quickDive"));
    expect(stepIndex("coaching")).toBeGreaterThan(stepIndex("report"));
  });

  it("falls back to 0 for an unknown step", () => {
    expect(stepIndex("bogus" as never)).toBe(0);
  });
});

describe("stepLabel", () => {
  it("returns the English fallback when the dictionary is empty", () => {
    expect(stepLabel("registered", "en")).toBe("Registered");
    expect(stepLabel("quickDive", "en")).toBe("Quick Dive");
    expect(stepLabel("deepDive", "en")).toBe("Deep Dive");
    expect(stepLabel("report", "en")).toBe("Report");
    expect(stepLabel("coaching", "en")).toBe("Coaching");
  });
});
