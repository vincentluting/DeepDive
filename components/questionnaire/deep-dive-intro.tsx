"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Waves,
  Compass,
  Brain,
  Sparkles,
  FileText,
  MessageCircle,
  UserRound,
} from "lucide-react";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";
import type { Locale } from "@/lib/i18n/config";
import type { ResolvedModules } from "@/lib/questionnaire/module-resolver";

// ============================================================
// DeepDiveIntro — Ocean zone exploration concept intro screen
// Shown before the first question of Deep Dive questionnaire.
// Dynamically shows 3 or 4 ocean zones based on resolved modules.
// ============================================================

interface DeepDiveIntroProps {
  locale: "zh" | "en";
  onBegin: () => void;
  /** Bilingual archetype name from Quick Dive result */
  archetypeName?: { en: string; zh: string };
  /** Resolved modules from server-side module resolver */
  resolvedModules?: ResolvedModules;
}

// Ocean zone definitions (static — filtered by resolved modules at render)
interface OceanZoneConfig {
  key: string;
  icon: typeof Compass;
  questions: number;
  gradient: string;
  borderColor: string;
  iconColor: string;
  delay: number;
}

const RIASEC_ZONE: OceanZoneConfig = {
  key: "Q",
  icon: Sparkles,
  questions: 30,
  gradient:
    "linear-gradient(180deg, rgba(103,232,249,0.15) 0%, rgba(103,232,249,0.06) 100%)",
  borderColor: "rgba(103,232,249,0.25)",
  iconColor: "rgba(103, 232, 249, 0.9)",
  delay: 0.3,
};

const STANDARD_ZONES: OceanZoneConfig[] = [
  {
    key: "A",
    icon: Compass,
    questions: 6,
    gradient:
      "linear-gradient(180deg, rgba(14,165,233,0.10) 0%, rgba(14,165,233,0.03) 100%)",
    borderColor: "rgba(14,165,233,0.15)",
    iconColor: "rgba(56, 189, 248, 0.9)",
    delay: 0.4,
  },
  {
    key: "B",
    icon: Waves,
    questions: 20,
    gradient:
      "linear-gradient(180deg, rgba(59,130,246,0.10) 0%, rgba(59,130,246,0.03) 100%)",
    borderColor: "rgba(59,130,246,0.15)",
    iconColor: "rgba(96, 165, 250, 0.9)",
    delay: 0.6,
  },
  {
    key: "C",
    icon: Brain,
    questions: 60,
    gradient:
      "linear-gradient(180deg, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0.03) 100%)",
    borderColor: "rgba(99,102,241,0.15)",
    iconColor: "rgba(129, 140, 248, 0.9)",
    delay: 0.8,
  },
];

