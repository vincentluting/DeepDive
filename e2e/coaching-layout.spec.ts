import { test, expect, type Page } from "@playwright/test";

import { ensureSharedContext } from "./fixtures/test-setup";

const DESKTOP_SCREENSHOT = "/tmp/coaching-layout-desktop.png";
const MOBILE_COLLAPSED_SCREENSHOT = "/tmp/coaching-layout-mobile-collapsed.png";
const MOBILE_SHEET_SCREENSHOT = "/tmp/coaching-layout-mobile-sheet.png";
const MOCK_REPORT_ID = "e2e-coaching-report";
const INITIAL_COACH_MESSAGE =
  "I’ve read your results. The clearest pattern is that you light up when creative judgment and analytical depth work together. Let’s start from there.";
const FOLLOW_UP_MESSAGE = `That’s a strong place to start. We can test it in the real world without overcommitting.

<<QUICK_REPLIES>>["Help me compare two directions","What should I test first?","What might I be missing?"]<</QUICK_REPLIES>>`;

let sessionCookie = "";
let csrfToken = "";

async function seedAuthenticatedBrowser(page: Page) {
  // NOTE: omit `expires` so Playwright treats these as session cookies.
  // Passing `expires: -1` is interpreted as a past Unix timestamp and the
  // browser drops the cookie immediately, causing the server-side
  // getCurrentUser() check on /coaching to redirect to /register.
  await page.context().addCookies([
    {
      name: "csrf-token",
      value: csrfToken,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "session",
      value: sessionCookie.replace("session=", ""),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  await page.addInitScript(() => {
    localStorage.setItem("deepdive_age_confirmed", "true");
    localStorage.setItem(
      "deep-dive-coaching-trial",
      JSON.stringify({
        active: true,
        startedAt: "2026-04-15T10:00:00.000Z",
        goal: "explore",
        pace: "balanced",
      }),
    );
  });
}

async function installCoachingMocks(page: Page) {
  await page.route("**/api/coaching-access", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        level: 2,
        completedRounds: 0,
        maxRounds: null,
        primaryRiasecType: "AI",
        userId: "e2e-user",
      }),
    });
  });

  await page.route("**/api/reports/latest", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: MOCK_REPORT_ID,
      }),
    });
  });

  await page.route("**/api/report/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: MOCK_REPORT_ID,
        report: {
          summary:
            "Creative analytical roles fit best when the user can synthesize ambiguity into useful direction.",
        },
        assessmentMeta: {
          rushCount: 2,
          hesitationCount: 8,
          totalQuestions: 86,
        },
      }),
    });
  });

  await page.route("**/api/action-hub/plan", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        plan: true,
        items: [
          {
            title: "Reach out to one person in UX strategy",
            status: "pending",
            priority: 1,
          },
          {
            title: "Write down the patterns that energize you",
            status: "in_progress",
            priority: 2,
          },
        ],
      }),
    });
  });

  await page.route("**/api/memory", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        memories: [
          {
            category: "strength",
            keyword: "Pattern synthesis",
            confidence: 0.96,
          },
          {
            category: "motivation",
            keyword: "Work that creates clarity",
            confidence: 0.92,
          },
        ],
      }),
    });
  });

  await page.route("**/api/analytics/event", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route("**/api/coaching-chat", async (route) => {
    const payload = route.request().postDataJSON() as {
      messages?: Array<{ role: string; content: string }>;
    };
    const messageCount = payload.messages?.length ?? 0;
    const body = messageCount === 0 ? INITIAL_COACH_MESSAGE : FOLLOW_UP_MESSAGE;

    await route.fulfill({
      status: 200,
      contentType: "text/plain; charset=utf-8",
      body,
    });
  });
}

async function openCoachingChat(page: Page) {
  await seedAuthenticatedBrowser(page);
  await installCoachingMocks(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/coaching");
  await page.getByRole("button", { name: "I'm Ready" }).click();
  await expect(page.getByText(INITIAL_COACH_MESSAGE)).toBeVisible();
}

test.beforeAll(async () => {
  const ctx = await ensureSharedContext();
  sessionCookie = ctx.sessionCookie;
  csrfToken = ctx.csrfToken;
});

test("desktop: coach opening stays visible while quick actions move to right rail", async ({
  page,
}) => {
  await openCoachingChat(page);

  const firstAssistantBubble = page
    .locator(".chat-bubble-assistant")
    .filter({ hasText: INITIAL_COACH_MESSAGE })
    .first();
  const quickActionsRail = page.locator("aside");
  const quickAction = page.getByRole("button", {
    name: "I have a job offer — help me decide",
  });

  await expect(firstAssistantBubble).toBeVisible();
  await expect(quickActionsRail).toBeVisible();
  await expect(quickAction).toBeVisible();

  const messageBox = await firstAssistantBubble.boundingBox();
  const railBox = await quickActionsRail.boundingBox();
  expect(messageBox).not.toBeNull();
  expect(railBox).not.toBeNull();
  const viewport = page.viewportSize()!;
  expect(messageBox!.y + messageBox!.height).toBeLessThan(viewport.height);
  expect(messageBox!.x + messageBox!.width).toBeLessThan(railBox!.x);

  await page.screenshot({ path: DESKTOP_SCREENSHOT });

  await quickAction.click();
  await expect(
    page.locator(".chat-bubble-user").filter({
      hasText: "I have a job offer — help me decide",
    }),
  ).toBeVisible();
  await expect(page.getByText("What should I test first?")).toBeVisible();
});

test.describe("mobile", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });

  test("mobile: quick actions collapse into bottom sheet trigger", async ({
    page,
  }) => {
    await openCoachingChat(page);

    const firstAssistantBubble = page
      .locator(".chat-bubble-assistant")
      .filter({ hasText: INITIAL_COACH_MESSAGE })
      .first();
    const bottomTrigger = page.getByRole("button", {
      name: /What would you like to explore\?/i,
    });

    await expect(firstAssistantBubble).toBeVisible();
    await expect(page.locator("aside")).toBeHidden();
    await expect(bottomTrigger).toBeVisible();

    const messageBox = await firstAssistantBubble.boundingBox();
    const triggerBox = await bottomTrigger.boundingBox();
    expect(messageBox).not.toBeNull();
    expect(triggerBox).not.toBeNull();
    expect(messageBox!.y + messageBox!.height).toBeLessThan(triggerBox!.y);

    await page.screenshot({ path: MOBILE_COLLAPSED_SCREENSHOT });

    await bottomTrigger.click();
    await expect(
      page.getByRole("heading", { name: "What would you like to explore?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "I have a job offer — help me decide",
      }),
    ).toBeVisible();

    await page.screenshot({ path: MOBILE_SHEET_SCREENSHOT });

    await page
      .getByRole("button", {
        name: "I have a job offer — help me decide",
      })
      .click();

    await expect(
      page.locator(".chat-bubble-user").filter({
        hasText: "I have a job offer — help me decide",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "What would you like to explore?" }),
    ).toBeHidden();
  });
});
