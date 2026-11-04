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
vi.mock("@/lib/db/admin", () => ({
  getThesisExportData: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getThesisExportData } from "@/lib/db/admin";

function allowAdmin() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "admin-1", isAdmin: true },
  });
}
function blockGuard(status = 403) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Forbidden", { status }),
  });
}
function makeReq(params = ""): Request {
  return new Request(`http://localhost/api/admin/export/thesis-data${params}`);
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/export/thesis-data", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns anonymized CSV by default", async () => {
    allowAdmin();
    (getThesisExportData as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        userId: "u1",
        email: "test@test.com",
        registrationDate: "2026-01-01",
        country: "NL",
        careerStage: "early",
        researchGroup: "treatment",
        researchParticipantId: "P001",
        questionnaireCompleted: true,
        questionnaireLanguage: "en",
        questionnaireTotalTimeMs: 300000,
        pipelineVersion: "3.0",
      },
    ]);

    const res = await handler(makeReq());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const text = await res.text();
    expect(text).toContain("participantId");
    expect(text).not.toContain("email");
  });

  it("returns PII CSV only when includePii=true", async () => {
    allowAdmin();
    (getThesisExportData as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        userId: "u1",
        email: "test@test.com",
        registrationDate: "2026-01-01",
        researchParticipantId: "P001",
      },
    ]);

    const res = await handler(makeReq("?includePii=true"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("userId");
    expect(text).toContain("email");
  });

  it("passes date filters to the thesis export query", async () => {
    allowAdmin();
    (getThesisExportData as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await handler(makeReq("?from=2026-01-01&to=2026-02-01"));
    expect(res.status).toBe(200);
    expect(getThesisExportData).toHaveBeenCalledWith({
      from: new Date("2026-01-01").toISOString(),
      to: new Date("2026-02-01").toISOString(),
    });
  });

  it("returns 400 for invalid date filters", async () => {
    allowAdmin();

    const res = await handler(makeReq("?from=not-a-date"));
    expect(res.status).toBe(400);
    expect(getThesisExportData).not.toHaveBeenCalled();
  });

  it("returns 500 on DB error", async () => {
    allowAdmin();
    (getThesisExportData as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );
    expect((await handler(makeReq())).status).toBe(500);
  });
});
