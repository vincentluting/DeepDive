import { type NextRequest, NextResponse, after } from "next/server";
import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";

// All locales with fully maintained dictionaries are listed here.
// To re-enable a language: add it here once its dictionaries are verified.
const ACTIVE_LOCALES = [
  "en",
  "zh",
  "nl",
  "de",
  "es",
  "fr",
  "it",
  "ja",
  "ko",
  "pt",
  "ru",
] as const;
type ActiveLocale = (typeof ACTIVE_LOCALES)[number];
const isActiveLocale = (v: string): v is ActiveLocale =>
  (ACTIVE_LOCALES as readonly string[]).includes(v);
import {
  trackPageVisit,
  detectDeviceType,
} from "@/lib/analytics/page-tracking";
import { sql } from "@/lib/db/connection";
import { classifyRequest } from "@/lib/security/bot-detection";

const PUBLIC_FILE = /\.(.*)$/;
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const STATE_CHANGING_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

/**
 * Analytics endpoints that are exempt from CSRF validation.
 * These are called via sendBeacon() which cannot set custom headers.
 * They only accept anonymous tracking data (no state changes), so
 * exempting them from CSRF poses no security risk.
 */
const ANALYTICS_CSRF_EXEMPT = [
  "/api/analytics/duration",
  "/api/analytics/report-engagement",
  "/api/analytics/event",
  "/api/session/save-beacon",
  "/api/coaching-save-beacon",
  "/api/auth/oauth/callback",
  "/api/stripe/webhook", // Stripe sends signature header, not CSRF token
];

/** Paths to exclude from page visit tracking */
const TRACKING_EXCLUDE = ["/api/", "/_next/", "/ctrl/"];

const I18N_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/dashboard",
  "/deepdive",
  "/report",
  "/profile",
  "/reports",
  "/admin",
  "/coaching",
  "/quickdive",
  "/settings",
  "/legal",
  "/explore",
  "/questionnaire",
  "/companions", // covers both /companions and /companions/[userId]
];

const NON_I18N_PATHS = ["/api/", "/_next/"];

function shouldApplyI18n(pathname: string): boolean {
  for (const path of NON_I18N_PATHS) {
    if (pathname.startsWith(path)) {
      return false;
    }
  }

  if (pathname.match(/^\/report\/[^/]+$/)) {
    return true;
  }

  for (const path of I18N_PATHS) {
    if (
      pathname === path ||
      pathname === path + "/" ||
      pathname.startsWith(path + "/")
    ) {
      return true;
    }
  }

  if (pathname === "/" || pathname === "") {
    return true;
  }

  return false;
}

function getPreferredLocale(request: NextRequest): Locale {
  // 1. Check NEXT_LOCALE cookie — only honor if it points to an active locale.
  // Stale cookies from previously-active locales fall through to step 2.
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isActiveLocale(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Parse Accept-Language header, matching only against ACTIVE_LOCALES.
  const acceptLanguage = request.headers.get("Accept-Language");
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(",")
      .map((lang: string) => {
        const [code, q] = lang.trim().split(";q=");
        const parsed = q ? parseFloat(q) : 1;
        return {
          code: code.trim().toLowerCase(),
          q: Number.isNaN(parsed) ? 0 : parsed,
        };
      })
      .sort((a: { q: number }, b: { q: number }) => b.q - a.q);

    for (const { code } of preferred) {
      const match = ACTIVE_LOCALES.find(
        (locale) => code === locale || code.startsWith(`${locale}-`),
      );
      if (match) return match;
    }
  }

  // 3. Fallback to default (which is always an active locale).
  return defaultLocale;
}

/**
 * Ensure the CSRF cookie is set on the response.
 * Uses the double-submit cookie pattern: the cookie is readable by JS
 * so the client can send it back in a header.
 */
