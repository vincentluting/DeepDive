'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getDictionaryClient } from '@/lib/i18n/get-dictionary-client'
import type { Locale } from '@/lib/i18n/config'

interface BackToExploreProps {
  locale: Locale
  /** If true, shows a confirmation dialog before navigating */
  confirmBeforeLeave?: boolean
  /** Light text for dark backgrounds, dark text for light backgrounds */
  textTheme?: 'dark' | 'light'
}

export function BackToExplore({ locale, confirmBeforeLeave = false, textTheme = 'light' }: BackToExploreProps) {
  const router = useRouter()
  const t = getDictionaryClient(locale).exploreHub as Record<string, string>
  const [showConfirm, setShowConfirm] = useState(false)

  const homePath = `/${locale}`

  const handleClick = useCallback(() => {
    setShowConfirm(true)
  }, [])

  const handleConfirm = useCallback(() => {
    setShowConfirm(false)
    router.push(homePath)
  }, [homePath, router])

  const textColor = textTheme === 'light'
    ? 'text-white/75 hover:text-white/90'
    : 'text-slate-700/80 hover:text-slate-950'

  const label = t.backToHome ?? t.backToExplore

  return (
    <>
      {confirmBeforeLeave ? (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1 text-xs ${textColor} transition-colors duration-200 min-h-[44px] py-2 px-2 rounded-lg`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      ) : (
        <Link
          href={homePath}
          className={`inline-flex items-center gap-1 text-xs ${textColor} transition-colors duration-200 min-h-[44px] py-2 px-2 rounded-lg`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{label}</span>
        </Link>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-2xl border border-border card-shadow max-w-sm w-full p-6 animate-scale-in">
            <p className="text-sm text-foreground font-medium mb-4 leading-relaxed">
              {t.leaveConfirm}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 min-h-[44px] text-sm rounded-xl border border-border text-foreground hover:bg-accent transition-colors"
              >
                {t.leaveCancel}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 min-h-[44px] text-sm rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors"
              >
                {t.leaveConfirmYes}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
