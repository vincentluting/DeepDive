"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ChevronLeft, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportScreen } from "./report-screen";
import { ChapterEyebrow } from "@/components/revelation/chapter-eyebrow";

// ── Swipe gesture hook (scoped to a container ref) ───
function useSwipeNavigation(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = false;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isSwiping.current) return;
      const dx =
        (e.changedTouches[0]?.clientX ?? touchStartX.current) -
        touchStartX.current;
      const dy =
        (e.changedTouches[0]?.clientY ?? touchStartY.current) -
        touchStartY.current;
      // Only trigger if horizontal > 60px and clearly horizontal (2× vertical)
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
        isSwiping.current = true;
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerRef, onSwipeLeft, onSwipeRight]);
}

// ── Types ──────────────────────────────────────────────
export interface CardFlowScreen {
  id: string;
  label: string;
  /** Short description shown below the screen title */
  subtitle?: string;
  content: React.ReactNode;
  /** Wide chapters can use the full report canvas. */
  layout?: "default" | "wide";
  /** Wide chapters can render their own heading treatment. */
  hideHeader?: boolean;
}

interface ReportCardFlowProps {
  screens: CardFlowScreen[];
  reportId: string;
  /** i18n dictionary — expects keys under reportCardFlow.* */
  t: {
    continueExploring: string;
    goBack: string;
    screenOf: string;
    viewFullReport: string;
    viewCardFlow: string;
    startExploring: string;
    youReachedEnd: string;
    viewProfile: string;
  };
  /** Link to profile page */
  profileHref?: string;
}

// ── localStorage helpers ───────────────────────────────
function getStoredProgress(reportId: string): number {
  try {
    const raw = localStorage.getItem(`report-flow-progress:${reportId}`);
    return raw ? Math.max(0, parseInt(raw, 10)) : 0;
  } catch {
    return 0;
  }
}

function setStoredProgress(reportId: string, screen: number) {
  try {
    localStorage.setItem(`report-flow-progress:${reportId}`, String(screen));
  } catch {
    // ignore
  }
}

function isReturnVisit(reportId: string): boolean {
  try {
    return localStorage.getItem(`report-flow-progress:${reportId}`) !== null;
  } catch {
    return false;
  }
}

