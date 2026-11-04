import type { CareerReport } from "../types/report";
import type { PersonalProfileData } from "../types/platform";

export type NarrativeEvalKind = "profile" | "report" | "coaching";
export type NarrativeEvalLocale = "en" | "zh";
export type NarrativeEvalMetricId =
  | "specificity"
  | "integration"
  | "antiBarnum"
  | "repetition"
  | "dialogic";

export interface NarrativeSegment {
  label: string;
  text: string;
}

export interface NarrativeSignalGroup {
  label: string;
  terms: string[];
  minHits?: number;
}

export interface NarrativeEvalExpectations {
  signalGroups?: NarrativeSignalGroup[];
  bannedTerms?: string[];
  minOverallScore?: number;
  minMetricScores?: Partial<Record<NarrativeEvalMetricId, number>>;
  requireQuestion?: boolean;
}

export interface NarrativeEvalInput {
  id: string;
  kind: NarrativeEvalKind;
  locale: NarrativeEvalLocale;
  title: string;
  segments: NarrativeSegment[];
  expectations?: NarrativeEvalExpectations;
  source?: string;
}

export interface NarrativeEvalMetricResult {
  score: number;
  notes: string[];
}

export interface NarrativeEvalResult {
  id: string;
  kind: NarrativeEvalKind;
  locale: NarrativeEvalLocale;
  title: string;
  source?: string;
  overallScore: number;
  passed: boolean;
  totalCharacters: number;
  segmentCount: number;
  metrics: Partial<Record<NarrativeEvalMetricId, NarrativeEvalMetricResult>>;
  issues: string[];
}

const PROFILE_KEYS: Array<
  keyof NonNullable<PersonalProfileData["narrativeSnapshots"]>
> = [
  "identitySummary",
  "archetypeNarrative",
  "bigFiveNarrative",
  "valueNarrative",
  "meaningCompassNarrative",
  "sjtTensionNarrative",
  "crossDimensionNarrative",
  "growthMapInsight",
  "coreInsight",
  "letterToUser",
];

const DEFAULT_BANNED_TERMS: Record<NarrativeEvalLocale, string[]> = {
  zh: [
    "潜力",
    "旅程",
    "独特",
    "不断成长",
    "值得期待",
    "这意味着",
    "这种组合",
    "从某种意义上说",
    "量表",
    "维度",
    "构念",
    "高分",
    "低分",
    "百分比",
    "人格特质",
    "测试显示",
    // Meaning Compass academic terms — must never leak into prose
    "Frankl",
    "Logotherapy",
    "Ikigai",
    "Schwartz",
    "自我增强",
    "自我超越",
    "意义疗法",
  ],
  en: [
    "potential",
    "journey",
    "unique",
    "ever-growing",
    "exciting",
    "this means",
    "this combination",
    "in a sense",
    "dimension",
    "construct",
    "score",
    "percentage",
    "high trait",
    "low trait",
    "the test shows",
    // Meaning Compass academic terms — must never leak into prose
    "Frankl",
    "Logotherapy",
    "Ikigai",
    "Schwartz",
    "self-enhancement",
    "self-transcendence",
    "existential",
  ],
};

const DEFAULT_SIGNAL_GROUPS: Record<
  NarrativeEvalKind,
  Record<NarrativeEvalLocale, NarrativeSignalGroup[]>
