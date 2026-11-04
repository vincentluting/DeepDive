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

vi.mock("@/lib/db/profiles", () => ({
  getProfile: vi.fn(),
}));

vi.mock("@/lib/db/user-data", () => ({
  getUserDataForExport: vi.fn(),
}));

vi.mock("@/lib/data-export/json-resume-mapper", () => ({
  assembleExport: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getProfile } from "@/lib/db/profiles";
import { getUserDataForExport } from "@/lib/db/user-data";
import { assembleExport } from "@/lib/data-export/json-resume-mapper";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/user-data/export", {
    method: "POST",
  });
}

function allowGuard(user = { id: "u1", name: "Test", email: "t@example.com" }) {
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
describe("POST /api/user-data/export", () => {
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

  it("exports user data as downloadable JSON (happy path)", async () => {
    allowGuard();
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue({
      archetype: { primary: "Narrator" },
    });
    (getUserDataForExport as ReturnType<typeof vi.fn>).mockResolvedValue({
      assessmentRows: [{ id: "a1" }],
      reportRows: [{ id: "r1" }],
      quickDiveRows: [],
      coachingRows: [],
      partialFailures: [],
    });
    (assembleExport as ReturnType<typeof vi.fn>).mockReturnValue({
      basics: { name: "Test" },
      assessments: [{ id: "a1" }],
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Content-Disposition")).toContain(
      "deep-dive-export-",
    );

    const body = await res.text();
    const json = JSON.parse(body);
    expect(json.basics.name).toBe("Test");
  });

  it("includes warnings when partial failures occur", async () => {
    allowGuard();
    (getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getUserDataForExport as ReturnType<typeof vi.fn>).mockResolvedValue({
      assessmentRows: [],
      reportRows: [],
      quickDiveRows: [],
      coachingRows: [],
      partialFailures: ["coaching"],
    });
    (assembleExport as ReturnType<typeof vi.fn>).mockReturnValue({
      basics: { name: "Test" },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = JSON.parse(await res.text());
    expect(json._warnings).toHaveLength(1);
    expect(json._warnings[0]).toContain("coaching");
  });

  it("returns 500 on unexpected error", async () => {
    allowGuard();
    (getProfile as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
