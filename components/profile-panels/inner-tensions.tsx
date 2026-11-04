// InnerTensions — "Your Inner Pulls": synthesizes all tension data into one cohesive view
// Each section has a 3-layer annotation: What → So What → Data
// Data sources: SJT behavioral consistency, Big Five facet tensions,
// value conflicts, and shadow cross-framework tensions.
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import type { PersonalProfileData } from "@/lib/types";
import type { IntraDomainTension } from "@/lib/profile-generation/detect-facet-tensions";
import { detectIntraDomainTensions } from "@/lib/profile-generation/detect-facet-tensions";
import {
  BIG_FIVE_LABELS,
  SCHWARTZ_VALUE_LABELS,
} from "@/lib/scoring/constants";
import { DOMAIN_LABELS } from "@/lib/content/shadow-content";
import { getSchwartzConflictValues } from "@/lib/profile-generation/schwartz-conflicts";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText, getLocalizedField } from "@/lib/i18n/localize";
import { analytics } from "@/lib/analytics/client";

interface InnerTensionsProps {
  profile: PersonalProfileData;
  locale: string;
  /** Link to coaching page (optional) */
  coachingHref?: string;
}

// Facet display labels (reuse from big-five-chart — import would create circular dep, so inline the lookup)
const FACET_LABELS: Record<string, { en: string; zh: string }> = {
  N1_Anxiety: { en: "Worry Sensitivity", zh: "焦虑敏感" },
  N2_Anger: { en: "Frustration Response", zh: "挫折反应" },
  N3_Depression: { en: "Emotional Resilience", zh: "情绪恢复力" },
  "N4_Self-Consciousness": { en: "Social Awareness", zh: "社交自意识" },
  N5_Immoderation: { en: "Impulse Control", zh: "冲动控制" },
  N6_Vulnerability: { en: "Stress Tolerance", zh: "压力耐受" },
  E1_Friendliness: { en: "Warmth", zh: "热情友善" },
  E2_Gregariousness: { en: "Social Preference", zh: "社交偏好" },
  E3_Assertiveness: { en: "Assertiveness", zh: "果断主张" },
  E4_Activity_Level: { en: "Energy Level", zh: "活力水平" },
  "E5_Excitement-Seeking": { en: "Thrill Seeking", zh: "寻求刺激" },
  E6_Cheerfulness: { en: "Positive Outlook", zh: "积极乐观" },
  O1_Imagination: { en: "Imagination", zh: "想象力" },
  O2_Artistic_Interests: { en: "Aesthetic Sense", zh: "审美兴趣" },
  O3_Emotionality: { en: "Emotional Depth", zh: "情感丰富" },
  O4_Adventurousness: { en: "Adventurousness", zh: "冒险精神" },
  O5_Intellect: { en: "Intellectual Curiosity", zh: "智识好奇" },
  O6_Liberalism: { en: "Open-mindedness", zh: "开放思维" },
  A1_Trust: { en: "Trust", zh: "信任倾向" },
  A2_Morality: { en: "Moral Compass", zh: "道德直觉" },
  A3_Altruism: { en: "Altruism", zh: "利他精神" },
  A4_Cooperation: { en: "Cooperation", zh: "合作精神" },
  A5_Modesty: { en: "Humility", zh: "谦逊内敛" },
  A6_Sympathy: { en: "Compassion", zh: "同理关怀" },
  "C1_Self-Efficacy": { en: "Self-Confidence", zh: "自信心" },
  C2_Orderliness: { en: "Organization", zh: "条理秩序" },
  C3_Dutifulness: { en: "Sense of Duty", zh: "责任感" },
  "C4_Achievement-Striving": { en: "Drive", zh: "成就驱动" },
  "C5_Self-Discipline": { en: "Self-Discipline", zh: "自律力" },
  C6_Cautiousness: { en: "Caution", zh: "谨慎度" },
};

function getFacetLabel(key: string, loc: "en" | "zh"): string {
  const label = FACET_LABELS[key];
  return label ? pickLocaleText(label, loc) : key.split("_").slice(1).join(" ");
}

// Plain-language descriptions: what each facet looks like when notably high or low
const FACET_INTERPRETATIONS: Record<
  string,
  { high: { en: string; zh: string }; low: { en: string; zh: string } }
