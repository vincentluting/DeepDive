import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────

// next/server's after() is a no-op in tests — callbacks run in background on Vercel
vi.mock("next/server", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/server")>();
  return { ...original, after: vi.fn() };
});

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
    UNAUTHORIZED: "UNAUTHORIZED",
    ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
    CONFLICT: "CONFLICT",
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

vi.mock("@/lib/access/check-access", () => ({
  canAccessFeature: vi.fn(),
}));

vi.mock("@/lib/profile-generation/generate-profile", () => ({
  generateProfile: vi.fn(),
}));

vi.mock("@/lib/profile-generation/generate-identity-narratives", () => ({
  generateIdentityNarratives: vi.fn(),
}));

vi.mock("@/lib/db/assessments", () => ({
  getEffectiveAssessment: vi.fn(),
}));

vi.mock("@/lib/db/profiles", () => ({
  saveProfile: vi.fn(),
  getProfile: vi.fn(),
  getProfileByAssessment: vi.fn(),
  updateProfileNarratives: vi.fn(),
}));

vi.mock("@/lib/db/journey", () => ({
  getJourneyState: vi.fn(),
}));

vi.mock("@/lib/db/assessment-lifecycle", () => ({
  afterProfileGenerated: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/achievements/engine", () => ({
  checkAchievements: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/coaching/trigger-coach-message", () => ({
  triggerCoachMessage: vi.fn().mockResolvedValue(undefined),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { canAccessFeature } from "@/lib/access/check-access";
import { generateProfile } from "@/lib/profile-generation/generate-profile";
import { generateIdentityNarratives } from "@/lib/profile-generation/generate-identity-narratives";
import { getEffectiveAssessment } from "@/lib/db/assessments";
import {
  saveProfile,
  getProfile,
  getProfileByAssessment,
} from "@/lib/db/profiles";
import { getJourneyState } from "@/lib/db/journey";
import { afterProfileGenerated } from "@/lib/db/assessment-lifecycle";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(
  method = "POST",
  url = "http://localhost/api/generate-profile",
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? "{}" : undefined,
  });
}

function allowGuard(
  user: { id: string; cohort?: string | null } | null = {
    id: "u1",
    cohort: "research-2026",
  },
) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 429) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Blocked", { status }),
  });
}

const mockProfile = {
  userId: "u1",
  assessmentId: "a1",
  archetype: { primary: "Narrator", secondary: "Explorer" },
  algoSnapshot: { riasec: { R: 0.5 } },
  narrativeSnapshots: {},
};

