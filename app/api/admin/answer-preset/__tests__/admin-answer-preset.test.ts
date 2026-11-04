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
vi.mock("@/lib/db/admin-presets", () => ({
  getAdminPreset: vi.fn(),
  saveAdminPreset: vi.fn(),
  deleteAdminPreset: vi.fn(),
}));
vi.mock("@/lib/db/connection", () => ({ sql: vi.fn() }));

import { guardRoute } from "@/lib/api/api-guard";
import { getAdminPreset, deleteAdminPreset } from "@/lib/db/admin-presets";

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

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/answer-preset", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect(
      (await handler(new Request("http://localhost/api/admin/answer-preset")))
        .status,
    ).toBe(403);
  });

  it("returns preset info (happy path)", async () => {
    allowAdmin();
    (getAdminPreset as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "p1",
      name: "My Answers",
      quickDiveAnswers: { scores: {} },
      deepDiveAnswers: null,
      locale: "en",
      updatedAt: "2026-01-01",
    });

    const json = await (
      await handler(new Request("http://localhost/api/admin/answer-preset"))
    ).json();
    expect(json.preset.id).toBe("p1");
    expect(json.preset.hasQuickDive).toBe(true);
    expect(json.preset.hasDeepDive).toBe(false);
  });
});

describe("DELETE /api/admin/answer-preset", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).DELETE as unknown as typeof handler;
  });

  it("deletes preset (happy path)", async () => {
    allowAdmin();
    (deleteAdminPreset as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const json = await (
      await handler(
        new Request("http://localhost/api/admin/answer-preset", {
          method: "DELETE",
        }),
      )
    ).json();
    expect(json.deleted).toBe(true);
    expect(deleteAdminPreset).toHaveBeenCalledWith("admin-1");
  });
});
