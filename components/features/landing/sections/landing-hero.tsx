"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import type { PreviewDictionary } from "../landing-dictionaries";
import { CtaLink } from "../landing-shared";
import { StaggerWords } from "../stagger-words";
import { HeroDashboard } from "./hero-dashboard";

/** Real product facts on one hairline — no seals, no vanity metrics. */
export function HeroFactLine({ d }: { d: PreviewDictionary }) {
  return (
    <p className="dd-landing-factline" aria-label={d.science.label}>
      {d.showcase.stats.map((stat) => (
        <span key={stat.label}>
          <b>{stat.value}</b> {stat.label}
        </span>
      ))}
    </p>
  );
}

export function LandingHero({
  d,
  locale,
  ctaHref,
  isReturning,
  isLoggedIn,
  onTrack,
}: {
  d: PreviewDictionary;
  locale: Locale;
  ctaHref: string;
  isReturning: boolean;
  isLoggedIn: boolean;
  onTrack: (source: string, targetHref?: string) => void;
}) {
  const quickDivePath = `/${locale}/quickdive`;

  return (
    <section
      className="dd-landing-hero dd-showcase-hero"
      aria-labelledby="landing-hero"
      id="depth-0"
      data-depth-section="surface"
    >
      <div className="dd-hero-light-field" aria-hidden="true">
        <Image
          src="/brand/landing-healing-hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="dd-hero-light-image"
        />
      </div>
      <div className="dd-landing-hero-inner">
        <div className="dd-landing-copy dd-landing-hero-copy">
          <p
            className="dd-landing-eyebrow dd-hero-rise"
            style={{ "--rise-delay": "0ms" } as React.CSSProperties}
          >
            {d.hero.badge}
          </p>
          <h1 id="landing-hero" className="dd-landing-display">
            <StaggerWords text={d.hero.heading} locale={locale} />
            {d.hero.headingAccent && (
              <>
                <br />
                <span
                  className="dd-landing-display-muted dd-hero-rise"
                  style={{ "--rise-delay": "520ms" } as React.CSSProperties}
                >
                  {d.hero.headingAccent}
                </span>
              </>
            )}
          </h1>
          <p
            className="dd-landing-lead dd-hero-rise"
            style={{ "--rise-delay": "680ms" } as React.CSSProperties}
          >
            {d.hero.subtitle}
          </p>
          <div
            className="dd-landing-actions dd-hero-rise"
            style={{ "--rise-delay": "820ms" } as React.CSSProperties}
          >
            <CtaLink
              href={ctaHref}
              onClick={() => onTrack("hero_cta")}
            >
              {isReturning ? d.hero.ctaReturning : d.hero.cta}
            </CtaLink>
            <CtaLink
              href={`/${locale}/profile`}
              variant="secondary"
              leadingIcon={Play}
              showTrailing={false}
              onClick={() =>
                onTrack("hero_profile_preview", `/${locale}/profile`)
              }
            >
              {d.hero.firstDescentRitual}
            </CtaLink>
          </div>
          <p
            className="dd-landing-note dd-hero-rise"
            style={{ "--rise-delay": "940ms" } as React.CSSProperties}
          >
            {isReturning && !isLoggedIn
              ? d.hero.ctaReturningNote
              : d.hero.ctaNote}
          </p>
          <div
            className="dd-hero-rise"
            style={{ "--rise-delay": "1040ms" } as React.CSSProperties}
          >
            <HeroFactLine d={d} />
          </div>
        </div>
        <div
          className="dd-hero-product-stage dd-hero-rise"
          style={{ "--rise-delay": "920ms" } as React.CSSProperties}
        >
          <HeroDashboard d={d} />
        </div>
      </div>

      {/* Ritual invitation — hairline, italic link, descent cue */}
      <div
        className="dd-hero-ritual dd-hero-rise"
        style={{ "--rise-delay": "1100ms" } as React.CSSProperties}
      >
        <i className="dd-hero-ritual-line" aria-hidden="true" />
        <Link
          href={quickDivePath}
          className="dd-hero-ritual-link"
          onClick={() => onTrack("hero_ritual", quickDivePath)}
        >
          {d.hero.ritualLink}
          <span aria-hidden="true"> →</span>
        </Link>
        <span className="dd-descent-cue" aria-hidden="true">
          <i />
        </span>
      </div>
    </section>
  );
}
