"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { hapticLight } from "@/lib/haptic";
import { CompanionOverlay } from "./companion-overlay";
import { MysterySilhouette } from "./mystery-silhouette";
import type { ImmersiveQuestion, ChapterConfig } from "./data";
import { CHAPTERS, IMMERSIVE_QUESTIONS, pickText, C, T } from "./data";
import { DDVQ_SCALE_LABELS } from "@/lib/questionnaire/module-b-ddvq21";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

// ── Chapter order + precomputed metadata for progress bar ───

const CHAPTER_ORDER = Object.values(CHAPTERS).sort((a, b) => a.index - b.index);

/** Precomputed: each chapter's question count and start index in IMMERSIVE_QUESTIONS */
const CHAPTER_META = new Map(
  CHAPTER_ORDER.map((ch) => {
    const startIndex = IMMERSIVE_QUESTIONS.findIndex(
      (q) => q.chapter === ch.key,
    );
    const count = IMMERSIVE_QUESTIONS.filter(
      (q) => q.chapter === ch.key,
    ).length;
    return [ch.key, { startIndex, count }] as const;
  }),
);

// ── Component interface ─────────────────────────────────────

interface ImmersiveExploreQuestionProps {
  question: ImmersiveQuestion;
  questionIndex: number;
  totalQuestions: number;
  chapterConfig: ChapterConfig;
  selectedScore: number | null;
  locale: Locale;
  onAnswer: (score: number) => void;
  onPrevious?: () => void;
  canGoPrevious?: boolean;
}

// ── Main Question Component ─────────────────────────────────

