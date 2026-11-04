// ============================================================
// withLogging — Structured JSON request logging HOF for API routes
//
// Wraps a Next.js route handler to log every request with:
//   method, route, status, durationMs, ip, ts
//
// Usage:
//   export const POST = withLogging('/api/score', async (request) => { ... });
// ============================================================

import { type NextRequest } from "next/server";
import {
  formatServerTiming,
  getTimingMarks,
  runWithTimingContext,
} from "./timing";

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler = (request: NextRequest) => Promise<Response>;
type DynamicRouteHandler = (
  request: NextRequest,
  context: RouteContext,
) => Promise<Response>;

export function withLogging(
  routeName: string,
  handler: RouteHandler,
): RouteHandler;
export function withLogging(
  routeName: string,
  handler: DynamicRouteHandler,
): DynamicRouteHandler;
export function withLogging(
  routeName: string,
  handler: RouteHandler | DynamicRouteHandler,
): RouteHandler | DynamicRouteHandler {
  const wrapped = async (
    request: NextRequest,
    context?: RouteContext,
  ): Promise<Response> => {
    return runWithTimingContext(async () => {
      const start = Date.now();
      let status = 500;
      let response: Response | undefined;

      try {
        response =
          context === undefined
            ? await (handler as RouteHandler)(request)
            : await (handler as DynamicRouteHandler)(request, context);
        status = response.status;

        // Prevent browser heuristic caching of dynamic API responses.
        // Without this header, browsers may serve stale GET responses
        // (e.g. report data that was just generated appears missing).
        if (!response.headers.has("Cache-Control")) {
          response.headers.set(
            "Cache-Control",
            "no-store, no-cache, must-revalidate",
          );
        }

        return response;
      } finally {
        const durationMs = Date.now() - start;
        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown";

        // Emit Server-Timing for latency attribution. Caller-recorded marks
        // (via `timed()` from lib/api/timing) appear alongside `total`, so
        // we can see DB / LLM / render breakdown per route once handlers
        // start instrumenting hot paths.
        if (response && !response.headers.has("Server-Timing")) {
          try {
            response.headers.set(
              "Server-Timing",
              formatServerTiming(getTimingMarks(), durationMs),
            );
          } catch {
            // Header set may throw on locked responses; degradation is fine.
          }
        }

        if (process.env.NODE_ENV === "development") {
          console.log(
            JSON.stringify({
              level: "info",
              route: routeName,
              method: request.method,
              status,
              durationMs,
              ip,
              ts: new Date().toISOString(),
            }),
          );
        }
      }
    });
  };

  return wrapped;
}
