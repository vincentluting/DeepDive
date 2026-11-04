// ============================================================
// Coaching Conversation Router — deterministic turn understanding
//
// Extracts the user's current focus, desired help, constraints, and
// correction signals before the LLM is called. This keeps the latest
// explicit request above assessment-derived context and makes routing
// behavior testable without adding another model call.
// ============================================================

export type CoachingMode =
  | "explore"
  | "decide"
  | "act"
  | "support"
  | "job_analysis";

export type DesiredHelp =
  | "listen"
  | "analyze"
  | "recommend"
  | "plan"
  | "information";

export type CoachingCorrectionSignal =
  | "missed_point"
  | "be_direct"
  | "recommend"
  | "not_practical";

export interface TurnUnderstanding {
  primaryIntent: string;
  coreQuestion: string;
  importantFacts: string[];
  constraints: string[];
  desiredHelp: DesiredHelp;
  ambiguities: string[];
  confidence: number;
}

export interface CoachingSessionState {
  mode: CoachingMode;
  strategyVersion: "legacy" | "shadow" | "v2";
  userGoal: string | null;
  currentFocus: string | null;
  unresolvedQuestions: string[];
  constraintsUsed: string[];
  pendingArtifact: "decision" | "action_plan" | null;
  correctionCount: number;
  previousFocus: string | null;
  updatedAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  kind?: "message" | "correction";
}

interface AnalyzeTurnParams {
  messages: ChatMessage[];
  previousState?: CoachingSessionState | null;
  correctionSignal?: CoachingCorrectionSignal | null;
}

const JD_MARKERS =
  /\[JOB_DESCRIPTION\]|job description|this jd|\bjd\b|this role|this position|vacancy|hiring requirements|responsibilities|qualifications|职位描述|岗位描述|这个职位|这个岗位|岗位职责|招聘要求/i;
const DECISION_MARKERS =
  /should i|do i accept|which (one|option|role|path|career)|choose between|help me decid|recommend(?:ation)?|better bet|strongest|would you choose|accept the promotion|compare .+ (and|or) tell me|offer or|要不要|该不该|选哪个|怎么选|帮我决定|推荐|哪一个|哪个职业|比较.+告诉我|接受.*升职|管理还是/i;
const ACTION_MARKERS =
  /action plan|next[- ]step|roadmap|\bplan\b|plan for|plan how|execution plan|concrete action|smallest experiment|how do i start|what should i do next|行动计划|下一步|怎么开始|具体行动|具体计划|计划|路线图|规划|方案|实验|落地|执行/i;
const SUPPORT_MARKERS =
  /burn(?:ed|t)? out|overwhelm|anxious|afraid|scared|exhausted|hopeless|stressed|pressure|stuck and ashamed|too tired|heavy and frightening|焦虑|害怕|压力|崩溃|迷茫|倦怠|太累|难受|撑不住|无助|羞愧/i;
const LISTEN_MARKERS =
  /just listen|need to vent|don't analyze|do not analyze|先听我说|别分析|不需要建议|只是想说说|想倾诉/i;
const INFORMATION_MARKERS =
  /what is|how does|tell me about|information|salary|visa|requirements|是什么|有什么|介绍一下|信息|薪资|签证|要求/i;
const DIRECT_MARKERS =
  /be direct|give me (your )?(answer|recommendation)|stop asking|tell me what to do|直接一点|别再问|给我建议|告诉我怎么做|给个结论/i;
const CORRECTION_MARKERS =
  /that's not (what|my point)|you misunderstood|missed my point|not what i mean|i already said|答非所问|没理解|理解偏了|不是我的重点|我说的不是|我已经说过/i;
