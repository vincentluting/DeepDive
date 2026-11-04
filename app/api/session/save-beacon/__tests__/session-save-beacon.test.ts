import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/db/sessions", () => ({
  saveSessionProgress: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

const mockSql = vi.fn();
vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

import { saveSessionProgress } from "@/lib/db/sessions";
import { getCurrentUser } from "@/lib/auth";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/session/save-beacon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/session/save-beacon", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns ok when body is invalid (best-effort)", async () => {
    const res = await handler(makeRequest({ bad: "data" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(saveSessionProgress).not.toHaveBeenCalled();
  });

  it("skips save when session belongs to different user", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    // Session owned by different user
    mockSql.mockResolvedValue([{ userId: "u2" }]);

    const res = await handler(
      makeRequest({
        sessionId: "s1",
        answers: [{ questionId: "q1", value: 3 }],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(saveSessionProgress).not.toHaveBeenCalled();
  });

  it("saves progress on valid payload with matching user", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    // Session owned by same user
    mockSql.mockResolvedValue([{ userId: "u1" }]);
    (saveSessionProgress as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(
      makeRequest({
        sessionId: "s1",
        answers: [{ questionId: "q1", value: 3 }],
        currentModule: "B",
        currentQuestionIndex: 5,
        language: "zh",
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(saveSessionProgress).toHaveBeenCalledWith(
      "s1",
      [{ questionId: "q1", value: 3 }],
      "B",
      5,
      "zh",
      undefined,
      "u1",
    );
  });

  it("saves progress when session has no owner (anonymous)", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    // Session with no userId
    mockSql.mockResolvedValue([{ userId: null }]);
    (saveSessionProgress as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(
      makeRequest({
        sessionId: "s1",
        answers: [],
      }),
    );

    expect(res.status).toBe(200);
    expect(saveSessionProgress).toHaveBeenCalled();
  });

  it("returns ok even when save throws (best-effort)", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    mockSql.mockResolvedValue([{ userId: "u1" }]);
    (saveSessionProgress as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(
      makeRequest({
        sessionId: "s1",
        answers: [],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
