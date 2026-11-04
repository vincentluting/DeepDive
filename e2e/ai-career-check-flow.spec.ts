// ============================================================
// AI Career Check — Public Page E2E
//
// Tests the public AI Career Impact Checker page:
//   Search occupation → Select → See AI impact analysis → CTA
//
// This is a public SEO entry page — if it breaks, organic
// traffic hits a dead end.
// ============================================================

import { test, expect } from '@playwright/test'

test.describe('AI Career Check — EN', () => {

  test('page renders with search input and occupation list', async ({ page }) => {
    await page.goto('/en/ai-career-check')
    await expect(page).not.toHaveTitle(/500|Error/i)

    // Title should be visible
    await expect(
      page.getByText(/Will AI Impact Your Job/i)
    ).toBeVisible({ timeout: 10_000 })

    // Search input should be present
    await expect(
      page.getByTestId('ai-career-search')
    ).toBeVisible()

    // Occupation list should show items
    await expect(
      page.locator('button').filter({ hasText: /Software Engineer|Data Analyst|Marketing|Teacher/i }).first()
    ).toBeVisible({ timeout: 5_000 })
  })

  test('search filters occupations', async ({ page }) => {
    await page.goto('/en/ai-career-check')
    await expect(page).not.toHaveTitle(/500|Error/i)

    const searchInput = page.getByTestId('ai-career-search')
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    // Type a search query
    await searchInput.fill('software')
    await page.waitForTimeout(300)

    // Should show Software Engineer in results
    await expect(
      page.getByText(/Software Engineer/i).first()
    ).toBeVisible()
  })

  test('selecting an occupation shows impact analysis', async ({ page }) => {
    await page.goto('/en/ai-career-check')
    await expect(page).not.toHaveTitle(/500|Error/i)

    // Click the first occupation
    const firstOcc = page.getByTestId('ai-career-occupation-sw-eng')
    await expect(firstOcc).toBeVisible({ timeout: 10_000 })
    await firstOcc.click()

    // Impact analysis should show: exposure score, human edge, AI-era move
    await expect(
      page.getByText(/AI Exposure/i).first()
    ).toBeVisible({ timeout: 5_000 })

    await expect(
      page.getByText(/Your Human Edge/i).first()
    ).toBeVisible()

    await expect(
      page.getByText(/AI-Era Move/i).first()
    ).toBeVisible()

    // CTA to Quick Dive should appear
    await expect(
      page.getByText(/Start Quick Dive/i).first()
    ).toBeVisible()
  })

  test('back button returns to occupation list', async ({ page }) => {
    await page.goto('/en/ai-career-check')

    // Select an occupation
    const occ = page.getByTestId('ai-career-occupation-sw-eng')
    await expect(occ).toBeVisible({ timeout: 10_000 })
    await occ.click()

    // Wait for detail view
    await expect(page.getByText(/AI Exposure/i).first()).toBeVisible({ timeout: 5_000 })

    // Click back
    const backBtn = page.getByTestId('ai-career-back')
    await expect(backBtn).toBeVisible()
    await backBtn.click()

    // Should see the occupation list again
    await expect(
      page.getByTestId('ai-career-search')
    ).toBeVisible({ timeout: 5_000 })
  })

  test('CTA links to Quick Dive', async ({ page }) => {
    await page.goto('/en/ai-career-check')

    const occ = page.getByTestId('ai-career-occupation-sw-eng')
    await expect(occ).toBeVisible({ timeout: 10_000 })
    await occ.click()

    // Click CTA
    const cta = page.getByTestId('ai-career-quickdive-cta')
    await expect(cta).toBeVisible({ timeout: 5_000 })
    await cta.click()

    // Should navigate to quickdive
    await expect(page).toHaveURL(/\/quickdive/, { timeout: 10_000 })
  })
})

test.describe('AI Career Check — ZH', () => {

  test('page renders in Chinese', async ({ page }) => {
    await page.goto('/zh/ai-career-check')
    await expect(page).not.toHaveTitle(/500|Error/i)

    await expect(
      page.getByText(/AI 会影响你的工作吗/)
    ).toBeVisible({ timeout: 10_000 })

    // Search input visible
    await expect(page.getByTestId('ai-career-search')).toBeVisible()
  })

  test('selecting occupation shows Chinese impact analysis', async ({ page }) => {
    await page.goto('/zh/ai-career-check')

    const occ = page.getByTestId('ai-career-occupation-sw-eng')
    await expect(occ).toBeVisible({ timeout: 10_000 })
    await occ.click()

    // Chinese labels should appear
    await expect(page.getByText(/AI 暴露度/).first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/人类护城河/).first()).toBeVisible()
    await expect(page.getByText(/AI 时代行动建议/).first()).toBeVisible()
  })
})
