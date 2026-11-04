// ============================================================
// Shared E2E Setup — DRY helper for test specs that need
// an authenticated user with a completed pipeline.
//
// Single source of truth for: CSRF → QuickDive → Register →
// Claim → DeepDive → Score → Profile → Report
//
// If any API contract changes, fix it HERE, not in 3 specs.
// ============================================================

import { expect, type APIRequestContext } from "@playwright/test";
import {
  RIASEC_SCORES,
  SJT_ANSWERS,
  DDVQ21_ANSWERS,
  IPIP60_ANSWERS,
  QUICKDIVE_RESULT_DATA,
  buildDeepDiveAnswers,
} from "./test-answers";
import * as fs from "fs";
import * as path from "path";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;
const SETUP_API_TIMEOUT_MS =
  process.env.E2E_MANAGED === "true" ? 90_000 : 60_000;

export interface TestContext {
  userId: string;
  csrfToken: string;
  sessionCookie: string;
  quickDiveResultId: string;
  questionnaireSessionId: string;
  assessmentId: string;
  profileId: string | undefined;
  reportId: string | undefined;
}

/** Build CSRF + unauthenticated headers */
export function apiHeaders(csrfToken: string): Record<string, string> {
  return {
    "x-csrf-token": csrfToken,
    cookie: `csrf-token=${csrfToken}`,
  };
}

/** Build CSRF + authenticated headers */
export function authedHeaders(
  csrfToken: string,
  sessionCookie: string,
): Record<string, string> {
  return {
    "x-csrf-token": csrfToken,
    cookie: `csrf-token=${csrfToken}; ${sessionCookie}`,
  };
}

/** Obtain a CSRF token from the middleware */
export async function obtainCsrf(request: APIRequestContext): Promise<string> {
  // Hit a known public page — `/` may 403 if the request context
  // lacks a browser User-Agent and the middleware blocks bots.
  const res = await request.get(`${BASE}/en/explore`, { timeout: 60_000 });
  const setCookies = res.headers()["set-cookie"] ?? "";
  const cookieStr = Array.isArray(setCookies)
    ? setCookies.join("; ")
    : setCookies;
  const csrfMatch = cookieStr.match(/csrf-token=([^;]+)/);
  return csrfMatch ? csrfMatch[1] : crypto.randomUUID();
}

/** Register a user and return the session cookie string */
export async function registerUser(
  request: APIRequestContext,
  csrfToken: string,
  email: string,
  password: string,
  name: string,
): Promise<string> {
  const res = await request.post(`${BASE}/api/auth/register`, {
    headers: apiHeaders(csrfToken),
    data: { email, password, name },
    timeout: SETUP_API_TIMEOUT_MS,
  });
  expect(res.ok(), `Register failed: ${res.status()}`).toBeTruthy();
  const setCookies = res.headers()["set-cookie"] ?? "";
  const cookieStr = Array.isArray(setCookies)
    ? setCookies.join("; ")
    : setCookies;
  const sessionMatch = cookieStr.match(/session=([^;]+)/);
  expect(sessionMatch, "Session cookie not found").toBeTruthy();
  return `session=${sessionMatch![1]}`;
}

/**
 * Build a full State 2 user: QuickDive → Register → Claim → DeepDive → Score → Profile → Report
 *
 * Returns a TestContext with all IDs. reportId/profileId may be undefined if LLM is unavailable.
 */
export async function buildState2User(
  request: APIRequestContext,
  email: string,
  password: string,
  name: string,
): Promise<TestContext> {
  const profileReady = await buildProfileReadyUser(
    request,
    email,
    password,
    name,
  );
  const auth = () =>
    authedHeaders(profileReady.csrfToken, profileReady.sessionCookie);

  // Report (requires LLM — may fail with 503)
  let reportId: string | undefined;
  const reportRes = await request.post(`${BASE}/api/generate-report`, {
    headers: auth(),
    data: {
      assessmentId: profileReady.assessmentId,
      sessionId: profileReady.questionnaireSessionId,
      locale: "en",
    },
    timeout: 120_000,
  });
  if (reportRes.ok()) {
    const reportBody = await reportRes.json();
    reportId = reportBody.reportId;
  }

  // Wait for fire-and-forget journey transitions to settle.
  const expectedState = reportId ? "report_generated" : "profile_generated";
  await waitForJourneyState(request, auth, expectedState);

  return {
    ...profileReady,
    reportId,
  };
}

