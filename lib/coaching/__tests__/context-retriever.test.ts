import { describe, expect, it } from "vitest";
import {
  buildCoachingContextEvidencePacket,
  buildCoachingEvidencePacketSection,
} from "../context-retriever";

describe("CoachingContextRetriever", () => {
  it("returns the fixed evidence packet shape with source and reason", () => {
    const packet = buildCoachingContextEvidencePacket({
      latestUserMessage: "这个 offer 会不会让我选错方向？",
      reportSignals: ["职业报告显示：适合研究与策略结合的方向"],
      profileNarratives: ["identitySummary: 会先看清地图再行动"],
      realityConstraints: ["签证还有 6 个月，需要稳定收入"],
      exerciseSignals: ["non-negotiable: 自主性"],
      actionHubSignals: ["pending: 约一位行业前辈聊 20 分钟"],
      recentSessionSummaries: ["上次讨论过 offer 焦虑"],
      hypotheses: [
        {
          id: "h1",
          hypothesis: "用户在现实选择前会先担心选错方向",
          evidence: ["offer"],
          counterEvidence: [],
          confidence: 0.8,
          status: "active",
          lastValidatedAt: null,
        },
        {
          id: "h2",
          hypothesis: "用户已确认自主性是长期职业模式",
          evidence: ["不能接受被微管理"],
          counterEvidence: [],
          confidence: 0.9,
          status: "confirmed",
          lastValidatedAt: "2026-06-01T00:00:00Z",
        },
      ],
    });

    expect(Object.keys(packet)).toEqual([
      "currentTurnEvidence",
      "relevantReportSignals",
      "confirmedUserPatterns",
      "openHypotheses",
      "actionHubSignals",
      "realityConstraints",
    ]);
    const allItems = Object.values(packet).flat();
    expect(allItems.length).toBeGreaterThan(0);
    // 14 = the evidence packet cap raised from 8 (see context-retriever.ts);
    // this fixture's 9 signals now all fit instead of being truncated.
    expect(allItems.length).toBeLessThanOrEqual(14);
    expect(allItems.every((item) => item.source && item.reason)).toBe(true);
    expect(packet.confirmedUserPatterns[0].text).toContain("自主性");
    expect(packet.openHypotheses[0].text).toContain("担心选错方向");
  });

  it("renders a compact prompt section instead of dumping raw context", () => {
    const packet = buildCoachingContextEvidencePacket({
      latestUserMessage: "我没做上次行动，因为不知道怎么开口。",
      actionHubSignals: ["overdue: 给 mentor 发第一条消息"],
      realityConstraints: ["家庭希望尽快稳定"],
    });

    const section = buildCoachingEvidencePacketSection(packet, "zh");

    expect(section).toContain("可用证据包");
    expect(section).toContain("source=");
    expect(section).toContain("reason=");
    expect(section).toContain("给 mentor 发第一条消息");
  });
});
