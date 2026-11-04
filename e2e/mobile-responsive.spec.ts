// ============================================================
// Mobile Responsive — full-site stability checks
//
// Catches horizontal overflow, scroll locks, fixed-layer coverage,
// clipped content, and undersized tap targets across public/auth/app/
// report/admin routes on iPhone SE, iPhone 13, and Android widths.
//
// Run: npx playwright test --project=mobile-responsive
// ============================================================

import { test, expect, type Page } from "@playwright/test";
import {
  ensureSharedContext,
  promoteTestUserToAdmin,
} from "./fixtures/test-setup";
import {
  MOBILE_VIEWPORTS,
  assertMobilePageHealth,
  assertNoHorizontalOverflow,
  assertTouchTargets,
  attachAuthCookies,
  gotoMobilePage,
  waitForVisiblePageShell,
} from "./helpers/mobile-health";

interface RouteCheck {
  path: string;
  label: string;
  allowSmallTouchTargets?: number;
}

const PUBLIC_ROUTE_INVENTORY: RouteCheck[] = [
  { path: "/en", label: "landing EN", allowSmallTouchTargets: 2 },
  { path: "/zh", label: "landing ZH", allowSmallTouchTargets: 2 },
  { path: "/en/pricing", label: "pricing EN", allowSmallTouchTargets: 2 },
  { path: "/zh/pricing", label: "pricing ZH", allowSmallTouchTargets: 2 },
  { path: "/en/preview", label: "preview EN", allowSmallTouchTargets: 4 },
  { path: "/zh/preview", label: "preview ZH", allowSmallTouchTargets: 4 },
  { path: "/en/research", label: "research EN", allowSmallTouchTargets: 2 },
  { path: "/zh/research", label: "research ZH", allowSmallTouchTargets: 2 },
  { path: "/en/legal/privacy", label: "privacy EN", allowSmallTouchTargets: 2 },
  { path: "/zh/legal/privacy", label: "privacy ZH", allowSmallTouchTargets: 2 },
  { path: "/en/legal/terms", label: "terms EN", allowSmallTouchTargets: 2 },
  { path: "/zh/legal/terms", label: "terms ZH", allowSmallTouchTargets: 2 },
  {
    path: "/en/ai-career-check",
    label: "AI career check EN",
    allowSmallTouchTargets: 2,
  },
  {
    path: "/zh/ai-career-check",
    label: "AI career check ZH",
    allowSmallTouchTargets: 2,
  },
];

const AUTH_ROUTE_INVENTORY: RouteCheck[] = [
  { path: "/en/login", label: "login EN", allowSmallTouchTargets: 2 },
  { path: "/zh/login", label: "login ZH", allowSmallTouchTargets: 2 },
  { path: "/en/register", label: "register EN", allowSmallTouchTargets: 2 },
  { path: "/zh/register", label: "register ZH", allowSmallTouchTargets: 2 },
  {
    path: "/en/forgot-password",
    label: "forgot password EN",
    allowSmallTouchTargets: 2,
  },
  {
    path: "/zh/forgot-password",
    label: "forgot password ZH",
    allowSmallTouchTargets: 2,
  },
  {
    path: "/en/reset-password",
    label: "reset password EN",
    allowSmallTouchTargets: 2,
  },
  {
    path: "/zh/reset-password",
    label: "reset password ZH",
    allowSmallTouchTargets: 2,
  },
];

const GUEST_ASSESSMENT_ROUTES: RouteCheck[] = [
  { path: "/en/quickdive", label: "Quick Dive EN", allowSmallTouchTargets: 1 },
  { path: "/zh/quickdive", label: "Quick Dive ZH", allowSmallTouchTargets: 1 },
  {
    path: "/en/quickdive/narrative",
    label: "Quick Dive narrative EN",
    allowSmallTouchTargets: 1,
  },
  {
    path: "/zh/quickdive/narrative",
    label: "Quick Dive narrative ZH",
    allowSmallTouchTargets: 1,
  },
  {
    path: "/en/deepdive",
    label: "Deep Dive gate EN",
    allowSmallTouchTargets: 2,
  },
  {
    path: "/zh/deepdive",
    label: "Deep Dive gate ZH",
    allowSmallTouchTargets: 2,
  },
  {
    path: "/en/immersive-dive",
    label: "Immersive Dive gate EN",
    allowSmallTouchTargets: 2,
  },
  {
    path: "/zh/immersive-dive",
    label: "Immersive Dive gate ZH",
    allowSmallTouchTargets: 2,
  },
];