> = {
  N1_Anxiety: {
    high: {
      en: "you tend to worry about what might go wrong",
      zh: "你容易担心事情可能出错",
    },
    low: {
      en: "you stay calm even in uncertain situations",
      zh: "即使面对不确定性你也很淡定",
    },
  },
  N2_Anger: {
    high: {
      en: "frustrations hit you quickly and intensely",
      zh: "挫折感来得又快又强烈",
    },
    low: {
      en: "you rarely get thrown off by setbacks",
      zh: "挫折很少能动摇你",
    },
  },
  N3_Depression: {
    high: {
      en: "low moods can linger longer than you'd like",
      zh: "低落情绪容易持续较久",
    },
    low: {
      en: "you bounce back quickly from difficult moments",
      zh: "你从低谷中恢复得很快",
    },
  },
  "N4_Self-Consciousness": {
    high: {
      en: "you're highly aware of how others perceive you",
      zh: "你很在意别人怎么看你",
    },
    low: { en: "others' opinions rarely faze you", zh: "别人的看法很少影响你" },
  },
  N5_Immoderation: {
    high: {
      en: "you sometimes act on impulse before thinking it through",
      zh: "你有时会冲动行事",
    },
    low: {
      en: "you resist temptation and stay disciplined easily",
      zh: "你能轻松抵制诱惑、保持自律",
    },
  },
  N6_Vulnerability: {
    high: {
      en: "high-pressure situations can overwhelm you",
      zh: "高压情境容易让你感到吃不消",
    },
    low: { en: "you handle pressure with composure", zh: "你在压力下依然从容" },
  },
  E1_Friendliness: {
    high: {
      en: "you're warm and approachable with people",
      zh: "你对人热情友善",
    },
    low: {
      en: "you keep emotional distance from others",
      zh: "你倾向于和人保持情感距离",
    },
  },
  E2_Gregariousness: {
    high: {
      en: "you're energized by social gatherings",
      zh: "社交聚会让你充满能量",
    },
    low: {
      en: "you prefer small groups or solo time",
      zh: "你更喜欢小圈子或独处",
    },
  },
  E3_Assertiveness: {
    high: {
      en: "you speak up and take charge naturally",
      zh: "你自然而然地发言和主导局面",
    },
    low: {
      en: "you prefer to observe and listen first",
      zh: "你更倾向于先观察和倾听",
    },
  },
  E4_Activity_Level: {
    high: {
      en: "you're always on the move with high energy",
      zh: "你总是精力充沛、闲不下来",
    },
    low: {
      en: "you prefer a steady, measured pace",
      zh: "你偏好稳定从容的节奏",
    },
  },
  "E5_Excitement-Seeking": {
    high: {
      en: "you crave new experiences and excitement",
      zh: "你渴望新鲜体验和刺激",
    },
    low: {
      en: "you prefer familiar and predictable situations",
      zh: "你更喜欢熟悉且可预期的情境",
    },
  },
  E6_Cheerfulness: {
    high: {
      en: "you're naturally optimistic and upbeat",
      zh: "你天生乐观开朗",
    },
    low: {
      en: "you express positive emotions more quietly",
      zh: "你表达积极情绪的方式比较内敛",
    },
  },
  O1_Imagination: {
    high: {
      en: "you have a rich inner world of ideas",
      zh: "你有丰富的内心想象世界",
    },
    low: {
      en: "you prefer concrete, practical thinking",
      zh: "你更偏好具体务实的思考",
    },
  },
  O2_Artistic_Interests: {
    high: {
      en: "you're deeply moved by art and aesthetics",
      zh: "你容易被艺术和美深深打动",
    },
    low: {
      en: "you focus more on function than form",
      zh: "比起形式你更关注功能",
    },
  },
  O3_Emotionality: {
    high: {
      en: "you feel emotions intensely and openly",
      zh: "你的情感体验强烈而外露",
    },
    low: {
      en: "you process emotions more internally",
      zh: "你更倾向于在内心消化情绪",
    },
  },
  O4_Adventurousness: {
    high: {
      en: "you're drawn to the unfamiliar and novel",
      zh: "你被未知和新奇的事物吸引",
    },
    low: {
      en: "you prefer tried-and-true approaches",
      zh: "你更信赖经过验证的方法",
    },
  },
  O5_Intellect: {
    high: {
      en: "you love exploring abstract ideas and theories",
      zh: "你热爱探索抽象概念和理论",
    },
    low: {
      en: "you prefer actionable, hands-on knowledge",
      zh: "你更喜欢可以直接用的实操知识",
    },
  },
  O6_Liberalism: {
    high: {
      en: "you question traditions and conventional rules",
      zh: "你会质疑传统和常规",
    },
    low: {
      en: "you value established norms and structure",
      zh: "你重视既有规范和秩序",
    },
  },
  A1_Trust: {
    high: {
      en: "you tend to see the best in people",
      zh: "你倾向于看到人好的一面",
    },
    low: {
      en: "you verify before extending trust",
      zh: "你会先验证再决定是否信任",
    },
  },
  A2_Morality: {
    high: {
      en: "you have a strong moral compass and prefer directness",
      zh: "你有很强的道德准则，偏好直来直去",
    },
    low: {
      en: "you're pragmatic and flexible about rules",
      zh: "你对规则比较务实灵活",
    },
  },
  A3_Altruism: {
    high: {
      en: "you naturally put others' needs before your own",
      zh: "你会自然地把别人的需求放在前面",
    },
    low: {
      en: "you prioritize your own goals and needs",
      zh: "你会优先考虑自己的目标和需要",
    },
  },
  A4_Cooperation: {
    high: {
      en: "you avoid conflict and seek harmony",
      zh: "你回避冲突、追求和谐",
    },
    low: {
      en: "you're comfortable pushing back and debating",
      zh: "你不介意反驳和辩论",
    },
  },
  A5_Modesty: {
    high: {
      en: "you tend to downplay your accomplishments",
      zh: "你倾向于低调处理自己的成就",
    },
    low: {
      en: "you're comfortable owning and sharing your successes",
      zh: "你能自如地展现和分享自己的成就",
    },
  },
  A6_Sympathy: {
    high: {
      en: "you feel deep empathy for others' struggles",
      zh: "你对别人的困难有很深的共情",
    },
    low: {
      en: "you prefer practical solutions over emotional support",
      zh: "比起情感支持你更倾向给出实际方案",
    },
  },
  "C1_Self-Efficacy": {
    high: {
      en: "you're confident in your ability to handle challenges",
      zh: "你对自己应对挑战的能力很有信心",
    },
    low: {
      en: "you tend to doubt yourself more than necessary",
      zh: "你容易过度质疑自己",
    },
  },
  C2_Orderliness: {
    high: {
      en: "you like things organized and systematic",
      zh: "你喜欢事物井井有条",
    },
    low: {
      en: "you're comfortable with a bit of chaos",
      zh: "你能接受一定程度的混乱",
    },
  },
  C3_Dutifulness: {
    high: {
      en: "you take commitments and obligations very seriously",
      zh: "你非常认真地对待承诺和义务",
    },
    low: {
      en: "you're flexible about adjusting commitments",
      zh: "你对调整承诺比较灵活",
    },
  },
  "C4_Achievement-Striving": {
    high: {
      en: "you're driven to achieve and continuously improve",
      zh: "你有很强的成就驱动力",
    },
    low: {
      en: "you're content when things are good enough",
      zh: "你觉得差不多就行",
    },
  },
  "C5_Self-Discipline": {
    high: {
      en: "you stay focused and follow through until done",
      zh: "你专注且能坚持到底",
    },
    low: {
      en: "you get easily pulled off task by distractions",
      zh: "你容易被其他事情分心",
    },
  },
  C6_Cautiousness: {
    high: {
      en: "you think carefully before making decisions",
      zh: "你在做决定前会仔细思考",
    },
    low: {
      en: "you act first and figure things out along the way",
      zh: "你倾向于先行动、边走边看",
    },
  },
};

