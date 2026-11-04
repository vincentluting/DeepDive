"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import type { BigFiveDimension } from "@/lib/types";
import type {
  FacetPairInput,
  IntraDomainTension,
} from "@/lib/profile-generation/detect-facet-tensions";
import { detectIntraDomainTensions } from "@/lib/profile-generation/detect-facet-tensions";
import { FACET_DISPLAY_LABELS } from "@/lib/profile-generation/facet-display";
import { BIG_FIVE_LABELS } from "@/lib/scoring/constants";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";
import { SpectrumBar } from "./editorial/viz";

interface BigFiveChartProps {
  scores: Record<BigFiveDimension, number>;
  confidence: number;
  locale: string;
  facetPairs?: FacetPairInput[];
  precision?: "full" | "standard" | "screening";
}

const DIMENSION_ORDER: BigFiveDimension[] = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "neuroticism",
];

// Narrative hints per dimension (high vs low)
const DIMENSION_HINTS: Record<
  BigFiveDimension,
  { high: { en: string; zh: string }; low: { en: string; zh: string } }
> = {
  openness: {
    high: { en: "Open to new ideas", zh: "喜欢新体验与创意" },
    low: { en: "Practical & focused", zh: "务实而专注" },
  },
  conscientiousness: {
    high: { en: "Organized & disciplined", zh: "有条理且自律" },
    low: { en: "Flexible & adaptive", zh: "灵活应变型" },
  },
  extraversion: {
    high: { en: "Energized by people", zh: "从社交中充电" },
    low: { en: "Energized by solitude", zh: "从独处中充电" },
  },
  agreeableness: {
    high: { en: "Values harmony", zh: "重视合作与和谐" },
    low: { en: "Direct & independent", zh: "直率而独立" },
  },
  neuroticism: {
    high: { en: "Emotionally perceptive", zh: "情感感知力敏锐" },
    low: { en: "Emotionally steady", zh: "情绪稳定平和" },
  },
};

// Maps dimension key → i18n key suffix for explanation and high/low interpretations
const EXPLAIN_KEY_MAP: Record<
  BigFiveDimension,
  { explain: string; high: string; low: string }
> = {
  openness: {
    explain: "bigFiveExplainOpenness",
    high: "bigFiveHighOpenness",
    low: "bigFiveLowOpenness",
  },
  conscientiousness: {
    explain: "bigFiveExplainConscientiousness",
    high: "bigFiveHighConscientiousness",
    low: "bigFiveLowConscientiousness",
  },
  extraversion: {
    explain: "bigFiveExplainExtraversion",
    high: "bigFiveHighExtraversion",
    low: "bigFiveLowExtraversion",
  },
  agreeableness: {
    explain: "bigFiveExplainAgreeableness",
    high: "bigFiveHighAgreeableness",
    low: "bigFiveLowAgreeableness",
  },
  neuroticism: {
    explain: "bigFiveExplainNeuroticism",
    high: "bigFiveHighNeuroticism",
    low: "bigFiveLowNeuroticism",
  },
};

// FACET_DISPLAY_LABELS now lives in @/lib/profile-generation/facet-display
// (shared with the report's "Beneath the Surface" signature).

// Intra-domain tension insight templates — comprehensive coverage
const TENSION_INSIGHTS: Record<
  string,
  Record<string, { en: string; zh: string }>
