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

vi.mock("@/lib/achievements/engine", () => ({
  checkAchievements: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { checkAchievements } from "@/lib/achievements/engine";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/achievements/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

function allowGuard(user = { id: "u1" }) {
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
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/achievements/check", () => {
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

  it("returns newly unlocked achievements (happy path)", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { event: "dimension_card_viewed", metadata: { card: "values" } },
    });
    (checkAchievements as ReturnType<typeof vi.fn>).mockResolvedValue([
      { achievementKey: "explorer", unlockedAt: "2026-03-23" },
    ]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.unlocked).toHaveLength(1);
    expect(json.unlocked[0].achievementKey).toBe("explorer");

    expect(checkAchievements).toHaveBeenCalledWith(
      "u1",
      "dimension_card_viewed",
      {
        card: "values",
      },
    );
  });

  it("returns empty array when no new achievements unlocked", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { event: "page_view" },
    });
    (checkAchievements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await handler(makeRequest());
    const json = await res.json();
    expect(json.unlocked).toEqual([]);
  });

  it("passes empty metadata when not provided", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { event: "test_event" },
    });
    (checkAchievements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await handler(makeRequest());

    expect(checkAchievements).toHaveBeenCalledWith("u1", "test_event", {});
  });

  it("returns 500 on engine error", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { event: "test" },
    });
    (checkAchievements as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("engine error"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
