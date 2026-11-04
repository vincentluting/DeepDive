import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
  },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/validation/parse-body", () => ({ parseBody: vi.fn() }));
vi.mock("@/lib/validation/api-schemas", () => ({
  prePostAssessmentSchema: {},
}));
vi.mock("@/lib/db/pre-post-assessment", () => ({
  savePrePostAssessment: vi.fn(),
  getPrePostAssessments: vi.fn(),
}));

vi.mock("@/lib/db/coaching", () => ({
  getCoachingSessionCount: vi.fn(),
}));

vi.mock("@/lib/db/journey", () => ({
  getJourneyState: vi.fn(),
}));

// Mock the consent-records module so the route's `recordResearchConsent`
// import doesn't accidentally hit `sql` from `@/lib/db/connection`.
vi.mock("@/lib/db/consent-records", () => ({
  hasResearchConsent: vi.fn().mockResolvedValue(true),
  recordResearchConsent: vi.fn().mockResolvedValue({
    wasInserted: false,
    consentAt: new Date(),
  }),
}));

// Also short-circuit the analytics module (route fires a funnel event).
vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn().mockResolvedValue(undefined),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { getJourneyState } from "@/lib/db/journey";
import { getCoachingSessionCount } from "@/lib/db/coaching";
import {
  savePrePostAssessment,
  getPrePostAssessments,
} from "@/lib/db/pre-post-assessment";

function allowGuard(
  user: { id: string; researchGroup?: string | null } = { id: "u1" },
) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}
function blockGuard() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status: 401 }),
  });
}
function makeReq(method = "GET"): Request {
  return new Request("http://localhost/api/pre-post-assessment", {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? "{}" : undefined,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/pre-post-assessment", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(401);
  });

  it("returns pre/post data for authenticated user", async () => {
    allowGuard();
    (getPrePostAssessments as ReturnType<typeof vi.fn>).mockResolvedValue({
      pre: { id: "a1" },
      postImmediate: null,
      post1Week: null,
    });
    const json = await (await handler(makeReq())).json();
    expect(json.pre.id).toBe("a1");
    expect(json.postImmediate).toBeNull();
  });

  it("returns nulls when no user id (anonymous)", async () => {
    (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
      blocked: false,
      user: {},
    });
    const json = await (await handler(makeReq())).json();
    expect(json.pre).toBeNull();
  });
});

describe("POST /api/pre-post-assessment", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq("POST"))).status).toBe(401);
  });

  it("saves pre assessment (happy path)", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        assessmentType: "pre",
        sccResponses: { q1: 3 },
      },
    });
    (getPrePostAssessments as ReturnType<typeof vi.fn>).mockResolvedValue({
      pre: null,
    });
    (savePrePostAssessment as ReturnType<typeof vi.fn>).mockResolvedValue("a1");

    const json = await (await handler(makeReq("POST"))).json();
    expect(json.success).toBe(true);
    expect(json.id).toBe("a1");
  });

  it("rejects duplicate pre assessment", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        assessmentType: "pre",
        sccResponses: {},
      },
    });
    (getPrePostAssessments as ReturnType<typeof vi.fn>).mockResolvedValue({
      pre: { id: "existing" },
    });

    expect((await handler(makeReq("POST"))).status).toBe(400);
  });

  it("rejects post_immediate without pre", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        assessmentType: "post_immediate",
        sccResponses: {},
      },
    });
    (getPrePostAssessments as ReturnType<typeof vi.fn>).mockResolvedValue({
      pre: null,
      postImmediate: null,
    });

    expect((await handler(makeReq("POST"))).status).toBe(400);
  });

  // ── Bug-log #018: T1 gate must enforce Deep Dive completion for research users ──

  it("rejects T1 from research user who hasn't reached deep_dive_complete (bug-log #018)", async () => {
    allowGuard({ id: "u1", researchGroup: "immersive" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        assessmentType: "post_immediate",
        sccResponses: {},
        cdcResponses: { cdc1: 3, cdc2: 3, cdc3: 3, cdc4: 3, cdc5: 3 },
      },
    });
    (getPrePostAssessments as ReturnType<typeof vi.fn>).mockResolvedValue({
      pre: { id: "t0" },
      postImmediate: null,
    });
    // User has T0 + some coaching, but DD never completed
    (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
      "quick_dive_complete",
    );
    (getCoachingSessionCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const res = await handler(makeReq("POST"));
    expect(res.status).toBe(400);
    // Crucial: T1 was NOT saved.
    expect(savePrePostAssessment).not.toHaveBeenCalled();
    // Regression guard: DD gate must run BEFORE coaching count. If a future
    // commit reorders the checks, this assertion fails and forces re-review.
    expect(getCoachingSessionCount).not.toHaveBeenCalled();
  });

  it("rejects T1 from research user who completed DD but no report (bug-log #018 codex final tightening)", async () => {
    // Codex final review: the consent text promises T1 happens after report
    // + coaching, so `deep_dive_complete` alone is not enough — the gate must
    // require `report_generated`. This test pins that boundary.
    allowGuard({ id: "u1", researchGroup: "immersive" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        assessmentType: "post_immediate",
        sccResponses: {},
        cdcResponses: { cdc1: 3, cdc2: 3, cdc3: 3, cdc4: 3, cdc5: 3 },
      },
    });
    (getPrePostAssessments as ReturnType<typeof vi.fn>).mockResolvedValue({
      pre: { id: "t0" },
      postImmediate: null,
    });
    (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
      "deep_dive_complete",
    );

    const res = await handler(makeReq("POST"));
    expect(res.status).toBe(400);
    expect(savePrePostAssessment).not.toHaveBeenCalled();
    expect(getCoachingSessionCount).not.toHaveBeenCalled();
  });

  it("allows T1 from research user who completed DD + report + coaching (bug-log #018)", async () => {
    allowGuard({ id: "u1", researchGroup: "immersive" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        assessmentType: "post_immediate",
        sccResponses: {},
        cdcResponses: { cdc1: 3, cdc2: 3, cdc3: 3, cdc4: 3, cdc5: 3 },
      },
    });
    (getPrePostAssessments as ReturnType<typeof vi.fn>).mockResolvedValue({
      pre: { id: "t0" },
      postImmediate: null,
    });
    // User has completed DD, profile, report, and at least 1 coaching session
    (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
      "report_generated",
    );
    (getCoachingSessionCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (savePrePostAssessment as ReturnType<typeof vi.fn>).mockResolvedValue("t1");

    const res = await handler(makeReq("POST"));
    expect(res.status).toBe(200);
  });

  it("non-research user is not subject to DD gate at T1 (bug-log #018)", async () => {
    // researchGroup is null → not a thesis participant
    allowGuard({ id: "u1", researchGroup: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        assessmentType: "post_immediate",
        sccResponses: {},
        cdcResponses: { cdc1: 3, cdc2: 3, cdc3: 3, cdc4: 3, cdc5: 3 },
      },
    });
    (getPrePostAssessments as ReturnType<typeof vi.fn>).mockResolvedValue({
      pre: { id: "t0" },
      postImmediate: null,
    });
    (savePrePostAssessment as ReturnType<typeof vi.fn>).mockResolvedValue("t1");

    const res = await handler(makeReq("POST"));
    expect(res.status).toBe(200);
    // Non-research users skip the DD gate AND the coaching gate.
    expect(getJourneyState).not.toHaveBeenCalled();
    expect(getCoachingSessionCount).not.toHaveBeenCalled();
  });
});
