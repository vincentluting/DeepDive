"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { ClassicExploreIntro } from "./classic-explore-intro";
import { ClassicExploreQuestion } from "./classic-explore-question";
import { ValuesIntro } from "./values-intro";
import { ValuesQuestion } from "./values-question";
import { AvatarGenderQuestion } from "./avatar-gender-question";
import { useAvatarGender } from "./use-avatar-gender";
import type { AvatarGender } from "./use-explore-engine";
import { UnifiedExploreResult } from "./unified-explore-result";
import { OpenWaterReveal } from "./open-water-reveal";
import { PaperPivotOverlay } from "./paper-pivot-overlay";
import { QuickDiveMonographShell } from "./quickdive-monograph-shell";
import { QUESTIONS } from "./quickdive-data";
import { BackToExplore } from "@/components/layout/back-to-explore";
import { useExploreEngine } from "./use-explore-engine";
import { analytics } from "@/lib/analytics/client";
import { getClientId } from "@/lib/auth/client-id";
import { sendAnalyticsSafely } from "@/lib/analytics/send-safely";

interface ClassicExploreShellProps {
  locale: Locale;
}

// RIASEC dimension data for the meaning-making generating step
const RIASEC_DIMS = [
  { key: "R", color: "#6B8E5B", zh: "\u73b0\u5b9e", en: "Realistic" },
  { key: "I", color: "#4A8BAE", zh: "\u63a2\u7a76", en: "Investigative" },
  { key: "A", color: "#C47A5A", zh: "\u827a\u672f", en: "Artistic" },
  { key: "S", color: "#5A9E7A", zh: "\u793e\u4f1a", en: "Social" },
  { key: "E", color: "#B88A4A", zh: "\u4f01\u4e1a", en: "Enterprising" },
  { key: "C", color: "#7A7A9E", zh: "\u5e38\u89c4", en: "Conventional" },
] as const;

