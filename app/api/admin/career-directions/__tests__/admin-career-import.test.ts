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
vi.mock("@/lib/db/career-directions", () => ({
  bulkUpsertCareerDirections: vi.fn(),
}));
vi.mock("@/lib/career-matching/career-pool", () => ({
  invalidateCareerPoolCache: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { bulkUpsertCareerDirections } from "@/lib/db/career-directions";

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

describe("POST /api/admin/career-directions/import", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../import/route"))
      .POST as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    const fd = new FormData();
    fd.append("file", new File(["test"], "test.csv"));
    const res = await handler(
      new Request("http://localhost/api/admin/career-directions/import", {
        method: "POST",
        body: fd,
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when no file provided", async () => {
    allowAdmin();
    // Mock formData to return empty
    const req = new Request(
      "http://localhost/api/admin/career-directions/import",
      {
        method: "POST",
      },
    );
    // Override formData
    req.formData = vi.fn().mockResolvedValue(new FormData());

    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("imports CSV (happy path)", async () => {
    allowAdmin();
    (bulkUpsertCareerDirections as ReturnType<typeof vi.fn>).mockResolvedValue({
      upserted: 2,
      skipped: 0,
    });

    const csvContent = [
      "id,source,titleEn,titleZh,R,I,A,S,E,C,alignedValues,annotationSource,annotationConfidence",
      "cd-1,curated,Engineer,工程师,80,60,40,30,20,10,Achievement,expert-heuristic,expert-estimated",
      "cd-2,curated,Designer,设计师,30,40,80,50,20,10,Self-Direction,expert-heuristic,expert-estimated",
    ].join("\n");

    const fd = new FormData();
    fd.append("file", new File([csvContent], "import.csv"));

    const req = new Request(
      "http://localhost/api/admin/career-directions/import",
      {
        method: "POST",
      },
    );
    req.formData = vi.fn().mockResolvedValue(fd);

    const json = await (await handler(req)).json();
    expect(json.success).toBe(true);
    expect(json.imported).toBe(2);
  });

  it("flags out-of-vocabulary industries as warnings without rejecting", async () => {
    allowAdmin();

    const csvContent = [
      "id,source,titleEn,titleZh,R,I,A,S,E,C,alignedValues,industries,annotationSource,annotationConfidence",
      // 'Technology' (capitalized) is not in the canonical vocabulary; 'technology' is.
      "cd-bad,curated,Engineer,工程师,80,60,40,30,20,10,Achievement,Technology; SaaS,expert-heuristic,expert-estimated",
      "cd-ok,curated,Designer,设计师,30,40,80,50,20,10,Self-Direction,technology; design,expert-heuristic,expert-estimated",
    ].join("\n");

    const fd = new FormData();
    fd.append("file", new File([csvContent], "import.csv"));
    fd.append("dryRun", "true");

    const req = new Request(
      "http://localhost/api/admin/career-directions/import",
      { method: "POST" },
    );
    req.formData = vi.fn().mockResolvedValue(fd);

    const json = await (await handler(req)).json();
    expect(json.dryRun).toBe(true);
    expect(json.errors).toHaveLength(0);
    expect(json.warnings).toEqual([
      { id: "cd-bad", badValues: ["Technology", "SaaS"] },
    ]);
  });
});
