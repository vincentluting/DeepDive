// ============================================================
// saveToLocalStorage / loadFromLocalStorage — session-scope tests
//
// Per the 2026-05-18 IRB-driven migration, questionnaire answers
// must not persist on the participant's device past their tab.
// This file pins the contract:
//   - sessionStorage receives the write, localStorage does not
//   - reading sessionStorage round-trips the same shape
//   - legacy localStorage payloads (pre-migration) are purged on
//     every save/load so leftover PII gets evicted naturally
//
// Vitest defaults to a node env (no DOM). We stub `window`,
// `localStorage`, and `sessionStorage` with minimal Map-backed
// fakes so the function-under-test takes the browser branch.
// ============================================================

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "deep-dive-questionnaire-session-v2";

function makeStorageStub() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
    clear: () => {
      data.clear();
    },
    _data: data,
  };
}

let localStorageStub: ReturnType<typeof makeStorageStub>;
let sessionStorageStub: ReturnType<typeof makeStorageStub>;

beforeEach(async () => {
  localStorageStub = makeStorageStub();
  sessionStorageStub = makeStorageStub();
  vi.stubGlobal("window", {
    localStorage: localStorageStub,
    sessionStorage: sessionStorageStub,
  });
  vi.stubGlobal("localStorage", localStorageStub);
  vi.stubGlobal("sessionStorage", sessionStorageStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

type Loose = Record<string, unknown>;

function makeSession(): Loose {
  return {
    id: "sess-123",
    language: "en",
    includeRIASEC: false,
    answers: [],
    startedAt: Date.now(),
    currentQuestionIndex: 0,
    moduleStartTimes: { A: Date.now(), B: null, C: null },
    triggeredBonusInsights: new Set(["zone-anchor"]),
    pacePreference: "auto",
    zoneTimeline: {},
  };
}

describe("saveToLocalStorage", () => {
  it("writes to sessionStorage, NOT localStorage", async () => {
    const { saveToLocalStorage } = await import("../store-utils");
    saveToLocalStorage(makeSession() as never);

    expect(sessionStorageStub.getItem(STORAGE_KEY)).not.toBeNull();
    expect(localStorageStub.getItem(STORAGE_KEY)).toBeNull();
  });

  it("purges legacy localStorage entries on every write (IRB safety net)", async () => {
    const { saveToLocalStorage } = await import("../store-utils");
    localStorageStub.setItem(STORAGE_KEY, '{"id":"old","answers":[]}');

    saveToLocalStorage(makeSession() as never);

    expect(localStorageStub.getItem(STORAGE_KEY)).toBeNull();
  });

  it("clears sessionStorage when called with null", async () => {
    const { saveToLocalStorage } = await import("../store-utils");
    saveToLocalStorage(makeSession() as never);
    saveToLocalStorage(null);
    expect(sessionStorageStub.getItem(STORAGE_KEY)).toBeNull();
  });

  it("does NOT write a completed session (avoids stale resume)", async () => {
    const { saveToLocalStorage } = await import("../store-utils");
    const session = {
      ...makeSession(),
      completedAt: Date.now(),
    };
    saveToLocalStorage(session as never);
    expect(sessionStorageStub.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("loadFromLocalStorage", () => {
  it("reads from sessionStorage, ignores localStorage", async () => {
    const { loadFromLocalStorage } = await import("../store-utils");
    const session = makeSession();
    sessionStorageStub.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...session,
        triggeredBonusInsights: Array.from(
          session.triggeredBonusInsights as Set<string>,
        ),
      }),
    );
    localStorageStub.setItem(STORAGE_KEY, '{"id":"attacker","answers":[]}');

    const loaded = loadFromLocalStorage();

    expect(loaded?.id).toBe(session.id);
  });

  it("purges legacy localStorage even on empty sessionStorage read", async () => {
    const { loadFromLocalStorage } = await import("../store-utils");
    localStorageStub.setItem(STORAGE_KEY, '{"id":"old","answers":[]}');

    const loaded = loadFromLocalStorage();

    expect(loaded).toBeNull();
    expect(localStorageStub.getItem(STORAGE_KEY)).toBeNull();
  });

  it("drops sessions older than 48h", async () => {
    const { loadFromLocalStorage } = await import("../store-utils");
    const session = makeSession();
    const stale = {
      ...session,
      startedAt: Date.now() - 49 * 60 * 60 * 1000,
      triggeredBonusInsights: Array.from(
        session.triggeredBonusInsights as Set<string>,
      ),
    };
    sessionStorageStub.setItem(STORAGE_KEY, JSON.stringify(stale));

    const loaded = loadFromLocalStorage();

    expect(loaded).toBeNull();
    expect(sessionStorageStub.getItem(STORAGE_KEY)).toBeNull();
  });

  it("round-trips Set fields (triggeredBonusInsights)", async () => {
    const { saveToLocalStorage, loadFromLocalStorage } =
      await import("../store-utils");
    saveToLocalStorage(makeSession() as never);

    const loaded = loadFromLocalStorage();
    expect(loaded?.triggeredBonusInsights).toBeInstanceOf(Set);
    expect(loaded?.triggeredBonusInsights.has("zone-anchor")).toBe(true);
  });
});