const CONSTRAINT_MARKERS: Array<[RegExp, string]> = [
  [/visa|sponsor|immigration|签证|工签|担保/i, "visa"],
  [/salary|income|money|financial|budget|薪资|收入|经济|预算|钱/i, "financial"],
  [/family|partner|parent|child|spouse|家人|伴侣|父母|孩子|家庭/i, "family"],
  [
    /location|city|country|relocat|remote|地点|城市|国家|搬家|远程/i,
    "location",
  ],
  [/time|deadline|hours|schedule|时间|期限|工时|日程/i, "time"],
  [/experience|skill|degree|education|经验|技能|学历|专业/i, "qualification"],
];

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  return normalizeText(text)
    .split(/(?<=[。！？!?])\s*|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function latestUserTurn(messages: ChatMessage[]): ChatMessage | null {
  return (
    [...messages].reverse().find((message) => message.role === "user") ?? null
  );
}

function desiredHelpForMode(mode: CoachingMode): DesiredHelp {
  if (mode === "act") return "plan";
  if (mode === "decide") return "recommend";
  if (mode === "job_analysis") return "analyze";
  if (mode === "support") return "listen";
  return "analyze";
}

function extractCoreQuestion(text: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return "";

  const explicit = [...sentences]
    .reverse()
    .find(
      (sentence) =>
        /[?？]/.test(sentence) ||
        DECISION_MARKERS.test(sentence) ||
        ACTION_MARKERS.test(sentence) ||
        DIRECT_MARKERS.test(sentence),
    );
  return normalizeText(explicit ?? sentences[sentences.length - 1]).slice(
    0,
    280,
  );
}

function inferDesiredHelp(text: string): DesiredHelp {
  if (JD_MARKERS.test(text)) {
    return /^\s*\[JOB_DESCRIPTION\]/i.test(text) ? "information" : "analyze";
  }
  if (LISTEN_MARKERS.test(text)) return "listen";
  if (ACTION_MARKERS.test(text)) return "plan";
  if (DIRECT_MARKERS.test(text) || DECISION_MARKERS.test(text)) {
    return "recommend";
  }
  if (INFORMATION_MARKERS.test(text)) return "information";
  return "analyze";
}

function inferMode(text: string, desiredHelp: DesiredHelp): CoachingMode {
  if (JD_MARKERS.test(text)) return "job_analysis";
  if (desiredHelp === "listen") return "support";
  if (desiredHelp === "plan") return "act";
  if (desiredHelp === "recommend" || DECISION_MARKERS.test(text)) {
    return "decide";
  }
  if (
    SUPPORT_MARKERS.test(text) &&
    !/why|understand|explore|为什么|理解|探索/i.test(text)
  ) {
    return "support";
  }
  return "explore";
}

function collectConstraints(text: string): string[] {
  return CONSTRAINT_MARKERS.filter(([pattern]) => pattern.test(text)).map(
    ([, label]) => label,
  );
}

function collectImportantFacts(text: string, coreQuestion: string): string[] {
  return splitSentences(text)
    .filter((sentence) => sentence !== coreQuestion)
    .filter((sentence) => sentence.length >= 8)
    .slice(-4)
    .map((sentence) => sentence.slice(0, 220));
}

function calculateConfidence(params: {
  text: string;
  coreQuestion: string;
  desiredHelp: DesiredHelp;
  correctionSignal?: CoachingCorrectionSignal | null;
}): number {
  const { text, coreQuestion, desiredHelp, correctionSignal } = params;
  let score = 0.52;
  if (/[?？]/.test(text)) score += 0.12;
  if (
    DECISION_MARKERS.test(text) ||
    ACTION_MARKERS.test(text) ||
    LISTEN_MARKERS.test(text) ||
    DIRECT_MARKERS.test(text) ||
    JD_MARKERS.test(text)
  ) {
    score += 0.18;
  }
  if (coreQuestion.length >= 12) score += 0.08;
  if (desiredHelp !== "analyze") score += 0.05;
  if (correctionSignal) score += 0.05;
  if (text.length < 8) score -= 0.25;
  if (/^(这个|那个|怎么办|help|why|怎么说|不知道)[。.!?？]*$/i.test(text)) {
    score -= 0.2;
  }
  return Math.max(0.2, Math.min(0.98, Number(score.toFixed(2))));
}

function correctionInstruction(
  signal: CoachingCorrectionSignal | null | undefined,
  text: string,
): boolean {
  return Boolean(signal || CORRECTION_MARKERS.test(text));
}

export function createInitialCoachingSessionState(): CoachingSessionState {
  return {
    mode: "explore",
    strategyVersion: "shadow",
    userGoal: null,
    currentFocus: null,
    unresolvedQuestions: [],
    constraintsUsed: [],
    pendingArtifact: null,
    correctionCount: 0,
    previousFocus: null,
    updatedAt: new Date(0).toISOString(),
  };
}

export function analyzeCoachingTurn({
  messages,
  previousState,
  correctionSignal,
}: AnalyzeTurnParams): {
  understanding: TurnUnderstanding;
  state: CoachingSessionState;
  needsRepair: boolean;
} {
  const previous = previousState ?? createInitialCoachingSessionState();
  const latestTurn = latestUserTurn(messages);
  const text = normalizeText(latestTurn?.content ?? "");
  const isCorrectionTurn = Boolean(
    correctionSignal || latestTurn?.kind === "correction",
  );
  const inferredHelp = inferDesiredHelp(text);
  const desiredHelp =
    correctionSignal === "recommend" ||
    (isCorrectionTurn && inferredHelp === "recommend")
      ? "recommend"
      : isCorrectionTurn
        ? desiredHelpForMode(previous.mode)
        : inferredHelp;
  const defaultCoreQuestion = extractCoreQuestion(text);
  const coreQuestion =
    isCorrectionTurn && previous.currentFocus
      ? previous.currentFocus
      : desiredHelp === "listen"
        ? (splitSentences(text).find((sentence) =>
            LISTEN_MARKERS.test(sentence),
          ) ?? defaultCoreQuestion)
        : defaultCoreQuestion;
  const mode =
    correctionSignal === "recommend" ||
    (isCorrectionTurn && inferredHelp === "recommend")
      ? "decide"
      : isCorrectionTurn
        ? previous.mode
        : inferMode(text, desiredHelp);
  const constraints = collectConstraints(text);
  const needsRepair = correctionInstruction(correctionSignal, text);
  const confidence = calculateConfidence({
    text,
    coreQuestion,
    desiredHelp,
    correctionSignal,
  });
  const ambiguities =
    confidence < 0.62
      ? [
          "The user's requested outcome is not specific enough to answer confidently.",
        ]
      : [];
  const primaryIntent =
    coreQuestion ||
    text ||
    previous.currentFocus ||
    "Start a coaching conversation";
  const hasUserInput = text.length > 0;

  const understanding: TurnUnderstanding = {
    primaryIntent,
    coreQuestion: coreQuestion || primaryIntent,
    importantFacts: isCorrectionTurn
      ? []
      : collectImportantFacts(text, coreQuestion),
    constraints,
    desiredHelp,
    ambiguities,
    confidence,
  };

  const unresolvedQuestions = [
    ...previous.unresolvedQuestions.filter(
      (question) => question !== previous.currentFocus,
    ),
    ...(hasUserInput ? [understanding.coreQuestion] : []),
  ]
    .filter(Boolean)
    .slice(-5);

  const state: CoachingSessionState = {
    mode,
    strategyVersion: previous.strategyVersion ?? "shadow",
    userGoal:
      previous.userGoal ?? (hasUserInput ? understanding.coreQuestion : null),
    currentFocus: hasUserInput
      ? understanding.coreQuestion
      : previous.currentFocus,
    previousFocus: needsRepair ? previous.currentFocus : previous.previousFocus,
    unresolvedQuestions,
    constraintsUsed: Array.from(
      new Set([...previous.constraintsUsed, ...constraints]),
    ).slice(-8),
    pendingArtifact:
      mode === "act" ? "action_plan" : mode === "decide" ? "decision" : null,
    correctionCount: needsRepair ? previous.correctionCount + 1 : 0,
    updatedAt: new Date().toISOString(),
  };

  return { understanding, state, needsRepair };
}

function quoteJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function buildAdaptiveTurnInstruction(params: {
  locale: string;
  understanding: TurnUnderstanding;
  state: CoachingSessionState;
  needsRepair: boolean;
  hasRealityConditions: boolean;
  careerKnowledgeVersionDate?: string;
}): string {
  const {
    locale,
    understanding,
    state,
    needsRepair,
    hasRealityConditions,
    careerKnowledgeVersionDate = "2026-06-10",
  } = params;
  const isZh = locale === "zh";
  // When a miss is detected AND our own understanding is low-confidence, the old
  // behavior asserted a (possibly also-wrong) coreQuestion — "I missed your
  // point; your real point is X" where X is just another guess. That makes the
  // user feel even more unheard. Here, stop guessing and ask explicitly.
  const lowConfidenceRepair = needsRepair && understanding.confidence < 0.62;

  const repairLine = !needsRepair
    ? ""
    : lowConfidenceRepair
      ? isZh
        ? `- 先承认没接住对方的点，但不要假装已经知道答案。直接问清楚，例如：「我意识到我刚才没接住你的重点。与其继续猜，我想直接确认——你最在意的是『${understanding.coreQuestion}』，还是别的我没提到的方向？」在用户确认之前，不要给结论或建议。`
        : `- Acknowledge you missed the point, but do not pretend you already know the answer. Ask directly, e.g.: "I realize I didn't catch your main point. Rather than keep guessing, let me check — is what matters most to you “${understanding.coreQuestion}”, or something else I haven't named?" Do not give a conclusion or advice until the user confirms.`
      : isZh
        ? state.previousFocus &&
          state.previousFocus !== understanding.coreQuestion
          ? `- 先明确修复偏航。用自然语言表达：「我刚才把重点放在了${state.previousFocus}，但你真正关心的是${understanding.coreQuestion}。我们回到这个重点。」不要辩解。`
          : `- 先明确修复偏航。用自然语言表达：「我刚才的回应偏离了你的重点。你真正关心的是${understanding.coreQuestion}，我们回到这里。」不要辩解。`
        : state.previousFocus &&
            state.previousFocus !== understanding.coreQuestion
          ? `- Repair the miss before doing anything else. Say naturally: "I put the emphasis on ${state.previousFocus}, but what you actually care about is ${understanding.coreQuestion}. Let's return to that." Do not defend the previous answer.`
          : `- Repair the miss before doing anything else. Say naturally: "My last response drifted from your point. What you actually care about is ${understanding.coreQuestion}. Let's return to that." Do not defend the previous answer.`;

  // Suppress the generic ambiguity line when lowConfidenceRepair already owns
  // the clarify-instead-of-guess instruction (both trigger at confidence<0.62),
  // otherwise the coach gets two overlapping "ask to clarify" directives.
  const ambiguityLine = lowConfidenceRepair
    ? ""
    : understanding.confidence < 0.62
      ? isZh
        ? "- 理解置信度较低：用一句简短复述说明你目前理解的重点，然后只问一个能改变答案的澄清问题。不要给强结论。"
        : "- Understanding confidence is low: briefly state your current read, then ask one clarification that would materially change the answer. Do not give a strong conclusion."
      : isZh
        ? "- 理解置信度足够：直接回应，不要用「所以你的重点是」之类的机械复述拖延答案。"
        : '- Understanding confidence is sufficient: answer directly. Do not delay with a formulaic "So your main point is..." restatement.';

  const modeRules: Record<CoachingMode, { en: string; zh: string }> = {
    explore: {
      en: "Offer one useful observation before asking a question. Explore only what is necessary; do not force a fixed sequence.",
      zh: "先提供一个有用观察，再决定是否提问。只探索回答当前问题所必需的部分，不强行走固定流程。",
    },
    decide: {
      en: "Give a provisional recommendation now. State the basis, the main risk, and what evidence could change the recommendation. The user retains the final decision.",
      zh: "现在就给出暂定建议，说明依据、主要风险，以及什么新证据会改变这个建议。最终决定权仍属于用户。",
    },
    act: {
      en: `Produce a concrete, editable 7-day action draft now. End with this machine-readable marker before QUICK_REPLIES:
<<ACTION_DRAFT>>{"title":"Short plan title","actions":[{"title":"Specific action","description":"How to do it","category":"explore|learn|network|create|apply|reflect","estimatedMinutes":30}]}<</ACTION_DRAFT>>
Use 1-3 actions. Do not claim they were saved; the user must confirm in the UI.`,
      zh: `现在产出一份具体、可编辑的 7 天行动草案。在 QUICK_REPLIES 之前附上以下机器可读标记：
<<ACTION_DRAFT>>{"title":"简短计划标题","actions":[{"title":"具体行动","description":"如何完成","category":"explore|learn|network|create|apply|reflect","estimatedMinutes":30}]}<</ACTION_DRAFT>>
只给 1-3 项行动。不要声称已经保存，必须由用户在界面确认。`,
    },
    support: {
      en: "Acknowledge the specific pressure without generic reassurance. If the user has not said whether they want listening or problem-solving, ask which would help; otherwise follow their stated preference.",
      zh: "具体回应用户承受的压力，不要泛泛安慰。如果用户尚未说明需要倾听还是解决问题，就询问偏好；如果已经说明，直接遵循。",
    },
    job_analysis: {
      en: "Analyze the supplied role against evidence from the user's profile and stated constraints. Separate strong evidence, gaps, and unknowns. Do not invent salary, visa, or market facts.",
      zh: "根据用户画像证据和现实限制分析职位，明确区分匹配证据、差距和未知项。不要编造薪资、签证或市场事实。",
    },
  };

  return isZh
    ? `## 当前轮次理解与路由（最高优先级）

当前模式：${state.mode}
用户真正的问题：${understanding.coreQuestion}
用户希望获得的帮助：${understanding.desiredHelp}
理解置信度：${understanding.confidence}
重要事实：${quoteJson(understanding.importantFacts)}
当前消息中的现实限制：${quoteJson(understanding.constraints)}

规则：
- 用户最新明确诉求优先于入口上下文、画像推断、旧话题和通用教练流程。
- 不要把画像特征强加到当前问题上。只引用与当前问题直接相关、并能解释清楚的证据。
- 现实依据优先级：用户当前陈述 > 现实条件 > 用户提供的简历/JD > 报告与画像 > 精选职业知识（版本日期 ${careerKnowledgeVersionDate}）。薪资、签证、市场变化等动态信息若上下文未提供，必须标为未知，不得编造。
- 回复前自查：每一段是否直接帮助回答「${understanding.coreQuestion}」；无关内容删除。
- ${
        hasRealityConditions
          ? "用户已提供现实条件，建议必须使用相关条件，不要重复询问。"
          : "缺少现实条件时，只在它会实质改变答案时追问。"
      }
${ambiguityLine}
${repairLine}
- 模式行为：${modeRules[state.mode].zh}`
    : `## Current Turn Understanding and Routing (HIGHEST PRIORITY)

Current mode: ${state.mode}
User's actual question: ${understanding.coreQuestion}
Desired help: ${understanding.desiredHelp}
Understanding confidence: ${understanding.confidence}
Important facts: ${quoteJson(understanding.importantFacts)}
Constraints in the current message: ${quoteJson(understanding.constraints)}

Rules:
- The user's latest explicit request outranks entry context, profile inference, old topics, and generic coaching flow.
- Do not force profile traits onto the current problem. Cite only relevant evidence you can explain.
- Evidence priority: current user statement > reality conditions > user-provided resume/JD > report and profile > curated career knowledge (version ${careerKnowledgeVersionDate}). Treat dynamic salary, visa, and market facts as unknown unless supplied; never invent them.
- Before responding, check that every paragraph directly helps answer "${understanding.coreQuestion}". Remove anything that does not.
- ${
        hasRealityConditions
          ? "The user has supplied real-world conditions. Use relevant conditions and do not ask for them again."
          : "Ask about a missing real-world condition only when it would materially change the answer."
      }
${ambiguityLine}
${repairLine}
- Mode behavior: ${modeRules[state.mode].en}`;
}
