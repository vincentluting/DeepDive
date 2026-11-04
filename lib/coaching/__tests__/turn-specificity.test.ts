import { describe, expect, it } from "vitest";
import { evaluateCoachingSpecificity } from "../turn-specificity";
import type { CoachingTurnState } from "../turn-state";
import type { CoachingTurnUnderstanding } from "../turn-understanding";

const baseTurnState: CoachingTurnState = {
  currentPhase: "discovery",
  knownFacts: [],
  emotionalSignals: [],
  coreConcern: "coach quality feedback",
  confirmedPatterns: [],
  unconfirmedHypotheses: [],
  lastCoachQuestion: null,
  userAnsweredLastQuestion: true,
  nextBestMove: "Answer the concrete concern first.",
  evidenceQuote: "AI聊天不是很能理解我，回复都很抽象虚化",
};

const baseUnderstanding: CoachingTurnUnderstanding = {
  requestType: "feedback_about_coach",
  needsDirectAnswer: true,
  specificAsk: "这是怎么回事？",
  concreteReferences: ["AI聊天", "回复", "抽象", "虚化"],
  emotionalUndertone: "frustrated",
  responseObligation:
    "Treat this as product feedback: diagnose the concrete failure.",
  clarifyIfMissing: null,
};

describe("evaluateCoachingSpecificity", () => {
  it("fails a polished but abstract reply that dodges the user request", () => {
    const result = evaluateCoachingSpecificity({
      assistantMessage:
        "这背后可能有一个模式和张力，我们可以继续探索你的方向和内在感受。你愿意从哪个角度开始？",
      turnState: baseTurnState,
      understanding: baseUnderstanding,
    });

    expect(result.pass).toBe(false);
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        "missing-concrete-anchor",
        "did-not-answer-user-request",
      ]),
    );
  });

  it("passes a reply that answers first and anchors in concrete user words", () => {
    const result = evaluateCoachingSpecificity({
      assistantMessage:
        "这是因为 AI聊天 现在只抓到了你的情绪方向，却没有把“回复抽象虚化”这个具体失败拆开：它没有先回答你在问什么，也没有引用你的原话。下一轮我会先判断你是在要解释、建议，还是要被追问。",
      turnState: baseTurnState,
      understanding: baseUnderstanding,
    });

    expect(result.pass).toBe(true);
    expect(result.answeredUserRequest).toBe(true);
    expect(result.concreteAnchorPresent).toBe(true);
  });
});
