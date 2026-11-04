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

vi.mock("@/lib/db/report-engagement", () => ({
  saveReportEngagement: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

import { parseBody } from "@/lib/validation/parse-body";
import { saveReportEngagement } from "@/lib/db/report-engagement";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/api/rate-limit";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(
  body: Record<string, unknown> = {},
  ip = "127.0.0.1",
): Request {
  return new Request("http://localhost/api/analytics/report-engagement", {
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

const validParsedData = {
  id: "eng-1",
  reportId: "r1",
  panelTimes: { anchors: 3000, shadow: 2000 },
  scrollbacks: [{ from: "anchors", to: "shadow", atMs: 5000 }],
  maxScrollDepth: 0.85,
  totalTimeMs: 30000,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/analytics/report-engagement", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns ok when rate limited", async () => {
    blockRateLimit();
    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(saveReportEngagement).not.toHaveBeenCalled();
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
    expect(saveReportEngagement).not.toHaveBeenCalled();
  });

  it("saves engagement with user id on valid payload", async () => {
    allowRateLimit();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validParsedData,
    });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    (saveReportEngagement as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(saveReportEngagement).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "eng-1",
        reportId: "r1",
        userId: "u1",
      }),
    );
  });

  it("saves engagement without user id when auth fails", async () => {
    allowRateLimit();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validParsedData,
    });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Session expired"),
    );
    (saveReportEngagement as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(saveReportEngagement).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
      }),
    );
  });

  it("caps maxScrollDepth to [0, 1] range", async () => {
    allowRateLimit();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validParsedData, maxScrollDepth: 1.5 },
    });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (saveReportEngagement as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    await handler(makeRequest());
    expect(saveReportEngagement).toHaveBeenCalledWith(
      expect.objectContaining({
        maxScrollDepth: 1,
      }),
    );
  });

  it("returns ok even when save throws", async () => {
    allowRateLimit();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validParsedData,
    });
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (saveReportEngagement as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
