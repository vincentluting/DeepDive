/**
 * Unit tests for UTM parameter preservation across middleware redirects.
 *
 * These tests validate the URL construction logic used in middleware.ts for
 * the three redirect scenarios: i18n locale prefix, /quickexplore → /quickdive,
 * and /questionnaire → /deepdive.
 *
 * The logic under test is the pattern:
 *   const newUrl = new URL(targetPath, base)
 *   sourceSearchParams.forEach((value, key) => newUrl.searchParams.set(key, value))
 */

import { describe, it, expect } from 'vitest'

const BASE = 'https://deepdive.app'

/**
 * Simulate the i18n redirect URL construction used in middleware.ts:
 *   const newUrl = new URL(`/${locale}${pathname}`, request.url)
 *   request.nextUrl.searchParams.forEach((value, key) => newUrl.searchParams.set(key, value))
 */
function buildI18nRedirectUrl(pathname: string, sourceSearch: string, locale: string): URL {
  const newUrl = new URL(`/${locale}${pathname}`, BASE)
  const sourceParams = new URLSearchParams(sourceSearch)
  sourceParams.forEach((value, key) => newUrl.searchParams.set(key, value))
  return newUrl
}

/**
 * Simulate the /quickexplore → /quickdive redirect URL construction.
 */
function buildQuickexploreRedirectUrl(locale: string, rest: string, sourceSearch: string): URL {
  const quickdiveUrl = new URL(`/${locale}/quickdive${rest}`, BASE)
  const sourceParams = new URLSearchParams(sourceSearch)
  sourceParams.forEach((value, key) => quickdiveUrl.searchParams.set(key, value))
  return quickdiveUrl
}

/**
 * Simulate the /questionnaire → /deepdive redirect URL construction.
 */
function buildQuestionnaireRedirectUrl(locale: string, rest: string, sourceSearch: string): URL {
  const deepdiveUrl = new URL(`/${locale}/deepdive${rest}`, BASE)
  const sourceParams = new URLSearchParams(sourceSearch)
  sourceParams.forEach((value, key) => deepdiveUrl.searchParams.set(key, value))
  return deepdiveUrl
}

// ---------------------------------------------------------------------------
// i18n redirect
// ---------------------------------------------------------------------------

describe('i18n redirect — UTM param preservation', () => {
  it('preserves utm_source on i18n redirect', () => {
    const url = buildI18nRedirectUrl('/', 'utm_source=google', 'en')
    expect(url.searchParams.get('utm_source')).toBe('google')
  })

  it('preserves all UTM params on i18n redirect', () => {
    const search = 'utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_content=banner'
    const url = buildI18nRedirectUrl('/dashboard', search, 'zh')
    expect(url.searchParams.get('utm_source')).toBe('google')
    expect(url.searchParams.get('utm_medium')).toBe('cpc')
    expect(url.searchParams.get('utm_campaign')).toBe('spring')
    expect(url.searchParams.get('utm_content')).toBe('banner')
  })

  it('produces correct path when redirecting root with UTM params', () => {
    const url = buildI18nRedirectUrl('/', 'utm_source=email', 'en')
    expect(url.pathname).toBe('/en/')
    expect(url.searchParams.get('utm_source')).toBe('email')
  })

  it('produces correct locale-prefixed path on redirect', () => {
    const url = buildI18nRedirectUrl('/deepdive', 'utm_source=fb', 'zh')
    expect(url.pathname).toBe('/zh/deepdive')
    expect(url.searchParams.get('utm_source')).toBe('fb')
  })

  it('works with no UTM params (empty search string)', () => {
    const url = buildI18nRedirectUrl('/', '', 'en')
    expect(url.searchParams.toString()).toBe('')
  })

  it('works with non-UTM query params', () => {
    const url = buildI18nRedirectUrl('/report', 'ref=share&foo=bar', 'en')
    expect(url.searchParams.get('ref')).toBe('share')
    expect(url.searchParams.get('foo')).toBe('bar')
  })
})

