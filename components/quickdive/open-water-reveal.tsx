"use client";

// ============================================================
// OpenWaterReveal — Immersive reveal animation shown when
// the Quick Dive questionnaire completes. Identity Claim Model
// Phase 1: 4-5 second "Open Water Dive" experience.
//
// Animation sequence:
//   Phase A (0-1.5s):  Underwater scene appears
//   Phase B (1.5-3s):  Color circle avatar fades in from glow
//   Phase C (3-4.5s):  Archetype name reveals (primary + secondary lang)
//   Phase D (4.5s+):   Scene dissolves → onComplete fires
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { findLabel } from "./quickdive-data";
import { getArchetypeContent } from "@/lib/content";
import { QuickDiveMonographShell } from "./quickdive-monograph-shell";

export interface OpenWaterRevealProps {
  archetypeCode: string; // e.g., "R-enhancement", "I-transcendence"
  archetypeTitle: string; // e.g., "实践者" or "拓路者"
  archetypeTitleEn: string; // e.g., "Realistic" or "Pioneer"
  onComplete: () => void; // called when animation finishes
  locale: string;
  /** Optional colorHex override; otherwise looked up from label/content */
  colorHex?: string;
}

// Pre-defined particles — deterministic positions/timings to avoid SSR mismatch
const PARTICLES = [
  { size: "3px", left: "7%", delay: "0.0s", duration: "6.8s" },
  { size: "2px", left: "14%", delay: "1.2s", duration: "8.2s" },
  { size: "4px", left: "21%", delay: "0.5s", duration: "7.1s" },
  { size: "2px", left: "29%", delay: "2.3s", duration: "9.0s" },
  { size: "3px", left: "37%", delay: "0.9s", duration: "6.4s" },
  { size: "5px", left: "46%", delay: "1.7s", duration: "8.6s" },
  { size: "2px", left: "54%", delay: "0.3s", duration: "7.5s" },
  { size: "3px", left: "61%", delay: "2.5s", duration: "6.1s" },
  { size: "4px", left: "70%", delay: "1.0s", duration: "9.2s" },
  { size: "2px", left: "78%", delay: "0.7s", duration: "7.0s" },
  { size: "3px", left: "85%", delay: "1.9s", duration: "8.1s" },
  { size: "2px", left: "92%", delay: "0.4s", duration: "6.6s" },
];

type RevealPhase = "scene" | "avatar" | "name" | "dissolve";

export function OpenWaterReveal({
  archetypeCode,
  archetypeTitle,
  archetypeTitleEn,
  onComplete,
  locale,
  colorHex: colorHexProp,
}: OpenWaterRevealProps) {
  const t = getDictionaryClient(locale as Locale).quickDive;
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("scene");
  const [visible, setVisible] = useState(true);

  // Resolve color from prop, content, or label
  const content = getArchetypeContent(archetypeCode);
  const label = findLabel(archetypeCode);
  const colorHex =
    colorHexProp || content?.colorHex || label?.colorHex || "#0EA5E9";
  const initial = (content?.label_en || archetypeTitleEn || archetypeCode)
    .charAt(0)
    .toUpperCase();

  // Stable ref to avoid stale closure in setTimeout callbacks
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Guard against double-completion (auto-sequence + skip)
  const completedRef = useRef(false);
  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // Skip straight to result without animation
      const t = setTimeout(() => complete(), 150);
      return () => clearTimeout(t);
    }

    // Phase A → B: avatar appears at 1.5s
    const t1 = setTimeout(() => setRevealPhase("avatar"), 1500);
    // Phase B → C: name appears at 3.0s
    const t2 = setTimeout(() => setRevealPhase("name"), 3000);
    // Phase C → D: dissolve starts at 4.5s
    const t3 = setTimeout(() => {
      setRevealPhase("dissolve");
      setVisible(false);
    }, 4500);
    // Complete after exit animation (0.8s dissolve)
    const t4 = setTimeout(() => complete(), 5400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [complete]);

  const handleSkip = () => {
    setVisible(false);
    setTimeout(() => complete(), 700);
  };

  const showAvatar = revealPhase !== "scene";
  const showName = revealPhase === "name" || revealPhase === "dissolve";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <QuickDiveMonographShell
            phase="reveal"
            t={t}
            className="dd-quickdive-monograph--reveal"
            eyebrow={t.typeBadge}
            title={t.monographRevealTitle}
            description={t.monographRevealCopy}
            side={
              <div className="dd-quickdive-monograph__result-plate">
                <p className="dd-quickdive-monograph__side-kicker">
                  {t.monographChapterFirstMap}
                </p>
                <div
                  className="dd-quickdive-monograph__lighthouse"
                  aria-hidden
                />
                <p>{t.archetypeCaveat}</p>
              </div>
            }
          >
            <div className="dd-quickdive-monograph__reveal-scene">
              <div className="dd-quickdive-monograph__particle-field">
                {PARTICLES.map((p, i) => (
                  <span
                    key={i}
                    className="ow-particle"
                    style={{
                      width: p.size,
                      height: p.size,
                      left: p.left,
                      animationDuration: p.duration,
                      animationDelay: p.delay,
                    }}
                  />
                ))}
              </div>
              <motion.div
                className="dd-quickdive-monograph__reveal-avatar"
                style={
                  {
                    "--quickdive-reveal-color": colorHex,
                  } as CSSProperties
                }
                initial={{ opacity: 0, y: 24, scale: 0.8 }}
                animate={{
                  opacity: showAvatar ? 1 : 0,
                  y: showAvatar ? 0 : 24,
                  scale: showAvatar ? 1 : 0.8,
                }}
                transition={{
                  duration: 0.9,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <span>{initial}</span>
              </motion.div>
              <motion.div
                className="dd-quickdive-monograph__reveal-name"
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: showName ? 1 : 0,
                  y: showName ? 0 : 10,
                }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <h3>{locale === "zh" ? archetypeTitle : archetypeTitleEn}</h3>
                {locale === "zh" && <p>{archetypeTitleEn}</p>}
              </motion.div>
            </div>
          </QuickDiveMonographShell>

          {/* ── Skip button (bottom-right corner) ── */}
          <button
            onClick={handleSkip}
            className="dd-quickdive-monograph__skip"
            aria-label={t.skipAnimation}
          >
            {t.skip}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