export async function buildProfileReadyUser(
  request: APIRequestContext,
  email: string,
  password: string,
  name: string,
): Promise<TestContext> {
  const csrfToken = await obtainCsrf(request);
  const headers = () => apiHeaders(csrfToken);

  // Quick Dive
  const qdRes = await request.post(`${BASE}/api/quickdive/save`, {
    headers: headers(),
    data: {
      scores: RIASEC_SCORES,
      code: "AI",
      label: "The Creative Analyst",
      locale: "en",
      exploreMode: "narrative",
      resultData: QUICKDIVE_RESULT_DATA,
    },
    timeout: SETUP_API_TIMEOUT_MS,
  });
  expect(qdRes.ok()).toBeTruthy();
  const quickDiveResultId = (await qdRes.json()).id;

  // Register
  const sessionCookie = await registerUser(
    request,
    csrfToken,
    email,
    password,
    name,
  );
  const auth = () => authedHeaders(csrfToken, sessionCookie);

  const meRes = await request.get(`${BASE}/api/auth/me`, {
    headers: auth(),
    timeout: SETUP_API_TIMEOUT_MS,
  });
  expect(meRes.ok(), `Auth me failed: ${meRes.status()}`).toBeTruthy();
  const meBody = (await meRes.json()) as { user?: { id?: string } | null };
  const userId = meBody.user?.id;
  expect(userId, "User ID missing from /api/auth/me").toBeTruthy();

  // Set cohort for entitlement access (E2E test-only endpoint)
  await request.post(`${BASE}/api/test/set-cohort`, {
    headers: apiHeaders(csrfToken),
    data: { email, cohort: "beta_2026" },
    timeout: SETUP_API_TIMEOUT_MS,
  });

  // Claim
  await request.post(`${BASE}/api/quickdive/claim`, {
    headers: auth(),
    data: { resultId: quickDiveResultId },
    timeout: SETUP_API_TIMEOUT_MS,
  });

  // Deep Dive session
  const questionnaireSessionId = crypto.randomUUID();
  await request.post(`${BASE}/api/session/create`, {
    headers: auth(),
    data: { sessionId: questionnaireSessionId, tier: "deep", language: "en" },
    timeout: SETUP_API_TIMEOUT_MS,
  });
  await request.post(`${BASE}/api/session/save`, {
    headers: auth(),
    data: {
      sessionId: questionnaireSessionId,
      answers: buildDeepDiveAnswers(),
      currentModule: "C",
      currentQuestionIndex: 59,
      language: "en",
    },
    timeout: SETUP_API_TIMEOUT_MS,
  });

  // Score
  const scoreRes = await request.post(`${BASE}/api/score`, {
    headers: auth(),
    data: {
      sessionId: questionnaireSessionId,
      sjt: SJT_ANSWERS,
      values: DDVQ21_ANSWERS,
      ipip: IPIP60_ANSWERS,
      riasecNormalized: RIASEC_SCORES,
      locale: "en",
    },
    timeout: SETUP_API_TIMEOUT_MS,
  });
  expect(scoreRes.ok()).toBeTruthy();
  const assessmentId = (await scoreRes.json()).id;

  // Profile (algorithm + LLM letter)
  let profileId: string | undefined;
  const profileRes = await request.post(`${BASE}/api/generate-profile`, {
    headers: auth(),
    data: { assessmentId, locale: "en" },
    timeout: SETUP_API_TIMEOUT_MS,
  });
  if (profileRes.ok()) {
    const profileBody = await profileRes.json();
    profileId = profileBody.id;
  }
  await waitForJourneyState(request, auth, "profile_generated");

  return {
    userId: userId!,
    csrfToken,
    sessionCookie,
    quickDiveResultId,
    questionnaireSessionId,
    assessmentId,
    profileId,
    reportId: undefined,
  };
}

