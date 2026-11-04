"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Lock, FlaskConical, ArrowRight } from "lucide-react"
import type { CohortJourneyStep } from "@/lib/cohort/types"
import type { Dictionary } from "@/lib/i18n/get-dictionary"

interface CohortJourneyPanelProps {
  locale: string
  dict: Dictionary
  completedSteps: CohortJourneyStep[]
  currentStep: CohortJourneyStep | null
  steps: CohortJourneyStep[]
  progressPercent: number
  isComplete: boolean
}

/** Map journey steps to their target URLs */
function getStepHref(step: CohortJourneyStep, locale: string): string {
  switch (step) {
    case 'pre_assessment':
      return `/${locale}/post-assessment?type=pre`
    case 'quick_dive':
      return `/${locale}/explore`
    case 'deep_dive':
      return `/${locale}/deepdive`
    case 'coaching':
      return `/${locale}/coaching`
    case 'post_immediate':
      return `/${locale}/post-assessment?type=post_immediate`
    case 'post_1week':
      return `/${locale}/post-assessment?type=post_1week`
  }
}

export function CohortJourneyPanel({
  locale,
  dict,
  completedSteps,
  currentStep,
  steps,
  progressPercent,
  isComplete,
}: CohortJourneyPanelProps) {
  const t = dict.cohort
  if (!t) return null

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">{t.journeyTitle}</h3>
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            {t.progressLabel.replace('{percent}', String(progressPercent))}
          </Badge>
        </div>

        {isComplete ? (
          <p className="text-sm text-muted-foreground">{t.allComplete}</p>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">{t.journeySubtitle}</p>
        )}

        {/* Step list */}
        <div className="space-y-2.5">
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step)
            const isCurrent = step === currentStep
            const stepLabel = t.steps[step]

            if (isCompleted) {
              return (
                <div key={step} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-green-500/5">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm text-muted-foreground line-through">{stepLabel}</span>
                  <span className="ml-auto text-xs text-green-600/80 font-medium">{t.status.completed}</span>
                </div>
              )
            }

            if (isCurrent) {
              return (
                <Link
                  key={step}
                  href={getStepHref(step, locale)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
                >
                  <Circle className="h-5 w-5 text-primary animate-pulse shrink-0" />
                  <span className="text-sm font-medium text-foreground">{stepLabel}</span>
                  <span className="ml-auto flex items-center gap-1 text-xs font-medium text-primary">
                    {t.status.current}
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              )
            }

            // Locked
            return (
              <div key={step} className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50">
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">{stepLabel}</span>
                <span className="ml-auto text-xs text-muted-foreground">{t.status.locked}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
