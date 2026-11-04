import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn(),
}));

import { sql } from "@/lib/db/connection";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/test/set-cohort", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "test");
  delete process.env.VERCEL;
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/test/set-cohort", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("blocks in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;

    const res = await handler(
      makeRequest({
        email: "e2e@test.deepdive.dev",
        cohort: "beta",
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid email", async () => {
    const res = await handler(
      makeRequest({ email: "bad@gmail.com", cohort: "beta" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when cohort is missing", async () => {
    const res = await handler(makeRequest({ email: "e2e@test.deepdive.dev" }));
    expect(res.status).toBe(400);
  });

  it("sets cohort successfully", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "uid-1" },
    ]);

    const res = await handler(
      makeRequest({
        email: "e2e@test.deepdive.dev",
        cohort: "beta",
      }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.cohort).toBe("beta");
  });

  it("returns 404 when user not found", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await handler(
      makeRequest({
        email: "e2e@test.deepdive.dev",
        cohort: "beta",
      }),
    );
    expect(res.status).toBe(404);
  });
});
