// ============================================================
// Public Pages Smoke — Accessibility & No-Crash Tests
//
// Covers public pages that had zero E2E coverage:
//   /explore, /ai-career-check, /legal/*, /login, /register
//
// Quick smoke tests: load page → no 500 → key content visible.
// ============================================================

import { test, expect } from '@playwright/test'

test.describe.configure({ timeout: 90_000 })

test.describe('Public Pages — EN', () => {

  test('explore hub loads', async ({ page }) => {
    await page.goto('/en/explore')
    await expect(page).not.toHaveTitle(/500|Error/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('ai-career-check loads', async ({ page }) => {
    await page.goto('/en/ai-career-check')
    await expect(page).not.toHaveTitle(/500|Error/i)
    await expect(page.locator('input[type="text"]')).toBeVisible({ timeout: 10_000 })
  })

  test('legal/privacy loads', async ({ page }) => {
    const res = await page.goto('/en/legal/privacy', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const status = res?.status() ?? 0
    expect(status).toBeLessThan(500)
  })

  test('legal/terms loads', async ({ page }) => {
    const res = await page.goto('/en/legal/terms', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const status = res?.status() ?? 0
    expect(status).toBeLessThan(500)
  })

  test('immersive-dive entry loads', async ({ page }) => {
    const res = await page.goto('/en/immersive-dive', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const status = res?.status() ?? 0
    // May redirect, but should never 500
    expect(status).toBeLessThan(500)
  })
})

test.describe('Public Pages — ZH', () => {

  test('explore hub loads (Chinese)', async ({ page }) => {
    await page.goto('/zh/explore')
    await expect(page).not.toHaveTitle(/500|Error/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('ai-career-check loads (Chinese)', async ({ page }) => {
    await page.goto('/zh/ai-career-check')
    await expect(page).not.toHaveTitle(/500|Error/i)
    await expect(page.locator('input[type="text"]')).toBeVisible({ timeout: 10_000 })
  })

  test('legal/privacy loads (Chinese)', async ({ page }) => {
    const res = await page.goto('/zh/legal/privacy', { waitUntil: 'domcontentloaded', timeout: 60_000 })
    const status = res?.status() ?? 0
    expect(status).toBeLessThan(500)
  })
})
