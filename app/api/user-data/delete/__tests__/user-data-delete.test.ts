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

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/lib/auth/passwords", () => ({
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/db/user-data", () => ({
  getUserPasswordHash: vi.fn(),
  getPendingDeletionRequest: vi.fn(),
  createDeletionRequest: vi.fn(),
  clearUserSessions: vi.fn(),
  cancelDeletionRequest: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { verifyPassword } from "@/lib/auth/passwords";
import {
  getUserPasswordHash,
  getPendingDeletionRequest,
  createDeletionRequest,
  clearUserSessions,
  cancelDeletionRequest,
} from "@/lib/db/user-data";
import { clearSessionCookie } from "@/lib/auth";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(
  method = "POST",
  url = "http://localhost/api/user-data/delete",
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method !== "GET" ? "{}" : undefined,
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

// ── POST /api/user-data/delete ───────────────────────────────
describe("POST /api/user-data/delete", () => {
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

  it("returns 401 when password is incorrect", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { password: "wrong-pass" },
    });
    (getUserPasswordHash as ReturnType<typeof vi.fn>).mockResolvedValue(
      "hashed",
    );
    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns already pending when deletion exists", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { password: "correct" },
    });
    (getUserPasswordHash as ReturnType<typeof vi.fn>).mockResolvedValue(
      "hashed",
    );
    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getPendingDeletionRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      scheduledDeletionAt: "2026-04-22",
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.alreadyPending).toBe(true);
    expect(createDeletionRequest).not.toHaveBeenCalled();
  });

  it("schedules deletion and logs out user (happy path)", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { password: "correct" },
    });
    (getUserPasswordHash as ReturnType<typeof vi.fn>).mockResolvedValue(
      "hashed",
    );
    (verifyPassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (getPendingDeletionRequest as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (createDeletionRequest as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (clearUserSessions as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (clearSessionCookie as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.coolingPeriodDays).toBe(30);
    expect(json.scheduledDeletionAt).toBeDefined();

    expect(createDeletionRequest).toHaveBeenCalledWith("u1", expect.any(Date));
    expect(clearUserSessions).toHaveBeenCalledWith("u1");
    expect(clearSessionCookie).toHaveBeenCalledTimes(1);
  });

  it("skips password check for OAuth-only users", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { password: "" },
    });
    (getUserPasswordHash as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getPendingDeletionRequest as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    (createDeletionRequest as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (clearUserSessions as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );
    (clearSessionCookie as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    // verifyPassword should NOT be called for OAuth users
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(createDeletionRequest).toHaveBeenCalled();
  });
});

// ── GET /api/user-data/delete ────────────────────────────────
describe("GET /api/user-data/delete", () => {
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

  it("returns pending false when no deletion request", async () => {
    allowGuard();
    (getPendingDeletionRequest as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest("GET"));
    const json = await res.json();
    expect(json.pending).toBe(false);
  });

  it("returns pending deletion details", async () => {
    allowGuard();
    (getPendingDeletionRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      requestedAt: "2026-03-23",
      scheduledDeletionAt: "2026-04-22",
    });

    const res = await handler(makeRequest("GET"));
    const json = await res.json();

    expect(json.pending).toBe(true);
    expect(json.scheduledDeletionAt).toBe("2026-04-22");
  });
});

// ── DELETE /api/user-data/delete ─────────────────────────────
describe("DELETE /api/user-data/delete", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.DELETE as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest("DELETE"));
    expect(res.status).toBe(401);
  });

  it("cancels pending deletion", async () => {
    allowGuard();
    (cancelDeletionRequest as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await handler(makeRequest("DELETE"));
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.message).toContain("cancelled");
  });

  it("returns success when no pending deletion to cancel", async () => {
    allowGuard();
    (cancelDeletionRequest as ReturnType<typeof vi.fn>).mockResolvedValue(
      false,
    );

    const res = await handler(makeRequest("DELETE"));
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.message).toContain("No pending deletion");
  });
});
