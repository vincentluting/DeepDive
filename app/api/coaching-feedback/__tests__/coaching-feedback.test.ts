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
    SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/db/coaching-feedback", () => ({
  saveCoachingFeedback: vi.fn(),
}));
vi.mock("@/lib/db/coaching", () => ({
  getCoachingSessionForUser: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { saveCoachingFeedback } from "@/lib/db/coaching-feedback";
import { getCoachingSessionForUser } from "@/lib/db/coaching";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/coaching-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

function allowGuard(user: { id: string } | null = { id: "u1" }) {
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

beforeEach(() => {
  vi.clearAllMocks();
  (getCoachingSessionForUser as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "cs-1",
  });
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/coaching-feedback", () => {
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

  it("returns 400 when validation fails", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it("saves feedback with highlight (happy path)", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        sessionId: "cs-1",
        rating: "very_helpful",
        reasons: ["understood_me", "helpful_next_step"],
        highlight: "The autonomy insight was eye-opening",
        tags: ["disjointed", "too_superficial"],
      },
    });
    (saveCoachingFeedback as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "fb-1",
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.id).toBe("fb-1");

    expect(saveCoachingFeedback).toHaveBeenCalledWith({
      sessionId: "cs-1",
      userId: "u1",
      rating: "very_helpful",
      reasons: ["understood_me", "helpful_next_step"],
      highlight: "The autonomy insight was eye-opening",
      tags: ["disjointed", "too_superficial"],
    });
  });

  it("saves feedback without highlight (null)", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "cs-2", rating: "okay", reasons: [] },
    });
    (saveCoachingFeedback as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "fb-2",
    });

    await handler(makeRequest());

    expect(saveCoachingFeedback).toHaveBeenCalledWith({
      sessionId: "cs-2",
      userId: "u1",
      rating: "okay",
      reasons: [],
      highlight: null,
      tags: [],
    });
  });

  it("rejects feedback for a session the user does not own", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "other-session", rating: "okay", reasons: [] },
    });
    (getCoachingSessionForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest());

    expect(res.status).toBe(404);
    expect(saveCoachingFeedback).not.toHaveBeenCalled();
  });

  it("returns 500 on DB error", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { sessionId: "cs-3", rating: "helpful", reasons: [] },
    });
    (saveCoachingFeedback as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB constraint"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
