import { describe, expect, it } from "vitest";
import {
  redactString,
  scrubSentryEvent,
} from "@/lib/observability/sentry-scrub";

describe("redactString", () => {
  it("redacts email addresses", () => {
    expect(redactString("contact me at jane.doe@example.com please")).toBe(
      "contact me at [redacted] please",
    );
  });

  it("redacts bearer tokens and api keys", () => {
    expect(redactString("Authorization: Bearer abcdef1234567890")).toContain(
      "[redacted]",
    );
    expect(redactString("key=sk-ABCDEFGHIJKLMNOPQRST")).toContain("[redacted]");
  });

  it("leaves benign text untouched", () => {
    expect(redactString("scoring pipeline failed at step 3")).toBe(
      "scoring pipeline failed at step 3",
    );
  });
});

describe("scrubSentryEvent", () => {
  it("redacts user email/ip but keeps id", () => {
    const event = scrubSentryEvent({
      user: { id: "user_123", email: "a@b.com", ip_address: "1.2.3.4" },
    });
    expect(event.user.id).toBe("user_123");
    expect(event.user.email).toBe("[redacted]");
    expect(event.user.ip_address).toBe("[redacted]");
  });

  it("drops sensitive-keyed values (authorization, cookie)", () => {
    const event = scrubSentryEvent({
      request: {
        url: "https://x.test/report",
        headers: { authorization: "Bearer secret", "user-agent": "Mozilla" },
        cookies: "session=abc123",
      },
    }) as { request: { headers: Record<string, string>; cookies: string } };
    expect(event.request.headers.authorization).toBe("[redacted]");
    expect(event.request.headers["user-agent"]).toBe("Mozilla");
    expect(event.request.cookies).toBe("[redacted]");
  });

  it("redacts emails inside exception messages", () => {
    const event = scrubSentryEvent({
      exception: {
        values: [{ type: "Error", value: "failed for user x@y.com" }],
      },
    }) as { exception: { values: Array<{ value: string }> } };
    expect(event.exception.values[0].value).toBe("failed for user [redacted]");
  });

  it("never throws on malformed input", () => {
    expect(() => scrubSentryEvent(null)).not.toThrow();
    expect(() => scrubSentryEvent(undefined)).not.toThrow();
    expect(() => scrubSentryEvent(42 as unknown)).not.toThrow();
  });
});
