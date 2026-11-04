// ============================================================
// GET /api/admin/insights — Cross-analysis data for Insights Tab
//
// Query params:
//   ?section=all        → Batch: returns all sections in one response
//   ?section=kpi        → Weekly KPIs with week-over-week delta
//   ?section=loss       → Funnel loss spotlight per step
//   ?section=super      → Super user identification + profile
//   ?section=ab         → A/B test full funnel with chi-square
//   ?section=retention  → Cohort retention matrix
//   ?section=utm        → UTM channel attribution (first-touch)
//   ?section=bottleneck → Funnel bottleneck diagnosis with risk ratio
//   ?section=ab-trend   → A/B weekly trend line with inflection detection
//   ?section=prepost-effect → Pre/Post effect summary (Cohen's d)
//   ?days=30            → Lookback window (default: 30)
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { withLogging } from '@/lib/api/with-logging';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import {
  getWeeklyKPIs,
  getFunnelLossSpotlight,
  getSuperUsers,
  getABTestFullFunnel,
  getCohortRetentionForInsights,
  getUTMAttribution,
  getFunnelBottleneckDiagnosis,
  getABTrendAnalysis,
  getPrePostEffectSummary,
} from '@/lib/db/admin-insights-cross';

const VALID_SECTIONS = ['kpi', 'loss', 'super', 'ab', 'retention', 'utm', 'bottleneck', 'ab-trend', 'prepost-effect'] as const;
type Section = (typeof VALID_SECTIONS)[number];

// ── Fetch a single section ──────────────────────────────────
async function fetchSection(section: Section, days: number): Promise<unknown> {
  switch (section) {
    case 'kpi': return getWeeklyKPIs();
    case 'loss': return getFunnelLossSpotlight(days);
    case 'super': return getSuperUsers();
    case 'ab': return getABTestFullFunnel(days);
    case 'retention': return getCohortRetentionForInsights();
    case 'utm': return getUTMAttribution(days);
    case 'bottleneck': return getFunnelBottleneckDiagnosis(days);
    case 'ab-trend': return getABTrendAnalysis(days);
    case 'prepost-effect': return getPrePostEffectSummary();
  }
}

export const GET = withLogging('/api/admin/insights', async (request: NextRequest) => {
  const guard = await guardRoute(request, { tier: 'admin' });
  if (guard.blocked) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') as Section | 'all' | null;
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10) || 30, 1), 365);

    // ── Batch mode: fetch all sections in parallel ──────────
    if (section === 'all') {
      const results = await Promise.allSettled(
        VALID_SECTIONS.map(async (s) => ({ key: s, data: await fetchSection(s, days) }))
      );

      const batch: Record<string, unknown> = {};
      for (const result of results) {
        if (result.status === 'fulfilled') {
          batch[result.value.key] = result.value.data;
        }
        // Silently skip failed sections — partial data is better than total failure
      }

      return NextResponse.json({ section: 'all', data: batch });
    }

    // ── Single section mode (backwards compatible) ──────────
    if (!section || !VALID_SECTIONS.includes(section as Section)) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        `Invalid section. Must be one of: all, ${VALID_SECTIONS.join(', ')}`,
        400,
      );
    }

    const data = await fetchSection(section as Section, days);
    return NextResponse.json({ section, data });
  } catch (error) {
    logApiError('/api/admin/insights', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to load insights data',
      cause: error,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Failed to load insights data',
      500,
    );
  }
});
