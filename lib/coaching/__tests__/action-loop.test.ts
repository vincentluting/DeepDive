import { describe, expect, it } from "vitest";
import { buildSevenDayCoachingAction } from "../action-loop";

describe("coaching action loop", () => {
  it("turns a failed action review into a smaller seven-day action", () => {
    const action = buildSevenDayCoachingAction({
      locale: "zh",
      now: new Date("2026-06-10T12:00:00Z"),
      latestUserMessage: "上次说这周要约人聊聊，但我完全没做，一想到开口就拖延。",
      understandingV2: {
        requestType: "action_review",
        userActualQuestion: "为什么我没做上次行动？",
        directAnswerNeeded: true,
        concreteObjects: ["约人聊聊", "开口", "拖延"],
        emotionalSignals: ["avoidant"],
        hiddenAssumptions: ["开口会打扰别人"],
        likelyTension: "行动太大，第一步暴露了社交风险",
        evidenceNeeded: ["没做的具体阻力"],
        nextBestMove: "把行动缩小到第一条消息草稿",
        riskLevel: "normal",
      },
    });

    expect(action.title).toContain("开口");
    expect(action.description).toContain("第一条消息");
    expect(action.category).toBe("reflect");
    expect(action.estimatedMinutes).toBeLessThanOrEqual(30);
    expect(action.dueDate).toBe("2026-06-17");
  });
});