> = {
  profile: {
    zh: [
      {
        label: "scene",
        terms: ["当", "在团队里", "开会时", "做决定时", "面对", "每次"],
      },
      {
        label: "values",
        terms: ["标准", "自主", "意义", "过程", "真实", "诚实"],
      },
      {
        label: "tension",
        terms: ["拉扯", "冲突", "两难", "一方面", "另一方面"],
      },
      {
        label: "growth",
        terms: ["注意", "代价", "优势", "误用", "收束", "推进"],
      },
    ],
    en: [
      {
        label: "scene",
        terms: ["when ", "in meetings", "during ", "at work", "under pressure"],
      },
      {
        label: "values",
        terms: ["standards", "autonomy", "meaning", "honest", "integrity"],
      },
      {
        label: "tension",
        terms: ["tension", "pull", "conflict", "part of you", "another part"],
      },
      {
        label: "growth",
        terms: ["watch out", "cost", "strength", "trade-off", "edge"],
      },
    ],
  },
  report: {
    zh: [
      {
        label: "fit",
        terms: ["适合", "方向", "判断", "优势", "工作"],
      },
      {
        label: "constraints",
        terms: ["现实", "限制", "条件", "城市", "经验", "签证"],
      },
      {
        label: "action",
        terms: ["下一步", "行动", "简历", "人脉", "定位"],
      },
      {
        label: "integration",
        terms: ["模式", "整合", "线索", "转化", "决定"],
      },
    ],
    en: [
      {
        label: "fit",
        terms: ["fit", "role", "direction", "strength", "work"],
      },
      {
        label: "constraints",
        terms: ["constraint", "reality", "city", "visa", "experience"],
      },
      {
        label: "action",
        terms: ["next step", "action", "resume", "network", "position"],
      },
      {
        label: "integration",
        terms: ["pattern", "synthesis", "translate", "decision", "insight"],
      },
    ],
  },
  coaching: {
    zh: [
      {
        label: "user-context",
        terms: ["你刚才提到", "你说到", "你在意", "你注意到", "你提过"],
      },
      {
        label: "tension",
        terms: ["拉扯", "一部分", "另一部分", "卡住", "冲突"],
      },
      {
        label: "question",
        terms: ["什么", "哪里", "什么时候", "哪一部分", "为什么"],
      },
    ],
    en: [
      {
        label: "user-context",
        terms: [
          "you said",
          "you mentioned",
          "you noticed",
          "you keep returning",
        ],
      },
      {
        label: "tension",
        terms: ["part of you", "another part", "pull", "stuck", "conflict"],
      },
      {
        label: "question",
        terms: ["what ", "where ", "when ", "which part", "why "],
      },
    ],
  },
};

const SCENE_MARKERS: Record<NarrativeEvalLocale, string[]> = {
  zh: [
    "当",
    "每次",
    "在团队里",
    "开会时",
    "做决定时",
    "一到",
    "面对",
    "项目里",
    "冲突里",
    "压力下",
  ],
  en: [
    "when ",
    "in meetings",
    "during ",
    "at work",
    "under pressure",
    "in a team",
    "on a project",
    "each time",
    "you notice",
    "in conversations",
  ],
};

const ACTION_MARKERS: Record<NarrativeEvalLocale, string[]> = {
  zh: [
    "拆开",
    "重组",
    "澄清",
    "推进",
    "判断",
    "观察",
    "连接",
    "收束",
    "追问",
    "校准",
  ],
  en: [
    "notice",
    "clarify",
    "push",
    "organize",
    "reframe",
    "probe",
    "decide",
    "translate",
    "test",
    "shape",
  ],
};

const DIALOGIC_PROMPTS: Record<NarrativeEvalLocale, string[]> = {
  zh: [
    "你刚才提到",
    "哪一部分",
    "什么时候",
    "你会怎么",
    "你最在意",
    "在你看来",
  ],
  en: [
    "when you say",
    "what feels",
    "which part",
    "where do you",
    "what would need",
    "before we decide",
    "where in the",
  ],
};

const DIRECTIVE_PHRASES: Record<NarrativeEvalLocale, string[]> = {
  zh: ["你必须", "正确答案是", "你肯定要选", "根据你的测评，你应该"],
  en: [
    "you must",
    "the right answer is",
    "you should definitely choose",
    "based on your assessment, you should",
  ],
};

