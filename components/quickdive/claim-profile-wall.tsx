// ============================================================
// ClaimProfileWall — Glassmorphism career preview + "Claim Your Profile" CTA
//
// For unauthenticated users: shows blurred career cards behind a
// glassmorphism overlay with a "Claim" CTA (Endowment Effect framing).
// For authenticated users: renders career cards normally.
//
// Replaces save-results-cta.tsx on the Quick Dive result page.
// Design principle: "认领/Claim" → ownership framing, not "注册/Sign Up".
// ============================================================

"use client";

import { motion } from "framer-motion";
import { LogIn } from "lucide-react";
import Link from "next/link";
import type { CareerItem, RiasecKey } from "./quickdive-data";
import { AiEraBadge } from "@/components/report/ai-era-badge";
import { ResilienceBadge } from "@/components/report/resilience-badge";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

interface ClaimProfileWallProps {
  careers: {
    topCareers: CareerItem[];
    fitCareers: CareerItem[];
    drainCareers?: CareerItem[];
  };
  archetypeCode: string;
  archetypeTitle: string; // Chinese
  archetypeTitleEn: string; // English
  locale: string;
  onClaimClick: () => void; // opens registration panel
  isLoggedIn: boolean;
  /** When true, uses warm archive aesthetic from immersive mode */
  immersive?: boolean;
}

