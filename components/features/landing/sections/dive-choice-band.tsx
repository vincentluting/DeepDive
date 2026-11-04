"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import type { PreviewDictionary } from "../landing-dictionaries";

const DEPTH_MARKS = ["Q", "D", "I"] as const;

export function DiveChoiceBand({
  d,
  locale,
  isReturning,
  isLoggedIn,
  onTrack,
}: {
  d: PreviewDictionary;
  locale: Locale;
  isReturning: boolean;
  isLoggedIn: boolean;
  onTrack: (source: string, targetHref?: string) => void;
}) {
  void isReturning;
  void isLoggedIn;

  const cards = d.showcase.depthCards.map((item, index) => ({
    item,
    mark: DEPTH_MARKS[index] ?? DEPTH_MARKS[0],
    href:
      index === 0
        ? `/${locale}/quickdive`
        : index === 1
          ? `/${locale}/deepdive`
          : `/${locale}/immersive-dive`,
  }));

  return (
    <section
      className="dd-showcase-depth-band"
      aria-labelledby="landing-depth-choice"
    >
      <div className="dd-showcase-depth-intro">
        <h2 id="landing-depth-choice">{d.showcase.depthChoice.title}</h2>
        <p>{d.showcase.depthChoice.desc}</p>
      </div>
      <div className="dd-showcase-depth-cards">
        {cards.map(({ item, href, mark }, index) => (
          <Link
            key={item.t}
            href={href}
            className="dd-showcase-depth-card"
            onClick={() => onTrack(`depth_card_${index + 1}`, href)}
          >
            <span className="dd-depth-choice-mark" aria-hidden="true">
              {mark}
            </span>
            <span className="dd-depth-choice-copy">
              <strong>{item.t}</strong>
              <small>{item.tm}</small>
              <em>{item.d}</em>
            </span>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}
      </div>
      <div className="dd-showcase-journey-cell" aria-label={d.journey.label}>
        <span>{d.journey.label}</span>
        <strong>13%</strong>
        <i className="dd-showcase-journey-ring" aria-hidden="true">
          <span />
        </i>
      </div>
    </section>
  );
}