> = {
  extraversion: {
    "E3_Assertiveness|E2_Gregariousness": {
      en: "Bold in stance, but selective in company — a quiet leader",
      zh: "立场果断但社交精选——安静的领导者",
    },
    "E3_Assertiveness|E1_Friendliness": {
      en: "Decisive but reserved in warmth — leads with logic, not charm",
      zh: "果断但不热络——以逻辑而非魅力带领",
    },
    "E1_Friendliness|E3_Assertiveness": {
      en: "Warm and approachable, but less inclined to push or direct",
      zh: "温暖亲和，但不倾向推动或指挥",
    },
    "E4_Activity_Level|E2_Gregariousness": {
      en: "High-energy doer who prefers working alone — an independent engine",
      zh: "精力充沛但偏好独立行动——独行动力机",
    },
    "E6_Cheerfulness|E3_Assertiveness": {
      en: "Upbeat and positive, but avoids taking the lead — a cheerful supporter",
      zh: "乐观积极但不争先——快乐的支持者",
    },
    "E1_Friendliness|E2_Gregariousness": {
      en: "Warm one-on-one, but drains quickly in groups — a deep connector",
      zh: "一对一时温暖，群体中消耗快——深度连接者",
    },
    "E5_Excitement-Seeking|E1_Friendliness": {
      en: "Craves novel experiences, but in a small trusted circle",
      zh: "渴望新鲜体验，但只和信任的人一起",
    },
  },
  openness: {
    "O1_Imagination|O2_Artistic_Interests": {
      en: "Rich inner world, but through concepts — not art",
      zh: "内心世界丰富，但通过概念而非艺术探索",
    },
    "O5_Intellect|O3_Emotionality": {
      en: "Deep thinker with a cool, analytical approach to feelings",
      zh: "深度思考者，以冷静分析的方式处理情感",
    },
    "O4_Adventurousness|O2_Artistic_Interests": {
      en: "Explores through action and experience, not aesthetic contemplation",
      zh: "通过行动和体验探索，而非审美沉思",
    },
    "O5_Intellect|O4_Adventurousness": {
      en: "Loves exploring ideas in depth, but prefers the familiar in daily life",
      zh: "热爱深度钻研思想，但日常偏好熟悉的环境",
    },
    "O1_Imagination|O5_Intellect": {
      en: "Vivid imagination fueled by intuition, not systematic analysis",
      zh: "丰富想象力来自直觉而非系统分析",
    },
    "O3_Emotionality|O6_Liberalism": {
      en: "Emotionally rich and expressive, but values structure in beliefs",
      zh: "情感丰富而外显，但信念上偏好传统框架",
    },
    "O6_Liberalism|O1_Imagination": {
      en: "Open to challenging norms, but grounded rather than dreamy",
      zh: "敢于挑战常规，但务实而非空想",
    },
  },
  agreeableness: {
    "A3_Altruism|A1_Trust": {
      en: "Wants to help, but keeps a careful eye — a guarded idealist",
      zh: "想要帮助但保持警觉——有防备的理想主义者",
    },
    "A4_Cooperation|A5_Modesty": {
      en: "Collaborative but confident — cooperates without self-diminishing",
      zh: "合作但自信——协作不自贬",
    },
    "A6_Sympathy|A4_Cooperation": {
      en: "Deeply empathetic, but stands firm on own principles when it matters",
      zh: "共情力极强，但在关键时刻坚持己见",
    },
    "A1_Trust|A2_Morality": {
      en: "Trusts people easily, but has a flexible moral compass",
      zh: "容易信任他人，但道德判断较为灵活",
    },
    "A2_Morality|A1_Trust": {
      en: "Strong moral clarity, paired with healthy skepticism of others",
      zh: "道德标准清晰，同时对他人保持适度怀疑",
    },
  },
  conscientiousness: {
    "C4_Achievement-Striving|C5_Self-Discipline": {
      en: "Ambitious goals, but execution comes in bursts — a sprint racer",
      zh: "目标远大但执行靠爆发——冲刺型选手",
    },
    "C1_Self-Efficacy|C2_Orderliness": {
      en: "Confident in capability, but less rigid about process",
      zh: "对能力自信但不拘泥于流程",
    },
    "C4_Achievement-Striving|C6_Cautiousness": {
      en: "Drives hard toward goals, but decides fast — an action-biased achiever",
      zh: "目标驱动力强且决策快速——行动偏向型成就者",
    },
    "C3_Dutifulness|C1_Self-Efficacy": {
      en: "Follows through on commitments, but doubts own capability — an underestimated workhorse",
      zh: "信守承诺但低估自身能力——被低估的实干家",
    },
    "C2_Orderliness|C4_Achievement-Striving": {
      en: "Organized and systematic, but not obsessed with winning — a meticulous craftsperson",
      zh: "有条理有系统，但不执着于赢——精细的匠人",
    },
    "C5_Self-Discipline|C3_Dutifulness": {
      en: "Self-directed and disciplined, but chooses own path over obligations",
      zh: "自律且有方向感，但选择自己的路而非义务",
    },
  },
  neuroticism: {
    "N1_Anxiety|N3_Depression": {
      en: "Alert and watchful, but bounces back — a vigilant optimist",
      zh: "警觉紧张但恢复力强——警觉型乐观者",
    },
    "N5_Immoderation|N6_Vulnerability": {
      en: "Impulse-driven moments despite solid stress resilience",
      zh: "抗压能力强但偶有冲动时刻",
    },
    "N4_Self-Consciousness|N1_Anxiety": {
      en: "Socially self-aware but mentally calm — notices others' reactions without spiraling",
      zh: "社交中自我意识强但内心平稳——能察觉他人反应而不焦虑",
    },
    "N1_Anxiety|N4_Self-Consciousness": {
      en: "Inner worrier who appears confident socially — calm surface, active mind",
      zh: "内心容易担忧但社交自信——平静的表面下思绪活跃",
    },
    "N3_Depression|N5_Immoderation": {
      en: "Mood stays stable, but impulse control is the growth edge",
      zh: "情绪稳定，但冲动控制是成长方向",
    },
    "N6_Vulnerability|N1_Anxiety": {
      en: "Feels pressure deeply in tough moments, but doesn't anticipate problems",
      zh: "在困难时刻感受深刻，但不会预支焦虑",
    },
  },
};

