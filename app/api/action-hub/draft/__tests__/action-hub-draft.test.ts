import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
    VALIDATION_ERROR: "VALIDATION_ERROR",
  },
  createErrorResponse: (
    code: string,
    message: string,
    status: number,
  ) =>
    new Response(JSON.stringify({ error: code, message }), { status }),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/validation/parse-body", () => ({ parseBody: vi.fn() }));
vi.mock("@/lib/db/coaching", () => ({
  getCoachingSessionForUser: vi.fn(),
}));
vi.mock("@/lib/db/action-hub", () => ({
  getActiveActionPlan: vi.fn(),
  createActionPlan: vi.fn(),
  createActionItem: vi.fn(),
}));
vi.mock("@/lib/db/connection", () => ({ sql: vi.fn() }));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  createActionItem,
  createActionPlan,
  getActiveActionPlan,
} from "@/lib/db/action-hub";
import { getCoachingSessionForUser } from "@/lib/db/coaching";

function request(): Request {
  return new Request("http://localhost/api/action-hub/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "u1" },
  });
  (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: {
      sessionId: "session-1",
      reportId: "report-1",
      title: "Test the role",
      actions: [
        {
          title: "Talk to one practitioner",
          description: "Prepare three questions.",
          category: "network",
          estimatedMinutes: 30,
        },
      ],
    },
  });
  (getCoachingSessionForUser as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "session-1",
    locale: "en",
  });
});

describe("POST /api/action-hub/draft", () => {
  it("adds confirmed actions to an existing active plan", async () => {
    (getActiveActionPlan as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "plan-1",
      userId: "u1",
    });
    const { POST } = await import("../route");
    const response = await POST(request() as never);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.planId).toBe("plan-1");
    expect(createActionPlan).not.toHaveBeenCalled();
    expect(createActionItem).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: "plan-1",
        userId: "u1",
        title: "Talk to one practitioner",
        intensity: "social",
      }),
    );
  });

  it("rejects a draft when the coaching session is not owned", async () => {
    (getCoachingSessionForUser as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );
    const { POST } = await import("../route");
    const response = await POST(request() as never);
    expect(response.status).toBe(404);
    expect(createActionItem).not.toHaveBeenCalled();
  });
});