// ── Component ──────────────────────────────────────────
export function ReportCardFlow({
  screens,
  reportId,
  t,
  profileHref,
}: ReportCardFlowProps) {
  const [activeScreen, setActiveScreen] = useState(0);
  const [maxUnlocked, setMaxUnlocked] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showFullReport, setShowFullReport] = useState(false);
  const [isReturn, setIsReturn] = useState(false);
  const cardFlowRef = useRef<HTMLDivElement>(null);

  const total = screens.length;
  const isLastScreen = activeScreen === total - 1;

  // Restore progress on mount
  useEffect(() => {
    const stored = getStoredProgress(reportId);
    const returning = isReturnVisit(reportId);
    setMaxUnlocked(stored);
    setIsReturn(returning);
    // Return visitors already walked the guided card flow once — drop them
    // straight into the scrollable full report (faster to skim or jump to a
    // chapter). The in-flow toggle lets them switch back to card flow.
    if (returning) setShowFullReport(true);
  }, [reportId]);

  // Persist progress
  useEffect(() => {
    if (maxUnlocked > 0) {
      setStoredProgress(reportId, maxUnlocked);
    }
  }, [maxUnlocked, reportId]);

  const goToScreen = useCallback(
    (index: number) => {
      if (index < 0 || index >= total) return;
      if (index > maxUnlocked + 1 && !isReturn) return; // can't skip ahead (unless return visitor)
      setDirection(index > activeScreen ? 1 : -1);
      setActiveScreen(index);
      if (index > maxUnlocked) {
        setMaxUnlocked(index);
      }
      // Scroll to top on screen change
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    [activeScreen, maxUnlocked, total, isReturn],
  );

  const goNext = useCallback(
    () => goToScreen(activeScreen + 1),
    [activeScreen, goToScreen],
  );
  const goPrev = useCallback(
    () => goToScreen(activeScreen - 1),
    [activeScreen, goToScreen],
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showFullReport) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, showFullReport]);

  // Touch swipe navigation (mobile) — scoped to card flow container
  useSwipeNavigation(
    cardFlowRef,
    useCallback(() => {
      if (!showFullReport) goNext();
    }, [showFullReport, goNext]),
    useCallback(() => {
      if (!showFullReport) goPrev();
    }, [showFullReport, goPrev]),
  );

  // Progress text: "2 / 6"
  const progressText = useMemo(
    () =>
      t.screenOf
        .replace("{{current}}", String(activeScreen + 1))
        .replace("{{total}}", String(total)),
    [activeScreen, total, t.screenOf],
  );

  const currentScreen = screens[activeScreen];

  // ── Full report mode (return visitors) ────────────
  if (showFullReport) {
    return (
      <div className="w-full">
        {/* Toggle back to card flow */}
        <div className="sticky top-[calc(var(--header-height,68px)+8px)] z-30 flex justify-center mb-8">
          <button
            onClick={() => setShowFullReport(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Layers className="h-4 w-4" />
            {t.viewCardFlow}
          </button>
        </div>
        <div className="mx-auto w-full px-4 sm:px-6 space-y-16">
          {screens.map((screen) => (
            <section
              key={screen.id}
              data-panel-id={screen.id}
              className={cn(
                "scroll-mt-28 mx-auto",
                screen.layout === "wide"
                  ? "max-w-[min(1240px,100%)]"
                  : "max-w-3xl",
              )}
            >
              {/* Chapter header — full report drops the ReportScreen wrapper,
                  so without this the scrolling report has no chapter markers.
                  Mirrors ReportScreen's header; respects wide chapters that
                  render their own heading. */}
              {screen.label && !screen.hideHeader && (
                <div className="mb-6 sm:mb-8 text-center">
                  <ChapterEyebrow className="mb-2">
                    {screen.label}
                  </ChapterEyebrow>
                  {screen.subtitle && (
                    <p className="font-serif italic text-[17px] leading-[1.6] text-[var(--rev-ink-soft)] max-w-md mx-auto">
                      {screen.subtitle}
                    </p>
                  )}
                  <div className="mt-4 mx-auto w-10 h-px bg-[var(--rev-rule)]" />
                </div>
              )}
              {screen.content}
            </section>
          ))}
        </div>
      </div>
    );
  }

  // ── Card flow mode ────────────────────────────────
  return (
    <div
      ref={cardFlowRef}
      className="w-full min-h-[calc(100dvh-var(--header-height,68px))] flex flex-col"
    >
      {/* Return visitors get a symmetric shortcut back to the full report —
          mirrors the "View Card Flow" toggle in full report mode so switching
          stays reversible from any screen (codex cross-review fix). First-time
          visitors don't see it, keeping the guided flow immersive. */}
      {isReturn && (
        <div className="sticky top-[calc(var(--header-height,68px)+8px)] z-30 flex justify-center pointer-events-none">
          <button
            onClick={() => setShowFullReport(true)}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Layers className="h-4 w-4" />
            {t.viewFullReport}
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait" initial={false}>
          <ReportScreen
            key={currentScreen.id}
            label={currentScreen.label}
            subtitle={currentScreen.subtitle}
            isActive={true}
            direction={direction}
            panelId={currentScreen.id}
            layout={currentScreen.layout}
            hideHeader={currentScreen.hideHeader}
          >
            {currentScreen.content}
          </ReportScreen>
        </AnimatePresence>
      </div>

      {/* ── Bottom navigation bar ── */}
      <div
        className="sticky bottom-0 z-30 bg-background/90 backdrop-blur-xl border-t border-border/30"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
          {/* Current screen label — hidden on mobile to save space */}
          <div className="hidden sm:flex items-center justify-center mb-2">
            <motion.span
              key={currentScreen.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-medium text-foreground/70"
            >
              {currentScreen.label}
            </motion.span>
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Back button */}
            <button
              onClick={goPrev}
              disabled={activeScreen === 0}
              className={cn(
                "flex min-h-11 items-center gap-1.5 text-sm transition-all duration-200 rounded-full px-3 py-2 min-w-[72px]",
                activeScreen === 0
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t.goBack}</span>
            </button>

            {/* Center: Progress dots with labels */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-1.5">
                {screens.map((screen, i) => {
                  const isUnlocked = i <= maxUnlocked + 1 || isReturn;
                  const isCurrent = i === activeScreen;
                  const isVisited = i <= maxUnlocked;

                  return (
                    <div key={screen.id} className="group relative">
                      <button
                        onClick={() => (isUnlocked ? goToScreen(i) : undefined)}
                        disabled={!isUnlocked}
                        aria-label={`${screen.label} (${i + 1}/${total})`}
                        className={cn(
                          "transition-all duration-300 rounded-full",
                          isUnlocked ? "cursor-pointer" : "cursor-not-allowed",
                          isCurrent
                            ? "w-6 h-2.5 bg-primary"
                            : isVisited
                              ? "w-2.5 h-2.5 bg-primary/40 hover:bg-primary/60"
                              : isUnlocked
                                ? "w-2.5 h-2.5 bg-muted-foreground/20 hover:bg-muted-foreground/30"
                                : "w-2.5 h-2.5 bg-muted-foreground/10",
                        )}
                      />
                      {/* Tooltip on hover — shows screen label */}
                      {isUnlocked && !isCurrent && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-medium text-foreground bg-card border border-border/50 rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          {screen.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="text-[11px] text-muted-foreground/60 font-mono tabular-nums">
                {progressText}
              </span>
            </div>

            {/* Right: Continue / Finish button */}
            {isLastScreen ? (
              <div className="flex items-center gap-2 min-w-[72px] justify-end">
                {isReturn && (
                  <button
                    onClick={() => setShowFullReport(true)}
                    className="min-h-11 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-full"
                  >
                    {t.viewFullReport}
                  </button>
                )}
                {profileHref && (
                  <a
                    href={profileHref}
                    className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors rounded-full px-3 py-2"
                  >
                    {t.viewProfile}
                    <ChevronRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={goNext}
                className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-all duration-200 rounded-full px-3 py-2 hover:bg-primary/5 min-w-[72px] justify-end"
              >
                <span>
                  {activeScreen === 0 ? t.startExploring : t.continueExploring}
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
