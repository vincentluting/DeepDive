'use client'

import type { Locale } from "@/lib/i18n/config";
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResilienceBadgeProps {
  level: number  // 1-3 (Level 0 is pre-filtered out by engine)
  locale: Locale
  variant?: 'compact' | 'default'
}

const LEVEL_CONFIG: Record<number, {
  icon: typeof Shield
  colorClass: string
  bgClass: string
  label_en: string
  label_zh: string
}> = {
  1: {
    icon: ShieldAlert,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/8 border-amber-500/20',
    label_en: 'Vulnerable',
    label_zh: '易受冲击',
  },
  2: {
    icon: Shield,
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-500/8 border-sky-500/20',
    label_en: 'Resilient',
    label_zh: '韧性良好',
  },
  3: {
    icon: ShieldCheck,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/8 border-emerald-500/20',
    label_en: 'Highly Resilient',
    label_zh: '高度韧性',
  },
}

export function ResilienceBadge({ level, locale, variant = 'default' }: ResilienceBadgeProps) {
  const config = LEVEL_CONFIG[level]
  if (!config) return null

  const Icon = config.icon
  const label = locale === 'zh' ? config.label_zh : config.label_en

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        config.bgClass,
        config.colorClass,
        variant === 'compact' && 'px-1.5',
      )}
      aria-label={label}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {variant !== 'compact' && <span>{label}</span>}
    </span>
  )
}