// ---------------------------------------------------------------------------
// /quickexplore → /quickdive redirect
// ---------------------------------------------------------------------------

describe('/quickexplore → /quickdive redirect — UTM param preservation', () => {
  it('preserves UTM params when redirecting /quickexplore to /quickdive', () => {
    const search = 'utm_source=google&utm_campaign=summer'
    const url = buildQuickexploreRedirectUrl('en', '', search)
    expect(url.pathname).toBe('/en/quickdive')
    expect(url.searchParams.get('utm_source')).toBe('google')
    expect(url.searchParams.get('utm_campaign')).toBe('summer')
  })

  it('preserves UTM params with sub-path rest segment', () => {
    const search = 'utm_source=email&utm_medium=newsletter'
    const url = buildQuickexploreRedirectUrl('zh', '/results', search)
    expect(url.pathname).toBe('/zh/quickdive/results')
    expect(url.searchParams.get('utm_source')).toBe('email')
    expect(url.searchParams.get('utm_medium')).toBe('newsletter')
  })

  it('works with no query params', () => {
    const url = buildQuickexploreRedirectUrl('en', '', '')
    expect(url.searchParams.toString()).toBe('')
  })
})

// ---------------------------------------------------------------------------
// /questionnaire → /deepdive redirect
// ---------------------------------------------------------------------------

describe('/questionnaire → /deepdive redirect — UTM param preservation', () => {
  it('preserves UTM params when redirecting /questionnaire to /deepdive', () => {
    const search = 'utm_source=twitter&utm_content=ad1'
    const url = buildQuestionnaireRedirectUrl('en', '', search)
    expect(url.pathname).toBe('/en/deepdive')
    expect(url.searchParams.get('utm_source')).toBe('twitter')
    expect(url.searchParams.get('utm_content')).toBe('ad1')
  })

  it('preserves all four UTM params on questionnaire redirect', () => {
    const search = 'utm_source=ig&utm_medium=story&utm_campaign=launch&utm_content=video'
    const url = buildQuestionnaireRedirectUrl('zh', '', search)
    expect(url.searchParams.get('utm_source')).toBe('ig')
    expect(url.searchParams.get('utm_medium')).toBe('story')
    expect(url.searchParams.get('utm_campaign')).toBe('launch')
    expect(url.searchParams.get('utm_content')).toBe('video')
  })

  it('preserves UTM params with sub-path rest segment', () => {
    const search = 'utm_source=linkedin'
    const url = buildQuestionnaireRedirectUrl('en', '/module-a', search)
    expect(url.pathname).toBe('/en/deepdive/module-a')
    expect(url.searchParams.get('utm_source')).toBe('linkedin')
  })

  it('works with no query params', () => {
    const url = buildQuestionnaireRedirectUrl('zh', '', '')
    expect(url.searchParams.toString()).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Regression: new URL() without param copy drops search params
// ---------------------------------------------------------------------------

describe('regression — bare new URL() drops search params', () => {
  it('bare new URL() loses query params (demonstrates the old bug)', () => {
    // This is the OLD broken pattern — kept to document the bug
    const sourceUrl = new URL(`${BASE}/?utm_source=google&utm_campaign=xx`)
    const brokenUrl = new URL(`/en/`, BASE)
    // Without copying params, searchParams is empty
    expect(brokenUrl.searchParams.get('utm_source')).toBeNull()
    // The source had them though
    expect(sourceUrl.searchParams.get('utm_source')).toBe('google')
  })

  it('fixed pattern preserves query params', () => {
    const sourceParams = new URLSearchParams('utm_source=google&utm_campaign=xx')
    const fixedUrl = new URL('/en/', BASE)
    sourceParams.forEach((value, key) => fixedUrl.searchParams.set(key, value))
    expect(fixedUrl.searchParams.get('utm_source')).toBe('google')
    expect(fixedUrl.searchParams.get('utm_campaign')).toBe('xx')
  })
})
