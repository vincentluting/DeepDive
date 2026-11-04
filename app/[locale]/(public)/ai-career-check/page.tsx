// ============================================================
// AI Career Impact Checker — /[locale]/ai-career-check
//
// Public funnel entry point: users search for their occupation
// and see AI impact analysis + CTA to Quick Dive.
// Zero auth required. SEO-optimized.
// ============================================================

import type { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { AiCareerCheckClient } from "./ai-career-check-client"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)
  const t = dict.aiCareerCheck

  return {
    title: t.metaTitle,
    description: t.metaDescription,
  }
}

export default async function AiCareerCheckPage({ params }: PageProps) {
  const { locale } = await params

  return (
    <main className="dd-public-page min-h-screen bg-background">
      <AiCareerCheckClient locale={locale} />
    </main>
  )
}
