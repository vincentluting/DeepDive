import { describe, expect, it } from "vitest";
import {
  buildHypothesisContextSection,
  selectRelevantHypotheses,
  type CoachingHypothesisForPrompt,
} from "../hypothesis-memory";

const hypotheses: CoachingHypothesisForPrompt[] = [
  {
    id: "h1",
    hypothesis: "用户在现实选择前会先担心选错方向",
    evidence: ["我到底该不该接这个offer？"],
    counterEvidence: [],
    confidence: 0.78,
    status: "active",
    lastValidatedAt: null,
  },
  {
    id: "h2",
    hypothesis: "用户已经确认自主性是长期职业模式",
    evidence: ["我发现我不能接受被微管理"],
    counterEvidence: [],
    confidence: 0.9,
    status: "confirmed",
    lastValidatedAt: "2026-06-01T00:00:00Z",
  },
  {
    id: "h3",
    hypothesis: "用户主要被城市限制困住",
    evidence: ["我暂时不能离开阿姆斯特丹"],
    counterEvidence: ["这次选择和城市无关"],
    confidence: 0.4,
    status: "active",
    lastValidatedAt: null,
  },
  {
    id: "h4",
    hypothesis: "用户害怕 AI 让自己的职业价值消失",
    evidence: ["AI 会不会替代我"],
    counterEvidence: [],
    confidence: 0.7,
    status: "active",
    lastValidatedAt: null,
  },
];

describe("hypothesis memory", () => {
  it("selects at most 3 relevant non-rejected hypotheses", () => {
    const selected = selectRelevantHypotheses(
      hypotheses,
      "这个 offer 会不会让我选错方向，我现在很担心",
      3,
    );

    expect(selected).toHaveLength(3);
    expect(selected[0].id).toBe("h1");
    expect(selected.map((item) => item.status)).not.toContain("rejected");
  });

  it("renders active hypotheses as tentative, not facts", () => {
    const section = buildHypothesisContextSection([hypotheses[0]], "zh");

    expect(section).toContain("试探性理解");
    expect(section).toContain("不能当作事实");
    expect(section).toContain("用户在现实选择前会先担心选错方向");
  });

  it("renders confirmed hypotheses separately as confirmed patterns", () => {
    const section = buildHypothesisContextSection([hypotheses[1]], "zh");

    expect(section).toContain("已确认模式");
    expect(section).toContain("用户已经确认自主性是长期职业模式");
    expect(section).not.toContain("试探性理解");
  });
});
