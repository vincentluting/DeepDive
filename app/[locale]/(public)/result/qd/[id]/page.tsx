// ============================================================
// Public Quick Dive Result Page — /[locale]/result/qd/[id]
//
// Shareable, public result page for viral growth loop.
// No auth required. OG metadata for social sharing previews.
// "Take the quiz" CTA at bottom closes the viral loop.
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuickDiveReport } from "@/lib/db/platform";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n/config";
import { DEFAULT_APP_URL } from "@/lib/utils";
import { findLabel } from "@/components/quickdive/quickdive-data";
import { getLocalizedField } from "@/lib/i18n/localize";
import { getArchetypeContent } from "@/lib/content";
import {
  PublicResultClient,
  type PublicResultClientProps,
} from "./public-result-client";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function resolveLocale(locale: string): Locale {
  return isValidLocale(locale) ? locale : defaultLocale;
}

function toOpenGraphLocale(locale: Locale): string {
  if (locale === "zh") return "zh_CN";
  if (locale === "nl") return "nl_NL";
  return "en_US";
}

function secondaryLocale(locale: Locale): Locale {
  if (locale === "zh") return "en";
  if (locale === "en") return "zh";
  return "en";
}

// ── OG Metadata ─────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const loc = resolveLocale(locale);
  const report = await getQuickDiveReport(id);

  if (!report) {
    return { title: "DeepDive" };
  }

  const dict = await getDictionary(loc);
  const shareDict = dict.share;
  const content = getArchetypeContent(report.archetypeCode);
  const label = findLabel(report.archetypeCode);
  const primaryName = content
    ? getLocalizedField(content, "label", loc)
    : label
      ? getLocalizedField(label, "label", loc)
      : report.archetypeLabel;
  const tagline = content
    ? getLocalizedField(content, "tagline", loc)
    : label
      ? getLocalizedField(label, "tagline", loc)
      : "";

  const base = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;
  const title = shareDict.metaTitle
    ? shareDict.metaTitle.replace("{name}", primaryName)
    : `I'm ${primaryName} — DeepDive`;
  const description = shareDict.metaDescription
    ? shareDict.metaDescription.replace("{tagline}", tagline)
    : tagline;

  const colorHex = (content?.colorHex || label?.colorHex || "#5a7ab0").replace(
    "#",
    "",
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${base}/${locale}/result/qd/${id}`,
      siteName: "DeepDive",
      locale: toOpenGraphLocale(loc),
      type: "website",
      images: [
        {
          url: `${base}/api/og?${new URLSearchParams({
            code: report.archetypeCode,
            name: primaryName,
            secondary: (() => {
              const altLoc = secondaryLocale(loc);
              if (content) return getLocalizedField(content, "label", altLoc);
              if (label) return getLocalizedField(label, "label", altLoc);
              return "";
            })(),
            subtitle: tagline,
            color: colorHex,
            locale: loc,
          }).toString()}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ── Page ─────────────────────────────────────────────────────

export default async function PublicQuickDiveResultPage({ params }: PageProps) {
  const { locale, id } = await params;
  const report = await getQuickDiveReport(id);

  if (!report) notFound();

  const loc = resolveLocale(locale);
  const dict = await getDictionary(loc);

  return (
    <PublicResultClient
      report={{
        id: report.id,
        archetypeCode: report.archetypeCode,
        archetypeLabel: report.archetypeLabel,
        scoresJson: report.scoresJson,
        resultData:
          report.resultDataJson as PublicResultClientProps["report"]["resultData"],
        language: report.language,
        createdAt: report.createdAt,
        exploreMode: report.exploreMode,
        avatarGender: report.avatarGender,
      }}
      locale={loc}
      exploreDict={dict.quickDive as Record<string, string>}
      shareDict={dict.share as Record<string, string>}
    />
  );
}
