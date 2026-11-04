"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, isValidLocale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { PersonalProfileData } from "@/lib/types";
import { ArchetypeAvatarImage } from "@/components/quickdive/archetype-avatar";
import { fallbackGenderForCode } from "@/components/quickdive/archetype-avatar-asset";
import {
  buildMonographMuseumModel,
  type MonographMuseumModel,
} from "./monograph-museum-model";

interface MuseumChapterLink {
  id: string;
  label: string;
  numeral?: string;
}

interface MonographMuseumHeroProps {
  profile: PersonalProfileData;
  locale: string;
  mintedDate: string;
  reportId?: string | null;
  savedAvatarGender?: "male" | "female" | null;
  chapters: MuseumChapterLink[];
  /** Active chapter id from the parent scrollspy; highlights the matching
   *  nav link as the reader scrolls (falls back to the first chapter). */
  activeChapterId?: string;
}

export function MonographMuseumHero({
  profile,
  locale,
  mintedDate,
  reportId,
  savedAvatarGender = null,
  chapters,
  activeChapterId,
}: MonographMuseumHeroProps) {
  const loc = resolveLocale(locale);
  const t = getDictionaryClient(
    (loc === "zh" ? "zh" : "en") as "en" | "zh",
  ).profile;
  const model = buildMonographMuseumModel({
    profile,
    locale: loc,
    mintedDate,
    evidenceBandLabels: {
      pattern: String(t.monographEvidencePattern),
      style: String(t.monographEvidenceStyle),
      values: String(t.monographEvidenceValues),
    },
  });
  const reportHref = reportId
    ? `/${locale}/report/${reportId}`
    : "#profile-report-cta";
  const reportLabel = reportId
    ? String(t.viewReport)
    : String(t.reportCtaGenerateDirect ?? t.templateGenerateReport);

  return (
    <section
      data-slot="monograph-museum-hero"
      className="dd-monograph-museum"
      aria-labelledby="monograph-museum-title"
    >
      <aside
        className="dd-monograph-museum__rail"
        aria-label={t.chapterNavAria}
      >
        <div>
          <p className="dd-monograph-museum__kicker">{t.monographEyebrow}</p>
          <h1 id="monograph-museum-title">{t.tabMyStory}</h1>
          <p className="dd-monograph-museum__intro">{t.tabStorySubtitle}</p>
        </div>

        <SignaturePlate model={model} />

        <nav className="dd-monograph-museum__nav">
          {chapters.map((chapter, index) => {
            const active = activeChapterId
              ? chapter.id === activeChapterId
              : index === 0;
            return (
              <a
                key={chapter.id}
                href={`#${chapter.id}`}
                aria-current={active ? "location" : undefined}
                className={active ? "is-active" : undefined}
              >
                <span>{chapter.label}</span>
                <b>{String(index + 1).padStart(2, "0")}</b>
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="dd-monograph-museum__main">
        <header className="dd-monograph-museum__headline">
          <p className="dd-monograph-museum__route">/profile</p>
          <h2>{model.archetypeName}</h2>
          <p>{model.tagline || model.quote}</p>
        </header>

        <div className="dd-monograph-museum__stage">
          <article className="dd-monograph-museum__title-page">
            <p className="dd-monograph-museum__kicker">{t.monographEyebrow}</p>
            <blockquote>{model.quote}</blockquote>
            <div className="dd-monograph-museum__rule" aria-hidden="true" />
            <dl className="dd-monograph-museum__meta">
              <div>
                <dt>{t.impressionLabel}</dt>
                <dd>{model.meta.impression.slice(0, 12)}</dd>
              </div>
              <div>
                <dt>{String(t.mintedOn).replace("{date}", "")}</dt>
                <dd>{model.meta.minted}</dd>
              </div>
            </dl>
          </article>

          <aside className="dd-monograph-museum__artifact">
            <div className="dd-monograph-museum__seal" aria-hidden="true">
              {model.archetypeInitial}
            </div>
            <div className="dd-monograph-museum__avatar">
              <ArchetypeAvatarImage
                archetypeCode={model.archetypeCode}
                variant="badge"
                gender={
                  savedAvatarGender ??
                  fallbackGenderForCode(model.archetypeCode)
                }
                label={model.archetypeName}
                priority
              />
              <div>
                <p>{model.archetypeName}</p>
                <span>{t.personalProfile}</span>
              </div>
            </div>
            <ul className="dd-monograph-museum__anchors">
              {model.anchors.map((anchor) => (
                <li key={anchor}>{anchor}</li>
              ))}
            </ul>
            <Link className="dd-monograph-museum__cta" href={reportHref}>
              <span>{reportLabel}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </aside>
        </div>

        <section
          className="dd-monograph-museum__evidence"
          aria-label={t.evidenceSectionTitle}
        >
          {model.evidenceBands.map((band) => (
            <article key={band.id} className="dd-monograph-museum__band">
              <p className="dd-monograph-museum__band-label">{band.label}</p>
              <b className="dd-monograph-museum__band-value">
                {band.value}
                <i aria-hidden="true">%</i>
              </b>
              <span className="dd-monograph-museum__meter" aria-hidden="true">
                <i style={{ width: `${band.value}%` } as CSSProperties} />
              </span>
              <p className="dd-monograph-museum__band-caption">
                {t.evidenceConfidenceCaption}
              </p>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}

function SignaturePlate({ model }: { model: MonographMuseumModel }) {
  return (
    <div className="dd-monograph-museum__plate">
      <span aria-hidden="true">{model.archetypeInitial}</span>
      <div>
        <p>{model.archetypeName}</p>
        <small>{model.archetypeCode}</small>
      </div>
    </div>
  );
}

function resolveLocale(locale: string): Locale {
  return isValidLocale(locale) ? locale : defaultLocale;
}
