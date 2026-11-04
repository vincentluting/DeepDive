// ============================================================
// Career Match Narrative Generator — LLM Call #2
// Generates whySuitable + challenges for each career direction.
// v2.0: IPIP-NEO-120 + PVQ-21 | v3.0: IPIP-60 + TwIVI
// ============================================================

import type {
  AssessmentInput,
  ProfileAlgorithmOutput,
  RealConditions,
} from "../types";
import { callLLM } from "../ai/model-router";
import {
  getExplorationFramingRules,
  buildResumeEvidenceBlock,
} from "./common-rules";
import type { ResumeMatchResult } from "../resume/types";
import {
  buildUserProfileBlock,
  buildSystemMessage,
  extractJSON,
  matchScoreToBand,
  fitScoreToBand,
} from "./prompt-utils";
import { sanitizeRealConditions } from "../ai/prompt-sanitization";
import { buildRealConditionsContextBlock } from "./real-conditions-context";
import { logLLMPromptMeta, logLLMQualityCheck } from "../db/llm-usage";
import { checkQuality } from "../ai/quality-gate";
import {
  enforceOutputLocale,
  buildRegeneratePrompt,
  extractProperNouns,
} from "./language-guard";
import { localeLanguageNames, type Locale } from "../i18n/config";
import type {
  CareerMatchAlgorithmOutput,
  CareerMatchNarrativeOutput,
} from "./types";

const __DEV__ = process.env.NODE_ENV === "development";

type LocaleTexts = Record<string, string>;
function L(texts: LocaleTexts, locale: string): string {
  return texts[locale] ?? texts.en;
}

/**
 * Build the career match narrative prompt.
 * Includes user profile summary, algorithm match results,
 * and real conditions if available.
 *
 * Prompt trimming (v3.1): removed data source annotations, practitioner quotes
 * (rendered separately in UI), and actionableInsights instruction (LLM rarely
 * returns useful results). Saves ~200 tokens with zero narrative quality loss.
 */
function buildAiEraDirectionsBlock(
  careerMatchAlgo: CareerMatchAlgorithmOutput,
  locale: string,
): string {
  const isZh = locale === "zh";
  if (careerMatchAlgo.aiEraCandidates.length === 0) return "";

  const headerLabel = isZh
    ? "AI 时代机遇方向"
    : "AI-Era Opportunity Directions";
  const lines = careerMatchAlgo.aiEraCandidates
    .map((c, i) => {
      const title = isZh ? c.direction.title_zh : c.direction.title_en;
      const label = isZh ? `AI方向 ${i + 1}` : `AI Direction ${i + 1}`;
      const cat = c.direction.aiEraCategory ?? "augmented";
      const catLabel = isZh
        ? {
            "ai-native": "AI原生型",
            augmented: "AI增强型",
            transformed: "AI转型中",
            stable: "AI稳定型",
          }[cat]
        : {
            "ai-native": "AI-Native",
            augmented: "AI-Augmented",
            transformed: "AI-Transformed",
            stable: "AI-Stable",
          }[cat];
      const matchBand = matchScoreToBand(c.score.total, locale);
      return `\n### ${label}: ${title}${isZh ? "（" : " ("}${catLabel}，${isZh ? "匹配度" : "match"}: ${matchBand}${isZh ? "）" : ")"}`;
    })
    .join("\n");

  return `\n\n## ${headerLabel}\n${lines}`;
}

