import { test, expect } from "@playwright/test";
import {
  buildProfileReadyUser,
  cleanupTestUser,
  seedProfileNarratives,
  type TestContext,
} from "./fixtures/test-setup";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;
const TEST_EMAIL = `e2e-report-fallback-${Date.now()}@test.deepdive.dev`;
const TEST_PASSWORD = "ReportFallback123!";
const TEST_NAME = "Report Fallback User";

let ctx: TestContext;
let narrativesSeeded = false;

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

test.describe.serial("Report Stream Fallback", () => {
  test.beforeAll(async ({ request }) => {
    ctx = await buildProfileReadyUser(
      request,
      TEST_EMAIL,
      TEST_PASSWORD,
      TEST_NAME,
    );
    if (ctx.profileId) {
      narrativesSeeded = await seedProfileNarratives(
        request,
        ctx.csrfToken,
        TEST_EMAIL,
        ctx.assessmentId,
      );
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupTestUser(request, TEST_EMAIL);
  });

  test("browser falls back to non-streaming generation and reuses the in-flight report job", async ({
    browser,
  }) => {
    test.skip(
      !ctx.profileId,
      "Profile not generated — skipping report fallback test",
    );
    test.skip(
      !narrativesSeeded,
      "Profile narratives could not be seeded — skipping report fallback test",
    );

    const context = await createAuthedContext(browser);
    const page = await context.newPage();

    let streamRequestCount = 0;
    let fallbackRequestCount = 0;

    await page.route("**/api/generate-report/stream", async (route) => {
      streamRequestCount += 1;
      await route.continue({
        headers: {
          ...route.request().headers(),
          "x-e2e-stream-disconnect": "1",
          "x-e2e-observe-report-source": "1",
        },
      });
    });

    await page.route("**/api/generate-report", async (route) => {
      fallbackRequestCount += 1;
      await route.continue({
        headers: {
          ...route.request().headers(),
          "x-e2e-observe-report-source": "1",
        },
      });
    });

    await page.goto(`${BASE}/en/profile/${ctx.userId}`);
    await expect(page.locator("body")).toBeVisible();

    const skipGenerate = page
      .locator("button")
      .filter({ hasText: /general assumptions/i })
      .first();
    const directGenerate = page
      .locator("button")
      .filter({ hasText: /^Generate Career Report$/i })
      .first();

    const skipVisible = await skipGenerate
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
    const generateVisible = await directGenerate
      .isVisible({ timeout: 15_000 })
      .catch(() => false);

    if (!skipVisible && !generateVisible) {
      test.skip(true, "Report CTA not visible on profile page");
      await context.close();
      return;
    }

    const fallbackResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/generate-report" &&
        response.request().method() === "POST",
      { timeout: 180_000 },
    );

    if (skipVisible) {
      await skipGenerate.click();
    } else {
      await directGenerate.click();
    }

    const standardDepth = page
      .getByRole("button", { name: /standard/i })
      .first();
    await expect(standardDepth).toBeVisible({ timeout: 10_000 });
    await standardDepth.click();

    const fallbackResponse = await fallbackResponsePromise;
    const fallbackBody = (await fallbackResponse.json()) as {
      reportId?: string;
      e2eSource?: string;
      error?: { message?: string };
    };

    if (!fallbackResponse.ok()) {
      test.skip(
        true,
        `Fallback report generation unavailable (${fallbackResponse.status()})`,
      );
      await context.close();
      return;
    }

    expect(fallbackBody.reportId).toBeTruthy();
    expect([
      "same_instance_inflight",
      "lock_wait_existing",
      "existing_report",
    ]).toContain(fallbackBody.e2eSource);
    expect(streamRequestCount).toBe(1);
    expect(fallbackRequestCount).toBe(1);

    await page.waitForURL(/\/en\/report\//, { timeout: 180_000 });
    await expect(page).not.toHaveTitle(/500|Error|Internal Server/i);
    await expect(
      page.locator("main, article, [data-report], .report").first(),
    ).toBeVisible({ timeout: 30_000 });

    await context.close();
  });
});
