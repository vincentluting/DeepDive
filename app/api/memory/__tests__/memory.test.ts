import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/ai/model-router", () => ({
  callLLM: vi.fn(),
}));

vi.mock("@/lib/db/memory", () => ({
  getUserMemories: vi.fn(),
  getUserMemoryCount: vi.fn(),
  saveMemories: vi.fn(),
  deactivateAllMemories: vi.fn(),
  deactivateMemory: vi.fn(),
}));

vi.mock("@/lib/db/reports", () => ({
  getLatestReportJsonByUserId: vi.fn(),
}));

vi.mock("@/lib/db/profiles", () => ({
  getProfile: vi.fn(),
}));

vi.mock("@/lib/db/assessments", () => ({
  getLatestAssessmentResultJsonByUserId: vi.fn(),
}));

vi.mock("@/lib/memory/generate-from-assessment", () => ({
  generateMemoriesFromAssessment: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { callLLM } from "@/lib/ai/model-router";
import {
  getUserMemories,
  getUserMemoryCount,
  saveMemories,
  deactivateAllMemories,
  deactivateMemory,
} from "@/lib/db/memory";
import { getLatestReportJsonByUserId } from "@/lib/db/reports";
import { getProfile } from "@/lib/db/profiles";
import { getLatestAssessmentResultJsonByUserId } from "@/lib/db/assessments";
import { generateMemoriesFromAssessment } from "@/lib/memory/generate-from-assessment";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(method: string, body?: unknown): Request {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new Request("http://localhost/api/memory", init);
}

function allowGuard(user: { id: string } = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 401) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status }),
  });
}

