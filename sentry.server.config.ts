// Sentry server-side configuration
// This file configures the initialization of Sentry for the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./lib/observability/sentry-scrub";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // environment lets Sentry UI filter dev/preview/production builds apart.
    // We deliberately do NOT set `release` here — withSentryConfig in
    // next.config.mjs already injects the per-build release tag and adding
    // one here would collide and drop source-map associations.
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",

    // Sample 10% of transactions in production, 100% in dev
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Filter out noisy errors
    ignoreErrors: ["NEXT_NOT_FOUND"],

    beforeSend(event) {
      // Filter out 404 responses
      if (event.contexts?.response?.status_code === 404) {
        return null;
      }
      return scrubSentryEvent(event);
    },
  });
}
