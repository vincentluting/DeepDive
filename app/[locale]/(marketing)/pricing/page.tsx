import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/features/checkout-button";
import { PageArtLayer } from "@/components/design/meridian/page-art-layer";

// ── Metadata ──

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const t = dictionary.pricing;
  return {
    title: `${t.title} ${t.titleHighlight} | Deep Dive`,
    description: t.subtitle,
  };
}

// ── Icons ──

function Check({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className ?? "size-4 shrink-0"}
      aria-hidden="true"
    >
      <path
        d="M13.25 4.75 6 12 2.75 8.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Tier config ──

interface TierConfig {
  key: "free" | "report" | "journey";
  featured: boolean;
  featureCount: number;
  href: string;
  accentColor: string;
}

// Order: high→low for price anchoring. Report in center = "Most Popular" (center-stage effect).
const TIERS: TierConfig[] = [
  {
    key: "journey",
    featured: false,
    featureCount: 4,
    href: "/explore",
    accentColor: "from-md-gold to-md-gold-deep",
  },
  {
    key: "report",
    featured: true,
    featureCount: 6,
    href: "/explore",
    accentColor: "from-sky-400 to-blue-500",
  },
  {
    key: "free",
    featured: false,
    featureCount: 4,
    href: "/quickdive",
    accentColor: "from-cyan-400 to-sky-500",
  },
];

// ── Page ──

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const t = dictionary.pricing;

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-transparent">
      <PageArtLayer route="pricing" />

      {/* ═══════════════════════════════════════════
          Section 1: Hero — depth metaphor header
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-6xl px-[var(--content-px)] pt-36 md:pt-48 pb-0">
        {/* Section badge — depth marker style */}
        <div className="text-center mb-8">
          <span className="text-[11px] tracking-[0.2em] uppercase font-medium text-muted-foreground dark:text-white/60">
            {t.badge}
          </span>
        </div>

        {/* Heading — display font, warm gradient (dark) / foreground (light) */}
        <div className="mx-auto max-w-2xl text-center mb-6">
          <h1 className="display-heading text-4xl sm:text-5xl md:text-[var(--text-4xl)] font-bold leading-[1.05]">
            {/* Light mode */}
            <span className="dark:hidden text-foreground">{t.title}</span>
            {/* Dark mode — warm cream gradient matching bottom-cta */}
            <span
              className="hidden dark:inline bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #fff 0%, #FFE8D0 50%, #F5D5B0 100%)",
              }}
            >
              {t.title}
            </span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--grad-cta-primary)" }}
            >
              {t.titleHighlight}
            </span>
          </h1>
        </div>

        <p className="mx-auto max-w-md text-center text-[var(--text-base)] leading-relaxed text-muted-foreground dark:text-white/60 mb-20">
          {t.subtitle}
        </p>
      </section>

      {/* ═══════════════════════════════════════════
          Section 2: Pricing cards
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-5xl px-[var(--content-px)] pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
          {TIERS.map((tier, i) => (
            <div
              key={tier.key}
              className={tier.featured ? "order-first md:order-none" : ""}
            >
              <PricingCard tier={tier} t={t} locale={locale} index={i} />
            </div>
          ))}
        </div>

        {/* Coaching subscription — pill */}
        <div className="mt-14 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-6 py-3.5 rounded-2xl border border-border/40 dark:border-white/[0.06] bg-muted/40 dark:bg-white/[0.02]">
            <span className="text-muted-foreground/80 dark:text-white/60 text-[var(--text-sm)]">
              {t.coachingNote}
            </span>
            <span className="font-semibold text-foreground dark:text-white/85 text-[var(--text-sm)]">
              {t.coachingPrice}
            </span>
            <span className="text-muted-foreground dark:text-white/65 text-[var(--text-sm)]">
              {t.coachingDesc}
            </span>
            <CheckoutButton
              tier="coaching"
              locale={locale}
              variant="outline"
              size="sm"
              className="ml-1 text-[var(--text-xs)]"
            >
              Subscribe
            </CheckoutButton>
          </div>
        </div>

        {/* Invite code */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground/65 dark:text-white/60 text-[var(--text-sm)]">
            {t.inviteNote}{" "}
            <Link
              href={`/${locale}/settings`}
              className="underline underline-offset-4 text-muted-foreground dark:text-white/65 hover:text-foreground/70 dark:hover:text-white/60 transition-colors duration-300"
            >
              {t.inviteLink}
            </Link>{" "}
            {t.inviteDesc}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          Section 3: Social proof — framework credibility
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-3xl px-[var(--content-px)] py-24 md:py-32">
        {/* Divider — wave-inspired */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-border/60 dark:via-white/[0.08] to-transparent" />

        <div className="text-center mb-12">
          <span className="text-[11px] tracking-[0.2em] uppercase font-medium text-muted-foreground/65 dark:text-white/60">
            {t.socialProofBadge}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 sm:gap-10 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="text-[var(--text-2xl)] sm:text-[var(--text-3xl)] font-bold tracking-tight text-foreground dark:text-white/90">
                {t[`socialProofStat${i}`]}
              </div>
              <div className="text-[var(--text-xs)] sm:text-[var(--text-sm)] text-muted-foreground dark:text-white/65 mt-1.5">
                {t[`socialProofLabel${i}`]}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[var(--text-sm)] text-muted-foreground/65 dark:text-white/60 leading-relaxed max-w-xl mx-auto">
          {t.socialProofFoundation}
        </p>
      </section>

      {/* ═══════════════════════════════════════════
          Section 4: FAQ — reduce purchase hesitation
          ═══════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-2xl px-[var(--content-px)] pb-32">
        {/* Divider */}
        <div className="mb-16 flex justify-center">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-border/60 dark:via-white/[0.08] to-transparent" />
        </div>

        <h2 className="text-center display-heading text-[var(--text-xl)] sm:text-[var(--text-2xl)] font-bold tracking-tight text-foreground dark:text-white/90 mb-12">
          {t.faqTitle}
        </h2>

        <div className="divide-y divide-border/40 dark:divide-white/[0.06]">
          {[1, 2, 3, 4, 5, 6].map((i) => {
            const q = t[`faq${i}q`];
            const a = t[`faq${i}a`];
            if (!q) return null;
            return (
              <details key={i} className="group py-5 first:pt-0">
                <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                  <span className="text-[var(--text-sm)] sm:text-[var(--text-base)] font-medium text-foreground/85 dark:text-white/75 pr-6 leading-relaxed">
                    {q}
                  </span>
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-border/50 dark:border-white/[0.08] text-muted-foreground/60 dark:text-white/60 group-open:rotate-45 transition-transform duration-200 text-sm">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[var(--text-sm)] text-muted-foreground dark:text-white/60 leading-relaxed pr-12">
                  {a}
                </p>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════
// Pricing card — TrustCard pattern adapted
// ═══════════════════════════════════════════

function PricingCard({
  tier,
  t,
  locale,
  index,
}: {
  tier: TierConfig;
  t: Record<string, string>;
  locale: string;
  index: number;
}) {
  const name = t[`${tier.key}Name`];
  const price = t[`${tier.key}Price`];
  const period = t[`${tier.key}Period`];
  const desc = t[`${tier.key}Desc`];
  const cta = t[`${tier.key}Cta`];
  const badge = t[`${tier.key}Badge`];

  const features: string[] = [];
  for (let i = 1; i <= tier.featureCount; i++) {
    const f = t[`${tier.key}Feature${i}`];
    if (f) features.push(f);
  }

  const isPaid = tier.key !== "free";

  return (
    <div
      className={`
        group relative flex flex-col rounded-2xl border
        transition-all duration-500 overflow-hidden
        hover:-translate-y-1.5
        ${
          tier.featured
            ? [
                "border-primary/15 bg-card shadow-[0_2px_24px_rgba(8,112,174,0.06),0_0_0_1px_rgba(8,112,174,0.04)]",
                "dark:border-white/[0.1] dark:bg-white/[0.04] dark:shadow-none",
                "hover:shadow-[0_8px_40px_rgba(8,112,174,0.1)] dark:hover:bg-white/[0.06] dark:hover:border-white/[0.16]",
              ].join(" ")
            : [
                "border-border/50 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03)]",
                "dark:border-white/[0.05] dark:bg-white/[0.015] dark:shadow-none",
                "hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:border-border/80 dark:hover:bg-white/[0.03] dark:hover:border-white/[0.1]",
              ].join(" ")
        }
      `}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      {/* Gradient top accent bar — TrustCard signature */}
      <div
        className={`absolute top-0 left-0 right-0 bg-gradient-to-r ${tier.accentColor} transition-opacity duration-500 ${
          tier.featured
            ? "h-[3px] opacity-50 group-hover:opacity-100"
            : "h-[2px] opacity-25 group-hover:opacity-60"
        }`}
      />

      {/* Hover glow — dark mode only, TrustCard pattern */}
      <div
        className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${tier.accentColor} opacity-0 group-hover:opacity-[0.04] rounded-full blur-[60px] transition-opacity duration-700 hidden dark:block`}
      />

      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4">
          <span className="text-[10px] font-medium tracking-wider uppercase px-2.5 py-1 rounded-full bg-primary/[0.06] dark:bg-white/[0.05] text-primary/60 dark:text-white/60 border border-primary/10 dark:border-white/[0.08]">
            {badge}
          </span>
        </div>
      )}

      {/* Card content */}
      <div className="relative p-7 sm:p-8 flex flex-col flex-1">
        {/* Tier name — text only, no icon */}
        <p className="text-[var(--text-sm)] font-medium tracking-wide uppercase text-muted-foreground dark:text-white/60 mb-5">
          {name}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[var(--text-3xl)] font-bold tracking-tight text-foreground dark:text-white">
            {price}
          </span>
          {period && (
            <span className="text-[var(--text-sm)] text-muted-foreground dark:text-white/65">
              / {period}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[var(--text-sm)] leading-relaxed mb-7 min-h-[4.5rem] text-muted-foreground dark:text-white/60">
          {desc}
        </p>

        {/* Divider */}
        <div className="h-px bg-border/40 dark:bg-white/[0.05] mb-6" />

        {/* Features */}
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] mb-4 text-muted-foreground dark:text-white/70">
          {t.featuresLabel}
        </p>
        <ul className="space-y-3 flex-1">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-[var(--text-sm)]"
            >
              <Check className="size-4 shrink-0 mt-0.5 text-primary/60 dark:text-white/65 group-hover:text-primary/60 dark:group-hover:text-white/45 transition-colors duration-300" />
              <span className="text-muted-foreground dark:text-white/60 group-hover:text-foreground/75 dark:group-hover:text-white/65 transition-colors duration-300 leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-8">
          {tier.key === "free" ? (
            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link href={`/${locale}${tier.href}`}>{cta}</Link>
            </Button>
          ) : tier.featured ? (
            <CheckoutButton
              tier={tier.key as "report" | "journey"}
              locale={locale}
              variant="gradient"
              size="lg"
              className="w-full"
            >
              {cta}
            </CheckoutButton>
          ) : (
            <CheckoutButton
              tier={tier.key as "report" | "journey"}
              locale={locale}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {cta}
            </CheckoutButton>
          )}

          {/* Satisfaction guarantee */}
          {isPaid && (
            <p className="mt-3 text-center text-[11px] text-muted-foreground dark:text-white/65">
              {t.guarantee}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