const APP_ROUTE_INVENTORY: RouteCheck[] = [
  { path: "/en/dashboard", label: "dashboard EN", allowSmallTouchTargets: 4 },
  { path: "/zh/dashboard", label: "dashboard ZH", allowSmallTouchTargets: 4 },
  { path: "/en/explore", label: "explore EN", allowSmallTouchTargets: 4 },
  { path: "/zh/explore", label: "explore ZH", allowSmallTouchTargets: 4 },
  { path: "/en/reports", label: "reports EN", allowSmallTouchTargets: 4 },
  { path: "/zh/reports", label: "reports ZH", allowSmallTouchTargets: 4 },
  { path: "/en/profile", label: "profile EN", allowSmallTouchTargets: 4 },
  { path: "/zh/profile", label: "profile ZH", allowSmallTouchTargets: 4 },
  { path: "/en/action-hub", label: "action hub EN", allowSmallTouchTargets: 4 },
  { path: "/zh/action-hub", label: "action hub ZH", allowSmallTouchTargets: 4 },
  { path: "/en/coaching", label: "coaching EN", allowSmallTouchTargets: 4 },
  { path: "/zh/coaching", label: "coaching ZH", allowSmallTouchTargets: 4 },
  { path: "/en/companions", label: "companions EN", allowSmallTouchTargets: 4 },
  { path: "/zh/companions", label: "companions ZH", allowSmallTouchTargets: 4 },
  { path: "/en/settings", label: "settings EN", allowSmallTouchTargets: 4 },
  { path: "/zh/settings", label: "settings ZH", allowSmallTouchTargets: 4 },
  {
    path: "/en/settings/privacy",
    label: "privacy settings EN",
    allowSmallTouchTargets: 4,
  },
  {
    path: "/zh/settings/privacy",
    label: "privacy settings ZH",
    allowSmallTouchTargets: 4,
  },
];

async function clickIntroAndAwaitRiasec(page: Page): Promise<void> {
  const startBtn = page.getByTestId("quickdive-intro-start");
  await expect(startBtn).toBeVisible({ timeout: 10_000 });
  try {
    await expect(startBtn).toHaveAttribute("data-hydrated", "true", {
      timeout: 10_000,
    });
  } catch {
    // Older builds without the attribute still fall through to the retry loop.
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    await startBtn.click({ force: true });
    try {
      await expect(page.getByTestId("quickdive-riasec-counter")).toHaveText(
        "1 / 30",
        { timeout: 10_000 },
      );
      return;
    } catch {
      if (attempt === 3) {
        throw new Error(
          "QuickDive intro→playing transition failed after 3 clicks",
        );
      }
      await page.waitForTimeout(500);
    }
  }
}

async function runRoutes(page: Page, routes: RouteCheck[]): Promise<void> {
  for (const route of routes) {
    await test.step(route.label, async () => {
      await gotoMobilePage(page, route.path);
      await assertMobilePageHealth(page, {
        label: route.label,
        allowSmallTouchTargets: route.allowSmallTouchTargets,
      });
    });
  }
}

test.describe("Mobile route inventory", () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`guest public/auth/assessment routes stay healthy — ${viewport.name}`, async ({
      page,
    }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await runRoutes(page, [
        ...PUBLIC_ROUTE_INVENTORY,
        ...AUTH_ROUTE_INVENTORY,
        ...GUEST_ASSESSMENT_ROUTES,
      ]);
    });

    test(`authenticated app routes stay healthy — ${viewport.name}`, async ({
      page,
    }) => {
      test.setTimeout(180_000);
      const ctx = await ensureSharedContext();
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await attachAuthCookies(page, ctx);
      await runRoutes(page, APP_ROUTE_INVENTORY);
    });
  }
});

