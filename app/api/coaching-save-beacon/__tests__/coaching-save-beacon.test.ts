import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/db/coaching", () => ({
  saveCoachingBeacon: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { saveCoachingBeacon } from "@/lib/db/coaching";
import { getCurrentUser } from "@/lib/auth";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/coaching-save-beacon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/coaching-save-beacon", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns ok when body is invalid (best-effort)", async () => {
    const res = await handler(makeRequest({ bad: "data" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(saveCoachingBeacon).not.toHaveBeenCalled();
  });

  it("returns ok when user is not authenticated", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(
      makeRequest({
        sessionId: "session-1",
        messages: [{ role: "user", content: "hello" }],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(saveCoachingBeacon).not.toHaveBeenCalled();
  });

  it("returns ok without saving when no user messages", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });

    const res = await handler(
      makeRequest({
        sessionId: "session-1",
        messages: [{ role: "assistant", content: "hi there" }],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(saveCoachingBeacon).not.toHaveBeenCalled();
  });

  it("saves coaching session on valid payload", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    (saveCoachingBeacon as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(
      makeRequest({
        sessionId: "session-1",
        reportId: "r1",
        messages: [
          { role: "user", content: "I need help" },
          { role: "assistant", content: "Sure thing" },
        ],
        locale: "zh",
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(saveCoachingBeacon).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        id: "session-1",
        reportId: "r1",
        roundNumber: 1,
        sessionType: "coaching_beacon_zh",
      }),
    );
  });

  it("returns ok even when save throws (best-effort)", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
    });
    (saveCoachingBeacon as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(
      makeRequest({
        sessionId: "session-1",
        messages: [{ role: "user", content: "hello" }],
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
