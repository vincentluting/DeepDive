import type { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { PrivacyPolicyContent } from "./privacy-policy-content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: dict.metadata.privacyTitle,
    description: dict.metadata.privacyDescription,
  }
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <PrivacyPolicyContent locale={locale} />
      </main>
    </div>
  )
}
