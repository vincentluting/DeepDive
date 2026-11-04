'use client'

import type { Locale } from "@/lib/i18n/config";
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Search,
  ChevronDown,
  Clock,
  MapPin,
  DollarSign,
  Shield,
  Zap,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GapAnalysis } from '@/lib/types'
import { getLocalizedField } from '@/lib/i18n/localize'

interface GapAnalysisDrawerProps {
  gapAnalysis: GapAnalysis
  locale: Locale
  t: Record<string, string>
}

export function GapAnalysisDrawer({ gapAnalysis, locale, t }: GapAnalysisDrawerProps) {
  const [open, setOpen] = useState(false)

  const readinessLabel = getLocalizedField(gapAnalysis, 'readinessLabel', locale)
  const timelineText = getLocalizedField(gapAnalysis, 'timelineToCompetitive', locale)
  const topAction = getLocalizedField(gapAnalysis, 'topPriorityAction', locale)
  const conditionsNote = getLocalizedField(gapAnalysis.conditionsAlignment, 'note', locale)

  // Readiness ring color
  const ringColor = gapAnalysis.readinessScore >= 70
    ? 'text-emerald-500'
    : gapAnalysis.readinessScore >= 40
      ? 'text-amber-500'
      : 'text-rose-500'

  const ringBg = gapAnalysis.readinessScore >= 70
    ? 'bg-emerald-500/10'
    : gapAnalysis.readinessScore >= 40
      ? 'bg-amber-500/10'
      : 'bg-rose-500/10'

  // Sort skill gaps: low difficulty first (quick wins)
  const sortedSkillGaps = [...gapAnalysis.skillGaps].sort((a, b) => {
    const order = { low: 0, medium: 1, high: 2 }
    return order[a.difficulty] - order[b.difficulty]
  })

  // Conditions alignment helpers
  const alignmentDot = (status: string) => {
    if (status === 'favorable' || status === 'strong' || status === 'within_range') return 'bg-emerald-500'
    if (status === 'neutral' || status === 'partial' || status === 'stretch') return 'bg-amber-500'
    if (status === 'challenging' || status === 'mismatch') return 'bg-rose-500'
    return 'bg-muted-foreground/40'
  }

  const alignmentLabel = (status: string) => {
    const labelMap: Record<string, string> = {
      favorable: t.alignmentFavorable,
      neutral: t.alignmentNeutral,
      challenging: t.alignmentChallenging,
      strong: t.alignmentStrong,
      partial: t.alignmentPartial,
      mismatch: t.alignmentMismatch,
      within_range: t.alignmentWithinRange,
      stretch: t.alignmentStretch,
      overqualified: t.alignmentOverqualified,
      unknown: t.alignmentUnknown,
    }
    return labelMap[status] || status
  }

  const difficultyBadge = (difficulty: 'low' | 'medium' | 'high') => {
    if (difficulty === 'low') return { className: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400', label: t.difficultyLow }
    if (difficulty === 'medium') return { className: 'border-amber-500/30 text-amber-600 dark:text-amber-400', label: t.difficultyMedium }
    return { className: 'border-rose-500/30 text-rose-600 dark:text-rose-400', label: t.difficultyHigh }
  }

  return (
    <div className="mt-4">
      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-center gap-2 text-xs h-9"
        onClick={() => setOpen(!open)}
      >
        <Search className="h-3.5 w-3.5" />
        {t.viewGapAnalysis}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')} />
      </Button>

      {/* Expandable content */}
      {open && (
        <div className="mt-4 space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">

          {/* 1. Readiness Ring */}
          <div className="flex flex-col items-center py-4">
            <div className={cn('relative w-24 h-24 rounded-full flex items-center justify-center', ringBg)}>
              {/* SVG ring */}
              <svg className="absolute inset-0 w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted/30"
                />
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={ringColor}
                  strokeDasharray={`${(gapAnalysis.readinessScore / 100) * 251.3} 251.3`}
                />
              </svg>
              <span className={cn('text-2xl font-bold', ringColor)}>
                {gapAnalysis.readinessScore}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{readinessLabel}</p>
            <p className="text-xs text-muted-foreground">
              {t.roleReadiness}
            </p>
          </div>

          {/* 2. Skill Gaps */}
          {sortedSkillGaps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">
                {t.skillGaps}
              </p>
              {sortedSkillGaps.map((gap, i) => (
                <SkillGapRow key={i} gap={gap} locale={locale} difficultyBadge={difficultyBadge} t={t} />
              ))}
            </div>
          )}

          {/* 3. Experience Gaps */}
          {gapAnalysis.experienceGaps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">
                {t.experienceGaps}
              </p>
              {gapAnalysis.experienceGaps.map((gap, i) => (
                <Card key={i} className="border-blue-500/15 bg-blue-500/5">
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {getLocalizedField(gap, 'gap', locale)}
                    </p>
                    <div className="flex items-start gap-1.5 mt-1.5">
                      <Lightbulb className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {getLocalizedField(gap, 'workaround', locale)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 4. Conditions Alignment */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">
              {t.conditionsAlignment}
            </p>
            <Card className="border-muted">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {t.visa}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn('w-2 h-2 rounded-full', alignmentDot(gapAnalysis.conditionsAlignment.visaCompatibility))} />
                    <span className="text-xs text-muted-foreground">
                      {alignmentLabel(gapAnalysis.conditionsAlignment.visaCompatibility)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {t.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn('w-2 h-2 rounded-full', alignmentDot(gapAnalysis.conditionsAlignment.locationMatch))} />
                    <span className="text-xs text-muted-foreground">
                      {alignmentLabel(gapAnalysis.conditionsAlignment.locationMatch)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {t.salary}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn('w-2 h-2 rounded-full', alignmentDot(gapAnalysis.conditionsAlignment.salaryExpectationMatch))} />
                    <span className="text-xs text-muted-foreground">
                      {alignmentLabel(gapAnalysis.conditionsAlignment.salaryExpectationMatch)}
                    </span>
                  </div>
                </div>
                {conditionsNote && (
                  <p className="text-xs text-muted-foreground/85 leading-relaxed pt-1 border-t border-muted/50">
                    {conditionsNote}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 5. Timeline + Top Priority */}
          <Card className="border-primary/15 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              {/* Timeline */}
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-primary mb-0.5">
                    {t.estimatedTimeline}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {timelineText}
                  </p>
                </div>
              </div>

              {/* Top priority action */}
              <div className="flex items-start gap-2 pt-2 border-t border-primary/10">
                <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-primary mb-0.5">
                    {t.priorityThisWeek}
                  </p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {topAction}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── Skill Gap Row (expandable) ─────────────────────────────

function SkillGapRow({
  gap,
  locale,
  difficultyBadge,
  t,
}: {
  gap: GapAnalysis['skillGaps'][number]
  locale: Locale
  difficultyBadge: (d: 'low' | 'medium' | 'high') => { className: string; label: string }
  t: Record<string, string>
}) {
  const [expanded, setExpanded] = useState(false)
  const badge = difficultyBadge(gap.difficulty)

  return (
    <Card className="border-muted">
      <CardContent className="p-3">
        <button
          className="w-full text-left flex items-center justify-between gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {getLocalizedField(gap, 'skill', locale)}
            </span>
            <Badge variant="outline" className={cn('text-[10px] shrink-0', badge.className)}>
              {badge.label}
            </Badge>
          </div>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform', expanded && 'rotate-180')} />
        </button>

        {expanded && (
          <div className="mt-2.5 space-y-2 animate-in fade-in-0 duration-200">
            {/* Current → Required */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground/70 mb-0.5">{t.currentLevel}</p>
                <p className="text-muted-foreground">{getLocalizedField(gap, 'currentLevel', locale)}</p>
              </div>
              <div>
                <p className="text-muted-foreground/70 mb-0.5">{t.requiredLevel}</p>
                <p className="text-muted-foreground">{getLocalizedField(gap, 'requiredLevel', locale)}</p>
              </div>
            </div>

            {/* Bridge action */}
            <div className="rounded-md bg-primary/8 px-3 py-2">
              <p className="text-xs text-foreground leading-relaxed">
                {getLocalizedField(gap, 'bridgeAction', locale)}
              </p>
            </div>

            {/* Time + difficulty */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {gap.timeToClose}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
