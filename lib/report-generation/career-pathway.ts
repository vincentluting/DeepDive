// ============================================================
// Career Pathway Generator — LLM Call #3
// Generates job directions + strategy + 30-day action plan.
// Includes subscription bridge and follow-up triggers.
//
// v6.0: CAAS thrust system replaced by Schwartz-based
// action plan intensity (security vs stimulation).
// ============================================================

import type {
  AssessmentInput,
  Panel1CareerMatch,
  ProfileAlgorithmOutput,
  RealConditions,
  Panel3Pathway,
} from "../types";
import type { ResumeMatchResult } from "../resume/types";
import { callLLM } from "../ai/model-router";
import {
  buildUserProfileBlock,
  buildSystemMessage,
  extractJSON,
} from "./prompt-utils";
import { sanitizeRealConditions } from "../ai/prompt-sanitization";
import { buildRealConditionsContextBlock } from "./real-conditions-context";
import { buildResumeEvidenceBlock } from "./common-rules";
import { logLLMPromptMeta, logLLMQualityCheck } from "../db/llm-usage";
import { checkQuality } from "../ai/quality-gate";
import type { Panel3LLMOutput } from "./types";
import {
  enforceOutputLocale,
  buildRegeneratePrompt,
  extractProperNouns,
} from "./language-guard";
import { detectLanguageMismatch } from "../i18n/language-detect";
import { localeLanguageNames, type Locale } from "../i18n/config";

const __DEV__ = process.env.NODE_ENV === "development";

// ── Locale helper: pick text by locale with fallback to 'en' ──
type LocaleTexts = Record<string, string>;
function L(texts: LocaleTexts, locale: string): string {
  return texts[locale] ?? texts.en;
}

function LX<T>(texts: Record<string, T>, locale: string): T {
  return texts[locale] ?? texts.en;
}

// ============================================================
// Action Plan Intensity — replaces CAAS thrust templates
// ============================================================

type ActionPlanIntensity = "exploratory" | "structured" | "accelerated";

interface IntensityConfig {
  thrustNote: string;
  weekThemes: [string, string, string, string];
  taskDifficulty: { easy: number; medium: number; stretch: number };
  toneGuide: string;
}

const INTENSITY_CONFIGS_ZH: Record<ActionPlanIntensity, IntensityConfig> = {
  exploratory: {
    thrustNote: "你的行动计划以探索为核心，循序渐进地发现最值得深入的方向。",
    weekThemes: ["认识方向", "收集信息", "小步尝试", "形成习惯"],
    taskDifficulty: { easy: 4, medium: 3, stretch: 0 },
    toneGuide: '用"建议你…""下一步可以…"的语气',
  },
  structured: {
    thrustNote: "你倾向稳健扎实的风格，行动计划帮你一步步建立信心。",
    weekThemes: ["定位方向", "打好基础", "稳步推进", "巩固成果"],
    taskDifficulty: { easy: 4, medium: 2, stretch: 1 },
    toneGuide: '用"你可以试试…""准备好了就…"的语气',
  },
  accelerated: {
    thrustNote: "你追求新体验和刺激，行动计划帮你把想法快速变成现实。",
    weekThemes: ["锁定目标", "快速行动", "获取反馈", "调整冲刺"],
    taskDifficulty: { easy: 2, medium: 4, stretch: 1 },
    toneGuide: '用"直接…""马上…"的语气',
  },
};

const INTENSITY_CONFIGS_EN: Record<ActionPlanIntensity, IntensityConfig> = {
  exploratory: {
    thrustNote:
      "Your action plan focuses on exploration — discover the directions worth pursuing at your own pace.",
    weekThemes: [
      "Find Direction",
      "Gather Info",
      "Small Experiments",
      "Build Habits",
    ],
    taskDifficulty: { easy: 4, medium: 3, stretch: 0 },
    toneGuide:
      'Use phrases like "we suggest…" and "a good next step would be…"',
  },
  structured: {
    thrustNote:
      "You lean toward a steady approach. This plan helps you build confidence step by step.",
    weekThemes: [
      "Position Yourself",
      "Build Foundation",
      "Steady Progress",
      "Consolidate Results",
    ],
    taskDifficulty: { easy: 4, medium: 2, stretch: 1 },
    toneGuide: 'Use phrases like "you could try…" and "when ready…"',
  },
  accelerated: {
    thrustNote:
      "You thrive on new experiences. This plan helps you turn ideas into reality quickly.",
    weekThemes: [
      "Lock In Targets",
      "Take Action",
      "Get Feedback",
      "Adjust & Sprint",
    ],
    taskDifficulty: { easy: 2, medium: 4, stretch: 1 },
    toneGuide: 'Use phrases like "go ahead and…" and "right away…"',
  },
};

const INTENSITY_CONFIGS_NL: Record<ActionPlanIntensity, IntensityConfig> = {
  exploratory: {
    thrustNote:
      "Je actieplan draait om verkennen: ontdek in je eigen tempo welke richtingen de moeite waard zijn.",
    weekThemes: [
      "Richting vinden",
      "Informatie verzamelen",
      "Kleine experimenten",
      "Ritme opbouwen",
    ],
    taskDifficulty: { easy: 4, medium: 3, stretch: 0 },
    toneGuide:
      'Gebruik formuleringen als "een goede volgende stap is..." en "je kunt verkennen..."',
  },
  structured: {
    thrustNote:
      "Je neigt naar een rustige, stapsgewijze aanpak. Dit plan helpt je vertrouwen op te bouwen zonder te forceren.",
    weekThemes: [
      "Positionering scherpen",
      "Basis leggen",
      "Gestaag vooruit",
      "Resultaten verankeren",
    ],
    taskDifficulty: { easy: 4, medium: 2, stretch: 1 },
    toneGuide:
      'Gebruik formuleringen als "je kunt proberen..." en "wanneer je er klaar voor bent..."',
  },
  accelerated: {
    thrustNote:
      "Je krijgt energie van nieuwe ervaringen. Dit plan helpt je ideeën snel in concrete stappen om te zetten.",
    weekThemes: [
      "Doelen kiezen",
      "In actie komen",
      "Feedback ophalen",
      "Bijsturen en versnellen",
    ],
    taskDifficulty: { easy: 2, medium: 4, stretch: 1 },
    toneGuide:
      'Gebruik formuleringen als "pak dit direct op..." en "zet vandaag de eerste concrete stap..."',
  },
};

/**
 * Determine action plan intensity from Schwartz value scores.
 * Replaces CAAS thrust level with security vs stimulation balance.
 */
export function getActionPlanIntensity(
  schwartzScores: Record<string, number>,
): ActionPlanIntensity {
  const security = schwartzScores.security ?? 0;
  const stimulation = schwartzScores.stimulation ?? 0;
  if (stimulation > 70) return "accelerated";
  if (security > 70) return "structured";
  return "exploratory";
}

