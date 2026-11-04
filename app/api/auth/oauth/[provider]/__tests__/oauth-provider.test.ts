import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: mockCookieSet,
  }),
}));

vi.mock("crypto", () => ({
  randomBytes: vi.fn().mockReturnValue({
    toString: () => "mock-state-token-hex",
  }),
}));

vi.mock("@/lib/auth/oauth", () => ({
  getOAuthUrl: vi
    .fn()
    .mockReturnValue("https://accounts.google.com/o/oauth2/auth?mock=1"),
}));

import { getOAuthUrl } from "@/lib/auth/oauth";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(provider: string, locale?: string): Request {
  const url = locale
    ? `http://localhost/api/auth/oauth/${provider}?locale=${locale}`
    : `http://localhost/api/auth/oauth/${provider}`;
  return new Request(url, { method: "GET" });
}

const makeContext = (provider: string) => ({
  params: Promise.resolve({ provider }),
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/auth/oauth/[provider]", () => {
  let handler: (req: Request, ctx: unknown) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (
      req: Request,
      ctx: unknown,
    ) => Promise<Response>;
  });

  it("returns 400 for invalid provider", async () => {
    const res = await handler(makeRequest("github"), makeContext("github"));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe("Invalid provider");
  });

  it("redirects to OAuth URL for google", async () => {
    const res = await handler(makeRequest("google"), makeContext("google"));
    // NextResponse.redirect returns 307
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("google");
  });

  it("sets oauth_state and oauth_locale cookies", async () => {
    await handler(makeRequest("google", "zh"), makeContext("google"));

    expect(mockCookieSet).toHaveBeenCalledWith(
      "oauth_state",
      "mock-state-token-hex",
      expect.objectContaining({
        httpOnly: true,
        maxAge: 600,
      }),
    );
    expect(mockCookieSet).toHaveBeenCalledWith(
      "oauth_locale",
      "zh",
      expect.objectContaining({
        httpOnly: true,
      }),
    );
  });

  it("calls getOAuthUrl with correct params", async () => {
    await handler(makeRequest("google"), makeContext("google"));
    expect(getOAuthUrl).toHaveBeenCalledWith(
      "google",
      "mock-state-token-hex",
      expect.stringContaining("/api/auth/oauth/callback"),
    );
  });
});
