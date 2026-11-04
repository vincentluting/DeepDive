// ============================================================
// Server-Timing context — per-request latency attribution
//
// AsyncLocalStorage-backed context lets handlers and helpers record
// timing marks (db / llm / render / cache) that withLogging emits as
// a single Server-Timing header. Without this, every "is it slow?"
// question requires guessing — the header is the cheapest decision
// capital we can buy.
//
// Usage in handlers:
//   const data = await timed("db", () => sql`SELECT ...`);
//   const llmOut = await timed("llm", () => callLLM(...));
//
// withLogging handles the context wrapper and header emission.
// ============================================================

import { AsyncLocalStorage } from "node:async_hooks";

type TimingMark = { label: string; dur: number };
type TimingStore = { marks: TimingMark[] };

const store = new AsyncLocalStorage<TimingStore>();

export function runWithTimingContext<T>(fn: () => Promise<T>): Promise<T> {
  return store.run({ marks: [] }, fn);
}

export function recordTiming(label: string, durMs: number): void {
  const ctx = store.getStore();
  if (!ctx) return;
  ctx.marks.push({ label, dur: durMs });
}

export function getTimingMarks(): TimingMark[] {
  return store.getStore()?.marks ?? [];
}

/**
 * Wrap an async operation and record its duration under `label`.
 * Aggregates multiple marks with the same label (e.g. multiple db calls)
 * is the caller's responsibility — repeated labels appear once per call
 * in the Server-Timing header, which is valid per the spec.
 */
export async function timed<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    recordTiming(label, performance.now() - t0);
  }
}

/**
 * Format marks + total as a single Server-Timing header value.
 * Spec: `name;dur=ms[, name;dur=ms]...` — names must be tokens, no spaces.
 */
export function formatServerTiming(
  marks: ReadonlyArray<TimingMark>,
  totalMs: number,
): string {
  const parts = marks.map(
    (m) => `${sanitizeLabel(m.label)};dur=${m.dur.toFixed(1)}`,
  );
  parts.push(`total;dur=${totalMs.toFixed(1)}`);
  return parts.join(", ");
}

function sanitizeLabel(label: string): string {
  // Server-Timing names must be RFC 7230 tokens. Replace anything
  // non-token-safe with hyphen.
  return label.replace(/[^A-Za-z0-9!#$%&'*+\-.^_`|~]/g, "-") || "x";
}