// Narrative explanations for the 4 Schwartz value conflict axes
const VALUE_CONFLICT_NARRATIVES: Record<string, { en: string; zh: string }> = {
  achievement_benevolence: {
    en: "You want to excel and stand out, but you also deeply care about others' well-being. When advancing means making unpopular decisions, this tension surfaces.",
    zh: "你既想出人头地，又很在乎别人的感受。当前进意味着做出不讨喜的决定时，这个拉扯会特别明显。",
  },
  power_universalism: {
    en: "You value influence and authority, but also believe in fairness and equality. Leading others while staying true to your egalitarian ideals is a constant balancing act.",
    zh: "你看重影响力和权威，但也相信公平和平等。在领导他人的同时坚守平等理想，需要不断找平衡。",
  },
  autonomy_conformity: {
    en: "You crave independence and doing things your way, but also value social expectations and fitting in. Freedom vs. belonging — this pull shapes many of your decisions.",
    zh: "你渴望独立和按自己的方式做事，但也重视社会期待和归属感。自由与归属之间的拉扯影响着你的很多选择。",
  },
  stimulation_security: {
    en: "You're drawn to excitement and new challenges, but also want stability and safety. The classic adventure vs. comfort zone tension.",
    zh: "你被刺激和新挑战吸引，但也想要稳定和安全感。这是经典的「冒险 vs. 舒适区」拉扯。",
  },
};

