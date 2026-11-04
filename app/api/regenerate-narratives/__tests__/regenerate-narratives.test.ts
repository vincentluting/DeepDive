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
    ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
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

vi.mock("@/lib/db/profiles", () => ({
  getProfileByAssessment: vi.fn(),
  updateProfileNarratives: vi.fn(),
}));

vi.mock("@/lib/db/cached", () => ({
  invalidateUserCache: vi.fn(),
}));

vi.mock("@/lib/profile-generation/generate-identity-narratives", () => ({
  generateIdentityNarratives: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  getProfileByAssessment,
  updateProfileNarratives,
} from "@/lib/db/profiles";
import { generateIdentityNarratives } from "@/lib/profile-generation/generate-identity-narratives";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/regenerate-narratives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assessmentId: "a1" }),
  });
}

function allowGuard(user: { id: string } = { id: "u1" }) {
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

const completeNarratives = {
  identitySummary: "Identity summary.",
  archetypeNarrative: "Archetype narrative.",
  bigFiveNarrative: "Big Five narrative.",
  valueNarrative: "Value narrative.",
  sjtTensionNarrative: "Tension narrative.",
  crossDimensionNarrative: "Cross-dimension narrative.",
  growthMapInsight: "Growth map insight.",
  meaningCompassNarrative: "Meaning compass narrative.",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/regenerate-narratives", () => {
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

  it("returns 404 when profile not found", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "a1", locale: "en" },
    });
    (getProfileByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(404);
  });

  it("returns success after regenerating narratives", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "a1", locale: "en" },
    });
    (getProfileByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "u1",
      algoSnapshot: { riasec: [1, 2, 3, 4, 5, 6] },
    });
    (generateIdentityNarratives as ReturnType<typeof vi.fn>).mockResolvedValue(
      completeNarratives,
    );
    (updateProfileNarratives as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(updateProfileNarratives).toHaveBeenCalled();
  });

  it("returns 500 when narrative generation fails", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "a1", locale: "en" },
    });
    (getProfileByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "u1",
      algoSnapshot: { riasec: [1, 2, 3, 4, 5, 6] },
    });
    (generateIdentityNarratives as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });

  it("returns 500 when narrative generation is incomplete", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "a1", locale: "en" },
    });
    (getProfileByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "u1",
      algoSnapshot: { riasec: [1, 2, 3, 4, 5, 6] },
    });
    // sjtTensionNarrative is required — its absence is what should trip the
    // incompleteness gate (meaningCompassNarrative is now lazy-generated and
    // therefore not required for completeness).
    (generateIdentityNarratives as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...completeNarratives,
      sjtTensionNarrative: "",
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
    expect(updateProfileNarratives).not.toHaveBeenCalled();
  });
});
