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
vi.mock("@/lib/validation/parse-body", () => ({ parseBody: vi.fn() }));
vi.mock("@/lib/db/career-directions", () => ({
  listCareerDirections: vi.fn(),
  createCareerDirection: vi.fn(),
  updateCareerDirection: vi.fn(),
  deactivateCareerDirection: vi.fn(),
  reactivateCareerDirection: vi.fn(),
  getCareerDirectionStats: vi.fn(),
  batchToggleActive: vi.fn(),
}));
vi.mock("@/lib/career-matching/career-pool", () => ({
  invalidateCareerPoolCache: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  listCareerDirections,
  createCareerDirection,
  getCareerDirectionStats,
} from "@/lib/db/career-directions";

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
  return new Request(`http://localhost/api/admin/career-directions${params}`);
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/career-directions", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns stats when stats=true", async () => {
    allowAdmin();
    (getCareerDirectionStats as ReturnType<typeof vi.fn>).mockResolvedValue({
      total: 100,
    });

    const json = await (await handler(makeReq("?stats=true"))).json();
    expect(json.stats.total).toBe(100);
  });

  it("returns paginated list (happy path)", async () => {
    allowAdmin();
    (listCareerDirections as ReturnType<typeof vi.fn>).mockResolvedValue({
      rows: [{ id: "cd-1" }],
      total: 1,
    });

    const json = await (await handler(makeReq())).json();
    expect(json.rows).toHaveLength(1);
    expect(json.total).toBe(1);
  });
});

describe("POST /api/admin/career-directions", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("creates career direction (happy path)", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: "new-cd" },
    });
    (createCareerDirection as ReturnType<typeof vi.fn>).mockResolvedValue(
      "new-cd",
    );

    const res = await handler(
      new Request("http://localhost/api/admin/career-directions", {
        method: "POST",
      }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("new-cd");
  });
});