test.describe("Mobile dynamic report/share routes", () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`generated result surfaces stay healthy — ${viewport.name}`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      const ctx = await ensureSharedContext();
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await attachAuthCookies(page, ctx);

      const routes: RouteCheck[] = [
        {
          path: `/en/result/qd/${ctx.quickDiveResultId}`,
          label: "public quick result EN",
          allowSmallTouchTargets: 4,
        },
        {
          path: `/zh/result/qd/${ctx.quickDiveResultId}`,
          label: "public quick result ZH",
          allowSmallTouchTargets: 4,
        },
      ];

      if (ctx.profileId) {
        routes.push(
          {
            path: `/en/profile/${ctx.profileId}`,
            label: "profile detail EN",
            allowSmallTouchTargets: 4,
          },
          {
            path: `/zh/profile/${ctx.profileId}`,
            label: "profile detail ZH",
            allowSmallTouchTargets: 4,
          },
          {
            path: `/en/profile-reveal/${ctx.profileId}`,
            label: "profile reveal EN",
            allowSmallTouchTargets: 4,
          },
        );
      }

      if (ctx.reportId) {
        routes.push(
          {
            path: `/en/report/${ctx.reportId}`,
            label: "full report EN",
            allowSmallTouchTargets: 4,
          },
          {
            path: `/zh/report/${ctx.reportId}`,
            label: "full report ZH",
            allowSmallTouchTargets: 4,
          },
        );
      }

      await runRoutes(page, routes);
    });
  }
});

test.describe("Mobile assessment interactions", () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`Quick Dive question controls fit and remain tappable — ${viewport.name}`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await gotoMobilePage(page, "/en/quickdive");
      await clickIntroAndAwaitRiasec(page);
      await page.waitForTimeout(300);

      await assertNoHorizontalOverflow(page, "Quick Dive question");
      const buttons = page.locator("button[aria-label]");
      expect(await buttons.count()).toBeGreaterThanOrEqual(5);
      await assertTouchTargets(page, "Quick Dive question");
    });

    test(`Immersive Dive intro path has reachable controls — ${viewport.name}`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      const ctx = await ensureSharedContext();
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await attachAuthCookies(page, ctx);
      await gotoMobilePage(page, "/en/immersive-dive");
      await waitForVisiblePageShell(page);

      const firstAction = page
        .getByRole("button", {
          name: /i have read this|enter|begin|continue|start/i,
        })
        .first();
      await expect(firstAction).toBeVisible({ timeout: 30_000 });
      await firstAction.scrollIntoViewIfNeeded();
      await firstAction.click({ timeout: 10_000 });
      await assertMobilePageHealth(page, {
        label: "Immersive Dive after first action",
        allowSmallTouchTargets: 2,
      });
    });
  }
});

test.describe("Mobile admin operations", () => {
  test("admin dashboard tabs, search, and tables remain operable", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const ctx = await ensureSharedContext();
    await promoteTestUserToAdmin(ctx.email);
    await page.setViewportSize({ width: 390, height: 844 });
    await attachAuthCookies(page, ctx);

    await gotoMobilePage(page, "/en/admin");
    await waitForVisiblePageShell(page);
    await expect(
      page.getByRole("heading", { name: /admin panel/i }),
    ).toBeVisible({ timeout: 30_000 });
    await assertMobilePageHealth(page, {
      label: "admin users tab",
      allowSmallTouchTargets: 6,
    });

    const tabList = page.locator("[data-admin-tab-list]").first();
    await expect(tabList).toBeVisible({ timeout: 10_000 });
    await tabList.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await expect
      .poll(() => tabList.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
    await tabList.evaluate((el) => {
      el.scrollLeft = 0;
    });

    const analyticsTab = page.getByRole("button", { name: /^Analytics$/ });
    await analyticsTab.scrollIntoViewIfNeeded();
    await analyticsTab.click();
    await analyticsTab.scrollIntoViewIfNeeded();
    await assertMobilePageHealth(page, {
      label: "admin analytics tab",
      allowSmallTouchTargets: 6,
    });

    const usersTab = page.getByRole("button", { name: /^Users$/ });
    await usersTab.scrollIntoViewIfNeeded();
    await usersTab.click();
    const searchInput = page.getByPlaceholder(/search by email or name/i);
    await searchInput.fill(ctx.email);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await assertMobilePageHealth(page, {
      label: "admin users search",
      allowSmallTouchTargets: 6,
    });
  });
});
