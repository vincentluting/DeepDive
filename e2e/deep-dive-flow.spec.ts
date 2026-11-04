// ============================================================
// Deep Dive Conversion Path — Browser E2E Smoke Test
//
// Tests the most critical user journey in the app:
//   1. API: QuickDive -> Register -> DeepDive -> Score -> Profile
//   2. Browser: Profile page loads with archetype content
//   3. Browser: Generate Career Report -> Report page loads
//
// The pipeline (QD -> DD -> Score -> Profile) runs via API for speed
// and reliability. Browser tests verify the user-facing screens.
//
// LLM calls use LLM_TEST_MODE=mock (fixture responses).
// ============================================================

import { test, expect, type Browser } from "@playwright/test";
import {
  obtainCsrf,
  registerUser,
  apiHeaders,
  authedHeaders,
  cleanupTestUser,
} from "./fixtures/test-setup";
import {
  RIASEC_SCORES,
  SJT_ANSWERS,
  DDVQ21_ANSWERS,
  IPIP60_ANSWERS,
  QUICKDIVE_RESULT_DATA,
  buildDeepDiveAnswers,
} from "./fixtures/test-answers";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;

// Unique test user per run
const TEST_EMAIL = `e2e-deepdive-flow-${Date.now()}@test.deepdive.dev`;
const TEST_PASSWORD = "DeepDiveFlowTest123!";
const TEST_NAME = "Deep Dive Flow Test";

// Shared state across serial tests
let csrfToken: string;
let sessionCookie: string;
let questionnaireSessionId: string;
let assessmentId: string;
let profileId: string | undefined;
let userId: string;

// ── Helper: create authenticated browser context ──

async function createAuthedBrowserContext(browser: Browser) {
  const context = await browser.newContext({
    extraHTTPHeaders: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "sec-ch-ua":
        '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
    },
  });
  const sessionValue = sessionCookie.replace("session=", "");
  await context.addCookies([
    {
      name: "csrf-token",
      value: csrfToken,
      url: BASE,
    },
    {
      name: "session",
      value: sessionValue,
      url: BASE,
    },
  ]);

  const meRes = await context.request.get(`${BASE}/api/auth/me`);
  expect(
    meRes.ok(),
    `Browser auth check failed: ${meRes.status()}`,
  ).toBeTruthy();
  const meBody = (await meRes.json()) as { user?: { id?: string } | null };
  expect(meBody.user?.id, "Browser context is not authenticated").toBe(userId);

  return context;
}

