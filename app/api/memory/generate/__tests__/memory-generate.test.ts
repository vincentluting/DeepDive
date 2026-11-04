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
  ApiErrorCode: { INTERNAL_ERROR: "INTERNAL_ERROR" },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/db/memory", () => ({
  deactivateAllMemories: vi.fn(),
  saveMemories: vi.fn(),
}));

vi.mock("@/lib/db/profiles", () => ({
  getProfile: vi.fn(),
}));

vi.mock("@/lib/db/reports", () => ({
  getLatestReportJsonByUserId: vi.fn(),
}));

vi.mock("@/lib/memory/generate-from-assessment", () => ({
  generateMemoriesFromAssessment: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { deactivateAllMemories, saveMemories } from "@/lib/db/memory";
import { getProfile } from "@/lib/db/profiles";
import { getLatestReportJsonByUserId } from "@/lib/db/reports";
import { generateMemoriesFromAssessment } from "@/lib/memory/generate-from-assessment";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/memory/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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
    category: "assessment",
    keyword: "creative",
    insight: "Highly creative",
    confidence: 0.9,
    source: "assessment",
  },
  {
    category: "assessment",
    keyword: "analytical",
    insight: "Strong analytical",
    confidence: 0.85,
    source: "assessment",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/memory/generate", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns validation error when body is invalid", async () => {
    allowGuard({ id: "u1" });
    const errorResponse = new Response(
      JSON.stringify({ error: "VALIDATION_ERROR" }),
      { status: 400 },
    );
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: errorResponse,
    });

    const res = await handler(makeRequest({ forceRegenerate: "not-bool" }));
    expect(res.status).toBe(400);
  });

  it("generates and saves memories on happy path", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { forceRegenerate: false },
    });
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "p1",
    });
    (getLatestReportJsonByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      { id: "r1" },
    );
    (
      generateMemoriesFromAssessment as ReturnType<typeof vi.fn>
    ).mockReturnValue(mockMemories);
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeRequest({ forceRegenerate: false }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.memories).toEqual(mockMemories);
    expect(json.count).toBe(2);
    expect(saveMemories).toHaveBeenCalledWith("u1", mockMemories);
    expect(deactivateAllMemories).not.toHaveBeenCalled();
  });

  it("deactivates existing memories when forceRegenerate is true", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { forceRegenerate: true },
    });
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getLatestReportJsonByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (
      generateMemoriesFromAssessment as ReturnType<typeof vi.fn>
    ).mockReturnValue(mockMemories);
    (saveMemories as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (deactivateAllMemories as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest({ forceRegenerate: true }));
    expect(res.status).toBe(200);
    expect(deactivateAllMemories).toHaveBeenCalledWith("u1");
    expect(saveMemories).toHaveBeenCalledWith("u1", mockMemories);
  });

  it("returns 500 on internal error", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { forceRegenerate: false },
    });
    (getProfile as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("INTERNAL_ERROR");
  });
});
