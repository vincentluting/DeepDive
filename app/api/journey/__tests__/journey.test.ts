import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/db/journey", () => ({
  getJourneyState: vi.fn(),
}));

vi.mock("@/lib/journey/state-machine", () => ({
  deriveUnlocked: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getJourneyState } from "@/lib/db/journey";
import { deriveUnlocked } from "@/lib/journey/state-machine";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/journey", { method: "GET" });
}

function allowGuard(user: { id: string } = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 401) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/journey", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks (unauthenticated)", async () => {
    blockGuard(401);
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns journey state and unlocked map (not_started)", async () => {
    allowGuard({ id: "u1" });
    (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
      "not_started",
    );
    (deriveUnlocked as ReturnType<typeof vi.fn>).mockReturnValue({
      quickDive: true,
      deepDive: false,
      profile: false,
      report: false,
      coaching: false,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.state).toBe("not_started");
    expect(json.unlocked.quickDive).toBe(true);
    expect(json.unlocked.deepDive).toBe(false);
    expect(json.unlocked.coaching).toBe(false);

    expect(getJourneyState).toHaveBeenCalledWith("u1");
    expect(deriveUnlocked).toHaveBeenCalledWith("not_started");
  });

  it("returns fully unlocked state (coaching_unlocked)", async () => {
    allowGuard({ id: "u2" });
    (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
      "coaching_unlocked",
    );
    (deriveUnlocked as ReturnType<typeof vi.fn>).mockReturnValue({
      quickDive: true,
      deepDive: true,
      profile: true,
      report: true,
      coaching: true,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.state).toBe("coaching_unlocked");
    expect(json.unlocked.coaching).toBe(true);
    expect(json.unlocked.report).toBe(true);
  });

  it("returns mid-journey state (profile_generated)", async () => {
    allowGuard({ id: "u3" });
    (getJourneyState as ReturnType<typeof vi.fn>).mockResolvedValue(
      "profile_generated",
    );
    (deriveUnlocked as ReturnType<typeof vi.fn>).mockReturnValue({
      quickDive: true,
      deepDive: true,
      profile: true,
      report: false,
      coaching: false,
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.state).toBe("profile_generated");
    expect(json.unlocked.profile).toBe(true);
    expect(json.unlocked.report).toBe(false);
  });

  it("returns 500 when DB fetch fails", async () => {
    allowGuard({ id: "u1" });
    (getJourneyState as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB connection lost"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });
});
