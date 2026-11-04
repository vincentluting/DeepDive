// API Route Protection — combines auth check + rate limiting
//
// Usage:
//   const guard = await guardRoute(request, { tier: 'ai' })
//   if (guard.blocked) return guard.response
//
// Tiers:
//   'ai'    — 10 req/hr anonymous, 20 req/hr authenticated
//   'auth'  — 10 req/min (login/register brute-force protection)
//   'write' — 30 req/min anonymous, 60 req/min authenticated
//   'read'  — 60 req/min anonymous, 120 req/min authenticated
//   'admin' — 60 req/min authenticated only, requires isAdmin

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, type RateLimitConfig } from "@/lib/api/rate-limit";
import {
  isHighCostRoute,
  checkHighCostRateLimit,
} from "@/lib/api/rate-limit-redis";
import { getCurrentUser } from "@/lib/auth";
import { isUserAdmin } from "@/lib/auth/admin";

type GuardTier = "ai" | "write" | "read" | "admin" | "auth" | "telemetry";

// Rate limit tiers — chosen based on industry norms (Mixpanel / Segment / Vercel
// Analytics) and the cost profile of each endpoint category:
//   ai        — expensive LLM calls, strict cap
//   auth      — brute-force protection on login/register
//   write     — stateful mutations (session/save, profiles, reports) — raised
//               to 120/min for authenticated users so that rapid-fire DD answer
//               saves don't trip the limiter during normal completion pace
//   read      — cheap GET requests
//   admin     — internal tools
//   telemetry — fire-and-forget funnel events / page views, high burst allowance;
//               dropped silently at the handler layer if ever exceeded so the
//               client never sees a 429 for non-critical tracking
const RATE_LIMITS: Record<
  GuardTier,
  { anonymous: RateLimitConfig; authenticated: RateLimitConfig }
> = {
  ai: {
    anonymous: { maxRequests: 10, windowSeconds: 3600 },
    authenticated: { maxRequests: 20, windowSeconds: 3600 },
  },
  auth: {
    anonymous: { maxRequests: 10, windowSeconds: 60 },
    authenticated: { maxRequests: 10, windowSeconds: 60 },
  },
  write: {
    anonymous: { maxRequests: 30, windowSeconds: 60 },
    authenticated: { maxRequests: 120, windowSeconds: 60 },
  },
  read: {
    anonymous: { maxRequests: 60, windowSeconds: 60 },
    authenticated: { maxRequests: 120, windowSeconds: 60 },
  },
  admin: {
    anonymous: { maxRequests: 60, windowSeconds: 60 },
    authenticated: { maxRequests: 60, windowSeconds: 60 },
  },
  telemetry: {
    anonymous: { maxRequests: 120, windowSeconds: 60 },
    authenticated: { maxRequests: 240, windowSeconds: 60 },
  },
};

type GuardOptions = {
  tier: GuardTier;
  requireAuth?: boolean;
};

type GuardUser = {
  id: string;
  email: string;
  name?: string | null;
  isAdmin?: boolean;
  cohort?: string | null;
  researchGroup?: "classic" | "immersive" | null;
};

type GuardResult =
  | { blocked: false; user: GuardUser | null }
  | { blocked: true; response: NextResponse };

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export async function guardRoute(
  request: NextRequest,
  options: GuardOptions,
): Promise<GuardResult> {
  const { tier, requireAuth = false } = options;

  // Admin tier always requires auth
  const effectiveRequireAuth = tier === "admin" ? true : requireAuth;

  let user: GuardUser | null = null;
  try {
    user = await getCurrentUser();
  } catch {
    // Auth check failed — treat as anonymous
  }

  if (effectiveRequireAuth && !user) {
    return {
      blocked: true,
      response: NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 },
      ),
    };
  }

  // Admin tier: check admin status (DB isAdmin column + ADMIN_EMAILS env var)
  if (tier === "admin" && user) {
    const admin = await isUserAdmin(user.id, user.email);
    if (!admin) {
      return {
        blocked: true,
        response: NextResponse.json(
          { error: "Admin access required" },
          { status: 403 },
        ),
      };
    }
  }

  const ip = getClientIP(request);

  // High-cost endpoints: check Redis rate limit first (persistent across instances)
  const routePath = new URL(request.url).pathname;
  if (isHighCostRoute(routePath)) {
    const redisIdentifier = user ? `user:${user.id}` : `ip:${ip}`;
    const redisResult = await checkHighCostRateLimit(
      redisIdentifier,
      routePath,
    );
    if (!redisResult.allowed) {
      const retryAfter = Math.ceil((redisResult.resetAt - Date.now()) / 1000);
      return {
        blocked: true,
        response: NextResponse.json(
          { error: "Too many requests. Please try again later.", retryAfter },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.max(1, retryAfter)),
              "X-RateLimit-Remaining": "0",
            },
          },
        ),
      };
    }
  }

  // Standard in-memory rate limiting (all endpoints)
  const rateLimitKey = user ? `user:${user.id}:${tier}` : `ip:${ip}:${tier}`;
  const config = user
    ? RATE_LIMITS[tier].authenticated
    : RATE_LIMITS[tier].anonymous;
  const result = checkRateLimit(rateLimitKey, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return {
      blocked: true,
      response: NextResponse.json(
        { error: "Too many requests. Please try again later.", retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
          },
        },
      ),
    };
  }

  return {
    blocked: false,
    user: tier === "admin" && user ? { ...user, isAdmin: true } : user,
  };
}
