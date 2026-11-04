import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn(),
}));

import { sql } from "@/lib/db/connection";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/test/cleanup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Ensure non-production environment
  vi.stubEnv("NODE_ENV", "test");
  delete process.env.VERCEL;
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/test/cleanup", () => {
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

    const res = await handler(makeRequest({ email: "e2e@test.deepdive.dev" }));
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid email", async () => {
    const res = await handler(makeRequest({ email: "bad@gmail.com" }));
    expect(res.status).toBe(400);
  });

  it("deletes a single test user", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([{ id: "uid-1" }]) // SELECT User
      .mockResolvedValueOnce([]) // DELETE DeletionRequest
      .mockResolvedValueOnce([]); // DELETE User

    const res = await handler(makeRequest({ email: "e2e@test.deepdive.dev" }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.deleted).toBe(true);
  });

  it("bulk deletes all test users", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([
        { id: "uid-1", email: "a@test.deepdive.dev" },
        { id: "uid-2", email: "b@test.deepdive.dev" },
      ])
      .mockResolvedValueOnce([]) // DELETE DeletionRequest
      .mockResolvedValueOnce([]); // DELETE Users

    const res = await handler(makeRequest({ all: true }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.deletedCount).toBe(2);
  });
});
