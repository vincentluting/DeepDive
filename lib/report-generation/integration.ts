// ============================================================
// Integration Layer Generator — LLM Call #4
// Generates coreInsight + transitions + letterToUser.
// Includes anti-fixation design in letterToUser.
// ============================================================

import type {
  AssessmentInput,
  Panel1CareerMatch,
  Panel3Pathway,
  IntegrationLayer,
  RealConditions,
} from "../types";
import { callLLM } from "../ai/model-router";
import {
  buildSystemMessage,
  extractJSON,
  consistencyToBand,
  matchScoreToBand,
} from "./prompt-utils";
import { enforceOutputLocale, buildRegeneratePrompt } from "./language-guard";
import { localeLanguageNames, type Locale } from "../i18n/config";
import { SCHWARTZ_VALUE_LABELS } from "../scoring/constants";
import type { ProfileNarrativeOutput } from "./types";
import type { ProfileAlgorithmOutput } from "../types";
import type { ResumeMatchResult } from "../resume/types";
import { buildResumeEvidenceBlock } from "./common-rules";
import { buildRealConditionsContextBlock } from "./real-conditions-context";
import { logLLMPromptMeta, logLLMQualityCheck } from "../db/llm-usage";
import { checkQuality } from "../ai/quality-gate";

const __DEV__ = process.env.NODE_ENV === "development";

type LocaleTexts = Record<string, string>;
function L(texts: LocaleTexts, locale: string): string {
  return texts[locale] ?? texts.en;
}

/** Repetition detection threshold — max bigram overlap between adjacent paragraphs */
const REPETITION_THRESHOLD = 0.3;

/**
 * Extract bigrams (word pairs) from text, normalized to lowercase.
 */
function extractBigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
  const bigrams = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]} ${words[i + 1]}`);
  }
  return bigrams;
}

/**
 * Check if a letter has excessive repetition between adjacent paragraphs.
 * Returns true if any pair of adjacent paragraphs shares >30% bigrams.
 */
function hasExcessiveRepetition(letter: string): boolean {
  const paragraphs = letter.split(/\n\n+/).filter((p) => p.trim().length > 20);
  if (paragraphs.length < 2) return false;

  for (let i = 0; i < paragraphs.length - 1; i++) {
    const a = extractBigrams(paragraphs[i]);
    const b = extractBigrams(paragraphs[i + 1]);
    if (a.size === 0 || b.size === 0) continue;

    let overlap = 0;
    for (const bg of a) {
      if (b.has(bg)) overlap++;
    }
    const overlapRatio = overlap / Math.min(a.size, b.size);
    if (overlapRatio > REPETITION_THRESHOLD) return true;
  }
  return false;
}

/**
 * Build the integration prompt.
 * v3.0: profileNarratives is optional — personality narratives now live in PersonalProfile.
 * When null, uses algorithm summary data instead of LLM-generated narratives.
 */
function buildIntegrationPrompt(
  assessment: AssessmentInput,
  algo: ProfileAlgorithmOutput,
  careerMatch: Panel1CareerMatch,
  profileNarratives: ProfileNarrativeOutput | null,
  pathway: Panel3Pathway,
  locale: string,
  resumeEvidence: ResumeMatchResult | null = null,
  realConditions: RealConditions | null = null,
): string {
  const top3Labels = algo.schwartz.top3.map(
    (k: string) =>
      SCHWARTZ_VALUE_LABELS[k as keyof typeof SCHWARTZ_VALUE_LABELS]?.[
        locale === "zh" ? "zh" : "en"
      ] ?? k,
  );
  const consistencyBand = consistencyToBand(
    Math.round(algo.sjtTensions.overallConsistency * 100),
    locale,
  );

  // Academic instrument tag (TwIVI/PVQ-21) and item count were previously
  // injected into the prompt. Removed so the LLM isn't seeded with framework
  // names or numeric data-provenance — its new brief (Epigraph v1) forbids
  // leaking either into coreInsight. The summary block below lists values by
  // label only; the instrument identity is recorded in the Colophon, not in
  // narrative copy.

  // v3.2: Pass full narrative for richer integration context
  const narrativeExcerpt = profileNarratives
    ? [
        profileNarratives.bigFiveNarrative,
        profileNarratives.valuesCrossImpactNarrative,
      ]
        .filter(Boolean)
        .join(" ")
    : `${assessment.archetype.label_en} archetype, top values: ${top3Labels.join(", ")}`;

  const resumeBlock = buildResumeEvidenceBlock(resumeEvidence, locale);
  const realityBlock = buildRealConditionsContextBlock(
    realConditions,
    locale,
    "summary",
  ).block;

  if (locale === "zh") {
    const directionsStr = careerMatch.directions
      .map(
        (d) =>
          `${d.rank}. ${d.title_zh}（${matchScoreToBand(d.matchScore, "zh")}）`,
      )
      .join("、");
    const weekTheme = pathway.actionPlan.week1?.theme || "准备就绪";

    const narrativeExcerptZh = profileNarratives
      ? [
          profileNarratives.bigFiveNarrative,
          profileNarratives.valuesCrossImpactNarrative,
        ]
          .filter(Boolean)
          .join(" ")
      : `${assessment.archetype.label_zh}型，核心价值观: ${top3Labels.join("、")}`;

    return `将职业匹配方向和现实路径连贯成一个完整的"从自我认知到行动"的旅程。