/**
 * Get facets for a specific domain, sorted by deviation magnitude.
 */
function getFacetsForDomain(
  facetPairs: FacetPairInput[],
  domain: BigFiveDimension,
): FacetPairInput[] {
  return facetPairs
    .filter((f) => f.domain === domain)
    .sort(
      (a, b) => Math.abs(b.deviationFromMean) - Math.abs(a.deviationFromMean),
    );
}

/**
 * Find the tension for a specific domain from pre-computed tensions,
 * and attach a human-readable insight if available.
 */
function findDomainTensionInsight(
  tensions: IntraDomainTension[],
  domain: string,
): {
  tension: IntraDomainTension;
  insight: { en: string; zh: string } | null;
} | null {
  const tension = tensions.find((t) => t.domain === domain);
  if (!tension) return null;

  const domainInsights = TENSION_INSIGHTS[domain] ?? {};
  const key1 = `${tension.high.facet}|${tension.low.facet}`;
  const key2 = `${tension.low.facet}|${tension.high.facet}`;
  const insight = domainInsights[key1] ?? domainInsights[key2] ?? null;

  return { tension, insight };
}

function getFacetLabel(facetKey: string, loc: "en" | "zh"): string {
  const label = FACET_DISPLAY_LABELS[facetKey];
  if (label) return pickLocaleText(label, loc);
  // Fallback: extract from code name
  return facetKey.split("_").slice(1).join(" ");
}

/**
 * Derive a relative positioning label for a score.
 * Based on typical Big Five population distribution (mean ~50, SD ~15).
 */
function getRelativeLabel(
  score: number,
  t: Record<string, string>,
): { label: string; className: string } | null {
  if (score >= 65)
    return {
      label: t.bigFiveAboveAverage,
      className: "text-rev-signal-info",
    };
  if (score <= 35)
    return {
      label: t.bigFiveBelowAverage,
      className: "text-rev-ink-soft",
    };
  if (score >= 45 && score <= 55)
    return {
      label: t.bigFiveNearAverage,
      className: "text-rev-ink-soft/80",
    };
  return null;
}

/**
 * Build a "personality signature" — the top 2-3 most distinctive traits
 * from both domain-level extremes and facet-level tensions.
 */
function buildSignature(
  scores: Record<BigFiveDimension, number>,
  tensions: IntraDomainTension[],
  loc: "en" | "zh",
): string[] {
  const items: string[] = [];

  // 1. Find the most extreme dimensions (furthest from 50)
  const ranked = DIMENSION_ORDER.map((dim) => ({
    dim,
    score: scores[dim] ?? 50,
    dist: Math.abs((scores[dim] ?? 50) - 50),
  })).sort((a, b) => b.dist - a.dist);

  // Add top 2 most distinctive domain-level traits
  for (const { dim, score } of ranked.slice(0, 2)) {
    if (Math.abs(score - 50) < 10) continue; // Skip near-average
    const hint = DIMENSION_HINTS[dim];
    const isHigh = score >= 55;
    items.push(pickLocaleText(isHigh ? hint.high : hint.low, loc));
  }

  // 2. Add the strongest tension as a signature element
  if (tensions.length > 0 && tensions[0].tensionStrength > 1.0) {
    const t = tensions[0];
    const domainInsights = TENSION_INSIGHTS[t.domain] ?? {};
    const key1 = `${t.high.facet}|${t.low.facet}`;
    const key2 = `${t.low.facet}|${t.high.facet}`;
    const insight = domainInsights[key1] ?? domainInsights[key2];
    if (insight) {
      items.push(pickLocaleText(insight, loc));
    }
  }

  return items.slice(0, 3);
}

