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
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/db/profiles", () => ({
  getUserProfileInsights: vi.fn(),
  updateUserProfileInsights: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  getUserProfileInsights,
  updateUserProfileInsights,
} from "@/lib/db/profiles";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(
  method = "POST",
  url = "http://localhost/api/profile-feedback",
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? "{}" : undefined,
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

// ── GET /api/profile-feedback ────────────────────────────────
describe("GET /api/profile-feedback", () => {
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

  it("returns empty socialLinks when no insights exist", async () => {
    allowGuard();
    (getUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest("GET"));
    const json = await res.json();
    expect(json.socialLinks).toEqual([]);
  });

  it("returns existing socialLinks", async () => {
    allowGuard();
    (getUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue({
      insightsJson: {
        socialLinks: [
          { platform: "linkedin", url: "https://linkedin.com/in/test" },
        ],
      },
    });

    const res = await handler(makeRequest("GET"));
    const json = await res.json();
    expect(json.socialLinks).toHaveLength(1);
    expect(json.socialLinks[0].platform).toBe("linkedin");
  });
});

// ── POST /api/profile-feedback ───────────────────────────────
describe("POST /api/profile-feedback", () => {
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

  it("appends feedback entry to profile insights", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { section: "coreSelf", accurate: true },
    });
    (getUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue({
      insightsJson: { profileFeedback: [] },
    });
    (updateUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const updateCall = (updateUserProfileInsights as ReturnType<typeof vi.fn>)
      .mock.calls[0];
    expect(updateCall[0]).toBe("u1");
    const saved = JSON.parse(updateCall[1]);
    expect(saved.profileFeedback).toHaveLength(1);
    expect(saved.profileFeedback[0].section).toBe("coreSelf");
    expect(saved.profileFeedback[0].accurate).toBe(true);
  });

  it("saves socialLinks when section is socialLinks", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        section: "socialLinks",
        data: [
          { platform: "linkedin", url: "https://linkedin.com/in/test" },
          { platform: "github", url: "https://github.com/test" },
        ],
      },
    });
    (getUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue({
      insightsJson: {},
    });
    (updateUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const updateCall = (updateUserProfileInsights as ReturnType<typeof vi.fn>)
      .mock.calls[0];
    const saved = JSON.parse(updateCall[1]);
    expect(saved.socialLinks).toHaveLength(2);
    expect(saved.socialLinks[0].platform).toBe("linkedin");
  });

  it("limits socialLinks to 5 entries", async () => {
    allowGuard({ id: "u1" });
    const links = Array.from({ length: 10 }, (_, i) => ({
      platform: `p${i}`,
      url: `https://example.com/${i}`,
    }));
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { section: "socialLinks", data: links },
    });
    (getUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue({
      insightsJson: {},
    });
    (updateUserProfileInsights as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    await handler(makeRequest());

    const saved = JSON.parse(
      (updateUserProfileInsights as ReturnType<typeof vi.fn>).mock.calls[0][1],
    );
    expect(saved.socialLinks).toHaveLength(5);
  });

  it("returns 500 on DB error", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { section: "coreSelf", accurate: false },
    });
    (getUserProfileInsights as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