async function waitForJourneyState(
  request: APIRequestContext,
  authHeaders: () => Record<string, string>,
  expectedState:
    | "deep_dive_complete"
    | "profile_generated"
    | "report_generated",
) {
  // Several API routes call transitionJourney() fire-and-forget.
  // Poll until the visible state settles or time out after 5 seconds.
  for (let i = 0; i < 10; i++) {
    const journeyRes = await request.get(`${BASE}/api/journey`, {
      headers: authHeaders(),
    });
    if (journeyRes.ok()) {
      const { state } = await journeyRes.json();
      if (state === expectedState || state === "coaching_unlocked") break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

/** Load the shared TestContext created by global-setup (file read only) */
export function loadSharedContext(): TestContext & { email: string } {
  const contextPath = path.join(__dirname, "..", ".shared-context.json");
  if (!fs.existsSync(contextPath)) {
    throw new Error(
      `[loadSharedContext] ${contextPath} not found.\n` +
        `Global setup likely failed — check global-setup output for details.`,
    );
  }
  try {
    const raw = fs.readFileSync(contextPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `[loadSharedContext] Failed to parse ${contextPath}: ${(err as Error).message}`,
      { cause: err },
    );
  }
}

/**
 * Load shared context with a fresh CSRF token.
 *
 * The global-setup's CSRF token belongs to a different HTTP client.
 * For the double-submit cookie pattern, we just need header == cookie.
 * Generate a fresh UUID — no server roundtrip needed.
 */
export function loadSharedContextWithCsrf(): TestContext & { email: string } {
  const shared = loadSharedContext();
  return { ...shared, csrfToken: crypto.randomUUID() };
}

/**
 * Resilient shared context loader — eliminates global-setup as a single point of failure.
 *
 * Fast path: reads cached .shared-context.json written by global-setup.
 * Fallback: if the file is missing, corrupt, or contains a setup error,
 *           builds a fresh pipeline user independently.
 *
 * Each spec can call this in beforeAll without needing global-setup to succeed.
 */
export async function ensureSharedContext(): Promise<
  TestContext & { email: string }
> {
  const contextPath = path.join(__dirname, "..", ".shared-context.json");

  // Fast path: global-setup already built a valid context
  if (fs.existsSync(contextPath)) {
    try {
      const raw = fs.readFileSync(contextPath, "utf-8");
      const cached = JSON.parse(raw);
      // Validate: sessionCookie present = pipeline reached Register; no _setupError
      if (cached.sessionCookie && !cached._setupError) {
        return { ...cached, csrfToken: crypto.randomUUID() };
      }
      console.warn(
        "[ensureSharedContext] Cached context invalid (setup error or incomplete) — rebuilding",
      );
    } catch {
      console.warn(
        "[ensureSharedContext] Cached context unreadable — rebuilding",
      );
    }
  } else {
    console.warn(
      "[ensureSharedContext] No cached context found — building fresh user",
    );
  }

  // Fallback: build our own pipeline user with a standalone request context
  const { request: pwRequest } = await import("@playwright/test");
  const port = process.env.E2E_PORT || "3000";
  const reqCtx = await pwRequest.newContext({
    baseURL: `http://localhost:${port}`,
    extraHTTPHeaders: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  try {
    const email = `e2e-fallback-${Date.now()}@test.deepdive.dev`;
    const testContext = await buildState2User(
      reqCtx,
      email,
      "FallbackTestPass123!",
      "E2E Fallback User",
    );
    const contextWithEmail = { ...testContext, email };

    // Cache for subsequent specs in this run
    fs.writeFileSync(contextPath, JSON.stringify(contextWithEmail, null, 2));

    console.log(
      `[ensureSharedContext] Built fallback user: ${email} ` +
        `(report: ${testContext.reportId ? "✓" : "✗"})`,
    );

    return { ...contextWithEmail, csrfToken: crypto.randomUUID() };
  } finally {
    await reqCtx.dispose();
  }
}

export async function promoteTestUserToAdmin(email: string): Promise<void> {
  if (!email.endsWith("@test.deepdive.dev")) {
    throw new Error(
      "[promoteTestUserToAdmin] Refusing to promote a non-test user",
    );
  }

  const csrfToken = crypto.randomUUID();
  const res = await fetch(`${BASE}/api/test/set-cohort`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
      cookie: `csrf-token=${csrfToken}`,
    },
    body: JSON.stringify({
      email,
      cohort: "beta_2026",
      isAdmin: true,
    }),
  });
  expect(
    res.ok,
    `[promoteTestUserToAdmin] Failed to promote ${email}: ${res.status} ${await res.text()}`,
  ).toBeTruthy();
}

/** Best-effort cleanup of a single test user */
export async function cleanupTestUser(
  request: APIRequestContext,
  email: string,
): Promise<void> {
  if (process.env.E2E_MANAGED === "true") {
    return;
  }

  try {
    const csrfToken = crypto.randomUUID();
    await request
      .post(`${BASE}/api/test/cleanup`, {
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
          cookie: `csrf-token=${csrfToken}`,
        },
        data: { email },
        timeout: 10_000,
      })
      .catch(() => {});
  } catch {
    // best-effort
  }
}

/** Best-effort cleanup of ALL *@test.deepdive.dev users (safety net for interrupted runs) */
export async function cleanupAllTestUsers(
  request: APIRequestContext,
): Promise<void> {
  try {
    const csrfToken = crypto.randomUUID();
    const res = await request.post(`${BASE}/api/test/cleanup`, {
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
        cookie: `csrf-token=${csrfToken}`,
      },
      data: { all: true },
      timeout: 60_000,
    });
    if (res.ok()) {
      const body = await res.json();
      if (body.deletedCount > 0) {
        console.log(
          `[test-setup] Pre-cleaned ${body.deletedCount} stale test user(s)`,
        );
      }
    } else {
      console.warn(
        `[test-setup] Cleanup API returned ${res.status()}: ${await res.text()}`,
      );
    }
  } catch (err) {
    console.warn("[test-setup] Cleanup failed:", err);
  }
}

export async function seedProfileNarratives(
  request: APIRequestContext,
  csrfToken: string,
  email: string,
  assessmentId?: string,
): Promise<boolean> {
  try {
    const res = await request.post(`${BASE}/api/test/seed-profile-narratives`, {
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
        cookie: `csrf-token=${csrfToken}`,
      },
      data: { email, assessmentId },
    });
    return res.ok();
  } catch {
    return false;
  }
}
