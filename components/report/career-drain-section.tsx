'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Building2, Users, Eye } from 'lucide-react'
import type { CareerDrainWarning, ReportDict } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'
import { getLocalizedField } from '@/lib/i18n/localize'

interface CareerDrainSectionProps {
  drain: CareerDrainWarning
  locale: Locale
  t: ReportDict
  /** When true, renders as a standalone chapter with its own header */
  standalone?: boolean
}

const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function CareerDrainSection({ drain, locale, t, standalone = false }: CareerDrainSectionProps) {
  const [drainCopied, setDrainCopied] = useState(false)

  return (
    <section id="career-drain" className="relative">
      {/* Chapter-level header when standalone */}
      {standalone && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_QUINT }}
          className="text-center mb-10"
        >
          <p
            className="section-label mb-2"
            style={{ color: 'var(--report-micro-label)', opacity: 0.6 }}
          >
            {t.drainChapterLabel}
          </p>
          <h2
            className="text-xl sm:text-2xl font-semibold mb-3"
            style={{ color: 'var(--report-text-primary)' }}
          >
            {t.drainChapterTitle}
          </h2>
          <p
            className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed"
            style={{ color: 'var(--report-text-secondary)' }}
          >
            {t.drainChapterSubtitle}
          </p>
        </motion.div>
      )}

      {/* Ambient amber accent — left gradient line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
        style={{ background: 'linear-gradient(180deg, #f59e0b, #d97706, #b45309)', top: standalone ? '140px' : 0 }}
      />

      <div className="pl-5 sm:pl-7">
        {/* Section header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t.drainSectionTitle}
            </h2>
          </div>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {getLocalizedField(drain, 'framingSummary', locale)}
          </p>
        </div>

        <div className="space-y-8">

        {/* Draining Directions */}
        {drain.drainingDirections?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-red-500/10 flex items-center justify-center text-red-500 text-xs">{'\u2715'}</span>
              {t.drainDirectionsTitle}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {drain.drainingDirections.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-red-200/40 dark:border-red-500/15 bg-red-50/40 dark:bg-red-500/5"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-foreground">
                      {getLocalizedField(item, 'title', locale)}
                    </p>
                    {getLocalizedField(item, 'sourceLabel', locale) && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100/60 dark:bg-red-500/10 text-red-600/70 dark:text-red-400/70 border border-red-200/30 dark:border-red-500/10">
                        {getLocalizedField(item, 'sourceLabel', locale)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {getLocalizedField(item, 'reason', locale)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draining Industries */}
        {drain.drainingIndustries?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-500" />
              {t.drainIndustriesTitle}
            </h3>
            <div className="space-y-3">
              {drain.drainingIndustries.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl border border-amber-200/40 dark:border-amber-500/15 bg-amber-50/40 dark:bg-amber-500/5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">
                        {getLocalizedField(item, 'name', locale)}
                      </p>
                      {getLocalizedField(item, 'sourceLabel', locale) && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100/60 dark:bg-amber-500/10 text-amber-600/70 dark:text-amber-400/70 border border-amber-200/30 dark:border-amber-500/10">
                          {getLocalizedField(item, 'sourceLabel', locale)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {getLocalizedField(item, 'reason', locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draining Management Styles */}
        {drain.drainingManagementStyles?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              {t.drainManagementTitle}
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {drain.drainingManagementStyles.map((item, i) => (
                <div
                  key={i}
                  className="group relative"
                >
                  {/* Style pill */}
                  <div className="px-3 py-1.5 rounded-full text-xs font-medium border border-orange-200/50 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/[0.08] text-orange-700 dark:text-orange-300 cursor-default">
                    {getLocalizedField(item, 'style', locale)}
                  </div>
                </div>
              ))}
            </div>
            {/* Reasons listed below */}
            <div className="space-y-2.5">
              {drain.drainingManagementStyles.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70 shrink-0">
                    {getLocalizedField(item, 'style', locale)}:
                  </span>
                  <span className="leading-relaxed flex-1">
                    {getLocalizedField(item, 'reason', locale)}
                    {getLocalizedField(item, 'sourceLabel', locale) && (
                      <span className="ml-1.5 inline-block text-[10px] px-1 py-px rounded bg-orange-100/50 dark:bg-orange-500/8 text-orange-500/60">
                        {getLocalizedField(item, 'sourceLabel', locale)}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Red Flag Environments */}
        {drain.redFlagEnvironments?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {t.drainRedFlagsTitle}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {t.drainRedFlagsDesc}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {drain.redFlagEnvironments.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border"
                >
                  <span className="text-amber-500 text-sm mt-0.5 shrink-0">{'\u2691'}</span>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {getLocalizedField(item, 'signal', locale)}
                      {getLocalizedField(item, 'sourceLabel', locale) && (
                        <span className="ml-1.5 inline-block text-[10px] px-1 py-px rounded bg-muted text-muted-foreground/50">
                          {getLocalizedField(item, 'sourceLabel', locale)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      </div>{/* close pl-5 wrapper */}

      <div className="mt-8 flex justify-center">
        <button
          onClick={async () => {
            const titles = drain.drainingDirections
              ?.slice(0, 2)
              .map(d => getLocalizedField(d, 'title', locale))
              .filter(Boolean)
              .join(t.drainTitleSeparator || ', ') ?? ''

            const shareText = t.drainShareText.replace('{titles}', titles)

            try {
              if (navigator.share) {
                await navigator.share({ text: shareText })
              } else {
                await navigator.clipboard.writeText(shareText)
                setDrainCopied(true)
                setTimeout(() => setDrainCopied(false), 2000)
              }
            } catch { /* user dismissed */ }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-opacity hover:opacity-75"
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: 'rgba(245, 158, 11, 0.85)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          {drainCopied ? t.copied : t.shareInsight}
        </button>
      </div>
    </section>
  )
}
