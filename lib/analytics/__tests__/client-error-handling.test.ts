import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks ───────────────────────────────────────────────────

vi.mock("@/lib/analytics/events", () => ({
  validateEventMetadata: vi.fn(() => null),
}));

// Track whether analytics/errors was imported
let analyticsErrorsImported = false;

vi.mock("@/lib/analytics/errors", () => {
  analyticsErrorsImported = true;
  return {
    logAnalyticsError: vi.fn(),
  };
});

// ── Tests ───────────────────────────────────────────────────
describe("AnalyticsClient error handling", () => {
  let originalWindow: typeof globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    analyticsErrorsImported = false;
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    // Restore window state
    if (originalWindow === undefined) {
      // @ts-expect-error -- restoring undefined window for server-like env
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  describe("Bug #3: client-side track() must not import server-only errors module", () => {
    it("does not import analytics/errors when window is defined and fetch throws", async () => {
      // Simulate client-side environment
      // @ts-expect-error -- minimal window mock for client detection
      globalThis.window = { location: { href: "http://localhost" } };

      // Mock fetch to throw an error
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      try {
        // Fresh import to get a clean AnalyticsClient instance
        const { analytics } = await import("../client");

        // Reset the import tracker after module load
        analyticsErrorsImported = false;

        // This should fail (fetch throws) but NOT import analytics/errors
        await analytics.track("registered" as never);

        // The key assertion: analytics/errors should NOT have been imported
        expect(analyticsErrorsImported).toBe(false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("swallows errors silently on client-side without crashing", async () => {
      // Simulate client-side environment
      // @ts-expect-error -- minimal window mock for client detection
      globalThis.window = { location: { href: "http://localhost" } };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      try {
        const { analytics } = await import("../client");

        // Should not throw — analytics errors must never crash the app
        await expect(
          analytics.track("registered" as never),
        ).resolves.toBeUndefined();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
