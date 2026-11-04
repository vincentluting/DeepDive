// Tests for provider-health.ts — mock sql, exercise the selection logic.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ── Mock sql ───────────────────────────────────────────────

type RawRow = { provider: string; total: number; ok: number; degraded: number };
let mockRows: RawRow[] | Error = [];
const sqlMock = vi.fn();

vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => sqlMock(...args),
}));

beforeEach(() => {
  mockRows = [];
  sqlMock.mockReset();
  sqlMock.mockImplementation(async () => {
    if (mockRows instanceof Error) throw mockRows;
    return mockRows;
  });
});

afterEach(() => {
  delete process.env.LLM_HEALTH_ROUTING_DISABLED;
  delete process.env.LLM_HEALTH_WINDOW_MIN;
  delete process.env.LLM_HEALTH_MIN_CALLS;
  delete process.env.LLM_HEALTH_UNHEALTHY_THRESHOLD;
});

// ── Helpers ────────────────────────────────────────────────

async function freshModule() {
  // Re-import so env vars take effect, and reset the module-level cache.
  vi.resetModules();
  return import("../provider-health");
}

// ── Tests ──────────────────────────────────────────────────

describe("selectHealthiest — data sufficiency", () => {
  it("returns preference order unchanged when no data exists", async () => {
    mockRows = [];
    const { selectHealthiest } = await freshModule();
    const result = await selectHealthiest(["anthropic", "openai", "gemini"]);
    expect(result.chosen).toBe("anthropic");
    expect(result.orderedChain).toEqual(["anthropic", "openai", "gemini"]);
    expect(result.demoted).toEqual([]);
  });

  it("treats a provider with fewer than MIN_CALLS as unknown (healthy)", async () => {
    // gemini has 2 calls, both failed — would be 0% success rate but count < MIN_CALLS
    mockRows = [{ provider: "gemini", total: 2, ok: 0, degraded: 0 }];
    const { selectHealthiest } = await freshModule();
    const result = await selectHealthiest(["gemini", "anthropic"]);
    expect(result.chosen).toBe("gemini");
    expect(result.demoted).toEqual([]);
  });
});

describe("selectHealthiest — demotion logic", () => {
  it("demotes a provider whose success rate is below the threshold", async () => {
    // gemini 3 calls at 33% success → below 80% threshold → demoted
    // anthropic 10 calls at 100% → stays
    mockRows = [
      { provider: "gemini", total: 3, ok: 1, degraded: 0 },
      { provider: "anthropic", total: 10, ok: 10, degraded: 0 },
    ];
    const { selectHealthiest } = await freshModule();
    const result = await selectHealthiest(["gemini", "anthropic", "openai"]);

    expect(result.chosen).toBe("anthropic");
    expect(result.orderedChain).toEqual(["anthropic", "openai", "gemini"]);
    expect(result.demoted).toHaveLength(1);
    expect(result.demoted[0].provider).toBe("gemini");
    expect(result.demoted[0].reason).toMatch(/33%/);
  });

  it("preserves relative order among healthy providers", async () => {
    // All three healthy. Caller preference: openai, anthropic, gemini.
    // Expected: unchanged (no one gets demoted, healthy keep original order).
    mockRows = [
      { provider: "anthropic", total: 10, ok: 10, degraded: 0 },
      { provider: "openai", total: 10, ok: 10, degraded: 0 },
      { provider: "gemini", total: 10, ok: 10, degraded: 0 },
    ];
    const { selectHealthiest } = await freshModule();
    const result = await selectHealthiest(["openai", "anthropic", "gemini"]);
    expect(result.orderedChain).toEqual(["openai", "anthropic", "gemini"]);
    expect(result.demoted).toEqual([]);
  });

  it("does not demote anyone if all providers are unhealthy", async () => {
    // In a fleet-wide outage everyone is unhealthy — demoting some but
    // not others would be arbitrary. Keep preference order so the
    // router can retry everyone.
    mockRows = [
      { provider: "anthropic", total: 10, ok: 2, degraded: 0 },
      { provider: "openai", total: 10, ok: 3, degraded: 0 },
      { provider: "gemini", total: 10, ok: 1, degraded: 0 },
    ];
    const { selectHealthiest } = await freshModule();
    const result = await selectHealthiest(["openai", "anthropic", "gemini"]);
    // All three demoted to tail → tail == entire chain in original order
    expect(result.orderedChain).toEqual(["openai", "anthropic", "gemini"]);
    expect(result.demoted.map((d) => d.provider).sort()).toEqual([
      "anthropic",
      "gemini",
      "openai",
    ]);
  });

  it("status 'degraded' does NOT trigger demotion, only 'unhealthy' does", async () => {
    // 90% success rate → below DEGRADED_THRESHOLD 0.95 but above UNHEALTHY 0.80
    // → status 'degraded' but NOT demoted
    mockRows = [{ provider: "gemini", total: 10, ok: 9, degraded: 0 }];
    const { selectHealthiest } = await freshModule();
    const result = await selectHealthiest(["gemini", "openai"]);
    expect(result.chosen).toBe("gemini");
    expect(result.demoted).toEqual([]);
  });
});

