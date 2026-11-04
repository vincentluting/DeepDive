/**
 * SpotlightCarousel — Guided horizontal scroll-snap carousel
 *
 * Shows the top 3-4 most defining dimensions as full-width cards.
 * Users swipe (mobile) or use arrows (desktop) to browse.
 * System picks the order — users don't need to decide where to start.
 */
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

export interface SpotlightItem {
  key: string;
  title: string;
  summary: string;
  insight: string;
  signalStrength: number;
}

interface SpotlightCarouselProps {
  items: SpotlightItem[];
  locale: string;
  /** Called when user taps "Explore" on a spotlight card */
  onExplore: (key: string) => void;
}

export function SpotlightCarousel({
  items,
  locale,
  onExplore,
}: SpotlightCarouselProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track active card via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    const cards = container.querySelectorAll("[data-index]");
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [items.length]);

  const scrollTo = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const cards = container.querySelectorAll("[data-index]");
    cards[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="px-1">
        <p className="text-xs font-semibold tracking-[0.02em] text-rev-ink">
          {t.spotlightTitle}
        </p>
        <p className="text-[11px] text-rev-ink-soft/80 mt-0.5">
          {t.spotlightSubtitle}
        </p>
      </div>

      {/* Scroll-snap container */}
      <div className="relative group">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory
            scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => (
            <div
              key={item.key}
              data-index={i}
              className="snap-center shrink-0 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] max-w-lg"
            >
              <SpotlightCard
                item={item}
                locale={locale}
                onExplore={() => onExplore(item.key)}
              />
            </div>
          ))}
        </div>

        {/* Desktop arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2
                w-8 h-8 rounded-full bg-rev-paper border border-rev-rule
                flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity
                disabled:opacity-0 hidden sm:flex"
              disabled={activeIndex === 0}
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4 text-rev-ink-soft" />
            </button>
            <button
              onClick={() =>
                scrollTo(Math.min(items.length - 1, activeIndex + 1))
              }
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2
                w-8 h-8 rounded-full bg-rev-paper border border-rev-rule
                flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity
                disabled:opacity-0 hidden sm:flex"
              disabled={activeIndex === items.length - 1}
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4 text-rev-ink-soft" />
            </button>
          </>
        )}
      </div>

      {/* Pagination dots */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to spotlight ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex
                  ? "w-5 bg-rev-glow-cold"
                  : "w-1.5 bg-rev-ink-soft/30 hover:bg-rev-ink-soft/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Spotlight Card ──────────────────────────────────────────

function SpotlightCard({
  item,
  locale,
  onExplore,
}: {
  item: SpotlightItem;
  locale: string;
  onExplore: () => void;
}) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;

  return (
    <div
      className="relative rounded-[4px] border border-rev-rule border-l-2 border-l-rev-glow-cold overflow-hidden bg-rev-paper-warm
        p-6 space-y-3 cursor-pointer transition-colors hover:border-rev-ink-soft/40"
      onClick={onExplore}
      role="button"
      tabIndex={0}
      aria-label={`${t.spotlightExplore}: ${item.title}`}
      onKeyDown={(e) => e.key === "Enter" && onExplore()}
    >
      {/* Title + signal */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-rev-signal-info">
            {t.spotlightMostDefining}
          </p>
          <p className="font-display text-lg font-normal text-rev-ink mt-2 tracking-[-0.01em] leading-tight">
            {item.title}
          </p>
        </div>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded-[2px] shrink-0 border border-rev-glow-cold/40 text-rev-signal-info bg-rev-paper">
          {item.signalStrength}%
        </span>
      </div>

      {/* Summary */}
      <p className="font-serif text-[15px] text-rev-ink leading-[1.7]">
        {item.summary}
      </p>

      {/* Insight */}
      <div className="pt-3 mt-1 border-t border-rev-rule">
        <p className="font-serif text-[13px] text-rev-ink-soft leading-[1.7] italic">
          {item.insight}
        </p>
      </div>

      {/* Explore CTA */}
      <div className="flex justify-end pt-1">
        <span className="text-[11px] font-medium tracking-[0.04em] text-rev-signal-info">
          {t.spotlightExplore} →
        </span>
      </div>
    </div>
  );
}
