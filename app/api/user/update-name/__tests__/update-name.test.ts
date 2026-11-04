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
function makeRequest(): Request {
  return new Request("http://localhost/api/user/update-name", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: "{}",
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
  mockSql.mockResolvedValue([]);
});

// ── Tests ────────────────────────────────────────────────────
describe("PATCH /api/user/update-name", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.PATCH as unknown as (req: Request) => Promise<Response>;
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

  it("updates name successfully (happy path)", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { name: "New Name" },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(mockSql).toHaveBeenCalled();
  });

  it("returns 500 on DB error", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { name: "Test" },
    });
    mockSql.mockRejectedValue(new Error("DB error"));

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