const USEFUL_CONTRIBUTION_MARKERS: Record<NarrativeEvalLocale, string[]> = {
  zh: [
    "我的判断",
    "我更建议",
    "建议你",
    "原因是",
    "风险",
    "下一步",
    "可以先",
    "具体做法",
  ],
  en: [
    "my read is",
    "i recommend",
    "my recommendation",
    "because",
    "the risk",
    "next step",
    "start by",
    "a practical way",
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countTermHits(text: string, terms: string[]): number {
  const lowered = text.toLowerCase();
  return terms.reduce((count, term) => {
    const target = term.toLowerCase();
    const matches = lowered.match(new RegExp(escapeRegExp(target), "g"));
    return count + (matches?.length ?? 0);
  }, 0);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？!?.\n]+/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeSentence(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function getSentenceOpening(
  sentence: string,
  locale: NarrativeEvalLocale,
): string {
  if (locale === "zh") {
    return sentence.replace(/\s+/g, "").slice(0, 8);
  }
  return sentence.split(/\s+/).slice(0, 4).join(" ").toLowerCase();
}

function getAllText(segments: NarrativeSegment[]): string {
  return segments
    .map((segment) => segment.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

function getQuestionCount(text: string): number {
  const matches = text.match(/[?？]/g);
  return matches?.length ?? 0;
}

function buildSpecificityMetric(
  input: NarrativeEvalInput,
  genericHits: number,
): NarrativeEvalMetricResult {
  const text = getAllText(input.segments);
  const sceneHits = countTermHits(text, SCENE_MARKERS[input.locale]);
  const actionHits = countTermHits(text, ACTION_MARKERS[input.locale]);
  const lengthFloor = input.locale === "zh" ? 180 : 280;
  const shortPenalty = text.length < lengthFloor ? 20 : 0;
  const score =
    45 +
    Math.min(sceneHits, 5) * 11 +
    Math.min(actionHits, 8) * 5 -
    genericHits * 6 -
    shortPenalty;

  return {
    score: clampScore(score),
    notes: [
      `sceneHits=${sceneHits}`,
      `actionHits=${actionHits}`,
      `genericHits=${genericHits}`,
      `chars=${text.length}`,
    ],
  };
}

function buildIntegrationMetric(
  input: NarrativeEvalInput,
  signalGroups: NarrativeSignalGroup[],
): NarrativeEvalMetricResult {
  if (signalGroups.length === 0) {
    return {
      score: 0,
      notes: ["No signal groups configured"],
    };
  }

  const hitsByGroup = signalGroups.map((group) => {
    const hits = countTermHits(getAllText(input.segments), group.terms);
    return {
      label: group.label,
      hits,
      passed: hits >= (group.minHits ?? 1),
    };
  });

  const passedGroups = hitsByGroup.filter((group) => group.passed).length;
  const coverage = passedGroups / signalGroups.length;
  const segmentHits = input.segments.filter((segment) =>
    signalGroups.some((group) => countTermHits(segment.text, group.terms) > 0),
  ).length;
  const spread =
    input.segments.length > 0 ? segmentHits / input.segments.length : 0;
  const score = coverage * 80 + spread * 20;

  return {
    score: clampScore(score),
    notes: hitsByGroup.map(
      (group) => `${group.label}=${group.hits}${group.passed ? "" : " (miss)"}`,
    ),
  };
}

function buildAntiBarnumMetric(
  input: NarrativeEvalInput,
  signalGroups: NarrativeSignalGroup[],
  bannedHits: number,
  genericHits: number,
): NarrativeEvalMetricResult {
  const integrationMetric = buildIntegrationMetric(input, signalGroups);
  const coverageBonus = integrationMetric.score * 0.15;
  const score = 95 - bannedHits * 18 - genericHits * 8 + coverageBonus;

  return {
    score: clampScore(score),
    notes: [
      `bannedHits=${bannedHits}`,
      `genericHits=${genericHits}`,
      `integrationSupport=${integrationMetric.score}`,
    ],
  };
}

function buildRepetitionMetric(
  input: NarrativeEvalInput,
): NarrativeEvalMetricResult {
  const sentences = splitSentences(getAllText(input.segments));
  const normalized = sentences.map(normalizeSentence).filter(Boolean);
  const repeatedSentenceCount = normalized.length - new Set(normalized).size;
  const openings = sentences
    .map((sentence) => getSentenceOpening(sentence, input.locale))
    .filter(Boolean);
  const duplicateOpenings = openings.length - new Set(openings).size;
  const paragraphBodies = input.segments
    .map((segment) => normalizeSentence(segment.text))
    .filter(Boolean);
  const duplicateParagraphs =
    paragraphBodies.length - new Set(paragraphBodies).size;

  const score =
    100 -
    repeatedSentenceCount * 18 -
    duplicateOpenings * 8 -
    duplicateParagraphs * 20;

  return {
    score: clampScore(score),
    notes: [
      `repeatedSentences=${repeatedSentenceCount}`,
      `duplicateOpenings=${duplicateOpenings}`,
      `duplicateSegments=${duplicateParagraphs}`,
    ],
  };
}

function buildDialogicMetric(
  input: NarrativeEvalInput,
  requireQuestion: boolean,
): NarrativeEvalMetricResult {
  const text = getAllText(input.segments);
  const questionCount = getQuestionCount(text);
  const reflectiveHits = countTermHits(text, DIALOGIC_PROMPTS[input.locale]);
  const directiveHits = countTermHits(text, DIRECTIVE_PHRASES[input.locale]);
  const contributionHits = countTermHits(
    text,
    USEFUL_CONTRIBUTION_MARKERS[input.locale],
  );
  const missingQuestionPenalty =
    requireQuestion && questionCount === 0 ? 25 : 0;
  const excessiveQuestionPenalty = Math.max(0, questionCount - 2) * 15;
  const score =
    50 +
    Math.min(questionCount, 2) * 7 +
    Math.min(reflectiveHits, 3) * 7 +
    Math.min(contributionHits, 4) * 10 -
    directiveHits * 18 -
    missingQuestionPenalty -
    excessiveQuestionPenalty;

  return {
    score: clampScore(score),
    notes: [
      `questionCount=${questionCount}`,
      `reflectiveHits=${reflectiveHits}`,
      `contributionHits=${contributionHits}`,
      `directiveHits=${directiveHits}`,
      `excessiveQuestionPenalty=${excessiveQuestionPenalty}`,
    ],
  };
}

function getDefaultExpectations(
  kind: NarrativeEvalKind,
  locale: NarrativeEvalLocale,
): NarrativeEvalExpectations {
  return {
    signalGroups: DEFAULT_SIGNAL_GROUPS[kind][locale],
    bannedTerms: DEFAULT_BANNED_TERMS[locale],
    minOverallScore: kind === "coaching" ? 72 : 75,
    minMetricScores:
      kind === "coaching"
        ? {
            specificity: 60,
            integration: 60,
            antiBarnum: 70,
            repetition: 75,
            dialogic: 65,
          }
        : {
            specificity: 60,
            integration: 65,
            antiBarnum: 75,
            repetition: 75,
          },
    requireQuestion: false,
  };
}

export function evaluateNarrative(
  input: NarrativeEvalInput,
): NarrativeEvalResult {
  const defaults = getDefaultExpectations(input.kind, input.locale);
  const expectations: NarrativeEvalExpectations = {
    ...defaults,
    ...input.expectations,
    signalGroups:
      input.expectations?.signalGroups ?? defaults.signalGroups ?? [],
    bannedTerms: input.expectations?.bannedTerms ?? defaults.bannedTerms ?? [],
    minMetricScores: {
      ...(defaults.minMetricScores ?? {}),
      ...(input.expectations?.minMetricScores ?? {}),
    },
  };

  const text = getAllText(input.segments);
  const genericHits = countTermHits(text, DEFAULT_BANNED_TERMS[input.locale]);
  const bannedHits = countTermHits(text, expectations.bannedTerms ?? []);
  const signalGroups = expectations.signalGroups ?? [];

  const metrics: Partial<
    Record<NarrativeEvalMetricId, NarrativeEvalMetricResult>
  > = {
    specificity: buildSpecificityMetric(input, genericHits),
    integration: buildIntegrationMetric(input, signalGroups),
    antiBarnum: buildAntiBarnumMetric(
      input,
      signalGroups,
      bannedHits,
      genericHits,
    ),
    repetition: buildRepetitionMetric(input),
  };

  if (input.kind === "coaching") {
    metrics.dialogic = buildDialogicMetric(
      input,
      expectations.requireQuestion ?? false,
    );
  }

  const weights: Partial<Record<NarrativeEvalMetricId, number>> =
    input.kind === "coaching"
      ? {
          specificity: 0.25,
          integration: 0.2,
          antiBarnum: 0.2,
          repetition: 0.1,
          dialogic: 0.25,
        }
      : {
          specificity: 0.3,
          integration: 0.35,
          antiBarnum: 0.25,
          repetition: 0.1,
        };

  const weightedScores = Object.entries(weights).map(([metricId, weight]) => {
    const metric = metrics[metricId as NarrativeEvalMetricId];
    return (metric?.score ?? 0) * (weight ?? 0);
  });
  const overallScore = clampScore(
    weightedScores.reduce((sum, value) => sum + value, 0),
  );

  const issues: string[] = [];
  for (const [metricId, minScore] of Object.entries(
    expectations.minMetricScores ?? {},
  )) {
    const metric = metrics[metricId as NarrativeEvalMetricId];
    if (metric && minScore != null && metric.score < minScore) {
      issues.push(`${metricId} < ${minScore} (got ${metric.score})`);
    }
  }
  if (expectations.requireQuestion && getQuestionCount(text) === 0) {
    issues.push("coaching output requires a question for this scenario");
  }
  if (
    expectations.minOverallScore != null &&
    overallScore < expectations.minOverallScore
  ) {
    issues.push(
      `overallScore < ${expectations.minOverallScore} (got ${overallScore})`,
    );
  }

  return {
    id: input.id,
    kind: input.kind,
    locale: input.locale,
    title: input.title,
    source: input.source,
    overallScore,
    passed: issues.length === 0,
    totalCharacters: text.length,
    segmentCount: input.segments.length,
    metrics,
    issues,
  };
}

export function detectLocaleFromText(text: string): NarrativeEvalLocale {
  return /[\u4e00-\u9fff]/u.test(text) ? "zh" : "en";
}

function toSegmentsFromRecord(
  record: Record<string, unknown>,
  preferredKeys?: string[],
): NarrativeSegment[] {
  const keys = preferredKeys ?? Object.keys(record);
  return keys
    .map((key) => {
      const value = getString(record[key]);
      return value ? { label: key, text: value } : null;
    })
    .filter((segment): segment is NarrativeSegment => segment !== null);
}

function extractProfileSegments(payload: unknown): NarrativeSegment[] {
  if (!isRecord(payload)) return [];
  const snapshots = isRecord(payload.narrativeSnapshots)
    ? payload.narrativeSnapshots
    : payload;
  return toSegmentsFromRecord(snapshots, PROFILE_KEYS);
}

function extractReportSegments(payload: unknown): NarrativeSegment[] {
  if (!isRecord(payload)) return [];
  const segments: NarrativeSegment[] = [];

  const careerMatch = isRecord(payload.careerMatch)
    ? payload.careerMatch
    : null;
  if (careerMatch) {
    const summary = getString(careerMatch.summary);
    if (summary) segments.push({ label: "careerMatch.summary", text: summary });

    const directions = Array.isArray(careerMatch.directions)
      ? careerMatch.directions
      : [];
    directions.forEach((direction, index) => {
      if (!isRecord(direction)) return;
      const whySuitable = getString(direction.whySuitable);
      const challenges = getString(direction.challenges);
      if (whySuitable) {
        segments.push({
          label: `careerMatch.directions[${index}].whySuitable`,
          text: whySuitable,
        });
      }
      if (challenges) {
        segments.push({
          label: `careerMatch.directions[${index}].challenges`,
          text: challenges,
        });
      }
    });
  }

  const integration = isRecord(payload.integration)
    ? payload.integration
    : null;
  if (integration) {
    const coreInsight = getString(integration.coreInsight);
    const letterToUser = getString(integration.letterToUser);
    if (coreInsight) {
      segments.push({ label: "integration.coreInsight", text: coreInsight });
    }
    if (letterToUser) {
      segments.push({ label: "integration.letterToUser", text: letterToUser });
    }
  }

  const pathway = isRecord(payload.careerPathway)
    ? payload.careerPathway
    : null;
  if (pathway) {
    const jobSearchStrategy = isRecord(pathway.jobSearchStrategy)
      ? pathway.jobSearchStrategy
      : null;
    if (jobSearchStrategy) {
      const positioning = getString(jobSearchStrategy.positioning);
      if (positioning) {
        segments.push({
          label: "careerPathway.jobSearchStrategy.positioning",
          text: positioning,
        });
      }
      const networkingTips = Array.isArray(jobSearchStrategy.networkingTips)
        ? jobSearchStrategy.networkingTips
        : [];
      networkingTips.forEach((tip, index) => {
        const value = getString(tip);
        if (value) {
          segments.push({
            label: `careerPathway.jobSearchStrategy.networkingTips[${index}]`,
            text: value,
          });
        }
      });
    }

    const actionPlan = isRecord(pathway.actionPlan) ? pathway.actionPlan : null;
    const week1 =
      actionPlan && isRecord(actionPlan.week1) ? actionPlan.week1 : null;
    const thrustNote = actionPlan ? getString(actionPlan.thrustNote) : null;
    if (thrustNote) {
      segments.push({
        label: "careerPathway.actionPlan.thrustNote",
        text: thrustNote,
      });
    }
    if (week1 && Array.isArray(week1.tasks)) {
      week1.tasks.forEach((task, index) => {
        if (!isRecord(task)) return;
        const description =
          getString(task.title) ??
          getString(task.description) ??
          getString(task.action);
        if (description) {
          segments.push({
            label: `careerPathway.actionPlan.week1.tasks[${index}]`,
            text: description,
          });
        }
      });
    }
  }

  return segments;
}

function extractCoachingSegments(payload: unknown): NarrativeSegment[] {
  const messages = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.messagesJson)
      ? payload.messagesJson
      : [];

  return messages
    .map((message, index) => {
      if (!isRecord(message)) return null;
      const role = getString(message.role)?.toLowerCase();
      const sender = getString(message.sender)?.toLowerCase();
      const content =
        getString(message.content) ??
        getString(message.content_en) ??
        getString(message.content_zh);
      const isAssistantMessage =
        role === "assistant" ||
        (role == null && sender != null && sender !== "user");

      if (!content || !isAssistantMessage) return null;
      return {
        label: `assistant[${index}]`,
        text: content,
      };
    })
    .filter((segment): segment is NarrativeSegment => segment !== null);
}

export function extractNarrativeSegments(
  kind: NarrativeEvalKind,
  payload: unknown,
): NarrativeSegment[] {
  switch (kind) {
    case "profile":
      return extractProfileSegments(payload);
    case "report":
      return extractReportSegments(payload);
    case "coaching":
      return extractCoachingSegments(payload);
  }
}

export function buildEvalInputFromPayload(params: {
  id: string;
  kind: NarrativeEvalKind;
  title: string;
  payload: unknown;
  locale?: NarrativeEvalLocale;
  source?: string;
  expectations?: NarrativeEvalExpectations;
}): NarrativeEvalInput {
  const segments = extractNarrativeSegments(params.kind, params.payload);
  const locale =
    params.locale ??
    detectLocaleFromText(segments.map((segment) => segment.text).join("\n"));

  return {
    id: params.id,
    kind: params.kind,
    locale,
    title: params.title,
    segments,
    expectations: params.expectations,
    source: params.source,
  };
}

export function summarizeEvalResult(result: NarrativeEvalResult): string {
  const metrics = Object.entries(result.metrics)
    .map(([metricId, metric]) => `${metricId}:${metric?.score ?? 0}`)
    .join(" | ");
  return `${result.passed ? "PASS" : "FAIL"} ${result.kind}:${result.id} overall=${result.overallScore} ${metrics}`;
}

export type EvalReadyReport = CareerReport;