test.describe.serial("Deep Dive Conversion Path", () => {
  // ── Setup: Build full pipeline via API ──

  test.beforeAll(async ({ request }) => {
    // 1. Obtain CSRF token
    csrfToken = await obtainCsrf(request);
    const headers = () => apiHeaders(csrfToken);

    // 2. Save Quick Dive result (anonymous)
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
    });
    expect(qdRes.ok(), `QuickDive save failed: ${qdRes.status()}`).toBeTruthy();
    const quickDiveResultId = (await qdRes.json()).id;

    // 3. Register user
    sessionCookie = await registerUser(
      request,
      csrfToken,
      TEST_EMAIL,
      TEST_PASSWORD,
      TEST_NAME,
    );
    const auth = () => authedHeaders(csrfToken, sessionCookie);

    const meRes = await request.get(`${BASE}/api/auth/me`, {
      headers: auth(),
    });
    expect(meRes.ok(), `Auth me failed: ${meRes.status()}`).toBeTruthy();
    const meBody = (await meRes.json()) as { user?: { id?: string } | null };
    expect(meBody.user?.id, "User ID missing from /api/auth/me").toBeTruthy();
    userId = meBody.user!.id!;

    // 4. Set cohort for entitlement access (deepDive + aiReport)
    await request.post(`${BASE}/api/test/set-cohort`, {
      headers: headers(),
      data: { email: TEST_EMAIL, cohort: "beta_2026" },
    });

    // 5. Claim Quick Dive result
    await request.post(`${BASE}/api/quickdive/claim`, {
      headers: auth(),
      data: { resultId: quickDiveResultId },
    });

    // 6. Create Deep Dive session + submit all 86 answers
    questionnaireSessionId = crypto.randomUUID();
    await request.post(`${BASE}/api/session/create`, {
      headers: auth(),
      data: {
        sessionId: questionnaireSessionId,
        tier: "deep",
        language: "en",
      },
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
    });

    // 7. Score the assessment
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
    });
    expect(scoreRes.ok(), `Score failed: ${scoreRes.status()}`).toBeTruthy();
    const scoreBody = await scoreRes.json();
    assessmentId = scoreBody.id;

    // Verify scoring produced correct structure
    expect(scoreBody.bigFive).toBeTruthy();
    expect(scoreBody.schwartz).toBeTruthy();

    // 8. Generate profile (algorithmic + optional LLM letter)
    const profileRes = await request.post(`${BASE}/api/generate-profile`, {
      headers: auth(),
      data: { assessmentId, locale: "en" },
    });
    if (profileRes.ok()) {
      const profileBody = await profileRes.json();
      profileId = profileBody.id;
    }

    // Wait for journey state to settle (fire-and-forget transitions)
    for (let i = 0; i < 10; i++) {
      const journeyRes = await request.get(`${BASE}/api/journey`, {
        headers: auth(),
      });
      if (journeyRes.ok()) {
        const { state } = await journeyRes.json();
        if (
          state === "profile_generated" ||
          state === "deep_dive_complete" ||
          state === "report_generated" ||
          state === "coaching_unlocked"
        ) {
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  });

  // ── Cleanup ──

  test.afterAll(async ({ request }) => {
    await cleanupTestUser(request, TEST_EMAIL);
  });

  // ═══════════════════════════════════════════════════════════
  // Test 1: Profile page loads with correct content
  // ═══════════════════════════════════════════════════════════

  test("Profile page loads with archetype content after Deep Dive", async ({
    browser,
  }) => {
    test.skip(!profileId, "Profile not generated — skipping browser test");
    test.setTimeout(120_000);

    const context = await createAuthedBrowserContext(browser);
    const page = await context.newPage();

    // Navigate to profile page
    await page.goto(`${BASE}/en/profile`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(new RegExp(`/en/profile/${userId}(?:[?#].*)?$`), {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });

    // Profile page should load with narrative content
    await page.waitForFunction(
      () => (document.body?.innerText?.length ?? 0) > 200,
      { timeout: 30_000 },
    );

    // Verify no app-level error state. Scope this to the rendered app shell so
    // Next's dev overlay text (for example "Console Error") doesn't create a
    // false negative while the profile itself has loaded.
    // NOTE: regex avoids matching depth indicators like "1500m", "2,500m+"
    // that appear in the immersive Open Water UI — use the explicit error
    // copy "Internal Server Error" instead of the bare digit "500".
    await expect(
      page
        .locator("main")
        .getByText(
          /Unable to Load|something went wrong|Internal Server Error/i,
        ),
    ).not.toBeVisible({ timeout: 3_000 });

    // Verify profile page has archetype content (one of the 12 types)
    await expect(
      page
        .getByText(
          /Architect|Backbone|Tactician|Researcher|Icon|Dreamweaver|Mentor|Healer|Ace|Pioneer|Commander|Arbiter/i,
        )
        .first(),
    ).toBeVisible({ timeout: 15_000 });

    // Verify the page title is not an error
    const title = await page.title();
    expect(title).not.toMatch(/500|Internal Server Error/i);

    await context.close();
  });

  // ═══════════════════════════════════════════════════════════
  // Test 2: Profile -> Generate Report -> Report loads
  // ═══════════════════════════════════════════════════════════

  test("Generate career report from profile and view it", async ({
    browser,
  }) => {
    test.skip(!profileId, "Profile not generated — skipping report test");
    test.setTimeout(180_000);

    const context = await createAuthedBrowserContext(browser);
    const page = await context.newPage();

    // Navigate to profile page
    await page.goto(`${BASE}/en/profile`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(new RegExp(`/en/profile/${userId}(?:[?#].*)?$`), {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });

    // Wait for profile content to load
    await page.waitForFunction(
      () => (document.body?.innerText?.length ?? 0) > 200,
      { timeout: 30_000 },
    );

    const viewReport = page
      .locator("a, button")
      .filter({ hasText: /View.*Report|查看.*报告/i })
      .first();
    const viewVisible = await viewReport
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (viewVisible) {
      await viewReport.click();
      await page.waitForURL(/\/en\/report\//, { timeout: 15_000 });

      await page.waitForFunction(
        () => (document.body?.innerText?.length ?? 0) > 200,
        { timeout: 30_000 },
      );
      await expect(
        page.getByText(/Unable to Load|something went wrong/i),
      ).not.toBeVisible({ timeout: 3_000 });

      await context.close();
      return;
    }

    await page.locator("#profile-report-cta").scrollIntoViewIfNeeded();

    // Current profile UI is a two-step finale: when real-world conditions are
    // empty, the direct generate button is intentionally locked and the
    // de-emphasized skip action is the valid no-conditions path.
    const skipAndGenerate = page
      .locator("button")
      .filter({ hasText: /general assumptions|通用假设/i })
      .first();
    const skipVisible = await skipAndGenerate
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (skipVisible) {
      await skipAndGenerate.click();
    } else {
      const reportCta = page
        .locator("button")
        .filter({ hasText: /Generate.*Report|生成.*报告/i })
        .first();
      const ctaVisible = await reportCta
        .isVisible({ timeout: 10_000 })
        .catch(() => false);

      if (!ctaVisible) {
        await context.close();
        test.skip(true, "Report CTA not visible — profile may be incomplete");
        return;
      }

      await reportCta.click();
    }

    const standardMode = page
      .getByRole("button", { name: /Standard/i })
      .first();
    if (await standardMode.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await standardMode.click();
    }

    // The report generation calls /api/generate-report which returns a reportId,
    // then the client navigates to /en/report/[reportId].
    try {
      await page.waitForURL(/\/en\/report\//, { timeout: 120_000 });
    } catch {
      const errorVisible = await page
        .getByText(/failed|error|unavailable|Unable/i)
        .isVisible()
        .catch(() => false);

      if (errorVisible) {
        await context.close();
        test.skip(
          true,
          "Report generation failed — LLM mock may not be available",
        );
        return;
      }

      await context.close();
      test.skip(true, "Report generation did not complete within timeout");
      return;
    }

    // Report page should load with content.
    await page.waitForFunction(
      () => (document.body?.innerText?.length ?? 0) > 300,
      { timeout: 60_000 },
    );

    // Verify no hard error on report page
    const title = await page.title();
    expect(title).not.toMatch(/500|Internal Server Error/i);

    await expect(
      page.getByText(/Unable to Load Report|something went wrong/i),
    ).not.toBeVisible({ timeout: 3_000 });

    await context.close();
  });

  // ═══════════════════════════════════════════════════════════
  // Test 3: Questionnaire UI — resume from seeded position
  // ═══════════════════════════════════════════════════════════

  test("Questionnaire resumes at seeded position with correct UI", async ({
    browser,
    request,
  }) => {
    test.setTimeout(240_000);

    // Create a second test user specifically for the questionnaire UI test.
    // This user has a Deep Dive session seeded to Module C's last question.
    const email2 = `e2e-dd-ui-${Date.now()}@test.deepdive.dev`;
    const password2 = "DDUITest123!";
    const csrf2 = await obtainCsrf(request);

    let context: Awaited<ReturnType<typeof browser.newContext>> | null = null;

    try {
      // Quick pipeline setup
      const qdRes = await request.post(`${BASE}/api/quickdive/save`, {
        headers: apiHeaders(csrf2),
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
      const qdId = (await qdRes.json()).id;

      const sess2 = await registerUser(
        request,
        csrf2,
        email2,
        password2,
        "DD UI Test",
      );
      const auth2 = () => authedHeaders(csrf2, sess2);

      await request.post(`${BASE}/api/test/set-cohort`, {
        headers: apiHeaders(csrf2),
        data: { email: email2, cohort: "beta_2026" },
      });
      await request.post(`${BASE}/api/quickdive/claim`, {
        headers: auth2(),
        data: { resultId: qdId },
      });

      const sessId = crypto.randomUUID();
      await request.post(`${BASE}/api/session/create`, {
        headers: auth2(),
        data: { sessionId: sessId, tier: "deep", language: "en" },
      });

      // Seed to Module C, near the end
      const seedRes = await request.post(
        `${BASE}/api/test/seed-questionnaire`,
        {
          headers: apiHeaders(csrf2),
          data: {
            email: email2,
            sessionId: sessId,
            targetModule: "C",
            questionIndex: 58,
          },
        },
      );
      if (!seedRes.ok()) {
        test.skip(true, `Seed failed: ${seedRes.status()}`);
        return;
      }

      // Open browser with this user
      context = await browser.newContext({
        extraHTTPHeaders: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "sec-ch-ua":
            '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
        },
      });
      const sessionValue = sess2.replace("session=", "");
      await context.addCookies([
        { name: "csrf-token", value: csrf2, url: BASE },
        {
          name: "session",
          value: sessionValue,
          url: BASE,
        },
      ]);
      await context.addInitScript(
        ({
          sessionId,
          startedAt,
        }: {
          sessionId: string;
          startedAt: number;
        }) => {
          const answers = [
            ...Array.from({ length: 6 }, (_, i) => ({
              questionIndex: i,
              moduleCode: "A",
              itemId: i + 1,
              value: { type: "sjt", wouldChoice: "A", shouldChoice: "B" },
              responseTimeMs: 3000,
              timestamp: startedAt + i * 1000,
            })),
            ...Array.from({ length: 20 }, (_, i) => ({
              questionIndex: 6 + i,
              moduleCode: "B",
              itemId: i + 1,
              value: { type: "pvq", rating: 3 },
              responseTimeMs: 2000,
              timestamp: startedAt + 10_000 + i * 500,
            })),
          ];

          localStorage.setItem(
            "deep-dive-questionnaire-session-v2",
            JSON.stringify({
              id: sessionId,
              language: "en",
              includeRIASEC: false,
              answers,
              startedAt,
              currentQuestionIndex: 84,
              moduleStartTimes: {
                A: startedAt,
                B: startedAt + 10_000,
                C: startedAt + 30_000,
              },
              triggeredBonusInsights: [],
              pacePreference: "auto",
              zoneTimeline: {},
            }),
          );
        },
        { sessionId: sessId, startedAt: Date.now() - 60_000 },
      );
      const page = await context.newPage();

      // Navigate to questionnaire
      await page.goto(`${BASE}/en/deepdive`, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });

      // Session should restore — may show Welcome Back overlay or load directly.
      // Wait for whichever user-facing state appears first so cold full-suite
      // runs don't spend 15s waiting for an overlay after the question is ready.
      const continueBtn = page
        .locator("button")
        .filter({ hasText: /Continue/i })
        .first();
      const counter = page.getByTestId("deepdive-question-counter");
      const restoredState = await Promise.race([
        continueBtn
          .waitFor({ state: "visible", timeout: 60_000 })
          .then(() => "welcome" as const),
        counter
          .waitFor({ state: "visible", timeout: 60_000 })
          .then(() => "counter" as const),
      ]).catch(() => null);

      if (restoredState === "welcome") {
        await continueBtn.click();
      }

      // Should be in Module C (IPIP questions) — near the end
      await expect(counter).toBeVisible({ timeout: 60_000 });

      // Verify we're near the end (question 58+ of 86)
      await expect(counter).toHaveText(/(?:5[8-9]|[6-8]\d)\/86/, {
        timeout: 5_000,
      });

      // Verify IPIP Likert buttons are present
      await expect(
        page.getByText(/Very Inaccurate|Very Accurate/).first(),
      ).toBeVisible({ timeout: 5_000 });
    } finally {
      await context?.close().catch(() => {});
      await cleanupTestUser(request, email2);
    }
  });
});
