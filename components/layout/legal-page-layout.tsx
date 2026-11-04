"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

interface LegalPageLayoutProps {
  locale: string;
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
  backLabel: string;
}

export function LegalPageLayout({
  locale,
  title,
  lastUpdated,
  children,
  backLabel,
}: LegalPageLayoutProps) {
  const dict = getDictionaryClient(locale as Locale);
  const tLegal = dict.legal;

  return (
    // Chart Room (revelation) surface — a legal document is a monograph plate.
    // rev-* tokens are :root/.dark scoped, so light+dark switch automatically.
    <div className="min-h-screen bg-rev-paper text-rev-ink">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        {/* Back link */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm text-rev-ink hover:text-rev-signal-info transition-colors mb-10 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        {/* Masthead — Monograph plate: brass mark + hairline, serif title */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rev-signal-attention" />
            <span className="h-px w-12 bg-rev-rule" />
          </div>
          <h1 className="text-4xl sm:text-5xl leading-[1.05] tracking-tight text-rev-ink [font-family:var(--font-display),Georgia,serif] font-normal">
            {title}
          </h1>
          <p className="mt-3 text-[15px] italic text-rev-ink [font-family:var(--font-serif),Georgia,serif]">
            {lastUpdated}
          </p>
          <div className="mt-8 h-px w-full bg-rev-rule" />
        </header>

        {/* Content — editorial typography on chart paper.
            NOTE: this project has no @tailwindcss/typography plugin, so `prose`
            is a no-op. Style the raw legal markup with arbitrary descendant
            variants targeting the real <section>/<h2>/<p>/… elements. */}
        <div
          className="max-w-none
          [&_section]:mt-12 [&_section:first-child]:mt-0
          [&_h2]:text-[1.6rem] [&_h2]:leading-tight [&_h2]:mb-4 [&_h2]:tracking-tight [&_h2]:font-normal [&_h2]:text-rev-ink [&_h2]:[font-family:var(--font-display),Georgia,serif]
          [&_h3]:text-base [&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-rev-ink
          [&_p]:text-rev-ink [&_p]:leading-[1.75] [&_p]:my-4
          [&_ul]:my-4 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2
          [&_li]:text-rev-ink [&_li]:leading-[1.7] [&_li]:pl-1
          [&_a]:text-rev-signal-info [&_a]:underline-offset-2 hover:[&_a]:underline
          [&_strong]:text-rev-ink [&_strong]:font-semibold
        "
        >
          {children}
        </div>

        {/* Footer — hairline rule + cross-links + script coda */}
        <footer className="mt-16 pt-8 border-t border-rev-rule">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-rev-ink">
            <Link
              href={`/${locale}/legal/privacy`}
              className="hover:text-rev-signal-info transition-colors"
            >
              {tLegal.privacyTitle}
            </Link>
            <span className="text-rev-rule">·</span>
            <Link
              href={`/${locale}/legal/terms`}
              className="hover:text-rev-signal-info transition-colors"
            >
              {tLegal.termsOfService}
            </Link>
            <span className="text-rev-rule">·</span>
            <Link
              href={`/${locale}/settings/privacy`}
              className="hover:text-rev-signal-info transition-colors"
            >
              {tLegal.privacyCenter}
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