function buildCareerMatchPrompt(
  assessment: AssessmentInput,
  profileAlgo: ProfileAlgorithmOutput,
  careerMatchAlgo: CareerMatchAlgorithmOutput,
  realConditions: RealConditions | null,
  locale: string,
  resumeEvidence: ResumeMatchResult | null = null,
): string {
  const explorationRules = getExplorationFramingRules(locale);
  const profileBlock = buildUserProfileBlock(assessment, profileAlgo, locale);
  // sanitizeRealConditions is invoked inside buildRealConditionsContextBlock
  // for the narrative-mode block, so we don't need to call it twice here.
  // The local `safeConditions` variable is intentionally retained as null in
  // this prompt path; sensitive constraints (visa/family/salary/external
  // pressure) are deliberately omitted from this LLM call and acknowledged
  // generally in the challenges instruction below.
  void sanitizeRealConditions;
  const isZh = locale === "zh";

  // Real conditions block — 8-field low-sensitivity narrative subset.
  // Helper appends a footer that nudges the LLM to assume sensitive
  // constraints (visa/family/salary/etc.) may apply and use general
  // conditional phrasing when writing challenges.
  const realConditionsBlock = `\n${
    buildRealConditionsContextBlock(realConditions, locale, "narrative").block
  }`;

  // Directions block — MatchInsights only (quotes rendered separately in UI)
  const directionsBlock = careerMatchAlgo.candidates
    .map((c, i) => {
      const title = isZh ? c.direction.title_zh : c.direction.title_en;
      const dirLabel = isZh ? `方向 ${i + 1}` : `Direction ${i + 1}`;
      const matchLabel = isZh
        ? `匹配度: ${matchScoreToBand(c.score.total, "zh")}`
        : `match: ${matchScoreToBand(c.score.total, "en")}`;

      let insightsBlock: string;
      if (c.insights) {
        const strengthLabel = isZh ? "**为什么匹配：**" : "**Why it matches:**";
        const gapLabel = isZh ? "**成长空间：**" : "**Growth edges:**";
        const strengths = c.insights.strengths
          .map((s) => `  ✓ ${isZh ? s.detail_zh : s.detail_en}`)
          .join("\n");
        const gaps =
          c.insights.gaps.length > 0
            ? `\n${gapLabel}\n${c.insights.gaps.map((g) => `  △ ${isZh ? g.detail_zh : g.detail_en}`).join("\n")}`
            : "";
        insightsBlock = `\n${strengthLabel}\n${strengths}${gaps}`;
      } else {
        const { interestFit, valueFit, personalityFit } = c.score.breakdown;
        insightsBlock = isZh
          ? `- 兴趣匹配: ${fitScoreToBand(interestFit, "zh")} · 价值契合: ${fitScoreToBand(valueFit, "zh")} · 人格适配: ${fitScoreToBand(personalityFit, "zh")}`
          : `- Interest fit: ${fitScoreToBand(interestFit, "en")} · Value fit: ${fitScoreToBand(valueFit, "en")} · Personality fit: ${fitScoreToBand(personalityFit, "en")}`;
      }

      const aiRiskTag =
        c.direction.aiEraCategory === "transformed"
          ? isZh
            ? "\n⚠️ AI转型风险: 该方向正受到AI技术的显著冲击，需在叙事中如实提及。"
            : "\n⚠️ AI Disruption Risk: This direction faces significant AI displacement — must be addressed in narrative."
          : "";
      return `\n### ${dirLabel}: ${title}${isZh ? "（" : " ("}${matchLabel}${isZh ? "）" : ")"}\n${insightsBlock}${aiRiskTag}`;
    })
    .join("\n");

  // ── Assemble prompt ──
  const matchResultsTitle = isZh
    ? "算法匹配结果"
    : "Algorithm Matching Results";
  const taskTitle = isZh ? "任务" : "Task";

  const whySuitableInstr = isZh
    ? '**whySuitable** (80-120字): 为什么值得探索——引用具体数据点，编织跨维度关联。用"数据显示""你的…表明"等表达，不用"你适合"。'
    : '**whySuitable** (100-160 words): Why worth exploring — reference specific data points, weave cross-dimensional connections. Use "the data suggests," not "you\'re suited for."';
  const challengesInstr = isZh
    ? '**challenges** (50-80字): 成长空间——用发展机会的语气，不用缺点的语气。如果方向标注了"⚠️ AI转型风险"，challenges 必须如实提及 AI 对该方向的冲击，并建议用户关注该领域中 AI 无法替代的高价值细分。\n此外，当某个方向可能与用户上方"现实背景"未列出的更敏感约束（签证担保、家庭情况、薪资底线、转行培训意愿、外部期望压力等）发生冲突时，challenges 必须用通用的条件句式承认这一策略门槛，例如："如果这个方向需要你尚未拥有的签证担保，或要求与家庭情况不符的搬迁，建议先核实再投入。" 措辞落在"策略门槛"，不要写成"你不能做 X"。不要假装知道未在 prompt 中显示的具体值。'
    : '**challenges** (60-100 words): Growth edges — frame as development opportunities, not deficiencies. If a direction is flagged with "⚠️ AI Disruption Risk", challenges MUST honestly address how AI is reshaping this field and suggest the user focus on high-value niches where human judgment remains essential.\nIn addition, when a direction may strain real-world constraints not listed in the user\'s Real-World Context above (visa sponsorship, family responsibilities, salary floor, retraining willingness, external expectation pressure), challenges MUST acknowledge the strategic threshold using general conditional phrasing — for example: "if this requires visa sponsorship you don\'t have, or relocation incompatible with your family situation, you\'ll want to verify before pursuing." Frame as strategic threshold, never as exclusion ("you can\'t do X"). Do not claim knowledge of specific values not shown in this prompt.';
  const summaryInstr = isZh
    ? "以及整体 **summary** (60-100字)。"
    : "Plus an overall **summary** (80-120 words).";
  const taskPreamble = isZh
    ? "为以上每个方向生成："
    : "For each direction above, generate:";
  const outputFormatLabel = isZh ? "输出格式" : "Output format";

  // AI-era directions block (optional, only if there are AI-era candidates)
  const aiEraBlock = buildAiEraDirectionsBlock(careerMatchAlgo, locale);
  const hasAiEra = careerMatchAlgo.aiEraCandidates.length > 0;

  const aiEraTaskInstr = hasAiEra
    ? isZh
      ? '\n\n同时为每个 AI 方向生成简短的 whySuitable (40-60字，聚焦"AI时代为什么需要你这样的人") 和 challenges (30-50字)。'
      : '\n\nAlso generate brief whySuitable (50-80 words, focusing on "why the AI era needs someone like you") and challenges (40-60 words) for each AI Direction.'
    : "";

  const aiEraJsonBlock = hasAiEra
    ? `,
  "aiEraDirections": [
    {
      "whySuitable": "...",
      "challenges": "..."
    }
  ]`
    : "";

  const resumeBlock = buildResumeEvidenceBlock(resumeEvidence, locale);

  return `${explorationRules}

${profileBlock}
${realConditionsBlock}${resumeBlock}

## ${matchResultsTitle}
${directionsBlock}${aiEraBlock}

## ${taskTitle}

${taskPreamble}
1. ${whySuitableInstr}
2. ${challengesInstr}

${summaryInstr}${aiEraTaskInstr}

${outputFormatLabel} (JSON):
{
  "summary": "...",
  "directions": [
    {
      "whySuitable": "...",
      "challenges": "..."
    }
  ]${aiEraJsonBlock}
}`;
}

