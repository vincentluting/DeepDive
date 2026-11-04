import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCallLLMStructured = vi.fn();

vi.mock("@/lib/ai/structured-output", () => ({
  callLLMStructured: (...args: unknown[]) => mockCallLLMStructured(...args),
}));

import {
  buildCoachingTurnUnderstandingV2,
  CoachingTurnUnderstandingV2Schema,
} from "../turn-understanding";

describe("CoachingTurnUnderstandingV2", () => {
  beforeEach(() => {
    mockCallLLMStructured.mockReset();
  });

  it("validates the required Phase 1 JSON shape", () => {
    const parsed = CoachingTurnUnderstandingV2Schema.safeParse({
      requestType: "why_question",
      userActualQuestion: "这是怎么回事？",
      directAnswerNeeded: true,
      concreteObjects: ["AI聊天", "回复", "抽象虚化"],
      emotionalSignals: ["frustrated"],
      hiddenAssumptions: ["AI教练应该先回答我的具体问题"],
      likelyTension: "用户需要具体诊断，而不是继续被抽象共情",
      evidenceNeeded: ["用户刚刚说的抽象虚化具体指哪一类回复"],
      nextBestMove: "先解释为什么会显得抽象，再问一个具体例子",
      riskLevel: "normal",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects legacy request types so V2 does not silently accept V1", () => {
    const parsed = CoachingTurnUnderstandingV2Schema.safeParse({
      requestType: "asks_why",
      userActualQuestion: "这是怎么回事？",
      directAnswerNeeded: true,
      concreteObjects: [],
      emotionalSignals: [],
      hiddenAssumptions: [],
      likelyTension: null,
      evidenceNeeded: [],
      nextBestMove: "answer first",
      riskLevel: "normal",
    });

    expect(parsed.success).toBe(false);
  });

  it("uses an LLM structured parse for a Chinese coach-quality why question", async () => {
    mockCallLLMStructured.mockResolvedValueOnce({
      requestType: "coach_feedback",
      userActualQuestion:
        "我觉得这个AI聊天不是很能理解我，回复都很抽象虚化，这是怎么回事？",
      directAnswerNeeded: true,
      concreteObjects: ["AI聊天", "回复", "抽象虚化"],
      emotionalSignals: ["frustrated"],
      hiddenAssumptions: ["AI教练应该理解我的具体处境"],
      likelyTension: "用户需要先被解释具体失败原因，再继续教练对话",
      evidenceNeeded: ["哪一条回复让用户觉得抽象虚化"],
      nextBestMove: "先诊断抽象虚化的原因，再问一个具体失败例子",
      riskLevel: "normal",
    });

    const result = await buildCoachingTurnUnderstandingV2({
      locale: "zh",
      messages: [
        {
          role: "user",
          content:
            "我觉得这个AI聊天不是很能理解我，回复都很抽象虚化，这是怎么回事？",
        },
      ],
    });

    expect(mockCallLLMStructured).toHaveBeenCalledWith(
      "coaching-summary",
      expect.any(Array),
      CoachingTurnUnderstandingV2Schema,
      expect.objectContaining({ responseFormat: "json" }),
    );
    expect(result.requestType).toBe("coach_feedback");
    expect(result.directAnswerNeeded).toBe(true);
    expect(result.userActualQuestion).toContain("这是怎么回事");
  });

  it("falls back to the deterministic parser when JSON generation fails", async () => {
    mockCallLLMStructured.mockRejectedValueOnce(new Error("invalid json"));

    const result = await buildCoachingTurnUnderstandingV2({
      locale: "zh",
      messages: [
        {
          role: "user",
          content:
            "我觉得这个AI聊天不是很能理解我，回复都很抽象虚化，这是怎么回事？",
        },
      ],
    });

    expect(result.requestType).toBe("coach_feedback");
    expect(result.directAnswerNeeded).toBe(true);
    expect(result.concreteObjects).toEqual(
      expect.arrayContaining(["AI聊天", "回复", "抽象", "虚化"]),
    );
    expect(result.nextBestMove).toContain("product feedback");
  });
});
