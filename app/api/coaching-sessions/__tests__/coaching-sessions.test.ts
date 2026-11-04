import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  },
  createErrorResponse: (
    code: string,
    message: string,
    status: number,
  ) =>
    new Response(JSON.stringify({ error: code, message }), { status }),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/db/coaching", () => ({
  getCoachingSessionForUser: vi.fn(),
  getRecentCoachingSessions: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import {
  getCoachingSessionForUser,
  getRecentCoachingSessions,
} from "@/lib/db/coaching";

function request(query = ""): NextRequest {
  return new NextRequest(`http://localhost/api/coaching-sessions${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "u1" },
  });
});

describe("GET /api/coaching-sessions", () => {
  it("lists recent sessions for the authenticated user", async () => {
    (getRecentCoachingSessions as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "session-1", status: "active" },
    ]);
    const { GET } = await import("../route");
    const response = await GET(request("?limit=5"));
    const data = await response.json();
    expect(data.sessions).toHaveLength(1);
    expect(getRecentCoachingSessions).toHaveBeenCalledWith("u1", 5);
  });

  it("loads one owned session for resume", async () => {
    (getCoachingSessionForUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "session-1",
      messagesJson: [{ role: "user", content: "Continue this" }],
    });
    const { GET } = await import("../route");
    const response = await GET(request("?id=session-1"));
    const data = await response.json();
    expect(data.session.id).toBe("session-1");
    expect(getCoachingSessionForUser).toHaveBeenCalledWith("session-1", "u1");
  });

  it("returns 404 for a session owned by someone else", async () => {
    (getCoachingSessionForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    const { GET } = await import("../route");
    const response = await GET(request("?id=missing"));
    expect(response.status).toBe(404);
  });
});
