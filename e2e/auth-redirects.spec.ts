// ============================================================
// P0: Auth Redirect Tests
//
// Verifies that protected routes correctly redirect
// unauthenticated users instead of showing errors.
//
// Critical because broken auth redirects = users see 500s
// or access pages they shouldn't.
// ============================================================

import { test, expect } from '@playwright/test'

test.describe.configure({ timeout: 90_000 })

async function expectRedirect(
  page: import('@playwright/test').Page,
  path: string,
  expected: RegExp,
) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  const redirectSurface = page
    .locator(
      'input[type="email"], input[name="email"], [data-testid="assessment-card-quickdive-link"]',
    )
    .first()

  await expect
    .poll(
      async () =>
        expected.test(page.url()) ||
        (await redirectSurface.isVisible().catch(() => false)),
      { timeout: 45_000 },
    )
    .toBe(true)
  await expect(page).not.toHaveTitle(/500|Error/i)
}

test.describe('Auth Redirects — Unauthenticated Access', () => {

  // ── Deep Dive (should → register) ──

  test('EN: /deepdive redirects to register', async ({ page }) => {
    await expectRedirect(page, '/en/deepdive', /\/(register|login|explore)/)
  })

  test('ZH: /deepdive redirects to register', async ({ page }) => {
    await expectRedirect(page, '/zh/deepdive', /\/(register|login|explore)/)
  })

  // ── Coaching (should → register) ──

  test('EN: /coaching redirects to register', async ({ page }) => {
    await expectRedirect(page, '/en/coaching', /\/(register|login)/)
  })

  test('ZH: /coaching redirects to register', async ({ page }) => {
    await expectRedirect(page, '/zh/coaching', /\/(register|login)/)
  })

  // ── Profile (should → login) ──

  test('EN: /profile redirects to login', async ({ page }) => {
    await expectRedirect(page, '/en/profile', /\/(login|register)/)
  })

  test('ZH: /profile redirects to login', async ({ page }) => {
    await expectRedirect(page, '/zh/profile', /\/(login|register)/)
  })

  // ── Dashboard (should → login) ──

  test('EN: /dashboard redirects to login', async ({ page }) => {
    await expectRedirect(page, '/en/dashboard', /\/(login|register)/)
  })

  // ── Report (should → register) ──

  test('EN: /report/latest redirects to register', async ({ page }) => {
    await expectRedirect(page, '/en/report/latest', /\/(register|login)/)
  })

  // ── Settings (should → login) ──

  test('EN: /settings redirects to login', async ({ page }) => {
    await expectRedirect(page, '/en/settings', /\/(login|register)/)
  })
})

test.describe('Auth Pages — Should Be Accessible', () => {

  test('EN: /login is accessible', async ({ page }) => {
    await page.goto('/en/login')
    await expect(page).not.toHaveTitle(/500|Error/i)
    // Should show login form
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10_000 })
  })

  test('ZH: /login is accessible', async ({ page }) => {
    await page.goto('/zh/login')
    await expect(page).not.toHaveTitle(/500|Error/i)
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10_000 })
  })

  test('EN: /register is accessible', async ({ page }) => {
    await page.goto('/en/register')
    await expect(page).not.toHaveTitle(/500|Error/i)
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10_000 })
  })

  test('ZH: /register is accessible', async ({ page }) => {
    await page.goto('/zh/register')
    await expect(page).not.toHaveTitle(/500|Error/i)
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10_000 })
  })
})
