import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getReport } from "@/lib/db/reports";
import { getLocalizedField } from "@/lib/i18n/localize";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, isValidLocale, type Locale } from "@/lib/i18n/config";
import ReportClient from "./report-client";
import { DEFAULT_APP_URL } from "@/lib/utils";

interface ReportPageProps {
  params: Promise<{ locale: string; id: string }>;
}

function resolveLocale(locale: string): Locale {
  return isValidLocale(locale) ? locale : defaultLocale;
}

export async function generateMetadata({
  params,
}: ReportPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

  try {
    const report = await getReport(id);
    if (!report?.header?.archetype) {
      return { title: "Deep Dive — Career Report" };
    }

    const loc = resolveLocale(locale);
    const dict = await getDictionary(loc);
    const archetypeLabel = getLocalizedField(
      report.header.archetype,
      "label",
      loc,
    );
    const tagline = getLocalizedField(report.header.archetype, "tagline", loc);

    const title = dict.metadata.reportTitle
      ? dict.metadata.reportTitle.replace("{{name}}", archetypeLabel)
      : `My Deep Dive Report — ${archetypeLabel}`;
    const description = tagline;

    const ogUrl = `${appUrl}/${locale}/report/${id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: ogUrl,
        siteName: "Deep Dive",
        type: "article",
        images: [
          {
            url: `${appUrl}/api/og?title=${encodeURIComponent(archetypeLabel)}&subtitle=${encodeURIComponent(tagline)}&locale=${loc}`,
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
        images: [
          `${appUrl}/api/og?title=${encodeURIComponent(archetypeLabel)}&subtitle=${encodeURIComponent(tagline)}&locale=${loc}`,
        ],
      },
    };
  } catch {
    return { title: "Deep Dive — Career Report" };
  }
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { locale } = await params;

  // Let DB errors propagate to error.tsx rather than silently redirecting
  // logged-in users to register during transient DB outages.
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/register?from=report`);
  }

  return <ReportClient />;
}
