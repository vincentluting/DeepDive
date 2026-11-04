// CollabStyleSection — Collaboration Style display panel (extracted from profile-dashboard.tsx)
"use client";

import type { PersonalProfileData, CollabStyle } from "@/lib/types";
import { COLLAB_STYLE_COLORS } from "@/lib/scoring/constants";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { getTermText } from "@/lib/content/term-glossary";
import { getLocalizedField, pickLocaleText } from "@/lib/i18n/localize";
import { LowConfidenceWarning } from "@/components/report/confidence-indicator";
import { EvidenceCollapsible } from "@/components/report/evidence-popover";

type ConfidenceBreakdownEntry = {
  dimension: string;
  confidence: number;
  reasons: { factor: string; impact: number; detail: string }[];
};

export const COLLAB_STYLE_NARRATIVES: Record<
  string,
  {
    tagline_zh: string;
    tagline_en: string;
    body_zh: string;
    body_en: string;
    strengths_zh: string[];
    strengths_en: string[];
    watchout_zh: string;
    watchout_en: string;
  }
> = {
  "D+I": {
    tagline_zh: "推动者",
    tagline_en: "The Driver",
    body_zh:
      "你在团队里是天然的发动机——果断、有感召力，既能做决定，也能让别人愿意跟着走。你不喜欢原地踏步，会主动推动项目向前。",
    body_en:
      "You're the natural engine of any team — decisive and inspiring. You make calls and get people moving. Stagnation frustrates you; you push things forward.",
    strengths_zh: ["快速决策", "激励团队", "敢于承担风险"],
    strengths_en: ["Fast decisions", "Inspiring action", "Taking bold risks"],
    watchout_zh: "节奏太快时，团队可能跟不上，注意留出对齐的空间。",
    watchout_en:
      "When you move fast, the team may fall behind. Build in alignment moments.",
  },
  "D+S": {
    tagline_zh: "稳健推进者",
    tagline_en: "The Steady Commander",
    body_zh:
      "你有目标感和执行力，同时更注重团队的稳定。你能带领大家向前，但不会忽视人的感受。",
    body_en:
      "You're goal-driven and execution-focused, but strongly team-aware. You move forward without leaving people behind.",
    strengths_zh: ["目标明确", "执行有力", "照顾团队节奏"],
    strengths_en: ["Clear goals", "Strong execution", "Pacing the team"],
    watchout_zh: "在高压时刻，控制欲可能上升，注意给他人保留自主空间。",
    watchout_en:
      "Under pressure, your control tendency may spike — leave room for others' autonomy.",
  },
  "D+C": {
    tagline_zh: "精准决策者",
    tagline_en: "The Precise Decider",
    body_zh:
      "你既有果断性，又有对质量的高要求。你会快速做决定，但不会轻易妥协标准。你的团队知道：你说能做到，就真的能做到。",
    body_en:
      "You combine decisiveness with high standards. You move fast but won't compromise on quality. Your team knows: when you say it'll get done, it gets done right.",
    strengths_zh: ["高标准执行", "决策果断", "可靠可信"],
    strengths_en: [
      "High-standard execution",
      "Decisive action",
      "Reliable follow-through",
    ],
    watchout_zh: "对他人的错误容忍度较低，容易给团队带来压力。",
    watchout_en:
      "Low tolerance for others' mistakes can create pressure on the team.",
  },
  "I+D": {
    tagline_zh: "激励领导者",
    tagline_en: "The Energizing Leader",
    body_zh:
      "你用热情感染团队，同时有足够的目标感来推动结果。会议结束后，大家都更有干劲——这是你独有的影响力。",
    body_en:
      "You energize the room and follow through. Meetings end with people fired up — that's your signature impact.",
    strengths_zh: ["感染力强", "推动力足", "快速建立信任"],
    strengths_en: ["High energy", "Results-driven", "Rapid trust-building"],
    watchout_zh: "热情有时会超过细节管理，需要有人帮你跟踪执行细节。",
    watchout_en:
      "Enthusiasm can outpace follow-through — you need someone tracking the details.",
  },
  "I+S": {
    tagline_zh: "关系编织者",
    tagline_en: "The People Weaver",
    body_zh:
      "你天生善于建立关系、创造温暖的团队氛围。你不只是受欢迎的人，你是让每个人感到被看见的人——这是真正的凝聚力。",
    body_en:
      "You build relationships and create warmth. You're not just the popular one — you're the person who makes everyone feel seen. That's real cohesion.",
    strengths_zh: ["团队凝聚力", "情感支持", "开放沟通"],
    strengths_en: ["Team cohesion", "Emotional support", "Open communication"],
    watchout_zh: "不喜欢冲突，有时会回避必要的困难对话。",
    watchout_en:
      "Conflict-averse — you may avoid necessary difficult conversations.",
  },
  "I+C": {
    tagline_zh: "有料的说服者",
    tagline_en: "The Credible Influencer",
    body_zh:
      "你能感染人，又有数据和逻辑做支撑。你不只靠魅力说服别人，你有真实的内容。这让你的影响力更持久。",
    body_en:
      "You can inspire people and back it up with data. Not just charm — real substance. That makes your influence last.",
    strengths_zh: ["有内容的说服力", "分析与表达兼具", "建立可信度"],
    strengths_en: [
      "Substantive persuasion",
      "Analysis meets communication",
      "Credibility-building",
    ],
    watchout_zh: "在需要快速行动时，可能花太多时间准备完美的论据。",
    watchout_en:
      "When speed matters, you may spend too long preparing the perfect case.",
  },
  "S+I": {
    tagline_zh: "温暖的连接者",
    tagline_en: "The Warm Connector",
    body_zh:
      "你是团队里让人感到安心的存在，同时有足够的活力参与和推动合作。你不会抢风头，但你离开之后，每个人都会感觉少了什么。",
    body_en:
      "You're the safe harbor of the team, with enough energy to drive collaboration. You're not the loudest voice — but when you're gone, everyone feels it.",
    strengths_zh: ["营造心理安全感", "推动协作", "照顾团队情绪"],
    strengths_en: [
      "Psychological safety",
      "Collaboration",
      "Emotional attunement",
    ],
    watchout_zh: "太照顾别人，有时忘记表达自己的需求和边界。",
    watchout_en:
      "You give so much that you sometimes forget to voice your own needs.",
  },
  "S+D": {
    tagline_zh: "可靠的执行者",
    tagline_en: "The Reliable Executor",
    body_zh:
      "你不是最高调的人，但你是最可以依赖的人。你做出承诺，然后兑现它——这种可靠性在团队里是稀缺资产。",
    body_en:
      "Not the loudest, but the most dependable. You make commitments and keep them. That reliability is a rare asset.",
    strengths_zh: ["高度可靠", "稳定输出", "压力下保持冷静"],
    strengths_en: [
      "High reliability",
      "Consistent output",
      "Calm under pressure",
    ],
    watchout_zh: "对突然的变化适应较慢，在快速迭代的环境中需要提前建立缓冲。",
    watchout_en:
      "Adapts slowly to sudden change — build buffers in fast-moving environments.",
  },
  "S+C": {
    tagline_zh: "细心的守护者",
    tagline_en: "The Careful Guardian",
    body_zh:
      "你在乎质量，也在乎人。你会确保事情做对，同时照顾到团队中每个人的感受。这种组合让你成为团队里稳定、可信赖的基石。",
    body_en:
      "You care about quality and people equally. You make sure things are done right while looking out for everyone. This makes you the team's quiet cornerstone.",
    strengths_zh: ["兼顾质量与关系", "值得信赖", "系统化照料"],
    strengths_en: [
      "Quality + people balance",
      "Trustworthy",
      "Systematic care",
    ],
    watchout_zh:
      "决策速度偏慢，在需要快速判断的场景中要主动给自己设定截止时间。",
    watchout_en:
      "Decision pace is slow — set your own deadlines when speed is needed.",
  },
  "C+I": {
    tagline_zh: "有温度的分析者",
    tagline_en: "The Human Analyst",
    body_zh:
      "你用数据和逻辑思考，同时有足够的人际敏感度让分析结果被接受。你不只是给出结论，你能解释它，并让人信服。",
    body_en:
      "You think in data and logic, but with enough interpersonal warmth to get your analysis accepted. You don't just deliver conclusions — you make them land.",
    strengths_zh: ["严谨的分析力", "有效的沟通", "让复杂变简单"],
    strengths_en: [
      "Rigorous analysis",
      "Effective communication",
      "Making complex simple",
    ],
    watchout_zh: '有时在准备阶段花费太多时间，需要练习"够好了就行动"的判断。',
    watchout_en:
      'Over-preparation is a risk — practice the "good enough to act" judgment.',
  },
  "C+D": {
    tagline_zh: "高标准执行者",
    tagline_en: "The High-Standard Executor",
    body_zh:
      '你追求精准，也有足够的驱动力让事情真正完成。你是那种"做了就做对"的人——你的工作经得起审查。',
    body_en:
      "You pursue precision and have the drive to actually finish things. You're the \"if it's worth doing, it's worth doing right\" person — and your work shows it.",
    strengths_zh: ["精准高效", "高可靠性", "不妥协标准"],
    strengths_en: [
      "Precise execution",
      "High reliability",
      "Uncompromising standards",
    ],
    watchout_zh: '对"不够好"的结果容忍度低，可能给自己和团队带来压力。',
    watchout_en:
      'Low tolerance for "not good enough" can pressure yourself and your team.',
  },
  "C+S": {
    tagline_zh: "系统守护者",
    tagline_en: "The System Guardian",
    body_zh:
      "你建立可靠的系统，同时照顾使用这些系统的人。你不只是创建流程，你确保它们真正对人有用，并且持续运转。",
    body_en:
      "You build reliable systems and care about the people who use them. You don't just create processes — you make sure they actually work for people and keep working.",
    strengths_zh: ["系统化思维", "持续维护", "以人为本的流程设计"],
    strengths_en: [
      "Systems thinking",
      "Sustained maintenance",
      "Human-centered process design",
    ],
    watchout_zh: "改变对你来说成本较高，在组织变革期需要提前做好心理准备。",
    watchout_en:
      "Change is costly for you — prepare yourself early when organizational shifts are coming.",
  },
};

