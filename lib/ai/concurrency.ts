// Per-provider concurrency limiter for LLM calls.
// Prevents overwhelming any single provider's rate limits
// when multiple users generate reports concurrently.
//
// Two usage patterns:
//   // Non-streaming (auto-release when promise settles):
//   const limiter = getProviderLimiter("anthropic");
//   const result = await limiter(() => callAnthropic(...));
//
//   // Streaming (explicit acquire/release for long-lived connections):
//   const sem = getProviderSemaphore("anthropic");
//   const release = await sem.acquire();
//   try { ... stream ... } finally { release(); }

export type LimiterFn = <T>(fn: () => Promise<T>) => Promise<T>;

/** Default concurrency caps per provider. Override via env vars. */
const DEFAULT_CONCURRENCY: Record<string, number> = {
  anthropic: Number(process.env.LLM_CONCURRENCY_ANTHROPIC) || 5,
  openai: Number(process.env.LLM_CONCURRENCY_OPENAI) || 10,
  gemini: Number(process.env.LLM_CONCURRENCY_GEMINI) || 8,
};

// ── Shared core: queue + active count ──

interface Semaphore {
  /** Acquire a slot. Returns a release function. Waits if at capacity. */
  acquire(): Promise<() => void>;
  /** Convenience wrapper: acquire, run fn, release on settle. */
  run: LimiterFn;
}

export function createSemaphore(concurrency: number): Semaphore {
  let active = 0;
  const waiters: Array<(release: () => void) => void> = [];

  function makeRelease(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      active--;
      if (waiters.length > 0) {
        const next = waiters.shift()!;
        active++;
        next(makeRelease());
      }
    };
  }

  function acquire(): Promise<() => void> {
    if (active < concurrency) {
      active++;
      return Promise.resolve(makeRelease());
    }
    return new Promise<() => void>((resolve) => {
      waiters.push((rel) => resolve(rel));
    });
  }

  const run: LimiterFn = async <T>(fn: () => Promise<T>): Promise<T> => {
    const rel = await acquire();
    try {
      return await fn();
    } finally {
      rel();
    }
  };

  return { acquire, run };
}

// ── Provider singletons ──

const _semaphores = new Map<string, Semaphore>();

function getOrCreateSemaphore(provider: string): Semaphore {
  let sem = _semaphores.get(provider);
  if (!sem) {
    const cap = DEFAULT_CONCURRENCY[provider] ?? 10;
    sem = createSemaphore(cap);
    _semaphores.set(provider, sem);
  }
  return sem;
}

/** Get a per-provider limiter (auto-release). Used by callLLM for non-streaming calls. */
export function getProviderLimiter(provider: string): LimiterFn {
  return getOrCreateSemaphore(provider).run;
}

/** Get a per-provider semaphore (manual acquire/release). Used by streamLLM for streaming. */
export function getProviderSemaphore(provider: string): Semaphore {
  return getOrCreateSemaphore(provider);
}

/**
 * Test-only: clear the provider semaphore cache AND recompute capacities
 * from the current env. Both the DEFAULT_CONCURRENCY table and the
 * _semaphores map are frozen on first module load in production, so
 * vi.stubEnv("LLM_CONCURRENCY_OPENAI", "1") has no effect mid-suite
 * unless we explicitly reseed. Call from test beforeEach after
 * vi.resetModules() and vi.stubEnv() to get deterministic capacity.
 */
export function __resetSemaphoresForTest(): void {
  _semaphores.clear();
  DEFAULT_CONCURRENCY.anthropic =
    Number(process.env.LLM_CONCURRENCY_ANTHROPIC) || 5;
  DEFAULT_CONCURRENCY.openai = Number(process.env.LLM_CONCURRENCY_OPENAI) || 10;
  DEFAULT_CONCURRENCY.gemini = Number(process.env.LLM_CONCURRENCY_GEMINI) || 8;
}

// Backwards compat
export const createLimiter = (concurrency: number): LimiterFn =>
  createSemaphore(concurrency).run;
