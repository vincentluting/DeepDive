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
    VALIDATION_ERROR: "VALIDATION_ERROR",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/db/password-reset", () => ({
  validateResetToken: vi.fn(),
  consumeResetToken: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  hashPassword: vi.fn(),
}));

const mockSql = vi.fn();
vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { validateResetToken, consumeResetToken } from "@/lib/db/password-reset";
import { hashPassword } from "@/lib/auth";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

function allowGuard() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: null,
  });
}

function blockGuard(status = 429) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Too many requests", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSql.mockResolvedValue([]);
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/auth/reset-password", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../../reset-password/route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns blocked response when rate limited", async () => {
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

  it("returns 400 when token is invalid or expired", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { token: "bad-token", password: "NewSecurePass123!" },
    });
    (validateResetToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.message).toContain("expired");
  });

  it("resets password successfully (happy path)", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { token: "valid-token", password: "NewSecurePass123!" },
    });
    (validateResetToken as ReturnType<typeof vi.fn>).mockResolvedValue("u1");
    (hashPassword as ReturnType<typeof vi.fn>).mockResolvedValue(
      "hashed-new-password",
    );
    (consumeResetToken as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    expect(hashPassword).toHaveBeenCalledWith("NewSecurePass123!");
    expect(consumeResetToken).toHaveBeenCalledWith("valid-token");
    // Should have called sql for BEGIN, UPDATE, COMMIT
    expect(mockSql).toHaveBeenCalled();
  });

  it("rolls back on DB error during password update", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { token: "valid-token", password: "NewSecurePass123!" },
    });
    (validateResetToken as ReturnType<typeof vi.fn>).mockResolvedValue("u1");
    (hashPassword as ReturnType<typeof vi.fn>).mockResolvedValue("hashed");

    // First call = BEGIN (ok), second call = UPDATE (fail)
    let callCount = 0;
    mockSql.mockImplementation(() => {
      callCount++;
      if (callCount === 2) throw new Error("DB write failed");
      return Promise.resolve([]);
    });

    await expect(handler(makeRequest())).rejects.toThrow("DB write failed");

    // Should have called ROLLBACK (3rd call after BEGIN + failed UPDATE)
    expect(mockSql).toHaveBeenCalledTimes(3);
  });
});
