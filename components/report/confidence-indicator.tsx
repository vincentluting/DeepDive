'use client'

import { AlertTriangle } from 'lucide-react'
import { getDictionaryClient, interpolate } from '@/lib/i18n/get-dictionary-client'
import type { Locale } from '@/lib/i18n/config'

interface ConfidenceIndicatorProps {
  confidence: number
  locale: Locale
  /** Compact mode for inline display (no CTA bar) */
  compact?: boolean
  /** Dark mode for profile page (white-on-dark) */
  variant?: 'light' | 'dark'
}

const LOW_CONFIDENCE_THRESHOLD = 0.6

function getConfidenceLevel(
  value: number,
  locale: Locale,
): { label: string; color: string; bgColor: string; barColor: string } {
  const t = getDictionaryClient(locale).confidenceIndicator
  if (value >= 0.7) {
    return {
      label: t.high,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      barColor: 'bg-emerald-500',
    }
  }
  if (value >= 0.5) {
    return {
      label: t.moderate,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-500/10',
      barColor: 'bg-cyan-500',
    }
  }
  if (value >= 0.4) {
    return {
      label: t.low,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
      barColor: 'bg-amber-500',
    }
  }
  return {
    label: t.exploratory,
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-500/10',
    barColor: 'bg-slate-400',
  }
}

export function ConfidenceIndicator({
  confidence,
  locale,
  compact = false,
  variant = 'light',
}: ConfidenceIndicatorProps) {
  const t = getDictionaryClient(locale).confidenceIndicator
  const level = getConfidenceLevel(confidence, locale)
  const isLow = confidence < LOW_CONFIDENCE_THRESHOLD
  const pct = Math.round(confidence * 100)
  const isDark = variant === 'dark'

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className={`h-1.5 w-12 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-muted'}`}>
          <div
            className={`h-full rounded-full ${level.barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className={`text-[10px] font-mono ${isDark ? 'text-white/60' : 'text-muted-foreground'}`}>
          {pct}%
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {/* Confidence bar */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs ${level.color}`}>{level.label}</span>
        <span className={`text-xs font-mono ${isDark ? 'text-white/60' : 'text-muted-foreground'}`}>
          {pct}%
        </span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-muted'}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${level.barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Low confidence warning + CTA */}
      {isLow && (
        <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t.limitedData}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Standalone low-confidence warning bar for inline display in profile modules.
 * Shows only when confidence < 60% threshold.
 * Used in dark-themed profile page context.
 */
interface LowConfidenceWarningProps {
  confidence: number
  locale: Locale
  dimensionLabel?: string
}

export function LowConfidenceWarning({ confidence, locale, dimensionLabel }: LowConfidenceWarningProps) {
  if (confidence >= LOW_CONFIDENCE_THRESHOLD) return null

  const t = getDictionaryClient(locale).confidenceIndicator

  const message = dimensionLabel
    ? interpolate(t.limitedDataFor, { dimension: dimensionLabel })
    : t.limitedData

  return (
    <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-amber-300">
          {message}
        </p>
      </div>
    </div>
  )
}
