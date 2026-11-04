import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn(),
}));

vi.mock("@/lib/db/profiles", () => ({
  updateProfileNarratives: vi.fn(),
}));

import { sql } from "@/lib/db/connection";
import { updateProfileNarratives } from "@/lib/db/profiles";

function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/test/seed-profile-narratives", {
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

describe("POST /api/test/seed-profile-narratives", () => {
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
      makeRequest({ email: "e2e@test.deepdive.dev", assessmentId: "a1" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid email", async () => {
    const res = await handler(makeRequest({ email: "bad@gmail.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when no profile exists for the test user", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await handler(
      makeRequest({ email: "e2e@test.deepdive.dev", assessmentId: "a1" }),
    );
    expect(res.status).toBe(404);
  });

  it("seeds narratives for the requested assessment", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { assessmentId: "a1" },
    ]);

    const res = await handler(
      makeRequest({ email: "e2e@test.deepdive.dev", assessmentId: "a1" }),
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.assessmentId).toBe("a1");
    expect(updateProfileNarratives).toHaveBeenCalledWith(
      "a1",
      expect.objectContaining({
        identitySummary: expect.any(String),
        populatedAt: expect.any(String),
      }),
    );
  });
});
