// ============================================================
// Core User Journey — End-to-End API Test
//
// Tests the critical data pipeline:
//   Quick Dive → Register → Claim → Deep Dive → Score → Report
//
// This test runs against a live dev server with a real database.
// LLM calls in report generation will use real APIs if configured,
// or the test will verify the scoring step (which is pure algorithm).
//
// Skip condition: If DATABASE_URL is not available, tests auto-skip.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  RIASEC_SCORES,
  SJT_ANSWERS,
  DDVQ21_ANSWERS,
  IPIP60_ANSWERS,
  QUICKDIVE_RESULT_DATA,
  buildDeepDiveAnswers,
} from "./fixtures/test-answers";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;

// Unique test user per run to avoid conflicts
const TEST_EMAIL = `e2e-test-${Date.now()}@test.deepdive.dev`;
const TEST_PASSWORD = "TestPassword123!";
const TEST_NAME = "E2E Test User";

// Shared state across test steps
let quickDiveResultId: string;
let sessionCookie: string;
let questionnaireSessionId: string;
let assessmentId: string;
let csrfToken: string;

/** Retry a POST request on 429 (rate limit), respecting Retry-After header */
async function postWithRetry(
  request: import("@playwright/test").APIRequestContext,
  url: string,
  options: Parameters<typeof request.post>[1],
  maxRetries = 2,
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await request.post(url, options);
    if (res.status() !== 429 || attempt === maxRetries) return res;
    // Respect Retry-After header (seconds) from rate limiter — window is 60s
    const retryAfter = Number(res.headers()["retry-after"]) || 10;
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
  }
  return request.post(url, options); // unreachable, satisfies TS
}

/** Build headers with CSRF token (and optional session cookie) */
function apiHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "x-csrf-token": csrfToken,
    cookie: `csrf-token=${csrfToken}`,
    ...extra,
  };
  return headers;
}

/** Merge session cookie with CSRF cookie */
function authedHeaders(): Record<string, string> {
  return apiHeaders({ cookie: `csrf-token=${csrfToken}; ${sessionCookie}` });
}