export const COLLAB_STYLE_ORDER: {
  key: CollabStyle;
  zh: string;
  en: string;
}[] = [
  { key: "D", zh: "引领", en: "Leading" },
  { key: "I", zh: "激发", en: "Inspiring" },
  { key: "S", zh: "稳健", en: "Anchoring" },
  { key: "C", zh: "精研", en: "Refining" },
];

interface CollabStyleSectionProps {
  profile: PersonalProfileData;
  locale: string;
  confidenceBreakdown?: ConfidenceBreakdownEntry[];
  /** When false, hides LowConfidenceWarning + EvidenceCollapsible (default: true) */
  showConfidenceUI?: boolean;
}

export function CollabStyleSection({
  profile,
  locale,
  confidenceBreakdown,
  showConfidenceUI = true,
}: CollabStyleSectionProps) {
  const t = getDictionaryClient(locale as "en" | "zh").profile;
  const { collabMapping } = profile;
  const confidence = profile.confidenceMap.collab ?? 0;
  const loc = locale as "en" | "zh";

  const primaryEntry = COLLAB_STYLE_COLORS[collabMapping.primary];
  const secondaryEntry = collabMapping.secondary
    ? COLLAB_STYLE_COLORS[collabMapping.secondary]
    : undefined;
  const colorLabel = t.collabColorLabelFormat
    .replace("{primary}", getLocalizedField(primaryEntry, "name", loc) ?? "")
    .replace(
      "{secondary}",
      getLocalizedField(secondaryEntry, "name", loc) ?? "",
    );

  const narrativeKey = `${collabMapping.primary}+${collabMapping.secondary}`;
  const narrative = COLLAB_STYLE_NARRATIVES[narrativeKey];

  // Compute ratio from scores: primary score / (primary + secondary)
  const primaryScore = collabMapping.scores[collabMapping.primary] ?? 0;
  const secondaryScore = collabMapping.secondary
    ? (collabMapping.scores[collabMapping.secondary] ?? 0)
    : 0;
  const ratio =
    primaryScore + secondaryScore > 0
      ? primaryScore / (primaryScore + secondaryScore)
      : 0.5;
  const ratioLabel =
    ratio >= 0.75
      ? t.discRatioStrong
      : ratio >= 0.55
        ? t.discRatioClear
        : t.discRatioBalanced;

  return (
    <div className="p-6 sm:p-7 rounded-[4px] border border-rev-rule bg-rev-paper-warm card-shadow relative overflow-hidden">
      {/* Gradient glow background */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ background: collabMapping.cssGradient }}
      />
      {/* Top color strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: collabMapping.cssGradient }}
      />
      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-rev-ink uppercase tracking-wider">
              {t.collaborationMode}
            </h3>
            <p className="text-xs text-rev-ink-soft mt-1 leading-relaxed max-w-lg">
              {getTermText("collaboration", loc)?.definition}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p
              className="text-sm font-bold px-2.5 py-1 rounded-lg inline-block"
              style={{
                background: collabMapping.cssGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {colorLabel}
            </p>
            {narrative && (
              <p className="text-xs text-rev-ink-soft mt-0.5">
                {getLocalizedField(narrative, "tagline", loc)}
                {" · "}
                {ratioLabel}
              </p>
            )}
          </div>
        </div>

        {/* Body narrative */}
        {narrative && (
          <p className="text-sm text-rev-ink leading-relaxed">
            {getLocalizedField(narrative, "body", loc)}
          </p>
        )}

        {/* Strength pills */}
        {narrative && (
          <div className="flex flex-wrap gap-2">
            {(loc === "zh"
              ? narrative.strengths_zh
              : narrative.strengths_en
            ).map((s, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-b from-secondary to-secondary/80 text-rev-ink border border-rev-rule shadow-sm"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Watch-out note */}
        {narrative && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-[4px] bg-rev-paper-warm border border-rev-signal-attention/12">
            <span className="text-rev-signal-attention/70 text-xs mt-0.5 shrink-0 font-mono">
              !
            </span>
            <p className="text-xs text-rev-ink-soft leading-relaxed">
              {getLocalizedField(narrative, "watchout", loc)}
            </p>
          </div>
        )}

        {/* 4-dimension score bars */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {COLLAB_STYLE_ORDER.map(({ key, zh, en }) => {
            const score = collabMapping.scores[key] ?? 0;
            const isPrimary = key === collabMapping.primary;
            const isSecondary = key === collabMapping.secondary;
            return (
              <div key={key} className="flex items-center gap-2">
                <span
                  className={`text-xs w-6 shrink-0 ${isPrimary ? "text-rev-ink font-semibold" : isSecondary ? "text-rev-ink" : "text-rev-ink-soft"}`}
                >
                  {pickLocaleText({ en, zh }, loc)}
                </span>
                <div className="flex-1 h-1.5 bg-rev-paper border border-rev-rule rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isPrimary ? "bg-rev-glow-cold" : isSecondary ? "bg-rev-glow-cold/60" : "bg-rev-ink-soft/35"}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-mono w-6 text-right shrink-0 ${isPrimary ? "text-rev-ink" : "text-rev-ink-soft"}`}
                >
                  {score}
                </span>
              </div>
            );
          })}
        </div>

        {/* Confidence + Evidence (conditionally rendered) */}
        {showConfidenceUI && (
          <>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-rev-ink-soft">
                {t.accuracy} {(confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Derivation source note */}
            {getLocalizedField(collabMapping, "approximationNote", loc) && (
              <p className="text-[10px] text-rev-ink-soft/80 leading-relaxed">
                {getLocalizedField(collabMapping, "approximationNote", loc)}
              </p>
            )}

            <LowConfidenceWarning
              confidence={confidence}
              locale={loc}
              dimensionLabel={t.collaborationMode}
            />
            <EvidenceCollapsible
              confidence={confidence}
              dimensionLabel="collab"
              confidenceEntries={confidenceBreakdown}
              locale={loc}
            />
          </>
        )}
      </div>
    </div>
  );
}
