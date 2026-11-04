// ============================================================
// Share Landing Page — /[locale]/share/[code]
//
// Publicly accessible archetype showcase page for social sharing.
// Serves as a viral entry point: shows archetype identity card
// and invites others to start their own Quick Dive.
//
// SSR for SEO / og: meta tags — no auth required.
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getArchetypeContent } from "@/lib/content";
import { findLabel } from "@/components/quickdive/quickdive-data";
import { getLocalizedField } from "@/lib/i18n/localize";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  defaultLocale,
  isValidLocale,
  locales,
  type Locale,
} from "@/lib/i18n/config";
import { DEFAULT_APP_URL } from "@/lib/utils";

// ── Params ──────────────────────────────────────────────────

interface SharePageProps {
  params: Promise<{ locale: string; code: string }>;
}

/** Normalize URL code to ARCHETYPE_MAP key format.
 *  "r-enhancement" → "R-enhancement", "r" → "R", "ri" → "RI" */
function normalizeCode(raw: string): string {
  if (raw.includes("-")) {
    const [dim, rest] = raw.split("-");
    return `${dim.toUpperCase()}-${rest.toLowerCase()}`;
  }
  return raw.toUpperCase();
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

// ── Metadata (SSR, SEO) ──────────────────────────────────────

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { locale, code } = await params;
  const upperCode = normalizeCode(code);
  const content = getArchetypeContent(upperCode);
  const label = findLabel(upperCode);

  if (!content || !label) {
    return { title: "DeepDive — Career Exploration" };
  }

  const loc = resolveLocale(locale);
  const dict = await getDictionary(loc);
  const shareDict = dict.share;
  const primaryName = getLocalizedField(content, "label", loc);
  const tagline = getLocalizedField(content, "tagline", loc);
  const base = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

  const title = shareDict.metaTitle
    ? shareDict.metaTitle.replace("{name}", primaryName)
    : `I'm ${primaryName} — DeepDive Career Exploration`;

  const description = shareDict.metaDescription
    ? shareDict.metaDescription.replace("{tagline}", tagline)
    : `${tagline}. Discover your career identity and find your true direction.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${base}/${locale}/share/${code}`,
      siteName: "DeepDive",
      locale: toOpenGraphLocale(loc),
      type: "website",
      images: [
        {
          url: `${base}/api/og?${new URLSearchParams({
            code: upperCode,
            name: primaryName,
            secondary: getLocalizedField(
              content,
              "label",
              secondaryLocale(loc),
            ),
            subtitle: tagline,
            color: (content?.colorHex || label?.colorHex || "#5a7ab0").replace(
              "#",
              "",
            ),
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

// ── Generate static params for known codes ───────────────────

export function generateStaticParams() {
  // 6 basic RIASEC + 12 archetype codes (RIASEC × enhancement/transcendence)
  const codes = [
    "R",
    "I",
    "A",
    "S",
    "E",
    "C",
    "R-enhancement",
    "R-transcendence",
    "I-enhancement",
    "I-transcendence",
    "A-enhancement",
    "A-transcendence",
    "S-enhancement",
    "S-transcendence",
    "E-enhancement",
    "E-transcendence",
    "C-enhancement",
    "C-transcendence",
  ];
  return locales.flatMap((locale) =>
    codes.map((code) => ({ locale, code: code.toLowerCase() })),
  );
}

// ── Page ─────────────────────────────────────────────────────

export default async function SharePage({ params }: SharePageProps) {
  const { locale, code } = await params;
  const upperCode = normalizeCode(code);
  const content = getArchetypeContent(upperCode);
  const label = findLabel(upperCode);

  if (!content && !label) notFound();

  const loc = resolveLocale(locale);
  const dict = await getDictionary(loc);
  const shareDict = dict.share;
  const primaryName = content
    ? getLocalizedField(content, "label", loc)
    : label
      ? getLocalizedField(label, "label", loc)
      : upperCode;
  const secondaryName = content
    ? getLocalizedField(content, "label", secondaryLocale(loc))
    : label
      ? getLocalizedField(label, "label", secondaryLocale(loc))
      : "";
  const tagline = content
    ? getLocalizedField(content, "tagline", loc)
    : label
      ? getLocalizedField(label, "tagline", loc)
      : "";
  const traitText = label ? getLocalizedField(label, "tagline", loc) : "";

  // RIASEC primary type rarity based on O*NET occupational distribution
  const RIASEC_RARITY: Record<string, Partial<Record<Locale, string>>> = {
    R: {
      en: "Dominant in 28% of O*NET occupations",
      zh: "在 28% 的 O*NET 职业中占主导地位",
      nl: "Dominant in 28% van O*NET-beroepen",
    },
    I: {
      en: "Dominant in 15% of O*NET occupations",
      zh: "在 15% 的 O*NET 职业中占主导地位",
      nl: "Dominant in 15% van O*NET-beroepen",
    },
    A: {
      en: "Dominant in 8% of O*NET occupations — one of the rarest types",
      zh: "在 8% 的 O*NET 职业中占主导地位 — 最稀有的类型之一",
      nl: "Dominant in 8% van O*NET-beroepen — een van de zeldzaamste types",
    },
    S: {
      en: "Dominant in 19% of O*NET occupations",
      zh: "在 19% 的 O*NET 职业中占主导地位",
      nl: "Dominant in 19% van O*NET-beroepen",
    },
    E: {
      en: "Dominant in 16% of O*NET occupations",
      zh: "在 16% 的 O*NET 职业中占主导地位",
      nl: "Dominant in 16% van O*NET-beroepen",
    },
    C: {
      en: "Dominant in 14% of O*NET occupations",
      zh: "在 14% 的 O*NET 职业中占主导地位",
      nl: "Dominant in 14% van O*NET-beroepen",
    },
  };
  const primaryType = upperCode.charAt(0);
  const rarity = RIASEC_RARITY[primaryType];
  const rarityText = rarity ? (rarity[loc] ?? rarity.en ?? "") : "";
  const attribution = shareDict.attribution;

  const ctaHref = `/${locale}/quickdive`;
  const ctaLabel = `${shareDict.ctaLabel} →`;
  const ctaSubtext = shareDict.ctaSubtext;

  const shareIntro = shareDict.shareIntro;

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{
        background:
          "linear-gradient(180deg, var(--depth-shallow) 0%, var(--reef-surface) 40%, var(--reef-shallow) 100%)",
      }}
    >
      <div className="w-full max-w-lg">
        {/* ── Header: share intro text ── */}
        <p
          className="text-center text-xs font-medium tracking-widest uppercase mb-8 opacity-50"
          style={{ color: "var(--foreground)" }}
        >
          {shareIntro}
        </p>

        {/* ── Color circle avatar ── */}
        <div className="flex justify-center mb-6">
          <div
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center"
            style={{
              boxShadow:
                content?.colorHex || label?.colorHex
                  ? `0 8px 32px ${content?.colorHex || label?.colorHex}30`
                  : undefined,
              background: `radial-gradient(circle at 45% 35%, ${content?.colorHex || label?.colorHex || "#5a7ab0"}, ${content?.colorHex || label?.colorHex || "#5a7ab0"}B3)`,
            }}
          >
            <span
              className="text-5xl sm:text-6xl font-bold"
              style={{
                color: "rgba(255,255,255,0.92)",
                fontFamily: "var(--font-display, system-ui, sans-serif)",
                lineHeight: 1,
              }}
            >
              {(content?.label_en || label?.label_en || upperCode).charAt(0)}
            </span>
          </div>
        </div>

        {/* ── Type code badge ── */}
        <div className="flex justify-center mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono tracking-[0.2em] uppercase"
            style={{
              background: label ? `${label.colorHex}0A` : undefined,
              border: label ? `1px solid ${label.colorHex}20` : undefined,
              color: label ? `${label.colorHex}99` : undefined,
            }}
          >
            {dict.quickDive?.typeLabel || "TYPE"}: {label?.code || upperCode}
          </span>
        </div>

        {/* ── Archetype names ── */}
        <div className="text-center mb-6">
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-2"
            style={{
              color: "var(--foreground)",
              fontFamily: "var(--font-display, inherit)",
            }}
          >
            {primaryName}
          </h1>
          <p
            className="text-base sm:text-lg"
            style={{ color: "var(--text-secondary-on-shallow)" }}
          >
            {secondaryName}
          </p>
        </div>

        {/* ── Tagline ── */}
        <p
          className="text-center text-sm sm:text-base italic mb-8"
          style={{ color: "var(--text-secondary-on-shallow)" }}
        >
          &ldquo;{tagline}&rdquo;
        </p>

        {/* ── Identity card panel ── */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: "var(--glass-shallow)",
            border: "1px solid rgba(8, 112, 174, 0.08)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Trait description */}
          <p
            className="text-sm sm:text-base leading-relaxed mb-5"
            style={{
              color: "var(--text-secondary-on-shallow)",
              lineHeight: 1.8,
            }}
          >
            {traitText}
          </p>

          {/* Rarity */}
          <p className="text-xs sm:text-sm mb-1" style={{ color: "#E8763A" }}>
            {rarityText}
          </p>
          <p
            className="text-[10px] sm:text-xs"
            style={{ color: "var(--text-secondary-on-shallow)" }}
          >
            {attribution}
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex-1 h-px"
            style={{ background: "var(--text-secondary-on-shallow)" }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary-on-shallow)" }}
          >
            {shareDict.discoverYours}
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "var(--text-secondary-on-shallow)" }}
          />
        </div>

        {/* ── CTA ── */}
        <Link
          href={ctaHref}
          className="block w-full text-center py-4 rounded-2xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md mb-3"
          style={{
            background:
              "linear-gradient(135deg, var(--depth-abyss) 0%, var(--depth-deep) 100%)",
          }}
        >
          {ctaLabel}
        </Link>

        <p
          className="text-center text-xs"
          style={{ color: "var(--text-secondary-on-shallow)" }}
        >
          {ctaSubtext}
        </p>

        {/* ── Footer ── */}
        <p
          className="text-center text-[10px] mt-10 tracking-widest uppercase"
          style={{ color: "var(--text-secondary-on-shallow)" }}
        >
          DeepDive · deepdive.app
        </p>
      </div>
    </main>
  );
}
