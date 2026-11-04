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
vi.mock("@/lib/validation/parse-body", () => ({ parseBody: vi.fn() }));
vi.mock("@/lib/db/analytics-visits", () => ({
  getNotableVisitors: vi.fn(),
  scanNotableVisitors: vi.fn(),
  dismissNotableVisitor: vi.fn(),
}));
vi.mock("@/lib/validation/api-schemas", () => ({
  notablePatchSchema: {},
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  getNotableVisitors,
  scanNotableVisitors,
  dismissNotableVisitor,
} from "@/lib/db/analytics-visits";

function allowAdmin() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "admin-1", isAdmin: true },
  });
}
function blockGuard() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Forbidden", { status: 403 }),
  });
}
function makeReq(method = "GET"): Request {
  return new Request("http://localhost/api/admin/notable", {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "PATCH" ? "{}" : undefined,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/admin/notable", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(403);
  });

  it("returns notable visitors", async () => {
    allowAdmin();
    (getNotableVisitors as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ipHash: "abc", reason: "recruiter" },
    ]);
    const json = await (await handler(makeReq())).json();
    expect(json.visitors).toHaveLength(1);
  });
});

describe("POST /api/admin/notable", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    expect((await handler(makeReq("POST"))).status).toBe(403);
  });

  it("triggers scan and returns count", async () => {
    allowAdmin();
    (scanNotableVisitors as ReturnType<typeof vi.fn>).mockResolvedValue(3);
    const json = await (await handler(makeReq("POST"))).json();
    expect(json.success).toBe(true);
    expect(json.newCount).toBe(3);
  });
});

describe("PATCH /api/admin/notable", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).PATCH as unknown as typeof handler;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    expect((await handler(makeReq("PATCH"))).status).toBe(403);
  });

  it("dismisses notable visitor", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ipHash: "abc123" },
    });
    (dismissNotableVisitor as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const json = await (await handler(makeReq("PATCH"))).json();
    expect(json.success).toBe(true);
    expect(dismissNotableVisitor).toHaveBeenCalledWith("abc123");
  });
});
