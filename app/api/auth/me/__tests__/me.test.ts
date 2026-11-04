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
  logApiError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserWithAdmin: vi.fn(),
}));

vi.mock("@/lib/db/user-context", () => ({
  getUserContext: vi.fn(),
  getUserContextOrCompute: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getCurrentUserWithAdmin } from "@/lib/auth";
import { getUserContext, getUserContextOrCompute } from "@/lib/db/user-context";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/auth/me", { method: "GET" });
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
    response: new Response("Blocked", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/auth/me", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../../me/route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns blocked response when guard blocks", async () => {
    blockGuard(429);
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns null user when not authenticated", async () => {
    allowGuard();
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.user).toBeNull();
  });

  it("returns user with userLevel (happy path)", async () => {
    allowGuard();
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      name: "Test User",
      isAdmin: false,
    });
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      userLevel: 2,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.user.id).toBe("u1");
    expect(json.user.email).toBe("test@example.com");
    expect(json.user.name).toBe("Test User");
    expect(json.user.isAdmin).toBe(false);
    expect(json.userLevel).toBe(2);
    expect(getUserContextOrCompute).not.toHaveBeenCalled();
  });

  it("returns admin user correctly", async () => {
    allowGuard();
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "admin-1",
      email: "admin@deepdive.dev",
      name: "Admin",
      isAdmin: true,
    });
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      userLevel: 3,
    });

    const res = await handler(makeRequest());
    const json = await res.json();

    expect(json.user.isAdmin).toBe(true);
    expect(json.userLevel).toBe(3);
  });

  it("defaults userLevel to 0 when context is missing without recomputing synchronously", async () => {
    allowGuard();
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      name: "Test",
      isAdmin: false,
    });
    (getUserContext as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(makeRequest());
    const json = await res.json();

    expect(json.user.id).toBe("u1");
    expect(json.userLevel).toBe(0);
    expect(getUserContext).toHaveBeenCalledWith("u1");
    expect(getUserContextOrCompute).not.toHaveBeenCalled();
  });

  it("defaults userLevel to 0 when the lightweight context read fails", async () => {
    allowGuard();
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      email: "test@example.com",
      name: "Test",
      isAdmin: false,
    });
    (getUserContext as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB error"),
    );

    const res = await handler(makeRequest());
    const json = await res.json();

    expect(json.user.id).toBe("u1");
    expect(json.userLevel).toBe(0);
    expect(getUserContextOrCompute).not.toHaveBeenCalled();
  });

  it("returns null user on unexpected error (graceful fallback)", async () => {
    allowGuard();
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("unexpected"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.user).toBeNull();
  });
});