describe("selectHealthiest — DB failure resilience", () => {
  it("returns preference unchanged when sql throws", async () => {
    mockRows = new Error("ECONNREFUSED");
    const { selectHealthiest } = await freshModule();
    const result = await selectHealthiest(["gemini", "anthropic", "openai"]);
    expect(result.chosen).toBe("gemini");
    expect(result.orderedChain).toEqual(["gemini", "anthropic", "openai"]);
    expect(result.demoted).toEqual([]);
  });

  it("does not re-query DB for 60s after a failure (caches unknowns)", async () => {
    mockRows = new Error("ECONNREFUSED");
    const { selectHealthiest } = await freshModule();
    await selectHealthiest(["gemini"]);
    const callsAfterFirst = sqlMock.mock.calls.length;
    // Ten more calls within 60s → same cache, no new DB hits
    for (let i = 0; i < 10; i++) {
      await selectHealthiest(["gemini"]);
    }
    expect(sqlMock.mock.calls.length).toBe(callsAfterFirst);
  });
});

describe("selectHealthiest — kill switch", () => {
  it("returns preference unchanged and makes zero DB calls when disabled", async () => {
    process.env.LLM_HEALTH_ROUTING_DISABLED = "1";
    mockRows = [{ provider: "gemini", total: 10, ok: 1, degraded: 0 }]; // would normally demote
    const { selectHealthiest } = await freshModule();
    const result = await selectHealthiest(["gemini", "anthropic"]);
    expect(result.chosen).toBe("gemini");
    expect(result.demoted).toEqual([]);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("also accepts 'true' for the kill switch env value", async () => {
    process.env.LLM_HEALTH_ROUTING_DISABLED = "true";
    mockRows = [{ provider: "gemini", total: 10, ok: 1, degraded: 0 }];
    const { selectHealthiest } = await freshModule();
    const result = await selectHealthiest(["gemini", "anthropic"]);
    expect(result.chosen).toBe("gemini");
    expect(sqlMock).not.toHaveBeenCalled();
  });
});

describe("selectHealthiest — caching", () => {
  it("uses only a single DB query across 10 rapid invocations", async () => {
    mockRows = [{ provider: "anthropic", total: 10, ok: 10, degraded: 0 }];
    const { selectHealthiest } = await freshModule();
    for (let i = 0; i < 10; i++) {
      await selectHealthiest(["anthropic"]);
    }
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("serializes concurrent refreshes into one DB call", async () => {
    mockRows = [{ provider: "anthropic", total: 10, ok: 10, degraded: 0 }];
    const { selectHealthiest } = await freshModule();
    // Fire 5 concurrent calls that all start with an empty cache
    const results = await Promise.all([
      selectHealthiest(["anthropic"]),
      selectHealthiest(["anthropic"]),
      selectHealthiest(["anthropic"]),
      selectHealthiest(["anthropic"]),
      selectHealthiest(["anthropic"]),
    ]);
    expect(results).toHaveLength(5);
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });
});

describe("getHealthSnapshot + getHealthRoutingConfig", () => {
  it("returns null for providers that have never been cached", async () => {
    const { getHealthSnapshot } = await freshModule();
    const snap = getHealthSnapshot();
    expect(snap.anthropic).toBeNull();
    expect(snap.openai).toBeNull();
    expect(snap.gemini).toBeNull();
  });

  it("returns populated snapshots after a refresh", async () => {
    mockRows = [{ provider: "anthropic", total: 10, ok: 9, degraded: 2 }];
    const { selectHealthiest, getHealthSnapshot } = await freshModule();
    await selectHealthiest(["anthropic"]);
    const snap = getHealthSnapshot();
    expect(snap.anthropic).not.toBeNull();
    expect(snap.anthropic?.totalCalls).toBe(10);
    expect(snap.anthropic?.successCount).toBe(9);
    expect(snap.anthropic?.failureCount).toBe(1);
    expect(snap.anthropic?.degradedCount).toBe(2);
    expect(snap.anthropic?.successRate).toBeCloseTo(0.9, 5);
    expect(snap.anthropic?.status).toBe("degraded"); // 90% < 95%
  });

  it("exposes the routing config constants", async () => {
    const { getHealthRoutingConfig } = await freshModule();
    const cfg = getHealthRoutingConfig();
    expect(cfg.windowMinutes).toBe(10);
    expect(cfg.minCalls).toBe(3);
    expect(cfg.unhealthyThreshold).toBe(0.8);
    expect(cfg.degradedThreshold).toBe(0.95);
    expect(cfg.cacheTtlMs).toBe(60_000);
  });
});

describe("isHealthRoutingEnabled", () => {
  it("is true by default", async () => {
    const { isHealthRoutingEnabled } = await freshModule();
    expect(isHealthRoutingEnabled()).toBe(true);
  });

  it("is false when kill switch is set", async () => {
    process.env.LLM_HEALTH_ROUTING_DISABLED = "1";
    const { isHealthRoutingEnabled } = await freshModule();
    expect(isHealthRoutingEnabled()).toBe(false);
  });
});

describe("degenerate inputs", () => {
  it("handles empty preference array without crashing", async () => {
    const { selectHealthiest } = await freshModule();
    const result = await selectHealthiest([]);
    expect(result.orderedChain).toEqual([]);
    expect(result.demoted).toEqual([]);
  });
});

describe("peekHealthSnapshot — operator-facing read path", () => {
  it("returns snapshots without mutating the routing cache", async () => {
    mockRows = [
      { provider: "gemini", total: 10, ok: 2, degraded: 0 },
      { provider: "anthropic", total: 10, ok: 10, degraded: 0 },
    ];
    const { peekHealthSnapshot, getHealthSnapshot, selectHealthiest } =
      await freshModule();

    const peek = await peekHealthSnapshot();
    expect(peek.stale).toBe(false);
    expect(peek.snapshots?.gemini?.status).toBe("unhealthy");
    expect(peek.snapshots?.anthropic?.status).toBe("healthy");

    // Routing cache must remain untouched — getHealthSnapshot still
    // sees nulls because no routing call has happened yet.
    const routing = getHealthSnapshot();
    expect(routing.gemini).toBeNull();
    expect(routing.anthropic).toBeNull();
    expect(routing.openai).toBeNull();

    // And selectHealthiest works independently.
    const select = await selectHealthiest(["gemini", "anthropic"]);
    expect(select.chosen).toBe("anthropic");
  });

  it("returns stale=true with classified error code when sql throws", async () => {
    mockRows = new Error("connection reset by peer");
    const { peekHealthSnapshot } = await freshModule();
    const peek = await peekHealthSnapshot();
    expect(peek.stale).toBe(true);
    expect(peek.snapshots).toBeNull();
    // Sanitized to a stable code — never echoes raw DB message.
    expect(peek.error).toBe("db_connection_error");
  });

  it("classifies authentication failures as db_auth_error", async () => {
    mockRows = new Error("password authentication failed for user x");
    const { peekHealthSnapshot } = await freshModule();
    const peek = await peekHealthSnapshot();
    expect(peek.error).toBe("db_auth_error");
  });

  it("coalesces concurrent peeks into one DB call", async () => {
    sqlMock.mockReset();
    let resolveQuery: (rows: unknown) => void = () => {};
    sqlMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveQuery = resolve;
        }),
    );
    const { peekHealthSnapshot } = await freshModule();
    const p1 = peekHealthSnapshot();
    const p2 = peekHealthSnapshot();
    const p3 = peekHealthSnapshot();
    // Only 1 sql invocation even though 3 peeks are in flight.
    expect(sqlMock).toHaveBeenCalledTimes(1);
    resolveQuery([{ provider: "anthropic", total: 10, ok: 10, degraded: 0 }]);
    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });

  it("serves from the 30s peek cache on a second call within TTL", async () => {
    mockRows = [{ provider: "anthropic", total: 10, ok: 10, degraded: 0 }];
    const { peekHealthSnapshot } = await freshModule();
    await peekHealthSnapshot();
    const calls = sqlMock.mock.calls.length;
    for (let i = 0; i < 5; i++) await peekHealthSnapshot();
    expect(sqlMock.mock.calls.length).toBe(calls);
  });

  it("late callers race the same compute — still get fresh result if DB settles within their budget", async () => {
    // This exercises the codex-caught edge case:
    //   T=0ms   first caller fires, 50ms timeout → times out at 50ms
    //   T=75ms  second caller fires, 100ms timeout
    //   T=150ms DB settles successfully (150 - 75 = 75ms wait, fits in 100ms)
    // The second caller must see the success, not get permanently stuck
    // on the first caller's "timeout" resolution of a shared race promise.
    sqlMock.mockReset();
    sqlMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve([
                { provider: "anthropic", total: 10, ok: 10, degraded: 0 },
              ]),
            150,
          ),
        ),
    );
    const { peekHealthSnapshot } = await freshModule();

    const firstPromise = peekHealthSnapshot(50); // will time out
    await new Promise((resolve) => setTimeout(resolve, 75));
    const secondPromise = peekHealthSnapshot(120); // fits

    const [firstResult, secondResult] = await Promise.all([
      firstPromise,
      secondPromise,
    ]);

    expect(firstResult.stale).toBe(true);
    expect(firstResult.error).toBe("timeout");

    expect(secondResult.stale).toBe(false);
    expect(secondResult.snapshots?.anthropic?.status).toBe("healthy");

    // Only one underlying DB query fired despite two callers.
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("respects kill switch by returning fresh=false with empty snapshots", async () => {
    process.env.LLM_HEALTH_ROUTING_DISABLED = "1";
    const { peekHealthSnapshot } = await freshModule();
    const peek = await peekHealthSnapshot();
    expect(peek.stale).toBe(false);
    expect(peek.snapshots?.anthropic).toBeNull();
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("times out if DB hangs longer than the configured cap", async () => {
    sqlMock.mockReset();
    sqlMock.mockImplementation(
      () => new Promise(() => {}) /* never resolves */,
    );
    const { peekHealthSnapshot } = await freshModule();
    const peek = await peekHealthSnapshot(50);
    expect(peek.stale).toBe(true);
    expect(peek.snapshots).toBeNull();
    expect(peek.error).toBe("timeout");
  });
});
