"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import type { PreviewDictionary } from "../landing-dictionaries";
import styles from "./sounding.module.css";

/**
 * Sounding hero — chart-room editorial. Numbered compartment eyebrow, Fraunces
 * display, sea/brass CTAs, real product facts on a hairline, ritual descent
 * cue, one drop of phosphor. All copy via real i18n (d.hero / d.showcase).
 */
export function SoundingHero({
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
  const profilePath = `/${locale}/profile`;

  return (
    <section
      className={styles.hero}
      id="depth-0"
      data-depth-section="surface"
      aria-labelledby="sounding-hero-title"
    >
      <p className={styles.eyebrow}>
        <span className={styles.num}>00</span>
        {d.hero.badge}
      </p>

      <h1 id="sounding-hero-title" className={styles.display}>
        {d.hero.heading}
        {d.hero.headingAccent ? (
          <span className={styles.displayAccent}>{d.hero.headingAccent}</span>
        ) : null}
      </h1>

      <p className={styles.lead}>{d.hero.subtitle}</p>

      <div className={styles.actions}>
        <Link
          href={ctaHref}
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => onTrack("hero_cta")}
        >
          {isReturning ? d.hero.ctaReturning : d.hero.cta}
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link
          href={profilePath}
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={() => onTrack("hero_profile_preview", profilePath)}
        >
          <Play aria-hidden="true" />
          {d.hero.firstDescentRitual}
        </Link>
      </div>

      <p className={styles.note}>
        {isReturning && !isLoggedIn ? d.hero.ctaReturningNote : d.hero.ctaNote}
      </p>

      <p className={styles.facts} aria-label={d.science.label}>
        {d.showcase.stats.map((stat) => (
          <span key={stat.label}>
            <b>{stat.value}</b> {stat.label}
          </span>
        ))}
      </p>

      <div className={styles.ritual}>
        <i className={styles.ritualLine} aria-hidden="true" />
        <Link
          href={quickDivePath}
          className={styles.ritualLink}
          onClick={() => onTrack("hero_ritual", quickDivePath)}
        >
          {d.hero.ritualLink}
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </section>
  );
}
