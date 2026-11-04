// ============================================================
// Tests for lib/email/client.ts — beta-mode kill switch.
//
// Verifies that EMAIL_MODE=beta suppresses transactional emails but
// ALWAYS lets critical (user-initiated) emails through. This is the
// regression guard for the "beta phase: do not bother users" rule.
// ============================================================

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

// Hoisted mocks so they can be referenced in vi.mock factories below.
const { mockResendSend } = vi.hoisted(() => ({
  mockResendSend:
    vi.fn<
      (args: {
        from: string;
        to: string;
        subject: string;
        html: string;
        text?: string;
      }) => Promise<{ data: { id: string } | null; error: null }>
    >(),
}));

// Use a class for the Resend mock so `new Resend(apiKey)` works correctly.
// vi.fn().mockImplementation() does NOT produce a valid constructor in the
// current vitest runtime when vi.hoisted is involved.
vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockResendSend };
    constructor(_apiKey?: string) {
      // no-op
    }
  },
}));

describe("sendEmail — beta mode kill switch", () => {
  let consoleLogSpy: Mock;
  let consoleErrorSpy: Mock;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    consoleLogSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => {}) as unknown as Mock;
    consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {}) as unknown as Mock;
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    mockResendSend.mockResolvedValue({
      data: { id: "msg_test" },
      error: null,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  describe("EMAIL_MODE unset (production default)", () => {
    it("sends transactional emails", async () => {
      const { sendEmail } = await import("../client");
      const result = await sendEmail({
        to: "user@example.com",
        subject: "Welcome",
        html: "<p>hi</p>",
        category: "transactional",
      });
      expect(result).toBe(true);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "user@example.com",
          subject: "Welcome",
        }),
      );
    });

    it("sends critical emails", async () => {
      const { sendEmail } = await import("../client");
      const result = await sendEmail({
        to: "user@example.com",
        subject: "Reset your password",
        html: "<p>reset link</p>",
        category: "critical",
      });
      expect(result).toBe(true);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("EMAIL_MODE=beta", () => {
    beforeEach(() => {
      vi.stubEnv("EMAIL_MODE", "beta");
    });

    it("SUPPRESSES transactional emails (returns true, never calls Resend)", async () => {
      const { sendEmail } = await import("../client");
      const result = await sendEmail({
        to: "user@example.com",
        subject: "Welcome",
        html: "<p>hi</p>",
        category: "transactional",
      });
      expect(result).toBe(true); // pretends success
      expect(mockResendSend).not.toHaveBeenCalled();
      // Logged so dev can see what was suppressed
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("[email:suppressed]"),
      );
    });

    it("STILL SENDS critical emails (password reset must work)", async () => {
      const { sendEmail } = await import("../client");
      const result = await sendEmail({
        to: "user@example.com",
        subject: "Reset your password",
        html: "<p>reset link</p>",
        category: "critical",
      });
      expect(result).toBe(true);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Reset your password",
        }),
      );
    });

    it("suppression log includes subject and recipient", async () => {
      const { sendEmail } = await import("../client");
      await sendEmail({
        to: "bob@example.com",
        subject: "Your weekly reminder",
        html: "<p>reminder</p>",
        category: "transactional",
      });
      const logged = consoleLogSpy.mock.calls
        .map((call: unknown[]) => String(call[0]))
        .join("\n");
      expect(logged).toContain("Your weekly reminder");
      expect(logged).toContain("bob@example.com");
    });

    it("suppression does NOT consume the Resend client", async () => {
      const { sendEmail } = await import("../client");
      // 100 suppressed transactional emails
      for (let i = 0; i < 100; i++) {
        await sendEmail({
          to: `user${i}@example.com`,
          subject: "Reminder",
          html: "<p>x</p>",
          category: "transactional",
        });
      }
      expect(mockResendSend).toHaveBeenCalledTimes(0);
    });
  });

  describe("EMAIL_MODE=production (explicit)", () => {
    beforeEach(() => {
      vi.stubEnv("EMAIL_MODE", "production");
    });

    it("sends transactional emails (does NOT suppress)", async () => {
      const { sendEmail } = await import("../client");
      const result = await sendEmail({
        to: "user@example.com",
        subject: "Welcome",
        html: "<p>hi</p>",
        category: "transactional",
      });
      expect(result).toBe(true);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
    });

    it("sends critical emails", async () => {
      const { sendEmail } = await import("../client");
      const result = await sendEmail({
        to: "user@example.com",
        subject: "Reset",
        html: "<p>x</p>",
        category: "critical",
      });
      expect(result).toBe(true);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
    });
  });

  describe("RESEND_API_KEY unset", () => {
    beforeEach(() => {
      vi.stubEnv("RESEND_API_KEY", "");
    });

    it("returns false for critical emails (cannot send without key)", async () => {
      const { sendEmail } = await import("../client");
      const result = await sendEmail({
        to: "user@example.com",
        subject: "Reset",
        html: "<p>x</p>",
        category: "critical",
      });
      expect(result).toBe(false);
      expect(mockResendSend).not.toHaveBeenCalled();
    });

    it("beta mode still suppresses transactional (even without key)", async () => {
      vi.stubEnv("EMAIL_MODE", "beta");
      const { sendEmail } = await import("../client");
      const result = await sendEmail({
        to: "user@example.com",
        subject: "Reminder",
        html: "<p>x</p>",
        category: "transactional",
      });
      // Beta suppression runs BEFORE the Resend client check, so this
      // returns true (suppressed) not false (no key).
      expect(result).toBe(true);
      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });

  describe("Resend send failure", () => {
    beforeEach(() => {
      mockResendSend.mockRejectedValue(new Error("Resend API down"));
    });

    it("returns false for critical emails when Resend throws", async () => {
      const { sendEmail } = await import("../client");
      const result = await sendEmail({
        to: "user@example.com",
        subject: "Reset",
        html: "<p>x</p>",
        category: "critical",
      });
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to send"),
        expect.anything(),
        expect.any(Error),
      );
    });
  });
});
