// ============================================================
// Redis-backed Rate Limiting via Upstash
//
// Used for high-cost endpoints (LLM calls) where in-memory
// rate limiting is ineffective on Vercel Serverless.
//
// Graceful fallback: if Redis is not configured, returns
// always-allow so rate limiting never becomes a hard dependency.
//
// Usage:
//   const result = await checkRedisRateLimit('user:123', 10, '1h')
// ============================================================

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimitInstance: Ratelimit | null = null;
let initialized = false;

function getRatelimit(): Ratelimit | null {
  if (initialized) return ratelimitInstance;

  initialized = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    const redis = new Redis({ url, token });
    ratelimitInstance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "deepdive-rl",
    });
    return ratelimitInstance;
  } catch {
    return null;
  }
}

export interface RedisRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * High-cost endpoint rate limiting configs.
 * Only these endpoints use Redis — everything else stays in-memory.
 */
const HIGH_COST_LIMITS: Record<
  string,
  { maxRequests: number; window: string }
> = {
  "/api/coaching-chat": { maxRequests: 10, window: "1 h" },
  "/api/generate-report": { maxRequests: 5, window: "1 h" },
  "/api/generate-profile": { maxRequests: 5, window: "1 h" },
  "/api/action-hub": { maxRequests: 20, window: "1 h" },
  // LLM-backed regeneration endpoints — each call spends model budget.
  // /api/memory covers GET/POST/DELETE, so keep it generous enough for reads
  // while still bounding POST forceRegenerate abuse.
  "/api/memory": { maxRequests: 30, window: "1 h" },
  "/api/report/*/regenerate-pathway": { maxRequests: 10, window: "1 h" },
};

/**
 * Match a runtime pathname against a HIGH_COST_LIMITS key. A key without a
 * wildcard matches by prefix (legacy behavior). A key may use a star segment
 * as a single-segment wildcard, e.g. the regenerate-pathway key matches
 * /api/report/<id>/regenerate-pathway without over-matching the cheap
 * /api/report/<id> read.
 */
function routeMatchesPattern(path: string, pattern: string): boolean {
  if (!pattern.includes("*")) return path.startsWith(pattern);
  const patternSegments = pattern.split("/");
  const pathSegments = path.split("/");
  if (pathSegments.length < patternSegments.length) return false;
  return patternSegments.every(
    (seg, i) => seg === "*" || seg === pathSegments[i],
  );
}

/**
 * Check if a route should use Redis rate limiting.
 */
export function isHighCostRoute(route: string): boolean {
  return Object.keys(HIGH_COST_LIMITS).some((pattern) =>
    routeMatchesPattern(route, pattern),
  );
}

/**
 * Get the rate limit config for a high-cost route.
 */
function getRouteLimit(
  route: string,
): { maxRequests: number; window: string } | null {
  for (const [pattern, config] of Object.entries(HIGH_COST_LIMITS)) {
    if (routeMatchesPattern(route, pattern)) return config;
  }
  return null;
}

/**
 * Check Redis-backed rate limit for high-cost endpoints.
 *
 * Returns { allowed: true } if:
 * - Redis is not configured (graceful fallback)
 * - Route is not high-cost
 * - User is within limits
 */
export async function checkHighCostRateLimit(
  identifier: string,
  route: string,
): Promise<RedisRateLimitResult> {
  const routeLimit = getRouteLimit(route);
  if (!routeLimit) {
    return { allowed: true, remaining: 999, resetAt: 0 };
  }

  const rl = getRatelimit();
  if (!rl) {
    // Redis not configured — fall through to in-memory rate limiting
    return { allowed: true, remaining: 999, resetAt: 0 };
  }

  try {
    // Create a route-specific ratelimit instance
    const url = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
    const redis = new Redis({ url, token });
    const routeRl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        routeLimit.maxRequests,
        routeLimit.window as Parameters<typeof Ratelimit.slidingWindow>[1],
      ),
      prefix: `deepdive-rl:${route}`,
    });

    const result = await routeRl.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  } catch (err) {
    // Redis error — fail open (allow the request)
    console.error(
      "[rate-limit-redis] Redis error, falling back to allow:",
      err instanceof Error ? err.message : err,
    );
    return { allowed: true, remaining: 999, resetAt: 0 };
  }
}
