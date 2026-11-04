"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getClientId } from "@/lib/auth/client-id";
import { analytics } from "@/lib/analytics/client";
import { sendAnalyticsSafely } from "@/lib/analytics/send-safely";
import { useImmersiveEngine } from "./use-immersive-engine";
import { ImmersiveExploreIntro } from "./immersive-explore-intro";
import { ImmersiveExploreCharacters } from "./immersive-explore-characters";
import { ImmersiveExploreQuestion } from "./immersive-explore-question";
import { MirrorToast } from "./mirror-toast";
import { ImmersiveChapterTransition } from "./immersive-chapter-transition";
import { ImmersiveAvatarGender } from "./immersive-avatar-gender";
import {
  CHAPTERS,
  IMMERSIVE_QUESTIONS,
  C,
  T,
  REVELATION_ACT1,
  REVELATION_ACT2,
  REVELATION_ACT3,
  REVELATION_LEDGER,
  REVELATION_FINALE,
  pickText,
  resolveLocale,
} from "./data";
import { UnifiedExploreResult } from "@/components/quickdive/unified-explore-result";
import { findLabel } from "@/components/quickdive/quickdive-data";
import type { QuickDiveResultData } from "@/components/quickdive/quickdive-data";
import type { ImmersiveResult } from "./use-immersive-engine";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { matchCareersClient } from "@/lib/career-matching/client-engine";
import type { Locale } from "@/lib/i18n/config";

