// ============================================================
// GET /api/admin/llm-usage — LLM usage statistics for admin panel
//
// Query params:
//   days — time window (1-90, default 7)
// ============================================================

import { type NextRequest, NextResponse } from 'next/server'
import { guardRoute } from '@/lib/api/api-guard'
import { getLLMUsageSummary, getLLMCostPerUser, getLLMUsageByModel } from '@/lib/db/llm-usage'
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors'
import { withLogging } from '@/lib/api/with-logging'

export const GET = withLogging('/api/admin/llm-usage', async (request: NextRequest) => {
  const guard = await guardRoute(request, { tier: 'admin' })
  if (guard.blocked) return guard.response

  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') || '7', 10)))
    const envParam = searchParams.get('environment') // 'test' | 'production' | null (all)
    const environment = envParam === 'test' || envParam === 'production' ? envParam : undefined

    const [summary, costPerUser, byModel] = await Promise.all([
      getLLMUsageSummary(days, environment),
      getLLMCostPerUser(days, environment),
      getLLMUsageByModel(days, environment),
    ])

    const totalEstimatedCost = costPerUser.reduce((s, u) => s + u.estimatedCostUsd, 0)

    return NextResponse.json({ ...summary, costPerUser, byModel, totalEstimatedCost, days }, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    })
  } catch (error) {
    logApiError('/api/admin/llm-usage', ApiErrorCode.INTERNAL_ERROR, {
      message: 'Failed to fetch LLM usage data',
      cause: error,
    })
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR, 'Internal server error', 500)
  }
})
