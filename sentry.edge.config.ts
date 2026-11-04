// Sentry edge runtime configuration
// This file configures the initialization of Sentry for edge features (middleware, edge routes).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./lib/observability/sentry-scrub";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // `release` is injected by withSentryConfig — do not set it here.
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    ignoreErrors: ["NEXT_NOT_FOUND"],
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });
}
