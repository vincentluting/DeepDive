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

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/report-reaction-trigger", {
    method: "POST",
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
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/report-reaction-trigger", () => {
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

  it("returns trigger context for resonates reaction", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r1", reaction: "resonates" },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.triggerContext).toBe("report_reaction_resonates");
  });

  it("returns trigger context for surprised reaction", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r1", reaction: "surprised" },
    });

    const res = await handler(makeRequest());
    const json = await res.json();
    expect(json.triggerContext).toBe("report_reaction_surprised");
  });

  it("returns trigger context for skeptical reaction", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r1", reaction: "skeptical" },
    });

    const res = await handler(makeRequest());
    const json = await res.json();
    expect(json.triggerContext).toBe("report_reaction_skeptical");
  });

  it("returns 500 on unexpected error", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("unexpected"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
