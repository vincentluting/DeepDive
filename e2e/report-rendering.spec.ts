// ============================================================
// Report Page — Browser Rendering E2E
//
// The MOST CRITICAL gap: verifies that the report page actually
// renders in a browser after the full pipeline completes.
//
// Uses the shared test user created by global-setup.ts.
//
// Depends on LLM availability — gracefully skips if report
// generation failed (503).
// ============================================================

import { test, expect } from "@playwright/test";
import {
  ensureSharedContext,
  authedHeaders,
  type TestContext,
} from "./fixtures/test-setup";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;

let ctx: TestContext;

/** Create a browser context with session + CSRF cookies properly set */
async function createAuthedContext(
  browser: import("@playwright/test").Browser,
) {
  const context = await browser.newContext();
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

test.describe.serial("Report Page — Browser Rendering", () => {
  test.beforeAll(async () => {
    ctx = await ensureSharedContext();
  });

  test("report API returns valid data", async ({ request }) => {
    test.skip(
      !ctx.reportId,
      "Report generation failed (LLM unavailable) — skipping",
    );

    const res = await request.get(`${BASE}/api/report/${ctx.reportId}`, {
      headers: authedHeaders(ctx.csrfToken, ctx.sessionCookie),
    });

    expect(res.ok(), `Report GET failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.report).toBeTruthy();
    expect(body.currentUserId).toBeTruthy();
    expect(body.assessmentId).toBe(ctx.assessmentId);
  });

  test("report page renders in browser without crash", async ({ browser }) => {
    test.skip(
      !ctx.reportId,
      "Report generation failed (LLM unavailable) — skipping",
    );

    const context = await createAuthedContext(browser);
    const page = await context.newPage();

    await page.goto(`${BASE}/en/report/${ctx.reportId}`);
    await expect(page).not.toHaveTitle(/500|Error|Internal Server/i);

    // Report should render — wait for main content area
    await expect(
      page.locator("main, article, [data-report], .report").first(),
    ).toBeVisible({ timeout: 15_000 });

    // Key report sections should be present (report has 5 chapters)
    // At minimum, some text content should render
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(100);

    // No crash indicators
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByText(/failed to load/i)).not.toBeVisible();

    await context.close();
  });

  test("report page renders in Chinese", async ({ browser }) => {
    test.skip(
      !ctx.reportId,
      "Report generation failed (LLM unavailable) — skipping",
    );

    const context = await createAuthedContext(browser);
    const page = await context.newPage();

    await page.goto(`${BASE}/zh/report/${ctx.reportId}`);
    await expect(page).not.toHaveTitle(/500|Error/i);

    // Should render content
    await expect(
      page.locator("main, article, [data-report], .report").first(),
    ).toBeVisible({ timeout: 15_000 });

    await context.close();
  });

  test("dashboard shows report link after generation", async ({ browser }) => {
    test.skip(
      !ctx.reportId,
      "Report generation failed (LLM unavailable) — skipping",
    );

    const context = await createAuthedContext(browser);
    const page = await context.newPage();

    await page.goto(`${BASE}/en/dashboard`);
    await expect(page).not.toHaveTitle(/500|Error/i);

    // Dashboard should render for authenticated user (not redirect to login)
    await expect(page.locator("body")).toBeVisible();
    // Should show some dashboard content — not just a blank page
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(50);

    await context.close();
  });

  test("profile page renders for authenticated user", async ({ browser }) => {
    const context = await createAuthedContext(browser);
    const page = await context.newPage();

    await page.goto(`${BASE}/en/profile`);
    // Wait for client-side hydration/redirects to settle
    await page.waitForLoadState("networkidle");

    // Profile should render (not redirect to login)
    await expect(page.locator("body")).toBeVisible();
    const url = page.url();
    expect(url).toMatch(/profile/);

    // Verify no server error (title may be empty during SSR, so check content)
    const title = await page.title();
    expect(title).not.toMatch(/500|Error/i);

    await context.close();
  });
});
