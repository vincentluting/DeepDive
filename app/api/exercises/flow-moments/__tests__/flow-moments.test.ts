import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    ASSESSMENT_NOT_FOUND: "ASSESSMENT_NOT_FOUND",
  },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/validation/parse-body", () => ({ parseBody: vi.fn() }));
vi.mock("@/lib/db/profiles", () => ({
  getExercises: vi.fn(),
  saveExercise: vi.fn(),
}));
vi.mock("@/lib/action-hub/guided-exercises", () => ({
  validateFlowMoments: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { getExercises, saveExercise } from "@/lib/db/profiles";
import { validateFlowMoments } from "@/lib/action-hub/guided-exercises";

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
  return new Request("http://localhost/api/exercises/flow-moments", {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? "{}" : undefined,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/exercises/flow-moments", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(401);
  });

  it("returns flow moments data", async () => {
    allowGuard();
    (getExercises as ReturnType<typeof vi.fn>).mockResolvedValue({
      flowMoments: { moments: ["a", "b"] },
    });
    const json = await (await handler(makeReq())).json();
    expect(json.flowMoments.moments).toHaveLength(2);
  });

  it("returns null when no exercises", async () => {
    allowGuard();
    (getExercises as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const json = await (await handler(makeReq())).json();
    expect(json.flowMoments).toBeNull();
  });
});

describe("POST /api/exercises/flow-moments", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("saves flow moments (happy path)", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { moments: ["coding", "teaching", "writing"] },
    });
    (validateFlowMoments as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (saveExercise as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const json = await (await handler(makeReq("POST"))).json();
    expect(json.success).toBe(true);
  });

  it("returns 400 on validation error", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { moments: [] },
    });
    (validateFlowMoments as ReturnType<typeof vi.fn>).mockReturnValue(
      "Need at least 3 moments",
    );

    expect((await handler(makeReq("POST"))).status).toBe(400);
  });

  it("returns 404 when no profile", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { moments: ["a", "b", "c"] },
    });
    (validateFlowMoments as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (saveExercise as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    expect((await handler(makeReq("POST"))).status).toBe(404);
  });
});
