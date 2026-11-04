import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (before imports) ──────────────────────────────────
vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  isUserAdmin: vi.fn(),
}));

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: { INTERNAL_ERROR: "INTERNAL_ERROR" },
  logApiError: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { isUserAdmin } from "@/lib/auth/admin";
import { parseBody } from "@/lib/validation/parse-body";
import { logApiError } from "@/lib/api/api-errors";

// ── Helpers ─────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function allowGuard(user: { id: string; email?: string } | null = null) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Rate limited", { status: 429 }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────
describe("POST /api/analytics/event", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns silent 200 when guard blocks — telemetry must never surface errors to clients", async () => {
    // When the telemetry tier rate-limits, the route intentionally swallows
    // the 429 and returns { success: true } so that fire-and-forget funnel
    // tracking never causes a client-side error. The event is dropped silently.
    blockGuard();
    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    // Event must not be tracked when guard blocks
    expect(trackFunnelEvent).not.toHaveBeenCalled();
  });

  it("returns 200 success even when parseBody fails", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response("bad", { status: 400 }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(trackFunnelEvent).not.toHaveBeenCalled();
  });

  it("returns 200 success when event is missing", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { clientId: "c1" },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(trackFunnelEvent).not.toHaveBeenCalled();
  });

  it("tracks funnel event for anonymous user", async () => {
    allowGuard(); // anonymous
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        event: "quickdive_started",
        clientId: "c1",
        metadata: { locale: "en" },
      },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(trackFunnelEvent).toHaveBeenCalledWith("quickdive_started", {
      userId: null,
      clientId: "c1",
      metadata: { locale: "en" },
      idempotencyKey: undefined,
      isAdmin: false,
    });
  });

  it("tracks funnel event for authenticated user with admin check", async () => {
    allowGuard({ id: "user-1", email: "admin@test.com" });
    (isUserAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { event: "report_viewed", clientId: "c1", metadata: {} },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(isUserAdmin).toHaveBeenCalledWith("user-1", "admin@test.com");
    expect(trackFunnelEvent).toHaveBeenCalledWith("report_viewed", {
      userId: "user-1",
      clientId: "c1",
      metadata: {},
      idempotencyKey: undefined,
      isAdmin: true,
    });
  });

  it("skips admin check when user has no email", async () => {
    allowGuard({ id: "user-1" }); // no email
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { event: "deepdive_started", clientId: "c1", metadata: {} },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(isUserAdmin).not.toHaveBeenCalled();
    expect(trackFunnelEvent).toHaveBeenCalledWith(
      "deepdive_started",
      expect.objectContaining({
        isAdmin: false,
      }),
    );
  });

  it("returns 200 even when trackFunnelEvent throws", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { event: "landing_viewed", clientId: "c1", metadata: {} },
    });
    (trackFunnelEvent as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(logApiError).toHaveBeenCalled();
  });

  it("passes idempotencyKey through to trackFunnelEvent", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        event: "registered",
        clientId: "c1",
        metadata: {},
        idempotencyKey: "idem-abc-123",
      },
    });

    await handler(makeRequest());

    expect(trackFunnelEvent).toHaveBeenCalledWith(
      "registered",
      expect.objectContaining({
        idempotencyKey: "idem-abc-123",
      }),
    );
  });
});
