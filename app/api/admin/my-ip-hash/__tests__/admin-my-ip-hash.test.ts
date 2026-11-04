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
vi.mock("@/lib/analytics/page-tracking", () => ({
  hashIPAddress: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { hashIPAddress } from "@/lib/analytics/page-tracking";

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

describe("GET /api/admin/my-ip-hash", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect(
      (await handler(new Request("http://localhost/api/admin/my-ip-hash")))
        .status,
    ).toBe(403);
  });

  it("returns ipHash=null when no IP header", async () => {
    allowAdmin();
    const json = await (
      await handler(new Request("http://localhost/api/admin/my-ip-hash"))
    ).json();
    expect(json.ipHash).toBeNull();
  });

  it("returns ipHash and isExcluded (happy path)", async () => {
    allowAdmin();
    (hashIPAddress as ReturnType<typeof vi.fn>).mockResolvedValue("abc123");
    process.env.EXCLUDED_IP_HASHES = "abc123,def456";

    const req = new Request("http://localhost/api/admin/my-ip-hash");
    // Workaround: Next.js reads x-forwarded-for
    Object.defineProperty(req, "headers", {
      value: new Headers({ "x-forwarded-for": "1.2.3.4" }),
    });

    const json = await (await handler(req)).json();
    expect(json.ipHash).toBe("abc123");
    expect(json.isExcluded).toBe(true);
    expect(hashIPAddress).toHaveBeenCalledWith("1.2.3.4");
  });
});
