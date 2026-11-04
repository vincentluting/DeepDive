import type React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { locales, toDateLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ThemeProvider } from "@/components/theme-provider";

const PageDurationTracker = dynamic(() =>
  import("@/components/analytics/page-duration-tracker").then(
    (m) => m.PageDurationTracker,
  ),
);
const InviteCodePersister = dynamic(() =>
  import("@/components/analytics/invite-code-persister").then(
    (m) => m.InviteCodePersister,
  ),
);

const notoSansSC = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-noto-sc",
  display: "swap",
  adjustFontFallback: "Arial",
});
const fraunces = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-600-italic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/fraunces/files/fraunces-latin-900-normal.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

/**
 * Caveat — Meridian Script Coda only ("Go deeper. Live clearer.").
 * zh falls back to Kaiti via --font-script stack in @theme. Never use for UI text.
 */
const caveat = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/caveat/files/caveat-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/caveat/files/caveat-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-script",
  display: "swap",
  preload: false,
});
const notoSerifSC = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/noto-serif-sc/files/noto-serif-sc-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/noto-serif-sc/files/noto-serif-sc-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/noto-serif-sc/files/noto-serif-sc-latin-900-normal.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-noto-serif-sc",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});
const dmSans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: "Arial",
});

/**
 * Source Serif 4 — Revelation Surface body serif (v2 Surface System).
 * Used for long-form report reading. See:
 * `.claude/skills/deepdive-design/references/surface-revelation.md`
 */
const sourceSerif4 = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-500-italic.woff2",
      weight: "500",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const fontClasses = `${notoSansSC.variable} ${notoSerifSC.variable} ${fraunces.variable} ${dmSans.variable} ${sourceSerif4.variable} ${caveat.variable}`;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const m = dict.metadata;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deepdive.app";
  const ogImageUrl = `${appUrl}/api/og?locale=${locale}`;

  return {
    title: m.homeTitle,
    description: m.homeDescription,
    metadataBase: new URL(appUrl),
    // hreflang alternates — tells Google that /en and /zh are language
    // variants of the same content, preventing duplicate-content penalties
    // and letting Google serve the right version to the right audience.
    // x-default points at /en for non-Chinese visitors without a locale match.
    alternates: {
      languages: {
        en: `${appUrl}/en`,
        zh: `${appUrl}/zh`,
        "x-default": `${appUrl}/en`,
      },
    },
    openGraph: {
      title: m.homeTitle,
      description: m.homeDescription,
      url: `${appUrl}/${locale}`,
      siteName: "Deep Dive",
      locale: toDateLocale(locale as Locale).replace("-", "_"),
      type: "website",
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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Build locale-aware JSON-LD schemas for SEO + AI search indexing.
  // Organization + WebSite are the two baseline schema.org types recommended
  // by Google for any brand site — enables Knowledge Graph cards, sitelinks
  // search box, and improved LLM-based search answers (Perplexity / Google AI
  // Overview / ChatGPT Search that respect our robots.txt allowlist).
  const dict = await getDictionary(locale as Locale);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deepdive.app";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${appUrl}/#organization`,
        name: "Deep Dive",
        url: appUrl,
        logo: `${appUrl}/icon1.png`,
        description: dict.metadata.homeDescription,
      },
      {
        "@type": "WebSite",
        "@id": `${appUrl}/#website`,
        url: `${appUrl}/${locale}`,
        name: dict.metadata.homeTitle,
        description: dict.metadata.homeDescription,
        inLanguage: toDateLocale(locale as Locale),
        publisher: { "@id": `${appUrl}/#organization` },
      },
    ],
  };

  return (
    <html
      lang={locale}
      className={fontClasses}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* JSON-LD structured data for SEO. All other head metadata
            (title, description, og, theme-color, manifest, apple-icon) comes
            from the Metadata/Viewport exports + Next.js file-based conventions
            (app/manifest.json, app/apple-icon.png) — single source of truth. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <PageDurationTracker />
        <InviteCodePersister />
        <SpeedInsights />
      </body>
    </html>
  );
}
