"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client"
import type { Locale } from "@/lib/i18n/config"

export default function LocaleNotFound() {
  const params = useParams()
  const locale = (params?.locale as string) || "en"
  const t = getDictionaryClient(locale as Locale).notFoundPage

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <p className="text-sm font-medium tracking-widest uppercase text-primary/60 mb-3">
          {t.eyebrow}
        </p>

        <h1 className="text-2xl font-bold mb-3">
          {t.title}
        </h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t.description}
        </p>

        <Link
          href={`/${locale}`}
          className="inline-block px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          {t.backToHome}
        </Link>
      </div>
    </div>
  )
}
