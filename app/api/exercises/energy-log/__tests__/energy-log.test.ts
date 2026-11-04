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
  validateEnergyEntry: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { getExercises, saveExercise } from "@/lib/db/profiles";
import { validateEnergyEntry } from "@/lib/action-hub/guided-exercises";

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
  return new Request("http://localhost/api/exercises/energy-log", {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? "{}" : undefined,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/exercises/energy-log", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(401);
  });

  it("returns energy log data", async () => {
    allowGuard();
    (getExercises as ReturnType<typeof vi.fn>).mockResolvedValue({
      energyLog: { entries: [{ day: 1 }] },
    });
    const json = await (await handler(makeReq())).json();
    expect(json.energyLog.entries).toHaveLength(1);
  });

  it("returns null when no exercises", async () => {
    allowGuard();
    (getExercises as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const json = await (await handler(makeReq())).json();
    expect(json.energyLog).toBeNull();
  });
});

describe("POST /api/exercises/energy-log", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq("POST"))).status).toBe(401);
  });

  it("saves entry and returns progress", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        day: 1,
        overallEnergy: "high",
        activities: ["coding"],
        notes: "",
      },
    });
    (validateEnergyEntry as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (getExercises as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (saveExercise as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const json = await (await handler(makeReq("POST"))).json();
    expect(json.success).toBe(true);
    expect(json.day).toBe(1);
    expect(json.totalDays).toBe(1);
    expect(json.isComplete).toBe(false);
  });

  it("returns 400 on validation error", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { day: 1, overallEnergy: "invalid" },
    });
    (validateEnergyEntry as ReturnType<typeof vi.fn>).mockReturnValue(
      "Invalid energy level",
    );

    expect((await handler(makeReq("POST"))).status).toBe(400);
  });

  it("returns 404 when no profile found", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { day: 1, overallEnergy: "high" },
    });
    (validateEnergyEntry as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (getExercises as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (saveExercise as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    expect((await handler(makeReq("POST"))).status).toBe(404);
  });
});
