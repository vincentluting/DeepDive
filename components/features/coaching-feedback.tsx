'use client'

import { useState } from 'react'
import { csrfFetch } from '@/lib/auth/csrf-client'
import { getDictionaryClient } from '@/lib/i18n/get-dictionary-client'
import type { Locale } from '@/lib/i18n/config'
import { reportClientError } from '@/lib/observability/client-error'
import type { CoachingFeedbackReason } from '@/lib/db/coaching-feedback'

type Rating = 'okay' | 'helpful' | 'very_helpful'
type FeedbackTag =
  | 'too_superficial'
  | 'disjointed'
  | 'too_fast_advice'
  | 'missed_emotion'
  | 'did_not_use_report'

interface CoachingFeedbackProps {
  sessionId: string
  locale: Locale
  onDismiss?: () => void
}

const RATING_OPTIONS: { value: Rating; emoji: string; labelKey: string }[] = [
  { value: 'okay',         emoji: '😐', labelKey: 'ratingOkay' },
  { value: 'helpful',      emoji: '👍', labelKey: 'ratingHelpful' },
  { value: 'very_helpful', emoji: '🤩', labelKey: 'ratingVeryHelpful' },
]

const TAG_OPTIONS: { value: FeedbackTag; labelKey: string }[] = [
  { value: 'too_superficial', labelKey: 'tagTooSuperficial' },
  { value: 'disjointed', labelKey: 'tagDisjointed' },
  { value: 'too_fast_advice', labelKey: 'tagTooFastAdvice' },
  { value: 'missed_emotion', labelKey: 'tagMissedEmotion' },
  { value: 'did_not_use_report', labelKey: 'tagDidNotUseReport' },
]

const REASON_OPTIONS: Array<{
  value: CoachingFeedbackReason
  labelKey: string
}> = [
  { value: 'understood_me', labelKey: 'reasonUnderstoodMe' },
  { value: 'missed_my_point', labelKey: 'reasonMissedMyPoint' },
  { value: 'unclear', labelKey: 'reasonUnclear' },
  { value: 'too_many_questions', labelKey: 'reasonTooManyQuestions' },
  { value: 'too_generic', labelKey: 'reasonTooGeneric' },
  { value: 'not_practical', labelKey: 'reasonNotPractical' },
  { value: 'avoided_recommendation', labelKey: 'reasonAvoidedRecommendation' },
  { value: 'helpful_next_step', labelKey: 'reasonHelpfulNextStep' },
  { value: 'natural_conversation', labelKey: 'reasonNaturalConversation' },
]

export function CoachingFeedback({ sessionId, locale, onDismiss }: CoachingFeedbackProps) {
  const [selected, setSelected] = useState<Rating | null>(null)
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([])
  const [reasons, setReasons] = useState<CoachingFeedbackReason[]>([])
  const [highlight, setHighlight] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [visible, setVisible] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const t = getDictionaryClient(locale).coachingFeedback

  const toggleTag = (tag: FeedbackTag) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    )
  }

  const handleSubmit = async () => {
    if (!selected || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const response = await csrfFetch('/api/coaching-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          rating: selected,
          reasons,
          highlight: highlight.trim() || undefined,
          tags: selectedTags,
        }),
        credentials: 'include',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error?.message || t.submitError)
      }
      setSubmitted(true)
      // Fade out and dismiss after 3 seconds
      setTimeout(() => {
        setVisible(false)
        setTimeout(() => onDismiss?.(), 500)
      }, 3000)
    } catch (error) {
      reportClientError(error, {
        component: 'CoachingFeedback',
        feature: 'coaching-feedback',
        level: 'error',
        extra: { sessionId },
      })
      setSubmitError(t.submitError)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleReason = (reason: CoachingFeedbackReason) => {
    setReasons((current) =>
      current.includes(reason)
        ? current.filter((item) => item !== reason)
        : current.length < 5
          ? [...current, reason]
          : current,
    )
  }

  return (
    <div
      className={`transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
        {submitted ? (
          <div className="text-center py-1 animate-fade-in-up">
            <div className="text-2xl mb-1.5">🙏</div>
            <p className="text-sm font-medium text-foreground">{t.thanks}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.thanksDetail}</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground mb-3 text-center">{t.title}</p>

            {/* Rating buttons */}
            <div className="flex items-center justify-center gap-2 mb-3">
              {RATING_OPTIONS.map(({ value, emoji, labelKey }) => {
                const isSelected = selected === value
                return (
                  <button
                    key={value}
                    onClick={() => setSelected(value)}
                    className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent'
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span>{t[labelKey]}</span>
                  </button>
                )
              })}
            </div>

            {/* Optional highlight textarea — appears after selection */}
            {selected && (
              <div className="animate-fade-in-up space-y-2">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{t.reasonLabel}</p>
                  <div className="flex flex-wrap gap-2 pb-1">
                    {REASON_OPTIONS.map(({ value, labelKey }) => {
                      const isSelected = reasons.includes(value)
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleReason(value)}
                          aria-pressed={isSelected}
                          className={`min-h-[36px] rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-accent'
                          }`}
                        >
                          {t[labelKey]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{t.tagsLabel}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TAG_OPTIONS.map(({ value, labelKey }) => {
                      const isSelected = selectedTags.includes(value)
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleTag(value)}
                          aria-pressed={isSelected}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent'
                          }`}
                        >
                          {t[labelKey]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <label htmlFor="coaching-highlight" className="block text-xs text-muted-foreground">
                  {t.highlightLabel}
                </label>
                <textarea
                  id="coaching-highlight"
                  value={highlight}
                  onChange={(e) => setHighlight(e.target.value)}
                  placeholder={t.highlightPlaceholder}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus:border-primary/50 resize-none"
                />
                <div className="flex justify-center">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? '...' : t.submit}
                  </button>
                </div>
                {submitError && (
                  <p role="alert" className="text-center text-xs text-destructive">
                    {submitError}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
