// ============================================================
// Test: Messages array max(100) validation
// Verifies that coachingChatSchema and coachingSummarySchema
// enforce the max(100) limit.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  coachingChatSchema,
  coachingSummarySchema,
} from "@/lib/validation/api-schemas";

function makeMessages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `message ${i + 1}`,
  }));
}

describe("coachingChatSchema — messages max(100)", () => {
  it("accepts messages array with exactly 100 items", () => {
    const result = coachingChatSchema.safeParse({
      sessionId: "session-1",
      messages: makeMessages(100),
    });
    expect(result.success).toBe(true);
  });

  it("rejects messages array with 101 items", () => {
    const result = coachingChatSchema.safeParse({
      sessionId: "session-1",
      messages: makeMessages(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts messages array with 50 items", () => {
    const result = coachingChatSchema.safeParse({
      sessionId: "session-1",
      messages: makeMessages(50),
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty messages array (default)", () => {
    const result = coachingChatSchema.safeParse({ sessionId: "session-1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.messages).toEqual([]);
    }
  });
});

describe("coachingSummarySchema — messages max(100)", () => {
  it("accepts messages array with exactly 100 items", () => {
    const result = coachingSummarySchema.safeParse({
      sessionId: "session-1",
      messages: makeMessages(100),
    });
    expect(result.success).toBe(true);
  });

  it("rejects messages array with 101 items", () => {
    const result = coachingSummarySchema.safeParse({
      sessionId: "session-1",
      messages: makeMessages(101),
    });
    expect(result.success).toBe(false);
  });

  it("requires at least 1 message", () => {
    const result = coachingSummarySchema.safeParse({
      sessionId: "session-1",
      messages: [],
    });
    expect(result.success).toBe(false);
  });
});
