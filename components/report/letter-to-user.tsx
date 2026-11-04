'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReportDict } from '@/lib/types'
import type { Locale } from '@/lib/i18n/config'

interface LetterToUserProps {
  letter: string
  locale: Locale
  t: ReportDict
  archetypeLabel?: string
  /** First actionable task from the 30-day plan, used for "one thing today" CTA */
  oneThingToday?: string | null
}

export function LetterToUser({ letter, locale: _locale, t, archetypeLabel: _archetypeLabel, oneThingToday }: LetterToUserProps) {
  const letterRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (!letter) return null

  // Split letter by double newlines into paragraphs
  const paragraphs = letter.split(/\n\n+/).filter(Boolean)
  const isLong = paragraphs.length > 2
  const visibleParagraphs = isLong && !expanded ? paragraphs.slice(0, 2) : paragraphs
  const hiddenParagraphs = isLong && expanded ? paragraphs.slice(2) : []

  const readFullLabel = t.readFullLetter ?? 'Read full letter →'
  const collapseLabel = t.collapseLetter ?? 'Collapse'

  const coachSign = t.letterCoachSign
  const shareLabel = t.shareThisLetter

  const handleShare = useCallback(async () => {
    if (!letterRef.current) return
    setGenerating(true)

    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(letterRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--paper-bg').trim() || '#fffbf5',
      })

      // Try native share
      if (navigator.share && navigator.canShare) {
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        const file = new File([blob], `deep-dive-letter-${Date.now()}.png`, { type: 'image/png' })
        const shareData = { files: [file] }
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
          return
        }
      }

      // Fallback: download
      const link = document.createElement('a')
      link.download = `deep-dive-letter-${Date.now()}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      // User cancelled or error
    } finally {
      setGenerating(false)
    }
  }, [])

  return (
    <section id="letter">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Visible letter card — paper feel with envelope fold */}
        <div
          ref={letterRef}
          className="relative rounded-2xl shadow-lg overflow-hidden border"
          style={{ background: "var(--paper-bg)", borderColor: "var(--paper-border)" }}
        >
          {/* Envelope fold corner — pure CSS triangle */}
          <div
            className="absolute top-0 left-0 w-8 h-8 z-10"
            style={{
              background: 'linear-gradient(135deg, var(--paper-border) 50%, transparent 50%)',
              opacity: 0.3,
            }}
          />

          <div className="px-6 pt-10 pb-8 sm:px-10 sm:pt-12 sm:pb-10">
            {/* Header — pure text, like a real letter */}
            <div className="mb-12">
              <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight" style={{ color: "var(--paper-text)" }}>
                {t.letterToUser}
              </h2>
              <div className="w-12 h-px mt-5" style={{ background: "var(--paper-border)" }} />
            </div>

            {/* Letter body — serif for letter feel, staggered reveal */}
            <div className="space-y-6 max-w-prose">
              {visibleParagraphs.map((para, idx) => (
                <motion.p
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  className="leading-[1.9] text-[15px] sm:text-base lg:text-lg font-serif"
                  style={{
                    color: idx === 0 ? "var(--paper-text)" : "var(--paper-text-secondary)",
                    lineHeight: 1.85,
                  }}
                >
                  {para}
                </motion.p>
              ))}

              <AnimatePresence>
                {hiddenParagraphs.map((para, idx) => (
                  <motion.p
                    key={`hidden-${idx}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="leading-[1.9] text-[15px] sm:text-base lg:text-lg font-serif"
                    style={{
                      color: "var(--paper-text-secondary)",
                      lineHeight: 1.85,
                    }}
                  >
                    {para}
                  </motion.p>
                ))}
              </AnimatePresence>

              {isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline transition-colors"
                >
                  {expanded ? collapseLabel : readFullLabel}
                </button>
              )}
            </div>

            {/* Coach signature — elegant with nautilus mark */}
            <div className="mt-16 pt-8 flex items-end justify-between" style={{ borderTop: "1px solid var(--paper-border)" }}>
              <p className="font-serif text-sm italic" style={{ color: "var(--paper-text-secondary)" }}>
                — {coachSign}
              </p>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "var(--paper-text-secondary)", opacity: 0.3 }}>
                Deep Dive
              </span>
            </div>

            {/* "If you only do one thing today" CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 rounded-xl p-4 sm:p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(var(--color-primary-rgb, 124 58 237), 0.06), rgba(var(--color-primary-rgb, 124 58 237), 0.02))',
                border: '1px solid var(--paper-border)',
              }}
            >
              <div className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--paper-text)' }} />
                <div>
                  <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--paper-text)' }}>
                    {t.oneThingTodayTitle}
                  </p>
                  <p className="text-sm leading-relaxed font-serif" style={{ color: 'var(--paper-text-secondary)' }}>
                    {oneThingToday || t.oneThingTodayFallback}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Action buttons below the card */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          <Button
            onClick={handleShare}
            disabled={generating}
            className="rounded-full px-6 gap-2 text-muted-foreground"
            variant="outline"
          >
            <Share2 className="h-4 w-4" />
            {generating ? t.generating : shareLabel}
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
