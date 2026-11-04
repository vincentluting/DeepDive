import { beforeEach, describe, expect, it, vi } from "vitest";

const events: string[] = [];

vi.mock("@/lib/auth/users", () => ({
  resolveIpCountry: vi.fn(async () => {
    events.push("resolve_geo");
    return "NL";
  }),
  updateUserRegistrationCountry: vi.fn(async () => {
    events.push("update_geo");
  }),
}));

vi.mock("@/lib/analytics/client", () => ({
  serverAnalytics: {
    track: vi.fn(async () => {
      events.push("track");
    }),
    identify: vi.fn(async () => {
      events.push("identify");
    }),
  },
}));

vi.mock("@/lib/db/identity", () => ({
  linkIdentity: vi.fn(async () => {
    events.push("link_identity");
  }),
  backfillFunnelEvents: vi.fn(async () => {
    events.push("backfill_funnel");
    return 1;
  }),
  backfillPageVisits: vi.fn(async () => {
    events.push("backfill_visits");
    return 2;
  }),
}));

vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn(async () => {
    events.push("send_email");
  }),
}));

vi.mock("@/lib/email/templates/welcome", () => ({
  buildWelcomeEmail: vi.fn(() => ({
    subject: "Welcome",
    html: "<p>Welcome</p>",
  })),
}));

import { serverAnalytics } from "@/lib/analytics/client";
import { sendEmail } from "@/lib/email/client";
import { handlePostRegistrationJob } from "@/lib/jobs/post-registration";

describe("handlePostRegistrationJob", () => {
  beforeEach(() => {
    events.length = 0;
    vi.clearAllMocks();
  });

  it("runs retry-safe side effects before sending welcome email", async () => {
    await handlePostRegistrationJob({
      user: { id: "user-1", email: "test@example.com", name: "Test" },
      email: "test@example.com",
      anonymousId: "anon-1",
      clientIp: "203.0.113.10",
      locale: "en",
      researchGroup: "treatment",
    });

    expect(serverAnalytics.track).toHaveBeenCalledWith(
      "registered",
      {
        language: "en",
        researchGroup: "treatment",
      },
      {
        userId: "user-1",
        idempotencyKey: "registered:user-1",
      },
    );

    expect(events).toEqual([
      "track",
      "resolve_geo",
      "update_geo",
      "link_identity",
      "backfill_funnel",
      "backfill_visits",
      "identify",
      "send_email",
    ]);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@example.com",
        category: "transactional",
      }),
    );
  });
});
