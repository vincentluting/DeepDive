"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChapterEyebrow } from "@/components/revelation/chapter-eyebrow";
import { cn } from "@/lib/utils";
import type { ReportSectionId } from "@/lib/coaching/types";
import { defaultLocale, isValidLocale } from "@/lib/i18n/config";

export interface ChapterCardProps {
  /** Stable id — used in URL params when jumping to coaching */
  chapterId: ReportSectionId;
  /** Small metadata line above headline (e.g. "Chapter 01 · Career Anchor") */
  eyebrow: string;
  /** One-line conclusion-first headline (serif) */
  headline: string;
  /** Optional short supporting line */
  subline?: string;
  /** Concrete concept to focus on in coaching (archetype label, direction, etc.) */
  focusConcept?: string;
  /** When true, renders an "Ask Coach about this" CTA that routes to /coaching with section context */
  hasCoachAccess?: boolean;
  /** Label for the expand toggle — localized by caller */
  expandLabel: string;
  /** Label for the collapse toggle — localized by caller */
  collapseLabel: string;
  /** Label for the "ask coach" CTA — localized by caller */
  askCoachLabel?: string;
  /** Whether the detail block starts expanded. Default: false (conclusion-first) */
  defaultExpanded?: boolean;
  /** Detail content — hidden behind the expand toggle */
  children: React.ReactNode;
  className?: string;
}

/**
 * ChapterCard — progressive-disclosure wrapper for report chapters.
 *
 * Renders a conclusion-first summary (eyebrow + headline + subline) with two
 * secondary CTAs: expand-in-place for the full chapter body, and optionally
 * jump to the AI coach anchored to this section.
 *
 * Visual follows Revelation Surface: ivory paper, phospho-cyan eyebrow,
 * serif headline, no shadow, no translate animation (opacity-only).
 */
export function ChapterCard({
  chapterId,
  eyebrow,
  headline,
  subline,
  focusConcept,
  hasCoachAccess,
  expandLabel,
  collapseLabel,
  askCoachLabel,
  defaultExpanded = false,
  children,
  className,
}: ChapterCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale =
    params?.locale && isValidLocale(params.locale)
      ? params.locale
      : defaultLocale;

  const coachingHref = useMemo(() => {
    const q = new URLSearchParams({ from: chapterId });
    if (focusConcept) q.set("focus", focusConcept);
    return `/${locale}/coaching?${q.toString()}`;
  }, [chapterId, focusConcept, locale]);

  const handleAskCoach = useCallback(() => {
    router.push(coachingHref);
  }, [coachingHref, router]);

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return (
    <section
      data-chapter-id={chapterId}
      className={cn(
        "bg-[var(--rev-paper-warm)] border border-[var(--rev-rule)] rounded-[4px]",
        "px-6 py-7 sm:px-8 sm:py-8",
        className,
      )}
    >
      {/* Summary header — always visible */}
      <header className="flex flex-col gap-3">
        <ChapterEyebrow>{eyebrow}</ChapterEyebrow>
        <h3 className="font-serif text-[22px] sm:text-[26px] leading-[1.3] text-[var(--rev-ink)] m-0">
          {headline}
        </h3>
        {subline && (
          <p className="font-sans text-[15px] leading-[1.55] text-[var(--rev-ink-soft)] m-0">
            {subline}
          </p>
        )}
      </header>

      {/* CTAs */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="h-8 px-3 text-[13px] font-medium text-[var(--rev-ink)] hover:bg-[var(--rev-paper)] gap-1"
          aria-expanded={expanded}
          aria-controls={`chapter-${chapterId}-body`}
        >
          {expanded ? collapseLabel : expandLabel}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </Button>

        {hasCoachAccess && askCoachLabel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAskCoach}
            className={cn(
              "h-8 px-3 text-[13px] font-medium gap-1.5",
              "text-[var(--rev-glow-cold)] hover:text-[var(--rev-glow-cold)]",
              "hover:bg-[var(--rev-paper)]",
            )}
            data-testid={`ask-coach-${chapterId}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {askCoachLabel}
          </Button>
        )}
      </div>

      {/* Detail body — crossfade only, no translate (Revelation domain rule) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`chapter-${chapterId}-body`}
            key="body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-[var(--rev-rule)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
