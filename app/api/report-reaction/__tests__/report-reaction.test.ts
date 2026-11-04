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

vi.mock("@/lib/db/reactions", () => ({
  saveReaction: vi.fn(),
  getReaction: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { saveReaction, getReaction } from "@/lib/db/reactions";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(
  method = "POST",
  url = "http://localhost/api/report-reaction",
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? "{}" : undefined,
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

// ── POST /api/report-reaction ────────────────────────────────
describe("POST /api/report-reaction", () => {
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

  it("saves reaction (happy path)", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r1", reaction: "resonates" },
    });
    (saveReaction as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "rx-1",
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.id).toBe("rx-1");

    expect(saveReaction).toHaveBeenCalledWith("r1", "resonates", "u1");
  });

  it("saves surprised reaction", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r2", reaction: "surprised" },
    });
    (saveReaction as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "rx-2",
    });

    await handler(makeRequest());
    expect(saveReaction).toHaveBeenCalledWith("r2", "surprised", "u1");
  });

  it("returns 500 on DB error", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r1", reaction: "skeptical" },
    });
    (saveReaction as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB error"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});

// ── GET /api/report-reaction ─────────────────────────────────
describe("GET /api/report-reaction", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const url = "http://localhost/api/report-reaction?reportId=r1";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(401);
  });

  it("returns 400 when reportId is missing", async () => {
    allowGuard({ id: "u1" });
    const res = await handler(
      makeRequest("GET", "http://localhost/api/report-reaction"),
    );
    expect(res.status).toBe(400);
  });

  it("returns existing reaction", async () => {
    allowGuard({ id: "u1" });
    (getReaction as ReturnType<typeof vi.fn>).mockResolvedValue("resonates");

    const url = "http://localhost/api/report-reaction?reportId=r1";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.reaction).toBe("resonates");
    expect(getReaction).toHaveBeenCalledWith("r1", "u1");
  });

  it("returns null when no reaction exists", async () => {
    allowGuard({ id: "u1" });
    (getReaction as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const url = "http://localhost/api/report-reaction?reportId=r1";
    const res = await handler(makeRequest("GET", url));
    const json = await res.json();

    expect(json.reaction).toBeNull();
  });

  it("returns 500 on DB error", async () => {
    allowGuard({ id: "u1" });
    (getReaction as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const url = "http://localhost/api/report-reaction?reportId=r1";
    const res = await handler(makeRequest("GET", url));
    expect(res.status).toBe(500);
  });
});