const completeNarrativeSnapshots = {
  identitySummary: "A grounded narrative that is ready to display.",
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

// ── POST /api/generate-profile ──────────────────────────────
describe("POST /api/generate-profile", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns blocked response when guard blocks", async () => {
    blockGuard(429);
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns 403 when user lacks entitlement", async () => {
    allowGuard({ id: "u1", cohort: null });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await handler(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns 400 when validation fails", async () => {
    allowGuard();
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 404 when assessment not found", async () => {
    allowGuard();
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "a-missing", locale: "en" },
    });
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(404);
  });

  it("generates profile and saves (happy path)", async () => {
    allowGuard({ id: "u1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "a1", locale: "en" },
    });
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
      version: "3.0",
    });
    (generateProfile as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProfile,
    });
    (saveProfile as ReturnType<typeof vi.fn>).mockResolvedValue("p-1");
    (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
      "profile_generated",
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.id).toBe("p-1");
    expect(json.archetype.primary).toBe("Narrator");
    // narrativeStatus should be "generating" since narratives run in after()
    expect(json.narrativeStatus).toBe("generating");

    expect(generateProfile).toHaveBeenCalledTimes(1);
    expect(saveProfile).toHaveBeenCalledTimes(1);
    // LLM narratives are NOT called synchronously — they run in after()
    expect(generateIdentityNarratives).not.toHaveBeenCalled();
    expect(afterProfileGenerated).toHaveBeenCalledWith("u1");
  });

  it("returns narrativeStatus 'ready' when narratives already exist", async () => {
    allowGuard({ id: "u1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "a1", locale: "en" },
    });
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
    });
    (generateProfile as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProfile,
      narrativeSnapshots: {
        ...completeNarrativeSnapshots,
        populatedAt: "2026-01-01T00:00:00Z",
      },
    });
    (saveProfile as ReturnType<typeof vi.fn>).mockResolvedValue("p-2");
    (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
      "profile_generated",
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.narrativeStatus).toBe("ready");
  });

  it("returns narrativeStatus 'failed' when a previous narrative attempt failed", async () => {
    allowGuard({ id: "u1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "a1", locale: "en" },
    });
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
    });
    (generateProfile as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProfile,
      narrativeSnapshots: { failedAt: "2026-01-01T00:00:00Z" },
    });
    (saveProfile as ReturnType<typeof vi.fn>).mockResolvedValue("p-3");
    (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
      "profile_generated",
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.narrativeStatus).toBe("failed");
  });

  it("returns 200 when journey transition does not reach profile_generated", async () => {
    allowGuard({ id: "u1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "a1", locale: "en" },
    });
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
      version: "3.0",
    });
    (generateProfile as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProfile,
    });
    (saveProfile as ReturnType<typeof vi.fn>).mockResolvedValue("p-3");
    (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
      "not_started",
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.id).toBe("p-3");
  });

  it("returns 200 when journey advance throws after the profile is saved", async () => {
    allowGuard({ id: "u1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "a1", locale: "en" },
    });
    (getEffectiveAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
      version: "3.0",
    });
    (generateProfile as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockProfile,
    });
    (saveProfile as ReturnType<typeof vi.fn>).mockResolvedValue("p-4");
    (afterProfileGenerated as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("journey DB write failed"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.id).toBe("p-4");
  });

  it("returns 500 on unexpected error", async () => {
    allowGuard();
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("unexpected"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});

// ── GET /api/generate-profile ───────────────────────────────
describe("GET /api/generate-profile", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns blocked response when guard blocks", async () => {
    blockGuard(401);
    const res = await handler(
      makeRequest("GET", "http://localhost/api/generate-profile?userId=u1"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when neither userId nor assessmentId provided", async () => {
    allowGuard({ id: "u1" });
    const res = await handler(
      makeRequest("GET", "http://localhost/api/generate-profile"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when requesting another user profile", async () => {
    allowGuard({ id: "u1" });
    const res = await handler(
      makeRequest(
        "GET",
        "http://localhost/api/generate-profile?userId=other-user",
      ),
    );
    expect(res.status).toBe(404);
  });

  it("returns profile by userId (happy path)", async () => {
    allowGuard({ id: "u1" });
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockProfile);

    const res = await handler(
      makeRequest("GET", "http://localhost/api/generate-profile?userId=u1"),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.archetype.primary).toBe("Narrator");
  });

  it("falls back to assessmentId lookup when userId returns null", async () => {
    allowGuard({ id: "u1" });
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getProfileByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockProfile,
      userId: "u1",
    });

    const res = await handler(
      makeRequest(
        "GET",
        "http://localhost/api/generate-profile?userId=u1&assessmentId=a1",
      ),
    );
    expect(res.status).toBe(200);
    expect(getProfileByAssessment).toHaveBeenCalledWith("a1");
  });

  it("returns 404 when profile not found by any lookup", async () => {
    allowGuard({ id: "u1" });
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getProfileByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const res = await handler(
      makeRequest(
        "GET",
        "http://localhost/api/generate-profile?userId=u1&assessmentId=a1",
      ),
    );
    expect(res.status).toBe(404);
  });

  it("returns narrativeStatus 'failed' on GET when narrative generation previously failed", async () => {
    allowGuard({ id: "u1" });
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockProfile,
      narrativeSnapshots: { failedAt: "2026-01-01T00:00:00Z" },
    });

    const res = await handler(
      makeRequest("GET", "http://localhost/api/generate-profile?userId=u1"),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.narrativeStatus).toBe("failed");
  });
});
