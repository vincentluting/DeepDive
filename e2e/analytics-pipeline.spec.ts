// ============================================================
// Analytics Pipeline — End-to-End API Tests
//
// Tests the analytics tracking endpoints:
//   event tracking → duration → report engagement → NPS → reaction
//
// Uses the shared test user created by global-setup.ts.
//
// Covers: funnel events, beacon-style endpoints, feedback CRUD,
// and input validation/sanitization.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  type TestContext,
  ensureSharedContext,
  authedHeaders,
} from "./fixtures/test-setup";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;

let ctx: TestContext;

test.describe.serial("Analytics Pipeline", () => {
  test.beforeAll(async () => {
    ctx = await ensureSharedContext();
  });

  // ── Funnel Event Tracking ──

  test("Event — tracks funnel event", async ({ request }) => {
    const res = await request.post(`${BASE}/api/analytics/event`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      data: {
        event: "deepdive_start",
        metadata: { source: "e2e-test" },
        idempotencyKey: `e2e-event-${Date.now()}`,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("Event — accepts event without metadata", async ({ request }) => {
    const res = await request.post(`${BASE}/api/analytics/event`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      data: { event: "report_view" },
    });
    expect(res.ok()).toBeTruthy();
  });

  // ── Duration Tracking (beacon-style, no auth) ──

  test("Duration — tracks page dwell time", async ({ request }) => {
    const res = await request.post(`${BASE}/api/analytics/duration`, {
      headers: { "Content-Type": "application/json" },
      data: { visitId: `e2e-visit-${Date.now()}`, durationMs: 15000 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test("Duration — caps at 30 minutes", async ({ request }) => {
    const res = await request.post(`${BASE}/api/analytics/duration`, {
      headers: { "Content-Type": "application/json" },
      data: { visitId: `e2e-visit-cap-${Date.now()}`, durationMs: 99999999 },
    });
    expect(res.ok()).toBeTruthy();
  });

  // ── Report Engagement (beacon-style) ──

  test("Report Engagement — tracks scroll/time data", async ({ request }) => {
    if (!ctx.reportId) test.skip(true, "No report — skipping engagement");

    const res = await request.post(`${BASE}/api/analytics/report-engagement`, {
      headers: { "Content-Type": "application/json" },
      data: {
        id: `e2e-engagement-${Date.now()}`,
        reportId: ctx.reportId,
        panelTimes: { careerMatch: 5000, profile: 3000, pathway: 4000 },
        maxScrollDepth: 0.85,
        totalTimeMs: 45000,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  // ── NPS (write + read) ──

  test("NPS — submit and retrieve score", async ({ request }) => {
    if (!ctx.reportId) test.skip(true, "No report — skipping NPS");

    const postRes = await request.post(`${BASE}/api/report-nps`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      data: {
        reportId: ctx.reportId,
        score: 8,
        feedback: "Very insightful report!",
        locale: "en",
      },
    });
    expect(postRes.ok()).toBeTruthy();
    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);
    expect(postBody.id).toBeTruthy();

    const getRes = await request.get(
      `${BASE}/api/report-nps?reportId=${ctx.reportId}`,
      {
        headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      },
    );
    expect(getRes.ok()).toBeTruthy();
    const getBody = await getRes.json();
    expect(getBody.nps).toBeTruthy();
  });

  test("NPS — validates score range", async ({ request }) => {
    if (!ctx.reportId) test.skip(true, "No report — skipping NPS validation");

    const res = await request.post(`${BASE}/api/report-nps`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      data: { reportId: ctx.reportId, score: 99 },
    });
    expect(res.ok()).toBeFalsy();
  });

  // ── Reaction (write + read) ──

  test("Reaction — submit and retrieve", async ({ request }) => {
    if (!ctx.reportId) test.skip(true, "No report — skipping reaction");

    const postRes = await request.post(`${BASE}/api/report-reaction`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      data: { reportId: ctx.reportId, reaction: "resonates" },
    });
    expect(postRes.ok()).toBeTruthy();
    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);

    const getRes = await request.get(
      `${BASE}/api/report-reaction?reportId=${ctx.reportId}`,
      {
        headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      },
    );
    expect(getRes.ok()).toBeTruthy();
    const getBody = await getRes.json();
    expect(getBody.reaction).toBeTruthy();
  });

  test("Reaction — validates reaction enum", async ({ request }) => {
    if (!ctx.reportId)
      test.skip(true, "No report — skipping reaction validation");

    const res = await request.post(`${BASE}/api/report-reaction`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
      data: { reportId: ctx.reportId, reaction: "invalid_value" },
    });
    expect(res.ok()).toBeFalsy();
  });
});
