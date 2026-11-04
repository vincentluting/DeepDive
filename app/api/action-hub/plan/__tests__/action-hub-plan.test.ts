import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/validation/parse-body", () => ({ parseBody: vi.fn() }));
vi.mock("@/lib/validation/api-schemas", () => ({
  generateActionPlanRequestSchema: {},
}));
vi.mock("@/lib/db/action-hub", () => ({
  getActiveActionPlan: vi.fn(),
  getActionItemsByPlan: vi.fn(),
  getMilestonesByPlan: vi.fn(),
  archiveActionPlan: vi.fn(),
}));
vi.mock("@/lib/action-hub/generate-action-plan", () => ({
  generateActionPlan: vi.fn(),
}));
vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn(),
}));
vi.mock("@/lib/db/profiles", () => ({
  getExercises: vi.fn(),
}));
vi.mock("@/lib/action-hub/guided-exercises", () => ({
  analyzeFlowPatterns: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  getActiveActionPlan,
  getActionItemsByPlan,
  getMilestonesByPlan,
} from "@/lib/db/action-hub";
import { generateActionPlan as _generateActionPlan } from "@/lib/action-hub/generate-action-plan";
import { getExercises } from "@/lib/db/profiles";

function allowGuard(user = { id: "u1" }) {
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
  return new Request("http://localhost/api/action-hub/plan", {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? "{}" : undefined,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/action-hub/plan", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(401);
  });

  it("returns null plan when none exists", async () => {
    allowGuard();
    (getActiveActionPlan as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const json = await (await handler(makeReq())).json();
    expect(json.plan).toBeNull();
    expect(json.items).toEqual([]);
  });

  it("returns plan with items and milestones", async () => {
    allowGuard();
    (getActiveActionPlan as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "plan-1",
      userId: "u1",
    });
    (getActionItemsByPlan as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "item-1", title: "Task 1" },
    ]);
    (getMilestonesByPlan as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "ms-1", title: "Milestone 1" },
    ]);

    const json = await (await handler(makeReq())).json();
    expect(json.plan.id).toBe("plan-1");
    expect(json.items).toHaveLength(1);
    expect(json.milestones).toHaveLength(1);
  });

  it("returns 500 on DB error", async () => {
    allowGuard();
    (getActiveActionPlan as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );
    expect((await handler(makeReq())).status).toBe(500);
  });
});

describe("POST /api/action-hub/plan", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq("POST"))).status).toBe(401);
  });

  it("returns 404 when report not found", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r-missing" },
    });
    const { sql } = await import("@/lib/db/connection");
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    expect((await handler(makeReq("POST"))).status).toBe(404);
  });

  it("passes guidance templates into generation and returns guidance fields", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "report-1" },
    });
    const { sql } = await import("@/lib/db/connection");
    (sql as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([
        {
          reportJson: {
            id: "report-1",
            assessmentId: "assessment-1",
            locale: "en",
            header: {},
            careerMatch: {},
          },
        },
      ])
      .mockResolvedValueOnce([{ resultJson: { archetype: { code: "R" } } }]);
    (getExercises as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getActiveActionPlan as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "plan-1", userId: "u1" });
    (_generateActionPlan as ReturnType<typeof vi.fn>).mockResolvedValue({
      planId: "plan-1",
      itemCount: 1,
      milestoneCount: 0,
      tier: "lite",
      llmEnriched: false,
    });
    (getActionItemsByPlan as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "item-1",
        planPhase: 1,
        recommendationReason: "Reason",
        completionOutcome: "Outcome",
      },
    ]);
    (getMilestonesByPlan as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const json = await (await handler(makeReq("POST"))).json();

    expect(_generateActionPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        guidanceTemplates: expect.objectContaining({
          reasonDefault: expect.any(String),
          outcomeDefault: expect.any(String),
        }),
      }),
    );
    expect(json.items[0]).toMatchObject({
      planPhase: 1,
      recommendationReason: "Reason",
      completionOutcome: "Outcome",
    });
  });
});