## 板块摘要

### 职业匹配方向
- 方向: ${directionsStr}
- 摘要: ${careerMatch.summary}

### 个人画像参考
- 12型: ${assessment.archetype.label_zh}（"${assessment.archetype.tagline_zh}"）
- 价值锚: ${top3Labels.join("、")}
- SJT行为一致性: ${consistencyBand}
- 概要: "${narrativeExcerptZh}..."

### 现实求职路径
- 首周主题: ${weekTheme}
- 岗位数量: ${pathway.jobDirections.length}个
${resumeBlock}
${realityBlock}

## 输出格式 (JSON)
{
  "coreInsight": "一句诗化的题词（40-60字，ONE sentence）——这本关于他的小说开篇会引用的那一句。不是总结、不是建议——一句关于这个人核心的观察，读完即驻留。第二人称，现在时。用意象、悖论、或一个精确的动作。严禁'探索显示''数据倾向于''基于XX题''最强的方向''交叉处''你的优势在于'。严禁任何数据来源引用（题数、价值量表名称、框架名）。严禁 RIASEC、大五、Schwartz、TwIVI、MBTI、TKI 等学术术语。严禁列举上方"用户的现实处境"中的具体字段（城市、签证、家庭、薪资等）——题词只关于人的内核，不沾染现实条件细节。参考张枣、周梦蝶、博尔赫斯的警句气质——必须让读者在那一行上停下。",

  "transitions": {
    "profileToPathway": "一句话，从画像过渡到现实路径。"
  },

  "letterToUser": "这是最重要的字段。写一封让读者感到'被深度看见'的信。严格4段（300-400字），第二人称，温暖但精准——像一个智慧的老朋友，不是咨询师。\\n\\n第1段（~80字）：用个人画像概要中一个具体行为模式开头——他们会立刻认出来的。不要贴标签'你是XX'，而是展示一个场景。\\n第2段（~100字）：'啊哈'时刻——将职业方向和性格模式连接起来。为什么是这些方向，而不是别的？编织跨维度洞察。\\n第3段（~80字）：诚实的现实张力。如果上方"用户的现实处境"提供了具体约束（签证、城市、家庭、薪资、转行意愿、外部压力等），从中**最多挑 1-2 项**最有决策重量的，把它编织成压力线索——绝不要列字段清单。措辞要落在"策略门槛"而非"排他性否定"上：写"这意味着某些方向比另一些更可行"，而不是"你不能做 X"。如果没有提供处境，或处境与目前的方向无关，就只写一般转型张力，不要编造具体约束。这段的目标是诚实的张力，不是数据展示。\\n第4段（~50字）：反固化收尾——这个快照会演变。以一句他们会记住的话结尾。\\n\\n段落间换行分隔。禁止跨段重复观点或措辞。"
}`;
  }

  const langName = localeLanguageNames[locale as Locale] ?? "English";
  const directionsStrEn = careerMatch.directions
    .map(
      (d) =>
        `${d.rank}. ${d.title_en} (${matchScoreToBand(d.matchScore, "en")})`,
    )
    .join(", ");
  const weekThemeEn = pathway.actionPlan.week1?.theme || "Ready to begin";

  const languageLock =
    locale === "en"
      ? ""
      : `\n\n## Output Language Lock\nEvery JSON string value MUST be written entirely in ${langName}. The source profile and career titles may be in English or Chinese; understand them internally, then rewrite the letter, core insight, and transition in natural ${langName}. Never mirror user-input language when it differs from ${langName}.`;

  return `Connect the career match directions and reality pathway into a coherent "from self-knowledge to action" journey.${languageLock}

## Summary

### Career Match Directions
- Directions: ${directionsStrEn}
- Summary: ${careerMatch.summary}

### Profile Reference
- 12 Type: ${assessment.archetype.label_en} ("${assessment.archetype.tagline_en}")
- Values: ${top3Labels.join(", ")}
- SJT behavioral consistency: ${consistencyBand}
- Summary: "${narrativeExcerpt}..."

### Real Career Pathway
- Week 1 theme: ${weekThemeEn}
- Job directions: ${pathway.jobDirections.length}
${resumeBlock}
${realityBlock}

## Output Format (JSON) — you MUST output ALL three fields in a single complete JSON object

{
  "letterToUser": "THIS IS THE MOST IMPORTANT FIELD. Write a letter in ${langName} that makes the reader feel deeply seen. Exactly 4 paragraphs (250-350 words total for English; comparable concise length for other languages). Second-person, warm but precise — like a wise friend, not a counselor.\\nParagraph 1 (~60 words): Open with a specific behavioral pattern from the Profile Summary — something they'll instantly recognize. Don't label with 'you are X'; show it through a scene.\\nParagraph 2 (~80 words): The 'aha' — connect career directions to personality patterns. Why THESE directions, not just any? Weave the cross-dimensional insights.\\nParagraph 3 (~60 words): Honest reality tension. If the \\"User's Reality Snapshot\\" above lists concrete constraints (visa, city, family, salary floor, retraining willingness, external pressure), select AT MOST 1-2 that carry the greatest decision weight for this person. Weave them into prose as pressure lines — never as a checklist. Frame as strategic threshold (\\"this constraint means certain industries become more viable than others\\"), never as exclusion (\\"you can't do X\\"). If the snapshot is absent or irrelevant, write only the general transition tension — do not invent concrete constraints. The goal is honest tension, not data display.\\nParagraph 4 (~40 words): Anti-fixation close — this snapshot will evolve. End with something they'll remember.\\nSeparate paragraphs with newlines. Never repeat ideas or phrases across paragraphs.",

  "coreInsight": "ONE poetic sentence in ${langName} (30-50 words for English; comparable concise length for other languages) — the epigraph to a novel about this person. Not a summary, not advice — a single observation about who they are that feels inevitable once read. Second-person, present tense. Use an image, a paradox, or a precise gesture. Strictly forbidden: 'the exploration suggests', 'the data shows', 'based on X items', 'your strongest career directions', 'at the intersection of', 'you are best suited for'. Strictly forbidden: any reference to data sources (item counts, instrument names, framework names). Strictly forbidden: RIASEC, Big Five, Schwartz, TwIVI, MBTI, TKI, Holland and other academic terminology. Strictly forbidden: naming specific reality-snapshot fields (city, visa, partner, salary floor, etc.) — the epigraph is about the person's interior, not their circumstances. Think Rilke, Borges, Pessoa — an aphorism about a human being. The reader must stop at this line.",

  "transitions": {
    "profileToPathway": "One sentence in ${langName} transitioning from profile to real-world pathway."
  }
}`;
}

