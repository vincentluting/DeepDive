"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChapterEyebrow } from "@/components/revelation/chapter-eyebrow";

interface ReportScreenProps {
  /** Screen label shown as header */
  label: string;
  /** Short description below the label */
  subtitle?: string;
  /** Whether this screen is currently active */
  isActive: boolean;
  /** Animation direction: 1 = forward, -1 = backward */
  direction: number;
  children: React.ReactNode;
  className?: string;
  /** Panel ID for engagement tracking (data-panel-id attribute) */
  panelId?: string;
  /** Wide editorial chapters can opt out of the narrow reading column. */
  layout?: "default" | "wide";
  /** Wide chapters can provide their own internal title treatment. */
  hideHeader?: boolean;
}

/**
 * Full-viewport screen wrapper for the report card flow.
 * Each screen has a title header + centered content with entry/exit animations.
 */
export const ReportScreen = forwardRef<HTMLDivElement, ReportScreenProps>(
  function ReportScreen(
    {
      label,
      subtitle,
      isActive,
      direction,
      children,
      className,
      panelId,
      layout = "default",
      hideHeader = false,
    },
    ref,
  ) {
    if (!isActive) return null;

    return (
      <motion.div
        ref={ref}
        data-panel-id={panelId}
        initial={{ opacity: 0, y: direction > 0 ? 40 : -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: direction > 0 ? -40 : 40 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "min-h-[calc(100dvh-var(--header-height,68px)-120px)]",
          "flex flex-col",
          "px-4 sm:px-6 pt-6 sm:pt-10 pb-8 sm:pb-12",
          layout === "wide"
            ? "max-w-[min(1240px,100%)] mx-auto w-full lg:px-8"
            : "max-w-3xl mx-auto w-full",
          className,
        )}
      >
        {/* Screen header — tells user what this section is about */}
        {label && !hideHeader && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-6 sm:mb-8 text-center"
          >
            <ChapterEyebrow className="mb-2">{label}</ChapterEyebrow>
            {subtitle && (
              <p className="font-serif italic text-[17px] leading-[1.6] text-[var(--rev-ink-soft)] max-w-md mx-auto">
                {subtitle}
              </p>
            )}
            <div className="mt-4 mx-auto w-10 h-px bg-[var(--rev-rule)]" />
          </motion.div>
        )}

        {/* Screen content */}
        <div className="flex-1">{children}</div>
      </motion.div>
    );
  },
);
