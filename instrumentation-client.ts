// Sentry client-side configuration
// This file configures the initialization of Sentry for the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./lib/observability/sentry-scrub";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

installDevelopmentPerformanceMeasureGuard();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // `release` is injected by withSentryConfig in next.config.mjs at build
    // time — do not set it here (manual values collide with the SDK and drop
    // source-map associations). environment must be set manually since the
    // Sentry Next SDK does not auto-detect it.
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.VERCEL_ENV ??
      process.env.NODE_ENV ??
      "development",

    // Sample 10% of transactions in production, 100% in dev
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Filter out noisy errors
    ignoreErrors: [
      // Next.js 404 navigation
      "NEXT_NOT_FOUND",
      // Browser extensions and ad blockers
      "ResizeObserver loop",
      "ResizeObserver loop completed with undelivered notifications",
      // Network errors from user's connection
      "Failed to fetch",
      "Load failed",
      "NetworkError",
    ],

    beforeSend(event) {
      // Filter out 404 responses
      if (event.contexts?.response?.status_code === 404) {
        return null;
      }
      return scrubSentryEvent(event);
    },
  });
}

function installDevelopmentPerformanceMeasureGuard(): void {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof performance === "undefined" || !performance.measure) return;

  type GuardedMeasure = Performance["measure"] & {
    __deepDiveMeasureGuard?: true;
  };

  const currentMeasure = performance.measure as GuardedMeasure;
  if (currentMeasure.__deepDiveMeasureGuard) return;

  const originalMeasure = currentMeasure.bind(performance);
  const guardedMeasure = ((...args: Parameters<Performance["measure"]>) => {
    try {
      return originalMeasure(...args);
    } catch (error) {
      const [, options] = args;
      if (
        isNegativeMeasureTimestampError(error) &&
        typeof options === "object" &&
        options !== null &&
        "start" in options &&
        "end" in options
      ) {
        const start = Number(options.start);
        const end = Number(options.end);
        if (Number.isFinite(start) && Number.isFinite(end) && start > end) {
          return originalMeasure(args[0], { ...options, end: start });
        }
      }
      throw error;
    }
  }) as GuardedMeasure;

  guardedMeasure.__deepDiveMeasureGuard = true;

  try {
    Object.defineProperty(performance, "measure", {
      configurable: true,
      value: guardedMeasure,
    });
  } catch {
    // If a browser locks the method, leave native behavior untouched.
  }
}

function isNegativeMeasureTimestampError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /negative|start.*end|end.*start|greater than/i.test(error.message);
}