const mockMemories = [
  {
    id: "m1",
    category: "personality",
    keyword: "High Autonomy",
    insight: "Thrives independently",
    confidence: 0.9,
  },
  {
    id: "m2",
    category: "values",
    keyword: "Growth",
    insight: "Values personal growth",
    confidence: 0.85,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/memory ──────────────────────────────────────────
describe("GET /api/memory", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("returns user memories (happy path)", async () => {
    allowGuard({ id: "u1" });
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockMemories,
    );

    const res = await handler(makeRequest("GET"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.memories).toHaveLength(2);
    expect(json.memories[0].category).toBe("personality");
    expect(getUserMemories).toHaveBeenCalledWith("u1");
  });

  it("returns empty array when user has no memories", async () => {
    allowGuard({ id: "u1" });
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await handler(makeRequest("GET"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.memories).toEqual([]);
  });

  it("returns 500 on DB error", async () => {
    allowGuard({ id: "u1" });
    (getUserMemories as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest("GET"));
    expect(res.status).toBe(500);
  });
});

// ── DELETE /api/memory ───────────────────────────────────────
describe("DELETE /api/memory", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.DELETE as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest("DELETE", { id: "m1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when memory id is missing", async () => {
    allowGuard();
    const res = await handler(makeRequest("DELETE", {}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when memory not found", async () => {
    allowGuard({ id: "u1" });
    (deactivateMemory as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await handler(makeRequest("DELETE", { id: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("deactivates memory successfully", async () => {
    allowGuard({ id: "u1" });
    (deactivateMemory as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await handler(makeRequest("DELETE", { id: "m1" }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(deactivateMemory).toHaveBeenCalledWith("u1", "m1");
  });
});

// ── POST /api/memory — manual add ───────────────────────────
describe("POST /api/memory (manual add)", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(
      makeRequest("POST", {
        category: "values",
        keyword: "test",
        insight: "test",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid category", async () => {
    allowGuard();
    const res = await handler(
      makeRequest("POST", {
        category: "invalid_category",
        keyword: "test",
        insight: "test insight",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("saves manual memory entry (happy path)", async () => {
    allowGuard({ id: "u1" });
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([
      { category: "values", keyword: "test", insight: "test insight" },
    ]);

    const res = await handler(
      makeRequest("POST", {
        category: "values",
        keyword: "Growth Oriented",
        insight: "Deeply values personal development",
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.generated).toBe(true);
    expect(json.method).toBe("manual");
    expect(saveMemories).toHaveBeenCalledWith("u1", [
      expect.objectContaining({
        category: "values",
        keyword: "Growth Oriented",
        source: "manual",
      }),
    ]);
  });

  it("truncates keyword to 20 chars and insight to 200 chars", async () => {
    allowGuard({ id: "u1" });
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const longKeyword = "A".repeat(50);
    const longInsight = "B".repeat(500);

    await handler(
      makeRequest("POST", {
        category: "personality",
        keyword: longKeyword,
        insight: longInsight,
      }),
    );

    expect(saveMemories).toHaveBeenCalledWith("u1", [
      expect.objectContaining({
        keyword: "A".repeat(20),
        insight: "B".repeat(200),
      }),
    ]);
  });
});

// ── POST /api/memory — generate ─────────────────────────────
describe("POST /api/memory (generate)", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns existing memories when count > 0 and not force regenerating", async () => {
    allowGuard({ id: "u1" });
    (getUserMemoryCount as ReturnType<typeof vi.fn>).mockResolvedValue(5);
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockMemories,
    );

    const res = await handler(makeRequest("POST", {}));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.generated).toBe(false);
    expect(json.memories).toHaveLength(2);
    expect(callLLM).not.toHaveBeenCalled();
  });

  it("returns no_data when user has no assessment/report/profile", async () => {
    allowGuard({ id: "u1" });
    (getUserMemoryCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (getLatestReportJsonByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (
      getLatestAssessmentResultJsonByUserId as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);

    const res = await handler(makeRequest("POST", {}));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.generated).toBe(false);
    expect(json.reason).toBe("no_data");
  });

  it("generates memories via LLM (happy path)", async () => {
    allowGuard({ id: "u1" });
    (getUserMemoryCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (getLatestReportJsonByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      { language: "en" },
    );
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      archetype: { primary: "Narrator" },
    });
    (
      getLatestAssessmentResultJsonByUserId as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);
    (callLLM as ReturnType<typeof vi.fn>).mockResolvedValue(
      JSON.stringify([
        {
          category: "personality",
          keyword: "Creative",
          insight: "Highly creative thinker",
          confidence: 0.9,
          source: "report",
        },
        {
          category: "values",
          keyword: "Autonomy",
          insight: "Values independence",
          confidence: 0.85,
          source: "profile",
        },
      ]),
    );
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([
      { category: "personality", keyword: "Creative" },
      { category: "values", keyword: "Autonomy" },
    ]);

    const res = await handler(makeRequest("POST", {}));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.generated).toBe(true);
    expect(json.method).toBe("llm");
    expect(saveMemories).toHaveBeenCalledTimes(1);
    expect(callLLM).toHaveBeenCalledWith(
      "memory-extract",
      expect.any(Array),
      expect.objectContaining({ responseFormat: "json" }),
    );
  });

  it("uses report.locale for Dutch memory extraction prompts", async () => {
    allowGuard({ id: "u1" });
    (getUserMemoryCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (getLatestReportJsonByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      { locale: "nl", language: "en" },
    );
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      archetype: { primary: "Narrator" },
    });
    (
      getLatestAssessmentResultJsonByUserId as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);
    (callLLM as ReturnType<typeof vi.fn>).mockResolvedValue(
      JSON.stringify([
        {
          category: "personality",
          keyword: "Autonomie in werk",
          insight:
            "Hij zoekt meer autonomie in werk en voelt zich beter met duidelijke ruimte voor eigen keuzes",
          confidence: 0.9,
          source: "report",
        },
      ]),
    );
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([
      { category: "personality", keyword: "Autonomie in werk" },
    ]);

    const res = await handler(makeRequest("POST", {}));
    expect(res.status).toBe(200);

    const messages = (callLLM as ReturnType<typeof vi.fn>).mock.calls[0][1] as
      | Array<{ role: string; content: string }>
      | undefined;
    const systemMsg = messages?.find((m) => m.role === "system");
    expect(systemMsg?.content).toContain("Dutch");
    expect(systemMsg?.content).toContain("keyword: 2-6 word Dutch tag");
    expect(systemMsg?.content).not.toContain("2-6 word English tag");
  });

  it("falls back to deterministic when LLM fails", async () => {
    allowGuard({ id: "u1" });
    (getUserMemoryCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (getLatestReportJsonByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      { language: "en" },
    );
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      archetype: { primary: "Narrator" },
    });
    (
      getLatestAssessmentResultJsonByUserId as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);
    (callLLM as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("LLM timeout"),
    );
    (
      generateMemoriesFromAssessment as ReturnType<typeof vi.fn>
    ).mockReturnValue([
      {
        category: "personality",
        keyword: "Fallback",
        insight: "Deterministic insight",
        confidence: 0.8,
      },
    ]);
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([
      { category: "personality", keyword: "Fallback" },
    ]);

    const res = await handler(makeRequest("POST", {}));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.generated).toBe(true);
    expect(json.method).toBe("deterministic");
    expect(generateMemoriesFromAssessment).toHaveBeenCalledTimes(1);
  });

  it("deactivates old memories when forceRegenerate is true", async () => {
    allowGuard({ id: "u1" });
    (getUserMemoryCount as ReturnType<typeof vi.fn>).mockResolvedValue(5);
    (getLatestReportJsonByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      { language: "zh" },
    );
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (
      getLatestAssessmentResultJsonByUserId as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "a1" });
    (callLLM as ReturnType<typeof vi.fn>).mockResolvedValue(
      JSON.stringify([
        {
          category: "career",
          keyword: "职业转型",
          insight: "正在考虑转型",
          confidence: 0.8,
          source: "questionnaire",
        },
      ]),
    );
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (deactivateAllMemories as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await handler(makeRequest("POST", { forceRegenerate: true }));
    expect(res.status).toBe(200);

    expect(deactivateAllMemories).toHaveBeenCalledWith("u1");
    expect(saveMemories).toHaveBeenCalledTimes(1);
  });

  it("filters out invalid categories from LLM response", async () => {
    allowGuard({ id: "u1" });
    (getUserMemoryCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (getLatestReportJsonByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      { language: "en" },
    );
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (
      getLatestAssessmentResultJsonByUserId as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "a1" });
    (callLLM as ReturnType<typeof vi.fn>).mockResolvedValue(
      JSON.stringify([
        {
          category: "personality",
          keyword: "Valid",
          insight: "Valid insight",
          confidence: 0.9,
        },
        { category: "INVALID", keyword: "Bad", insight: "Should be filtered" },
        { category: "values", keyword: "", insight: "Missing keyword" },
      ]),
    );
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handler(makeRequest("POST", {}));

    // Only the valid entry should be saved
    expect(saveMemories).toHaveBeenCalledWith("u1", [
      expect.objectContaining({ category: "personality", keyword: "Valid" }),
    ]);
  });

  it("returns extraction_empty when both LLM and deterministic yield nothing", async () => {
    allowGuard({ id: "u1" });
    (getUserMemoryCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (getLatestReportJsonByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      { language: "en" },
    );
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (
      getLatestAssessmentResultJsonByUserId as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "a1" });
    (callLLM as ReturnType<typeof vi.fn>).mockResolvedValue("[]");
    (
      generateMemoriesFromAssessment as ReturnType<typeof vi.fn>
    ).mockReturnValue([]);
    (getUserMemories as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await handler(makeRequest("POST", {}));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.generated).toBe(false);
    expect(json.reason).toBe("extraction_empty");
    expect(saveMemories).not.toHaveBeenCalled();
  });
});