function ensureCsrfCookie(request: NextRequest, response: NextResponse): void {
  if (!request.cookies.get(CSRF_COOKIE_NAME)?.value) {
    response.cookies.set(CSRF_COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: false, // Client JS needs to read this
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }
}

/**
 * Validate CSRF token for state-changing API requests.
 * Skip for requests using Bearer token auth (admin/machine endpoints).
 */
function validateCsrf(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Only validate for API state-changing methods
  if (
    !pathname.startsWith("/api/") ||
    !STATE_CHANGING_METHODS.includes(request.method)
  ) {
    return null;
  }

  // Skip CSRF for sendBeacon analytics endpoints (cannot set custom headers)
  if (ANALYTICS_CSRF_EXEMPT.some((path) => pathname === path)) {
    return null;
  }

  // Skip CSRF for Bearer-authenticated requests (admin endpoints)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Check if a given pathname should be tracked as a page visit.
 * Only track GET requests to page routes (exclude API, _next, ctrl, etc.)
 */
function shouldTrackVisit(pathname: string, method: string): boolean {
  if (method !== "GET") return false;
  for (const prefix of TRACKING_EXCLUDE) {
    if (pathname.startsWith(prefix)) return false;
  }
  return true;
}

/**
 * Schedule async page visit tracking via `after()`.
 * Runs after the response is sent — never blocks the user.
 * Returns the pre-generated visitId so the caller can set it as a cookie,
 * enabling client-side dwell-time reporting via /api/analytics/duration.
 */
function schedulePageTracking(
  request: NextRequest,
): { visitId: string; visitSessionId: string } | null {
  // Skip tracking entirely for owner-marked browsers
  if (request.cookies.get("_dd_owner")?.value === "1") return null;

  // Skip tracking in local dev — prevents E2E test PVs from polluting analytics
  if (process.env.NODE_ENV === "development") return null;

  const { pathname } = request.nextUrl;
  if (!shouldTrackVisit(pathname, request.method)) return null;

  // Generate visitId BEFORE after() so it can be returned synchronously
  const visitId = crypto.randomUUID();

  // Reuse or create a 30-min sliding session identifier for cross-page stitching
  const existingSessionId = request.cookies.get("visit-session-id")?.value;
  const visitSessionId = existingSessionId ?? crypto.randomUUID();

  after(async () => {
    try {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      const country =
        request.headers.get("x-vercel-ip-country") ??
        request.headers.get("cf-ipcountry") ??
        null;
      const userAgent = request.headers.get("user-agent") ?? null;
      const referer = request.headers.get("referer") ?? null;
      const sessionId = request.cookies.get("session")?.value ?? null;

      // Resolve userId from session and check admin status in a single query.
      // This avoids a duplicate UserSession lookup in page-tracking.ts.
      // Admins are excluded from tracking here so we can return early.
      let userId: string | null = null;
      if (sessionId) {
        try {
          const rows = await sql`
            SELECT s."userId", u."isAdmin", u."email"
            FROM "UserSession" s
            JOIN "User" u ON u."id" = s."userId"
            WHERE s."id" = ${sessionId} AND s."expiresAt" > NOW()
            LIMIT 1
          `;
          if (rows.length > 0) {
            userId = rows[0].userId as string;
            const isAdminDb = rows[0].isAdmin === true;
            const adminEmails = process.env.ADMIN_EMAILS;
            const isAdminEnv = adminEmails
              ? adminEmails
                  .split(",")
                  .map((e: string) => e.trim().toLowerCase())
                  .includes((rows[0].email as string).toLowerCase())
              : false;
            // Skip tracking for admin users to avoid polluting analytics data
            if (isAdminDb || isAdminEnv) return;
          }
        } catch {
          // Session lookup failed — continue without userId
        }
      }

      // Enriched visitor fields from Vercel headers
      const city = request.headers.get("x-vercel-ip-city") ?? null;
      const region = request.headers.get("x-vercel-ip-country-region") ?? null;
      const timezone = request.headers.get("x-vercel-ip-timezone") ?? null;
      const secChUaMobile = request.headers.get("sec-ch-ua-mobile");
      const isMobile = secChUaMobile !== null ? secChUaMobile === "?1" : null;
      const rawPlatform = request.headers.get("sec-ch-ua-platform");
      const platform = rawPlatform ? rawPlatform.replace(/^"|"$/g, "") : null;
      const rawLang = request.headers.get("accept-language");
      const acceptLanguage = rawLang ? rawLang.slice(0, 100) : null;
      const deviceType = detectDeviceType(userAgent);

      // UTM parameters (only present on first landing with campaign links)
      const sp = request.nextUrl.searchParams;
      const utmSource = sp.get("utm_source");
      const utmMedium = sp.get("utm_medium");
      const utmCampaign = sp.get("utm_campaign");
      const utmContent = sp.get("utm_content");

      await trackPageVisit({
        visitId,
        path: pathname,
        ip,
        userAgent,
        referer,
        userId,
        country,
        city,
        region,
        timezone,
        isMobile,
        platform,
        acceptLanguage,
        deviceType,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        visitSessionId,
      });
    } catch {
      // Tracking must never fail loudly
    }
  });

  return { visitId, visitSessionId };
}

/**
 * Set tracking cookies after scheduling a page visit.
 * - visit-id: per-page identifier for dwell-time reporting (httpOnly=false, 1h)
 * - visit-session-id: 30-min sliding session for cross-page stitching (httpOnly=false)
 */
function applyTrackingCookies(
  result: { visitId: string; visitSessionId: string } | null,
  response: NextResponse,
): void {
  if (!result) return;
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("visit-id", result.visitId, {
    httpOnly: false,
    maxAge: 60 * 60, // 1 hour — long enough for any single page session
    path: "/",
    sameSite: "strict",
    secure,
  });
  response.cookies.set("visit-session-id", result.visitSessionId, {
    httpOnly: false,
    maxAge: 30 * 60, // 30-minute sliding window
    path: "/",
    sameSite: "strict",
    secure,
  });
}

/** Anti-scraping headers applied to all responses */
const ANTI_SCRAPE_HEADERS: Record<string, string> = {
  // Tell AI crawlers not to use content for training
  "X-Robots-Tag": "noai, noimageai",
};

/**
 * Return a generic 403 for blocked bots.
 * Intentionally opaque — reveals no detection logic.
 */
function botBlockedResponse(): NextResponse {
  return new NextResponse(null, {
    status: 403,
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
}

/** Apply anti-scraping headers to a response */
function applySecurityHeaders(response: NextResponse): void {
  for (const [key, value] of Object.entries(ANTI_SCRAPE_HEADERS)) {
    response.headers.set(key, value);
  }
}

/**
 * Paths that MUST be accessible to machine callers (Vercel cron, UptimeRobot,
 * Datadog synthetics, etc.) that cannot supply browser-like headers
 * (sec-ch-ua, Sec-Fetch-*, Accept-Language). When combined with a Bearer
 * token, these paths bypass bot detection.
 *
 * Security: the endpoints behind these prefixes perform their own Bearer
 * token validation (guardCron / isAuthorized), so bypassing bot detection
 * here does NOT weaken auth — a caller without a valid token still gets 401.
 *
 * Historical context: before this bypass, Vercel cron (UA = `vercel-cron/1.0`,
 * 15 chars) was silently blocked for 23+ days because the UA is <20 chars AND
 * the path matches SENSITIVE_PATH_PATTERNS (/^\/api\//) in bot-detection.ts.
 * analytics_daily_summary hadn't refreshed since 2026-03-16 as a result.
 */
export const MACHINE_AUTH_PATH_PREFIXES = ["/api/cron/", "/api/health/"];

export function isMachineAuthedRequest(
  pathname: string,
  request: NextRequest,
): boolean {
  const matchesPath = MACHINE_AUTH_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (!matchesPath) return false;
  const authHeader = request.headers.get("authorization");
  return !!authHeader && authHeader.startsWith("Bearer ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public files
  if (PUBLIC_FILE.test(pathname) || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // ── Layer 0: Bot Detection (stateless, ~0.1ms) ──────────────
  // Machine-authenticated cron/health endpoints bypass bot detection —
  // their callers (Vercel cron, external monitors) cannot provide
  // browser-like headers. They are still protected by Bearer token auth
  // inside the route handlers (guardCron / isAuthorized), so bypass is safe.
  if (!isMachineAuthedRequest(pathname, request)) {
    const botResult = classifyRequest(request);
    if (botResult.action === "block") {
      if (process.env.NODE_ENV === "production") {
        console.log(
          JSON.stringify({
            event: "bot_blocked",
            reason: botResult.reason,
            category: botResult.category,
            ip:
              request.headers
                .get("x-forwarded-for")
                ?.split(",")[0]
                ?.trim()
                ?.split(".")
                .slice(0, 2)
                .join(".") + ".x.x",
            ua: request.headers.get("user-agent")?.slice(0, 200),
            path: pathname,
            ts: new Date().toISOString(),
          }),
        );
      }
      return botBlockedResponse();
    }
  }

  // CSRF validation for state-changing API requests
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  // 301 redirect: /quickexplore → /quickdive (old path compat)
  const quickexploreMatch = pathname.match(/^\/(en|zh)\/quickexplore(\/.*)?$/);
  if (quickexploreMatch) {
    const locale = quickexploreMatch[1];
    const rest = quickexploreMatch[2] || "";
    const quickdiveUrl = new URL(`/${locale}/quickdive${rest}`, request.url);
    request.nextUrl.searchParams.forEach((value, key) =>
      quickdiveUrl.searchParams.set(key, value),
    );
    return NextResponse.redirect(quickdiveUrl, 301);
  }

  // NOTE: /explore route is active — serves the ExploreHub (3-card selection page).
  // Do NOT redirect /explore to /quickdive.

  // 301 redirect: /questionnaire → /deepdive (route rename)
  const questionnaireMatch = pathname.match(
    /^\/(en|zh)\/questionnaire(\/.*)?$/,
  );
  if (questionnaireMatch) {
    const locale = questionnaireMatch[1];
    const rest = questionnaireMatch[2] || "";
    const deepdiveUrl = new URL(`/${locale}/deepdive${rest}`, request.url);
    request.nextUrl.searchParams.forEach((value, key) =>
      deepdiveUrl.searchParams.set(key, value),
    );
    return NextResponse.redirect(deepdiveUrl, 301);
  }

  // Check if pathname already has a locale prefix (among all known locales).
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    const locale = pathname.split("/")[1] as Locale;

    // Inactive locale URLs (e.g. /nl/quickdive) redirect to the default active
    // locale. This catches direct links, old bookmarks, and stale cookies.
    if (!isActiveLocale(locale)) {
      const rest = pathname.slice(`/${locale}`.length) || "/";
      const target = getPreferredLocale(request);
      const newUrl = new URL(`/${target}${rest}`, request.url);
      request.nextUrl.searchParams.forEach((value, key) =>
        newUrl.searchParams.set(key, value),
      );
      const response = NextResponse.redirect(newUrl);
      response.cookies.set("NEXT_LOCALE", target, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
      ensureCsrfCookie(request, response);
      applySecurityHeaders(response);
      return response;
    }

    const response = NextResponse.next();

    if (request.cookies.get("NEXT_LOCALE")?.value !== locale) {
      response.cookies.set("NEXT_LOCALE", locale, {
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }

    ensureCsrfCookie(request, response);
    applyTrackingCookies(schedulePageTracking(request), response);
    applySecurityHeaders(response);
    return response;
  }

  if (!shouldApplyI18n(pathname)) {
    const response = NextResponse.next();
    ensureCsrfCookie(request, response);
    applyTrackingCookies(schedulePageTracking(request), response);
    applySecurityHeaders(response);
    return response;
  }

  // Detect preferred locale from cookie or Accept-Language header
  const locale = getPreferredLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  request.nextUrl.searchParams.forEach((value, key) =>
    newUrl.searchParams.set(key, value),
  );

  const response = NextResponse.redirect(newUrl);
  response.cookies.set("NEXT_LOCALE", locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  ensureCsrfCookie(request, response);
  applySecurityHeaders(response);
  // Do NOT track redirects — the redirected target will be tracked instead
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
