import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetEmbedding, mockIsAvailable, mockSql } = vi.hoisted(() => ({
  mockGetEmbedding: vi.fn(),
  mockIsAvailable: vi.fn(),
  mockSql: vi.fn(),
}));

vi.mock("@/lib/ai/embeddings", () => ({
  isEmbeddingAvailable: () => mockIsAvailable(),
  getEmbedding: (t: string) => mockGetEmbedding(t),
  toVectorLiteral: (v: number[]) => `[${v.join(",")}]`,
}));

vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

import { retrieveMemoriesHybrid } from "../semantic-memory";
import type { UserMemory } from "@/lib/types/memory";
import type { CoachingTurnState } from "../turn-state";

function mem(id: string, overrides: Partial<UserMemory> = {}): UserMemory {
  return {
    id,
    userId: "u1",
    category: "personality",
    keyword: id,
    insight: `insight ${id}`,
    source: "coaching",
    confidence: 0.7,
    isActive: true,
    metadata: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function turnState(): CoachingTurnState {
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
  };
}

const candidates = Array.from({ length: 10 }, (_, i) => mem(`m${i}`));

beforeEach(() => {
  mockGetEmbedding.mockReset();
  mockIsAvailable.mockReset();
  mockIsAvailable.mockReturnValue(true);
  mockSql.mockReset();
  delete process.env.LLM_SEMANTIC_MEMORY_DISABLED;
});

describe("retrieveMemoriesHybrid — fail-soft fallbacks", () => {
  it("returns null when embeddings are unavailable", async () => {
    mockIsAvailable.mockReturnValue(false);
    expect(
      await retrieveMemoriesHybrid("u1", candidates, turnState(), "hi", 5),
    ).toBeNull();
  });

  it("returns null when the kill switch is set", async () => {
    process.env.LLM_SEMANTIC_MEMORY_DISABLED = "1";
    expect(
      await retrieveMemoriesHybrid("u1", candidates, turnState(), "hi", 5),
    ).toBeNull();
  });

  it("returns null when the pool already fits the limit", async () => {
    expect(
      await retrieveMemoriesHybrid(
        "u1",
        candidates.slice(0, 3),
        turnState(),
        "hi",
        5,
      ),
    ).toBeNull();
  });

  it("returns null when embedding generation fails", async () => {
    mockGetEmbedding.mockRejectedValue(new Error("api down"));
    expect(
      await retrieveMemoriesHybrid("u1", candidates, turnState(), "hi", 5),
    ).toBeNull();
  });

  it("returns null when no rows are embedded yet (pre-backfill)", async () => {
    mockGetEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    mockSql.mockResolvedValue([]);
    expect(
      await retrieveMemoriesHybrid("u1", candidates, turnState(), "hi", 5),
    ).toBeNull();
  });
});

describe("retrieveMemoriesHybrid — RRF fusion", () => {
  it("surfaces semantically nearest memories even when keyword overlap is zero", async () => {
    mockGetEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    // Cosine says m9/m8/m7 are nearest; the query "hi" has no keyword overlap
    // with any candidate, so without semantic recall m9 (keyword rank 9) would
    // never surface in the top 5.
    mockSql.mockResolvedValue([{ id: "m9" }, { id: "m8" }, { id: "m7" }]);

    const result = await retrieveMemoriesHybrid(
      "u1",
      candidates,
      turnState(),
      "hi",
      5,
    );

    expect(result).not.toBeNull();
    expect(result).toHaveLength(5);
    const ids = result!.map((m) => m.id);
    expect(ids).toContain("m9");
    expect(ids).toContain("m8");
    expect(ids).toContain("m7");
  });

  it("ranks a memory strong in BOTH signals above one strong in only one", async () => {
    mockGetEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    // Make m5 both keyword-relevant AND semantically nearest.
    const pool = [
      ...candidates.slice(0, 5),
      mem("m5", { keyword: "alpha", insight: "alpha topic" }),
      ...candidates.slice(6),
    ];
    mockSql.mockResolvedValue([{ id: "m5" }, { id: "m0" }, { id: "m1" }]);

    const result = await retrieveMemoriesHybrid(
      "u1",
      pool,
      turnState(),
      "alpha",
      5,
    );

    expect(result).not.toBeNull();
    // m5: top semantic (rank 0) + only keyword match → highest fused score.
    expect(result![0].id).toBe("m5");
  });
});
