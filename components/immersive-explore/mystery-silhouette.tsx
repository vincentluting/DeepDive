"use client";

import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/device";

interface MysterySilhouetteProps {
  /** 1-7. Silhouette only renders for chapters 3-6 (the foreshadow window). */
  chapterIndex: number;
}

// Per-chapter presence tuning. Each step closer = larger, sharper, brighter.
// Ch1-Ch2: hidden — preserve breathing room before the figure enters the frame.
// Ch7: hidden — the woman is fully revealed via zeroroom.webp scene image.
const PRESENCE: Record<
  number,
  { width: number; opacity: number; blur: number; glow: string }
> = {
  3: { width: 64, opacity: 0.22, blur: 14, glow: "rgba(196, 181, 253, 0.16)" },
  4: { width: 88, opacity: 0.32, blur: 10, glow: "rgba(196, 181, 253, 0.22)" },
  5: { width: 116, opacity: 0.46, blur: 6, glow: "rgba(196, 181, 253, 0.30)" },
  6: { width: 156, opacity: 0.62, blur: 3, glow: "rgba(196, 181, 253, 0.40)" },
};

/**
 * The mystery woman — present from Ch3 onward as a backgrounded silhouette,
 * gradually closer/clearer with each chapter, paying off in Ch7's Zero Room reveal.
 *
 * Pure visual layer. Does not affect scoring or the answer flow. Render this in
 * pages where the silhouette should be visible (typically the question page).
 */
export function MysterySilhouette({ chapterIndex }: MysterySilhouetteProps) {
  const reduced = prefersReducedMotion();
  const cfg = PRESENCE[chapterIndex];
  if (!cfg) return null;

  return (
    <motion.div
      key={`mystery-${chapterIndex}`}
      aria-hidden
      className="fixed pointer-events-none"
      style={{
        right: 0,
        bottom: 0,
        width: cfg.width,
        height: cfg.width * 1.7,
        zIndex: 5, // below modals (z-50) but above question background
        filter: `blur(${cfg.blur}px) drop-shadow(0 0 24px ${cfg.glow})`,
      }}
      initial={{ opacity: 0, x: reduced ? 0 : 24 }}
      animate={{ opacity: cfg.opacity, x: 0 }}
      transition={{ duration: reduced ? 0.3 : 1.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg
        viewBox="0 0 100 170"
        preserveAspectRatio="xMidYMax meet"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="mystery-grad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#020308" stopOpacity="0.96" />
            <stop offset="65%" stopColor="#080612" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0c0820" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* Head */}
        <ellipse cx="50" cy="20" rx="13" ry="16" fill="url(#mystery-grad)" />
        {/* Neck + shoulders + long flowing robe (matches the Zero Room aesthetic) */}
        <path
          d="M44 38 L56 38 L60 50 Q72 55 74 70 L82 110 L86 170 L14 170 L18 110 L26 70 Q28 55 40 50 Z"
          fill="url(#mystery-grad)"
        />
      </svg>
    </motion.div>
  );
}
