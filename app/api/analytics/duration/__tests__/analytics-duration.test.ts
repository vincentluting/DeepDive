import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
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

vi.mock("@/lib/analytics/page-tracking", () => ({
  updateVisitDuration: vi.fn(),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

import { parseBody } from "@/lib/validation/parse-body";
import { updateVisitDuration } from "@/lib/analytics/page-tracking";
import { checkRateLimit } from "@/lib/api/rate-limit";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(
  body: Record<string, unknown> = {},
  ip = "127.0.0.1",
): Request {
  return new Request("http://localhost/api/analytics/duration", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function allowRateLimit() {
  (checkRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
    allowed: true,
  });
}

function blockRateLimit() {
  (checkRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
    allowed: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/analytics/duration", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns ok when rate limited (silent)", async () => {
    blockRateLimit();
    const res = await handler(makeRequest({ visitId: "v1", durationMs: 5000 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(updateVisitDuration).not.toHaveBeenCalled();
  });

  it("returns ok when body validation fails (silent)", async () => {
    allowRateLimit();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });

    const res = await handler(makeRequest({}));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(updateVisitDuration).not.toHaveBeenCalled();
  });

  it("ignores durations below 1 second", async () => {
    allowRateLimit();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { visitId: "v1", durationMs: 500 },
    });

    const res = await handler(makeRequest({ visitId: "v1", durationMs: 500 }));
    expect(res.status).toBe(200);
    expect(updateVisitDuration).not.toHaveBeenCalled();
  });

  it("saves duration on valid payload", async () => {
    allowRateLimit();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { visitId: "v1", durationMs: 5000 },
    });
    (updateVisitDuration as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest({ visitId: "v1", durationMs: 5000 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(updateVisitDuration).toHaveBeenCalledWith("v1", 5000);
  });

  it("caps duration at 30 minutes", async () => {
    allowRateLimit();
    const hugeMs = 60 * 60 * 1000; // 1 hour
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { visitId: "v1", durationMs: hugeMs },
    });
    (updateVisitDuration as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    await handler(makeRequest({ visitId: "v1", durationMs: hugeMs }));
    expect(updateVisitDuration).toHaveBeenCalledWith("v1", 30 * 60 * 1000);
  });

  it("returns ok even when updateVisitDuration throws", async () => {
    allowRateLimit();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { visitId: "v1", durationMs: 5000 },
    });
    (updateVisitDuration as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest({ visitId: "v1", durationMs: 5000 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
