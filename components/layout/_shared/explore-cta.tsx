"use client"

import Link from "next/link"
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client"

interface ExploreCTAProps {
  locale: string
  hasInProgressSession: boolean
  hasReport: boolean
}

export function ExploreCTA({ locale, hasInProgressSession, hasReport }: ExploreCTAProps) {
  const landingT = getDictionaryClient(locale as "en" | "zh").landing

  const ctaLabel = hasInProgressSession
    ? landingT.headerCtaContinue
    : hasReport
      ? landingT.headerCtaContinueExploring
      : landingT.headerCta

  return (
    <Link
      href={`/${locale}/explore`}
      className="header-cta-primary inline-flex items-center gap-1.5 px-4 py-[7px] rounded-full text-[13px] font-semibold text-white transition-all duration-200 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1"
    >
      <span>{ctaLabel}</span>
    </Link>
  )
}
