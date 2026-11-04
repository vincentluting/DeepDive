// ============================================================
// Session Lifecycle — End-to-End API Tests
//
// Tests the questionnaire session pipeline:
//   create → save → status → ensure → resume → save-beacon
//
// Covers: ownership enforcement, idempotency, beacon fallback,
// and cross-user access control.
// ============================================================

import { test, expect, type APIRequestContext } from "@playwright/test";
import { buildDeepDiveAnswers } from "./fixtures/test-answers";
import {
  obtainCsrf,
  registerUser,
  authedHeaders,
  cleanupTestUser,
} from "./fixtures/test-setup";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;

const USER_A_EMAIL = `e2e-session-a-${Date.now()}@test.deepdive.dev`;
const USER_B_EMAIL = `e2e-session-b-${Date.now()}@test.deepdive.dev`;
const PASSWORD = "TestPassword123!";

let csrfToken: string;
let userACookie: string;
let userBCookie: string;

function authA(): Record<string, string> {
  return authedHeaders(csrfToken, userACookie);
}
function authB(): Record<string, string> {
  return authedHeaders(csrfToken, userBCookie);
}

test.describe.serial("Session Lifecycle", () => {
  test.beforeAll(async ({ request }: { request: APIRequestContext }) => {
    csrfToken = await obtainCsrf(request);
    userACookie = await registerUser(
      request,
      csrfToken,
      USER_A_EMAIL,
      PASSWORD,
      "User A",
    );
    userBCookie = await registerUser(
      request,
      csrfToken,
      USER_B_EMAIL,
      PASSWORD,
      "User B",
    );
  });

  // ── Create & Status ──

  test("Create — creates a new session", async ({ request }) => {
    const sessionId = crypto.randomUUID();
    const res = await request.post(`${BASE}/api/session/create`, {
      headers: authA(),
      data: { sessionId, tier: "deep", language: "en" },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).success).toBe(true);

    const statusRes = await request.get(
      `${BASE}/api/session/status?id=${sessionId}`,
      {
        headers: authA(),
      },
    );
    expect(statusRes.ok()).toBeTruthy();
    expect((await statusRes.json()).status).toBe("in_progress");
  });

  test("Status — returns not_found for nonexistent session", async ({
    request,
  }) => {
    const res = await request.get(
      `${BASE}/api/session/status?id=nonexistent-id`,
      {
        headers: authA(),
      },
    );
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).status).toBe("not_found");
  });

  // ── Ensure (idempotent create) ──

  test("Ensure — idempotent session creation", async ({ request }) => {
    const sessionId = crypto.randomUUID();

    const res1 = await request.post(`${BASE}/api/session/ensure`, {
      headers: authA(),
      data: { sessionId, tier: "deep", language: "en" },
    });
    expect(res1.ok()).toBeTruthy();

    // Second call with same ID succeeds (idempotent)
    const res2 = await request.post(`${BASE}/api/session/ensure`, {
      headers: authA(),
      data: { sessionId, tier: "deep", language: "en" },
    });
    expect(res2.ok()).toBeTruthy();

    const statusRes = await request.get(
      `${BASE}/api/session/status?id=${sessionId}`,
      {
        headers: authA(),
      },
    );
    expect((await statusRes.json()).status).toBe("in_progress");
  });

  // ── Save & Resume ──

  test("Save — persists answers and progress", async ({ request }) => {
    const sessionId = crypto.randomUUID();
    await request.post(`${BASE}/api/session/create`, {
      headers: authA(),
      data: { sessionId, tier: "deep", language: "en" },
    });

    const answers = buildDeepDiveAnswers().slice(0, 6);
    const res = await request.post(`${BASE}/api/session/save`, {
      headers: authA(),
      data: {
        sessionId,
        answers,
        currentModule: "A",
        currentQuestionIndex: 5,
        language: "en",
      },
    });
    expect(res.ok()).toBeTruthy();

    const resumeRes = await request.get(`${BASE}/api/session/resume`, {
      headers: authA(),
    });
    expect(resumeRes.ok()).toBeTruthy();
    const body = await resumeRes.json();
    expect(body.session).toBeTruthy();
    expect(body.session.id).toBe(sessionId);
    expect(body.session.answerCount).toBe(6);
  });

  // ── Cross-user ownership enforcement ──

  test("Save — rejects save to another user's session", async ({ request }) => {
    const sessionId = crypto.randomUUID();

    await request.post(`${BASE}/api/session/create`, {
      headers: authA(),
      data: { sessionId, tier: "deep", language: "en" },
    });

    // User B tries to save to User A's session
    const res = await request.post(`${BASE}/api/session/save`, {
      headers: authB(),
      data: {
        sessionId,
        answers: buildDeepDiveAnswers().slice(0, 3),
        currentModule: "A",
        currentQuestionIndex: 2,
        language: "en",
      },
    });
    expect(res.status()).toBe(403);
  });

  test("Status — hides other user's session", async ({ request }) => {
    const sessionId = crypto.randomUUID();

    await request.post(`${BASE}/api/session/create`, {
      headers: authA(),
      data: { sessionId, tier: "deep", language: "en" },
    });

    // User B should not see User A's session
    const res = await request.get(
      `${BASE}/api/session/status?id=${sessionId}`,
      {
        headers: authB(),
      },
    );
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).status).toBe("not_found");
  });

  // ── Save-Beacon (no auth, best-effort) ──

  test("Save-Beacon — accepts beacon payload", async ({ request }) => {
    const sessionId = crypto.randomUUID();

    await request.post(`${BASE}/api/session/create`, {
      headers: authA(),
      data: { sessionId, tier: "deep", language: "en" },
    });
    await request.post(`${BASE}/api/session/save`, {
      headers: authA(),
      data: {
        sessionId,
        answers: buildDeepDiveAnswers().slice(0, 3),
        currentModule: "A",
        currentQuestionIndex: 2,
        language: "en",
      },
    });

    // Beacon save (no auth headers, simulates sendBeacon)
    const res = await request.post(`${BASE}/api/session/save-beacon`, {
      headers: { "Content-Type": "application/json" },
      data: {
        sessionId,
        answers: buildDeepDiveAnswers().slice(0, 6),
        currentModule: "A",
        currentQuestionIndex: 5,
        language: "en",
      },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).ok).toBe(true);
  });

  // ── Resume — no session for new user ──

  test("Resume — returns null for user with no sessions", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/session/resume`, {
      headers: authB(),
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).session).toBeNull();
  });

  // ── Cleanup ──

  test.afterAll(async ({ request }) => {
    await cleanupTestUser(request, USER_A_EMAIL);
    await cleanupTestUser(request, USER_B_EMAIL);
  });
});
