// ============================================================
// Coaching Flow — End-to-End API Test
//
// Tests the coaching pipeline after a completed report:
//   Coaching Init (empty messages) → Coaching Chat → Multi-turn → Summary
//
// Uses the shared test user created by global-setup.ts.
//
// Skip condition: If LLM API keys are not configured (503) or
// rate-limited (429), coaching tests auto-skip gracefully.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  type TestContext,
  ensureSharedContext,
  authedHeaders,
  apiHeaders,
} from "./fixtures/test-setup";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;

/** Status codes that indicate infrastructure limits, not code bugs.
 *  403 included: shared test user may lack cohort entitlement if DB was reset. */
const SKIP_STATUSES = [403, 429, 503];

let ctx: TestContext & { email?: string };

test.describe.serial("Coaching Flow", () => {
  test.beforeAll(async ({ request }) => {
    ctx = await ensureSharedContext();

    // Ensure test user has coaching entitlement via cohort
    if (ctx.email) {
      await request
        .post(`${BASE}/api/test/set-cohort`, {
          data: { email: ctx.email, cohort: "beta_2026" },
        })
        .catch(() => {});
    }
  });

  // ── Coaching Tests ──

  test("Coaching Init — streams opening message via coaching-chat", async ({
    request,
  }) => {
    if (!ctx.reportId)
      test.skip(true, "Report not generated — skipping coaching");

    // Initialization = POST to /api/coaching-chat with empty messages array.
    // The endpoint auto-generates a greeting and streams the coach's opening.
    const res = await request.post(`${BASE}/api/coaching-chat`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      data: {
        messages: [],
        round: 0,
        maxRounds: 10,
        locale: "en",
      },
      timeout: 120_000,
    });

    if (SKIP_STATUSES.includes(res.status())) {
      test.skip(
        true,
        `Coaching init returned ${res.status()} — LLM unavailable or rate-limited`,
      );
    }
    expect(res.ok(), `Coaching init failed: ${res.status()}`).toBeTruthy();
    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);
  });

  test("Coaching Chat — streams first coach response", async ({ request }) => {
    if (!ctx.reportId)
      test.skip(true, "Report not generated — skipping coaching");

    const res = await request.post(`${BASE}/api/coaching-chat`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      data: {
        messages: [
          { role: "user", content: "What career paths would suit me best?" },
        ],
        round: 1,
        maxRounds: 10,
        locale: "en",
      },
      timeout: 120_000,
    });

    if (SKIP_STATUSES.includes(res.status())) {
      test.skip(
        true,
        `Coaching chat returned ${res.status()} — LLM unavailable or rate-limited`,
      );
    }
    expect(res.ok(), `Coaching chat failed: ${res.status()}`).toBeTruthy();
    const text = await res.text();
    expect(text.length).toBeGreaterThan(10);
  });

  test("Coaching Chat — multi-turn conversation", async ({ request }) => {
    if (!ctx.reportId)
      test.skip(true, "Report not generated — skipping coaching");

    const res = await request.post(`${BASE}/api/coaching-chat`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      data: {
        messages: [
          { role: "user", content: "What career paths would suit me best?" },
          {
            role: "assistant",
            content:
              "Based on your Artistic-Investigative profile, creative analytical roles would be a great fit.",
          },
          { role: "user", content: "Can you tell me more about UX design?" },
        ],
        round: 2,
        maxRounds: 10,
        locale: "en",
      },
      timeout: 120_000,
    });

    if (SKIP_STATUSES.includes(res.status())) {
      test.skip(
        true,
        `Multi-turn chat returned ${res.status()} — LLM unavailable or rate-limited`,
      );
    }
    expect(res.ok(), `Multi-turn chat failed: ${res.status()}`).toBeTruthy();
    const text = await res.text();
    expect(text.length).toBeGreaterThan(10);
  });

  test("Coaching Summary — extracts insights from conversation", async ({
    request,
  }) => {
    if (!ctx.reportId)
      test.skip(true, "Report not generated — skipping coaching");

    const res = await request.post(`${BASE}/api/coaching-summary`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      data: {
        reportId: ctx.reportId,
        messages: [
          { role: "user", content: "What career paths would suit me best?" },
          {
            role: "assistant",
            content:
              "Based on your Artistic-Investigative profile, creative analytical roles would be a great fit.",
          },
          { role: "user", content: "I am interested in UX design." },
          {
            role: "assistant",
            content:
              "UX Design aligns well with your creative and investigative strengths.",
          },
        ],
        locale: "en",
      },
      timeout: 120_000,
    });

    if (SKIP_STATUSES.includes(res.status())) {
      test.skip(
        true,
        `Coaching summary returned ${res.status()} — LLM unavailable or rate-limited`,
      );
    }
    expect(res.ok(), `Coaching summary failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.sessionId).toBeTruthy();
  });

  // ── Access control (no LLM dependency) ──

  test("Coaching Chat — rejects unauthenticated request", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/api/coaching-chat`, {
      headers: apiHeaders(ctx.csrfToken),
      data: {
        messages: [{ role: "user", content: "Hello" }],
        round: 1,
        locale: "en",
      },
    });
    expect(res.status()).toBe(401);
  });
});