/**
 * Generate career match narratives via LLM.
 * Returns summary + per-direction whySuitable/challenges.
 *
 * On failure, returns algorithm-based fallback text.
 */
export async function generateCareerMatchNarrative(
  assessment: AssessmentInput,
  profileAlgo: ProfileAlgorithmOutput,
  careerMatchAlgo: CareerMatchAlgorithmOutput,
  realConditions: RealConditions | null,
  locale: string = "en",
  resumeEvidence: ResumeMatchResult | null = null,
  userId?: string | null,
): Promise<CareerMatchNarrativeOutput> {
  const prompt = buildCareerMatchPrompt(
    assessment,
    profileAlgo,
    careerMatchAlgo,
    realConditions,
    locale,
    resumeEvidence,
  );

  // Phase F observability: record RC injection state for this LLM call so
  // production SQL can verify the audit-driven prompt fix is active.
  const rcMeta = buildRealConditionsContextBlock(
    realConditions,
    locale,
    "narrative",
  );
  logLLMPromptMeta({
    taskName: "career-match-narrative",
    userId,
    locale,
    realConditionsProvided: rcMeta.provided,
    realConditionsFieldCount: rcMeta.fieldCount,
  });
  const systemMessage = buildSystemMessage(locale);

  // Phase 2 quality gate observability — snapshot before first LLM call.
  const qualityWindowStart = Date.now();

  // Validation loop: retry once if LLM returns incomplete JSON.
  // API errors fall through to fallback immediately — model-router already
  // exhausted its internal retries + failover chain, so retrying here is wasteful.
  const hasAiEra = careerMatchAlgo.aiEraCandidates.length > 0;
  const maxTokens =
    locale === "en" ? (hasAiEra ? 4000 : 3000) : hasAiEra ? 3500 : 2500;
  const langName = localeLanguageNames[locale as Locale] ?? "English";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // 3+2+AI architecture: 3 primary + up to 3 AI-era directions get LLM narratives
      const content = await callLLM(
        "career-match-narrative",
        [
          { role: "system", content: systemMessage },
          { role: "user", content: prompt },
        ],
        {
          maxTokens,
          responseFormat: "json",
          enableCache: true,
        },
      );

      if (!content)
        throw new Error("Empty LLM response for career match narrative");

      const parsed = extractJSON(content) as Record<string, unknown>;
      if (
        !parsed.summary ||
        !Array.isArray(parsed.directions) ||
        parsed.directions.length === 0
      ) {
        if (__DEV__)
          console.warn(
            `[career-match-narrative] Attempt ${attempt + 1}: incomplete JSON, retrying...`,
          );
        continue;
      }

      // Language guard: detect → regenerate → fallback-on-failure
      // Sanitize branch flips the flag to trigger algorithm fallback below.
      let guardFailed = false;
      const guarded = await enforceOutputLocale(
        parsed as unknown as CareerMatchNarrativeOutput,
        locale,
        {
          taskId: "career-match-narrative",
          whitelistPhrases: extractProperNouns(realConditions),
          regenerate: async (foundMismatchFields) => {
            try {
              const retryPrompt = buildRegeneratePrompt({
                originalPrompt: prompt,
                langName,
                foundMismatchFields,
              });
              const retryContent = await callLLM(
                "career-match-narrative",
                [
                  { role: "system", content: systemMessage },
                  { role: "user", content: retryPrompt },
                ],
                { maxTokens, responseFormat: "json", enableCache: false },
              );
              if (!retryContent) return null;
              const retryParsed = extractJSON(retryContent) as Record<
                string,
                unknown
              >;
              if (
                !retryParsed.summary ||
                !Array.isArray(retryParsed.directions) ||
                retryParsed.directions.length === 0
              ) {
                return null;
              }
              return retryParsed as unknown as CareerMatchNarrativeOutput;
            } catch (retryError) {
              if (__DEV__) {
                console.warn(
                  "[career-match-narrative] regenerate attempt failed:",
                  retryError,
                );
              }
              return null;
            }
          },
          sanitize: (output) => {
            // Both LLM passes leaked — caller will return the algorithm fallback.
            guardFailed = true;
            return output;
          },
        },
      );
      if (guardFailed) {
        // Language guard exhausted — record fail-language so the cron
        // digest can surface degradation rates.
        logLLMQualityCheck({
          taskName: "career-match-narrative",
          userId,
          qualityCheckResult: "fail-language",
          createdAfter: qualityWindowStart,
        });
        break;
      }
      // Phase 2 quality gate: structural verdict for observability.
      // primary check = directions count + summary length.
      const qualityOutcome = checkQuality(guarded, {
        requiredFields: ["summary", "directions"],
        minLengthFields: { summary: 50 },
      });
      logLLMQualityCheck({
        taskName: "career-match-narrative",
        userId,
        qualityCheckResult: qualityOutcome.result,
        createdAfter: qualityWindowStart,
      });
      return guarded;
    } catch (error) {
      // API errors: model-router already retried 3x + failover. Don't retry again.
      if (__DEV__)
        console.error(
          `[career-match-narrative] LLM call failed, using fallback:`,
          error,
        );
      break;
    }
  }

  // Fallback
  if (locale === "zh") {
    return {
      summary: "基于你的兴趣图谱、人格特征和价值取向，以下方向最值得你探索。",
      directions: careerMatchAlgo.candidates.map((c) => ({
        whySuitable: `${c.direction.title_zh}方向与你的兴趣图谱${fitScoreToBand(c.score.breakdown.interestFit, "zh")}。这个方向值得你进一步探索。`,
        challenges:
          "每个方向都有其独特的挑战，建议通过实际尝试来验证你的真实感受。",
      })),
    };
  }
  if (locale !== "en") {
    return {
      summary: L(
        {
          en: "Based on your interest map, personality profile, and values, these directions are most worth exploring.",
          nl: "Op basis van je interessekaart, persoonlijkheidsprofiel en waarden zijn deze richtingen het meest het verkennen waard.",
        },
        locale,
      ),
      directions: careerMatchAlgo.candidates.map((c) => ({
        whySuitable: L(
          {
            en: `The ${c.direction.title_en} direction shows ${fitScoreToBand(c.score.breakdown.interestFit, "en")} interest alignment. Worth exploring further.`,
            nl: `De richting ${c.direction.title_en} sluit zichtbaar aan bij je interessepatroon. Het is de moeite waard om dit verder te verkennen.`,
          },
          locale,
        ),
        challenges: L(
          {
            en: "Each direction has its unique challenges — small experiments will help you validate your actual fit.",
            nl: "Elke richting heeft eigen aandachtspunten; kleine experimenten helpen je toetsen of dit echt bij je past.",
          },
          locale,
        ),
      })),
    };
  }
  return {
    summary:
      "Based on your interest map, personality profile, and values, these directions are most worth exploring.",
    directions: careerMatchAlgo.candidates.map((c) => ({
      whySuitable: `The ${c.direction.title_en} direction shows ${fitScoreToBand(c.score.breakdown.interestFit, "en")} interest alignment. Worth exploring further.`,
      challenges:
        "Each direction has its unique challenges — small experiments will help you validate your actual fit.",
    })),
  };
}
