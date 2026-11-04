// ============================================================
// Explore Hub — User Journey E2E
//
// Tests the explore hub page where users choose their path:
//   Quick Dive / Immersive Dive / Deep Dive
//
// This is the critical gateway page after landing — if it breaks,
// users cannot start any assessment.
// ============================================================

import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import {
  apiHeaders,
  authedHeaders,
  cleanupTestUser,
  obtainCsrf,
  registerUser,
} from './fixtures/test-setup'
import { QUICKDIVE_RESULT_DATA, RIASEC_SCORES } from './fixtures/test-answers'

const BASE = `http://localhost:${process.env.E2E_PORT || '3000'}`
const TEST_PASSWORD = 'TestPassword123!'

type ResearchGroup = 'classic' | 'immersive'

async function createResearchUser(
  request: APIRequestContext,
  researchGroup: ResearchGroup,
) {
  const csrfToken = await obtainCsrf(request)
  const email = `e2e-explore-${researchGroup}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@test.deepdive.dev`
  const sessionCookie = await registerUser(
    request,
    csrfToken,
    email,
    TEST_PASSWORD,
    `Explore ${researchGroup}`,
  )

  const cohortRes = await request.post(`${BASE}/api/test/set-cohort`, {
    headers: apiHeaders(csrfToken),
    data: { email, cohort: 'thesis_2026', researchGroup },
  })
  expect(
    cohortRes.ok(),
    `Set thesis cohort failed: ${cohortRes.status()}`,
  ).toBeTruthy()

  return { csrfToken, email, sessionCookie }
}

async function attachSession(page: Page, sessionCookie: string) {
  await page.context().addCookies([
    {
      name: 'session',
      value: sessionCookie.replace(/^session=/, ''),
      url: BASE,
    },
  ])
}

async function createOwnedQuickDiveReport(request: APIRequestContext) {
  const csrfToken = await obtainCsrf(request)
  const email = `e2e-quick-report-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@test.deepdive.dev`
  const sessionCookie = await registerUser(
    request,
    csrfToken,
    email,
    TEST_PASSWORD,
    'Quick Report Owner',
  )

  const saveRes = await request.post(`${BASE}/api/quickdive/save`, {
    headers: authedHeaders(csrfToken, sessionCookie),
    data: {
      scores: RIASEC_SCORES,
      code: 'AI',
      label: 'The Creative Analyst',
      locale: 'en',
      exploreMode: 'classic',
      resultData: QUICKDIVE_RESULT_DATA,
    },
  })
  expect(saveRes.ok(), `Quick report save failed: ${saveRes.status()}`).toBeTruthy()
  const body = await saveRes.json()
  return { email, reportId: body.id as string }
}

test.describe('Explore Hub — EN', () => {

  test('explore hub renders with three path options', async ({ page }) => {
    await page.goto('/en/explore')
    await expect(page).not.toHaveTitle(/500|Error/i)

    // Should show the three dive options
    await expect(
      page.getByText(/Quick Dive/i).first()
    ).toBeVisible({ timeout: 10_000 })

    await expect(
      page.getByText(/Immersive Dive|Immersive/i).first()
    ).toBeVisible()

    await expect(
      page.getByText(/Deep Dive/i).first()
    ).toBeVisible()
  })

  test('Quick Dive card links to quickdive page', async ({ page }) => {
    await page.goto('/en/explore')
    await expect(page).not.toHaveTitle(/500|Error/i)

    // Stable product contract: the first card's primary action starts Quick Dive.
    const quickDiveBtn = page.getByTestId('assessment-card-quickdive-link')
    await expect(quickDiveBtn).toBeVisible({ timeout: 10_000 })
    await quickDiveBtn.click()

    // Should navigate to quickdive or immersive page
    await expect(page).toHaveURL(/\/(quickdive|immersive)/, { timeout: 10_000 })
    await expect(page).not.toHaveTitle(/500|Error/i)
  })

  test('Deep Dive shows lock/gate for unauthenticated users', async ({ page }) => {
    await page.goto('/en/explore')
    await expect(page).not.toHaveTitle(/500|Error/i)

    // Deep Dive should show some form of lock indicator
    // (either "Complete Quick Dive first" or "Requires invite code")
    await expect(
      page.getByText(/Complete|Unlock|Requires|invite|Quick Dive first/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Explore Hub — ZH', () => {

  test('explore hub renders with three path options (Chinese)', async ({ page }) => {
    await page.goto('/zh/explore')
    await expect(page).not.toHaveTitle(/500|Error/i)

    await expect(
      page.getByText(/快速探索/).first()
    ).toBeVisible({ timeout: 10_000 })

    await expect(
      page.getByText(/沉浸探索|沉浸/).first()
    ).toBeVisible()

    await expect(
      page.getByText(/深度探索/).first()
    ).toBeVisible()
  })

  test('no horizontal overflow on 375px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/zh/explore')
    await expect(page.locator('body')).toBeVisible()
    await page.waitForTimeout(500)

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow, 'Explore hub has horizontal scrollbar on mobile').toBe(0)
  })
})

test.describe('Research participant UI contracts — EN', () => {
  test('classic research user sees Immersive Dive explicitly locked', async ({
    page,
    request,
  }) => {
    const user = await createResearchUser(request, 'classic')
    try {
      await attachSession(page, user.sessionCookie)
      await page.goto('/en/explore')

      await expect(
        page.getByText('Your invite code has assigned you to Classic Quick Dive mode'),
      ).toBeVisible({ timeout: 10_000 })
      await expect(page.getByTestId('assessment-card-immersive-link')).toContainText(
        'Go to Quick Dive',
      )
      await expect(page.getByTestId('assessment-card-immersive-link')).toHaveAttribute(
        'href',
        '/en/quickdive',
      )
      await expect(page.getByTestId('assessment-card-quickdive-link')).toHaveAttribute(
        'href',
        '/en/quickdive',
      )
    } finally {
      await cleanupTestUser(request, user.email)
    }
  })

  test('immersive research user sees Quick Dive explicitly locked', async ({
    page,
    request,
  }) => {
    const user = await createResearchUser(request, 'immersive')
    try {
      await attachSession(page, user.sessionCookie)
      await page.goto('/en/explore')

      await expect(
        page.getByText('Your invite code has assigned you to Immersive Dive mode'),
      ).toBeVisible({ timeout: 10_000 })
      await expect(page.getByTestId('assessment-card-quickdive-link')).toContainText(
        'Go to Immersive Dive',
      )
      await expect(page.getByTestId('assessment-card-quickdive-link')).toHaveAttribute(
        'href',
        '/en/immersive-dive',
      )
      await expect(page.getByTestId('assessment-card-immersive-link')).toHaveAttribute(
        'href',
        '/en/immersive-dive',
      )
    } finally {
      await cleanupTestUser(request, user.email)
    }
  })

  test('saved Quick Dive report claim CTA opens the inline register panel', async ({
    page,
    request,
  }) => {
    const report = await createOwnedQuickDiveReport(request)
    try {
      await page.goto(`/en/report/quick/${report.reportId}`)
      const claimButton = page.getByTestId('quickdive-claim-profile-button')
      await claimButton.scrollIntoViewIfNeeded()
      await expect(claimButton).toBeVisible({ timeout: 15_000 })
      await claimButton.click()

      await expect(page.getByTestId('quickdive-inline-register-panel')).toBeVisible({
        timeout: 10_000,
      })
      await expect(page.getByText('Create Account')).toBeVisible()
    } finally {
      await cleanupTestUser(request, report.email)
    }
  })
})
