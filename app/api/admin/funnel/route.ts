// ============================================================
// GET /api/admin/funnel — Funnel analytics for admin panel
// Returns funnel stats, conversion rates, step timing, and filter options.
//
// Query params:
//   days       — time window (1-365, default 30)
//   language   — filter by questionnaire language (en|zh)
//   country    — filter by registration country code
//   device     — filter by device type (mobile|desktop)
//   exploreMode — filter by Quick Dive explore mode
//   researchGroup — filter by research group (classic|immersive|non-research)
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import {
  getFunnelStats,
  getFilteredConversionRates,
  getFunnelStepTiming,
  getFunnelFilterOptions,
  type FunnelFilters,
} from '@/lib/analytics/funnel-queries';
import { getNPSAverage } from '@/lib/db/nps';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';

export const GET = withLogging('/api/admin/funnel', async (request: NextRequest) => {
  const guard = await guardRoute(request, { tier: 'admin' });
  if (guard.blocked) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10)));

    const filters: FunnelFilters = {
      language: searchParams.get('language') || null,
      country: searchParams.get('country') || null,
      device: searchParams.get('device') || null,
      exploreMode: searchParams.get('exploreMode') || null,
      researchGroup: searchParams.get('researchGroup') || null,
    };

    const [stats, conversions, npsAverage, stepTiming, filterOptions] = await Promise.all([
      getFunnelStats(days),
      getFilteredConversionRates(days, filters),
      getNPSAverage(),
      getFunnelStepTiming(days),
      getFunnelFilterOptions(days),
    ]);

    return NextResponse.json({
      stats,
      conversions,
      nps: npsAverage,
      days,
      stepTiming,
      filterOptions,
    }, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error) {
    logApiError('/api/admin/funnel', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to fetch funnel data',
      cause: error,
    });
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Internal server error', 500);
  }
});
