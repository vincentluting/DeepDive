import { describe, expect, it } from "vitest";
import { evaluateCoachingTurn } from "@/lib/coaching/turn-eval";
import type { CoachingTurnState } from "@/lib/coaching/turn-state";

const baseState: CoachingTurnState = {
  currentPhase: "pattern_surfacing",
  knownFacts: ["我感觉卡住了，也担心转行之后要从零开始。"],
  emotionalSignals: ["stuck"],
  coreConcern: "career transition uncertainty",
  confirmedPatterns: [],
  unconfirmedHypotheses: ["The user may need the hidden tension named before action planning."],
  lastCoachQuestion: "What feels hardest?",
  userAnsweredLastQuestion: true,
  nextBestMove: "Reflect one pattern using the user's own words, then ask what it connects to.",
  evidenceQuote: "我感觉卡住了，也担心转行之后要从零开始。",
};

describe("evaluateCoachingTurn", () => {
  it("passes a grounded reply with a bridge and one question", () => {
    const result = evaluateCoachingTurn({
      userMessage: baseState.evidenceQuote,
      turnState: baseState,
      assistantMessage:
        "你说“我感觉卡住了”，我听到的不只是犹豫，而是你在担心转行会不会把过去积累清零。这就把问题从“要不要换方向”连接到了“哪些积累还能被带走”。如果只看你已经拥有的经验，哪一部分最不想被浪费？",
    });

    expect(result.transitionScore).toBe(5);
    expect(result.evidenceGroundingScore).toBe(5);
    expect(result.oneQuestionCompliance).toBe(true);
    expect(result.prematureAdviceFlag).toBe(false);
  });

  it("flags generic summary followed by premature advice", () => {
    const result = evaluateCoachingTurn({
      userMessage: baseState.evidenceQuote,
      turnState: baseState,
      assistantMessage:
        "我理解你的感受。你可以试试先做一个行动计划，下一步去问三个人。",
    });

    expect(result.genericSummaryFlag).toBe(true);
    expect(result.prematureAdviceFlag).toBe(true);
    expect(result.reasons).toContain("missing-transition-bridge");
  });
});
