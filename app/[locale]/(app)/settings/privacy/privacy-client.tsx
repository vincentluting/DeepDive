"use client"

const __DEV__ = process.env.NODE_ENV === 'development';

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Shield, Database, FileText, MessageSquare, Briefcase, User, Lock, HelpCircle } from "lucide-react"
import { DataExportCard } from "@/components/settings/data-export-card"
import { AccountDeletionCard } from "@/components/settings/account-deletion-card"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/get-dictionary"
import { interpolate } from "@/lib/i18n/get-dictionary-client"

interface DataSummary {
  assessments: number
  reports: number
  quickDive: number
  coaching: number
  jobs: number
  profile: number
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  assessments: FileText,
  reports: Database,
  quickDive: Database,
  coaching: MessageSquare,
  jobs: Briefcase,
  profile: User,
}

interface PrivacyCenterClientProps {
  locale: Locale
  dictionary: Dictionary
}

// Helper to safely get string values from the privacy dictionary
function str(val: string | string[]): string {
  return Array.isArray(val) ? val.join(", ") : val
}


export function PrivacyCenterClient({ locale, dictionary }: PrivacyCenterClientProps) {
  const t = dictionary.privacy
  const [summary, setSummary] = useState<DataSummary | null>(null)

  useEffect(() => {
    fetch("/api/user-data/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setSummary(data))
      .catch((err) => { if (__DEV__) console.error('[PrivacyCenter] fetch summary failed:', err) })
  }, [])

  const categories = [
    { key: "assessments", label: str(t.categoryAssessments), desc: str(t.categoryAssessmentsDesc) },
    { key: "reports", label: str(t.categoryReports), desc: str(t.categoryReportsDesc) },
    { key: "quickDive", label: str(t.categoryQuickDive), desc: str(t.categoryQuickDiveDesc) },
    { key: "coaching", label: str(t.categoryCoaching), desc: str(t.categoryCoachingDesc) },
    { key: "jobs", label: str(t.categoryJobs), desc: str(t.categoryJobsDesc) },
    { key: "profile", label: str(t.categoryProfile), desc: str(t.categoryProfileDesc) },
  ]

  const totalItems = summary
    ? Object.values(summary).reduce((a, b) => a + b, 0)
    : null

  const faqs = [
    { q: str(t.privacyFaq1Q), a: str(t.privacyFaq1A) },
    { q: str(t.privacyFaq2Q), a: str(t.privacyFaq2A) },
    { q: str(t.privacyFaq3Q), a: str(t.privacyFaq3A) },
  ]

  return (
    <>
      {/* Header */}
      <div className="mb-2">
        <Link
          href={`/${locale}/settings`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {str(t.backToDashboard)}
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{str(t.title)}</h1>
            <p className="text-sm text-text-secondary mt-0.5">{str(t.subtitle)}</p>
          </div>
        </div>
      </div>

      {/* Section 1: Data Usage Overview */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{str(t.overviewTitle)}</h2>
        </div>
        <p className="text-sm text-text-secondary mb-4">{str(t.overviewDesc)}</p>

        {/* Status summary */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/20">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              {totalItems !== null ? `${totalItems} ${str(t.recordsStored)}` : '...'}
            </span>
          </div>
        </div>

        {/* Data categories grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.key] || Database
            const count = summary?.[cat.key as keyof DataSummary] ?? null
            return (
              <div
                key={cat.key}
                className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background"
              >
                <div className="p-1.5 rounded-lg bg-primary/8">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{cat.label}</p>
                  <p className="text-xs text-text-tertiary">{cat.desc}</p>
                  {count !== null && (
                    <p className="text-xs text-primary font-medium mt-1">
                      {count > 0
                        ? interpolate(str(t.items), { count: String(count) })
                        : str(t.noData)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Section 2: Data Controls */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{str(t.dataControlsTitle)}</h2>
        </div>

        <div className="space-y-5">
          {/* Export */}
          <DataExportCard
            t={{
              exportTitle: str(t.exportTitle),
              exportDesc: str(t.exportDesc),
              exportButton: str(t.exportButton),
              exportHelperText: str(t.exportHelperText),
              exporting: str(t.exporting),
              exportSuccess: str(t.exportSuccess),
              exportFailed: str(t.exportFailed),
            }}
          />

          {/* Delete */}
          <AccountDeletionCard
            t={{
              deleteTitle: str(t.deleteTitle),
              deleteDesc: str(t.deleteDesc),
              deleteButton: str(t.deleteButton),
              deleteWarning: str(t.deleteWarning),
              deleteSuccess: str(t.deleteSuccess),
              deleteFailed: str(t.deleteFailed),
              coolingPeriod: str(t.coolingPeriod),
              coolingPeriodDesc: str(t.coolingPeriodDesc),
              deleteStepInfoTitle: str(t.deleteStepInfoTitle),
              deleteStepInfoWarning: str(t.deleteStepInfoWarning),
              deleteStepInfoItems: t.deleteStepInfoItems as string[],
              deleteStepInfoRetention: str(t.deleteStepInfoRetention),
              deleteStepVerifyTitle: str(t.deleteStepVerifyTitle),
              deleteStepVerifyDesc: str(t.deleteStepVerifyDesc),
              deleteStepVerifyTypeLabel: str(t.deleteStepVerifyTypeLabel),
              deleteStepVerifyTypeWord: str(t.deleteStepVerifyTypeWord),
              deleteStepVerifyPasswordLabel: str(t.deleteStepVerifyPasswordLabel),
              deleteStepVerifyPasswordPlaceholder: str(t.deleteStepVerifyPasswordPlaceholder),
              deleteStepVerifyTypeError: str(t.deleteStepVerifyTypeError),
              deleteStepVerifyPasswordError: str(t.deleteStepVerifyPasswordError),
              deleteStepVerifyGenericError: str(t.deleteStepVerifyGenericError),
              deleteStepFinalTitle: str(t.deleteStepFinalTitle),
              deleteStepFinalDesc: str(t.deleteStepFinalDesc),
              deleteStepNext: str(t.deleteStepNext),
              deleteStepBack: str(t.deleteStepBack),
              deleteStepCancel: str(t.deleteStepCancel),
              deleteStepConfirmDelete: str(t.deleteStepConfirmDelete),
              deleteStepOf: str(t.deleteStepOf),
            }}
          />
        </div>
      </section>

      {/* Section 3: Third-Party Sharing */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{str(t.thirdPartyTitle)}</h2>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/20">
          <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{str(t.thirdPartyNone)}</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">{str(t.thirdPartyDesc)}</p>
          </div>
        </div>
      </section>

      {/* Section 4: FAQ */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <HelpCircle className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{str(t.faqSectionTitle)}</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className={`pb-4 ${i < faqs.length - 1 ? 'border-b border-border' : ''}`}>
              <h3 className="text-sm font-medium text-foreground mb-1.5">{faq.q}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data usage principles */}
      <section className="rounded-2xl border border-border bg-surface-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{str(t.dataUsageTitle)}</h2>
        </div>
        <ul className="space-y-2.5">
          {(t.dataUsagePoints as string[]).map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