// ── CSS keyframes (module-level constant — injected once) ───
const CURSOR_BLINK_STYLE = `
  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;

function immersiveResultToUnified(
  narResult: ImmersiveResult,
  locale: Locale,
): QuickDiveResultData {
  const { scores, ranked, archetype } = narResult;

  const code = archetype.code;
  const label = findLabel(code) ??
    findLabel(archetype.primary) ?? {
      code,
      label_zh: archetype.label_zh,
      label_en: archetype.label_en,
      tagline_zh: archetype.tagline_zh,
      tagline_en: archetype.tagline_en,
      colorHex: "#5A8A9A",
    };

  const sortedScores: [string, number][] = ranked.map((k) => [k, scores[k]]);
  const derived = matchCareersClient(sortedScores, locale);

  const topScore = sortedScores[0][1];
  const secondScore = sortedScores[1][1];
  const scoreDiff = topScore - secondScore;
  const confidenceTier: "HC" | "MC" | "LC" =
    scoreDiff >= 15 && topScore > 10 ? "HC" : scoreDiff >= 8 ? "MC" : "LC";

  return {
    label,
    code,
    sortedScores,
    topCareers: derived.topCareers,
    fitCareers: derived.fitCareers,
    drainCareers: derived.drainCareers,
    aiEraCareer: derived.aiEraTopPick,
    confidenceTier,
  };
}

// ── Subtle exit button — minimal, doesn't break immersion ───
function ExitButton({
  locale,
  onTrack,
}: {
  locale: Locale;
  onTrack: () => void;
}) {
  const router = useRouter();
  const t = getDictionaryClient(locale).narrativeExplore;

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: T.normal }}
      onClick={() => {
        onTrack();
        router.push(`/${locale}/explore`);
      }}
      className="fixed top-4 left-4 z-[60] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wide transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
      style={{
        paddingTop: "max(6px, env(safe-area-inset-top, 6px))",
        background: C.blackLight,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: `1px solid ${C.whiteMid}`,
        color: C.textMuted,
        opacity: 0.6,
      }}
      aria-label={t.exitButton}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path
          d="M7.5 2.5L2.5 7.5M2.5 2.5L7.5 7.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      {t.exitButton}
    </motion.button>
  );
}

// ── Revelation Scene — Cinematic Mirror Moment ──────────────
// Multi-act narrative with timed transitions.
// Act 1 → Act 2 → Act 3 → Ledger → Finale → Continue

function RevelationScene({
  locale,
  result,
  onComplete,
}: {
  locale: Locale;
  result: ImmersiveResult;
  onComplete: () => void;
}) {
  const dict = getDictionaryClient(locale);
  const tNarr = dict.narrativeExplore;
  // Act progression: 0=act1, 1=act2, 2=act3, 3=ledger, 4=finale
  const [act, setAct] = useState(0);
  // VN click-to-advance: ready state per act (minimum display time)
  const [ready, setReady] = useState(false);
  const [showFinaleBtn, setShowFinaleBtn] = useState(false);

  const acts = [REVELATION_ACT1, REVELATION_ACT2, REVELATION_ACT3];
  const currentAct = acts[act];
  const isNarrativeAct = act <= 2;
  const isLedger = act === 3;
  const isFinale = act === 4;

  const advanceToNextAct = useCallback(() => {
    if (!ready) return;
    if (act < 4) {
      setAct((a) => a + 1);
      setReady(false);
    }
  }, [act, ready]);

  // Minimum display time before user can advance (per act)
  useEffect(() => {
    setReady(false);
    let delay: number;
    if (isNarrativeAct && currentAct) {
      // Stagger animation time + reading buffer
      delay = (currentAct.paragraphs.length * 0.6 + 1) * 1000;
    } else if (isLedger) {
      delay = 2500; // Card animation needs time
    } else {
      delay = 2500; // Finale
    }
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [act, isNarrativeAct, isLedger, currentAct]);

  // Finale: show continue button after content appears
  useEffect(() => {
    if (!isFinale) return;
    const timer = setTimeout(() => setShowFinaleBtn(true), 2500);
    return () => clearTimeout(timer);
  }, [isFinale]);

  // Keyboard: Enter/Space to advance
  useEffect(() => {
    if (!ready) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (isFinale) onComplete();
        else advanceToNextAct();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ready, isFinale, onComplete, advanceToNextAct]);

  // Ledger dynamic values
  const ledger = resolveLocale(REVELATION_LEDGER, locale);
  const { scores, ranked } = result;
  const code = ranked[0] + ranked[1];
  const highCount = Object.values(scores).filter((s) => s >= 17).length;
  const lowCount = 6 - highCount;
  const today = new Date();
  const dateStr = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: locale === "zh" ? "long" : "numeric",
    day: "numeric",
  }).format(today);
  const finale = resolveLocale(REVELATION_FINALE, locale);

  // Tap-to-continue prompt
  const advancePrompt = ready && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mt-6 flex flex-col items-center gap-1.5"
    >
      <span
        className="text-[11px] font-mono tracking-[0.15em]"
        style={{ color: C.textMuted }}
      >
        {tNarr.tapToContinue}
      </span>
      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          width="14"
          height="8"
          viewBox="0 0 14 8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1.5 1.5L7 7L12.5 1.5"
            stroke={C.textMuted}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  );

  return (
    <div
      className="h-dvh min-h-dvh flex flex-col items-center justify-center relative overflow-y-auto overscroll-contain"
      style={{
        background: `radial-gradient(ellipse at 50% 40%, #1A1408 0%, #0A0806 100%)`,
        cursor: ready && !isFinale ? "pointer" : "default",
      }}
      onClick={!isFinale ? advanceToNextAct : undefined}
    >
      {/* Ambient mirror glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 2 }}
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(240,220,170,0.15) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-lg px-6 py-12">
        <AnimatePresence mode="wait">
          {/* ── Narrative Acts (0, 1, 2) — all paragraphs stagger in immediately ── */}
          {isNarrativeAct && currentAct && (
            <motion.div
              key={`act-${act}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: T.slow }}
              className="flex flex-col gap-8"
            >
              {currentAct.paragraphs.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: T.slow,
                    delay: i * 0.6,
                  }}
                >
                  <p
                    className="text-[13px] lg:text-[15px] leading-[2] whitespace-pre-line"
                    style={{ color: C.textPrimary }}
                  >
                    {pickText(p, locale)}
                  </p>
                </motion.div>
              ))}

              {advancePrompt}
            </motion.div>
          )}

          {/* ── Ledger (Act 3) ── */}
          {isLedger && (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: T.slow }}
              className="flex flex-col gap-6"
            >
              {/* Title */}
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: T.normal }}
                className="text-center text-sm lg:text-base font-mono tracking-[0.15em]"
                style={{ color: C.gold }}
              >
                {ledger.title}
              </motion.h2>

              {/* Card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: T.normal }}
                className="rounded-lg p-5 lg:p-6"
                style={{
                  background: C.whiteSubtle,
                  border: `1px solid ${C.whiteBorder}`,
                }}
              >
                {/* Header fields */}
                <div
                  className="flex flex-col gap-1.5 text-[11px] lg:text-xs font-mono mb-4 pb-4"
                  style={{ borderBottom: `1px solid ${C.whiteBorder}` }}
                >
                  <span style={{ color: C.textMuted }}>
                    {ledger.labelRef}: QE-{code}-{today.getFullYear()}
                  </span>
                  <span style={{ color: C.textMuted }}>
                    {ledger.labelDate}: {dateStr}
                  </span>
                  <span style={{ color: C.textMuted }}>
                    {ledger.labelParticipants}: 1
                  </span>
                </div>

                {/* Score rows */}
                <div
                  className="flex flex-col gap-2 text-[12px] lg:text-[13px] mb-4 pb-4"
                  style={{ borderBottom: `1px solid ${C.whiteBorder}` }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: C.textSecondary }}>
                      {ledger.labelSteppedToward}
                    </span>
                    <span style={{ color: C.gold }}>{highCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: C.textSecondary }}>
                      {ledger.labelSteppedAway}
                    </span>
                    <span style={{ color: C.gold }}>{lowCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: C.textSecondary }}>
                      {ledger.labelHonesty}
                    </span>
                    <span style={{ color: C.gold }}>1.00</span>
                  </div>
                  <div
                    className="flex justify-between mt-2 pt-2"
                    style={{ borderTop: `1px solid ${C.whiteBorder}` }}
                  >
                    <span style={{ color: C.textBright }}>
                      {ledger.labelAwarded}
                    </span>
                    <span style={{ color: C.gold }}>{ledger.prizeAmount}</span>
                  </div>
                </div>

                {/* Note lines */}
                <div className="flex flex-col gap-1">
                  {ledger.noteLines.map((line, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: 0.8 + i * 0.15,
                        duration: T.fast,
                      }}
                      className={`text-[11px] lg:text-xs leading-relaxed ${line === "" ? "h-2" : ""}`}
                      style={{
                        color: line === "" ? "transparent" : C.textTertiary,
                      }}
                    >
                      {line || "\u00A0"}
                    </motion.p>
                  ))}
                </div>

                {/* Organizer */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: T.normal }}
                  className="text-right text-[11px] font-mono mt-4 pt-3"
                  style={{
                    color: C.brownFaint,
                    borderTop: `1px solid ${C.whiteBorder}`,
                  }}
                >
                  {ledger.organizer}
                </motion.p>
              </motion.div>

              {advancePrompt}
            </motion.div>
          )}

          {/* ── Finale (Act 4) — accelerated timings ── */}
          {isFinale && (
            <motion.div
              key="finale"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: T.slow }}
              className="flex flex-col items-center gap-8"
            >
              {/* Pointer text */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: T.slow }}
                className="text-[13px] lg:text-[15px] leading-[2] whitespace-pre-line text-center"
                style={{ color: C.textPrimary }}
              >
                {finale.pointerText}
              </motion.p>

              {/* Merge sequence — tighter stagger */}
              {finale.mergeText.map((text, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 1.5, duration: T.slow }}
                  className="text-[13px] lg:text-[15px] leading-[2] whitespace-pre-line text-center"
                  style={{ color: C.textPrimary }}
                >
                  {text}
                </motion.p>
              ))}

              {/* Seal — 零 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 1 + finale.mergeText.length * 1.5 + 0.5,
                  duration: T.dramatic,
                  ease: T.ease,
                }}
                className="flex items-center justify-center w-20 h-20 rounded-full"
                style={{
                  border: `1px solid ${C.ceremonySeal}`,
                  boxShadow: `0 0 30px ${C.ceremonySealGlow}`,
                }}
              >
                <span
                  className="text-2xl font-serif"
                  style={{ color: C.ceremonySealBright }}
                >
                  {tNarr.sealSymbol}
                </span>
              </motion.div>

              {/* Continue button */}
              {showFinaleBtn && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: T.normal }}
                  onClick={onComplete}
                  className="mt-4 px-8 py-3 rounded-full text-sm font-light tracking-wide transition-all hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${C.brownSubtle}, ${C.whiteSubtle})`,
                    border: `1px solid ${C.brownMuted}`,
                    color: C.goldSubtle,
                    boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
                  }}
                >
                  {finale.continueBtn}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ImmersiveExploreShell({ locale }: { locale: Locale }) {
  const dict = getDictionaryClient(locale);
  const t = dict.quickDive as Record<string, string>;
  const tNarr = dict.narrativeExplore;
  const engine = useImmersiveEngine(locale);

  const {
    phase,
    setPhase,
    currentQuestion,
    currentQuestionIndex,
    answers,
    mirrorToast,
    pendingChapterTransition,
    result,
    genStep,
    genSteps,
    savedReportId,
    totalQuestions,
    avatarGender,
    recordAnswer,
    dismissMirrorToast,
    goToPreviousQuestion,
    completeChapterTransition,
    completeRevelation,
    submitAvatarGender,
    handleReset,
    trackEvent,
    waitForSave,
  } = engine;

  // Scroll lock during fullscreen phases (envelope, invitation, rules, characters, chapter-transition)
  useEffect(() => {
    const lockedPhases = [
      "envelope",
      "invitation",
      "rules",
      "characters",
      "chapter-transition",
      "avatar-gender",
      "revelation",
    ];
    if (lockedPhases.includes(phase)) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [phase]);

  // Track playing start time for abandon timeSpentMs
  const playStartRef = useRef(0);
  useEffect(() => {
    if (phase === "playing" && playStartRef.current === 0) {
      playStartRef.current = Date.now();
    }
  }, [phase]);

  // Mutual exclusion: once completed, abandon must not fire
  const hasCompletedRef = useRef(false);
  useEffect(() => {
    if (phase === "revelation" || phase === "result")
      hasCompletedRef.current = true;
  }, [phase]);

  // Abandonment tracking — mirrors classic-explore-shell behaviour
  useEffect(() => {
    if (phase !== "playing") return;

    const sendAbandon = () => {
      if (hasCompletedRef.current) return; // completed already
      const today = new Date().toISOString().slice(0, 10);
      sendAnalyticsSafely("/api/analytics/event", {
        event: "quickdive_abandoned",
        clientId: getClientId(),
        idempotencyKey: `qd_abandon:${getClientId()}:immersive:${today}`,
        metadata: {
          locale,
          exploreMode: "immersive",
          lastQuestionIndex: currentQuestionIndex,
          questionsAnswered: currentQuestionIndex,
          totalQuestions,
          completionRate: Math.round(
            (currentQuestionIndex / totalQuestions) * 100,
          ),
          timeSpentMs:
            playStartRef.current > 0
              ? Date.now() - playStartRef.current
              : undefined,
        },
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendAbandon();
    };

    window.addEventListener("beforeunload", sendAbandon);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", sendAbandon);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [phase, currentQuestionIndex, totalQuestions, locale]);

  return (
    <div className="w-full h-dvh min-h-dvh relative overflow-hidden">
      {/* Exit button — shown during interactive phases, not envelope/generating/result */}
      {phase !== "envelope" &&
        phase !== "avatar-gender" &&
        phase !== "generating" &&
        phase !== "revelation" &&
        phase !== "result" && (
          <ExitButton
            locale={locale}
            onTrack={() =>
              trackEvent("immersive_exit_clicked", {
                phase,
                questionIndex: currentQuestionIndex,
              })
            }
          />
        )}

      {/* Intro + Invitation + Rules */}
      {(phase === "envelope" ||
        phase === "invitation" ||
        phase === "rules") && (
        <ImmersiveExploreIntro
          locale={locale}
          phase={phase}
          setPhase={setPhase}
          onComplete={() => setPhase("characters")}
        />
      )}

      {/* Character Introductions */}
      {phase === "characters" && (
        <ImmersiveExploreCharacters
          locale={locale}
          onComplete={() => {
            analytics
              .track("immersive_explore_started", { language: locale })
              .catch(() => {});
            // Also fire canonical event so cross-mode funnel queries work
            analytics
              .track("quickdive_started", {
                exploreMode: "immersive",
                language: locale,
                clientId: getClientId(),
              })
              .catch(() => {});
            setPhase("playing");
          }}
        />
      )}

      {/* Playing */}
      {phase === "playing" && currentQuestion && (
        <ImmersiveExploreQuestion
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          chapterConfig={CHAPTERS[currentQuestion.chapter]}
          selectedScore={answers[currentQuestion.id] ?? null}
          locale={locale}
          onAnswer={(score) => recordAnswer(currentQuestion.id, score)}
          onPrevious={goToPreviousQuestion}
          canGoPrevious={
            currentQuestionIndex > 0 && answers[currentQuestion.id] == null
          }
        />
      )}

      {/* Mirror reflection toast — non-blocking, surfaces only during answer flow */}
      {(phase === "playing" || phase === "chapter-transition") && (
        <MirrorToast toast={mirrorToast} onDismiss={dismissMirrorToast} />
      )}

      {/* Chapter Transition */}
      {phase === "chapter-transition" &&
        pendingChapterTransition &&
        (() => {
          const fromChapterKey =
            IMMERSIVE_QUESTIONS[currentQuestionIndex].chapter;
          const nextQ = IMMERSIVE_QUESTIONS[currentQuestionIndex + 1];
          const toChapterKey = nextQ?.chapter || fromChapterKey;
          return (
            <ImmersiveChapterTransition
              fromChapter={CHAPTERS[fromChapterKey]}
              toChapter={CHAPTERS[toChapterKey]}
              locale={locale}
              onComplete={completeChapterTransition}
            />
          );
        })()}

      {/* Avatar gender — sits between last question and seal ceremony */}
      {phase === "avatar-gender" && (
        <ImmersiveAvatarGender
          locale={locale}
          onSubmit={submitAvatarGender}
          onPrevious={goToPreviousQuestion}
        />
      )}

      {/* Generating — Archive Seal Ceremony */}
      {phase === "generating" && (
        <div
          className="h-dvh min-h-dvh overflow-y-auto overscroll-contain flex flex-col items-center justify-center relative"
          style={{ background: CHAPTERS.archive.bgGradient }}
        >
          {/* Ambient radial glow behind seal */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: genStep >= 3 ? 0.15 : 0.06 }}
            transition={{ duration: 1.2 }}
            style={{
              background: `radial-gradient(circle at 50% 45%, ${C.ceremonySealGlow} 0%, transparent 60%)`,
            }}
          />

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-6 px-6 w-full max-w-sm lg:max-w-md">
            {/* Archive header label */}
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: T.normal }}
              className="text-[10px] lg:text-xs font-mono tracking-[0.25em] uppercase"
              style={{ color: C.ceremonyText }}
            >
              {t.interpretingArchive}
            </motion.span>

            {/* ── Seal Stamp SVG ── */}
            <motion.div
              className="relative flex items-center justify-center"
              style={{ width: 120, height: 120 }}
            >
              {/* Outer ring */}
              <motion.svg
                width={120}
                height={120}
                viewBox="0 0 120 120"
                className="absolute inset-0"
                role="img"
                aria-hidden="true"
              >
                <motion.circle
                  cx={60}
                  cy={60}
                  r={52}
                  fill="none"
                  strokeWidth={1.5}
                  stroke={C.ceremonySeal}
                  initial={{ opacity: 0.2, pathLength: 0 }}
                  animate={{
                    opacity: [0.2, 0.35, 0.5, 0.65, 0.85, 1][genStep] ?? 0.2,
                    pathLength: [0.1, 0.3, 0.55, 0.78, 0.95, 1][genStep] ?? 0.1,
                  }}
                  transition={{ duration: T.slow, ease: "easeOut" }}
                />
                {/* Inner decorative ring */}
                <motion.circle
                  cx={60}
                  cy={60}
                  r={44}
                  fill="none"
                  strokeWidth={0.5}
                  stroke={C.ceremonySealFaint}
                  strokeDasharray="2 4"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: genStep >= 2 ? 0.5 : 0,
                    rotate: genStep * 72,
                  }}
                  transition={{ duration: T.normal }}
                  style={{ transformOrigin: "center" }}
                />
              </motion.svg>

              {/* Center character — 零 / Ø (matches envelope seal) */}
              <motion.span
                className="relative text-2xl font-serif select-none"
                initial={{ opacity: 0.15, scale: 0.8 }}
                animate={{
                  opacity: [0.15, 0.25, 0.4, 0.55, 0.75, 1][genStep] ?? 0.15,
                  scale: [0.8, 0.85, 0.9, 0.95, 0.98, 1][genStep] ?? 0.8,
                }}
                transition={{ duration: T.slow, ease: T.ease }}
                style={{ color: C.ceremonySealBright }}
              >
                {tNarr.sealSymbol}
              </motion.span>

              {/* Glow shadow (grows with each step) */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: genStep >= 4 ? 0.4 : genStep >= 2 ? 0.15 : 0,
                  boxShadow: `0 0 ${12 + genStep * 8}px ${C.ceremonySealGlow}`,
                }}
                transition={{ duration: T.normal }}
              />
            </motion.div>

            {/* ── Step Narrative Text ── */}
            <div className="flex flex-col items-center gap-3 mt-2 min-h-[100px]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={genStep}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: T.fast }}
                  className="text-[13px] lg:text-sm font-light text-center leading-relaxed"
                  style={{ color: C.gold }}
                >
                  {genSteps[genStep] ?? genSteps[genSteps.length - 1]}
                  {genStep < genSteps.length - 1 && (
                    <span
                      className="inline-block ml-0.5 w-px h-3 align-middle"
                      style={{
                        background: C.brownActive,
                        animation: "cursorBlink 0.8s step-end infinite",
                      }}
                    />
                  )}
                </motion.p>
              </AnimatePresence>

              {/* Step progress indicator (subtle dots) */}
              <div className="flex gap-2 mt-1">
                {genSteps.map((_: string, i: number) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    animate={{
                      background:
                        i <= genStep ? C.ceremonySeal : C.ceremonySealFaint,
                      scale: i === genStep ? 1.3 : 1,
                    }}
                    transition={{ duration: T.fast }}
                  />
                ))}
              </div>
            </div>

            {/* Completion note */}
            <AnimatePresence>
              {genStep >= 4 && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: T.fast, duration: T.normal }}
                  className="text-xs lg:text-sm italic text-center"
                  style={{ color: C.brownFaint }}
                >
                  {t.archiveComplete}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Cursor blink keyframes */}
          <style>{CURSOR_BLINK_STYLE}</style>
        </div>
      )}

      {/* Revelation → Result — seamless crossfade transition */}
      <AnimatePresence mode="wait">
        {phase === "revelation" && result && (
          <motion.div
            key="revelation"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <RevelationScene
              locale={locale}
              result={result}
              onComplete={completeRevelation}
            />
          </motion.div>
        )}

        {phase === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <UnifiedExploreResult
              result={immersiveResultToUnified(result, locale)}
              locale={locale}
              t={t}
              onRedive={() => handleReset()}
              savedReportId={savedReportId}
              exploreMode="immersive"
              waitForSave={waitForSave}
              savedAvatarGender={avatarGender}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
