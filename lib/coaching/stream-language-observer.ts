// ============================================================
// Coaching stream language observer
//
// Tees a streaming Response so we can watch output tokens and fire a
// Sentry warning if the model drifted off the target locale.
// Observation is strictly non-interfering — user tokens still flow
// through the main branch unchanged.
//
// Lifecycle:
//  - First check once buffer reaches EARLY_SAMPLE_SIZE chars (~600).
//  - A rolling LATE_WINDOW_SIZE (~800 chars) retains the tail so that
//    on stream end we can re-check the closing segment for mid-stream
//    drift that a clean opening would otherwise hide.
//  - If the early check already fired a Sentry event, the late check is
//    suppressed to avoid duplicate alerts.
//  - We deliberately do NOT cancel the observe branch after sampling:
//    Node/Vercel tee() + branch cancel semantics vary, and the extra
//    drain cost is ≤ a few hundred bytes of retained state per stream.
//    Continuing to drain is safer than risking stalls on the user branch.
//
// This is the streaming analogue of enforceOutputLocale. Mid-stream
// interruption is intentionally out of scope here (would require a
// mid-response regenerate protocol); pass1 observability lets us see
// drift in prod before deciding whether to invest in intervention.
// ============================================================

import * as Sentry from "@sentry/nextjs";
import { detectLanguageMismatch } from "@/lib/i18n/language-detect";
import type { Locale } from "@/lib/i18n/config";

const __DEV__ = process.env.NODE_ENV === "development";

interface ObserverContext {
  /** Sentry `task` tag (e.g., "coaching", "coaching-first"). */
  taskId: string;
  /** Sentry `route` tag — the API path for quick filtering. */
  routeName: string;
  /** Sentry `feature` tag (e.g., "coaching"). */
  feature: string;
}

/** Bytes accumulated before we run the first language check. */
const EARLY_SAMPLE_SIZE = 600;
/**
 * Late-stream sample: keep the trailing N chars in a small rolling
 * window so we can re-check at stream end. Catches drift that only
 * shows up in later paragraphs (rare but possible).
 */
const LATE_WINDOW_SIZE = 800;

function isGuardDisabled(): boolean {
  return process.env.LANGUAGE_GUARD_DISABLED === "1";
}

/**
 * Wrap a streaming Response so the response body is tee'd: the user still
 * receives tokens as-is, while a background reader inspects the first
 * ~600 chars AND a final tail sample, reporting locale drift to Sentry.
 *
 * Returns the wrapped Response (same status / headers, different body).
 */
export function observeStreamLocale(
  response: Response,
  locale: Locale | string,
  context: ObserverContext,
): Response {
  if (isGuardDisabled() || !response.body) return response;

  const [userBranch, observeBranch] = response.body.tee();

  void runObserver(observeBranch, locale, context);

  return new Response(userBranch, {
    status: response.status,
    headers: response.headers,
  });
}

async function runObserver(
  observeBranch: ReadableStream<Uint8Array>,
  locale: Locale | string,
  context: ObserverContext,
): Promise<void> {
  const reader = observeBranch.getReader();
  const decoder = new TextDecoder();
  let earlyBuf = "";
  let earlyChecked = false;
  /** Rolling window of the latest chars for a final-segment check. */
  let tailBuf = "";
  let droveEarlyMismatch = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      if (!earlyChecked) {
        earlyBuf += chunk;
        if (earlyBuf.length >= EARLY_SAMPLE_SIZE) {
          earlyChecked = true;
          droveEarlyMismatch = runLanguageCheck(
            earlyBuf,
            locale,
            context,
            "early",
          );
        }
      }

      // Keep a rolling tail window even after the early check passed, so
      // we can catch mid/late drift (LLM occasionally switches mid-reply).
      tailBuf = (tailBuf + chunk).slice(-LATE_WINDOW_SIZE);
    }

    // Stream ended. If we never reached EARLY_SAMPLE_SIZE, run the check on
    // whatever we have. Otherwise, if early was clean, re-check the tail
    // window to catch late drift. If early already flagged mismatch, skip
    // late check to avoid duplicate Sentry events.
    if (!earlyChecked && earlyBuf.length > 0) {
      runLanguageCheck(earlyBuf, locale, context, "early");
    } else if (earlyChecked && !droveEarlyMismatch && tailBuf.length > 0) {
      runLanguageCheck(tailBuf, locale, context, "late");
    }
  } catch (err) {
    // Most common reason: the user branch was cancelled (client disconnect),
    // which tears down the whole tee. That's not a problem for us.
    if (__DEV__) {
      console.warn(
        `[stream-language-observer] ${context.taskId} observe reader ended:`,
        err,
      );
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // lock may already be released
    }
  }
}

/**
 * Run the mismatch detector against a sample. Returns true if a mismatch
 * was reported, so the caller can suppress duplicate checks.
 */
function runLanguageCheck(
  sample: string,
  locale: Locale | string,
  context: ObserverContext,
  phase: "early" | "late",
): boolean {
  const mismatch = detectLanguageMismatch(sample, locale);
  if (!mismatch.isMismatch) return false;

  try {
    Sentry.captureMessage(`[language-guard] ${context.taskId} stream drift`, {
      level: "warning",
      tags: {
        feature: context.feature,
        task: context.taskId,
        targetLocale: String(locale),
        guardPhase: phase === "late" ? "stream-observe-late" : "stream-observe",
        route: context.routeName,
      },
      extra: {
        foreignRatio: Number(mismatch.foreignRatio.toFixed(3)),
        foreignScripts: mismatch.foreignScripts,
        sample: sample.slice(0, 200),
      },
    });
  } catch {
    // Sentry failure must never interfere with the stream.
  }

  if (__DEV__) {
    console.warn(
      `[stream-language-observer] ${context.taskId} drift (${phase}) on ${String(locale)}: foreignRatio=${mismatch.foreignRatio.toFixed(3)}, scripts=${mismatch.foreignScripts.join(",")}`,
    );
  }
  return true;
}
