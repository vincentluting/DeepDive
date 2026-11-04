// ============================================================
// Test: withTimeout timer cleanup
// The withTimeout function in lib/report-generation/index.ts
// is not exported, so we re-implement the same logic for testing.
// This verifies the pattern: resolve before timeout, reject on
// timeout, and no hanging timers.
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Re-implement withTimeout matching the production code pattern
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.then(
      (result) => {
        clearTimeout(timer);
        return result;
      },
      (err) => {
        clearTimeout(timer);
        throw err;
      },
    ),
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(`[report-gen] ${label} timed out after ${ms / 1000}s`),
          ),
        ms,
      );
    }),
  ]);
}

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves correctly when promise resolves before timeout", async () => {
    const promise = Promise.resolve("success");
    const result = withTimeout(promise, 5000, "test-fast");

    await vi.advanceTimersByTimeAsync(0); // flush microtask
    await expect(result).resolves.toBe("success");
  });

  it("rejects with timeout error when promise takes too long", async () => {
    const neverResolve = new Promise<string>(() => {});
    const result = withTimeout(neverResolve, 5000, "slow-call");

    vi.advanceTimersByTime(5000);

    await expect(result).rejects.toThrow(
      "[report-gen] slow-call timed out after 5s",
    );
  });

  it("includes label and duration in timeout error message", async () => {
    const neverResolve = new Promise<string>(() => {});
    const result = withTimeout(neverResolve, 90000, "career-match");

    vi.advanceTimersByTime(90000);

    await expect(result).rejects.toThrow(
      "[report-gen] career-match timed out after 90s",
    );
  });

  it("propagates the original error when promise rejects before timeout", async () => {
    let rejectFn!: (err: Error) => void;
    const promise = new Promise<string>((_, reject) => {
      rejectFn = reject;
    });
    const result = withTimeout(promise, 5000, "test-fail");
    // Attach .catch before rejecting to prevent unhandled rejection warning
    const catcher = result.catch((e: unknown) => e);
    rejectFn(new Error("original error"));

    await vi.advanceTimersByTimeAsync(0);
    const err = await catcher;
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("original error");
  });

  it("clears timer when promise resolves (no hanging timers)", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const promise = Promise.resolve(42);
    const result = withTimeout(promise, 10000, "test-cleanup");

    await vi.advanceTimersByTimeAsync(0);
    await result;

    // clearTimeout should have been called to clean up the timer
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("clears timer when promise rejects (no hanging timers)", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    let rejectFn!: (err: Error) => void;
    const promise = new Promise<string>((_, reject) => {
      rejectFn = reject;
    });
    const result = withTimeout(promise, 10000, "test-cleanup-err");
    // Attach .catch before rejecting to prevent unhandled rejection warning
    const catcher = result.catch(() => {
      /* expected */
    });
    rejectFn(new Error("boom"));

    await vi.advanceTimersByTimeAsync(0);
    await catcher;

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("no pending timers after timeout fires", async () => {
    const neverResolve = new Promise<string>(() => {});
    const result = withTimeout(neverResolve, 3000, "test-no-leak");

    vi.advanceTimersByTime(3000);

    await result.catch(() => {}); // consume rejection

    // After timeout fires, advancing more time should be safe (no further errors)
    expect(() => vi.advanceTimersByTime(10000)).not.toThrow();
  });
});
