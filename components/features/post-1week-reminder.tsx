'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardCheck, ArrowRight, X } from 'lucide-react'
import { csrfFetch } from '@/lib/auth/csrf-client'
import type { Locale } from '@/lib/i18n/config'
import { getDictionaryClient } from '@/lib/i18n/get-dictionary-client'

interface Post1WeekReminderProps {
  locale: Locale
}

export function Post1WeekReminder({ locale }: Post1WeekReminderProps) {
  const [eligible, setEligible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  const t = getDictionaryClient(locale).post1WeekReminder as Record<string, string>

  useEffect(() => {
    // Check if user already dismissed in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('post1week_dismissed')) {
      setLoading(false)
      return
    }

    csrfFetch('/api/pre-post-assessment/eligibility', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setEligible(data.eligible === true)
      })
      .catch(() => {
        // Silently fail
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('post1week_dismissed', '1')
    }
  }

  if (loading || !eligible || dismissed) return null

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-amber-500/8 via-amber-400/5 to-transparent border border-amber-500/20 p-5 sm:p-6 mb-6 animate-fade-in-up overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={t.dismiss}
      >
        <X className="h-4 w-4" />
      </button>
      <div className="relative z-10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <ClipboardCheck className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-1">{t.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{t.subtitle}</p>
          <Link
            href={`/${locale}/post-assessment?type=post_1week`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            {t.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
