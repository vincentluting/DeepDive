import type { CSSProperties, ReactNode } from "react";

import { ScriptCoda } from "@/components/design/meridian/script-coda";
import { cn } from "@/lib/utils";

import {
  getMonographChapterForPhase,
  getMonographProgress,
  MONOGRAPH_CHAPTERS,
  type MonographPhase,
} from "./monograph-flow";

interface QuickDiveMonographShellProps {
  phase: MonographPhase;
  t: Record<string, string>;
  title: ReactNode;
  children: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  side?: ReactNode;
  action?: ReactNode;
  questionIndex?: number;
  totalQuestions?: number;
  counterTestId?: string;
  className?: string;
  contentClassName?: string;
  spreadClassName?: string;
}

const DEPTH_STATIONS = [
  { depth: "0m", labelKey: "monographDepthSurface" },
  { depth: "200m", labelKey: "monographDepthClarity" },
  { depth: "400m", labelKey: "monographDepthDirection" },
  { depth: "600m", labelKey: "monographDepthDiscover" },
] as const;

function text(t: Record<string, string>, key: string) {
  return t[key] ?? key;
}

function getDepthIndex(phase: MonographPhase) {
  switch (phase) {
    case "intro":
      return 0;
    case "playing":
      return 1;
    case "values-intro":
    case "values-playing":
    case "avatar":
      return 2;
    case "generating":
    case "reveal":
      return 3;
  }
}

export function QuickDiveMonographShell({
  phase,
  t,
  title,
  children,
  eyebrow,
  description,
  side,
  action,
  questionIndex,
  totalQuestions,
  counterTestId,
  className,
  contentClassName,
  spreadClassName,
}: QuickDiveMonographShellProps) {
  const activeChapter = getMonographChapterForPhase(phase);
  const progress = getMonographProgress({
    phase,
    questionIndex,
    totalQuestions,
  });
  const depthIndex = getDepthIndex(phase);

  return (
    <section
      data-surface="dive"
      data-quickdive-monograph="true"
      data-phase={phase}
      className={cn("dd-quickdive-monograph", className)}
      style={
        {
          "--qd-monograph-progress": `${progress.percent}%`,
        } as CSSProperties
      }
    >
      <div className="dd-quickdive-monograph__ocean" aria-hidden="true" />

      <aside className="dd-quickdive-monograph__rail" aria-label={text(t, "title")}>
        <p className="dd-quickdive-monograph__kicker">{text(t, "title")}</p>
        <h1 className="dd-quickdive-monograph__rail-title">
          {text(t, "monographRailTitle")}
        </h1>
        <p className="dd-quickdive-monograph__rail-copy">
          {text(t, "monographRailCopy")}
        </p>

        <div className="dd-quickdive-monograph__assurance">
          <span aria-hidden="true">⊕</span>
          <span>{text(t, "monographNoRightAnswers")}</span>
        </div>

        <div className="dd-quickdive-monograph__depth">
          <p>{text(t, "monographDepthGauge")}</p>
          <div className="dd-quickdive-monograph__depth-rail">
            {DEPTH_STATIONS.map((station, index) => (
              <div
                key={station.depth}
                className={cn(
                  "dd-quickdive-monograph__depth-row",
                  index === depthIndex && "is-active",
                )}
              >
                <span className="dd-quickdive-monograph__depth-dot" />
                <span>
                  <b>{station.depth}</b> {text(t, station.labelKey)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <ScriptCoda
          text={text(t, "monographFooterCoda")}
          className="dd-quickdive-monograph__coda"
        />
      </aside>

      <div className="dd-quickdive-monograph__stage">
        <div className="dd-quickdive-monograph__topline">
          <span>
            {activeChapter.number}{" "}
            {text(t, activeChapter.shortLabelKey).toUpperCase()}
          </span>
          {totalQuestions ? (
            <span
              data-testid={counterTestId}
              className="dd-quickdive-monograph__counter"
            >
              {counterTestId === "quickdive-values-counter"
                ? `${progress.current}/${progress.total}`
                : progress.label}
            </span>
          ) : null}
        </div>
        <div className="dd-quickdive-monograph__progress" aria-hidden="true">
          <span />
        </div>

        <div
          className={cn(
            "dd-quickdive-monograph__spread",
            spreadClassName,
          )}
        >
          <div className="dd-quickdive-monograph__spine" aria-hidden="true">
            {text(t, "monographFieldNote")}
          </div>

          <div
            className={cn(
              "dd-quickdive-monograph__page dd-quickdive-monograph__page--main",
              contentClassName,
            )}
          >
            <div className="dd-quickdive-monograph__chapter-mark">
              <span>{activeChapter.number}</span>
              <span>{text(t, activeChapter.labelKey)}</span>
            </div>
            {eyebrow ? (
              <p className="dd-quickdive-monograph__eyebrow">{eyebrow}</p>
            ) : null}
            <h2 className="dd-quickdive-monograph__title">{title}</h2>
            {description ? (
              <div className="dd-quickdive-monograph__description">
                {description}
              </div>
            ) : null}
            {children}
            {action ? (
              <div className="dd-quickdive-monograph__actions">{action}</div>
            ) : null}
          </div>

          <aside className="dd-quickdive-monograph__page dd-quickdive-monograph__page--side">
            {side ?? <DefaultSidePlate t={t} />}
          </aside>
        </div>

        <nav
          className="dd-quickdive-monograph__chapters"
          aria-label={text(t, "monographChapterNav")}
        >
          {MONOGRAPH_CHAPTERS.map((chapter) => (
            <span
              key={chapter.id}
              className={cn(
                "dd-quickdive-monograph__chapter-pill",
                chapter.id === activeChapter.id && "is-active",
              )}
            >
              <b>{chapter.number}</b>
              {text(t, chapter.shortLabelKey)}
            </span>
          ))}
        </nav>
      </div>
    </section>
  );
}

function DefaultSidePlate({ t }: { t: Record<string, string> }) {
  return (
    <div className="dd-quickdive-monograph__result-plate">
      <p className="dd-quickdive-monograph__side-kicker">
        {text(t, "monographSideKicker")}
      </p>
      <div className="dd-quickdive-monograph__lighthouse" aria-hidden="true" />
      <p>{text(t, "monographSideCopy")}</p>
      <div className="dd-quickdive-monograph__chips" aria-hidden="true">
        <span>{text(t, "interests")}</span>
        <span>{text(t, "values")}</span>
      </div>
    </div>
  );
}
