"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Feather,
  MessageCircle,
  Shield,
  type LucideIcon,
} from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import type { PreviewDictionary } from "../landing-dictionaries";
import { AreaSparkline, CoachBubbles } from "../sections/landing-viz-mini";
import styles from "./sounding.module.css";

const PORTRAIT_ART = "/brand/landing-portrait-field-v3.webp";
const REPORT_ART = "/brand/landing-career-sea-chart-v3.webp";
const CHOICE_MARKS = ["Q", "D", "I"] as const;
const ACTION_SERIES = [28, 42, 50, 66, 78, 92] as const;

type Track = (source: string, targetHref?: string) => void;

/* ── 三路径选择带 ── */
export function SoundingChoiceBand({
  d,
  locale,
  onTrack,
}: {
  d: PreviewDictionary;
  locale: Locale;
  onTrack: Track;
}) {
  const cards = d.showcase.depthCards.map((item, i) => ({
    item,
    mark: CHOICE_MARKS[i] ?? CHOICE_MARKS[0],
    href:
      i === 0
        ? `/${locale}/quickdive`
        : i === 1
          ? `/${locale}/deepdive`
          : `/${locale}/immersive-dive`,
  }));

  return (
    <section className={styles.choice} aria-labelledby="sounding-choice">
      <div className={styles.choiceHead}>
        <p className={styles.compartmentNo}>
          <span className={styles.num}>00</span>
          <i className={styles.compartmentRule} aria-hidden="true" />
        </p>
        <h2 id="sounding-choice" className={styles.sectionTitle}>
          {d.showcase.depthChoice.title}
        </h2>
        <p className={styles.sectionLead}>{d.showcase.depthChoice.desc}</p>
      </div>
      <div className={styles.choiceCards}>
        {cards.map(({ item, mark, href }, i) => (
          <Link
            key={item.t}
            href={href}
            className={styles.choiceCard}
            onClick={() => onTrack(`depth_card_${i + 1}`, href)}
          >
            <span className={styles.choiceMark} aria-hidden="true">
              {mark}
            </span>
            <span className={styles.choiceTime}>{item.tm}</span>
            <strong className={styles.choiceName}>{item.t}</strong>
            <span className={styles.choiceDesc}>{item.d}</span>
            <ArrowRight className={styles.choiceArrow} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── 4 编号章节 ── */
function Chapter({
  index,
  depthTag,
  title,
  lead,
  linkHref,
  linkLabel,
  LinkIcon = ArrowRight,
  anchorId,
  source,
  onTrack,
  children,
}: {
  index: string;
  depthTag: string;
  title: string;
  lead: string;
  linkHref: string;
  linkLabel: string;
  LinkIcon?: LucideIcon;
  anchorId?: string;
  source: string;
  onTrack: Track;
  children: React.ReactNode;
}) {
  return (
    <section
      className={styles.chapter}
      id={anchorId}
      data-depth-section="photic"
      aria-labelledby={`sounding-ch-${index}`}
    >
      <div className={styles.chapterGrid}>
        <div className={styles.chapterHead}>
          <p className={styles.compartmentNo}>
            <span className={styles.num}>{index}</span>
            <i className={styles.compartmentRule} aria-hidden="true" />
          </p>
          <p className={styles.chapterDepth}>{depthTag}</p>
          <h2 id={`sounding-ch-${index}`} className={styles.chapterTitle}>
            {title}
          </h2>
          <p className={styles.chapterLead}>{lead}</p>
          <Link
            href={linkHref}
            className={styles.chapterLink}
            onClick={() => onTrack(source, linkHref)}
          >
            {linkLabel}
            <LinkIcon aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.chapterViz}>{children}</div>
      </div>
    </section>
  );
}

function ChapterArt({
  src,
  kind,
}: {
  src: string;
  kind: "portrait" | "report";
}) {
  return (
    <div className={styles.chapterArt} data-kind={kind}>
      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width: 760px) 100vw, 52vw"
        className={styles.chapterArtImg}
      />
    </div>
  );
}

export function SoundingChapters({
  d,
  locale,
  onTrack,
}: {
  d: PreviewDictionary;
  locale: Locale;
  onTrack: Track;
}) {
  const meter = d.showcase.meter;
  const coach = d.showcase.instruments.coach;

  return (
    <div className={styles.chapters}>
      <Chapter
        index="01"
        depthTag={`200m · ${meter[1] ?? ""}`}
        title={d.features.items[3].t}
        lead={d.features.items[3].d}
        linkHref={`/${locale}/profile`}
        linkLabel={d.footer.nav[1] ?? d.features.items[3].t}
        anchorId="depth-200"
        source="compartment_01_profile"
        onTrack={onTrack}
      >
        <ChapterArt src={PORTRAIT_ART} kind="portrait" />
      </Chapter>

      <Chapter
        index="02"
        depthTag={`400m · ${meter[2] ?? ""}`}
        title={d.features.items[0].t}
        lead={d.features.items[0].d}
        linkHref={`/${locale}/reports`}
        linkLabel={d.footer.nav[0] ?? d.features.items[0].t}
        source="compartment_02_report"
        onTrack={onTrack}
      >
        <ChapterArt src={REPORT_ART} kind="report" />
      </Chapter>

      <Chapter
        index="03"
        depthTag={`600m · ${meter[3] ?? ""}`}
        title={d.features.items[1].t}
        lead={d.features.items[1].d}
        linkHref={`/${locale}/action-hub`}
        linkLabel={d.features.items[1].t}
        anchorId="depth-400"
        source="compartment_03_action"
        onTrack={onTrack}
      >
        <AreaSparkline
          series={ACTION_SERIES}
          height={150}
          className={styles.chapterSpark}
        />
      </Chapter>

      <Chapter
        index="04"
        depthTag={`600m · ${meter[3] ?? ""}`}
        title={d.features.items[2].t}
        lead={d.features.items[2].d}
        linkHref={`/${locale}/coaching`}
        linkLabel={d.features.items[2].t}
        LinkIcon={MessageCircle}
        source="compartment_04_coach"
        onTrack={onTrack}
      >
        <CoachBubbles
          turns={[
            { role: "assistant", text: coach.user },
            { role: "user", text: coach.reply },
          ]}
          className={styles.chapterCoach}
        />
      </Chapter>
    </div>
  );
}

/* ── 信任墙 ── */
const TRIO_ICONS: LucideIcon[] = [Shield, BadgeCheck, Feather];

export function SoundingTrust({ d }: { d: PreviewDictionary }) {
  const descs = [d.privacy.note, d.science.foundations, d.glassCard.subtitle];

  return (
    <section
      className={styles.trust}
      data-depth-section="twilight"
      aria-labelledby="sounding-trust"
    >
      <p className={styles.compartmentNo}>
        <span className={styles.num}>05</span>
        <i className={styles.compartmentRule} aria-hidden="true" />
      </p>
      <h2 id="sounding-trust" className={styles.sectionTitle}>
        {d.panels.privacyHeading}
      </h2>
      <div className={styles.trustTrio}>
        {d.panels.trio.map((title, i) => {
          const Icon = TRIO_ICONS[i] ?? Shield;
          return (
            <div key={title} className={styles.trustCol}>
              <span className={styles.trustSeal} aria-hidden="true">
                <Icon />
              </span>
              <h3 className={styles.trustColTitle}>{title}</h3>
              <p className={styles.trustColDesc}>{descs[i]}</p>
            </div>
          );
        })}
      </div>
      <p className={styles.trustFoot}>{d.science.affiliation}</p>
    </section>
  );
}

/* ── Final CTA ── */
export function SoundingFinalCta({
  d,
  ctaHref,
  isReturning,
  onTrack,
}: {
  d: PreviewDictionary;
  ctaHref: string;
  isReturning: boolean;
  onTrack: Track;
}) {
  return (
    <section
      className={styles.finalCta}
      id="depth-600"
      data-depth-section="abyss"
      aria-labelledby="sounding-final"
    >
      <p className={styles.finalQuote}>{d.breathQuote}</p>
      <i className={styles.finalRule} aria-hidden="true" />
      <h2 id="sounding-final" className={styles.finalHeading}>
        {d.cta.heading}
        {d.cta.headingAccent ? (
          <span className={styles.finalAccent}>{d.cta.headingAccent}</span>
        ) : null}
      </h2>
      <p className={styles.finalDesc}>{d.cta.description}</p>
      <Link
        href={ctaHref}
        className={`${styles.btn} ${styles.btnPrimary} ${styles.finalBtn}`}
        onClick={() => onTrack("final_cta")}
      >
        <Compass aria-hidden="true" />
        {isReturning ? d.cta.buttonReturning : d.cta.button}
      </Link>
      <p className={styles.note}>
        {isReturning ? d.cta.noteReturning : d.cta.note}
      </p>
      <div className={styles.finalCoda}>
        <p className={styles.codaLine}>{d.panels.coda.line}</p>
        <p className={styles.codaSub}>{d.panels.coda.sub}</p>
      </div>
    </section>
  );
}

/* ── Footer ── */
export function SoundingFooter({ d }: { d: PreviewDictionary }) {
  const track = [...d.archetypes.marquee, ...d.archetypes.marquee];

  return (
    <footer className={styles.footer} data-depth-section="surfacing">
      <div className={styles.footerHead}>
        <span className={styles.footerSeal} aria-hidden="true">
          <Compass />
        </span>
        <p className={styles.footerTagline}>
          <strong>{d.footer.tagline}</strong>
          <span>{d.privacy.note}</span>
        </p>
      </div>
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {track.map((item, i) => (
            <span key={`${item}-${i}`}>{item}</span>
          ))}
        </div>
      </div>
      <p className={styles.footerMotto}>{d.footer.motto}</p>
    </footer>
  );
}