export function ClassicExploreShell({ locale }: ClassicExploreShellProps) {
  const t = getDictionaryClient(locale).quickDive as Record<string, string>;

  const engine = useExploreEngine(locale, "classic");
  const {
    phase,
    setPhase,
    qIndex,
    result,
    genStep,
    savedReportId,
    totalQ,
    genSteps,
    recordAnswer,
    advanceQuestion,
    goBack,
    handleRedive,
    waitForSave,
  } = engine;

  // Reveal + Paper Pivot (Surface hand-off) state
  const [revealDone, setRevealDone] = useState(false);
  const [paperPivotDone, setPaperPivotDone] = useState(false);

  // Reset ritual state when engine resets to intro (re-dive)
  useEffect(() => {
    if (phase === "intro") {
      setRevealDone(false);
      setPaperPivotDone(false);
    }
  }, [phase]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const raf = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    const soon = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 0);
    const late = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 80);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(soon);
      window.clearTimeout(late);
    };
  }, [phase]);

  // Start quiz immediately - no priming airlock
  const handleIntroStart = useCallback(() => {
    analytics
      .track("quickdive_started", {
        exploreMode: "classic",
        language: locale,
        clientId: getClientId(),
      })
      .catch(() => {});
    setPhase("playing");
  }, [locale, setPhase]);

  // Track playing start time for abandon timeSpentMs
  const playStartRef = useRef(0);
  useEffect(() => {
    if (phase === "playing" && playStartRef.current === 0) {
      playStartRef.current = Date.now();
    }
    if (phase === "intro") playStartRef.current = 0;
  }, [phase]);

  // Mutual exclusion: once completed fires, abandon must not fire
  const hasCompletedRef = useRef(false);
  useEffect(() => {
    if (phase === "result") hasCompletedRef.current = true;
  }, [phase]);

  // Track abandonment when user leaves mid-quiz
  useEffect(() => {
    if (phase !== "playing") return;

    const sendAbandon = () => {
      if (hasCompletedRef.current) return; // completed already — don't double-count
      const today = new Date().toISOString().slice(0, 10);
      sendAnalyticsSafely("/api/analytics/event", {
        event: "quickdive_abandoned",
        clientId: getClientId(),
        idempotencyKey: `qd_abandon:${getClientId()}:classic:${today}`,
        metadata: {
          locale,
          exploreMode: "classic",
          lastQuestionIndex: qIndex,
          questionsAnswered: qIndex,
          totalQuestions: totalQ,
          completionRate: Math.round((qIndex / totalQ) * 100),
          timeSpentMs:
            playStartRef.current > 0
              ? Date.now() - playStartRef.current
              : undefined,
        },
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendAbandon();
      }
    };

    window.addEventListener("beforeunload", sendAbandon);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", sendAbandon);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [phase, qIndex, totalQ, locale]);

  const trackEvent = useCallback(
    (event: string, metadata: Record<string, unknown>) => {
      try {
        fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event,
            clientId: getClientId(),
            metadata,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* non-critical */
      }
    },
    [],
  );

  const handleAnswer = useCallback(
    (value: 0 | 1 | 2 | 3 | 4) => {
      recordAnswer(value);
      advanceQuestion();
    },
    [recordAnswer, advanceQuestion],
  );

  const handlePaperPivotComplete = useCallback(() => {
    setPaperPivotDone(true);
    trackEvent("quickdive_paper_pivot_completed", {
      locale,
      exploreMode: "classic",
    });
  }, [trackEvent, locale]);

  // Intro / playing / reveal are single-viewport stages and benefit from
  // overflow clipping (OpenWaterReveal particles etc). The Revelation result
  // spread is a multi-chapter scroll, so once we've handed off we must release
  // the clip or the page becomes un-scrollable.
  const isResultSurface =
    phase === "result" && result && revealDone && paperPivotDone;

  return (
    <div
      className="w-full relative"
      style={{
        minHeight: "100dvh",
        background: "none",
        overflow: isResultSurface ? "visible" : "hidden",
      }}
    >
      {/* Back to Explore - only on intro (question component has its own) */}
      {phase === "intro" && (
        <div className="absolute top-4 left-4 z-30">
          <BackToExplore locale={locale} textTheme="light" />
        </div>
      )}

      {/* Intro */}
      {phase === "intro" && (
        <ClassicExploreIntro onStart={handleIntroStart} t={t} locale={locale} />
      )}

      {/* Playing */}
      {phase === "playing" && QUESTIONS[qIndex] && (
        <ClassicExploreQuestion
          question={QUESTIONS[qIndex]}
          questionIndex={qIndex}
          totalQuestions={totalQ}
          locale={locale}
          onAnswer={handleAnswer}
          onGoBack={qIndex > 0 ? goBack : undefined}
          t={t}
        />
      )}

      {/* Values Part 2 — Intro */}
      {phase === "values-intro" && (
        <ValuesIntro onStart={engine.startValuesPart} locale={locale} />
      )}

      {/* Values Part 2 — Playing (8 TwIVI items, 6-point Likert) */}
      {phase === "values-playing" && (
        <ValuesQuestion
          questionIndex={engine.valueQIndex}
          totalQuestions={engine.totalValueQ}
          locale={locale}
          t={
            {
              ...t,
              ...(getDictionaryClient(locale).valuesQuestion as Record<
                string,
                string
              >),
            } as Record<string, string>
          }
          onAnswer={(value) => {
            engine.recordValueAnswer(value);
            engine.advanceValueQuestion();
          }}
          onGoBack={engine.valueQIndex > 0 ? engine.goBackValue : undefined}
        />
      )}

      {/* Avatar gender */}
      {phase === "avatar" && (
        <AvatarGenderQuestionMount
          locale={locale}
          t={getDictionaryClient(locale).quickDive as Record<string, string>}
          onSubmit={engine.submitAvatarGender}
          trackEvent={engine.trackEvent}
        />
      )}

      {/* Generating - meaning-making moment */}
      {phase === "generating" && (
        <QuickDiveMonographShell
          phase="generating"
          t={t}
          eyebrow={t.monographChapterMeaningMaking}
          title={t.interpretingArchive}
          description={t.generatingStep5}
          side={
            <div className="dd-quickdive-monograph__meaning-side">
              <p className="dd-quickdive-monograph__side-kicker">
                {t.monographMeaningPlate}
              </p>
              <div className="dd-quickdive-monograph__sonar" aria-hidden>
                <span />
              </div>
              <p>{t.monographMeaningCopy}</p>
            </div>
          }
        >
          <motion.div
            className="dd-quickdive-monograph__generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="dd-quickdive-monograph__generating-list">
              {genSteps.map((text, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i <= genStep ? 1 : 0.15 }}
                  transition={{ duration: 0.4 }}
                  className="dd-quickdive-monograph__generating-row"
                  data-active={i <= genStep ? "true" : "false"}
                >
                  {i === 2 ? (
                    <div className="dd-quickdive-monograph__dim-grid">
                      {RIASEC_DIMS.map(
                        ({ key, zh: zhName, en: enName }) => (
                          <div key={key}>
                            <span className="dd-quickdive-monograph__dim-dot" />
                            <span className="dd-quickdive-monograph__dim-label">
                              {locale === "zh" ? zhName : enName}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : i === genSteps.length - 1 ? (
                    <span>
                      {text.replace(/[.\u2026]+$/, "")}
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        {text.slice(text.replace(/[.\u2026]+$/, "").length)}
                      </motion.span>
                    </span>
                  ) : (
                    <span>{text}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </QuickDiveMonographShell>
      )}

      {/* Reveal animation — shown once between generating and result */}
      {phase === "result" && result && !revealDone && (
        <OpenWaterReveal
          archetypeCode={result.code}
          archetypeTitle={
            locale === "zh" ? result.label.label_zh : result.label.label_en
          }
          archetypeTitleEn={result.label.label_en}
          onComplete={() => setRevealDone(true)}
          locale={locale}
        />
      )}

      {/* Paper Pivot — 800ms Dive → Revelation surface hand-off */}
      <AnimatePresence>
        {phase === "result" && result && revealDone && !paperPivotDone && (
          <PaperPivotOverlay
            key="paper-pivot"
            onComplete={handlePaperPivotComplete}
          />
        )}
      </AnimatePresence>

      {/* Result */}
      {phase === "result" && result && revealDone && paperPivotDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <UnifiedExploreResult
            result={result}
            locale={locale}
            t={t}
            onRedive={handleRedive}
            savedReportId={savedReportId}
            exploreMode="classic"
            waitForSave={waitForSave}
            savedAvatarGender={engine.avatarGender}
          />
        </motion.div>
      )}
    </div>
  );
}

/**
 * Thin wrapper so AvatarGenderQuestion can read/write the shared
 * avatar gender localStorage without bloating the parent shell's hook
 * list. The engine also stores gender for the save API body.
 */
function AvatarGenderQuestionMount({
  locale,
  t,
  onSubmit,
  trackEvent,
}: {
  locale: Locale;
  t: Record<string, string>;
  onSubmit: (g: AvatarGender | null) => void;
  trackEvent: (event: string, metadata?: Record<string, unknown>) => void;
}) {
  const { setGender: setAvatarGenderLocal } = useAvatarGender();
  return (
    <AvatarGenderQuestion
      locale={locale}
      t={t}
      onSubmit={(g) => {
        if (g) setAvatarGenderLocal(g);
        trackEvent("avatar_gender_selected", {
          gender: g ?? "skip",
          source: g ? "manual" : "hash",
        });
        onSubmit(g);
      }}
    />
  );
}