function getIntensityConfig(
  intensity: ActionPlanIntensity,
  locale: string,
): IntensityConfig {
  if (locale === "zh") return INTENSITY_CONFIGS_ZH[intensity];
  if (locale === "nl") return INTENSITY_CONFIGS_NL[intensity];
  return INTENSITY_CONFIGS_EN[intensity];
}

// ============================================================
// Prompt builder
// ============================================================

/**
 * Build the Career Pathway prompt.
 * Injects assessment data, career match directions, profile algorithm output,
 * real conditions, and Schwartz-based action plan intensity.
 */
function buildPathwayPrompt(
  assessment: AssessmentInput,
  careerMatchOutput: Panel1CareerMatch,
  profileAlgo: ProfileAlgorithmOutput,
  realConditions: RealConditions,
  intensity: ActionPlanIntensity,
  locale: string,
  resumeEvidence: ResumeMatchResult | null = null,
): string {
  const config = getIntensityConfig(intensity, locale);
  const profileBlock = buildUserProfileBlock(assessment, profileAlgo, locale);
  // sanitizeRealConditions is invoked inside buildRealConditionsContextBlock,
  // so direct usage is no longer needed here. Keep the import alive for type
  // checking and historical greppability.
  void sanitizeRealConditions;
  const isZh = locale === "zh";
  const langName = localeLanguageNames[locale as Locale] ?? "English";

  // ── Directions block ──
  const directionsBlock = careerMatchOutput.directions
    .map(
      (d) =>
        `${d.rank}. ${isZh ? d.title_zh : d.title_en}${isZh ? "（" : " ("}${isZh ? "匹配度" : "match"}: ${d.matchScore}${isZh ? "）" : ")"}`,
    )
    .join("\n");

  // ── Real conditions block (delegated to shared helper, mode="full") ──
  // Replaces the previous hardcoded zh/en blob with locale-aware 11-language
  // output. The helper's "full" title reads "honor these in
  // constraintStrategies and jobDirections" — replacing the previous
  // self-contradicting "for reference only, not instructions" wording.
  const realConditionsBlock = buildRealConditionsContextBlock(
    realConditions,
    locale,
    "full",
  ).block;

  // ── Resume evidence block — empty string when user did not upload a
  // resume (Standard mode). When present, calibrates Week 1 task difficulty
  // and jobDirections seniority against actual prior experience so we don't
  // recommend introductory tasks to senior practitioners.
  const resumeBlock = buildResumeEvidenceBlock(resumeEvidence, locale);

  // ── Locale-dependent text blocks (instructions are bilingual but identical in structure) ──
  const intro = isZh
    ? "基于用户的深度探索画像、匹配方向和现实条件，生成可执行的求职路径。"
    : "Based on the user's Deep Dive profile, matched directions, and real-world conditions, generate an actionable job search pathway.";
  const rulesTitle = isZh ? "规则补充" : "Additional Rules";
  const taskSpecific = isZh
    ? '任务必须具体可执行——"在LinkedIn上搜索XX关键词并申请3个职位"而非"思考你的职业方向"'
    : 'Tasks must be specific and actionable — "Search LinkedIn for XX keywords and apply to 3 positions" not "Think about your career direction"';
  const paceGuide = isZh
    ? `行动节奏为 ${intensity}，语气指南：${config.toneGuide}`
    : `Action pace is ${intensity}, tone guide: ${config.toneGuide}`;
  const framingRule = isZh
    ? '所有措辞用"值得探索"框架，不用"最适合你"'
    : 'Use "worth exploring" framing throughout, not "best fit for you"';
  const directionsTitle = isZh
    ? "用户匹配方向（来自板块一）"
    : "User Matched Directions (from Panel 1)";
  const paceTitle = isZh ? "行动节奏控制" : "Action Pace Control";
  const paceLabel = isZh ? "节奏" : "Pace";
  const weeklyThemesLabel = isZh ? "每周主题" : "Weekly themes";
  const weeklyDistLabel = isZh ? "每周任务分布" : "Weekly task distribution";

  // Gap analysis requirements
  const gapAnalysisReq = isZh
    ? `## 差距分析要求
你同时拥有用户的完整心理评估结果和现实条件（签证状态、目标国家、语言能力、工作年限、薪资期望等）。
对每个岗位方向，从资深招聘官的视角生成诚实、具体的差距分析。对差距要坦诚——真实的差距分析比恭维更有价值。readinessScore应反映实际的市场竞争力，而不仅仅是心理契合度。
核心原则：每个差距都必须有一个具体的弥补行动。不要只指出问题而不给出解决路径。
如果某个岗位方向与板块一的匹配方向高度重叠，设置 isIdealMatch 为 true。`
    : `## Gap Analysis Requirements
You have access to the user's complete psychological assessment results AND their real conditions (visa status, target country, language proficiency, years of experience, current salary expectations).
For each job direction, generate an honest, specific gap analysis from the perspective of a senior recruiter who genuinely wants to help this candidate. Be honest about gaps — a realistic gap analysis is more valuable than flattery. The readinessScore should reflect actual market competitiveness, not just psychological fit.
Key principle: every gap must have a concrete bridge action. Never identify a problem without a solution path.
If a job direction highly overlaps with a Panel 1 matched direction, set isIdealMatch to true.`;

  // Output format — JSON schema is bilingual (always contains _zh and _en fields), so we use a single shared block
  const outputFormatTitle = isZh ? "输出格式" : "Output Format";
  const jdTitleZhDesc = isZh
    ? "具体岗位方向（含行业/公司类型）"
    : "Chinese title";
  const jdTitleEnDesc = isZh
    ? "English title"
    : locale === "en"
      ? "Specific job direction (including industry/company type)"
      : `Specific job direction written in ${langName} (including industry/company type)`;
  const matchReasonDesc = isZh
    ? "1-2句话：为什么这个岗位值得你探索（结合画像+现实条件）"
    : "1-2 sentences: why this position is worth exploring (connecting profile + real conditions)";
  const taskDesc = isZh
    ? "具体可执行的任务描述"
    : "Specific actionable task description";
  const positioningDesc = isZh
    ? "2-3句：基于你的背景，值得思考的定位方向是"
    : "2-3 sentences: based on your background, directions worth considering for positioning";

  // Writing requirements
  const writingReqs = isZh
    ? `## 写作要求
- jobDirections 产出 3-5 个，必须结合现实条件（城市、签证、语言、经验）
- jobDirections 的 matchReason 用"值得探索"框架，不用"最适合你"
- constraintStrategies 只列出用户真正面临的约束，不要假设不存在的约束
- 只生成 Week 1 的完整任务（免费内容）。Week 2-4 只给主题和任务数量（付费解锁）
- Week 1 任务数量 = easy ${config.taskDifficulty.easy} + medium ${config.taskDifficulty.medium} + stretch ${config.taskDifficulty.stretch}
- 任务必须关联到板块一的具体方向（通过 relatedDirection 字段）
- 如果签证状态有约束，第一个 constraintStrategy 必须是签证策略
- 如果需要雇主担保签证（sponsorshipRequired=true），请只推荐在该国家对此类签证友好的行业和岗位类型
- 如果外部期望压力为"高"，在行动计划中增加一段"应对外部期望"的策略建议
- 如果用户不愿意接受转行培训（willingToRetrain=false），只推荐用户现有背景可以直接迁移的职业方向

## 简历经验校准（仅当上方"简历证据"存在时）
- jobDirections 的 seniority 字段必须与简历推断的经验等级一致——给资深从业者推 mid-level/senior，不要默认 junior
- matchReason 必须引用简历中的具体经验或行业作为锚点，让"为什么是你"立得住，不要泛泛地说"基于你的画像"
- Week 1 任务必须从用户已有经验的下一阶起步：不要给资深从业者推"了解什么是 X""学习 X 入门"这类已掌握的入门任务
- skillGaps 不要重复列出简历已经证明的能力——只列真正缺失的（例如简历有 PM 经验，不要再列"掌握需求分析"）
- 如果简历的张力点（conflictingDimensions）显示用户内心倾向与过往经历不符，在 constraintStrategies 加一条"在新方向中重新定位过往经验的叙事"策略

## AI 时代路线图规则
- Week 1 任务中必须包含至少 1 个"AI 工具实践"任务（difficulty: easy）。例如：用 ChatGPT/Claude 辅助优化简历、用 AI 工具模拟面试、用 AI 搜索行业趋势报告等。任务描述要具体到工具名和操作步骤。
- 每个 jobDirection 的 matchReason 中，如果该岗位涉及 AI 变革（大多数知识工作岗位都涉及），简要提及用户的人格优势如何在 AI 时代为这个方向加分。不要泛泛地说"AI时代需要你"，要结合用户画像具体说。
- gapAnalysis 的 skillGaps 中，如果该岗位的日常工作已经被 AI 工具渗透（如数据分析、内容创作、编程、研究等），应包含一个 AI 工具素养相关的 skill gap，并给出具体的学习资源。`
    : `## Writing Requirements
- Generate 3-5 jobDirections, must incorporate real conditions (city, visa, languages, experience)
- jobDirections matchReason uses "worth exploring" framing, not "best fit for you"
- constraintStrategies only list constraints the user actually faces, don't assume non-existent constraints
- Only generate Week 1 complete tasks (free content). Weeks 2-4 only provide theme and task count (paid unlock)
- Week 1 task count = easy ${config.taskDifficulty.easy} + medium ${config.taskDifficulty.medium} + stretch ${config.taskDifficulty.stretch}
- Tasks must link to Panel 1 directions (via relatedDirection field)
- If visa status is a constraint, the first constraintStrategy must be a visa strategy
- If sponsorshipRequired=true, only recommend industries and roles that are visa-sponsorship-friendly in the user's country
- If externalExpectationPressure is "high", include a "managing external expectations" strategy section in the action plan
- If willingToRetrain=false, only recommend career directions the user can transition to directly from their current background

## Resume Experience Calibration (only when "Resume Evidence" block above is present)
- jobDirections seniority MUST match the experience tier inferred from the resume — recommend mid-level/senior for experienced practitioners, never default to junior
- matchReason MUST anchor on a specific experience or industry from the resume so "why you specifically" lands — do not write generic "based on your profile" filler
- Week 1 tasks MUST start from the next step beyond the user's existing experience: never recommend introductory tasks like "learn what X is" or "intro to X" to someone whose resume already shows mastery
- skillGaps MUST NOT repeat capabilities the resume already evidences — list only what is genuinely missing (e.g., if resume shows 5 years PM, do not list "master requirements analysis")
- If the resume's tension points (conflictingDimensions) show the user's inner lean diverges from their past trajectory, add a constraintStrategy on "re-narrating past experience for the new direction"

## AI-Era Roadmap Rules
- Week 1 tasks MUST include at least 1 "AI tool practice" task (difficulty: easy). Examples: use ChatGPT/Claude to polish your resume, practice interview with AI mock tools, use AI to research industry trend reports. Task description must be specific with tool names and action steps.
- In each jobDirection matchReason, if the role involves AI transformation (most knowledge-work roles do), briefly mention how the user's personality strengths give them an edge in this direction in the AI era. Be specific to the user's profile, not generic "the AI era needs you."
- In gapAnalysis skillGaps, if the role's daily work is already being augmented by AI tools (data analysis, content creation, coding, research, etc.), include an AI tool literacy skill gap with specific learning resources.`;

  const gapReqs = isZh
    ? `## gapAnalysis 要求
- 每个 jobDirection 必须包含 gapAnalysis
- readinessScore 反映真实的市场竞争力（考虑经验年限、技能匹配、签证状态、语言等），不要简单给高分
- skillGaps: 2-4个具体的技能差距，按 difficulty 从低到高排列（先给用户快速胜利的信心）
- experienceGaps: 只列出真正缺失的经验，不要为凑数而列出不存在的差距
- conditionsAlignment: 基于用户的签证、城市、薪资期望诚实评估
- timelineToCompetitive: 给出诚实的时间估计，不要为安慰用户而缩短
- topPriorityAction: 必须是本周可以立刻执行的具体行动（不是"思考方向"这种模糊建议）
- 如果某个岗位方向与板块一匹配方向高度吻合（标题/领域重叠度高），设置 isIdealMatch=true`
    : `## gapAnalysis Requirements
- Every jobDirection MUST include gapAnalysis
- readinessScore reflects real market competitiveness (considering years of experience, skill match, visa status, languages, etc.) — don't just hand out high scores
- skillGaps: 2-4 specific skill gaps, sorted by difficulty ascending (quick wins first for motivation)
- experienceGaps: only list genuinely missing experience, don't pad with non-issues
- conditionsAlignment: honestly assess based on user's visa, location, salary expectations
- timelineToCompetitive: honest time estimate, don't shorten to comfort the user
- topPriorityAction: must be a concrete action executable this week (not vague "think about your direction")
- If a job direction highly overlaps with a Panel 1 matched direction (similar title/field), set isIdealMatch=true`;

  const prohibitions = isZh
    ? `## 额外禁忌
- 行动任务必须有具体对象（"在LinkedIn搜索XX关键词"而非"做一些调研"）
- 避免"take the first step"/"迈出第一步"等俗套表达`
    : `## Additional Prohibitions
- Action tasks must have concrete targets ("search 'XX keyword' on LinkedIn" not "do some research")
- Avoid clichés like "take the first step"`;

  const resourceReqs = isZh
    ? `## resourceGuide 要求
- atsKeywords: 每个岗位3-5个ATS关键词，必须是该岗位招聘JD中真正高频出现的技能/工具/资质词
- linkedinTip: 针对这个具体岗位的LinkedIn行动建议（不是泛泛的"优化profile"，而是"在标题中加入XX关键词，关注YY公司的招聘主管"）
- salaryContext: 基于用户目标城市/签证状态给出诚实的薪资范围参考。标注经验要求和币种。如果不确定，使用"参考范围"措辞`
    : `## resourceGuide Requirements
- atsKeywords: 3-5 ATS keywords per job that genuinely appear frequently in real job descriptions for this role
- linkedinTip: A specific LinkedIn action for this exact role (not generic "optimize your profile" but "add XX keywords to your headline, follow hiring managers at YY companies")
- salaryContext: Provide honest salary range estimates based on user's target cities/visa status. Include experience requirements and currency. If uncertain, use "estimated range" framing`;

  const finalLanguageCheck = isZh
    ? `## 最终语言检查（输出 JSON 前必做）
- 所有文本字段必须 100% 中文：constraintStrategies[].constraint、constraintStrategies[].strategy、resumeHighlights[]、networkingTips[]、positioning、week1.tasks[].description、matchReason、gapAnalysis 相关叙述。
- 上方"现实条件"中用户填写的值如果是英文（例如 "EdTech"、"Senior Product Manager"），必须翻译为中文后再引用。
- 专有名词如 LinkedIn、JD、ChatGPT、Claude 等英文品牌词允许保留。`
    : `## Final Language Check (perform before emitting JSON)
- Every user-visible text field MUST be 100% ${langName}: constraintStrategies[].constraint, constraintStrategies[].strategy, resumeHighlights[], networkingTips[], positioning, week1.tasks[].description, matchReason, gapAnalysis narratives, and visible *_en fallback fields.
- If the user's real-condition values above are in a non-${langName} language, translate them to ${langName} before quoting.
- For this report locale, fields ending in _en are visible fallback fields. When the locale is not English, write those _en field values in ${langName}, not English.
- Proper-noun brand names (LinkedIn, ChatGPT, Claude) may be retained as-is.`;

  return `${intro}

## ${rulesTitle}
- ${taskSpecific}
- ${paceGuide}
- ${framingRule}

## ${directionsTitle}
${directionsBlock}

${profileBlock}

${realConditionsBlock}
${resumeBlock}

## ${paceTitle}
- ${paceLabel}: ${intensity}
- ${weeklyThemesLabel}: ${config.weekThemes.join(" → ")}
- ${weeklyDistLabel}: easy ${config.taskDifficulty.easy} + medium ${config.taskDifficulty.medium} + stretch ${config.taskDifficulty.stretch}

${gapAnalysisReq}

## ${outputFormatTitle} (JSON)
{
  "jobDirections": [
    {
      "title_zh": "${jdTitleZhDesc}",
      "title_en": "${jdTitleEnDesc}",
      "industry": "Industry",
      "seniority": "junior/mid-level/senior",
      "matchScore": 85,
      "matchReason": "${matchReasonDesc}",
      "linkedinSearchQuery": "LinkedIn search keywords",
      "isIdealMatch": false,
      "resourceGuide": {
        "atsKeywords": ["keyword1", "keyword2", "keyword3"],
        "linkedinTip_zh": "LinkedIn行动建议",
        "linkedinTip_en": "One LinkedIn tip specific to this role",
        "salaryContext_zh": "薪资范围参考",
        "salaryContext_en": "Salary context"
      },
      "gapAnalysis": {
        "readinessScore": 65,
        "readinessLabel_zh": "...",
        "readinessLabel_en": "...",
        "skillGaps": [
          {
            "skill_zh": "...", "skill_en": "...",
            "currentLevel_zh": "...", "currentLevel_en": "...",
            "requiredLevel_zh": "...", "requiredLevel_en": "...",
            "bridgeAction_zh": "...", "bridgeAction_en": "...",
            "timeToClose": "1-2 months",
            "difficulty": "low"
          }
        ],
        "experienceGaps": [
          { "gap_zh": "...", "gap_en": "...", "workaround_zh": "...", "workaround_en": "..." }
        ],
        "conditionsAlignment": {
          "visaCompatibility": "favorable",
          "locationMatch": "strong",
          "salaryExpectationMatch": "within_range",
          "note_zh": "...", "note_en": "..."
        },
        "timelineToCompetitive_zh": "...",
        "timelineToCompetitive_en": "...",
        "topPriorityAction_zh": "...",
        "topPriorityAction_en": "..."
      }
    }
  ],
  "jobSearchStrategy": {
    "positioning": "${positioningDesc}",
    "resumeHighlights": ["..."],
    "networkingTips": ["..."],
    "constraintStrategies": [{ "constraint": "...", "strategy": "..." }]
  },
  "week1": {
    "theme": "${config.weekThemes[0]}",
    "tasks": [{ "description": "${taskDesc}", "relatedDirection": 1, "difficulty": "easy/medium/stretch" }]
  },
  "weeksPreview": [
    { "weekNumber": 2, "theme": "${config.weekThemes[1]}", "taskCount": 6 },
    { "weekNumber": 3, "theme": "${config.weekThemes[2]}", "taskCount": 7 },
    { "weekNumber": 4, "theme": "${config.weekThemes[3]}", "taskCount": 5 }
  ]
}

${writingReqs}

${gapReqs}

${prohibitions}

${resourceReqs}

${finalLanguageCheck}`;
}