export function DeepDiveIntro({
  locale,
  onBegin,
  archetypeName,
  resolvedModules,
}: DeepDiveIntroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const t = getDictionaryClient(locale as Locale).deepDiveIntro;

  const includeRIASEC = resolvedModules?.includeRIASEC ?? false;

  // Build zone list based on resolved modules
  const zones: OceanZoneConfig[] = [];
  if (includeRIASEC) {
    zones.push(RIASEC_ZONE);
  }
  // Adjust delays when RIASEC is included
  const delayOffset = includeRIASEC ? 0.15 : 0;
  zones.push(
    ...STANDARD_ZONES.map((z) => ({ ...z, delay: z.delay + delayOffset })),
  );

  // Dynamic totals from resolved modules (fallback to current full Deep Dive).
  const totalQuestions = resolvedModules?.totalQuestions ?? 86;
  const dynamicMinutes = resolvedModules?.estimatedMinutes ?? 20;
  const stageCount = includeRIASEC ? 4 : 3;

  // Animation helpers
  const fadeUp = (delay: number) =>
    prefersReducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.7,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  const fade = (delay: number) =>
    prefersReducedMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.7, delay },
        };

  // Bubble particles
  interface BubbleConfig {
    id: number;
    size: number;
    x: number;
    opacity: number;
    delay: number;
    duration: number;
  }

  const [bubbles, setBubbles] = useState<BubbleConfig[]>([]);

  useEffect(() => {
    setBubbles(
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        size: 2 + Math.random() * 2,
        x: Math.random() * 100,
        opacity: 0.1 + Math.random() * 0.25,
        delay: Math.random() * 8,
        duration: 10 + Math.random() * 8,
      })),
    );
  }, []);

  // Zone i18n mapping
  const zoneTexts: Record<
    string,
    { title: string; subtitle: string; desc: string; time: string }
  > = {
    Q: {
      title: t.zoneQTitle,
      subtitle: t.zoneQSubtitle,
      desc: t.zoneQDesc,
      time: t.zoneQTime,
    },
    A: {
      title: t.zoneATitle,
      subtitle: t.zoneASubtitle,
      desc: t.zoneADesc,
      time: t.zoneATime,
    },
    B: {
      title: t.zoneBTitle,
      subtitle: t.zoneBSubtitle,
      desc: t.zoneBDesc,
      time: t.zoneBTime,
    },
    C: {
      title: t.zoneCTitle,
      subtitle: t.zoneCSubtitle,
      desc: t.zoneCDesc,
      time: t.zoneCTime,
    },
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden select-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 20%, #0A3D4A 0%, #041E2B 60%, #020D14 100%)",
      }}
    >
      {/* Bioluminescent glow pulse */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(ellipse at center, rgba(0, 175, 215, 0.05), transparent 70%)",
        }}
        animate={prefersReducedMotion ? {} : { scale: [1.0, 1.08, 1.0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bubbles */}
      {!prefersReducedMotion &&
        bubbles.map((b) => (
          <motion.div
            key={b.id}
            className="absolute rounded-full"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.x}%`,
              bottom: "-4%",
              background:
                b.opacity > 0.2
                  ? "rgba(120, 230, 220, 0.5)"
                  : "rgba(255, 255, 255, 0.4)",
            }}
            animate={{
              y: [0, -1100],
              opacity: [0, b.opacity, b.opacity, 0],
            }}
            transition={{
              duration: b.duration,
              delay: b.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

      {/* Scrollable content */}
      <div className="relative z-20 flex flex-col items-center px-5 pt-12 pb-16 min-h-full">
        <div className="w-full max-w-md lg:max-w-lg">
          {/* Quick Dive completion badge — only shown when RIASEC is NOT included */}
          {!includeRIASEC && (
            <motion.div className="text-center mb-6" {...fade(0.1)}>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: "rgba(14,165,233,0.08)",
                  border: "1px solid rgba(14,165,233,0.2)",
                  color: "rgba(14,165,233,0.8)",
                }}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t.quickDiveComplete}
                {archetypeName && (
                  <span className="font-medium text-sky-300">
                    {pickLocaleText(archetypeName, locale)}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Direct entry badge — shown when RIASEC IS included */}
          {includeRIASEC && (
            <motion.div className="text-center mb-6" {...fade(0.1)}>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: "rgba(103,232,249,0.08)",
                  border: "1px solid rgba(103,232,249,0.2)",
                  color: "rgba(103,232,249,0.8)",
                }}
              >
                <Sparkles size={12} />
                {t.fullExplorationMode}
              </div>
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            className="text-2xl md:text-3xl lg:text-4xl font-light text-white/90 tracking-wide text-center mb-2"
            {...fade(0.15)}
          >
            {t.title}
          </motion.h1>
          <motion.p
            className="text-sm lg:text-base text-white/75 text-center mb-4"
            {...fade(0.2)}
          >
            {t.subtitle}
          </motion.p>

          {/* Trust Strip */}
          <motion.div
            className="flex items-center justify-center gap-2 mb-6 text-xs text-white/65"
            {...fade(0.25)}
          >
            <span>{t.trustGut}</span>
            <span className="w-0.5 h-0.5 rounded-full shrink-0 bg-white/30" />
            <span>{t.trustSave}</span>
            <span className="w-0.5 h-0.5 rounded-full shrink-0 bg-white/30" />
            <span>{t.trustPrivate}</span>
          </motion.div>

          {/* Ocean Zone Cards (3 or 4 depending on RIASEC) */}
          <div className="flex flex-col gap-3 mb-8">
            {zones.map((zone) => {
              const zt = zoneTexts[zone.key];
              const Icon = zone.icon;
              return (
                <motion.div
                  key={zone.key}
                  className="rounded-xl p-4 relative overflow-hidden"
                  style={{
                    background: zone.gradient,
                    border: `1px solid ${zone.borderColor}`,
                  }}
                  {...fadeUp(zone.delay)}
                >
                  {/* Zone content */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <Icon size={18} style={{ color: zone.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <h3 className="text-sm font-medium text-white/90">
                          {zt.title}
                        </h3>
                        <span className="text-[10px] text-white/60 font-mono shrink-0">
                          {interpolate(t.zoneQuestions, {
                            count: zone.questions,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-white/65 mb-1.5">
                        {zt.subtitle}
                      </p>
                      <p className="text-xs lg:text-sm text-white/60 leading-relaxed">
                        {zt.desc}
                      </p>
                      <p className="text-[10px] text-white/65 mt-2 font-mono">
                        {zt.time}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Unlock Preview Card */}
          <motion.div
            className="rounded-xl p-4 mb-6"
            style={{
              background:
                "linear-gradient(180deg, rgba(14,165,233,0.08) 0%, rgba(14,165,233,0.03) 100%)",
              border: "1px solid rgba(14,165,233,0.15)",
            }}
            {...fadeUp(1.0 + delayOffset)}
          >
            <p className="text-xs font-medium text-white/70 mb-3 tracking-wide">
              {t.unlockTitle}
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5">
                <UserRound
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ color: "rgba(56, 189, 248, 0.7)" }}
                />
                <div>
                  <p className="text-xs font-medium text-white/80">
                    {t.unlockProfile}
                  </p>
                  <p className="text-[11px] text-white/65 mt-0.5">
                    {t.unlockProfileDesc}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FileText
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ color: "rgba(56, 189, 248, 0.7)" }}
                />
                <div>
                  <p className="text-xs font-medium text-white/80">
                    {t.unlockReport}
                  </p>
                  <p className="text-[11px] text-white/65 mt-0.5">
                    {t.unlockReportDesc}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MessageCircle
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ color: "rgba(56, 189, 248, 0.7)" }}
                />
                <div>
                  <p className="text-xs font-medium text-white/80">
                    {t.unlockCoach}
                  </p>
                  <p className="text-[11px] text-white/65 mt-0.5">
                    {t.unlockCoachDesc}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-white/60 font-mono mt-3 text-center">
              {interpolate(t.stageSummary, {
                stageCount: String(stageCount),
                totalQuestions: String(totalQuestions),
                dynamicMinutes: String(dynamicMinutes),
              })}
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div className="text-center" {...fadeUp(1.2 + delayOffset)}>
            <button
              onClick={onBegin}
              className="relative px-8 py-3 rounded-lg border border-sky-400/50 bg-transparent text-sky-300 text-sm font-medium tracking-wide transition-all duration-300 hover:bg-sky-400/[0.15] hover:border-sky-400/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#041E2B] active:scale-[0.97]"
            >
              {/* Idle border pulse */}
              {!prefersReducedMotion && (
                <motion.span
                  className="absolute inset-0 rounded-lg border border-sky-400/30 pointer-events-none"
                  animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
              {t.beginDeepDive}
            </button>
          </motion.div>

          {/* Bottom save notice */}
          <motion.p
            className="text-center text-[11px] text-white/65 mt-8"
            {...fade(1.5 + delayOffset)}
          >
            {t.saveNotice}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
