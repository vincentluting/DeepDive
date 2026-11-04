import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCallLLMStructured, mockGetEmbedding, mockIsAvailable, mockSave } =
  vi.hoisted(() => ({
    mockCallLLMStructured: vi.fn(),
    mockGetEmbedding: vi.fn(),
    mockIsAvailable: vi.fn(),
    mockSave: vi.fn(),
  }));

vi.mock("@/lib/ai/structured-output", () => ({
  callLLMStructured: (...args: unknown[]) => mockCallLLMStructured(...args),
}));
vi.mock("@/lib/ai/embeddings", () => ({
  isEmbeddingAvailable: () => mockIsAvailable(),
  getEmbedding: (t: string) => mockGetEmbedding(t),
}));
vi.mock("@/lib/db/coaching-session-summary", () => ({
  saveSessionSummary: (...args: unknown[]) => mockSave(...args),
}));

import { summarizeAndStoreSession } from "../session-summary";

const PARSED = {
  summary: "Discussed switching from management toward IC technical work.",
  keyDecisions: ["lean IC"],
  openLoops: ["visa timing"],
  emotionalArc: "from stuck to clearer",
};

function convo(userTurns: number) {
  const msgs: { role: string; content: string }[] = [];
  for (let i = 0; i < userTurns; i++) {
    msgs.push({ role: "user", content: `u${i}` });
    msgs.push({ role: "assistant", content: `a${i}` });
  }
  return msgs;
}

beforeEach(() => {
  mockCallLLMStructured.mockReset();
  mockGetEmbedding.mockReset();
  mockIsAvailable.mockReset();
  mockSave.mockReset();
  mockCallLLMStructured.mockResolvedValue(PARSED);
  mockGetEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
  mockIsAvailable.mockReturnValue(true);
  mockSave.mockResolvedValue(undefined);
});

describe("summarizeAndStoreSession", () => {
  it("skips conversations too short to summarize", async () => {
    await summarizeAndStoreSession("u1", "s1", convo(1), "en");
    expect(mockCallLLMStructured).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("generates, embeds, and stores a summary for a real conversation", async () => {
    await summarizeAndStoreSession("u1", "s1", convo(4), "en");
    expect(mockCallLLMStructured).toHaveBeenCalledOnce();
    expect(mockGetEmbedding).toHaveBeenCalledWith(PARSED.summary);
    expect(mockSave).toHaveBeenCalledOnce();
    const saved = mockSave.mock.calls[0][0];
    expect(saved).toMatchObject({
      userId: "u1",
      sessionId: "s1",
      summary: PARSED.summary,
      openLoops: ["visa timing"],
      embedding: [0.1, 0.2, 0.3],
    });
  });

  it("is fail-soft: an LLM error does not throw and does not store", async () => {
    mockCallLLMStructured.mockRejectedValue(new Error("llm down"));
    await expect(
      summarizeAndStoreSession("u1", "s1", convo(4), "en"),
    ).resolves.toBeUndefined();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("stores with NULL embedding when embedding generation fails", async () => {
    mockGetEmbedding.mockRejectedValue(new Error("embed down"));
    await summarizeAndStoreSession("u1", "s1", convo(4), "en");
    expect(mockSave).toHaveBeenCalledOnce();
    expect(mockSave.mock.calls[0][0].embedding).toBeNull();
  });

  it("stores with NULL embedding when embeddings are unavailable", async () => {
    mockIsAvailable.mockReturnValue(false);
    await summarizeAndStoreSession("u1", "s1", convo(4), "en");
    expect(mockGetEmbedding).not.toHaveBeenCalled();
    expect(mockSave.mock.calls[0][0].embedding).toBeNull();
  });
});
