import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { PrivacyCenterClient } from "./privacy-client"

export const metadata: Metadata = {
  title: "Privacy Center — Deep Dive",
  description: "Manage your personal data, export your information, or delete your account.",
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const dictionary = await getDictionary(locale as Locale)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 p-4 sm:p-8">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <PrivacyCenterClient locale={locale as Locale} dictionary={dictionary} />
        </div>
      </div>
    </div>
  )
}
