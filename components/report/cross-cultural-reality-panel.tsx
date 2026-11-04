'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, ChevronDown, ChevronUp } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
// barrier text now comes from t (reportPanels dict)

interface CrossCulturalRealityPanelProps {
  crossCulturalFit: string[]
  barrierLevel: 'low' | 'medium' | 'high'
  locale: Locale
  directionTitle: string
  t: Record<string, string>
}

const BARRIER_CONFIG = {
  high: {
    titleKey: 'barrierHighTitle',
    badgeKey: 'barrierHighBadge',
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-500/5',
    badgeClass: 'border-orange-500/50 text-orange-700 dark:text-orange-400',
  },
  medium: {
    titleKey: 'barrierMediumTitle',
    badgeKey: 'barrierMediumBadge',
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-500/5',
    badgeClass: 'border-amber-500/50 text-amber-700 dark:text-amber-400',
  },
  low: {
    titleKey: 'barrierLowTitle',
    badgeKey: 'barrierLowBadge',
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-500/5',
    badgeClass: 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400',
  },
} as const

function getRootRequirements(t: Record<string, string>): string[] {
  return [
    t.crossCulturalRootReq1,
    t.crossCulturalRootReq2,
    t.crossCulturalRootReq3,
    t.crossCulturalRootReq4,
  ]
}

function getRootPathways(t: Record<string, string>): string[] {
  return [
    t.crossCulturalRootPathway1,
    t.crossCulturalRootPathway2,
    t.crossCulturalRootPathway3,
    t.crossCulturalRootPathway4,
  ]
}

function getBridgeInsights(t: Record<string, string>): string[] {
  return [
    t.crossCulturalBridgeInsight1,
    t.crossCulturalBridgeInsight2,
  ]
}

function getGlobalInsights(t: Record<string, string>): string[] {
  return [
    t.crossCulturalGlobalInsight1,
    t.crossCulturalGlobalInsight2,
  ]
}

export function CrossCulturalRealityPanel({
  crossCulturalFit,
  barrierLevel,
  locale: _locale,
  t,
}: CrossCulturalRealityPanelProps) {
  const defaultExpanded = barrierLevel !== 'low'
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const config = BARRIER_CONFIG[barrierLevel]
  const title = t[config.titleKey]
  const badgeText = t[config.badgeKey]

  const hasRoot = crossCulturalFit.includes('root')
  const hasBridge = crossCulturalFit.includes('bridge')
  const hasGlobal = crossCulturalFit.includes('global')

  const closingNote = t.crossCulturalClosingNote

  return (
    <Card className={`border-l-4 ${config.borderColor} ${config.bgColor}`}>
      <CardContent className="p-4">
        {/* Header — always visible, clickable to toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-muted-foreground">
              {t.crossCulturalReality}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Expandable content */}
        {isExpanded && (
          <div className="mt-3 space-y-3 animate-in fade-in-0 duration-300">
            {/* Badge */}
            <Badge variant="outline" className={config.badgeClass}>
              {badgeText}
            </Badge>

            {/* Title */}
            <p className="text-sm font-medium">{title}</p>

            {/* Root: local requirements */}
            {hasRoot && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {t.directionRequires}
                </p>
                <ul className="space-y-1 pl-1">
                  {getRootRequirements(t).map((item) => (
                    <li
                      key={item}
                      className="text-sm text-muted-foreground leading-relaxed flex items-start gap-1.5"
                    >
                      <span className="text-muted-foreground/60 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Root high barrier: common pathways */}
            {hasRoot && barrierLevel === 'high' && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {t.commonPathways}
                </p>
                <ul className="space-y-1 pl-1">
                  {getRootPathways(t).map((item) => (
                    <li
                      key={item}
                      className="text-sm text-muted-foreground leading-relaxed flex items-start gap-1.5"
                    >
                      <span className="text-muted-foreground/60 shrink-0">&rarr;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bridge insights */}
            {hasBridge && (
              <div className="space-y-1">
                {getBridgeInsights(t).map((item) => (
                  <p
                    key={item}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    {item}
                  </p>
                ))}
              </div>
            )}

            {/* Global insights */}
            {hasGlobal && (
              <div className="space-y-1">
                {getGlobalInsights(t).map((item) => (
                  <p
                    key={item}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    {item}
                  </p>
                ))}
              </div>
            )}

            {/* Closing note */}
            <p className="text-xs text-muted-foreground/70 pt-1 flex items-start gap-1.5">
              <span className="shrink-0">💡</span>
              {closingNote}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
