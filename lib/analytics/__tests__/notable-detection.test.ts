// ============================================================
// Tests for Notable Visitor Scoring Algorithm
// ============================================================

import { describe, it, expect } from 'vitest';
import { scoreVisitor, formatReasons, scoreTier } from '../notable-detection';

// ============================================================
// Helpers
// ============================================================

function makeVisit(overrides: Partial<{
  path: string;
  country: string | null;
  referer: string | null;
  userId: string | null;
  durationMs: number | null;
  utmSource: string | null;
  createdAt: string;
}> = {}) {
  return {
    path: overrides.path ?? '/',
    country: overrides.country ?? null,
    referer: overrides.referer ?? null,
    userId: overrides.userId ?? null,
    durationMs: overrides.durationMs ?? null,
    utmSource: overrides.utmSource ?? null,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

// ============================================================
// scoreVisitor
// ============================================================

describe('scoreVisitor', () => {
  describe('happy path', () => {
    it('returns score 0 for empty visits', () => {
      const result = scoreVisitor([]);
      expect(result.score).toBe(0);
      expect(result.reasons).toEqual([]);
    });

    it('returns score 0 for single page visit (no multi-page)', () => {
      const result = scoreVisitor([makeVisit({ path: '/' })]);
      expect(result.score).toBe(0);
    });

    it('scores multi-page browsing at 2 per unique page (max 10)', () => {
      const visits = [
        makeVisit({ path: '/' }),
        makeVisit({ path: '/about' }),
        makeVisit({ path: '/contact' }),
      ];
      const result = scoreVisitor(visits);
      // 3 unique pages × 2 = 6
      expect(result.score).toBeGreaterThanOrEqual(6);
      expect(result.reasons).toContain('multi_page:3');
    });

    it('caps multi-page score at 10', () => {
      const visits = Array.from({ length: 8 }, (_, i) =>
        makeVisit({ path: `/page-${i}`, createdAt: new Date(Date.now() + i * 10000).toISOString() })
      );
      const result = scoreVisitor(visits);
      // multi_page: min(10, 8*2) = 10
      expect(result.reasons.some(r => r.startsWith('multi_page:'))).toBe(true);
    });
  });

  describe('deep page visits', () => {
    it('scores +5 per deep path type visited', () => {
      const visits = [
        makeVisit({ path: '/en/questionnaire' }),
        makeVisit({ path: '/en/explore' }),
      ];
      const result = scoreVisitor(visits);
      // multi_page: 2*2=4, deep_pages: 2*5=10
      expect(result.score).toBe(14);
      expect(result.reasons).toContain('deep_pages:/questionnaire,/explore');
    });

    it('counts each deep path type only once', () => {
      const visits = [
        makeVisit({ path: '/en/questionnaire/step1' }),
        makeVisit({ path: '/en/questionnaire/step2' }),
        makeVisit({ path: '/en/report' }),
      ];
      const result = scoreVisitor(visits);
      // 3 unique paths → multi_page: 6
      // 2 deep types (questionnaire + report) → deep_pages: 10
      expect(result.score).toBe(16);
    });
  });

  describe('registration behavior', () => {
    it('scores +15 for registered visitor on /register', () => {
      const visits = [
        makeVisit({ path: '/' }),
        makeVisit({ path: '/register', userId: 'u-1' }),
      ];
      const result = scoreVisitor(visits);
      expect(result.reasons).toContain('registered');
      // multi_page: 4 + registered: 15 = 19
      expect(result.score).toBeGreaterThanOrEqual(19);
    });

    it('scores +5 for register intent without userId', () => {
      const visits = [
        makeVisit({ path: '/' }),
        makeVisit({ path: '/register' }),
      ];
      const result = scoreVisitor(visits);
      expect(result.reasons).toContain('register_intent');
    });

    it('prefers registered over register_intent', () => {
      const visits = [
        makeVisit({ path: '/register' }),
        makeVisit({ path: '/register', userId: 'u-1' }),
      ];
      const result = scoreVisitor(visits);
      expect(result.reasons).toContain('registered');
      expect(result.reasons).not.toContain('register_intent');
    });
  });

  describe('dwell time', () => {
    it('scores +5 for long dwell (>60s)', () => {
      const visits = [makeVisit({ durationMs: 90_000 })];
      const result = scoreVisitor(visits);
      expect(result.reasons).toContain('long_dwell');
    });

    it('scores +3 for medium dwell (>10s)', () => {
      const visits = [makeVisit({ durationMs: 15_000 })];
      const result = scoreVisitor(visits);
      expect(result.reasons).toContain('dwell');
    });

    it('does not score dwell for short visits', () => {
      const visits = [makeVisit({ durationMs: 5_000 })];
      const result = scoreVisitor(visits);
      expect(result.reasons).not.toContain('dwell');
      expect(result.reasons).not.toContain('long_dwell');
    });
  });

  describe('country detection', () => {
    it('scores +3 for non-NL country', () => {
      const visits = [makeVisit({ country: 'US' })];
      const result = scoreVisitor(visits);
      expect(result.reasons.some(r => r.startsWith('non_nl:'))).toBe(true);
    });

    it('does not score for NL-only traffic', () => {
      const visits = [makeVisit({ country: 'NL' })];
      const result = scoreVisitor(visits);
      expect(result.reasons.some(r => r.startsWith('non_nl:'))).toBe(false);
    });

    it('scores non-NL when mixed countries include NL', () => {
      const visits = [
        makeVisit({ country: 'NL' }),
        makeVisit({ country: 'DE' }),
      ];
      const result = scoreVisitor(visits);
      expect(result.reasons.some(r => r.startsWith('non_nl:'))).toBe(true);
    });
  });

  describe('referral & UTM', () => {
    it('scores +5 for external referral', () => {
      const visits = [makeVisit({ referer: 'https://google.com/search?q=career' })];
      const result = scoreVisitor(visits);
      expect(result.reasons).toContain('external_referral');
    });

    it('does not score self-domain referral as external', () => {
      const visits = [makeVisit({ referer: 'https://deepdivecareer.com/about' })];
      const result = scoreVisitor(visits);
      expect(result.reasons).not.toContain('external_referral');
    });

    it('scores +5 for UTM source', () => {
      const visits = [makeVisit({ utmSource: 'linkedin' })];
      const result = scoreVisitor(visits);
      expect(result.reasons).toContain('utm_source');
    });
  });

  describe('bulk request exclusion', () => {
    it('returns score 0 for >5 pages within 2 seconds', () => {
      const now = Date.now();
      const visits = Array.from({ length: 6 }, (_, i) =>
        makeVisit({ path: `/p${i}`, createdAt: new Date(now + i * 100).toISOString() })
      );
      const result = scoreVisitor(visits);
      expect(result.score).toBe(0);
      expect(result.reasons).toEqual(['bulk_request_excluded']);
    });

    it('does not exclude 5 or fewer rapid pages', () => {
      const now = Date.now();
      const visits = Array.from({ length: 5 }, (_, i) =>
        makeVisit({ path: `/p${i}`, createdAt: new Date(now + i * 100).toISOString() })
      );
      const result = scoreVisitor(visits);
      expect(result.reasons).not.toContain('bulk_request_excluded');
      expect(result.score).toBeGreaterThan(0);
    });

    it('does not exclude >5 pages spread over more than 2 seconds', () => {
      const now = Date.now();
      const visits = Array.from({ length: 6 }, (_, i) =>
        makeVisit({ path: `/p${i}`, createdAt: new Date(now + i * 5000).toISOString() })
      );
      const result = scoreVisitor(visits);
      expect(result.reasons).not.toContain('bulk_request_excluded');
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('composite scoring', () => {
    it('accumulates score from multiple signals', () => {
      const visits = [
        makeVisit({ path: '/', country: 'CN', durationMs: 65_000 }),
        makeVisit({ path: '/en/questionnaire', referer: 'https://linkedin.com/post/123', utmSource: 'linkedin' }),
        makeVisit({ path: '/register', userId: 'u-1', createdAt: new Date(Date.now() + 60000).toISOString() }),
      ];
      const result = scoreVisitor(visits);
      // multi_page: 3*2=6, deep_pages: 5, registered: 15, long_dwell: 5, non_nl: 3, external: 5, utm: 5 = 44
      expect(result.score).toBeGreaterThanOrEqual(40);
    });
  });
});

// ============================================================
// formatReasons
// ============================================================

describe('formatReasons', () => {
  it('formats multi_page in English', () => {
    expect(formatReasons(['multi_page:5'], 'en')).toContain('Viewed 5 pages');
  });

  it('formats multi_page in Chinese', () => {
    expect(formatReasons(['multi_page:5'], 'zh')).toContain('浏览了 5 个页面');
  });

  it('formats registered in English', () => {
    expect(formatReasons(['registered'], 'en')).toBe('Registered');
  });

  it('formats registered in Chinese', () => {
    expect(formatReasons(['registered'], 'zh')).toBe('已注册账号');
  });

  it('formats deep_pages with path labels', () => {
    expect(formatReasons(['deep_pages:/questionnaire,/report'], 'en'))
      .toContain('Visited questionnaire/report');
  });

  it('formats long_dwell', () => {
    expect(formatReasons(['long_dwell'], 'en')).toContain('Stayed >1 min');
    expect(formatReasons(['long_dwell'], 'zh')).toContain('停留超过1分钟');
  });

  it('formats dwell', () => {
    expect(formatReasons(['dwell'], 'en')).toContain('Dwell time noted');
    expect(formatReasons(['dwell'], 'zh')).toContain('有明显停留');
  });

  it('formats non_nl with country', () => {
    expect(formatReasons(['non_nl:US'], 'en')).toContain('From US');
    expect(formatReasons(['non_nl:CN'], 'zh')).toContain('来自 CN');
  });

  it('formats external_referral', () => {
    expect(formatReasons(['external_referral'], 'en')).toContain('External referral');
  });

  it('formats utm_source', () => {
    expect(formatReasons(['utm_source'], 'en')).toContain('Has UTM source');
  });

  it('joins multiple reasons with separator', () => {
    const result = formatReasons(['registered', 'long_dwell'], 'en');
    expect(result).toContain('·');
  });

  it('returns empty string for empty reasons', () => {
    expect(formatReasons([], 'en')).toBe('');
  });

  it('defaults to English locale', () => {
    expect(formatReasons(['registered'])).toBe('Registered');
  });
});

// ============================================================
// scoreTier
// ============================================================

describe('scoreTier', () => {
  it('returns high for score >= 20', () => {
    expect(scoreTier(20)).toBe('high');
    expect(scoreTier(100)).toBe('high');
  });

  it('returns medium for score >= 12 and < 20', () => {
    expect(scoreTier(12)).toBe('medium');
    expect(scoreTier(19)).toBe('medium');
  });

  it('returns low for score < 12', () => {
    expect(scoreTier(0)).toBe('low');
    expect(scoreTier(8)).toBe('low');
    expect(scoreTier(11)).toBe('low');
  });
});
