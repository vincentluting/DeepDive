// ============================================================
// LLM Request Context — AsyncLocalStorage for per-request userId
//
// Why: lib/ai/model-router.ts is a frozen zone (per CLAUDE.md). It calls
// logLLMUsage() without a userId because CallLLMOptions does not expose
// one. As a result, `LLMUsageLog.userId` is always NULL for the four
// LLM tasks that fire during report/profile/coaching generation, which
// breaks Phase 1 of the 99%+ quality plan: we cannot join LLMUsageLog
// back to the user that owns the report.
//
// Fix: top-level entry points (generateCareerReport, generateProfile,
// coaching-chat handler) wrap their work in `withLLMUserId(userId, fn)`.
// The userId is stored in an AsyncLocalStorage that follows the async
// stack down through every callLLM call. logLLMUsage (non-frozen, in
// lib/db/llm-usage.ts) reads from this context as a fallback when
// `data.userId` is null. Model-router stays untouched.
//
// Pattern mirrors lib/api/timing.ts which uses the same approach for
// per-request timing aggregation.
// ============================================================

import { AsyncLocalStorage } from "node:async_hooks";

interface LLMRequestStore {
  userId: string | null;
}

const store = new AsyncLocalStorage<LLMRequestStore>();

/**
 * Run `fn` with `userId` accessible to any nested logLLMUsage call.
 *
 * Idempotent: nesting `withLLMUserId` re-binds for the inner scope only;
 * the outer userId is restored when the inner closure exits.
 */
export async function withLLMUserId<T>(
  userId: string | null | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  return store.run({ userId: userId ?? null }, fn);
}

/**
 * Read the current request-scoped userId. Returns null when no context
 * is active (e.g. unit test, cron job that did not wrap its work).
 */
export function getLLMUserId(): string | null {
  return store.getStore()?.userId ?? null;
}
