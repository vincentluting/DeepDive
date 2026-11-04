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

import { createCoachingActionForActivePlan } from "../action-hub";

beforeEach(() => {
  vi.clearAllMocks();
  sqlMock.mockResolvedValue([]);
});

describe("Action Hub coaching loop", () => {
  it("creates a coaching follow-up item on the user's active plan", async () => {
    sqlMock
      .mockResolvedValueOnce([
        {
          id: "plan-1",
          userId: "user-1",
          reportId: "report-1",
          status: "active",
          contextJson: {},
          locale: "zh",
          createdAt: new Date("2026-06-01T00:00:00Z"),
          updatedAt: new Date("2026-06-01T00:00:00Z"),
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await createCoachingActionForActivePlan({
      userId: "user-1",
      title: "写下第一条开口消息",
      description: "把约人聊聊缩小成一条 3 句话消息草稿。",
      category: "reflect",
      intensity: "active",
      estimatedMinutes: 20,
      dueDate: "2026-06-17",
    });

    expect(result.created).toBe(true);
    expect(sqlMock).toHaveBeenCalledTimes(2);
    expect(String(sqlMock.mock.calls[1][0])).toContain('"ActionItem"');
  });

  it("does not create an item when the user has no active plan", async () => {
    sqlMock.mockResolvedValueOnce([]);

    const result = await createCoachingActionForActivePlan({
      userId: "user-1",
      title: "写下第一条开口消息",
      description: "把约人聊聊缩小成一条 3 句话消息草稿。",
      category: "reflect",
      intensity: "active",
      estimatedMinutes: 20,
      dueDate: "2026-06-17",
    });

    expect(result.created).toBe(false);
    if (result.created) {
      throw new Error("Expected no active plan result");
    }
    expect(result.reason).toBe("no_active_plan");
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });
});
