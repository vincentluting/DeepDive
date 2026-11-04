"use client";

import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import type { AnswerValue } from "@/lib/types";
import type { SchwartzValue } from "@/lib/types/dimensions";
import {
  MODULE_DEPTH_COLORS,
  useQuestionnaireStore,
} from "@/store/questionnaire-store";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField } from "@/lib/i18n/localize";
import type { Locale } from "@/lib/i18n/config";
import type { FunnelEvent } from "@/lib/analytics/funnel";
import { DDVQ21_VALUE_MAP } from "@/lib/questionnaire";

// ============================================================
// Schwartz / Big Five color + i18n key mappings
// ============================================================

const SCHWARTZ_COLORS: Record<SchwartzValue, string> = {
  "self-direction": "#C4A0E8",
  stimulation: "#E88B8B",
  hedonism: "#F0B87E",
  achievement: "#E8C84A",
  power: "#D4646A",
  security: "#8BC7C7",
  conformity: "#7ECFB0",
  tradition: "#A0B8D0",
  benevolence: "#F0B87E",
  universalism: "#7EB8E0",
};

const SCHWARTZ_I18N_KEYS: Record<SchwartzValue, string> = {
  "self-direction": "schwartzSelfDirection",
  stimulation: "schwartzStimulation",
  hedonism: "schwartzHedonism",
  achievement: "schwartzAchievement",
  power: "schwartzPower",
  security: "schwartzSecurity",
  conformity: "schwartzConformity",
  tradition: "schwartzTradition",
  benevolence: "schwartzBenevolence",
  universalism: "schwartzUniversalism",
};

// ============================================================
// MicroFeedback v2.0 Props
// ============================================================

interface MicroFeedbackProps {
  triggerType: string; // 'afterSJT' | 'afterPVQ' | 'afterIPIP_ch1' | 'afterIPIP_ch3' | 'bonusStrongSignal' | 'bonusInterestingContrast' | 'bonusSpeedCheck' | 'bonusHalfway'
  answers: Array<{
    questionIndex: number;
    moduleCode: string;
    itemId: number;
    value: AnswerValue;
    responseTimeMs: number;
    timestamp: number;
  }>;
  language: string;
  onContinue: () => void;
  /** Optional secondary action: return to the last answered question to revise it. */
  onReconsider?: () => void;
  /** Localized label for the reconsider link. */
  reconsiderLabel?: string;
}

/**
 * MicroFeedback — Brief personalized insight shown at key points.
 * Trigger points:
 *   - afterSJT: After all 6 SJT scenarios → tension count preview
 *   - afterPVQ: After DDVQ item 12 → top 2 value drivers preview
 *   - afterIPIP_ch1: After IPIP chapter 1 → personality hint
 *   - afterIPIP_ch3: After IPIP chapter 3 → personality emerging
 */