export function BigFiveChart({
  scores,
  confidence,
  locale,
  facetPairs,
  precision,
}: BigFiveChartProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const loc = locale as "en" | "zh";
  const [expandedDim, setExpandedDim] = useState<BigFiveDimension | null>(null);
  const [showDerivation, setShowDerivation] = useState(false);

  const hasFacets =
    facetPairs && facetPairs.length > 0 && precision !== "screening";

  // Compute all tensions once (shared utility), then look up per domain
  const allTensions = hasFacets ? detectIntraDomainTensions(facetPairs, 5) : [];

  // Build personality signature
  const signature = buildSignature(scores, allTensions, loc);

  return (
    <div className="space-y-4">
      {/* Personality Signature — top-level summary */}
      {signature.length > 0 && (
        <div className="pb-3 mb-1 border-b border-rev-rule/60">
          <p className="text-[10px] font-mono uppercase tracking-wider text-rev-ink-soft/70 mb-2">
            {t.bigFiveSignatureTitle}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {signature.map((item, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full bg-rev-paper border border-rev-rule text-rev-ink/80 leading-tight"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {DIMENSION_ORDER.map((dim) => {
        const score = scores[dim] ?? 50;
        const label = BIG_FIVE_LABELS[dim];
        const hint = DIMENSION_HINTS[dim];
        const isHigh = score >= 55;
        const isExpanded = expandedDim === dim;
        const keys = EXPLAIN_KEY_MAP[dim];

        // Get facets for this domain
        const domainFacets = hasFacets
          ? getFacetsForDomain(facetPairs, dim)
          : [];
        const tensionResult =
          domainFacets.length > 0
            ? findDomainTensionInsight(allTensions, dim)
            : null;
        const relativeLabel = getRelativeLabel(score, t);

        return (
          <div key={dim} className="space-y-1.5">
            {/* Label row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rev-glow-cold/60" />
                <span className="text-sm font-medium text-rev-ink">
                  {pickLocaleText(label, loc)}
                </span>
                {/* Info toggle */}
                <button
                  type="button"
                  onClick={() => setExpandedDim(isExpanded ? null : dim)}
                  className="p-0.5 rounded-full text-rev-ink-soft/60 hover:text-rev-ink-soft transition-colors"
                  aria-label={t.bigFiveWhyTitle}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {/* Tension indicator */}
                {tensionResult && !isExpanded && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rev-paper border border-rev-signal-attention/35 text-rev-signal-attention font-medium">
                    {t.bigFiveTensionBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Relative positioning label */}
                {relativeLabel && (
                  <span className={`text-[10px] ${relativeLabel.className}`}>
                    {relativeLabel.label}
                  </span>
                )}
                <span className="text-xs text-rev-ink-soft font-mono tabular-nums">
                  {score}
                </span>
              </div>
            </div>

            {/* Spectrum — editorial replacement for the domain progress bar */}
            <SpectrumBar
              value={score}
              color="var(--rev-glow-cold)"
              height={7}
              centerTick
              marker
            />

            {/* Narrative hint */}
            <p className="text-[11px] text-rev-ink-soft/80 leading-relaxed">
              {isHigh
                ? pickLocaleText(hint.high, loc)
                : pickLocaleText(hint.low, loc)}
            </p>

            {/* Tension preview — visible without expanding */}
            {tensionResult && !isExpanded && (
              <button
                type="button"
                onClick={() => setExpandedDim(dim)}
                className="w-full text-left mt-0.5 px-2.5 py-1.5 rounded-[2px] bg-rev-paper-warm border border-rev-signal-attention/25 hover:bg-rev-paper transition-colors group/tension"
              >
                <p className="text-[11px] leading-relaxed text-rev-signal-attention">
                  <span className="mr-1">⚡</span>
                  {tensionResult.insight
                    ? pickLocaleText(tensionResult.insight, loc)
                    : loc === "zh"
                      ? `${getFacetLabel(tensionResult.tension.high.facet, loc)}↑ ${getFacetLabel(tensionResult.tension.low.facet, loc)}↓`
                      : `${getFacetLabel(tensionResult.tension.high.facet, loc)}↑ ${getFacetLabel(tensionResult.tension.low.facet, loc)}↓`}
                  <ChevronDown className="inline-block w-3 h-3 ml-1 opacity-40 group-hover/tension:opacity-70 transition-opacity" />
                </p>
              </button>
            )}

            {/* Expandable explanation + facet breakdown */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-3 rounded-[4px] border border-rev-rule/60 space-y-3 bg-rev-paper-warm">
                    {/* What this dimension measures */}
                    <p className="text-xs text-rev-ink-soft leading-relaxed">
                      {t[keys.explain as keyof typeof t]}
                    </p>
                    {/* Personalized interpretation */}
                    <p className="text-xs font-medium leading-relaxed text-rev-signal-info">
                      {isHigh
                        ? t[keys.high as keyof typeof t]
                        : t[keys.low as keyof typeof t]}
                    </p>

                    {/* Facet breakdown */}
                    {domainFacets.length > 0 && (
                      <div className="pt-2 border-t border-rev-rule/50 space-y-2">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-rev-ink-soft/80">
                          {t.bigFiveSubDimensions}
                        </p>
                        <div className="space-y-1.5">
                          {domainFacets.map((facet) => {
                            const facetLabel = getFacetLabel(facet.facet, loc);
                            // Scale 1-5 → 0-100% for bar width
                            const barWidth = Math.round(
                              ((facet.score - 1) / 4) * 100,
                            );
                            const isTensionHigh =
                              tensionResult?.tension.high.facet === facet.facet;
                            const isTensionLow =
                              tensionResult?.tension.low.facet === facet.facet;
                            const isTensionFacet =
                              isTensionHigh || isTensionLow;
                            const absDev = Math.abs(facet.deviationFromMean);

                            return (
                              <div key={facet.facet} className="group">
                                <div className="flex items-center gap-2">
                                  {/* Facet label */}
                                  <span
                                    className={`text-[11px] w-[5.5rem] shrink-0 truncate ${
                                      isTensionFacet
                                        ? "font-semibold text-rev-ink"
                                        : "text-rev-ink-soft"
                                    }`}
                                    title={facetLabel}
                                  >
                                    {facetLabel}
                                  </span>
                                  {/* Mini facet spectrum */}
                                  <div
                                    className={`flex-1 ${isTensionFacet ? "opacity-100" : "opacity-80"}`}
                                  >
                                    <SpectrumBar
                                      value={barWidth}
                                      color="var(--rev-glow-cold)"
                                      height={5}
                                      centerTick
                                    />
                                  </div>
                                  {/* Score + deviation arrow */}
                                  <span className="text-[10px] font-mono tabular-nums text-rev-ink-soft w-7 text-right shrink-0">
                                    {facet.score.toFixed(1)}
                                  </span>
                                  <span className="w-3 text-center shrink-0">
                                    {absDev > 0.3 ? (
                                      <span
                                        className={`text-[10px] ${isTensionFacet ? "text-rev-signal-info" : "text-rev-ink-soft/60"}`}
                                      >
                                        {facet.deviationFromMean > 0
                                          ? "↑"
                                          : "↓"}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-rev-ink-soft/50">
                                        ·
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Tension insight */}
                        {tensionResult && (
                          <div className="mt-2 px-2.5 py-2 rounded-[2px] bg-rev-paper-warm border border-rev-signal-attention/30 border-l-2 border-l-rev-signal-attention">
                            <div className="flex items-start gap-1.5">
                              <span className="text-rev-signal-attention text-xs mt-px shrink-0">
                                ⚡
                              </span>
                              <p className="text-[11px] leading-relaxed text-rev-ink">
                                {tensionResult.insight
                                  ? pickLocaleText(tensionResult.insight, loc)
                                  : loc === "zh"
                                    ? `高${getFacetLabel(tensionResult.tension.high.facet, loc)}与低${getFacetLabel(tensionResult.tension.low.facet, loc)}并存——域级分数看不到的内在矛盾`
                                    : `High ${getFacetLabel(tensionResult.tension.high.facet, loc)} meets low ${getFacetLabel(tensionResult.tension.low.facet, loc)} — a contradiction hidden by the domain score`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Derivation chain: Big Five → Collab Style → Shadow */}
      <div className="pt-3 border-t border-rev-rule space-y-2">
        <button
          type="button"
          onClick={() => setShowDerivation(!showDerivation)}
          className="flex items-center gap-1.5 text-[11px] text-rev-signal-info/80 hover:text-rev-signal-info transition-colors group"
        >
          <motion.div
            animate={{ rotate: showDerivation ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3 h-3" />
          </motion.div>
          <span className="font-medium">{t.bigFiveDerivationTitle}</span>
        </button>

        <AnimatePresence initial={false}>
          {showDerivation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 py-1">
                {/* Collab derivation */}
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-rev-glow-cold/50 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-rev-ink-soft leading-relaxed">
                    {t.bigFiveDerivationCollab}
                  </p>
                </div>
                {/* Shadow derivation */}
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-rev-glow-cold/40 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-rev-ink-soft leading-relaxed">
                    {t.bigFiveDerivationShadow}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confidence footer */}
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[11px] text-rev-ink-soft/80 font-mono tabular-nums">
            {t.accuracy} {(confidence * 100).toFixed(0)}%
          </span>
          <span className="text-[10px] text-rev-ink-soft/80">
            {t.indirectlyDerivedShort}
          </span>
        </div>
      </div>
    </div>
  );
}