/**
 * Generate integration layer via LLM.
 * Returns coreInsight, transitions, and letterToUser.
 *
 * On failure, returns algorithm-based fallback text.
 */
export async function generateIntegration(
  assessment: AssessmentInput,
  algo: ProfileAlgorithmOutput,
  careerMatch: Panel1CareerMatch,
  profileNarratives: ProfileNarrativeOutput | null,
  pathway: Panel3Pathway,
  locale: string = "en",
  resumeEvidence: ResumeMatchResult | null = null,
  realConditions: RealConditions | null = null,
  userId?: string | null,
): Promise<IntegrationLayer> {
  // totalQuestions + isV3 previously drove prompt interpolation and fallback
  // copy. Epigraph v1 forbids item-count and framework provenance in
  // user-facing text, so both are gone from this path.

  const prompt = buildIntegrationPrompt(
    assessment,
    algo,
    careerMatch,
    profileNarratives,
    pathway,
    locale,
    resumeEvidence,
    realConditions,
  );

  // Phase F observability: record RC injection state for this LLM call so
  // production SQL can verify the audit-driven prompt fix is active.
  const rcMeta = buildRealConditionsContextBlock(
    realConditions,
    locale,
    "summary",
  );
  logLLMPromptMeta({
    taskName: "integration",
    userId,
    locale,
    realConditionsProvided: rcMeta.provided,
    realConditionsFieldCount: rcMeta.fieldCount,
  });
  const systemMessage = buildSystemMessage(locale, {
    includeRestraintRules: false,
  });

  const callOpts = {
    maxTokens: locale === "en" ? 4000 : 3000,
    enableCache: true,
    responseFormat: "json" as const,
  };
  const msgs: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: systemMessage },
    { role: "user", content: prompt },
  ];

  // Validation loop: retry once if LLM returns incomplete JSON or repetitive text.
  // API errors fall through to fallback immediately — model-router already
  // exhausted its internal retries + failover chain, so retrying here is wasteful.
  const langName = localeLanguageNames[locale as Locale] ?? "English";

  // Phase 2 quality gate observability — snapshot before first LLM call.
  const qualityWindowStart = Date.now();

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await callLLM("integration", msgs, callOpts);
      if (!content) throw new Error("Empty LLM response for integration");

      const parsed = extractJSON(content) as Record<string, unknown>;
      if (
        !parsed.coreInsight ||
        !parsed.letterToUser ||
        typeof parsed.letterToUser !== "string" ||
        (parsed.letterToUser as string).length < 50
      ) {
        if (__DEV__)
          console.warn(
            `[integration] Attempt ${attempt + 1}: incomplete JSON (missing letterToUser), retrying...`,
          );
        continue;
      }

      const result = {
        coreInsight: parsed.coreInsight as string,
        transitions: {
          profileToPathway:
            (parsed.transitions as Record<string, string>)?.profileToPathway ??
            "",
        },
        letterToUser: parsed.letterToUser as string,
      };

      // Repetition check: if adjacent paragraphs share >30% bigrams, retry once
      if (hasExcessiveRepetition(result.letterToUser)) {
        if (__DEV__)
          console.warn(
            "[integration] Letter has repetitive paragraphs, retrying...",
          );
        continue;
      }

      // Language guard: detect → regenerate → fallback-on-failure
      // Sanitize branch flips the flag to trigger algorithm fallback below.
      let guardFailed = false;
      const guarded = await enforceOutputLocale(result, locale, {
        taskId: "integration",
        regenerate: async (foundMismatchFields) => {
          try {
            const retryPrompt = buildRegeneratePrompt({
              originalPrompt: prompt,
              langName,
              foundMismatchFields,
            });
            const retryContent = await callLLM(
              "integration",
              [
                { role: "system", content: systemMessage },
                { role: "user", content: retryPrompt },
              ],
              { ...callOpts, enableCache: false },
            );
            if (!retryContent) return null;
            const retryParsed = extractJSON(retryContent) as Record<
              string,
              unknown
            >;
            if (
              !retryParsed.coreInsight ||
              !retryParsed.letterToUser ||
              typeof retryParsed.letterToUser !== "string" ||
              (retryParsed.letterToUser as string).length < 50
            ) {
              return null;
            }
            return {
              coreInsight: retryParsed.coreInsight as string,
              transitions: {
                profileToPathway:
                  (retryParsed.transitions as Record<string, string>)
                    ?.profileToPathway ?? "",
              },
              letterToUser: retryParsed.letterToUser as string,
            };
          } catch (retryError) {
            if (__DEV__) {
              console.warn(
                "[integration] regenerate attempt failed:",
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
      });
      if (guardFailed) {
        logLLMQualityCheck({
          taskName: "integration",
          userId,
          qualityCheckResult: "fail-language",
          createdAfter: qualityWindowStart,
        });
        break;
      }
      // Phase 2 quality gate observability.
      const qualityOutcome = checkQuality(guarded, {
        requiredFields: ["coreInsight", "letterToUser"],
        minLengthFields: { coreInsight: 200, letterToUser: 50 },
        repetitionField: "letterToUser",
        repetitionThreshold: 0.3,
      });
      logLLMQualityCheck({
        taskName: "integration",
        userId,
        qualityCheckResult: qualityOutcome.result,
        createdAfter: qualityWindowStart,
      });
      return guarded;
    } catch (error) {
      // API errors: model-router already retried 3x + failover. Don't retry again.
      if (__DEV__)
        console.error(`[integration] LLM call failed, using fallback:`, error);
      break;
    }
  }

  // Fallback — no academic terminology allowed
  const top3Labels = algo.schwartz.top3.map(
    (k: string) =>
      SCHWARTZ_VALUE_LABELS[k as keyof typeof SCHWARTZ_VALUE_LABELS]?.[
        locale === "zh" ? "zh" : "en"
      ] ?? k,
  );
  // Fallback copy must satisfy the same Epigraph v1 contract as the LLM output:
  // no item counts, no framework/instrument names, no "based on N questions"
  // provenance. The colophon records the instrument; narrative copy stays
  // silent about it.
  if (locale === "zh") {
    return {
      coreInsight: `你的探索呈现出${assessment.archetype.label_zh}的模式——${assessment.archetype.tagline_zh}。这份报告是你职业探索之旅的起点。`,
      transitions: {
        profileToPathway: "了解了自己之后，让我们结合现实来规划——",
      },
      letterToUser: `你好。\n\n你展现出「${assessment.archetype.label_zh}」的特质——${assessment.archetype.tagline_zh}。你的价值锚集中在${top3Labels.join("、")}，这些驱动着你对职业方向的选择。\n\n你不只是这个标签——这份报告是此刻的快照，而你是一个持续进化的人。随着你的探索和经历不断积累，你的画像会持续变化，方向也会持续清晰。\n\n如果你想更深入地理解这些发现，教练对话是一个值得尝试的下一步。`,
    };
  }
  if (locale !== "en") {
    return {
      coreInsight: L(
        {
          en: `Your exploration reveals a ${assessment.archetype.label_en} pattern — ${assessment.archetype.tagline_en}. This report is the starting point of your career exploration.`,
          nl: `Je verkenning laat een herkenbaar patroon zien: je zoekt richting zonder jezelf vast te zetten in één definitief antwoord.`,
        },
        locale,
      ),
      transitions: {
        profileToPathway: L(
          {
            en: "Now that you know yourself better, let's map the real-world path —",
            nl: "Nu je jezelf scherper ziet, kunnen we de stap naar de realiteit maken —",
          },
          locale,
        ),
      },
      letterToUser: L(
        {
          en: `Hello.\n\nYou show the qualities of a "${assessment.archetype.label_en}" — ${assessment.archetype.tagline_en}. Your value anchors center on ${top3Labels.join(", ")}, shaping how you approach career choices.\n\nYou are more than this label — this report is a snapshot, not a sentence. Your profile evolves as you do. As your experiences accumulate, your direction will become clearer.\n\nIf you want to understand these findings more deeply, a coaching conversation is a worthwhile next step.`,
          nl: `Hallo.\n\nJe rapport wijst niet naar één vaststaand antwoord, maar naar een herkenbare manier waarop jij keuzes benadert: je wilt richting voelen zonder je eigen beoordelingsvermogen uit handen te geven.\n\nDat maakt je zoektocht soms trager, maar ook eerlijker. Je probeert niet alleen te kiezen wat logisch klinkt; je probeert te voelen welke richting genoeg ruimte laat voor wie je aan het worden bent.\n\nDeze momentopname hoeft je niet vast te zetten. Ze mag juist dienen als werkmateriaal: iets om tegenaan te denken, aan te scherpen en soms ook tegen te spreken.\n\nAls je deze lijnen verder wilt onderzoeken, kan het coachgesprek helpen om ze naar concrete situaties te vertalen.`,
        },
        locale,
      ),
    };
  }
  return {
    coreInsight: `Your exploration reveals a ${assessment.archetype.label_en} pattern — ${assessment.archetype.tagline_en}. This report is the starting point of your career exploration.`,
    transitions: {
      profileToPathway:
        "Now that you know yourself better, let's map the real-world path —",
    },
    letterToUser: `Hello.\n\nYou show the qualities of a "${assessment.archetype.label_en}" — ${assessment.archetype.tagline_en}. Your value anchors center on ${top3Labels.join(", ")}, shaping how you approach career choices.\n\nYou are more than this label — this report is a snapshot, not a sentence. Your profile evolves as you do. As your experiences accumulate, your direction will become clearer.\n\nIf you want to understand these findings more deeply, a coaching conversation is a worthwhile next step.`,
  };
}
