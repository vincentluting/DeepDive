import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    EMAIL_SERVICE_ERROR: "EMAIL_SERVICE_ERROR",
  },
  logApiError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  findUserByEmail: vi.fn(),
}));

vi.mock("@/lib/db/password-reset", () => ({
  createPasswordResetToken: vi.fn(),
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email/templates/password-reset", () => ({
  buildPasswordResetEmail: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { ApiErrorCode, logApiError } from "@/lib/api/api-errors";
import { findUserByEmail } from "@/lib/auth";
import { createPasswordResetToken } from "@/lib/db/password-reset";
import { sendEmail } from "@/lib/email/client";
import { buildPasswordResetEmail } from "@/lib/email/templates/password-reset";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/auth/forgot-password", {
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
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/auth/forgot-password", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../../forgot-password/route");
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

  it("returns success even when email not found (prevents enumeration)", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { email: "nonexistent@example.com", locale: "en" },
    });
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    // Should NOT send email or create token
    expect(createPasswordResetToken).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends reset email for valid user (happy path)", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { email: "user@example.com", locale: "en" },
    });
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      name: "Test User",
    });
    (createPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue(
      "raw-token-123",
    );
    (buildPasswordResetEmail as ReturnType<typeof vi.fn>).mockReturnValue({
      subject: "Reset Password",
      html: "<p>Reset link</p>",
    });
    (sendEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    expect(createPasswordResetToken).toHaveBeenCalledWith("u1");
    expect(buildPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        locale: "en",
      }),
    );
    expect(sendEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Reset Password",
      html: "<p>Reset link</p>",
      category: "critical",
    });
  });

  it("builds correct reset URL with locale", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { email: "user@example.com", locale: "zh" },
    });
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      name: "User",
    });
    (createPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue(
      "token-zh",
    );
    (buildPasswordResetEmail as ReturnType<typeof vi.fn>).mockReturnValue({
      subject: "重置密码",
      html: "<p>链接</p>",
    });
    (sendEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await handler(makeRequest());

    expect(buildPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        resetUrl: expect.stringContaining("/zh/reset-password?token=token-zh"),
        locale: "zh",
      }),
    );
  });

  it("logs email delivery failure without revealing account existence", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { email: "user@example.com", locale: "en" },
    });
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      name: "Test User",
    });
    (createPasswordResetToken as ReturnType<typeof vi.fn>).mockResolvedValue(
      "raw-token-123",
    );
    (buildPasswordResetEmail as ReturnType<typeof vi.fn>).mockReturnValue({
      subject: "Reset Password",
      html: "<p>Reset link</p>",
    });
    (sendEmail as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await handler(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(logApiError).toHaveBeenCalledWith(
      "/api/auth/forgot-password",
      ApiErrorCode.EMAIL_SERVICE_ERROR,
      expect.objectContaining({
        userId: "u1",
        message: expect.stringContaining("Password reset email failed"),
      }),
    );
  });
});
