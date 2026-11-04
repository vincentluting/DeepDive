// ============================================================
// Client Error Reporter — observability for UI components
//
// Standard helper for reporting errors caught in client components
// (e.g. failed fetches, unexpected state). Guarantees:
//   1. dev:  console.error with component tag
//   2. prod: Sentry.captureException with component/feature tags
//
// Use this in every catch block that would otherwise silently
// return null or set an error state without trace. Silent UI
// failures are an architectural smell — they make broken features
// indistinguishable from missing features in production.
//
// Example:
//   import { reportClientError } from "@/lib/observability/client-error";
//
//   .catch((err) => {
//     reportClientError(err, { component: "PersonalizedInsight" });
//     setError(true);
//   });
// ============================================================

import * as Sentry from "@sentry/nextjs";

interface ReportClientErrorOptions {
  /** Component name, e.g. "PersonalizedInsight". Used as Sentry tag. */
  component: string;
  /** Optional feature tag for grouping, e.g. "quickdive" or "checkout". */
  feature?: string;
  /** Extra context for Sentry (non-sensitive). */
  extra?: Record<string, unknown>;
  /**
   * Sentry severity. Default "warning" — UI errors are typically recoverable
   * and shouldn't page on-call. Use "error" for data-loss or hard failures.
   */
  level?: "fatal" | "error" | "warning" | "info";
}

/**
 * Report a client-side error to the console (dev) and Sentry (prod).
 * Never throws — observability must never cascade into new failures.
 */
export function reportClientError(
  error: unknown,
  options: ReportClientErrorOptions,
): void {
  const { component, feature, extra, level = "warning" } = options;

  // Dev: always log so it's visible during development
  if (process.env.NODE_ENV !== "production") {
    // Prefixed for grep-ability
    console.error(`[${component}]`, error);
  }

  // Prod: forward to Sentry with consistent tags
  try {
    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        tags: {
          component,
          ...(feature ? { feature } : {}),
          errorSurface: "ui-client",
        },
        extra,
        level,
      },
    );
  } catch {
    // Sentry is best-effort; never let observability crash the app.
  }
}
