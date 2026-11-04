'use client'

const __DEV__ = process.env.NODE_ENV === 'development';

import { useState, useEffect } from 'react'
import { MapPin, ChevronRight } from 'lucide-react'
import { getDictionaryClient } from '@/lib/i18n/get-dictionary-client'
import type { Locale } from '@/lib/i18n/config'
import type { RealConditions } from '@/lib/types'
import { RealConditionsForm } from './real-conditions-form'

interface RealConditionsEntryProps {
  locale: Locale
  sessionId: string
  userId?: string
}

export function RealConditionsEntry({ locale, sessionId, userId }: RealConditionsEntryProps) {
  const t = getDictionaryClient(locale).realityConditions
  const [formOpen, setFormOpen] = useState(false)
  const [existingConditions, setExistingConditions] = useState<RealConditions | null>(null)
  const [hasConditions, setHasConditions] = useState(false)

  useEffect(() => {
    const url = userId
      ? `/api/reality-conditions?userId=${userId}`
      : sessionId
        ? `/api/reality-conditions?sessionId=${sessionId}`
        : null
    if (!url) return
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.conditions) {
          setExistingConditions(data.conditions)
          setHasConditions(true)
        }
      })
      .catch((err) => { if (__DEV__) console.error('[RealConditionsEntry] fetch conditions failed:', err) })
  }, [userId, sessionId])

  return (
    <>
      <button
        type="button"
        onClick={() => setFormOpen(true)}
        className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover-lift card-inset-highlight text-left w-full"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground block">{t.realityConditionsEntry}</span>
          {hasConditions && (
            <span className="text-xs text-muted-foreground">{t.editConditions}</span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </button>

      <RealConditionsForm
        open={formOpen}
        onOpenChange={setFormOpen}
        sessionId={sessionId}
        locale={locale}
        existingConditions={existingConditions}
        onSuccess={() => {
          setHasConditions(true)
          // Refetch conditions to update the entry state
          const refetchUrl = userId
            ? `/api/reality-conditions?userId=${userId}`
            : `/api/reality-conditions?sessionId=${sessionId}`
          fetch(refetchUrl)
            .then((res) => res.json())
            .then((data) => {
              if (data.conditions) setExistingConditions(data.conditions)
            })
            .catch((err) => { if (__DEV__) console.error('[RealConditionsEntry] refetch failed:', err) })
        }}
      />
    </>
  )
}
