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

const mockSql = vi.fn();
vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";

// ── Helpers ──────────────────────────────────────────────────
function makeGetRequest(): Request {
  return new Request("http://localhost/api/coach-persona", { method: "GET" });
}

function makePatchRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/coach-persona", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests: GET ──────────────────────────────────────────────
describe("GET /api/coach-persona", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns persona when user has one", async () => {
    allowGuard({ id: "u1" });
    const mockPersona = {
      coachingStyle: "balanced",
      communicationStyle: "warm",
      responseDetail: "balanced",
      autoConfigured: false,
    };
    mockSql.mockResolvedValue([{ coachPersona: mockPersona }]);

    const res = await handler(makeGetRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.persona).toEqual(mockPersona);
  });

  it("returns null persona when user has none", async () => {
    allowGuard({ id: "u1" });
    mockSql.mockResolvedValue([{ coachPersona: null }]);

    const res = await handler(makeGetRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.persona).toBeNull();
  });
});

// ── Tests: PATCH ────────────────────────────────────────────
describe("PATCH /api/coach-persona", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.PATCH as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makePatchRequest());
    expect(res.status).toBe(401);
  });

  it("returns validation error when body is invalid", async () => {
    allowGuard({ id: "u1" });
    const errorResponse = new Response(
      JSON.stringify({ error: "VALIDATION_ERROR" }),
      { status: 400 },
    );
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: errorResponse,
    });

    const res = await handler(makePatchRequest({ coachingStyle: "invalid" }));
    expect(res.status).toBe(400);
  });

  it("merges update with existing persona and returns result", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { coachingStyle: "challenging" },
    });

    const existingPersona = {
      coachingStyle: "balanced",
      communicationStyle: "warm",
      responseDetail: "balanced",
      autoConfigured: true,
      configuredAt: "2025-01-01T00:00:00.000Z",
    };
    // First call: SELECT existing persona; Second call: UPDATE
    mockSql.mockResolvedValueOnce([{ coachPersona: existingPersona }]);
    mockSql.mockResolvedValueOnce([]);

    const res = await handler(
      makePatchRequest({ coachingStyle: "challenging" }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.persona.coachingStyle).toBe("challenging");
    expect(json.persona.communicationStyle).toBe("warm");
    expect(json.persona.autoConfigured).toBe(false);
    expect(json.persona.configuredAt).toBeDefined();
  });

  it("creates default persona when none exists", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { responseDetail: "thorough" },
    });

    // No existing persona
    mockSql.mockResolvedValueOnce([{ coachPersona: null }]);
    mockSql.mockResolvedValueOnce([]);

    const res = await handler(makePatchRequest({ responseDetail: "thorough" }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.persona.responseDetail).toBe("thorough");
    expect(json.persona.coachingStyle).toBe("balanced");
    expect(json.persona.autoConfigured).toBe(false);
  });
});