export function ImmersiveExploreQuestion({
  question,
  questionIndex,
  totalQuestions,
  chapterConfig,
  selectedScore,
  locale,
  onAnswer,
  onPrevious,
  canGoPrevious = false,
}: ImmersiveExploreQuestionProps) {
  const t = getDictionaryClient(locale).narrativeExplore;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Companion presence beat — explicit per-question wins; otherwise auto-derive
  // for the first question of each chapter (Ch.1-6 only, Ch.7 has no RIASEC).
  // Pure UI layer: never affects scoring or answer flow.
  const effectiveBeat = useMemo(() => {
    if (question.companionBeat) return question.companionBeat;
    if (question.questionInChapter !== 1) return null;
    if (!chapterConfig.riasec) return null;
    const riasecToCompanion: Record<string, string> = {
      R: "marcus",
      I: "mia",
      A: "kai",
      S: "leila",
      E: "adrian",
      C: "nora",
    };
    const companionId = riasecToCompanion[chapterConfig.riasec];
    if (!companionId) return null;
    const tAny = t as unknown as Record<string, string>;
    const line = tAny[`companionBeat_${companionId}`];
    if (!line) return null;
    return {
      characterId: companionId,
      reaction: { en: line, zh: line },
    };
  }, [
    question.companionBeat,
    question.questionInChapter,
    chapterConfig.riasec,
    t,
  ]);

  // Scroll to top when question changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [question.id]);

  // Mobile narrative reveal: chapter openers stay expanded, subsequent
  // questions collapse so Likert lands in the first viewport on phones.
  const isChapterOpener = question.questionInChapter === 1;
  const [narrativeExpanded, setNarrativeExpanded] = useState(isChapterOpener);
  useEffect(() => {
    setNarrativeExpanded(isChapterOpener);
  }, [question.id, isChapterOpener]);

  // Memoize Likert scale options — 5pt (RIASEC) or 6pt (TwIVI)
  const scaleMax = question.scaleMax ?? 5;
  const likertOptions = useMemo(() => {
    if (scaleMax === 6) {
      const resolve = (n: number) => {
        const labels = DDVQ_SCALE_LABELS[n as keyof typeof DDVQ_SCALE_LABELS];
        return (labels as Record<string, string>)[locale] ?? labels.en;
      };
      return [
        { value: 1, text: resolve(1) },
        { value: 2, text: resolve(2) },
        { value: 3, text: resolve(3) },
        { value: 4, text: resolve(4) },
        { value: 5, text: resolve(5) },
        { value: 6, text: resolve(6) },
      ];
    }
    return [
      { value: 1, text: t.scale1 },
      { value: 2, text: t.scale2 },
      { value: 3, text: t.scale3 },
      { value: 4, text: t.scale4 },
      { value: 5, text: t.scale5 },
    ];
  }, [scaleMax, locale, t.scale1, t.scale2, t.scale3, t.scale4, t.scale5]);

  // TwIVI uses a different question prompt
  const questionPrompt =
    question.chapter === "values" ? t.twiviQuestionPrompt : t.questionPrompt;

  const handleSelect = (value: number) => {
    if (selectedScore !== null) return;
    hapticLight();
    onAnswer(value);
  };

  const handlePrevious = () => {
    if (!canGoPrevious || !onPrevious) return;
    hapticLight();
    onPrevious();
  };

  // Scene paragraphs
  const sceneParagraphs = useMemo(
    () => pickText(question.scene, locale).split("\n\n").filter(Boolean),
    [question.scene, locale],
  );

  const tAny = t as unknown as Record<string, string>;
  const readStoryLabel = tAny.readStory ?? "Read the scene";
  const hideStoryLabel = tAny.hideStory ?? "Hide the scene";
  const reflectionLabel = tAny.twiviReflectionLabel ?? "In this mirror —";
  const companionPulseKey = selectedScore !== null ? "answered" : "pending";

  const renderCompanion = (className: string) => {
    if (!effectiveBeat) return null;

    return (
      <div className={className}>
        <AnimatePresence mode="wait">
          <CompanionOverlay
            key={`${question.id}-${companionPulseKey}`}
            characterId={effectiveBeat.characterId}
            reaction={effectiveBeat.reaction}
            accentColor={chapterConfig.accentColor}
            locale={locale}
            pulseKey={companionPulseKey}
          />
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div
      className="h-dvh min-h-dvh overflow-hidden flex flex-col relative"
      style={{
        background: chapterConfig.bgGradient,
      }}
    >
      {/* ── Ambient scene undertone — extremely subtle, atmospheric only ── */}
      {chapterConfig.sceneImageUrl && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
        >
          <Image
            src={chapterConfig.sceneImageUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ opacity: 0.12, filter: "saturate(0.7) blur(1px)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.78) 60%, rgba(0,0,0,0.92) 100%)",
            }}
          />
        </div>
      )}

      {chapterConfig.decorCSS && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{ backgroundImage: chapterConfig.decorCSS }}
        />
      )}

      {/* ── Top Bar: Chapter + Progress ── */}
      <div
        className="shrink-0 px-5 pt-5 lg:px-8 lg:pt-8 relative z-[2]"
        style={{ paddingTop: "max(20px, env(safe-area-inset-top, 20px))" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] lg:text-[11px] font-mono tracking-[0.12em] uppercase px-2 py-0.5 rounded-full"
              style={{
                color: chapterConfig.accentColor,
                border: `1px solid ${chapterConfig.accentColor}40`,
                background: `${chapterConfig.accentColor}0A`,
              }}
            >
              {pickText(chapterConfig.title, locale)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {canGoPrevious && onPrevious && (
              <button
                type="button"
                onClick={handlePrevious}
                aria-label={t.previousQuestion}
                title={t.previousQuestion}
                className="grid h-8 w-8 place-items-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
                style={{
                  color: C.goldMuted,
                  border: `1px solid ${C.whiteMid}`,
                  background: C.blackLight,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
            <span
              className="text-[11px] lg:text-xs font-mono font-medium"
              style={{ color: C.goldMuted }}
            >
              {questionIndex + 1} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* Segmented progress bar — 7 chapter segments */}
        <div className="flex gap-1">
          {CHAPTER_ORDER.map((ch) => {
            const isCurrentChapter = ch.key === chapterConfig.key;
            const isPastChapter = ch.index < chapterConfig.index;
            const meta = CHAPTER_META.get(ch.key)!;
            const chapterQuestionCount = meta.count;
            const chapterStartIndex = meta.startIndex;

            let fillPercent = 0;
            if (isPastChapter) {
              fillPercent = 100;
            } else if (isCurrentChapter) {
              const progressInChapter =
                questionIndex -
                chapterStartIndex +
                (selectedScore !== null ? 1 : 0);
              fillPercent = Math.min(
                100,
                (progressInChapter / chapterQuestionCount) * 100,
              );
            }

            return (
              <div
                key={ch.key}
                className="flex-1 h-[3px] lg:h-[4px] rounded-full overflow-hidden"
                style={{
                  background: isCurrentChapter
                    ? `${chapterConfig.accentColor}30`
                    : C.whiteBorder,
                }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(.4,0,.2,1)]"
                  style={{
                    width: `${fillPercent}%`,
                    background: isPastChapter
                      ? `${ch.accentColor}80`
                      : `linear-gradient(90deg, ${chapterConfig.accentColor}99, ${chapterConfig.accentColor})`,
                    boxShadow: isCurrentChapter
                      ? `0 0 8px ${chapterConfig.accentColor}40`
                      : "none",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Question Content Area ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          ref={scrollRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: T.ease }}
          className="min-h-0 flex-1 flex flex-col lg:flex-row lg:items-start lg:gap-10 xl:gap-16 px-6 lg:px-12 xl:px-16 pt-5 pb-[max(128px,env(safe-area-inset-bottom,128px))] lg:pb-10 relative z-[1] overflow-y-auto overscroll-contain pointer-events-auto"
          aria-live="polite"
        >
          {/* Scene narrative ─ sticky on desktop; below interaction on mobile (CSS order flip) */}
          <div className="order-2 lg:order-none relative z-[2] w-full lg:w-[42%] lg:sticky lg:top-28 lg:self-start lg:shrink-0 mt-5 lg:mt-0">
            {/* Mobile toggle (hidden on lg) */}
            <button
              type="button"
              onClick={() => {
                hapticLight();
                setNarrativeExpanded((v) => !v);
              }}
              className="lg:hidden flex items-center justify-between gap-3 w-full mb-3 px-3 py-2 rounded-lg"
              aria-expanded={narrativeExpanded}
              style={{
                background: `${chapterConfig.accentColor}0F`,
                border: `1px solid ${chapterConfig.accentColor}30`,
                color: C.textPrimary,
              }}
            >
              <span className="text-[11px] font-mono tracking-[0.12em] uppercase">
                {narrativeExpanded ? hideStoryLabel : readStoryLabel}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={1.8}
                aria-hidden="true"
                style={{
                  transform: narrativeExpanded
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                }}
              />
            </button>

            <AnimatePresence initial={false}>
              {narrativeExpanded && (
                <motion.div
                  key="narrative-body"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: T.ease }}
                  className="overflow-hidden lg:hidden"
                >
                  <div className="relative mx-auto max-w-lg w-full pb-2">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
                      style={{
                        background: `linear-gradient(180deg, ${chapterConfig.accentColor}60, transparent)`,
                      }}
                    />
                    {sceneParagraphs.map((p, i) => (
                      <p
                        key={i}
                        className="text-xs sm:text-sm leading-[1.9] pl-4 mb-3"
                        style={{ color: C.textPrimary }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop body — always visible */}
            <div className="hidden lg:block relative mx-auto lg:max-w-none w-full">
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
                style={{
                  background: `linear-gradient(180deg, ${chapterConfig.accentColor}60, transparent)`,
                }}
              />
              {sceneParagraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-sm lg:text-base leading-[1.9] pl-4 mb-3"
                  style={{ color: C.textPrimary }}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>

          {/* Interaction zone (rendered FIRST on mobile via CSS order flip) */}
          <div className="order-1 lg:order-none relative z-[3] pointer-events-auto w-full lg:flex-1 lg:min-w-0">
            {question.chapter === "values" ? (
              <>
                <p
                  className="text-[10px] sm:text-[11px] lg:text-[12px] font-mono tracking-[0.18em] uppercase text-center lg:text-left mb-3 lg:mb-4 max-w-md lg:max-w-none mx-auto lg:mx-0"
                  style={{ color: `${chapterConfig.accentColor}E0` }}
                >
                  {reflectionLabel}
                </p>

                <blockquote
                  className="relative pl-4 lg:pl-5 mb-6 lg:mb-8 border-l-[2px] lg:border-l-[3px] max-w-lg lg:max-w-none mx-auto lg:mx-0"
                  style={{ borderLeftColor: `${chapterConfig.accentColor}A0` }}
                >
                  <p
                    className="text-[15px] sm:text-base lg:text-lg xl:text-xl leading-[1.7] font-medium tracking-wide text-left"
                    style={{
                      color: C.textBright,
                      textShadow: `0 0 32px ${chapterConfig.accentColor}20, 0 1px 3px rgba(0,0,0,0.45)`,
                    }}
                  >
                    {pickText(question.taskDescription, locale)}
                  </p>
                </blockquote>

                <p
                  className="text-[12px] sm:text-[13px] lg:text-sm text-center lg:text-left mb-4 lg:mb-6 max-w-md lg:max-w-none mx-auto lg:mx-0 tracking-wide"
                  style={{ color: C.textPrimary, opacity: 0.82 }}
                >
                  {questionPrompt}
                </p>
              </>
            ) : (
              <>
                <p
                  className="text-[12px] sm:text-[13px] lg:text-sm text-center lg:text-left mb-3 max-w-md lg:max-w-none mx-auto lg:mx-0 lg:pl-3 lg:border-l-[1.5px] tracking-wide"
                  style={{
                    color: C.textPrimary,
                    borderLeftColor: `${chapterConfig.accentColor}B0`,
                    textShadow: `0 0 24px ${chapterConfig.accentColor}18, 0 1px 2px rgba(0,0,0,0.5)`,
                  }}
                >
                  {pickText(question.taskDescription, locale)}
                </p>

                <p
                  className="text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold leading-[1.7] text-center mb-6 lg:mb-8 tracking-wide max-w-lg lg:max-w-none mx-auto lg:mx-0"
                  style={{
                    color: C.textBright,
                    textShadow: `0 0 40px ${chapterConfig.accentColor}20, 0 1px 3px rgba(0,0,0,0.4)`,
                  }}
                >
                  {questionPrompt}
                </p>
              </>
            )}

            {renderCompanion(
              "lg:hidden pointer-events-none mb-4 mx-auto max-w-md",
            )}

            <div
              className="flex flex-col gap-3 lg:gap-4 max-w-md lg:max-w-none mx-auto lg:mx-0 w-full"
              role="radiogroup"
              aria-label={t.chooseResponse}
            >
              {likertOptions.map((option, i) => {
                const isSelected = selectedScore === option.value;
                const isDisabled = selectedScore !== null;

                return (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * T.staggerTight, duration: T.fast }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleSelect(option.value)}
                    disabled={isDisabled}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={option.text}
                    className="w-full min-h-[48px] lg:min-h-[56px] px-5 lg:px-6 py-4 lg:py-5 rounded-xl text-left flex items-start gap-3"
                    style={{
                      background: isSelected
                        ? `${chapterConfig.accentColor}20`
                        : `rgba(255, 255, 255, 0.04)`,
                      border: `1px solid ${
                        isSelected
                          ? chapterConfig.accentColor + "80"
                          : C.whiteMid
                      }`,
                      color: isSelected ? C.textBright : C.textPrimary,
                      boxShadow: isSelected
                        ? `0 0 20px ${chapterConfig.accentColor}15`
                        : "none",
                      cursor: isDisabled ? "default" : "pointer",
                      opacity: isDisabled && !isSelected ? 0.35 : 1,
                      transition: "all 0.18s ease, box-shadow 0.25s ease",
                    }}
                  >
                    <span
                      className="text-[10px] font-mono mt-0.5 flex-shrink-0 w-4 text-center"
                      style={{
                        color: isSelected
                          ? chapterConfig.accentColor
                          : `${chapterConfig.accentColor}50`,
                      }}
                    >
                      {option.value}
                    </span>
                    <span className="text-[15px] lg:text-base xl:text-lg font-medium leading-snug flex-1">
                      {option.text}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <MysterySilhouette chapterIndex={chapterConfig.index} />

      {renderCompanion(
        "hidden lg:block fixed bottom-6 left-6 z-30 max-w-[calc(100vw-32px)] pointer-events-none",
      )}
    </div>
  );
}
