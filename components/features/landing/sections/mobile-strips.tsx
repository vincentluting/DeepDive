"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, Sparkles } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import type { PreviewDictionary } from "../landing-dictionaries";
import { LandingSeal } from "../landing-shared";

export function MobileOutcomeStrip({
  d,
  locale,
  onTrack,
}: {
  d: PreviewDictionary;
  locale: Locale;
  onTrack?: (source: string, targetHref: string) => void;
}) {
  const outcomes = d.features.items.slice(0, 3).map((item, index) => ({
    item,
    href:
      index === 0
        ? `/${locale}/reports`
        : index === 1
          ? `/${locale}/action-hub`
          : `/${locale}/coaching`,
    Icon: index === 0 ? BookOpen : index === 1 ? Sparkles : MessageCircle,
    source:
      index === 0
        ? "mobile_outcome_report"
        : index === 1
          ? "mobile_outcome_action"
          : "mobile_outcome_coach",
  }));

  return (
    <section
      className="dd-mobile-outcome-strip"
      aria-labelledby="landing-mobile-outcomes"
    >
      <div className="dd-mobile-outcome-heading">
        <p className="dd-landing-eyebrow">{d.features.label}</p>
        <h2 id="landing-mobile-outcomes">
          {d.features.heading}
          {d.features.headingAccent && (
            <>
              <br />
              <span>{d.features.headingAccent}</span>
            </>
          )}
        </h2>
      </div>
      <div className="dd-mobile-outcome-list">
        {outcomes.map(({ item, href, Icon, source }, index) => (
          <Link
            key={item.t}
            href={href}
            className="dd-mobile-outcome-card"
            onClick={onTrack ? () => onTrack(source, href) : undefined}
          >
            <LandingSeal>
              <Icon />
            </LandingSeal>
            <span>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{item.t}</strong>
              <em>{item.d}</em>
            </span>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MobileStickyDiveCta({
  d,
  href,
  isReturning,
  onTrack,
}: {
  d: PreviewDictionary;
  href: string;
  isReturning: boolean;
  onTrack: () => void;
}) {
  return (
    <aside className="dd-mobile-sticky-cta" aria-label={d.hero.cta}>
      <Link href={href} onClick={onTrack}>
        <span>
          <strong>{isReturning ? d.hero.ctaReturning : d.hero.cta}</strong>
          <small>
            {isReturning ? d.hero.ctaReturningNote : d.hero.ctaNote}
          </small>
        </span>
        <ArrowRight aria-hidden="true" />
      </Link>
    </aside>
  );
}
