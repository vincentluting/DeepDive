// ============================================================
// P0: Quick Dive — Full Browser Flow (12-type archetype system)
//
// Tests the complete Quick Dive experience through the actual UI:
//   Landing → Start → Answer 30 RIASEC questions →
//   Values Intro → Answer 8 TwIVI questions → See result
//
// This catches UI bugs that API-only tests miss:
//   broken buttons, missing translations, layout crashes,
//   phase transition failures, Likert scale mismatches, etc.
// ============================================================

import { test, expect } from "@playwright/test";

async function gotoQuickDive(
  page: import("@playwright/test").Page,
  locale: "en" | "zh",
) {
  // Clear persisted Quick Dive progress before navigation. Playwright
  // reuses BrowserContext across tests in the same worker, and the engine
  // restores in-progress sessions from localStorage (deep-dive-quickdive-
  // progress), which would skip the intro phase on subsequent tests.
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* private mode / quota — fall through */
    }
  });
  await page.goto(`/${locale}/quickdive`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await expect(page).not.toHaveTitle(/500|Error/i);
}

async function startQuickDive(page: import("@playwright/test").Page) {
  const startBtn = page.getByTestId("quickdive-intro-start");
  await expect(startBtn).toBeVisible({ timeout: 10_000 });
  // Wait for client hydration before clicking. The intro CTA exposes
  // `data-hydrated` so we don't have to guess — once it flips to "true"
  // the React 19 streaming hydration has attached its click handler.
  // Wrap in try/catch so older builds without the attribute still fall
  // through to the retry loop below; otherwise a missing attribute
  // would throw and skip the fallback entirely.
  try {
    await expect(startBtn).toHaveAttribute("data-hydrated", "true", {
      timeout: 10_000,
    });
  } catch {
    // Attribute not found — rely on retry loop below.
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    await startBtn.click({ force: true });
    try {
      await expect(page.getByTestId("quickdive-riasec-counter")).toBeVisible({
        timeout: 10_000,
      });
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

// ── Helper: Answer RIASEC Part 1 (30 questions, 0-4 Likert) ──

async function answerRiasecQuestions(page: import("@playwright/test").Page) {
  const counter = page.getByTestId("quickdive-riasec-counter");
  // First-question timeout is generous: dev server cold-compiles the
  // RIASEC question component on first hit, which can exceed 10s on a
  // freshly-restarted server. Subsequent advances are fast.
  for (let i = 1; i <= 30; i++) {
    await expect(counter).toHaveText(`${i} / 30`, {
      timeout: i === 1 ? 30_000 : 10_000,
    });

    // Rotate through O*NET Likert values 0-4.
    const value = (i - 1) % 5;
    const btn = page.locator(
      `button[data-testid="quickdive-riasec-option-${value}"]:not(:disabled)`,
    );
    await expect(btn).toBeVisible({ timeout: 3_000 });
    await btn.click({ force: true });
    if (i < 30) {
      await expect(counter).toHaveText(`${i + 1} / 30`, { timeout: 10_000 });
    }
  }
}

// ── Helper: Answer TwIVI Part 2 (8 questions, 1-6 Likert) ──

async function answerValuesQuestions(
  page: import("@playwright/test").Page,
  totalValueQ: number = 8,
) {
  const counter = page.getByTestId("quickdive-values-counter");
  for (let i = 1; i <= totalValueQ; i++) {
    await expect(counter).toHaveText(`${i}/${totalValueQ}`, {
      timeout: 10_000,
    });

    const value = ((i - 1) % 6) + 1;
    const btn = page.locator(
      `button[data-testid="quickdive-value-option-${value}"]:not(:disabled)`,
    );
    await expect(btn).toBeVisible({ timeout: 3_000 });
    await btn.click({ force: true });
    if (i < totalValueQ) {
      await expect(counter).toHaveText(`${i + 1}/${totalValueQ}`, {
        timeout: 10_000,
      });
    }
  }
}

async function skipGenderStep(page: import("@playwright/test").Page) {
  await expect(page.getByTestId("quickdive-gender-step")).toBeVisible({
    timeout: 10_000,
  });
  await page.getByTestId("quickdive-gender-skip").click();
}

// ── Tests ──

test.describe("Quick Dive Browser Flow (12-type)", () => {
  test.describe.configure({ timeout: 150_000 });

  test("EN: complete 30+8 question flow → values-intro → values → result", async ({
    page,
  }) => {
    // 1. Navigate to Quick Dive
    await gotoQuickDive(page, "en");

    // 2. Click Start on intro screen (data-testid is stable across copy changes)
    await startQuickDive(page);

    // 3. Answer all 30 RIASEC questions (Part 1)
    await answerRiasecQuestions(page);

    // 4. Values Intro screen should appear after RIASEC completes.
    // Use testid (locale-agnostic, stable across editorial copy changes)
    // rather than free-text matching — Revelation editorial shell rewrites
    // the title/subtitle copy and would otherwise break this assertion.
    const valuesStartBtn = page.getByTestId("quickdive-values-start");
    await expect(valuesStartBtn).toBeVisible({ timeout: 10_000 });

    // 5. Click Start on values intro
    await valuesStartBtn.click();

    // 6. Answer all 8 TwIVI value questions (Part 2)
    await answerValuesQuestions(page, 8);

    // 7. Optional demographic visual preference, then generating → result.
    await skipGenderStep(page);
    await expect(page.getByTestId("quickdive-result")).toBeVisible({
      timeout: 90_000,
    });

    // 8. Verify result page has key elements
    await expect(page.locator("svg").first()).toBeVisible();

    // 9. Archetype name should be a 12-type name (not old 18-type)
    // Check for at least one of the new 12-type English names
    await expect(
      page
        .getByText(
          /Architect|Backbone|Tactician|Researcher|Icon|Dreamweaver|Mentor|Healer|Ace|Pioneer|Commander|Arbiter/i,
        )
        .first(),
    ).toBeVisible({ timeout: 10_000 });

    // 10. Next-step CTA is present in the Revelation result shell.
    await expect(page.getByTestId("quickdive-threshold-cta")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Master Builder")).not.toBeVisible();
    await expect(page.getByText("Dealmaker")).not.toBeVisible();
    await expect(page.getByText("Maestro")).not.toBeVisible();
    await expect(page.getByText("Operator")).not.toBeVisible();
  });

  test("ZH: complete 30+8 question flow → values-intro → values → result", async ({
    page,
  }) => {
    // 1. Navigate to Chinese Quick Dive
    await gotoQuickDive(page, "zh");

    // 2. Click Start (data-testid is locale-agnostic)
    await startQuickDive(page);

    // 3. Answer 30 RIASEC questions
    await answerRiasecQuestions(page);

    // 4. Values Intro screen (Chinese) — use testid since the editorial
    // shell rewrites the title (e.g. "再往下一层" instead of "第二部分").
    const valuesStartBtn = page.getByTestId("quickdive-values-start");
    await expect(valuesStartBtn).toBeVisible({ timeout: 10_000 });

    // 5. Click Start on values intro
    await valuesStartBtn.click();

    // 6. Answer 8 TwIVI questions
    await answerValuesQuestions(page, 8);

    // 7. Optional demographic visual preference, then result
    await skipGenderStep(page);
    await expect(page.getByTestId("quickdive-result")).toBeVisible({
      timeout: 90_000,
    });

    // 8. Verify 12-type Chinese archetype name appears
    await expect(
      page
        .getByText(
          /工程专家|主心骨|战略家|科学家|C位|追梦人|伯乐|疗愈师|王牌|先驱|总指挥|仲裁人/,
        )
        .first(),
    ).toBeVisible({ timeout: 10_000 });

    // 9. Raw measurement appendix expands and shows the interest dimensions.
    const appendixToggle = page.getByTestId("quickdive-appendix-toggle");
    await appendixToggle.scrollIntoViewIfNeeded();
    await expect(appendixToggle).toBeVisible({ timeout: 15_000 });
    await appendixToggle.click();
    await expect(page.getByTestId("quickdive-appendix-body")).toContainText(
      /实干派|探究派|创作派|规则派/,
      {
        timeout: 10_000,
      },
    );
  });

  test("EN: values-intro appears after RIASEC, not before", async ({
    page,
  }) => {
    await gotoQuickDive(page, "en");

    // Start button (data-testid is stable across copy changes)
    await startQuickDive(page);

    // After start, should see the first RIASEC question and NOT the
    // values-intro start button (testid is locale + copy invariant).
    // Generous timeout for dev-server cold compile of the RIASEC component.
    await expect(page.getByTestId("quickdive-riasec-counter")).toHaveText(
      "1 / 30",
      { timeout: 30_000 },
    );
    await expect(page.getByTestId("quickdive-values-start")).not.toBeVisible();
  });

  test("EN: intro page renders without crash", async ({ page }) => {
    await gotoQuickDive(page, "en");
    await expect(page.getByTestId("quickdive-intro-start")).toBeVisible({
      timeout: 10_000,
    });
    // Button copy carries a duration hint; accept either "min" or "minute"
    // since the abbreviated form is the current Revelation editorial choice.
    await expect(page.getByTestId("quickdive-intro-start")).toContainText(
      /min/i,
    );
  });

  test("EN: archetype code in result uses new format", async ({ page }) => {
    await gotoQuickDive(page, "en");

    // Start and complete Part 1 (data-testid is stable across copy changes)
    await startQuickDive(page);

    await answerRiasecQuestions(page);

    // Complete Part 2 — testid is stable across editorial copy changes.
    const valuesStartBtn = page.getByTestId("quickdive-values-start");
    await expect(valuesStartBtn).toBeVisible({ timeout: 10_000 });
    await valuesStartBtn.click();
    await answerValuesQuestions(page, 8);

    // Wait for result
    await skipGenderStep(page);
    await expect(page.getByTestId("quickdive-result")).toBeVisible({
      timeout: 45_000,
    });

    // Verify NO old 18-type names appear on the result page
    // Old names that should NOT appear: Master Builder, Analyst, Maestro, Coach, Dealmaker, Operator
    // (Some old names like "Pioneer" are reused in 12-type, so we only check uniquely-old names)
    await expect(page.getByText("Master Builder")).not.toBeVisible();
    await expect(page.getByText("Dealmaker")).not.toBeVisible();
    await expect(page.getByText("Maestro")).not.toBeVisible();
    await expect(page.getByText("Operator")).not.toBeVisible();
  });
});