// ============================================================
// JSON Recovery — handle token-limit truncation
// ============================================================

/**
 * Attempt to parse JSON, with a repair pass for truncated output.
 * When LLM output hits the maxTokens limit, the JSON may be cut
 * mid-object. This tries to close any open braces/brackets.
 */
function tryParseJSON(raw: string): Record<string, unknown> | null {
  // Strip markdown fences if present
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  // First attempt: parse as-is
  try {
    return extractJSON(text) as Record<string, unknown>;
  } catch {
    // Fall through to repair
  }

  // Repair: close unclosed brackets/braces from the end
  let repaired = text;
  const opens: string[] = [];
  let inString = false;
  let escape = false;
  for (const ch of repaired) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") opens.push("}");
    else if (ch === "[") opens.push("]");
    else if (ch === "}" || ch === "]") opens.pop();
  }

  // Remove any trailing partial value (after last comma or colon)
  repaired = repaired.replace(/,\s*$/, "");
  repaired = repaired.replace(/:\s*$/, ": null");
  // Remove trailing incomplete string value
  repaired = repaired.replace(/:\s*"[^"]*$/, ': ""');

  // Append missing closers
  while (opens.length > 0) {
    repaired += opens.pop();
  }

  try {
    const result = JSON.parse(repaired);
    if (__DEV__)
      console.warn("[career-pathway] Recovered truncated JSON via repair");
    return result;
  } catch {
    return null;
  }
}

