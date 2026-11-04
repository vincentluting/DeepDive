"use client";

import type { PersonalProfileData } from "@/lib/types";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";
interface InterpersonalInsightsProps {
  profile: PersonalProfileData;
  locale: string;
}

/**
 * Interpersonal insight definitions derived from Big Five facet combinations.
 * Each insight maps 2-3 facets to a relational pattern.
 */
interface InsightEntry {
  label: { en: string; zh: string };
  description: { en: string; zh: string };
  accentColor: string;
}

function deriveInsights(
  profile: PersonalProfileData,
  _loc: "en" | "zh",
): InsightEntry[] {
  const insights: InsightEntry[] = [];
  const algo = profile.algoSnapshot;
  if (!algo) return insights;

  const facetMap: Record<string, number> = {};
  for (const f of algo.bigFiveFacetPairs ?? []) {
    facetMap[f.facet] = f.score;
  }

  const domains = algo.bigFiveDomains;
  const e = domains?.extraversion ?? 50;
  const _a = domains?.agreeableness ?? 50;

  // Collaboration energy source
  const e2 = facetMap["E2_Gregariousness"] ?? 3;
  const e1 = facetMap["E1_Friendliness"] ?? 3;
  if (e2 < 2.5 && e1 > 3.5) {
    insights.push({
      label: { en: "Deep Connector", zh: "深度连接者" },
      description: {
        en: "You thrive in one-on-one conversations but find large social gatherings draining. Your warmth is real — it just runs deeper in smaller circles.",
        zh: "你在一对一对话中充满能量，但大型社交场合会消耗你。你的温暖是真实的——只是在小圈子里更深沉。",
      },
      accentColor: "var(--rev-signal-info)",
    });
  } else if (e2 > 3.5 && e1 > 3.5) {
    insights.push({
      label: { en: "Social Catalyst", zh: "社交催化剂" },
      description: {
        en: "You bring energy to groups and build rapport quickly. People feel comfortable around you, which makes you a natural connector.",
        zh: "你给群体带来能量，能快速建立关系。人们在你身边感到自在，这使你成为天然的连接者。",
      },
      accentColor: "var(--rev-signal-attention)",
    });
  }

  // Feedback style
  const a4 = facetMap["A4_Cooperation"] ?? 3;
  const e3 = facetMap["E3_Assertiveness"] ?? 3;
  if (e3 > 3.5 && a4 < 2.5) {
    insights.push({
      label: { en: "Direct Communicator", zh: "直接沟通者" },
      description: {
        en: "You say what you mean without softening. This is efficient, but some may perceive it as blunt. In high-context cultures, consider adding more relational framing.",
        zh: "你表达直接不绕弯。这很高效，但有人可能觉得尖锐。在高语境文化中，可以多加一些关系性的铺垫。",
      },
      accentColor: "var(--rev-signal-risk)",
    });
  } else if (e3 < 2.5 && a4 > 3.5) {
    insights.push({
      label: { en: "Harmony Keeper", zh: "和谐守护者" },
      description: {
        en: "You tend to accommodate and avoid direct confrontation. This creates safety, but important feedback may get diluted. Your growth edge: constructive directness.",
        zh: "你倾向于迁就和避免直接冲突。这创造了安全感，但重要反馈可能被稀释。你的成长方向：建设性的直接表达。",
      },
      accentColor: "var(--rev-signal-positive)",
    });
  }

  // Trust & influence pattern
  const a1 = facetMap["A1_Trust"] ?? 3;
  const a2 = facetMap["A2_Morality"] ?? 3;
  if (a1 > 3.5 && a2 > 3.5) {
    insights.push({
      label: { en: "Trust-First Collaborator", zh: "信任先行的合作者" },
      description: {
        en: "You default to trusting people and expect integrity. When someone breaks that trust, the impact hits harder because it violates your core operating assumption.",
        zh: "你默认信任他人并期待诚信。当信任被打破时，冲击更大——因为它违反了你最基本的运作假设。",
      },
      accentColor: "var(--archetype-a-rev)",
    });
  } else if (a1 < 2.5 && a2 > 3.5) {
    insights.push({
      label: { en: "Principled Skeptic", zh: "有原则的质疑者" },
      description: {
        en: "You hold high moral standards but don't easily trust others to meet them. You verify before you trust — this makes you a strong gatekeeper but can slow relationship building.",
        zh: "你有高道德标准但不轻易相信他人能达到。你先验证再信任——这让你成为优秀的把关者，但可能减慢关系建立。",
      },
      accentColor: "var(--archetype-i-rev)",
    });
  }

  // Emotional energy in teams
  const a6 = facetMap["A6_Sympathy"] ?? 3;
  if (a6 > 4.0 && e < 45) {
    insights.push({
      label: { en: "Silent Empath", zh: "沉默的共情者" },
      description: {
        en: "You absorb others' emotions deeply but don't always express your support verbally. People may not realize how much you care. Consider making your empathy more visible.",
        zh: "你深度吸收他人的情绪但不总是口头表达支持。人们可能不知道你有多在乎。考虑让你的共情更可见。",
      },
      accentColor: "var(--rev-glow-warm)",
    });
  }

  // SJT-based insight: feedback scenario gap
  const sjtScenarios = profile.algoSnapshot?.sjtTensions?.scenarios;
  if (sjtScenarios) {
    const scenario2 = sjtScenarios.find((s) => s.scenarioId === 2); // giving feedback
    const scenario6 = sjtScenarios.find((s) => s.scenarioId === 6); // team deadlock
    if (scenario2 && Math.abs(scenario2.gap) >= 2) {
      insights.push({
        label: { en: "Feedback Tension", zh: "反馈张力" },
        description:
          scenario2.gap > 0
            ? {
                en: "You know you should give direct feedback, but your instinct is to soften or avoid it. This gap is your biggest interpersonal growth opportunity.",
                zh: "你知道应该直接反馈，但本能倾向于软化或回避。这个差距是你最大的人际成长机会。",
              }
            : {
                en: "Interestingly, you naturally give more direct feedback than you think you should. Trust this instinct — it's often more helpful than holding back.",
                zh: '有趣的是，你实际给出的反馈比你认为"应该"的更直接。相信这个本能——它往往比保留更有帮助。',
              },
        accentColor: "var(--rev-signal-attention)",
      });
    }
    if (scenario6 && Math.abs(scenario6.gap) >= 2) {
      insights.push({
        label: { en: "Conflict Navigation", zh: "冲突应对" },
        description:
          scenario6.gap > 0
            ? {
                en: "In team deadlocks, you idealize active intervention but instinctively step back. Building your conflict navigation muscle starts with small moments.",
                zh: "在团队僵局中，你理想化主动介入但本能地退后。建立你的冲突应对肌肉，从小场景开始。",
              }
            : {
                en: "When teams get stuck, you naturally step in more than you think you should. This instinct for breaking deadlocks is a leadership asset.",
                zh: '当团队陷入僵局时，你本能地比你认为"应该"的更积极介入。这种打破僵局的本能是领导力资产。',
              },
        accentColor: "var(--rev-signal-attention)",
      });
    }
  }

  return insights;
}

export function InterpersonalInsightsContent({
  profile,
  locale,
}: InterpersonalInsightsProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const loc = locale as "en" | "zh";

  const insights = deriveInsights(profile, loc);

  if (insights.length === 0) {
    return (
      <p className="text-xs text-rev-ink-soft/80">
        {t.interpersonalInsufficientData}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div
          key={i}
          className="p-3 rounded-lg border border-rev-rule/60"
          style={{ backgroundColor: `${insight.accentColor}06` }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-1.5 h-4 rounded-full"
              style={{ backgroundColor: insight.accentColor }}
            />
            <p className="text-xs font-semibold text-rev-ink">
              {pickLocaleText(insight.label, loc)}
            </p>
          </div>
          <p className="text-[11px] text-rev-ink/75 leading-relaxed pl-3.5">
            {pickLocaleText(insight.description, loc)}
          </p>
        </div>
      ))}
      <p className="text-[11px] text-rev-ink-soft/70">{t.interpersonalNote}</p>
    </div>
  );
}
