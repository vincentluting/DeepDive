import { describe, expect, it } from "vitest";
import { buildCoachingTurnState } from "@/lib/coaching/turn-state";

describe("buildCoachingTurnState", () => {
  it("captures latest user evidence and emotional signals", () => {
    const state = buildCoachingTurnState([
      {
        role: "assistant",
        content: "What feels hardest about the decision?",
      },
      {
        role: "user",
        content: "我感觉卡住了，也担心转行之后要从零开始。",
      },
    ]);

    expect(state.currentPhase).toBe("discovery");
    expect(state.evidenceQuote).toContain("卡住");
    expect(state.emotionalSignals).toContain("stuck");
    expect(state.coreConcern).toBe("career transition uncertainty");
    expect(state.userAnsweredLastQuestion).toBe(true);
  });

  it("detects when the user has not answered the previous question", () => {
    const state = buildCoachingTurnState([
      {
        role: "assistant",
        content: "What trade-off feels hardest?",
      },
      {
        role: "user",
        content: "不知道，可能吧。",
      },
    ]);

    expect(state.userAnsweredLastQuestion).toBe(false);
    expect(state.nextBestMove).toContain("Reconnect");
  });
});
