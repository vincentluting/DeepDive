// ============================================================
// Quick Report Dossier — premium first-signal report surface
//
// Replaces the narrow result replay with a calmer editorial report that keeps
// Quick Dive fast while matching the premium Deep Dive visual language.
// ============================================================

"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { type Locale, toDateLocale } from "@/lib/i18n/config";
import type { QuickDiveResultData } from "./quickdive-data";
import {
  buildQuickReportDossierModel,
  type QuickReportDossierDict,
} from "./quick-report-dossier-model";

interface QuickReportDossierProps {
  result: QuickDiveResultData;
  locale: string;
  createdAt: string;
  dict: QuickReportDossierDict;
  reportId: string;
}

export function QuickReportDossier({
  result,
  locale,
  createdAt,
  dict,
  reportId,
}: QuickReportDossierProps) {
  const loc = locale as Locale;
  const model = buildQuickReportDossierModel({
    result,
    locale,
    createdAt,
    dict,
  });
  const generatedAt = new Date(model.generatedAt).toLocaleDateString(
    toDateLocale(loc),
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <section
      className="quick-report-dossier"
      aria-labelledby={`quick-report-dossier-${reportId}`}
    >
      <aside className="quick-report-dossier__meta">
        <p>{dict.quickDiveKicker ?? dict.firstSignal}</p>
        <dl>
          <div>
            <dt>{dict.timeSpentLabel ?? model.generatedLabel}</dt>
            <dd>{dict.fiveMin}</dd>
          </div>
          <div>
            <dt>{dict.questionsAnsweredLabel ?? model.generatedLabel}</dt>
            <dd>{dict.thirtyQuestions}</dd>
          </div>
          <div>
            <dt>{model.generatedLabel}</dt>
            <dd>{generatedAt}</dd>
          </div>
        </dl>
      </aside>

      <div className="quick-report-dossier__main">
        <header className="quick-report-dossier__header">
          <p>{dict.firstSignal}</p>
          <h1 id={`quick-report-dossier-${reportId}`}>{model.title}</h1>
          <span>{dict.quickDossierSubtitle}</span>
        </header>

        <div className="quick-report-dossier__sheet">
          <article className="quick-report-dossier__identity">
            <p>{model.identityLabel}</p>
            {model.identityTagline ? <h2>{model.identityTagline}</h2> : null}
            <span>{model.summary}</span>
          </article>

          <div
            className="quick-report-dossier__field"
            aria-label={dict.interestField}
          >
            <div className="quick-report-dossier__field-map" aria-hidden="true">
              {model.axes.map((axis, index) => (
                <i
                  key={axis.id}
                  style={
                    {
                      "--quick-axis-index": index,
                      "--quick-axis-value": axis.value,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <div className="quick-report-dossier__axes">
              {model.axes.map((axis) => (
                <div key={axis.id}>
                  <span>{axis.label}</span>
                  <strong>{axis.value}%</strong>
                  <b aria-hidden="true">
                    <i
                      style={
                        {
                          "--quick-axis-meter": `${axis.value}%`,
                        } as CSSProperties
                      }
                    />
                  </b>
                </div>
              ))}
            </div>
          </div>

          <aside className="quick-report-dossier__signals">
            <p>{dict.topSignals}</p>
            {model.topSignals.map((signal, index) => (
              <div key={signal.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{signal.label}</strong>
                <i aria-hidden="true">
                  <b
                    style={
                      {
                        "--quick-signal-meter": `${signal.value}%`,
                      } as CSSProperties
                    }
                  />
                </i>
              </div>
            ))}
          </aside>
        </div>

        <div className="quick-report-dossier__lower">
          <article>
            <p>{dict.energySources}</p>
            {model.topSignals.slice(0, 2).map((signal) => (
              <span key={signal.label}>{signal.label}</span>
            ))}
          </article>
          <article>
            <p>{dict.frictionSignals}</p>
            {model.drainSignals.map((signal) => (
              <span key={signal.label}>{signal.label}</span>
            ))}
          </article>
          <article>
            <p>{dict.suggestedNextDive}</p>
            <span>{dict.deepDiveCtaDesc}</span>
            <Link href={`/${locale}/deepdive`}>
              {dict.startDeepDive}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </article>
        </div>

        <footer className="quick-report-dossier__timeline">
          <span>{dict.whatChanged}</span>
          <i aria-hidden="true" />
          <b>{dict.firstSignal}</b>
        </footer>
      </div>
    </section>
  );
}
