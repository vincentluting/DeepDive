// ============================================================
// Report Dossier Cover — premium report opening surface
//
// Renders a quiet editorial cover for the Deep Dive report before the guided
// card flow, using report data distilled by report-dossier-cover-model.
// ============================================================

"use client";

import type { CSSProperties } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { CareerReport, ReportDict } from "@/lib/types";
import {
  useActiveSection,
  smoothScrollToId,
} from "@/lib/hooks/use-active-section";
import { buildReportDossierCoverModel } from "./report-dossier-cover-model";

interface ReportDossierCoverProps {
  report: CareerReport;
  locale: Locale;
  t: ReportDict;
}

export function ReportDossierCover({
  report,
  locale,
  t,
}: ReportDossierCoverProps) {
  const model = buildReportDossierCoverModel(report, locale, t);

  // Drive the rail nav from the sections the cover actually renders. The nav
  // previously hardcoded 5 labels (Identity/Directions/Evidence/Drains/
  // Experiments) while the cover only emits 3 section articles — Identity and
  // Directions live in the hero, not as separate sections — so two nav items
  // were dead anchors and the labels didn't match their targets. Deriving from
  // `model.sections` keeps labels, numbers and anchors in lockstep.
  const sectionIds = model.sections.map(
    (s) => `report-dossier-section-${Number(s.number)}`,
  );
  const activeId = useActiveSection(sectionIds);

  return (
    <section
      className="report-dossier-cover"
      aria-labelledby="report-dossier-cover-title"
    >
      <aside className="report-dossier-cover__rail">
        <p>{t.cinematicSurface}</p>
        <h2>{t.cinematicRailTitle}</h2>
        <span>{t.cinematicRailCopy}</span>
        <nav aria-label={t.cinematicRailTitle}>
          {model.sections.map((section) => {
            const targetId = `report-dossier-section-${Number(section.number)}`;
            const isActive = activeId === targetId;
            return (
              <a
                key={section.number}
                href={`#${targetId}`}
                aria-current={isActive ? "location" : undefined}
                className={isActive ? "is-active" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  smoothScrollToId(targetId);
                }}
              >
                <span>{section.label}</span>
                <b>{section.number}</b>
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="report-dossier-cover__main">
        <header className="report-dossier-cover__header">
          <p>{t.cinematicRoute}</p>
          <h1 id="report-dossier-cover-title">{model.title}</h1>
          <span>{model.subtitle}</span>
        </header>

        <div className="report-dossier-cover__sheet">
          <article className="report-dossier-cover__identity">
            <p>{model.leadLabel}</p>
            <h2>{model.archetypeLabel}</h2>
            {model.archetypeTagline ? (
              <span>{model.archetypeTagline}</span>
            ) : null}
            <div className="report-dossier-cover__direction">
              <small>{model.primaryDirection.title}</small>
              <strong>{model.primaryDirection.match}%</strong>
            </div>
          </article>

          <div className="report-dossier-cover__directions">
            <p>{t.cinematicDirections}</p>
            <ol>
              {model.topDirections.map((dir) => (
                <li key={dir.rank}>
                  <b aria-hidden="true">{String(dir.rank).padStart(2, "0")}</b>
                  <span>{dir.title}</span>
                  <strong>{dir.match}%</strong>
                </li>
              ))}
            </ol>
          </div>

          <aside className="report-dossier-cover__metrics">
            <p className="report-dossier-cover__metrics-eyebrow">
              {t.cinematicFit}
            </p>
            {model.metrics.map((metric) => (
              <div key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}%</strong>
                <i aria-hidden="true">
                  <b
                    style={
                      {
                        "--report-dossier-meter": `${metric.value}%`,
                      } as CSSProperties
                    }
                  />
                </i>
              </div>
            ))}
          </aside>
        </div>

        <div className="report-dossier-cover__sections">
          {model.sections.map((section) => (
            <article
              key={section.number}
              id={`report-dossier-section-${Number(section.number)}`}
            >
              <p>
                <span>{section.number}</span>
                {section.label}
              </p>
              <div>{section.body}</div>
            </article>
          ))}
        </div>

        <footer className="report-dossier-cover__proof">
          {model.proofPoints.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </footer>
      </div>
    </section>
  );
}
