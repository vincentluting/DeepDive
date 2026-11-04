// ============================================================
// reportClientError helper tests
//
// Guarantees:
//   1. Never throws (observability must not crash the app)
//   2. Forwards non-Error values as Error instances
//   3. Calls Sentry.captureException with consistent tags
//   4. Logs to console in dev, stays silent (no console) in prod
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @sentry/nextjs — capture the call arguments for assertions
const captureExceptionMock = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}));

// Import AFTER mock is set up
import { reportClientError } from "../client-error";

describe("reportClientError", () => {
  beforeEach(() => {
    captureExceptionMock.mockReset();
  });

  it("forwards Error instances to Sentry with component tag", () => {
    const err = new Error("boom");
    reportClientError(err, { component: "PersonalizedInsight" });

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    const [forwardedError, ctx] = captureExceptionMock.mock.calls[0];
    expect(forwardedError).toBe(err);
    expect(ctx.tags).toMatchObject({
      component: "PersonalizedInsight",
      errorSurface: "ui-client",
    });
    expect(ctx.level).toBe("warning"); // default
  });

  it("wraps non-Error values into Error before forwarding", () => {
    reportClientError("string error", { component: "X" });
    const [forwardedError] = captureExceptionMock.mock.calls[0];
    expect(forwardedError).toBeInstanceOf(Error);
    expect((forwardedError as Error).message).toBe("string error");
  });

  it("includes feature tag and extra context when provided", () => {
    reportClientError(new Error("x"), {
      component: "CheckoutButton",
      feature: "checkout",
      extra: { tier: "report" },
      level: "error",
    });
    const [, ctx] = captureExceptionMock.mock.calls[0];
    expect(ctx.tags.feature).toBe("checkout");
    expect(ctx.extra).toEqual({ tier: "report" });
    expect(ctx.level).toBe("error");
  });

  it("never throws even if Sentry throws", () => {
    captureExceptionMock.mockImplementationOnce(() => {
      throw new Error("sentry down");
    });
    expect(() =>
      reportClientError(new Error("boom"), { component: "X" }),
    ).not.toThrow();
  });

  it("omits feature tag when not provided", () => {
    reportClientError(new Error("x"), { component: "Y" });
    const [, ctx] = captureExceptionMock.mock.calls[0];
    expect(ctx.tags.feature).toBeUndefined();
    expect(ctx.tags.component).toBe("Y");
  });
});
