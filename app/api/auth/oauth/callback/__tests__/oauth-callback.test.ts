import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockCookieGet = vi.fn();
const mockCookieDelete = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mockCookieGet,
    delete: mockCookieDelete,
  }),
}));

vi.mock("@/lib/auth/oauth", () => ({
  exchangeOAuthCode: vi.fn(),
}));

vi.mock("@/lib/db/oauth", () => ({
  findOAuthAccount: vi.fn(),
  createOAuthAccount: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  createOAuthUser: vi.fn(),
  createSession: vi.fn(),
  setSessionCookie: vi.fn(),
  findUserByEmail: vi.fn(),
}));

vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email/templates/welcome", () => ({
  buildWelcomeEmail: vi
    .fn()
    .mockReturnValue({ subject: "Welcome", html: "<p>Hi</p>" }),
}));

import { exchangeOAuthCode } from "@/lib/auth/oauth";
import { findOAuthAccount, createOAuthAccount } from "@/lib/db/oauth";
import {
  createOAuthUser,
  createSession,
  setSessionCookie,
  findUserByEmail,
} from "@/lib/auth";

// ── Helpers ──────────────────────────────────────────────────
function makeCallbackRequest(params: Record<string, string> = {}): Request {
  const url = new URL("http://localhost/api/auth/oauth/callback");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString(), { method: "GET" });
}

function setupCookies(state: string | undefined, locale = "en") {
  mockCookieGet.mockImplementation((name: string) => {
    if (name === "oauth_state") return state ? { value: state } : undefined;
    if (name === "oauth_locale") return { value: locale };
    return undefined;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
});

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/auth/oauth/callback", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("redirects to login when error param present", async () => {
    setupCookies("state123");
    const res = await handler(makeCallbackRequest({ error: "access_denied" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects to login on state mismatch", async () => {
    setupCookies("expected-state");
    const res = await handler(
      makeCallbackRequest({
        code: "auth-code",
        state: "wrong-state",
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("logs in returning user with existing OAuth account", async () => {
    setupCookies("state123");
    (exchangeOAuthCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      provider: "google",
      providerAccountId: "goog-123",
      email: "user@test.com",
      name: "Test User",
    });
    (findOAuthAccount as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "u1",
    });
    (createSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sess-1",
    });

    const res = await handler(
      makeCallbackRequest({
        code: "auth-code",
        state: "state123",
        scope: "email profile",
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
    expect(createSession).toHaveBeenCalledWith("u1");
    expect(setSessionCookie).toHaveBeenCalledWith("sess-1");
  });

  it("creates new user when no OAuth account or existing user found", async () => {
    setupCookies("state123");
    (exchangeOAuthCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      provider: "google",
      providerAccountId: "goog-new",
      email: "new@test.com",
      name: "New User",
    });
    (findOAuthAccount as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (findUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createOAuthUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u-new",
    });
    (createSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sess-2",
    });

    const res = await handler(
      makeCallbackRequest({
        code: "auth-code",
        state: "state123",
        scope: "email profile",
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/dashboard");
    expect(createOAuthUser).toHaveBeenCalledWith("new@test.com", "New User");
    expect(createOAuthAccount).toHaveBeenCalled();
  });

  it("redirects to login when code exchange fails", async () => {
    setupCookies("state123");
    (exchangeOAuthCode as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("exchange failed"),
    );

    const res = await handler(
      makeCallbackRequest({
        code: "bad-code",
        state: "state123",
        scope: "email profile",
      }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });
});
