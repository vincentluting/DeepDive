'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  labels: string[]
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Mobile: segmented progress bar */}
      <div className="flex items-center gap-1.5 py-3 border-b border-border/30 sm:hidden mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full transition-all duration-300"
            style={{
              background: i < currentStep
                ? 'var(--primary)'
                : i === currentStep - 1
                ? 'color-mix(in srgb, var(--primary) 45%, transparent)'
                : 'color-mix(in srgb, var(--primary) 10%, transparent)',
            }}
          />
        ))}
        <span className="text-[10px] font-mono text-muted-foreground/60 ml-1 flex-shrink-0">
          {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Desktop: circle step indicator */}
      <div className="relative mb-6 hidden sm:block">
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }, (_, i) => {
            const step = i + 1
            const isCompleted = step < currentStep
            const isCurrent = step === currentStep
            return (
              <div key={step} className="flex flex-col items-center relative z-10">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 text-center max-w-[80px] leading-tight',
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {labels[i]}
                </span>
              </div>
            )
          })}
        </div>
        {/* Connecting line */}
        <div className="absolute top-4 left-4 right-4 h-px bg-muted -translate-y-1/2 -z-0" />
        <div
          className="absolute top-4 left-4 h-px bg-primary -translate-y-1/2 -z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      {/* Mobile: current step label */}
      <p className="text-sm text-muted-foreground text-center sm:hidden">
        {labels[currentStep - 1]}
      </p>
    </div>
  )
}
