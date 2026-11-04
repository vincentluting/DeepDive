import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/db/nps", () => ({
  saveNPS: vi.fn(),
  getNPS: vi.fn(),
}));

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
  },
  createErrorResponse: vi.fn((code: string, msg: string, status: number) => {
    return new Response(JSON.stringify({ error: code, message: msg }), {
      status,
    });
  }),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn().mockResolvedValue(undefined),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { saveNPS, getNPS } from "@/lib/db/nps";
import { parseBody } from "@/lib/validation/parse-body";
import { trackFunnelEvent } from "@/lib/analytics/funnel";

// ── Helpers ──────────────────────────────────────────────────
function makePostRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/report-nps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(reportId: string): Request {
  return new Request(`http://localhost/api/report-nps?reportId=${reportId}`, {
    method: "GET",
  });
}

function allowGuard(user: { id: string } | null = null) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/report-nps", () => {
  let postHandler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    postHandler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("saves NPS score with pmfResponse", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        reportId: "r1",
        score: 9,
        pmfResponse: "very_disappointed",
        locale: "en",
      },
    });
    (saveNPS as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "nps-1" });

    const res = await postHandler(makePostRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.id).toBe("nps-1");

    expect(saveNPS).toHaveBeenCalledWith("r1", 9, {
      userId: "u1",
      pmfResponse: "very_disappointed",
      feedback: null,
      locale: "en",
    });
  });

  it("saves NPS score without pmfResponse", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r1", score: 7, feedback: "Great report" },
    });
    (saveNPS as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "nps-2" });

    const res = await postHandler(makePostRequest());
    expect(res.status).toBe(200);

    expect(saveNPS).toHaveBeenCalledWith("r1", 7, {
      userId: "u1",
      pmfResponse: null,
      feedback: "Great report",
      locale: null,
    });
  });

  it("tracks report_nps_submitted funnel event on success", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r1", score: 8, feedback: "Loved it" },
    });
    (saveNPS as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "nps-3" });

    await postHandler(makePostRequest());

    expect(trackFunnelEvent).toHaveBeenCalledWith("report_nps_submitted", {
      userId: "u1",
      metadata: { reportId: "r1", score: 8, hasFeedback: true },
    });
  });

  it("does not track funnel event when saveNPS fails", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r1", score: 5 },
    });
    (saveNPS as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db down"),
    );

    await postHandler(makePostRequest());

    expect(trackFunnelEvent).not.toHaveBeenCalled();
  });

  it("returns 500 on DB failure", async () => {
    allowGuard({ id: "u1" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { reportId: "r1", score: 5 },
    });
    (saveNPS as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db down"),
    );

    const res = await postHandler(makePostRequest());
    expect(res.status).toBe(500);
  });
});

describe("GET /api/report-nps", () => {
  let getHandler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    getHandler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns existing NPS with pmfResponse", async () => {
    allowGuard({ id: "u1" });
    (getNPS as ReturnType<typeof vi.fn>).mockResolvedValue({
      score: 9,
      pmfResponse: "very_disappointed",
      feedback: null,
    });

    const res = await getHandler(makeGetRequest("r1"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.nps.score).toBe(9);
    expect(json.nps.pmfResponse).toBe("very_disappointed");
  });

  it("returns 400 when reportId is missing", async () => {
    allowGuard({ id: "u1" });
    const req = new Request("http://localhost/api/report-nps", {
      method: "GET",
    });
    const res = await getHandler(req);
    expect(res.status).toBe(400);
  });

  it("returns null NPS for new user", async () => {
    allowGuard({ id: "u1" });
    (getNPS as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await getHandler(makeGetRequest("r1"));
    const json = await res.json();
    expect(json.nps).toBeNull();
  });
});