export function ClaimProfileWall({
  careers,
  archetypeCode,
  archetypeTitle,
  archetypeTitleEn,
  locale,
  onClaimClick,
  isLoggedIn,
  immersive = false,
}: ClaimProfileWallProps) {
  const t = getDictionaryClient(locale as Locale).quickDive;
  const isZh = locale === "zh";
  const archetypeName = isZh ? archetypeTitle : archetypeTitleEn;

  // ── Authenticated: render careers normally ────────────────
  if (isLoggedIn) {
    return (
      <div className="grid gap-4 mb-6">
        {/* Interest-based context note */}
        <p
          className="text-[11px] text-center leading-relaxed -mb-1"
          style={{
            color: immersive
              ? "rgba(255, 255, 255, 0.72)"
              : "var(--text-secondary-on-shallow)",
          }}
        >
          {t.careerContextNote}
        </p>
        <NormalCareerCard
          title={t.claimBestFit}
          items={careers.topCareers}
          color={immersive ? "rgba(255, 225, 160, 0.92)" : "#10A050"}
          delay={0.35}
          immersive={immersive}
          locale={locale as "en" | "zh"}
        />
        <NormalCareerCard
          title={t.claimGoodFit}
          items={careers.fitCareers}
          color={immersive ? "rgba(255, 255, 255, 0.78)" : "var(--primary)"}
          delay={0.45}
          immersive={immersive}
          locale={locale as "en" | "zh"}
        />
        {careers.drainCareers && careers.drainCareers.length > 0 && (
          <NormalCareerCard
            title={t.drainTitle}
            items={careers.drainCareers}
            color={immersive ? "rgba(255, 255, 255, 0.8)" : "#B45A3C"}
            delay={0.55}
            immersive={immersive}
            locale={locale as "en" | "zh"}
            variant="drain"
          />
        )}
      </div>
    );
  }

  // ── Unauthenticated: blurred wall + claim CTA ────────────

  const allCareers = [...careers.topCareers, ...careers.fitCareers];
  const displayCareers = allCareers.slice(0, 5);
  const topCount = careers.topCareers.length;

  const headline = interpolate(t.claimHeadline, { archetype: archetypeName });
  const subtitle = t.claimSubtitle;
  const buttonText = t.claimButton;
  const noteText = t.claimNote;

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
    >
      {/* Section header */}
      <div className="text-center mb-3">
        <span
          className="text-[10px] font-mono tracking-[0.2em] uppercase"
          style={{
            color: immersive
              ? "rgba(255, 255, 255, 0.75)"
              : "var(--text-secondary-on-shallow)",
          }}
        >
          {t.claimTitle}
        </span>
      </div>

      {/* Blurred content + overlay container */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ minHeight: 360 }}
      >
        {/* Career cards — top visible, fading to blur (gradient mask effect) */}
        <div
          className="flex flex-col gap-3 p-4"
          style={{
            userSelect: "none",
            pointerEvents: "none",
            maskImage: "linear-gradient(180deg, black 10%, transparent 85%)",
            WebkitMaskImage:
              "linear-gradient(180deg, black 10%, transparent 85%)",
          }}
          aria-hidden="true"
        >
          {displayCareers.map((career, i) => {
            const barColor = immersive
              ? i < topCount
                ? "linear-gradient(90deg, rgba(139, 104, 64, 0.8), rgba(255, 225, 160, 0.88))"
                : "linear-gradient(90deg, rgba(112, 96, 80, 0.6), rgba(230, 220, 205, 0.75))"
              : i < topCount
                ? "linear-gradient(90deg, var(--archetype-s-rev), var(--archetype-s-dive))"
                : "linear-gradient(90deg, var(--primary), var(--archetype-i-dive))";
            return (
              <div
                key={i}
                className="rounded-xl px-4 py-3"
                style={
                  immersive
                    ? {
                        background: "#1A1610",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }
                    : {
                        background: "var(--glass-shallow)",
                        border: "1px solid var(--card-border-subtle)",
                      }
                }
              >
                <span
                  className="text-sm font-medium block mb-2 truncate"
                  style={{
                    color: immersive
                      ? "rgba(255, 255, 255, 0.95)"
                      : "var(--foreground)",
                  }}
                >
                  {career.name}
                </span>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{
                    background: immersive
                      ? "rgba(255, 255, 255, 0.06)"
                      : "var(--card-border-subtle)",
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${career.pct}%`, background: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Gradient overlay — softer transition */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: immersive
              ? "linear-gradient(180deg, transparent 0%, rgba(15, 12, 6, 0.5) 50%, rgba(15, 12, 6, 0.9) 100%)"
              : "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--depth-shallow) 40%, transparent) 50%, color-mix(in srgb, var(--depth-shallow) 85%, transparent) 100%)",
          }}
        />

        {/* CTA overlay — centered on blurred content */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <motion.div
            className="w-full max-w-sm rounded-2xl px-6 py-6 text-center"
            style={
              immersive
                ? {
                    background: "rgba(26, 22, 16, 0.85)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(240, 220, 170, 0.15)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                  }
                : {
                    background: "var(--overlay-card)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid var(--overlay-card-border)",
                    boxShadow: "var(--overlay-card-shadow)",
                  }
            }
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Archetype badge */}
            <div
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full mb-3"
              style={
                immersive
                  ? {
                      background: "rgba(240, 220, 170, 0.06)",
                      border: "1px solid rgba(240, 220, 170, 0.2)",
                    }
                  : {
                      background: "rgba(232, 118, 58, 0.1)",
                      border: "1px solid rgba(232, 118, 58, 0.2)",
                    }
              }
            >
              <span
                className="text-[10px] font-mono tracking-widest"
                style={{
                  color: immersive ? "rgba(255, 225, 160, 0.88)" : "#E8763A",
                }}
              >
                {archetypeCode.split("-")[0]}
              </span>
            </div>

            {/* Headline */}
            <h3
              className="text-lg font-bold mb-1.5 leading-snug"
              style={{
                color: immersive
                  ? "rgba(255, 255, 255, 0.96)"
                  : "var(--foreground)",
                fontFamily: "var(--font-display, inherit)",
              }}
            >
              {headline}
            </h3>

            {/* Subtitle */}
            <p
              className="text-xs mb-5 leading-relaxed"
              style={{
                color: immersive
                  ? "rgba(255, 255, 255, 0.82)"
                  : "var(--text-secondary-on-shallow)",
              }}
            >
              {subtitle}
            </p>

            {/* Primary CTA button */}
            <button
              onClick={onClaimClick}
              data-testid="quickdive-claim-profile-button"
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] mb-2.5"
              style={
                immersive
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(139, 104, 64, 0.8) 0%, rgba(160, 130, 80, 0.7) 100%)",
                      boxShadow: "0 4px 16px rgba(139, 104, 64, 0.3)",
                    }
                  : {
                      background:
                        "linear-gradient(135deg, #E8763A 0%, #F59E5A 100%)",
                      boxShadow: "0 4px 16px rgba(232, 118, 58, 0.3)",
                    }
              }
            >
              {buttonText}
            </button>

            {/* Note text */}
            <p
              className="text-[10px] mb-3"
              style={{
                color: immersive
                  ? "rgba(255, 255, 255, 0.68)"
                  : "var(--text-secondary-on-shallow)",
              }}
            >
              {noteText}
            </p>

            {/* Login link for existing users */}
            <p
              className="text-xs"
              style={{
                color: immersive
                  ? "rgba(255, 255, 255, 0.75)"
                  : "var(--text-secondary-on-shallow)",
              }}
            >
              {t.claimAlreadyHaveAccount}
              <Link
                href={`/${locale}/login?returnUrl=${encodeURIComponent(`/${locale}/quickdive`)}`}
                className="inline-flex items-center gap-1 font-medium transition-colors hover:opacity-75"
                style={{
                  color: immersive ? "rgba(255, 225, 160, 0.88)" : "#E8763A",
                }}
              >
                <LogIn size={12} />
                {t.claimLogIn}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Behavioral reason phrases ────────────────────────────────
// Each RIASEC dimension gets multiple match/drain phrases.
// Per career, we pick based on the primary driving dimension,
// using a stable hash to vary across items (avoid repetition).

const MATCH_PHRASES: Record<RiasecKey, { zh: string; en: string }[]> = {
  R: [
    {
      zh: "你喜欢亲手把想法变成看得见的成果",
      en: "You like turning ideas into tangible results with your own hands",
    },
    {
      zh: "动手解决问题时你最有状态",
      en: "You're at your best when solving problems hands-on",
    },
    {
      zh: "你追求可触碰的、实实在在的产出",
      en: "You pursue output you can see and touch",
    },
  ],
  I: [
    {
      zh: "你享受把复杂问题拆解到本质",
      en: "You enjoy breaking complex problems down to their essence",
    },
    {
      zh: "独立研究和深度分析让你进入心流",
      en: "Independent research and deep analysis put you in flow",
    },
    {
      zh: '弄明白"为什么"比知道"是什么"更让你兴奋',
      en: 'Understanding "why" excites you more than knowing "what"',
    },
  ],
  A: [
    {
      zh: "你在开放式创造中才能真正进入心流",
      en: "You only truly enter flow during open-ended creation",
    },
    {
      zh: "用非常规方式重新定义问题是你的本能",
      en: "Redefining problems in unconventional ways is your instinct",
    },
    {
      zh: "你需要表达空间，而不是执行指令",
      en: "You need room to express, not instructions to execute",
    },
  ],
  S: [
    {
      zh: "你天然关注身边人的需求和感受",
      en: "You naturally tune into others' needs and feelings",
    },
    {
      zh: "帮助他人解决真实困境让你充满能量",
      en: "Helping others through real struggles energizes you",
    },
    {
      zh: "你擅长创造让人感到被理解的空间",
      en: "You excel at creating spaces where people feel understood",
    },
  ],
  E: [
    {
      zh: "你天然会站出来推动事情往前走",
      en: "You naturally step up to push things forward",
    },
    {
      zh: "说服、组织和调动资源是你的本能反应",
      en: "Persuading, organizing, and mobilizing resources is instinctive for you",
    },
    {
      zh: "你需要足够大的舞台来释放内在驱动力",
      en: "You need a stage big enough to match your inner drive",
    },
  ],
  C: [
    {
      zh: "你在把混乱变成清晰秩序的过程中找到满足",
      en: "You find satisfaction in turning chaos into clear order",
    },
    {
      zh: "精确和可靠是你赢得信任的方式",
      en: "Precision and reliability are how you earn trust",
    },
    {
      zh: "你享受让系统可预测、可衡量地运转",
      en: "You enjoy making systems run predictably and measurably",
    },
  ],
};

const DRAIN_PHRASES: Record<RiasecKey, { zh: string; en: string }[]> = {
  R: [
    {
      zh: "大量动手操作会消耗你的思考能量",
      en: "Heavy hands-on work drains your thinking energy",
    },
    {
      zh: "你更擅长构想，长时间体力执行会让你疲惫",
      en: "You're better at conceiving — prolonged physical execution wears you out",
    },
  ],
  I: [
    {
      zh: "需要长时间独立钻研，而你偏好行动或互动",
      en: "Requires long solo deep-dives, but you prefer action or interaction",
    },
    {
      zh: "持续的抽象分析会让你渴望更直接的成果",
      en: "Constant abstract analysis makes you crave more tangible output",
    },
  ],
  A: [
    {
      zh: "需要持续的创意输出，而你偏好有章可循",
      en: "Demands constant creative output, but you prefer clear guidelines",
    },
    {
      zh: "开放式和模糊的目标会让你感到不安",
      en: "Open-ended, ambiguous goals make you uneasy",
    },
  ],
  S: [
    {
      zh: "频繁的人际互动会超出你的舒适节奏",
      en: "Frequent interpersonal interaction exceeds your comfort zone",
    },
    {
      zh: "需要持续共情和情绪劳动，而你偏好独立工作",
      en: "Requires constant empathy and emotional labor — you prefer working independently",
    },
  ],
  E: [
    {
      zh: "持续说服和推动他人不是你的自然节奏",
      en: "Constantly persuading and pushing others is not your natural rhythm",
    },
    {
      zh: "你更享受深耕，而非在不确定中争夺资源",
      en: "You prefer deep work over competing for resources amid uncertainty",
    },
  ],
  C: [
    {
      zh: "在严格框架内反复执行，而你渴望灵活探索",
      en: "Repetitive execution within rigid frameworks — you crave flexible exploration",
    },
    {
      zh: "高度标准化的流程会磨灭你的内在动力",
      en: "Highly standardized processes will erode your inner motivation",
    },
  ],
};

/** Stable hash to vary phrase selection across items in a list */
function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function translucentColor(color: string, percentage: number): string {
  return `color-mix(in srgb, ${color} ${percentage}%, transparent)`;
}

function getMatchReason(item: CareerItem, locale: "en" | "zh"): string | null {
  if (!item.matchDimensions || item.matchDimensions.length === 0) return null;
  const dim = item.matchDimensions[0];
  const phrases = MATCH_PHRASES[dim];
  if (!phrases || phrases.length === 0) return null;
  const idx = stableHash(item.id ?? item.name) % phrases.length;
  return locale === "zh" ? phrases[idx].zh : phrases[idx].en;
}

function getDrainReason(item: CareerItem, locale: "en" | "zh"): string | null {
  if (!item.drainDimension) return null;
  const phrases = DRAIN_PHRASES[item.drainDimension];
  if (!phrases || phrases.length === 0) return null;
  const idx = stableHash(item.id ?? item.name) % phrases.length;
  return locale === "zh" ? phrases[idx].zh : phrases[idx].en;
}

// ── Normal Career Card (for authenticated users) ────────────

function NormalCareerCard({
  title,
  items,
  color,
  delay,
  immersive = false,
  locale = "en",
  variant = "match",
}: {
  title: string;
  items: CareerItem[];
  color: string;
  delay: number;
  immersive?: boolean;
  locale?: "en" | "zh";
  variant?: "match" | "drain";
}) {
  return (
    <motion.div
      className="rounded-2xl p-3 sm:p-4"
      style={
        immersive
          ? {
              background: "#1A1610",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }
          : {
              background: "var(--glass-shallow)",
              border: "1px solid var(--card-border-subtle)",
            }
      }
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: immersive ? 0.8 : 0.35 }}
    >
      <h3 className="text-xs font-semibold mb-3" style={{ color }}>
        {title}
      </h3>
      <div className="flex flex-col gap-3 sm:gap-2">
        {items.map((item, i) => {
          const reason =
            variant === "drain"
              ? getDrainReason(item, locale ?? "en")
              : getMatchReason(item, locale ?? "en");
          return (
            <div
              key={i}
              className="rounded-xl px-3 py-3 sm:px-4"
              style={
                immersive
                  ? {
                      background: "rgba(26, 20, 8, 0.6)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                    }
                  : {
                      background: translucentColor(color, 8),
                      border: `1px solid ${translucentColor(color, 22)}`,
                    }
              }
            >
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mb-1">
                <span
                  className="flex-1 min-w-0 text-sm font-medium leading-snug"
                  style={{
                    color: immersive
                      ? "rgba(255, 255, 255, 0.95)"
                      : "var(--foreground)",
                  }}
                >
                  {item.name}
                </span>
                {item.aiEraCategory && (
                  <span className="shrink-0 mt-0.5">
                    <AiEraBadge category={item.aiEraCategory} locale={locale} />
                  </span>
                )}
                {item.resilienceLevel != null && (
                  <span className="shrink-0 mt-0.5">
                    <ResilienceBadge
                      level={item.resilienceLevel}
                      locale={locale as "en" | "zh"}
                    />
                  </span>
                )}
              </div>
              {item.tagline && (
                <p
                  className="text-[11px] leading-snug mb-1"
                  style={{
                    color: immersive
                      ? "rgba(255, 255, 255, 0.6)"
                      : "var(--text-secondary-on-shallow)",
                    opacity: 0.85,
                  }}
                >
                  {item.tagline}
                </p>
              )}
              {reason && (
                <p
                  className="text-[11px] leading-snug mb-1.5"
                  style={{
                    color: immersive
                      ? "rgba(255, 255, 255, 0.75)"
                      : "var(--text-secondary-on-shallow)",
                  }}
                >
                  {reason}
                </p>
              )}
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{
                  background: immersive
                    ? "rgba(255, 255, 255, 0.06)"
                    : translucentColor(color, 15),
                }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.pct}%`,
                    background: color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
