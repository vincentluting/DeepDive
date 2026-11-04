import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    UNAUTHORIZED: "UNAUTHORIZED",
    ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
  },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/validation/parse-body", () => ({ parseBody: vi.fn() }));
vi.mock("@/lib/db/admin", () => ({ bootstrapAdmin: vi.fn() }));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { bootstrapAdmin } from "@/lib/db/admin";

function allowGuard() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: null,
  });
}
function blockGuard(status = 429) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Too Many", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SESSION_SECRET = "test-secret";
});

describe("POST /api/admin/bootstrap", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("returns 429 when guard blocks", async () => {
    blockGuard(429);
    const res = await handler(
      new Request("http://localhost/api/admin/bootstrap", { method: "POST" }),
    );
    expect(res.status).toBe(429);
  });

  it("returns 404 in production — endpoint fully disabled with valid bearer (bug-log #016)", async () => {
    // SECURITY: SESSION_SECRET reuse for admin escalation is too risky in prod.
    // Prod admin promotions must go through direct DB UPDATE by an existing admin.
    const originalEnv = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    try {
      // Even with a valid Bearer SESSION_SECRET, prod must reject.
      const res = await handler(
        new Request("http://localhost/api/admin/bootstrap", {
          method: "POST",
          headers: { authorization: "Bearer test-secret" },
        }),
      );
      expect(res.status).toBe(404);
      // Crucial: prod check must run BEFORE guardRoute / parseBody / bootstrapAdmin.
      expect(guardRoute).not.toHaveBeenCalled();
      expect(parseBody).not.toHaveBeenCalled();
      expect(bootstrapAdmin).not.toHaveBeenCalled();
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV =
        originalEnv;
    }
  });

  it("returns 404 in production — also for missing/wrong bearer (bug-log #016)", async () => {
    // SECURITY: prod-disable must not depend on bearer state.
    // Test both "no auth header" and "wrong bearer" — both must 404 before any check.
    const originalEnv = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    try {
      // 1. No auth header → 404 (not 401)
      const resNoAuth = await handler(
        new Request("http://localhost/api/admin/bootstrap", { method: "POST" }),
      );
      expect(resNoAuth.status).toBe(404);

      // 2. Wrong bearer → 404 (not 401)
      const resWrongAuth = await handler(
        new Request("http://localhost/api/admin/bootstrap", {
          method: "POST",
          headers: { authorization: "Bearer wrong-secret" },
        }),
      );
      expect(resWrongAuth.status).toBe(404);

      expect(guardRoute).not.toHaveBeenCalled();
      expect(parseBody).not.toHaveBeenCalled();
      expect(bootstrapAdmin).not.toHaveBeenCalled();
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV =
        originalEnv;
    }
  });

  it("returns 401 with wrong bearer token", async () => {
    allowGuard();
    const res = await handler(
      new Request("http://localhost/api/admin/bootstrap", {
        method: "POST",
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("bootstraps admin (happy path)", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { email: "Admin@Test.com" },
    });
    (bootstrapAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      email: "admin@test.com",
    });

    const res = await handler(
      new Request("http://localhost/api/admin/bootstrap", {
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.id).toBe("u1");
    expect(bootstrapAdmin).toHaveBeenCalledWith("admin@test.com");
  });

  it("returns 404 when user not found", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { email: "nobody@test.com" },
    });
    (bootstrapAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(
      new Request("http://localhost/api/admin/bootstrap", {
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    expect(res.status).toBe(404);
  });
});
