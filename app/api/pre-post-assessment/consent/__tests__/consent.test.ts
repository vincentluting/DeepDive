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
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/db/consent-records", () => ({
  recordResearchConsent: vi.fn(),
}));
vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn(),
}));
vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn(async () => []),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { recordResearchConsent } from "@/lib/db/consent-records";

function allowGuard(userId = "u1") {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: userId },
  });
}

function blockGuard(status = 401) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status }),
  });
}

function makeRequest(body: unknown = { consentGiven: true }) {
  return new Request("http://localhost/api/pre-post-assessment/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/pre-post-assessment/consent", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("rejects unauthenticated requests", async () => {
    blockGuard(401);
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
    expect(recordResearchConsent).not.toHaveBeenCalled();
  });

  it("records consent when body explicitly sends consentGiven: true", async () => {
    allowGuard("u1");
    (recordResearchConsent as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest({ consentGiven: true }));
    expect(res.status).toBe(200);
    expect(recordResearchConsent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1" }),
    );
  });

  it("rejects body with consentGiven: false (bug-log #019)", async () => {
    // SECURITY: previously, the route did not parse the body at all, so
    // `consentGiven: false` or missing body would still record consent. That
    // is an informed-consent law violation — a user who declined would be
    // recorded as having agreed. Now the schema requires the literal true.
    allowGuard("u1");

    const res = await handler(makeRequest({ consentGiven: false }));
    expect(res.status).toBe(400);
    expect(recordResearchConsent).not.toHaveBeenCalled();
  });

  it("rejects empty body (bug-log #019)", async () => {
    // SECURITY: empty body must not be silently treated as consent.
    allowGuard("u1");

    const res = await handler(makeRequest({}));
    expect(res.status).toBe(400);
    expect(recordResearchConsent).not.toHaveBeenCalled();
  });

  it("rejects body with extra fields but no consentGiven (bug-log #019)", async () => {
    // SECURITY: attackers must not be able to bypass by sending unrelated fields.
    allowGuard("u1");

    const res = await handler(makeRequest({ accepted: true, agreement: 1 }));
    expect(res.status).toBe(400);
    expect(recordResearchConsent).not.toHaveBeenCalled();
  });

  it("rejects body with consentGiven as truthy non-boolean (bug-log #019)", async () => {
    // SECURITY: z.literal(true) rejects "true" (string), 1 (number), etc.
    allowGuard("u1");

    const res = await handler(makeRequest({ consentGiven: "true" }));
    expect(res.status).toBe(400);
    expect(recordResearchConsent).not.toHaveBeenCalled();
  });

  it("rejects body with extra unknown fields (.strict()) (bug-log #019)", async () => {
    // SECURITY: .strict() locks the body contract — no silent acceptance of
    // extra fields. The research-ethics audit trail must reflect exactly what
    // the participant agreed to.
    allowGuard("u1");

    const res = await handler(
      makeRequest({ consentGiven: true, extraField: "anything" }),
    );
    expect(res.status).toBe(400);
    expect(recordResearchConsent).not.toHaveBeenCalled();
  });

  it("invokes guard with requireAuth: true", async () => {
    allowGuard("u1");
    (recordResearchConsent as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    await handler(makeRequest());

    // Regression guard: if a future commit drops requireAuth, this test fails.
    expect(guardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ requireAuth: true }),
    );
  });
});
