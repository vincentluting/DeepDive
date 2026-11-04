import { describe, it, expect } from "vitest";
import {
  selectRelevantMemories,
  selectRelevantThemes,
} from "../context-selection";
import type { UserMemory } from "@/lib/types/memory";
import type { CoachingTurnState } from "../turn-state";
import type { CoachingTheme } from "@/lib/db/coaching-themes";

function mem(
  overrides: Pick<
    UserMemory,
    "keyword" | "insight" | "category" | "confidence"
  > &
    Partial<UserMemory>,
): UserMemory {
  return {
    id: overrides.keyword,
    userId: "user-1",
    source: "coaching",
    isActive: true,
    metadata: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function turnState(
  overrides: Partial<CoachingTurnState> = {},
): CoachingTurnState {
  return {
    currentPhase: "discovery",
    knownFacts: [],
    emotionalSignals: [],
    coreConcern: null,
    confirmedPatterns: [],
    unconfirmedHypotheses: [],
    lastCoachQuestion: null,
    userAnsweredLastQuestion: true,
    nextBestMove: "",
    evidenceQuote: null,
    ...overrides,
  };
}

// Neutral memories that won't overlap any query — used to fill past the limit
// so the selector actually ranks instead of short-circuiting.
function filler(n: number, confidence = 0.7): UserMemory[] {
  return Array.from({ length: n }, (_, i) =>
    mem({
      keyword: `filler-${i}`,
      insight: `neutral background trait number ${i}`,
      category: "personality",
      confidence,
    }),
  );
}

const ids = (memories: UserMemory[]) => memories.map((m) => m.id);

describe("selectRelevantMemories", () => {
  it("returns all memories unchanged when at or under the limit", () => {
    const memories = filler(5);
    const result = selectRelevantMemories(memories, turnState(), "anything", 8);
    expect(result).toHaveLength(5);
  });

  it("does not surface a memory matching a Chinese negated concept", () => {
    // Highest confidence — would rank #1 under the old term-frequency scorer.
    const managementMemory = mem({
      keyword: "管理倾向",
      insight: "适合做管理工作，有领导团队的潜力",
      category: "career",
      confidence: 0.95,
    });
    const memories = [managementMemory, ...filler(8, 0.6)];
    const result = selectRelevantMemories(
      memories,
      turnState(),
      "我不想做管理，我更喜欢自己钻研技术",
      8,
    );
    expect(ids(result)).not.toContain("管理倾向");
  });

  it("penalizes a memory matching an English negated concept", () => {
    const mgmt = mem({
      keyword: "leadership-fit",
      insight: "well suited for management and leading teams",
      category: "career",
      confidence: 0.95,
    });
    const memories = [mgmt, ...filler(8, 0.6)];
    const result = selectRelevantMemories(
      memories,
      turnState(),
      "I don't want management anymore, I prefer hands-on technical work",
      8,
    );
    expect(ids(result)).not.toContain("leadership-fit");
  });

  it("does not let a negation bleed past a conjunction (design stays positive)", () => {
    const designMemory = mem({
      keyword: "design-pull",
      insight: "drawn to design and creative craft",
      category: "strength",
      confidence: 0.3, // low confidence — only relevance can rescue it
    });
    const memories = [...filler(10, 0.7), designMemory];
    const result = selectRelevantMemories(
      memories,
      turnState(),
      "I don't want management but I love design",
      8,
    );
    // "design" was AFTER the conjunction, so it must remain a positive match
    // and pull this low-confidence memory into the selection.
    expect(ids(result)).toContain("design-pull");
  });

  it("surfaces a low-confidence long-tail memory matched via CJK bigram", () => {
    const relevantLowConf = mem({
      keyword: "管理经验",
      insight: "过去带过小团队，有一定管理经验",
      category: "career",
      confidence: 0.4, // lowest — a confidence-only Top-N prefilter would drop it
    });
    const memories = [...filler(10, 0.7), relevantLowConf];
    const result = selectRelevantMemories(
      memories,
      turnState(),
      "我想知道怎么管理团队",
      8,
    );
    expect(ids(result)).toContain("管理经验");
  });
});

describe("selectRelevantThemes", () => {
  function theme(
    overrides: Pick<CoachingTheme, "id" | "theme"> & Partial<CoachingTheme>,
  ): CoachingTheme {
    return {
      userId: "user-1",
      context: null,
      sentiment: "neutral",
      mentionCount: 1,
      firstMentionedAt: "2026-01-01T00:00:00.000Z",
      lastMentionedAt: "2026-01-01T00:00:00.000Z",
      resolved: false,
      ...overrides,
    };
  }

  it("penalizes a negated theme even when it is frequently mentioned", () => {
    const themes = [
      theme({
        id: "t-mgmt",
        theme: "管理",
        context: "对管理的兴趣",
        mentionCount: 5,
      }),
      ...Array.from({ length: 8 }, (_, i) =>
        theme({ id: `t-${i}`, theme: `话题${i}` }),
      ),
    ];
    const result = selectRelevantThemes(themes, turnState(), "我不想做管理", 8);
    expect(result.map((t) => t.id)).not.toContain("t-mgmt");
  });
});
