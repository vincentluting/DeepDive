// ============================================================
// Mobile 375px — Visual Regression
//
// Pixel-diff snapshots of the highest-traffic public pages on a
// 375×812 iPhone-SE viewport. Catches the class of bugs found
// during the 2026-05-02 user test session: FAB overlapping
// content, decorative glyphs covering text, header buttons too
// faint to see — none of which the existing layout / overflow
// tests catch.
//
// Baselines live next to this file under `mobile-visual-regression.spec.ts-snapshots/`.
// First run generates baselines (no failure). Subsequent runs
// fail on diffs > maxDiffPixelRatio. Update baselines via:
//   npx playwright test --project=mobile-visual-regression --update-snapshots
//
// We deliberately scope this to public pages — auth/LLM screens
// are too dynamic for stable diffs and belong to functional
// E2E specs (e.g. report-rendering, coaching-flow) instead.
// ============================================================

import { test, expect, type Page } from "@playwright/test";

async function gotoStable(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await expect(page.locator("body")).toBeVisible();
  // Allow Tailwind / Framer Motion entry animations to settle.
  await page.waitForTimeout(800);
}

// Baseline tolerance: 1% of pixels may differ. Covers font hinting
// drift across machines without masking real regressions.
const SNAPSHOT_OPTIONS = {
  maxDiffPixelRatio: 0.01,
  animations: "disabled" as const,
  // Hide elements that legitimately vary across runs.
  mask: [
    // Cookie banner / consent toast (timing-dependent).
    // Re-add selectors here when new dynamic chrome appears.
  ],
};

const PUBLIC_PAGES: Array<{ name: string; path: string }> = [
  { name: "landing-en", path: "/en" },
  { name: "landing-zh", path: "/zh" },
  { name: "login-en", path: "/en/login" },
  { name: "login-zh", path: "/zh/login" },
  { name: "register-en", path: "/en/register" },
  { name: "register-zh", path: "/zh/register" },
  { name: "pricing-en", path: "/en/pricing" },
  { name: "pricing-zh", path: "/zh/pricing" },
  { name: "preview-en", path: "/en/preview" },
  { name: "preview-zh", path: "/zh/preview" },
  { name: "research-en", path: "/en/research" },
  { name: "research-zh", path: "/zh/research" },
  { name: "ai-career-check-en", path: "/en/ai-career-check" },
  { name: "ai-career-check-zh", path: "/zh/ai-career-check" },
  { name: "privacy-en", path: "/en/legal/privacy" },
  { name: "privacy-zh", path: "/zh/legal/privacy" },
  { name: "quickdive-intro-en", path: "/en/quickdive" },
  { name: "quickdive-intro-zh", path: "/zh/quickdive" },
];

test.describe("Mobile 375px — visual regression (public pages)", () => {
  for (const { name, path } of PUBLIC_PAGES) {
    test(`${name} matches baseline`, async ({ page }) => {
      await gotoStable(page, path);
      await expect(page).toHaveScreenshot(`${name}.png`, SNAPSHOT_OPTIONS);
    });
  }
});
