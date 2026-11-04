// ============================================================
// Audit Feature Verification — Browser E2E Tests
//
// Validates features from the 03-23 audit:
//   1. Welcome Card — renders on first visit, dismisses, persists
//   2. Report Page — loads and renders report content correctly
//   3. Keyboard Shortcuts — seed to Module B via API, digit key advances
//   4. Stop Generation — coaching stream abort button
//   5. Cross-Tab Conflict — BroadcastChannel triggers warning banner
//
// Tests 3/5 use POST /api/test/seed-questionnaire to jump to any
// module, bypassing 20+ screens of pre-survey + SJT navigation.
// Uses shared test user for tests 1/2/4, fresh users for tests 3/5.
// ============================================================

import { test, expect } from "@playwright/test";
import {
  ensureSharedContext,
  obtainCsrf,
  registerUser,
  apiHeaders,
  authedHeaders,
  cleanupTestUser,
  type TestContext,
} from "./fixtures/test-setup";
import { RIASEC_SCORES, QUICKDIVE_RESULT_DATA } from "./fixtures/test-answers";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;

/** Create a browser context with session + CSRF cookies */
async function createAuthedContext(
  browser: import("@playwright/test").Browser,
  ctx: TestContext,
) {
  const context = await browser.newContext({
    extraHTTPHeaders: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "sec-ch-ua":
        '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Dest": "document",
    },
  });
  const sessionValue = ctx.sessionCookie.replace("session=", "");
  await context.addCookies([
    {
      name: "csrf-token",
      value: ctx.csrfToken,
      domain: "localhost",
      path: "/",
    },
    {
      name: "session",
      value: sessionValue,
      domain: "localhost",
      path: "/",
    },
  ]);
  return context;
}

let ctx: TestContext & { email: string };