export function MicroFeedback({
  triggerType,
  answers,
  language,
  onContinue,
  onReconsider,
  reconsiderLabel,
}: MicroFeedbackProps) {
  const t = getDictionaryClient(language as "en" | "zh").microFeedback;
  const sessionId = useQuestionnaireStore((s) => s.session?.id);

  useEffect(() => {
    // NOTE: /api/analytics/event is CSRF exempt (ANALYTICS_CSRF_EXEMPT in middleware.ts).
    // Using bare fetch instead of csrfFetch is intentional for this tracking endpoint.
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "micro_feedback_shown" satisfies FunnelEvent,
        metadata: { triggerType, sessionId },
      }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  const feedback = useMemo(
    () => generateFeedback(triggerType, answers, t),
    [triggerType, answers, t],
  );

  // Determine module from trigger type for depth display
  const moduleKey =
    triggerType === "afterSJT" ? "A" : triggerType === "afterPVQ" ? "B" : "C";
  const depth =
    MODULE_DEPTH_COLORS[moduleKey as keyof typeof MODULE_DEPTH_COLORS];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: -30 }}
        transition={{ type: "spring", damping: 22, stiffness: 200 }}
        className="max-w-md mx-4 p-6 rounded-2xl backdrop-blur-lg relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.10) 0%, rgba(255,255,255,0.05) 100%)",
          border: "1px solid rgba(14, 165, 233, 0.18)",
          boxShadow:
            "0 8px 40px rgba(0,0,0,0.38), inset 0 1px 0 rgba(14,165,233,0.10)",
        }}
      >
        {/* Pulse glow */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 72,
            height: 72,
            background:
              "radial-gradient(ellipse, rgba(14,165,233,0.14), transparent 70%)",
          }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Header */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-4"
        >
          <span className="text-xs text-sky-300/80 tracking-wide uppercase">
            {depth?.depth} ·{" "}
            {getLocalizedField(depth, "label", language as Locale)}
          </span>
          <h3 className="text-lg font-medium text-white mt-1">
            {feedback.title}
          </h3>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent mb-4"
        />

        {/* Insight text */}
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-white/70 leading-relaxed mb-2"
        >
          {feedback.insight}
        </motion.p>

        {/* Highlighted trait */}
        {feedback.trait && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-3 mb-4 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]"
            style={{
              borderLeftWidth: "2px",
              borderLeftColor: feedback.traitColor,
            }}
          >
            <span
              className="text-sm font-medium tracking-wide"
              style={{ color: feedback.traitColor }}
            >
              {feedback.trait}
            </span>
          </motion.div>
        )}

        {/* Continue button */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onContinue}
          className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium bg-sky-500/20 text-sky-200 hover:bg-sky-500/30 border border-sky-400/20 transition-colors"
        >
          {t.continueDiving}
        </motion.button>
        {onReconsider && reconsiderLabel && (
          <motion.button
            type="button"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={onReconsider}
            className="block mx-auto mt-3 min-h-[36px] px-3 py-1 text-xs text-white/55 hover:text-white/85 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/40 rounded transition-colors"
          >
            {reconsiderLabel}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Feedback Generation Logic v2.0
// ============================================================

type T = Record<string, string>;

interface FeedbackContent {
  title: string;
  insight: string;
  trait: string | null;
  traitColor: string;
}

const BIG_FIVE_COLORS: Record<string, string> = {
  N: "#E88B8B",
  E: "#F0B87E",
  O: "#C4A0E8",
  A: "#7ECFB0",
  C: "#8BC7C7",
};

const BIG_FIVE_I18N_KEYS: Record<string, string> = {
  N: "bigFiveN",
  E: "bigFiveE",
  O: "bigFiveO",
  A: "bigFiveA",
  C: "bigFiveC",
};

const DOMAIN_ORDER = ["N", "E", "O", "A", "C"] as const;

function generateFeedback(
  triggerType: string,
  answers: Array<{ moduleCode: string; itemId: number; value: AnswerValue }>,
  t: T,
): FeedbackContent {
  switch (triggerType) {
    case "afterSJT":
      return generateAfterSJTFeedback(answers, t);
    case "afterPVQ":
      return generateAfterDDVQFeedback(answers, t);
    case "afterIPIP_ch1":
      return generateAfterIPIPCh1Feedback(answers, t);
    case "afterIPIP_ch2":
      return generateAfterIPIPCh2Feedback(answers, t);
    case "afterIPIP_ch3":
      return generateAfterIPIPCh3Feedback(answers, t);
    case "bonusStrongSignal":
      return {
        title: t.bonusSignalTitle,
        insight: t.bonusSignalInsight,
        trait: t.bonusSignalTrait,
        traitColor: "#7EB8E0",
      };
    case "bonusInterestingContrast":
      return {
        title: t.bonusContrastTitle,
        insight: t.bonusContrastInsight,
        trait: t.bonusContrastTrait,
        traitColor: "#E88B8B",
      };
    case "bonusSpeedCheck":
      return {
        title: t.bonusSpeedTitle,
        insight: t.bonusSpeedInsight,
        trait: null,
        traitColor: "",
      };
    case "bonusHalfway":
      return {
        title: t.bonusHalfwayTitle,
        insight: t.bonusHalfwayInsight,
        trait: t.bonusHalfwayTrait,
        traitColor: "#C4A0E8",
      };
    default:
      return {
        title: t.defaultFeedbackTitle,
        insight: t.defaultFeedbackInsight,
        trait: null,
        traitColor: "",
      };
  }
}

// After SJT: Count tensions across 6 scenarios — Zeigarnik suspense style
function generateAfterSJTFeedback(
  answers: Array<{ moduleCode: string; value: AnswerValue }>,
  t: T,
): FeedbackContent {
  const sjtAnswers = answers.filter(
    (a) => a.moduleCode === "A" && a.value.type === "sjt",
  );
  let tensionCount = 0;

  for (const a of sjtAnswers) {
    if (
      a.value.type === "sjt" &&
      a.value.wouldChoice !== a.value.shouldChoice
    ) {
      tensionCount++;
    }
  }

  if (tensionCount > 0) {
    return {
      title: t.sjtTensionTitle,
      insight: interpolate(t.sjtTensionInsight, { count: tensionCount }),
      trait: interpolate(t.sjtTensionTrait, { count: tensionCount }),
      traitColor: "#F0B87E",
    };
  }

  return {
    title: t.sjtConsistentTitle,
    insight: t.sjtConsistentInsight,
    trait: t.sjtConsistentTrait,
    traitColor: "#7ECFB0",
  };
}

// After DDVQ item 12: Preview top 2 value drivers — Zeigarnik suspense style
function generateAfterDDVQFeedback(
  answers: Array<{ moduleCode: string; itemId: number; value: AnswerValue }>,
  t: T,
): FeedbackContent {
  const pvqAnswers = answers.filter(
    (a) => a.moduleCode === "B" && a.value.type === "ddvq",
  );

  // Compute provisional value scores from answered items so far
  const valueScores: Partial<
    Record<SchwartzValue, { sum: number; count: number }>
  > = {};

  for (const a of pvqAnswers) {
    if (a.value.type !== "ddvq") continue;
    for (const [valueType, items] of Object.entries(DDVQ21_VALUE_MAP)) {
      if (items.includes(a.itemId)) {
        if (!valueScores[valueType as SchwartzValue]) {
          valueScores[valueType as SchwartzValue] = { sum: 0, count: 0 };
        }
        valueScores[valueType as SchwartzValue]!.sum += a.value.rating;
        valueScores[valueType as SchwartzValue]!.count += 1;
        break;
      }
    }
  }

  // Sort by mean score
  const sorted = Object.entries(valueScores)
    .filter(([, v]) => v && v.count > 0)
    .map(([key, v]) => ({
      value: key as SchwartzValue,
      mean: v!.sum / v!.count,
    }))
    .sort((a, b) => b.mean - a.mean);

  const top1 = sorted[0];
  const top2 = sorted[1];

  if (!top1) {
    return {
      title: t.pvqProgressTitle,
      insight: t.pvqProgressInsight,
      trait: null,
      traitColor: "",
    };
  }

  const label1Text = t[SCHWARTZ_I18N_KEYS[top1.value]];
  const color1 = SCHWARTZ_COLORS[top1.value];

  // Zeigarnik branching: close competition vs clear leader
  if (top2 && Math.abs(top1.mean - top2.mean) <= 0.5) {
    const label2Text = t[SCHWARTZ_I18N_KEYS[top2.value]];
    return {
      title: t.pvqCompetingTitle,
      insight: interpolate(t.pvqCompetingInsight, {
        label1: label1Text,
        label2: label2Text,
      }),
      trait: t.pvqCompetingTrait,
      traitColor: color1,
    };
  }

  return {
    title: t.pvqEmergingTitle,
    insight: interpolate(
      top2 ? t.pvqEmergingInsightFull : t.pvqEmergingInsightPartial,
      { label: label1Text },
    ),
    trait: label1Text,
    traitColor: color1,
  };
}

// Helper: compute provisional Big Five domain means from IPIP answers
function computeProvisionalDomainScores(
  answers: Array<{ moduleCode: string; itemId: number; value: AnswerValue }>,
): Array<{ domain: string; mean: number; count: number }> {
  const domainScores: Record<string, { sum: number; count: number }> = {
    N: { sum: 0, count: 0 },
    E: { sum: 0, count: 0 },
    O: { sum: 0, count: 0 },
    A: { sum: 0, count: 0 },
    C: { sum: 0, count: 0 },
  };

  const ipipAnswers = answers.filter(
    (a) => a.moduleCode === "C" && a.value.type === "ipip",
  );

  for (const a of ipipAnswers) {
    if (a.value.type !== "ipip") continue;
    const domainIndex = (a.itemId - 1) % 5;
    const domain = DOMAIN_ORDER[domainIndex];
    domainScores[domain].sum += a.value.rating;
    domainScores[domain].count += 1;
  }

  return Object.entries(domainScores)
    .filter(([, v]) => v.count >= 2)
    .map(([k, v]) => ({ domain: k, mean: v.sum / v.count, count: v.count }))
    .sort((a, b) => b.mean - a.mean);
}

// After IPIP Chapter 1: Data-driven personality hint — Zeigarnik suspense style
function generateAfterIPIPCh1Feedback(
  answers: Array<{ moduleCode: string; itemId: number; value: AnswerValue }>,
  t: T,
): FeedbackContent {
  const scored = computeProvisionalDomainScores(answers);

  if (scored.length < 2) {
    return {
      title: t.ipipFirstStrokesTitle,
      insight: t.ipipFirstStrokesInsight,
      trait: null,
      traitColor: "",
    };
  }

  const highest = scored[0];
  const lowest = scored[scored.length - 1];
  const highText = t[BIG_FIVE_I18N_KEYS[highest.domain]];
  const lowText = t[BIG_FIVE_I18N_KEYS[lowest.domain]];

  return {
    title: t.ipipEmergingTitle,
    insight: interpolate(t.ipipEmergingInsight, {
      high: highText,
      low: lowText,
    }),
    trait: highText,
    traitColor: BIG_FIVE_COLORS[highest.domain],
  };
}

// After IPIP Chapter 2: Data-driven halfway pattern — psychological reward at midpoint of Module C
function generateAfterIPIPCh2Feedback(
  answers: Array<{ moduleCode: string; itemId: number; value: AnswerValue }>,
  t: T,
): FeedbackContent {
  const scored = computeProvisionalDomainScores(answers);

  if (scored.length < 2) {
    return {
      title: t.ipipPatternTitle,
      insight: t.ipipPatternDefaultInsight,
      trait: null,
      traitColor: "",
    };
  }

  const highest = scored[0];
  const lowest = scored[scored.length - 1];
  const highText = t[BIG_FIVE_I18N_KEYS[highest.domain]];
  const lowText = t[BIG_FIVE_I18N_KEYS[lowest.domain]];
  const hasStrongContrast = highest.mean - lowest.mean >= 1.5;

  return {
    title: t.ipipPatternTitle,
    insight: interpolate(
      hasStrongContrast
        ? t.ipipPatternContrastStrongInsight
        : t.ipipPatternContrastNormalInsight,
      { high: highText, low: lowText },
    ),
    trait: highText,
    traitColor: BIG_FIVE_COLORS[highest.domain],
  };
}

// After IPIP Chapter 3: Data-driven personality emerging — Zeigarnik suspense style
function generateAfterIPIPCh3Feedback(
  answers: Array<{ moduleCode: string; itemId: number; value: AnswerValue }>,
  t: T,
): FeedbackContent {
  const scored = computeProvisionalDomainScores(answers);

  if (scored.length < 2) {
    return {
      title: t.ipipOutlineTitle,
      insight: t.ipipOutlineDefaultInsight,
      trait: t.ipipOutlineDefaultTrait,
      traitColor: "#C4A0E8",
    };
  }

  // Check for interesting N-E contrast
  const nScore = scored.find((s) => s.domain === "N");
  const eScore = scored.find((s) => s.domain === "E");
  const hasNEContrast =
    nScore && eScore && Math.abs(nScore.mean - eScore.mean) >= 1.5;

  if (hasNEContrast) {
    const eLow = eScore!.mean < nScore!.mean;
    return {
      title: t.ipipOutlineTitle,
      insight: interpolate(t.ipipOutlineNEContrastInsight, {
        level: eLow ? t.socialEnergyLow : t.socialEnergyHigh,
      }),
      trait: t.ipipOutlineDefaultTrait,
      traitColor: "#C4A0E8",
    };
  }

  return {
    title: t.ipipOutlineTitle,
    insight: t.ipipOutlineLockedInsight,
    trait: t.ipipOutlineDefaultTrait,
    traitColor: "#C4A0E8",
  };
}
