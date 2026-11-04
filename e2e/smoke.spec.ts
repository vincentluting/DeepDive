import { test, expect } from '@playwright/test';

test('homepage is accessible', async ({ page }) => {
  await page.goto('/en');
  await expect(page).not.toHaveTitle(/500|Error/i);
  await expect(page.locator('body')).toBeVisible();
});

test('Quick Dive flow can start', async ({ page }) => {
  await page.goto('/en/quickdive');
  await expect(page).not.toHaveTitle(/500|Error/i);
  // Wait for questionnaire UI to render — first question should be visible
  await expect(page.locator('[data-testid="question"], form, button').first()).toBeVisible({ timeout: 10_000 });
});

test('Deep Dive entry is reachable', async ({ page }) => {
  const response = await page.goto('/en/deepdive', {
    waitUntil: 'domcontentloaded',
  });
  const status = response?.status() ?? 0;
  // Should load or redirect to login — never 500
  expect(status).toBeLessThan(500);
});

test('report page does not crash', async ({ page }) => {
  const response = await page.goto('/en/report/latest', {
    waitUntil: 'domcontentloaded',
  });
  const status = response?.status() ?? 0;
  // May redirect to login, but should never be a server error
  expect(status).toBeLessThan(500);
});

// ── Chinese locale (P1: zero coverage before) ──

test('ZH: homepage is accessible', async ({ page }) => {
  await page.goto('/zh');
  await expect(page).not.toHaveTitle(/500|Error/i);
  await expect(page.locator('body')).toBeVisible();
});

test('ZH: Quick Dive flow can start', async ({ page }) => {
  await page.goto('/zh/quickdive');
  await expect(page).not.toHaveTitle(/500|Error/i);
  await expect(page.locator('[data-testid="question"], form, button').first()).toBeVisible({ timeout: 10_000 });
});

test('ZH: Deep Dive entry is reachable', async ({ page }) => {
  const response = await page.goto('/zh/deepdive', {
    waitUntil: 'domcontentloaded',
  });
  const status = response?.status() ?? 0;
  expect(status).toBeLessThan(500);
});

test('ZH: report page does not crash', async ({ page }) => {
  const response = await page.goto('/zh/report/latest', {
    waitUntil: 'domcontentloaded',
  });
  const status = response?.status() ?? 0;
  expect(status).toBeLessThan(500);
});
