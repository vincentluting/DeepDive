// ============================================================
// Tests for Action Guidance
// ============================================================

import { describe, expect, it } from "vitest";

import {
  assignPlanPhases,
  buildActionGuidance,
  getActionAlternatives,
  getRecommendedAction,
  summarizeActionProgress,
  type GuidanceTemplates,
} from "../guidance";
import type { RankedAction } from "../priority-ranker";

function makeAction(overrides: Partial<RankedAction> = {}): RankedAction {
  return {
    title: "Test action",
    description: "Test description",
    category: "explore",
    intensity: "passive",
    sourceDimension: "panel1_direction_1",
    estimatedMinutes: 15,
    priority: 50,
    matchedNonNegotiable: null,
    matchedFlowDimension: null,
    ...overrides,
  };
}

const templates: GuidanceTemplates = {
  reasonDefault: "This is the clearest next move from your current plan.",
  outcomeDefault: "Completing it gives your plan one more real signal.",
  sourcePanel3Week1:
    "This comes from the first-week path in your career report.",
  matchedFlowReason: "This matches your flow pattern: {{label}}.",
  matchedNonNegReason: "This respects your non-negotiable: {{label}}.",
  reasonByCategory: {
    explore: "This narrows a direction before you invest more energy.",
    learn: "This turns curiosity into a focused learning step.",
    network: "This tests the direction through a real conversation.",
    create: "This turns the insight into something visible.",
    apply: "This moves your positioning into the market.",
    reflect: "This clarifies what should guide your next decision.",
  },
  outcomeByCategory: {
    explore: "You will know whether this direction deserves more attention.",
    learn: "You will close one concrete knowledge gap.",
    network: "You will get outside feedback instead of guessing alone.",
    create: "You will have a small artifact to inspect or share.",
    apply: "You will move one step closer to a real opportunity.",
    reflect: "You will turn a vague signal into a clearer criterion.",
  },
};

describe("assignPlanPhases", () => {
  it("assigns phase numbers from milestone action indices", () => {
    const actions = [
      makeAction({ title: "A" }),
      makeAction({ title: "B" }),
      makeAction({ title: "C" }),
    ];

    const result = assignPlanPhases(actions, [
      { phase: 1, actionIndices: [0, 2] },
      { phase: 2, actionIndices: [1] },
    ]);

    expect(result.map((item) => item.planPhase)).toEqual([1, 2, 1]);
  });

  it("falls back to phase 3 when an item is not mapped by a milestone", () => {
    const result = assignPlanPhases([makeAction()], []);

    expect(result[0].planPhase).toBe(3);
  });
});

describe("buildActionGuidance", () => {
  it("prefers non-negotiable guidance when an item has a matched label", () => {
    const result = buildActionGuidance(
      makeAction({
        category: "apply",
        matchedNonNegotiable: "remote_work",
      }),
      templates,
      {
        nonNegotiableLabels: { remote_work: "Remote work" },
      },
    );

    expect(result.recommendationReason).toBe(
      "This respects your non-negotiable: Remote work.",
    );
    expect(result.completionOutcome).toBe(
      "You will move one step closer to a real opportunity.",
    );
  });

  it("uses source-specific guidance for report week-one tasks", () => {
    const result = buildActionGuidance(
      makeAction({
        category: "learn",
        sourceDimension: "panel3_week1",
      }),
      templates,
    );

    expect(result.recommendationReason).toBe(
      "This comes from the first-week path in your career report.",
    );
    expect(result.completionOutcome).toBe(
      "You will close one concrete knowledge gap.",
    );
  });
});

describe("action progress model", () => {
  const items = [
    { id: "done-1", status: "completed", priority: 90, planPhase: 1 },
    { id: "pending-2", status: "pending", priority: 80, planPhase: 2 },
    { id: "pending-1", status: "pending", priority: 95, planPhase: 1 },
    { id: "pending-3", status: "pending", priority: 70, planPhase: 3 },
  ];

  it("recommends the highest priority pending item in the lowest unfinished phase", () => {
    expect(getRecommendedAction(items)?.id).toBe("pending-1");
  });

  it("keeps an in-progress item as the primary recommendation", () => {
    expect(
      getRecommendedAction([
        ...items,
        { id: "active", status: "in_progress", priority: 10, planPhase: 3 },
      ])?.id,
    ).toBe("active");
  });

  it("returns alternatives after the primary action by phase then priority", () => {
    const primary = getRecommendedAction(items);

    expect(getActionAlternatives(items, primary?.id, 2).map((i) => i.id)).toEqual(
      ["pending-2", "pending-3"],
    );
  });

  it("summarizes stage and completion without using a percentage", () => {
    expect(summarizeActionProgress(items)).toEqual({
      currentPhase: 1,
      totalPhases: 3,
      completed: 1,
      total: 4,
    });
  });
});
