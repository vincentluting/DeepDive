// ============================================================
// Tests for the 3-phase milestone builder — pure logic that distributes
// ranked actions into This Week / This Month / This Quarter milestones
// (rendered as the action-plan timeline). Key invariants: phases are
// disjoint, capped, ordered, and empty phases are dropped.
// ============================================================

import { describe, it, expect } from "vitest";
import { buildMilestones } from "../milestone-builder";
import type { RankedAction } from "../priority-ranker";

// buildMilestones only reads `.intensity`; build minimal shapes for the test.
const mk = (intensity: string, id = intensity): RankedAction =>
  ({ id, intensity }) as unknown as RankedAction;

describe("buildMilestones", () => {
  it("returns no milestones for an empty action list", () => {
    expect(buildMilestones([], "en")).toEqual([]);
  });

  it("orders phases 1→3 with the documented target days", () => {
    const actions = [
      mk("passive", "a"),
      mk("active", "b"),
      mk("social", "c"),
      mk("creative", "d"),
      mk("active", "e"),
      mk("passive", "f"),
      mk("social", "g"),
      mk("creative", "h"),
    ];
    const ms = buildMilestones(actions, "en");
    expect(ms.map((m) => m.phase)).toEqual([1, 2, 3]);
    expect(ms.map((m) => m.targetDay)).toEqual([7, 30, 90]);
  });

  it("never assigns the same action index to two phases", () => {
    const actions = Array.from({ length: 12 }, (_, i) =>
      mk(["passive", "active", "social", "creative"][i % 4], `a${i}`),
    );
    const ms = buildMilestones(actions, "en");
    const all = ms.flatMap((m) => m.actionIndices);
    expect(new Set(all).size).toBe(all.length); // no duplicates across phases
  });

  it("respects per-phase caps (phase1≤3, phase2≤4, phase3≤3)", () => {
    const actions = Array.from({ length: 20 }, (_, i) =>
      mk(["passive", "active", "social", "creative"][i % 4], `a${i}`),
    );
    const ms = buildMilestones(actions, "en");
    const byPhase = Object.fromEntries(
      ms.map((m) => [m.phase, m.actionIndices.length]),
    );
    expect(byPhase[1] ?? 0).toBeLessThanOrEqual(3);
    expect(byPhase[2] ?? 0).toBeLessThanOrEqual(4);
    expect(byPhase[3] ?? 0).toBeLessThanOrEqual(3);
  });

  it("drops empty phases instead of emitting an empty milestone", () => {
    // single passive action → only phase 1 should appear
    const ms = buildMilestones([mk("passive")], "en");
    expect(ms).toHaveLength(1);
    expect(ms[0].phase).toBe(1);
    expect(ms[0].actionIndices).toEqual([0]);
  });

  it("carries localized titles for each emitted phase", () => {
    const ms = buildMilestones(
      [mk("passive"), mk("active"), mk("social")],
      "en",
    );
    for (const m of ms) {
      expect(m.title_en.length).toBeGreaterThan(0);
      expect(m.title_zh.length).toBeGreaterThan(0);
      expect(m.title_nl.length).toBeGreaterThan(0);
    }
  });
});
