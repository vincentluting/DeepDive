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
    DB_CONSTRAINT_FAILED: "DB_CONSTRAINT_FAILED",
    SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
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

vi.mock("@/lib/db/conditions", () => ({
  saveRealConditions: vi.fn(),
  getRealConditions: vi.fn(),
  getRealConditionsByUserId: vi.fn(),
}));

vi.mock("@/lib/db/sessions", () => ({
  ensureSessionExists: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  saveRealConditions,
  getRealConditions,
  getRealConditionsByUserId,
} from "@/lib/db/conditions";
import { ensureSessionExists } from "@/lib/db/sessions";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(
  method = "POST",
  url = "http://localhost/api/reality-conditions",
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? "{}" : undefined,
  });
}

function allowGuard(user: { id: string } | null = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 429) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Blocked", { status }),
  });
}

const mockConditions = {
  industry: "technology",
  urgency: "exploring",
  constraints: ["location", "salary"],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── POST /api/reality-conditions ─────────────────────────────
describe("POST /api/reality-conditions", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns blocked response when guard blocks", async () => {
    blockGuard(429);
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
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

  it("saves conditions with authenticated user (happy path)", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        sessionId: "s1",
        userId: null,
        conditions: mockConditions,
      },
    });
    (ensureSessionExists as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (saveRealConditions as ReturnType<typeof vi.fn>).mockResolvedValue("rc-1");

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    // SECURITY (bug-log #015): assert guard was called with requireAuth:true
    // so a future regression that drops the flag is caught by this test.
    expect(guardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ requireAuth: true }),
    );

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.id).toBe("rc-1");

    expect(ensureSessionExists).toHaveBeenCalledWith("s1");
    // Should backfill userId from guard.user when body sends null
    expect(saveRealConditions).toHaveBeenCalledWith("s1", "u1", mockConditions);
  });

  it("rejects unauthenticated POST and ignores client-supplied userId (bug-log #015)", async () => {
    // SECURITY: previously, unauthenticated request with body.userId was trusted
    // and saved as the victim's RC. Now requireAuth blocks this entirely.
    (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
      blocked: true,
      response: new Response("Unauthorized", { status: 401 }),
    });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        sessionId: "s1",
        userId: "body-user-victim",
        conditions: mockConditions,
      },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
    // saveRealConditions must NOT be invoked — the route is short-circuited by guard.
    expect(saveRealConditions).not.toHaveBeenCalled();
  });

  it("ignores client-supplied userId when authenticated (bug-log #015)", async () => {
    // SECURITY: even when authenticated, body.userId is ignored — server uses guard.user.id.
    allowGuard({ id: "real-user-from-session" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        sessionId: "s1",
        userId: "attacker-supplied-victim-id",
        conditions: mockConditions,
      },
    });
    (ensureSessionExists as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (saveRealConditions as ReturnType<typeof vi.fn>).mockResolvedValue("rc-3");

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    // Server-authoritative userId — client value ignored.
    expect(saveRealConditions).toHaveBeenCalledWith(
      "s1",
      "real-user-from-session",
      mockConditions,
    );
    expect(saveRealConditions).not.toHaveBeenCalledWith(
      expect.anything(),
      "attacker-supplied-victim-id",
      expect.anything(),
    );
  });

  it("returns 500 on DB error", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        sessionId: "s1",
        userId: null,
        conditions: mockConditions,
      },
    });
    (ensureSessionExists as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (saveRealConditions as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB constraint"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});

// ── GET /api/reality-conditions ──────────────────────────────
describe("GET /api/reality-conditions", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns blocked response when guard blocks", async () => {
    blockGuard(401);
    const url = "http://localhost/api/reality-conditions?userId=u1";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(401);
  });

  it("returns 404 when requesting another user data", async () => {
    allowGuard({ id: "u1" });
    const url = "http://localhost/api/reality-conditions?userId=other-user";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(404);
  });

  it("returns 400 when no userId or sessionId for anonymous", async () => {
    allowGuard(null);
    const url = "http://localhost/api/reality-conditions";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(400);
  });

  it("anti-enumeration: anonymous ?userId=victim → 404 without DB hit (bug-log #014)", async () => {
    // SECURITY: previously, anonymous ?userId=victim leaked the victim's RC.
    // Now: unauthenticated request with userId param must be rejected before any DB query.
    allowGuard(null);
    const url = "http://localhost/api/reality-conditions?userId=victim-user-id";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(404);
    // Crucial: no DB lookup happened — proves the rejection is at the guard layer.
    expect(getRealConditionsByUserId).not.toHaveBeenCalled();
    expect(getRealConditions).not.toHaveBeenCalled();
  });

  it("returns conditions by authenticated userId", async () => {
    allowGuard({ id: "u1" });
    (getRealConditionsByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockConditions,
    );

    const url = "http://localhost/api/reality-conditions?userId=u1";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.conditions).toEqual(mockConditions);
    expect(getRealConditionsByUserId).toHaveBeenCalledWith("u1");
  });

  it("returns conditions by sessionId for anonymous user", async () => {
    allowGuard(null);
    (getRealConditions as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockConditions,
    );

    const url = "http://localhost/api/reality-conditions?sessionId=s1";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.conditions).toEqual(mockConditions);
    expect(getRealConditions).toHaveBeenCalledWith("s1");
  });

  it("returns null when no conditions found", async () => {
    allowGuard({ id: "u1" });
    (getRealConditionsByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const url = "http://localhost/api/reality-conditions?userId=u1";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.conditions).toBeNull();
  });

  it("uses guard.user.id when userId param matches", async () => {
    allowGuard({ id: "u1" });
    (getRealConditionsByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockConditions,
    );

    // No explicit userId param — should use guard.user.id
    const url = "http://localhost/api/reality-conditions";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(200);
    expect(getRealConditionsByUserId).toHaveBeenCalledWith("u1");
  });
});
