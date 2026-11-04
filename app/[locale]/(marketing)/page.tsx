import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

// Sounding — the clean landing rebuild (docs/design/sounding-design-bible.md).
// Reuses the real i18n / auth / analytics / dive-scroll; styling is a fresh
// single-source CSS Module. The previous Landing v8 (./preview/page) is kept
// intact for instant rollback — swap this import back to revert.
const SoundingLanding = dynamic(
  () =>
    import("@/components/features/landing/sounding/sounding-landing").then(
      (m) => m.SoundingLanding,
    ),
  { ssr: true },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const m = dictionary.metadata;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deepdive.app";
  const ogImageUrl = `${appUrl}/api/og?title=${encodeURIComponent(m.homeTitle)}&locale=${locale}`;

  const canonicalUrl = `https://www.deepdivecareer.com/${locale}`;

  return {
    title: m.homeTitle,
    description: m.homeDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      title: m.homeTitle,
      description: m.homeDescription,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: m.homeTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: m.homeTitle,
      description: m.homeDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  await params;

  return <SoundingLanding />;
}
