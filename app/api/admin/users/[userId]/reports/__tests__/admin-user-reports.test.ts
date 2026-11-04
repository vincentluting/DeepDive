import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: { INTERNAL_ERROR: "INTERNAL_ERROR" },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/db/reports", () => ({
  getReportsByUserId: vi.fn(),
}));
vi.mock("@/lib/db/connection", () => ({ sql: vi.fn() }));

import { guardRoute } from "@/lib/api/api-guard";
import { getReportsByUserId } from "@/lib/db/reports";
import { sql } from "@/lib/db/connection";

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

const mockContext = { params: Promise.resolve({ userId: "user-1" }) };

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/users/[userId]/reports", () => {
  let handler: (
    r: Request,
    ctx?: { params: Promise<Record<string, string>> },
  ) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect(
      (
        await handler(
          new Request("http://localhost/api/admin/users/user-1/reports"),
          mockContext,
        )
      ).status,
    ).toBe(403);
  });

  it("returns merged and sorted reports (happy path)", async () => {
    allowAdmin();
    (getReportsByUserId as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "r1",
        createdAt: "2026-01-02",
        version: "3.0",
        reportJson: { archetype_label: "The Visionary" },
      },
    ]);
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "qd1",
        archetypeCode: "RE",
        archetypeLabel: "Visionary",
        exploreMode: "classic",
        createdAt: "2026-01-01",
      },
    ]);

    const json = await (
      await handler(
        new Request("http://localhost/api/admin/users/user-1/reports"),
        mockContext,
      )
    ).json();
    expect(json.reports).toHaveLength(2);
    // Sorted by date descending: deep dive (Jan 2) first, then quick dive (Jan 1)
    expect(json.reports[0].type).toBe("deep_dive");
    expect(json.reports[1].type).toBe("quick_dive");
  });

  it("returns 500 on DB error", async () => {
    allowAdmin();
    (getReportsByUserId as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );
    expect(
      (
        await handler(
          new Request("http://localhost/api/admin/users/user-1/reports"),
          mockContext,
        )
      ).status,
    ).toBe(500);
  });
});
