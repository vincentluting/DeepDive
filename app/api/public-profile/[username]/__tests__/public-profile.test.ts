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
    ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/db/profiles", () => ({
  getPublicProfileByUsername: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getPublicProfileByUsername } from "@/lib/db/profiles";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(username = "testuser"): Request {
  return new Request(`http://localhost/api/public-profile/${username}`, {
    method: "GET",
  });
}

function makeContext(username = "testuser") {
  return { params: Promise.resolve({ username }) };
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
    response: new Response("Rate limited", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/public-profile/[username]", () => {
  let handler: (
    req: Request,
    ctx?: { params: Promise<Record<string, string>> },
  ) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as typeof handler;
  });

  it("returns blocked response when guard blocks", async () => {
    blockGuard(429);
    const res = await handler(makeRequest(), makeContext());
    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid username (too short)", async () => {
    allowGuard();
    const res = await handler(makeRequest("ab"), makeContext("ab"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when profile not found", async () => {
    allowGuard();
    (getPublicProfileByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest("testuser"), makeContext("testuser"));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("ASSESSMENT_NOT_FOUND");
  });

  it("returns public-safe profile fields on success", async () => {
    allowGuard();
    const mockProfile = {
      profileJson: {
        archetype: { primary: "Explorer", code: "IE" },
        collabMapping: { style: "Facilitator" },
        narrativeSnapshots: {
          coreInsight: "A visionary thinker",
          fullNarrative: "Should not be returned",
        },
        schwartzAnchors: {
          top3: ["Benevolence", "Universalism", "Self-Direction"],
          all: ["should not appear"],
        },
      },
      socialLinks: { linkedin: "https://linkedin.com/in/test" },
    };
    (getPublicProfileByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockProfile,
    );

    const res = await handler(makeRequest("testuser"), makeContext("testuser"));
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.archetype).toEqual({ primary: "Explorer", code: "IE" });
    expect(json.narrativeSnapshots).toEqual({
      coreInsight: "A visionary thinker",
    });
    expect(json.schwartzAnchors).toEqual({
      top3: ["Benevolence", "Universalism", "Self-Direction"],
    });
    expect(json.socialLinks).toEqual({
      linkedin: "https://linkedin.com/in/test",
    });
    // Ensure private fields are not leaked
    expect(json.narrativeSnapshots.fullNarrative).toBeUndefined();
    expect(json.schwartzAnchors.all).toBeUndefined();
  });

  it("returns 500 on internal error", async () => {
    allowGuard();
    (getPublicProfileByUsername as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest("testuser"), makeContext("testuser"));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("INTERNAL_ERROR");
  });
});