test.describe.serial("Core User Journey", () => {
  // ── Step 0: Obtain CSRF token ──

  test.beforeAll(async ({ request }) => {
    // Hit a known public page to get a csrf-token cookie from the middleware.
    // Using /en/explore instead of / because the root may 403 for non-browser
    // User-Agent strings (bot detection in middleware).
    const res = await request.get(`${BASE}/en/explore`);
    const setCookies = res.headers()["set-cookie"] ?? "";
    const cookieStr = Array.isArray(setCookies)
      ? setCookies.join("; ")
      : setCookies;
    const csrfMatch = cookieStr.match(/csrf-token=([^;]+)/);
    if (csrfMatch) {
      csrfToken = csrfMatch[1];
    } else {
      // Fallback: generate our own token (works with double-submit pattern)
      csrfToken = crypto.randomUUID();
    }
  });

  // ── Step 1: Save Quick Dive result (anonymous) ──

  test("Quick Dive — save RIASEC result", async ({ request }) => {
    const res = await postWithRetry(request, `${BASE}/api/quickdive/save`, {
      headers: apiHeaders(),
      data: {
        scores: RIASEC_SCORES,
        code: "AI", // Artistic-Investigative archetype
        label: "The Creative Analyst",
        locale: "en",
        exploreMode: "narrative",
        resultData: QUICKDIVE_RESULT_DATA,
      },
    });

    expect(res.ok(), `Quick Dive save failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.id).toBeTruthy();
    quickDiveResultId = body.id;
  });

  // ── Step 2: Register a new user ──

  test("Register — create test account", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/register`, {
      headers: apiHeaders(),
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
      },
    });

    expect(res.ok(), `Register failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);

    // Extract session cookie for subsequent authenticated requests
    const setCookies = res.headers()["set-cookie"];
    expect(setCookies).toBeTruthy();
    // Parse session cookie — may be multiple set-cookie values
    const cookieStr = Array.isArray(setCookies)
      ? setCookies.join("; ")
      : setCookies;
    const sessionMatch = cookieStr.match(/session=([^;]+)/);
    expect(sessionMatch, "Session cookie not found in response").toBeTruthy();
    sessionCookie = `session=${sessionMatch![1]}`;

    // Set cohort for entitlement access (report generation requires aiReport)
    await request.post(`${BASE}/api/test/set-cohort`, {
      headers: apiHeaders(),
      data: { email: TEST_EMAIL, cohort: "beta_2026" },
    });
  });

  // ── Step 3: Claim Quick Dive result ──

  test("Claim — associate Quick Dive with user", async ({ request }) => {
    const res = await request.post(`${BASE}/api/quickdive/claim`, {
      headers: authedHeaders(),
      data: { resultId: quickDiveResultId },
    });

    expect(res.ok(), `Claim failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Step 4: Create Deep Dive session ──

  test("Deep Dive — create questionnaire session", async ({ request }) => {
    questionnaireSessionId = crypto.randomUUID();

    const res = await request.post(`${BASE}/api/session/create`, {
      headers: authedHeaders(),
      data: {
        sessionId: questionnaireSessionId,
        tier: "deep",
        language: "en",
      },
    });

    expect(res.ok(), `Session create failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Step 5: Submit Deep Dive answers ──

  test("Deep Dive — submit 86 answers", async ({ request }) => {
    const answers = buildDeepDiveAnswers();

    const res = await request.post(`${BASE}/api/session/save`, {
      headers: authedHeaders(),
      data: {
        sessionId: questionnaireSessionId,
        answers,
        currentModule: "C",
        currentQuestionIndex: 59, // Last IPIP item
        language: "en",
      },
    });

    expect(res.ok(), `Session save failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ── Step 6: Score the assessment ──

  test("Score — run scoring pipeline", async ({ request }) => {
    const res = await request.post(`${BASE}/api/score`, {
      headers: authedHeaders(),
      data: {
        sessionId: questionnaireSessionId,
        sjt: SJT_ANSWERS,
        values: DDVQ21_ANSWERS,
        ipip: IPIP60_ANSWERS,
        riasecNormalized: RIASEC_SCORES,
        locale: "en",
      },
    });

    expect(res.ok(), `Score failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();

    // Verify AssessmentResultV3 structure
    expect(body.id).toBeTruthy();
    assessmentId = body.id;

    // Core scoring outputs should exist (AssessmentResultV3)
    expect(body.bigFive).toBeTruthy();
    expect(body.schwartz).toBeTruthy();
  });

  // ── Step 7: Generate report (LLM-dependent, may skip) ──

  test("Report — trigger generation", async ({ request }) => {
    // Report generation requires LLM API keys
    // If not available, this test verifies the API accepts the request
    const res = await request.post(`${BASE}/api/generate-report`, {
      headers: authedHeaders(),
      data: {
        assessmentId,
        sessionId: questionnaireSessionId,
        locale: "en",
      },
      timeout: 120_000, // Report generation can take up to 100s
    });

    // LLM-dependent: skip on transient/infra errors instead of hard-failing
    const SKIP_STATUSES = [429, 502, 503, 504];
    if (SKIP_STATUSES.includes(res.status())) {
      test.skip(
        true,
        `Report generation unavailable (${res.status()}) — skipping`,
      );
      return;
    }

    expect(res.ok(), `Report generation failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.reportId).toBeTruthy();
  });

  // ── Cleanup: delete test user data ──

  test.afterAll(async ({ request }) => {
    // Best-effort cleanup via test-only endpoint (non-production only)
    try {
      await request
        .post(`${BASE}/api/test/cleanup`, {
          headers: { "Content-Type": "application/json" },
          data: { email: TEST_EMAIL },
        })
        .catch(() => {});
    } catch {
      // Cleanup is best-effort
    }
  });
});
