import { beforeEach, describe, expect, it, vi } from "vitest";

const { sqlMock } = vi.hoisted(() => ({
  sqlMock: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/db/connection", () => ({
  sql: new Proxy(sqlMock, {
    apply(target, _thisArg, args) {
      return target(...args);
    },
  }),
}));

import { createActionItem } from "../action-hub";

beforeEach(() => {
  vi.clearAllMocks();
  sqlMock.mockResolvedValue([]);
});

describe("Action Hub guidance persistence", () => {
  it("persists phase, recommendation reason, and completion outcome on action items", async () => {
    await createActionItem({
      id: "item-1",
      planId: "plan-1",
      userId: "user-1",
      title: "Start with one interview",
      description: "Ask one person about the role.",
      category: "network",
      intensity: "social",
      priority: 91,
      estimatedMinutes: 20,
      sourceDimension: "panel3_week1",
      planPhase: 1,
      recommendationReason:
        "This tests the direction through a real conversation.",
      completionOutcome:
        "You will get outside feedback instead of guessing alone.",
    });

    expect(sqlMock).toHaveBeenCalledOnce();
    const sqlText = String(sqlMock.mock.calls[0][0]);
    expect(sqlText).toContain('"planPhase"');
    expect(sqlText).toContain('"recommendationReason"');
    expect(sqlText).toContain('"completionOutcome"');
  });
});