// ── Section wrapper with annotation layer ───────────────────
function TensionSection({
  title,
  subtitle,
  accentColor,
  whatLabel,
  whatDesc,
  children,
}: {
  title: string;
  subtitle?: string;
  accentColor: string;
  /** "What this shows" label */
  whatLabel?: string;
  /** "What this shows" description */
  whatDesc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[4px] border border-rev-rule overflow-hidden">
      <div
        className="px-4 py-3 border-b border-rev-rule/50"
        style={{ backgroundColor: `${accentColor}08` }}
      >
        <p className="text-sm font-semibold text-rev-ink">{title}</p>
        {subtitle && (
          <p className="text-xs text-rev-ink-soft mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Annotation layer: What this shows */}
      {whatLabel && whatDesc && (
        <div className="px-4 py-2.5 border-b border-rev-rule/40 bg-rev-paper-warm/70">
          <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-rev-ink-soft mb-1">
            {whatLabel}
          </p>
          <p className="text-xs text-rev-ink-soft leading-relaxed">
            {whatDesc}
          </p>
        </div>
      )}

      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Consistency ring ────────────────────────────────────────
function ConsistencyRing({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - value * circumference;
  const color =
    pct >= 75
      ? "var(--rev-signal-positive)"
      : pct >= 50
        ? "var(--rev-signal-attention)"
        : "var(--rev-signal-risk)";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        width="68"
        height="68"
        viewBox="0 0 68 68"
        className="transform -rotate-90"
      >
        <circle
          cx="34"
          cy="34"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-rev-rule"
        />
        <circle
          cx="34"
          cy="34"
          r="28"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: 68, height: 68 }}
      >
        <span className="text-lg font-bold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>
      <span className="text-xs text-rev-ink-soft font-medium">{label}</span>
    </div>
  );
}

// ── SJT per-scenario breakdown ("Behavioral Mirror") ────────

/** Scenario context labels for display */
const SCENARIO_CONTEXTS: Record<number, { en: string; zh: string }> = {
  1: { en: "Team Introduction", zh: "团队自我介绍" },
  2: { en: "Giving Critical Feedback", zh: "提出批评反馈" },
  3: { en: "Deadline vs Quality", zh: "截止日期 vs 质量" },
  4: { en: "Handling Harsh Feedback", zh: "面对尖锐反馈" },
  5: { en: "Unconventional Ideas", zh: "非常规想法" },
  6: { en: "Team Deadlock", zh: "团队僵局" },
};

/** Per-scenario gap interpretation: what the gap means in plain language */
const SCENARIO_GAP_NARRATIVES: Record<
  number,
  {
    positive: { en: string; zh: string }; // gap > 0: ideal > instinct
    negative: { en: string; zh: string }; // gap < 0: instinct > ideal
  }
> = {
  1: {
    positive: {
      en: "You'd like to be more outgoing when meeting new people, but your instinct holds back",
      zh: "你希望在认识新人时更外向，但本能让你有所保留",
    },
    negative: {
      en: "You're actually more sociable than you give yourself credit for",
      zh: "你实际上比自己以为的更善于社交",
    },
  },
  2: {
    positive: {
      en: "You think you should be more direct with feedback, but you soften it in the moment",
      zh: "你觉得应该更直接地给反馈，但到了那一刻你会不自觉地委婉",
    },
    negative: {
      en: "You're actually blunter than you think you should be — your honesty runs ahead of your diplomacy",
      zh: "你实际上比自己觉得应该的更直接——你的诚实跑在外交手腕前面",
    },
  },
  3: {
    positive: {
      en: "You believe in doing things thoroughly, but under pressure you cut corners",
      zh: "你信奉把事情做透，但压力之下你会走捷径",
    },
    negative: {
      en: 'You\'re more meticulous in practice than your "good enough" philosophy suggests',
      zh: '你实际做事比你嘴上说的"差不多就行"要细致得多',
    },
  },
  4: {
    positive: {
      en: "You'd like to stay composed under criticism, but it stings more than you let on",
      zh: "你希望面对批评时保持冷静，但它比你表现出来的更刺痛你",
    },
    negative: {
      en: "You handle harsh words better than you expect — your resilience surprises you",
      zh: "你应对尖锐批评的能力比自己预期的更强——你比想象中坚韧",
    },
  },
  5: {
    positive: {
      en: "You value innovation in theory, but when a truly wild idea appears, you hesitate",
      zh: "你在理念上拥抱创新，但当真正激进的想法出现时，你会犹豫",
    },
    negative: {
      en: "You're more open to unconventional ideas than your cautious self-image suggests",
      zh: "你对非常规想法的接受度比你谨慎的自我认知要高",
    },
  },
  6: {
    positive: {
      en: "You believe someone should step up in deadlocks, but you tend to wait for others",
      zh: "你觉得僵局中应该有人站出来，但你倾向于等别人先行动",
    },
    negative: {
      en: "You jump in to resolve conflicts faster than you think you should — your action instinct is strong",
      zh: "你比自己认为的更快跳进去解决冲突——你的行动本能很强",
    },
  },
};

function ScenarioBreakdown({
  profile,
  locale: loc,
  t,
}: {
  profile: PersonalProfileData;
  locale: "en" | "zh";
  t: Record<string, string>;
}) {
  const scenarios = profile.algoSnapshot?.sjtTensions?.scenarios;
  if (!scenarios || scenarios.length === 0) return null;

  return (
    <div className="pt-3 border-t border-rev-rule/50 space-y-2.5">
      <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-rev-ink-soft">
        {t.sjtScenarioBreakdown}
      </p>
      <div className="space-y-1.5">
        {scenarios.map((s) => {
          const context = SCENARIO_CONTEXTS[s.scenarioId];
          const gapNarrative = SCENARIO_GAP_NARRATIVES[s.scenarioId];
          const absGap = Math.abs(s.gap);

          return (
            <div key={s.scenarioId} className="py-2 space-y-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Scenario context + domain tag */}
                  <span className="text-xs text-rev-ink-soft w-28 sm:w-32 shrink-0 flex items-center gap-1.5">
                    <span className="truncate">
                      {context
                        ? pickLocaleText(context, loc)
                        : `#${s.scenarioId}`}
                    </span>
                    {s.domain &&
                      BIG_FIVE_LABELS[
                        s.domain as keyof typeof BIG_FIVE_LABELS
                      ] && (
                        <span className="text-[9px] px-1 py-px rounded bg-rev-paper-warm text-rev-ink-soft/70 shrink-0 hidden sm:inline-block">
                          {pickLocaleText(
                            BIG_FIVE_LABELS[
                              s.domain as keyof typeof BIG_FIVE_LABELS
                            ],
                            loc,
                          )}
                        </span>
                      )}
                  </span>

                  {/* Gap bar visualization */}
                  <div className="flex-1 flex items-center gap-1 min-w-0">
                    <div className="flex-1 h-2 rounded-full bg-rev-paper-warm/70 overflow-hidden relative">
                      {/* Center line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/60" />
                      {/* Gap indicator */}
                      {s.gap !== 0 && (
                        <div
                          className={`absolute top-0 bottom-0 rounded-full ${
                            s.gap > 0
                              ? "bg-rev-signal-attention"
                              : "bg-rev-signal-info"
                          }`}
                          style={{
                            left:
                              s.gap > 0 ? "50%" : `${50 - (absGap / 4) * 50}%`,
                            width: `${(absGap / 4) * 50}%`,
                          }}
                        />
                      )}
                      {/* Consistent checkmark */}
                      {s.isConsistent && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-rev-signal-positive" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status label — stacks below bar on mobile, fixed right column on desktop */}
                <span className="text-[11px] font-medium leading-tight text-right shrink-0 sm:w-32 md:w-40 pl-[calc(7rem+0.5rem)] sm:pl-0">
                  {s.isConsistent ? (
                    <span className="text-rev-signal-positive">
                      {t.sjtConsistent}
                    </span>
                  ) : (
                    <span
                      className={
                        s.gap > 0
                          ? "text-rev-signal-attention"
                          : "text-rev-signal-info"
                      }
                    >
                      {s.gap > 0 ? t.sjtLegendAspiration : t.sjtLegendBetter}
                    </span>
                  )}
                </span>
              </div>

              {/* Per-scenario narrative — only show for gaps */}
              {!s.isConsistent && gapNarrative && (
                <p className="text-xs text-rev-ink-soft leading-relaxed pl-[calc(7rem+0.5rem)] sm:pl-[calc(8rem+0.5rem)]">
                  {pickLocaleText(
                    s.gap > 0 ? gapNarrative.positive : gapNarrative.negative,
                    loc,
                  )}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-[11px] text-rev-ink-soft/80">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rev-signal-positive" />{" "}
          {t.sjtLegendConsistent}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rev-signal-attention" />{" "}
          {t.sjtLegendAspiration}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rev-signal-info" />{" "}
          {t.sjtLegendBetter}
        </span>
      </div>
    </div>
  );
}

// ── Facet tension row ───────────────────────────────────────
function FacetTensionRow({
  tension,
  locale,
}: {
  tension: IntraDomainTension;
  locale: "en" | "zh";
}) {
  const domainLabel =
    DOMAIN_LABELS[tension.domain as keyof typeof DOMAIN_LABELS];
  const highInterp = FACET_INTERPRETATIONS[tension.high.facet];
  const lowInterp = FACET_INTERPRETATIONS[tension.low.facet];
  const profileDict = getDictionaryClient(locale).profile;

  return (
    <div className="py-3 space-y-1.5">
      {/* Facet pair header */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-rev-ink-soft uppercase tracking-wider w-32 shrink-0 truncate">
          {domainLabel ? pickLocaleText(domainLabel, locale) : tension.domain}
        </span>
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium text-rev-signal-positive truncate">
            {getFacetLabel(tension.high.facet, locale)} ↑
          </span>
          <span className="text-rev-ink-soft/70 text-sm">vs</span>
          <span className="text-sm font-medium text-rev-signal-info truncate">
            {getFacetLabel(tension.low.facet, locale)} ↓
          </span>
        </div>
      </div>

      {/* Plain-language interpretation */}
      {highInterp &&
        lowInterp &&
        (() => {
          const high = pickLocaleText(highInterp.high, locale);
          const low = pickLocaleText(lowInterp.low, locale);
          const capitalizedHigh = high.charAt(0).toUpperCase() + high.slice(1);
          return (
            <p className="text-xs text-rev-ink-soft leading-relaxed pl-[calc(8rem+0.75rem)]">
              {(profileDict.tensionInterpretation ?? "{high}, yet {low}.")
                .replace("{high}", capitalizedHigh)
                .replace("{low}", low)}
            </p>
          );
        })()}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────
export function InnerTensions({
  profile,
  locale,
  coachingHref,
}: InnerTensionsProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const loc = locale as "en" | "zh";

  // 1. SJT behavioral consistency
  const sjt = profile.sjtBehavioralConsistency;

  // 2. Facet tensions from Big Five
  const facetPairs = profile.algoSnapshot?.bigFiveFacetPairs;
  const facetTensions =
    facetPairs && facetPairs.length > 0
      ? detectIntraDomainTensions(facetPairs, 5)
      : [];

  // 3. Value conflicts
  const conflictPair = profile.schwartzAnchors?.conflictPair;
  let conflictLabels: { v1: string; v2: string } | null = null;
  const conflictValues = getSchwartzConflictValues(conflictPair);
  if (conflictValues) {
    const [firstValue, secondValue] = conflictValues;
    const l1 = SCHWARTZ_VALUE_LABELS[firstValue];
    const l2 = SCHWARTZ_VALUE_LABELS[secondValue];
    if (l1 && l2) {
      conflictLabels = {
        v1: pickLocaleText(l1, loc),
        v2: pickLocaleText(l2, loc),
      };
    }
  }

  // 4. Cross-framework tensions (from shadow insights)
  const crossTensions = (profile.shadowInsights?.shadows ?? [])
    .filter((s) => s.tensionWith)
    .map((s) => ({
      shadowDomain: DOMAIN_LABELS[s.domain as keyof typeof DOMAIN_LABELS]
        ? pickLocaleText(
            DOMAIN_LABELS[s.domain as keyof typeof DOMAIN_LABELS],
            loc,
          )
        : s.domain,
      framework: s.tensionWith!.framework,
      dimension: s.tensionWith!.dimension,
      description: getLocalizedField(s.tensionWith!, "description", loc),
    }));

  const hasTensions =
    sjt ||
    facetTensions.length > 0 ||
    conflictLabels ||
    crossTensions.length > 0;

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  // Top 2 facet tensions shown by default, rest behind expand
  const [showAllFacets, setShowAllFacets] = useState(false);
  const topFacetTensions = facetTensions.slice(0, 2);
  const restFacetTensions = facetTensions.slice(2);

  return (
    <div className="space-y-6">
      {/* Page introduction — what this tab answers */}
      <div className="p-4 rounded-[4px] bg-rev-paper-warm/70 border border-rev-rule/60">
        <p className="text-sm text-rev-ink leading-relaxed">
          {t.tensionPageIntro}
        </p>
      </div>

      {/* Growth Map Narrative Insight — LLM interpretive layer */}
      {profile.narrativeSnapshots?.growthMapInsight && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className="relative p-6 rounded-[4px] border border-rev-rule overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.03), transparent)",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-[2px] shrink-0 self-stretch rounded-full bg-rev-signal-attention/60" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-rev-signal-attention mb-3">
                  {t.growthMapNarrativeLabel}
                </p>
                <p className="text-sm text-rev-ink leading-relaxed">
                  {profile.narrativeSnapshots.growthMapInsight}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!hasTensions ? (
        <div className="space-y-5">
          {/* Positive headline */}
          <div className="flex items-start gap-3 p-4 rounded-[4px] bg-rev-paper-warm border border-rev-rule border-l-2 border-l-rev-signal-positive">
            <CheckCircle2 className="w-5 h-5 text-rev-signal-positive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rev-ink">
                {t.tensionEmptyTitle}
              </p>
              <p className="text-sm text-rev-ink-soft mt-1.5 leading-relaxed">
                {t.tensionEmptyDesc}
              </p>
            </div>
          </div>

          {/* Educational: what would show here */}
          <div className="rounded-[4px] border border-rev-rule overflow-hidden">
            <div className="px-4 py-3 border-b border-rev-rule/50 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-rev-ink-soft" />
              <p className="text-sm font-medium text-rev-ink-soft">
                {t.tensionEmptyWhatIsThis}
              </p>
            </div>
            <div className="p-4 space-y-3">
              {[
                {
                  color: "bg-rev-signal-attention",
                  text: t.tensionEmptyExplainSjt,
                },
                { color: "bg-rev-glow-warm", text: t.tensionEmptyExplainFacet },
                {
                  color: "bg-rev-signal-info",
                  text: t.tensionEmptyExplainValues,
                },
                {
                  color: "bg-rev-signal-risk",
                  text: t.tensionEmptyExplainCross,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${item.color}/70 shrink-0 mt-0.5`}
                  />
                  <p className="text-sm text-rev-ink-soft leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Reassurance + soft CTA */}
          <p className="text-sm text-rev-ink-soft leading-relaxed px-1">
            {t.tensionEmptyWhyGood}
          </p>

          {coachingHref && (
            <a
              href={coachingHref}
              onClick={() => {
                analytics
                  .track("profile_cta_clicked", {
                    dimension: "tensions_empty",
                    destination: coachingHref!,
                  })
                  .catch(() => {});
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-[4px] bg-rev-paper-warm hover:bg-rev-paper border border-rev-rule border-l-2 border-l-rev-glow-cold transition-colors group"
            >
              <MessageCircle className="w-4 h-4 text-rev-signal-info/85 group-hover:text-rev-signal-info transition-colors" />
              <span className="text-sm font-medium text-rev-signal-info group-hover:text-rev-signal-info transition-colors">
                {t.tensionCoachCta}
              </span>
            </a>
          )}
        </div>
      ) : (
        <motion.div
          className="space-y-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-20px" }}
          variants={stagger}
        >
          {/* SJT: Your Ideal vs. Your Instinct */}
          {sjt && (
            <motion.div variants={fadeIn}>
              <TensionSection
                title={t.tensionSjtTitle}
                accentColor="var(--rev-signal-attention)"
                whatLabel={t.tensionSjtWhat}
                whatDesc={t.tensionSjtWhatDesc}
              >
                <div className="space-y-4">
                  {/* "So What" — interpretation of the result */}
                  <div className="p-3 rounded-lg bg-rev-paper-warm border border-rev-rule border-l-2 border-l-rev-signal-attention">
                    <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-rev-signal-attention mb-1">
                      {t.tensionSjtSoWhat}
                    </p>
                    <p className="text-sm text-rev-ink leading-relaxed">
                      {sjt.overallConsistency >= 0.75
                        ? t.tensionSjtHigh
                        : sjt.overallConsistency >= 0.5
                          ? t.tensionSjtMedium
                          : t.tensionSjtLow}
                    </p>
                  </div>

                  {/* Summary: ring + notable domains */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <ConsistencyRing
                        value={sjt.overallConsistency}
                        label={t.tensionConsistency}
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      {sjt.notableTensions.length > 0 && (
                        <div>
                          <p className="text-xs text-rev-ink-soft uppercase tracking-wider mb-1.5">
                            {t.tensionSjtNoteworthy}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sjt.notableTensions.map((domain) => {
                              const label =
                                BIG_FIVE_LABELS[
                                  domain as keyof typeof BIG_FIVE_LABELS
                                ];
                              return (
                                <span
                                  key={domain}
                                  className="text-[11px] px-2.5 py-1 rounded-[2px] bg-rev-paper border border-rev-signal-attention/35 text-rev-signal-attention font-medium"
                                >
                                  {label ? pickLocaleText(label, loc) : domain}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Per-scenario breakdown — the "Behavioral Mirror" */}
                  <ScenarioBreakdown profile={profile} locale={loc} t={t} />
                </div>
              </TensionSection>
            </motion.div>
          )}

          {/* Facet Tensions: Creative tensions within Big Five — top 2, rest expandable */}
          {topFacetTensions.length > 0 && (
            <motion.div variants={fadeIn}>
              <TensionSection
                title={t.tensionFacetTitle}
                subtitle={t.tensionFacetSubtitle}
                accentColor="var(--archetype-a-rev)"
                whatLabel={t.tensionFacetWhat}
                whatDesc={t.tensionFacetWhatDesc}
              >
                <div className="divide-y divide-border/30">
                  {topFacetTensions.map((tension) => (
                    <FacetTensionRow
                      key={tension.domain}
                      tension={tension}
                      locale={loc}
                    />
                  ))}
                  {/* Expandable additional tensions */}
                  {showAllFacets &&
                    restFacetTensions.map((tension) => (
                      <FacetTensionRow
                        key={tension.domain}
                        tension={tension}
                        locale={loc}
                      />
                    ))}
                </div>
                {restFacetTensions.length > 0 && (
                  <button
                    onClick={() => setShowAllFacets(!showAllFacets)}
                    className="mt-2 flex items-center gap-1 text-xs text-rev-signal-info hover:text-rev-signal-info transition-colors"
                  >
                    <span>
                      {showAllFacets ? t.tensionShowLess : t.tensionShowMore}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${showAllFacets ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </TensionSection>
            </motion.div>
          )}

          {/* Value Conflicts */}
          {conflictLabels && (
            <motion.div variants={fadeIn}>
              <TensionSection
                title={t.tensionValueTitle}
                accentColor="var(--rev-signal-attention)"
                whatLabel={t.tensionValueWhat}
                whatDesc={t.tensionValueWhatDesc}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3 py-1">
                    <span className="text-sm font-medium text-rev-ink">
                      {conflictLabels.v1}
                    </span>
                    <span className="text-rev-ink-soft/60 text-sm">
                      {"\u27F7"}
                    </span>
                    <span className="text-sm font-medium text-rev-ink">
                      {conflictLabels.v2}
                    </span>
                    {profile.schwartzAnchors?.conflictStatus && (
                      <span
                        className={`ml-auto text-[11px] font-medium px-2.5 py-1 rounded-md border ${
                          profile.schwartzAnchors.conflictStatus === "confirmed"
                            ? "text-rev-signal-risk bg-rev-paper-warm border border-rev-signal-risk/30"
                            : "text-rev-signal-attention bg-rev-paper-warm border border-rev-signal-attention/30"
                        }`}
                      >
                        {profile.schwartzAnchors.conflictStatus === "confirmed"
                          ? t.confirmed
                          : profile.schwartzAnchors.conflictStatus ===
                              "resolved"
                            ? t.resolved
                            : t.mild}
                      </span>
                    )}
                  </div>

                  {/* Narrative explanation */}
                  {conflictPair && VALUE_CONFLICT_NARRATIVES[conflictPair] && (
                    <p className="text-sm text-rev-ink-soft leading-relaxed">
                      {pickLocaleText(
                        VALUE_CONFLICT_NARRATIVES[conflictPair],
                        loc,
                      )}
                    </p>
                  )}
                </div>
              </TensionSection>
            </motion.div>
          )}

          {/* Cross-framework conflicts */}
          {crossTensions.length > 0 && (
            <motion.div variants={fadeIn}>
              <TensionSection
                title={t.tensionCrossTitle}
                subtitle={t.tensionCrossSubtitle}
                accentColor="var(--rev-signal-risk)"
                whatLabel={t.tensionCrossWhat}
                whatDesc={t.tensionCrossWhatDesc}
              >
                <div className="space-y-4">
                  {crossTensions.map((ct, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-[2px] bg-rev-paper border border-rev-glow-warm/30 text-rev-glow-warm">
                          {ct.shadowDomain}
                        </span>
                        <span className="text-rev-ink-soft/70 text-sm">↔</span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-rev-paper border border-rev-signal-risk/30 text-rev-signal-risk">
                          {ct.framework === "riasec"
                            ? loc === "zh"
                              ? "兴趣特质"
                              : "Interest Profile"
                            : loc === "zh"
                              ? "价值取向"
                              : "Value Orientation"}
                          : {ct.dimension}
                        </span>
                      </div>
                      <p className="text-sm text-rev-ink-soft leading-relaxed pl-1">
                        {ct.description}
                      </p>
                    </div>
                  ))}
                </div>
              </TensionSection>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* CTA to coaching */}
      {hasTensions && coachingHref && (
        <div className="pt-2">
          <a
            href={coachingHref}
            onClick={() => {
              analytics
                .track("profile_cta_clicked", {
                  dimension: "tensions",
                  destination: coachingHref!,
                })
                .catch(() => {});
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-[4px] bg-rev-paper-warm hover:bg-rev-paper border border-rev-rule border-l-2 border-l-rev-glow-cold transition-colors group"
          >
            <MessageCircle className="w-4 h-4 text-rev-signal-info group-hover:text-rev-signal-info transition-colors" />
            <span className="text-sm font-medium text-rev-signal-info group-hover:text-rev-signal-info transition-colors">
              {t.tensionCoachCta}
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