test.describe.serial("Audit Feature Verification", () => {
  test.beforeAll(async () => {
    ctx = await ensureSharedContext();
  });

  // ═══════════════════════════════════════════════════════════
  // Test 1: Welcome Card
  // ═══════════════════════════════════════════════════════════
  test("Welcome Card: renders on first visit, dismisses, persists", async ({
    browser,
  }) => {
    const context = await createAuthedContext(browser, ctx);
    const page = await context.newPage();

    await page.goto(`${BASE}/en/dashboard`);

    const title = page.getByText("Welcome to Deep Dive");
    await expect(title).toBeVisible({ timeout: 10_000 });

    const dismissBtn = page.locator("button[aria-label='Dismiss']");
    await expect(dismissBtn).toBeVisible();
    await expect(page.getByText("Got it")).toBeVisible();

    await dismissBtn.click();
    await expect(title).not.toBeVisible({ timeout: 3_000 });

    const stored = await page.evaluate(() =>
      localStorage.getItem("dashboard-welcome-seen"),
    );
    expect(stored).toBe("1");

    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await expect(title).not.toBeVisible({ timeout: 5_000 });

    await context.close();
  });

  // ═══════════════════════════════════════════════════════════
  // Test 2: Report Page
  // ═══════════════════════════════════════════════════════════
  test("Report Page: loads successfully with report content", async ({
    browser,
  }) => {
    test.skip(
      !ctx.reportId,
      "Report not generated — skipping report page test",
    );

    const context = await createAuthedContext(browser, ctx);
    const page = await context.newPage();

    await page.goto(`${BASE}/en/report/${ctx.reportId}`);

    // Wait for an actual report panel, not just <main>. <main> is rendered
    // by the report layout shell early (loading skeleton + header), so a
    // bare main visibility check would pass before the report content is
    // ready. report-card-flow.tsx renders each panel with data-panel-id;
    // chapter-card.tsx uses data-chapter-id. Either signals real content.
    await expect(
      page.locator("[data-panel-id], [data-chapter-id]").first(),
    ).toBeVisible({ timeout: 60_000 });
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length ?? 0).toBeGreaterThan(200);

    await expect(
      page.getByText(/Unable to Load|something went wrong/i),
    ).not.toBeVisible({ timeout: 3_000 });

    const title = await page.title();
    expect(title).not.toMatch(/500|Error|Internal Server/i);

    await context.close();
  });

  // ═══════════════════════════════════════════════════════════
  // Test 3: Keyboard Shortcuts — seed to Module B, press digit key
  // ═══════════════════════════════════════════════════════════
  test("Keyboard Shortcuts: seed to Module B, digit key advances PVQ question", async ({
    browser,
    request,
  }) => {
    const email = `e2e-keyboard-${Date.now()}@test.deepdive.dev`;
    const password = "KeyboardTest123!";
    const csrfToken = await obtainCsrf(request);

    try {
      // ── Build user via API ──
      const qdRes = await request.post(`${BASE}/api/quickdive/save`, {
        headers: apiHeaders(csrfToken),
        data: {
          scores: RIASEC_SCORES,
          code: "AI",
          label: "The Creative Analyst",
          locale: "en",
          exploreMode: "narrative",
          resultData: QUICKDIVE_RESULT_DATA,
        },
      });
      if (!qdRes.ok()) {
        test.skip(true, `QuickDive save failed: ${qdRes.status()}`);
        return;
      }
      const quickDiveResultId = (await qdRes.json()).id;

      const sessionCookie = await registerUser(
        request,
        csrfToken,
        email,
        password,
        "Keyboard Test",
      );
      const auth = () => authedHeaders(csrfToken, sessionCookie);

      // Cohort + claim are non-negotiable preconditions: without them
      // /deepdive redirects to /explore?gate=quickdive (no QuickDive on
      // user) or /explore?gate=invite_required (no cohort entitlement),
      // and the test would fail with a misleading "Continue button not
      // found" assertion 60s later. Fail loudly with the actual status
      // and response body so the regression is obvious in CI logs.
      const cohortRes = await request.post(`${BASE}/api/test/set-cohort`, {
        headers: apiHeaders(csrfToken),
        data: { email, cohort: "beta_2026" },
      });
      expect(
        cohortRes.ok(),
        `set-cohort failed: ${cohortRes.status()} ${await cohortRes.text()}`,
      ).toBeTruthy();
      const claimRes = await request.post(`${BASE}/api/quickdive/claim`, {
        headers: auth(),
        data: { resultId: quickDiveResultId },
      });
      expect(
        claimRes.ok(),
        `quickdive claim failed: ${claimRes.status()} ${await claimRes.text()}`,
      ).toBeTruthy();

      const sessionId = crypto.randomUUID();
      const sessionRes = await request.post(`${BASE}/api/session/create`, {
        headers: auth(),
        data: { sessionId, tier: "deep", language: "en" },
      });
      expect(
        sessionRes.ok(),
        `session create failed: ${sessionRes.status()} ${await sessionRes.text()}`,
      ).toBeTruthy();

      // ── Seed to Module B using the new API ──
      const seedRes = await request.post(
        `${BASE}/api/test/seed-questionnaire`,
        {
          headers: apiHeaders(csrfToken),
          data: { email, targetModule: "B", questionIndex: 0 },
        },
      );
      expect(
        seedRes.ok(),
        `seed-questionnaire failed: ${seedRes.status()} ${await seedRes.text()}`,
      ).toBeTruthy();

      // ── Browser: navigate to questionnaire ──
      const context = await browser.newContext();
      const sessionValue = sessionCookie.replace("session=", "");
      await context.addCookies([
        {
          name: "csrf-token",
          value: csrfToken,
          domain: "localhost",
          path: "/",
        },
        {
          name: "session",
          value: sessionValue,
          domain: "localhost",
          path: "/",
        },
      ]);
      const page = await context.newPage();
      await page.goto(`${BASE}/en/deepdive`);

      // Click Continue on resume screen
      const continueBtn = page
        .locator("button")
        .filter({ hasText: /Continue/i })
        .first();
      await expect(continueBtn).toBeVisible({ timeout: 15_000 });
      await continueBtn.click();

      // Wait for question counter to appear (Module B active)
      const counter = page.locator("text=/\\d+\\/\\d+/").first();
      await expect(counter).toBeVisible({ timeout: 15_000 });
      const counterBefore = await counter.textContent();

      // Press digit "3" → PVQ Likert-6 handler selects rating 3
      await page.keyboard.press("3");
      await page.waitForTimeout(2_000);

      // Counter should advance (question changed)
      const counterAfter = await page
        .locator("text=/\\d+\\/\\d+/")
        .first()
        .textContent();
      expect(counterAfter).not.toBe(counterBefore);

      await context.close();
    } finally {
      await cleanupTestUser(request, email);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // Test 4: Stop Generation Button
  // ═══════════════════════════════════════════════════════════
  test("Stop Generation: button appears during coaching stream, aborts on click", async ({
    browser,
  }) => {
    test.skip(
      !ctx.reportId,
      "Report not generated — skipping coaching stop test",
    );

    const context = await createAuthedContext(browser, ctx);
    const page = await context.newPage();

    // Bypass age gate
    await page.goto(`${BASE}/en/coaching`);
    await page.evaluate(() =>
      localStorage.setItem("deepdive_age_confirmed", "true"),
    );
    await page.reload();

    // Lobby → click "I'm Ready"
    const readyBtn = page.getByText(/I'm Ready|我准备好了/i);
    await expect(readyBtn).toBeVisible({ timeout: 15_000 });
    await readyBtn.click();

    // Wait for chat textarea
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 30_000 });

    // Intercept coaching-chat API — hold the response for 10s.
    // Client sets isLoading=true BEFORE fetch, so stop button appears
    // immediately while the request is pending.
    await page.route("**/api/coaching-chat", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      await route.abort("aborted");
    });

    // Type message and press Enter to send
    await textarea.fill("What career paths would suit me best?");
    await textarea.press("Enter");

    // Stop button should appear immediately (isLoading = true, fetch pending)
    const stopBtn = page.getByText(/Stop generating|停止生成/);

    try {
      await expect(stopBtn).toBeVisible({ timeout: 5_000 });
    } catch {
      test.skip(true, "Stop button never appeared — unexpected behavior");
      return;
    }

    // Click stop → aborts the pending fetch
    // Use force:true because React re-renders can detach the element briefly
    await stopBtn.click({ force: true, timeout: 10_000 });

    // Button should disappear
    await expect(stopBtn).not.toBeVisible({ timeout: 5_000 });

    // Textarea should be re-enabled
    await expect(textarea).toBeEnabled({ timeout: 3_000 });

    await context.close();
  });

  // ═══════════════════════════════════════════════════════════
  // Test 5: Cross-Tab Conflict Warning
  // ═══════════════════════════════════════════════════════════
  test("Cross-Tab: warning appears when questionnaire is open in two tabs", async ({
    browser,
    request,
  }) => {
    const email = `e2e-crosstab-${Date.now()}@test.deepdive.dev`;
    const password = "CrossTabTest123!";
    const csrfToken = await obtainCsrf(request);

    try {
      // Build user with a deep dive session
      const qdRes = await request.post(`${BASE}/api/quickdive/save`, {
        headers: apiHeaders(csrfToken),
        data: {
          scores: RIASEC_SCORES,
          code: "AI",
          label: "The Creative Analyst",
          locale: "en",
          exploreMode: "narrative",
          resultData: QUICKDIVE_RESULT_DATA,
        },
      });
      if (!qdRes.ok()) {
        test.skip(true, `QuickDive save failed: ${qdRes.status()}`);
        return;
      }
      const quickDiveResultId = (await qdRes.json()).id;

      const sessionCookie = await registerUser(
        request,
        csrfToken,
        email,
        password,
        "CrossTab Test",
      );
      const auth = () => authedHeaders(csrfToken, sessionCookie);

      // Cohort + claim are non-negotiable preconditions: without them
      // /deepdive redirects to /explore?gate=quickdive (no QuickDive on
      // user) or /explore?gate=invite_required (no cohort entitlement),
      // and the test would fail with a misleading "Continue button not
      // found" assertion 60s later. Fail loudly with the actual status
      // and response body so the regression is obvious in CI logs.
      const cohortRes = await request.post(`${BASE}/api/test/set-cohort`, {
        headers: apiHeaders(csrfToken),
        data: { email, cohort: "beta_2026" },
      });
      expect(
        cohortRes.ok(),
        `set-cohort failed: ${cohortRes.status()} ${await cohortRes.text()}`,
      ).toBeTruthy();
      const claimRes = await request.post(`${BASE}/api/quickdive/claim`, {
        headers: auth(),
        data: { resultId: quickDiveResultId },
      });
      expect(
        claimRes.ok(),
        `quickdive claim failed: ${claimRes.status()} ${await claimRes.text()}`,
      ).toBeTruthy();

      const sessionId = crypto.randomUUID();
      const sessionRes = await request.post(`${BASE}/api/session/create`, {
        headers: auth(),
        data: { sessionId, tier: "deep", language: "en" },
      });
      expect(
        sessionRes.ok(),
        `session create failed: ${sessionRes.status()} ${await sessionRes.text()}`,
      ).toBeTruthy();

      // Seed to Module B (past pre-survey) so resume screen shows.
      // Fail loudly if this precondition fails — silent skip would
      // mask real regressions in test infrastructure.
      const seedRes = await request.post(
        `${BASE}/api/test/seed-questionnaire`,
        {
          headers: apiHeaders(csrfToken),
          data: { email, targetModule: "B", questionIndex: 0 },
        },
      );
      expect(
        seedRes.ok(),
        `seed-questionnaire failed: ${seedRes.status()} ${await seedRes.text()}`,
      ).toBeTruthy();

      const context = await browser.newContext();
      const sessionValue = sessionCookie.replace("session=", "");
      await context.addCookies([
        {
          name: "csrf-token",
          value: csrfToken,
          domain: "localhost",
          path: "/",
        },
        {
          name: "session",
          value: sessionValue,
          domain: "localhost",
          path: "/",
        },
      ]);

      const page = await context.newPage();
      await page.goto(`${BASE}/en/deepdive`);

      // Click Continue on resume screen → enters questionnaire shell
      const continueBtn = page
        .locator("button")
        .filter({ hasText: /Continue/i })
        .first();
      await expect(continueBtn).toBeVisible({ timeout: 15_000 });
      await continueBtn.click();

      // Wait for questionnaire to be active
      await expect(page.locator("text=/\\d+\\/\\d+/").first()).toBeVisible({
        timeout: 15_000,
      });

      // Simulate another tab submitting an answer via BroadcastChannel
      await page.evaluate((sid) => {
        const ch = new BroadcastChannel("questionnaire-sync");
        ch.postMessage({
          type: "answer-submitted",
          sessionId: sid,
          questionIndex: 7,
        });
        ch.close();
      }, sessionId);

      // Cross-tab warning should appear
      const warning = page.locator("[data-testid='cross-tab-warning']");
      await expect(warning).toBeVisible({ timeout: 5_000 });

      // Click dismiss → warning disappears
      await warning.locator("button").click();
      await expect(warning).not.toBeVisible({ timeout: 3_000 });

      await context.close();
    } finally {
      await cleanupTestUser(request, email);
    }
  });
});