// ============================================================
// Generation + Assembly
// ============================================================

/**
 * Generate Career Pathway via LLM.
 * Returns the complete Panel3Pathway structure.
 *
 * Uses Schwartz value-based action plan intensity (security vs stimulation).
 */
export async function generateCareerPathway(
  assessment: AssessmentInput,
  careerMatch: Panel1CareerMatch,
  profileAlgo: ProfileAlgorithmOutput,
  realConditions: RealConditions,
  locale: string = "en",
  userId?: string | null,
  resumeEvidence: ResumeMatchResult | null = null,
): Promise<Panel3Pathway> {
  const intensity = getActionPlanIntensity(assessment.schwartz.raw ?? {});
  const config = getIntensityConfig(intensity, locale);
  // Phase 2 quality gate observability — snapshot before the LLM call so
  // the post-call UPDATE targets only this generation's LLMUsageLog row.
  const qualityWindowStart = Date.now();

  try {
    const prompt = buildPathwayPrompt(
      assessment,
      careerMatch,
      profileAlgo,
      realConditions,
      intensity,
      locale,
      resumeEvidence,
    );

    // Phase F observability: record RC injection state for this LLM call so
    // production SQL can verify the audit-driven prompt fix is active.
    const rcMeta = buildRealConditionsContextBlock(
      realConditions,
      locale,
      "full",
    );
    logLLMPromptMeta({
      taskName: "career-pathway",
      userId,
      locale,
      realConditionsProvided: rcMeta.provided,
      realConditionsFieldCount: rcMeta.fieldCount,
    });

    const systemMessage = buildSystemMessage(locale);

    const content = await callLLM(
      "career-pathway",
      [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      {
        maxTokens: locale === "en" ? 5500 : 4500,
        responseFormat: "json",
        // System prompt is stable across users and shared with retry path;
        // caching it cuts input cost ~90% on second-and-later report calls
        // and on the retry inside this same call. See career-match-narrative
        // and integration for the same pattern.
        enableCache: true,
      },
    );

    if (!content) {
      throw new Error("Empty LLM response for Career Pathway");
    }

    const parsed = tryParseJSON(content);
    if (!parsed) {
      if (__DEV__)
        console.warn(
          "Career Pathway LLM returned unparseable JSON, using fallback",
        );
      return buildPathwayFallback(careerMatch, intensity, config, locale);
    }
    if (
      !Array.isArray(parsed.jobDirections) ||
      !parsed.jobSearchStrategy ||
      !parsed.week1
    ) {
      if (__DEV__)
        console.warn(
          "Career Pathway LLM returned incomplete JSON, using fallback",
        );
      logLLMQualityCheck({
        taskName: "career-pathway",
        userId,
        qualityCheckResult: "fail-field",
        createdAfter: qualityWindowStart,
      });
      return buildPathwayFallback(careerMatch, intensity, config, locale);
    }
    // Phase 2 quality gate (observability). Records pass/fail of structural
    // checks against LLMUsageLog. Does NOT alter control flow yet — caller
    // still gets the LLM output. Phase 3 will tighten to retry-then-throw.
    //
    // NOTE: We deliberately do NOT pass enforceLocale here. The LLM output
    // is a deeply nested object (jobDirections[].matchReason,
    // jobSearchStrategy.positioning, week1.tasks[].description, …) — there
    // is no single primaryField that checkQuality can sample for locale
    // detection, so any value other than a real path string makes
    // enforceLocale a no-op AND records a false "pass". The downstream
    // `enforceOutputLocale()` call (lines 627–) does proper per-field
    // mismatch detection on the assembled pathway. Keeping locale work
    // there avoids double-counting and prevents the new quality dashboard
    // from masking real language drift.
    // (Codex review P2 finding, 2026-05-21.)
    const qualityOutcome = checkQuality(parsed, {
      requiredFields: ["jobDirections", "jobSearchStrategy", "week1"],
    });
    logLLMQualityCheck({
      taskName: "career-pathway",
      userId,
      qualityCheckResult: qualityOutcome.result,
      createdAfter: qualityWindowStart,
    });
    const llmOutput = parsed as unknown as Panel3LLMOutput;
    const pathway = assemblePathway(llmOutput, intensity, config, locale);

    const langName = localeLanguageNames[locale as Locale] ?? "English";
    return enforceOutputLocale(pathway, locale, {
      taskId: "career-pathway",
      whitelistPhrases: extractProperNouns(realConditions),
      skipKeySuffixes:
        locale === "nl"
          ? [
              "_zh",
              "_nl",
              "_de",
              "_fr",
              "_es",
              "_pt",
              "_it",
              "_ru",
              "_ja",
              "_ko",
            ]
          : undefined,
      regenerate: async (foundMismatchFields) => {
        try {
          const retryPrompt = buildRegeneratePrompt({
            originalPrompt: prompt,
            langName,
            foundMismatchFields,
          });
          const retryContent = await callLLM(
            "career-pathway",
            [
              { role: "system", content: systemMessage },
              { role: "user", content: retryPrompt },
            ],
            {
              maxTokens: locale === "en" ? 5500 : 4500,
              responseFormat: "json",
            },
          );
          if (!retryContent) return null;
          const retryParsed = tryParseJSON(retryContent);
          if (!retryParsed) return null;
          if (
            !Array.isArray(retryParsed.jobDirections) ||
            !retryParsed.jobSearchStrategy ||
            !retryParsed.week1
          ) {
            return null;
          }
          return assemblePathway(
            retryParsed as unknown as Panel3LLMOutput,
            intensity,
            config,
            locale,
          );
        } catch (retryError) {
          if (__DEV__) {
            console.warn(
              "[career-pathway] regenerate attempt failed:",
              retryError,
            );
          }
          return null;
        }
      },
      sanitize: (output, paths) => applyPathwaySanitize(output, paths, locale),
    });
  } catch (error) {
    if (__DEV__) console.error("Career Pathway generation failed:", error);
    return buildPathwayFallback(careerMatch, intensity, config, locale);
  }
}

/**
 * Sanitize a Panel3Pathway by removing LLM-generated text fields that do not
 * match the target locale. Applied as the last-resort fallback when language
 * guard's regenerate attempt also fails.
 *
 * Strategy:
 * - Array fields (constraintStrategies, resumeHighlights, networkingTips, tasks):
 *   filter out mismatched items, keep valid ones.
 * - Scalar fields (positioning): clear to empty string (frontend hides empties).
 */
function applyPathwaySanitize(
  pathway: Panel3Pathway,
  _mismatchedPaths: string[],
  locale: string,
): Panel3Pathway {
  const cloned = structuredClone(pathway);
  const strategy = cloned.jobSearchStrategy;

  if (Array.isArray(strategy.constraintStrategies)) {
    strategy.constraintStrategies = strategy.constraintStrategies.filter(
      (cs) => {
        const combined = `${cs?.constraint ?? ""} ${cs?.strategy ?? ""}`.trim();
        if (!combined) return false;
        return !detectLanguageMismatch(combined, locale).isMismatch;
      },
    );
  }

  if (Array.isArray(strategy.resumeHighlights)) {
    strategy.resumeHighlights = strategy.resumeHighlights.filter(
      (t) =>
        typeof t === "string" && !detectLanguageMismatch(t, locale).isMismatch,
    );
  }

  if (Array.isArray(strategy.networkingTips)) {
    strategy.networkingTips = strategy.networkingTips.filter(
      (t) =>
        typeof t === "string" && !detectLanguageMismatch(t, locale).isMismatch,
    );
  }

  if (
    typeof strategy.positioning === "string" &&
    detectLanguageMismatch(strategy.positioning, locale).isMismatch
  ) {
    strategy.positioning = "";
  }

  if (Array.isArray(cloned.actionPlan?.week1?.tasks)) {
    cloned.actionPlan.week1.tasks = cloned.actionPlan.week1.tasks.filter(
      (t) =>
        t &&
        typeof t.description === "string" &&
        !detectLanguageMismatch(t.description, locale).isMismatch,
    );
  }

  return cloned;
}

/**
 * Assemble the full CareerPathway from LLM output.
 * Adds subscription bridge, follow-up schedule, and confidence notes.
 */
function assemblePathway(
  llmOutput: Panel3LLMOutput,
  intensity: ActionPlanIntensity,
  config: IntensityConfig,
  locale: string,
): Panel3Pathway {
  const confidenceNote = L(
    {
      en: "This plan is based on an exploratory assessment. We recommend completing the micro-assessment for a calibrated version.",
      zh: "此计划基于探索性评估。建议完成微测评后查看校准版本。",
      nl: "Dit plan is gebaseerd op een verkennende beoordeling. We raden aan de micro-beoordeling te voltooien voor een gekalibreerde versie.",
      de: "Dieser Plan basiert auf einer explorativen Bewertung. Wir empfehlen, die Mikrobewertung für eine kalibrierte Version abzuschließen.",
      fr: "Ce plan est basé sur une évaluation exploratoire. Nous recommandons de compléter la micro-évaluation pour une version calibrée.",
      es: "Este plan se basa en una evaluación exploratoria. Recomendamos completar la microevaluación para una versión calibrada.",
      pt: "Este plano é baseado em uma avaliação exploratória. Recomendamos completar a microavaliação para uma versão calibrada.",
      it: "Questo piano si basa su una valutazione esplorativa. Consigliamo di completare la microvalutazione per una versione calibrata.",
      ru: "Этот план основан на исследовательской оценке. Рекомендуем пройти микрооценку для калиброванной версии.",
      ja: "このプランは探索的評価に基づいています。校正版にはマイクロ評価の完了をお勧めします。",
      ko: "이 계획은 탐색적 평가를 기반으로 합니다. 보정된 버전을 위해 마이크로 평가를 완료하는 것을 권장합니다.",
    },
    locale,
  );

  const unlockCTA = L(
    {
      en: "Unlock full plan + AI coaching follow-up",
      zh: "解锁完整计划 + AI教练跟进",
      nl: "Ontgrendel volledig plan + AI-coaching opvolging",
      de: "Vollständigen Plan + KI-Coaching-Nachverfolgung freischalten",
      fr: "Débloquer le plan complet + suivi coaching IA",
      es: "Desbloquear plan completo + seguimiento de coaching IA",
      pt: "Desbloquear plano completo + acompanhamento de coaching IA",
      it: "Sblocca piano completo + follow-up coaching IA",
      ru: "Разблокировать полный план + AI-коучинг",
      ja: "完全プラン + AIコーチングフォローアップを解除",
      ko: "전체 계획 + AI 코칭 후속 조치 잠금 해제",
    },
    locale,
  );

  return {
    realConditionsProvided: true,
    jobDirections: llmOutput.jobDirections.map((jd) => ({
      ...jd,
      resourceGuide: jd.resourceGuide,
      isIdealMatch: jd.isIdealMatch ?? false,
      gapAnalysis: jd.gapAnalysis,
    })),
    jobSearchStrategy: llmOutput.jobSearchStrategy,
    actionPlan: {
      intensity,
      thrustNote: config.thrustNote,
      confidenceNote,
      week1: {
        theme: llmOutput.week1.theme,
        tasks: llmOutput.week1.tasks.map((t) => ({
          ...t,
          isCompleted: false,
        })),
      },
      weeksPreview: llmOutput.weeksPreview.map((w) => ({
        ...w,
        unlockCTA,
      })),
    },
    // Subscription bridge
    subscriptionBridge: {
      cta_zh: "开启你的30天深度探索行动",
      cta_en: L(
        {
          en: "Start your 30-day Deep Action",
          nl: "Start je 30-daagse Deep Action",
        },
        locale,
      ),
      trialDays: 7,
      valueProps: LX(
        {
          en: [
            "Full 4-week plan",
            "AI coaching weekly follow-up",
            "Continuously improving profile accuracy",
          ],
          zh: ["完整4周计划", "AI教练每周跟进", "档案精度持续提升"],
          nl: [
            "Volledig 4-wekenplan",
            "Wekelijkse AI-coaching opvolging",
            "Profielnauwkeurigheid blijft verbeteren",
          ],
        },
        locale,
      ),
    },
    // Follow-up email triggers
    followUpSchedule: {
      emailCollected: false, // Set by frontend
      triggers:
        locale === "zh"
          ? [
              {
                dayOffset: 3,
                type: "nudge",
                subject: "你的第一个任务完成了吗？",
                contentBrief: "Week 1 进度检查 + 完成率反馈",
              },
              {
                dayOffset: 7,
                type: "review",
                subject: "Week 1 回顾 + Week 2 预览",
                contentBrief: "Week 1 总结 + Week 2 主题预览 + 解锁CTA",
              },
              {
                dayOffset: 14,
                type: "upsell",
                subject: "你的深度探索画像有了新的数据",
                contentBrief: "画像精度更新提醒 + Ultra Deep Dive CTA",
              },
            ]
          : [
              {
                dayOffset: 3,
                type: "nudge",
                subject: L(
                  {
                    en: "Have you completed your first task?",
                    nl: "Heb je je eerste taak voltooid?",
                    de: "Hast du deine erste Aufgabe abgeschlossen?",
                    fr: "As-tu terminé ta première tâche ?",
                    es: "¿Has completado tu primera tarea?",
                    pt: "Você completou sua primeira tarefa?",
                    it: "Hai completato la tua prima attività?",
                    ru: "Вы выполнили первое задание?",
                    ja: "最初のタスクは完了しましたか？",
                    ko: "첫 번째 과제를 완료하셨나요?",
                  },
                  locale,
                ),
                contentBrief: L(
                  {
                    en: "Week 1 progress check + completion rate feedback",
                    nl: "Week 1 voortgangscheck + feedback op voltooiing",
                  },
                  locale,
                ),
              },
              {
                dayOffset: 7,
                type: "review",
                subject: L(
                  {
                    en: "Week 1 Review + Week 2 Preview",
                    nl: "Week 1 Overzicht + Week 2 Vooruitblik",
                    de: "Woche 1 Rückblick + Woche 2 Vorschau",
                    fr: "Bilan Semaine 1 + Aperçu Semaine 2",
                    es: "Revisión Semana 1 + Vista previa Semana 2",
                    pt: "Revisão Semana 1 + Prévia Semana 2",
                    it: "Riepilogo Settimana 1 + Anteprima Settimana 2",
                    ru: "Обзор Недели 1 + Предпросмотр Недели 2",
                    ja: "第1週の振り返り + 第2週のプレビュー",
                    ko: "1주차 리뷰 + 2주차 미리보기",
                  },
                  locale,
                ),
                contentBrief: L(
                  {
                    en: "Week 1 summary + Week 2 theme preview + unlock CTA",
                    nl: "Week 1 samenvatting + vooruitblik op week 2 + ontgrendel-CTA",
                  },
                  locale,
                ),
              },
              {
                dayOffset: 14,
                type: "upsell",
                subject: L(
                  {
                    en: "Your Deep Dive profile has new data",
                    nl: "Je Deep Dive profiel heeft nieuwe gegevens",
                    de: "Dein Deep Dive Profil hat neue Daten",
                    fr: "Ton profil Deep Dive a de nouvelles données",
                    es: "Tu perfil Deep Dive tiene nuevos datos",
                    pt: "Seu perfil Deep Dive tem novos dados",
                    it: "Il tuo profilo Deep Dive ha nuovi dati",
                    ru: "В вашем профиле Deep Dive новые данные",
                    ja: "あなたのDeep Diveプロフィールに新しいデータがあります",
                    ko: "Deep Dive 프로필에 새로운 데이터가 있습니다",
                  },
                  locale,
                ),
                contentBrief: L(
                  {
                    en: "Profile accuracy update reminder + Ultra Deep Dive CTA",
                    nl: "Herinnering profielupdate + Ultra Deep Dive CTA",
                  },
                  locale,
                ),
              },
            ],
    },
  };
}

// ============================================================
// Placeholders & Fallbacks
// ============================================================

/**
 * Build a placeholder CareerPathway when no real conditions are provided.
 */
export function buildPathwayPlaceholder(locale: string = "en"): Panel3Pathway {
  if (locale !== "zh") {
    return {
      realConditionsProvided: false,
      jobDirections: [],
      jobSearchStrategy: {
        positioning: L(
          {
            en: "After completing the real-world conditions form, personalized job positioning advice will be generated for you.",
            nl: "Na het invullen van de realiteitsvoorwaarden krijg je persoonlijk advies voor je loopbaanpositionering.",
          },
          locale,
        ),
        resumeHighlights: [],
        networkingTips: [],
        constraintStrategies: [],
      },
      actionPlan: {
        intensity: "exploratory",
        thrustNote: L(
          {
            en: "After completing the real-world conditions form, a personalized action plan will be generated for you.",
            nl: "Na het invullen van de realiteitsvoorwaarden wordt er een persoonlijk actieplan voor je gemaakt.",
          },
          locale,
        ),
        confidenceNote: undefined,
        week1: {
          theme: L({ en: "Getting Ready", nl: "Klaarzetten" }, locale),
          tasks: [
            {
              description: L(
                {
                  en: 'Complete the "Configure Your Report" form to unlock your personalized action plan',
                  nl: 'Vul het formulier "Configureer je rapport" in om je persoonlijke actieplan te ontgrendelen',
                },
                locale,
              ),
              relatedDirection: 0,
              difficulty: "easy",
              isCompleted: false,
            },
          ],
        },
        weeksPreview: [],
      },
      subscriptionBridge: {
        cta_zh: "完成配置后开启你的30天深度探索行动",
        cta_en: L(
          {
            en: "Complete setup to start your 30-day Deep Action",
            nl: "Rond de configuratie af om je 30-daagse Deep Action te starten",
          },
          locale,
        ),
        trialDays: 7,
        valueProps: LX(
          {
            en: [
              "Full 4-week plan",
              "AI coaching weekly follow-up",
              "Continuously improving profile accuracy",
            ],
            nl: [
              "Volledig 4-wekenplan",
              "Wekelijkse AI-coaching opvolging",
              "Profielnauwkeurigheid blijft verbeteren",
            ],
          },
          locale,
        ),
      },
      followUpSchedule: {
        emailCollected: false,
        triggers: [],
      },
    };
  }

  return {
    realConditionsProvided: false,
    jobDirections: [],
    jobSearchStrategy: {
      positioning: "完成现实条件表单后，将为你生成个性化的求职定位建议。",
      resumeHighlights: [],
      networkingTips: [],
      constraintStrategies: [],
    },
    actionPlan: {
      intensity: "exploratory",
      thrustNote: "完成现实条件表单后，将为你生成个性化的行动计划。",
      confidenceNote: undefined,
      week1: {
        theme: "准备就绪",
        tasks: [
          {
            description: '完成"配置你的报告"表单，解锁个性化行动计划',
            relatedDirection: 0,
            difficulty: "easy",
            isCompleted: false,
          },
        ],
      },
      weeksPreview: [],
    },
    subscriptionBridge: {
      cta_zh: "完成配置后开启你的30天深度探索行动",
      cta_en: "Complete setup to start your 30-day Deep Action",
      trialDays: 7,
      valueProps: ["完整4周计划", "AI教练每周跟进", "档案精度持续提升"],
    },
    followUpSchedule: {
      emailCollected: false,
      triggers: [],
    },
  };
}

/**
 * Fallback CareerPathway when LLM fails but real conditions are available.
 */
function buildPathwayFallback(
  careerMatch: Panel1CareerMatch,
  intensity: ActionPlanIntensity,
  config: IntensityConfig,
  locale: string,
): Panel3Pathway {
  const unlockCTA = L(
    {
      en: "Unlock full plan + AI coaching follow-up",
      zh: "解锁完整计划 + AI教练跟进",
      nl: "Ontgrendel volledig plan + AI-coaching opvolging",
      de: "Vollständigen Plan + KI-Coaching-Nachverfolgung freischalten",
      fr: "Débloquer le plan complet + suivi coaching IA",
      es: "Desbloquear plan completo + seguimiento de coaching IA",
      pt: "Desbloquear plano completo + acompanhamento de coaching IA",
      it: "Sblocca piano completo + follow-up coaching IA",
      ru: "Разблокировать полный план + AI-коучинг",
      ja: "完全プラン + AIコーチングフォローアップを解除",
      ko: "전체 계획 + AI 코칭 후속 조치 잠금 해제",
    },
    locale,
  );

  if (locale !== "zh") {
    return {
      realConditionsProvided: true,
      jobDirections: careerMatch.directions.slice(0, 3).map((d) => ({
        title_zh: d.title_zh,
        title_en: d.title_en,
        industry: L({ en: "General", nl: "Algemeen" }, locale),
        seniority: "mid-level",
        matchScore: d.matchScore,
        matchReason: L(
          {
            en: `Based on your Deep Dive profile, the ${d.title_en} direction is worth exploring.`,
            nl: `Op basis van je Deep Dive-profiel is de richting ${d.title_en} het verkennen waard.`,
          },
          locale,
        ),
        linkedinSearchQuery: `${d.title_en}`,
      })),
      jobSearchStrategy: {
        positioning: L(
          {
            en: "We suggest positioning yourself based on your core strengths. AI coaching can help you further refine your positioning strategy.",
            nl: "Positioneer jezelf vanuit je kernsterktes. AI-coaching kan je helpen die positionering verder aan te scherpen.",
          },
          locale,
        ),
        resumeHighlights: [
          L(
            {
              en: "Highlight project experience relevant to your target direction",
              nl: "Benadruk projectervaring die past bij je doelrichting",
            },
            locale,
          ),
        ],
        networkingTips: [
          L(
            {
              en: "Join online communities in your target industry",
              nl: "Sluit je aan bij online gemeenschappen in je doelbranche",
            },
            locale,
          ),
        ],
        constraintStrategies: [],
      },
      actionPlan: {
        intensity,
        thrustNote: config.thrustNote,
        confidenceNote: L(
          {
            en: "This plan is based on an exploratory assessment. We recommend completing the micro-assessment for a calibrated version.",
            nl: "Dit plan is gebaseerd op een verkennende beoordeling. We raden aan de micro-beoordeling te voltooien voor een gekalibreerde versie.",
          },
          locale,
        ),
        week1: {
          theme: config.weekThemes[0],
          tasks: [
            {
              description: L(
                {
                  en: "Search LinkedIn for positions related to your most interesting direction, save 3",
                  nl: "Zoek op LinkedIn naar functies rond je interessantste richting en bewaar er 3",
                },
                locale,
              ),
              relatedDirection: 1,
              difficulty: "easy",
              isCompleted: false,
            },
            {
              description: L(
                {
                  en: "Read one industry analysis article about your target direction",
                  nl: "Lees één sectoranalyse over je doelrichting",
                },
                locale,
              ),
              relatedDirection: 1,
              difficulty: "easy",
              isCompleted: false,
            },
          ],
        },
        weeksPreview: [
          {
            weekNumber: 2,
            theme: config.weekThemes[1],
            taskCount: 5,
            unlockCTA,
          },
          {
            weekNumber: 3,
            theme: config.weekThemes[2],
            taskCount: 6,
            unlockCTA,
          },
          {
            weekNumber: 4,
            theme: config.weekThemes[3],
            taskCount: 5,
            unlockCTA,
          },
        ],
      },
      subscriptionBridge: {
        cta_zh: "开启你的30天深度探索行动",
        cta_en: L(
          {
            en: "Start your 30-day Deep Action",
            nl: "Start je 30-daagse Deep Action",
          },
          locale,
        ),
        trialDays: 7,
        valueProps: LX(
          {
            en: [
              "Full 4-week plan",
              "AI coaching weekly follow-up",
              "Continuously improving profile accuracy",
            ],
            nl: [
              "Volledig 4-wekenplan",
              "Wekelijkse AI-coaching opvolging",
              "Profielnauwkeurigheid blijft verbeteren",
            ],
          },
          locale,
        ),
      },
      followUpSchedule: {
        emailCollected: false,
        triggers: [
          {
            dayOffset: 3,
            type: "nudge",
            subject: L(
              {
                en: "Have you completed your first task?",
                nl: "Heb je je eerste taak voltooid?",
              },
              locale,
            ),
            contentBrief: L(
              {
                en: "Week 1 progress check",
                nl: "Week 1 voortgangscheck",
              },
              locale,
            ),
          },
          {
            dayOffset: 7,
            type: "review",
            subject: L({ en: "Week 1 Review", nl: "Week 1 overzicht" }, locale),
            contentBrief: L(
              {
                en: "Week 1 summary + Week 2 preview",
                nl: "Week 1 samenvatting + vooruitblik op week 2",
              },
              locale,
            ),
          },
        ],
      },
    };
  }

  return {
    realConditionsProvided: true,
    jobDirections: careerMatch.directions.slice(0, 3).map((d) => ({
      title_zh: d.title_zh,
      title_en: d.title_en,
      industry: "综合",
      seniority: "mid-level",
      matchScore: d.matchScore,
      matchReason: `基于你的深度探索画像，${d.title_zh}方向值得探索。`,
      linkedinSearchQuery: `${d.title_en}`,
    })),
    jobSearchStrategy: {
      positioning:
        "建议基于你的核心优势来定位自己。AI教练可以帮你进一步细化定位策略。",
      resumeHighlights: ["突出与目标方向相关的项目经验"],
      networkingTips: ["加入目标行业的在线社群"],
      constraintStrategies: [],
    },
    actionPlan: {
      intensity,
      thrustNote: config.thrustNote,
      confidenceNote: "此计划基于探索性评估。建议完成微测评后查看校准版本。",
      week1: {
        theme: config.weekThemes[0],
        tasks: [
          {
            description: "在LinkedIn上搜索你最感兴趣的方向相关岗位，收藏3个",
            relatedDirection: 1,
            difficulty: "easy",
            isCompleted: false,
          },
          {
            description: "阅读一篇关于目标方向的行业分析文章",
            relatedDirection: 1,
            difficulty: "easy",
            isCompleted: false,
          },
        ],
      },
      weeksPreview: [
        {
          weekNumber: 2,
          theme: config.weekThemes[1],
          taskCount: 5,
          unlockCTA,
        },
        {
          weekNumber: 3,
          theme: config.weekThemes[2],
          taskCount: 6,
          unlockCTA,
        },
        {
          weekNumber: 4,
          theme: config.weekThemes[3],
          taskCount: 5,
          unlockCTA,
        },
      ],
    },
    subscriptionBridge: {
      cta_zh: "开启你的30天深度探索行动",
      cta_en: "Start your 30-day Deep Action",
      trialDays: 7,
      valueProps: ["完整4周计划", "AI教练每周跟进", "档案精度持续提升"],
    },
    followUpSchedule: {
      emailCollected: false,
      triggers: [
        {
          dayOffset: 3,
          type: "nudge",
          subject: "你的第一个任务完成了吗？",
          contentBrief: "Week 1 进度检查",
        },
        {
          dayOffset: 7,
          type: "review",
          subject: "Week 1 回顾",
          contentBrief: "Week 1 总结 + Week 2 预览",
        },
      ],
    },
  };
}
