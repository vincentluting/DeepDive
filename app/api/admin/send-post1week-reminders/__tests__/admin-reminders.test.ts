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
vi.mock("@/lib/db/post1week-reminders", () => ({
  getPost1WeekReminderCandidates: vi.fn(),
  claimPost1WeekReminder: vi.fn(),
  markPost1WeekReminderResult: vi.fn(),
}));
vi.mock("@/lib/email/client", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/email/templates/post-1week-reminder", () => ({
  buildPost1WeekReminderEmail: vi.fn(() => ({
    subject: "Reminder",
    html: "<p>Hi</p>",
  })),
}));

import { guardRoute } from "@/lib/api/api-guard";
import {
  claimPost1WeekReminder,
  getPost1WeekReminderCandidates,
  markPost1WeekReminderResult,
} from "@/lib/db/post1week-reminders";
import { sendEmail } from "@/lib/email/client";

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

describe("POST /api/admin/send-post1week-reminders", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("returns 403 when guard blocks", async () => {
    blockGuard();
    expect(
      (
        await handler(
          new Request("http://localhost/api/admin/send-post1week-reminders", {
            method: "POST",
          }),
        )
      ).status,
    ).toBe(403);
  });

  it("returns sent=0 when no eligible users", async () => {
    allowAdmin();
    (
      getPost1WeekReminderCandidates as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);

    const json = await (
      await handler(
        new Request("http://localhost/api/admin/send-post1week-reminders", {
          method: "POST",
        }),
      )
    ).json();
    expect(json.sent).toBe(0);
  });

  it("sends emails to eligible users (happy path)", async () => {
    allowAdmin();
    (
      getPost1WeekReminderCandidates as ReturnType<typeof vi.fn>
    ).mockResolvedValue([
      {
        userId: "u1abcdef",
        email: "user@test.com",
        name: "Test User",
        postImmediateAt: "2026-04-01T00:00:00.000Z",
      },
    ]);
    (claimPost1WeekReminder as ReturnType<typeof vi.fn>).mockResolvedValue(
      "claim-1",
    );
    (sendEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const json = await (
      await handler(
        new Request("http://localhost/api/admin/send-post1week-reminders", {
          method: "POST",
        }),
      )
    ).json();
    expect(json.sent).toBe(1);
    expect(json.total).toBe(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(markPost1WeekReminderResult).toHaveBeenCalledWith({
      id: "claim-1",
      sent: true,
    });
  });
});
