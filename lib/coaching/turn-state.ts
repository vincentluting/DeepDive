// ============================================================
// Coaching turn state — lightweight, deterministic conversation state
//
// This is not a user-facing summary. It is a compact working note for the
// coach prompt so each turn can bridge from what the user just said to the
// next best move without feeling abrupt.
// ============================================================

export type CoachingPhase =
  | "discovery"
  | "pattern_surfacing"
  | "tension_naming"
  | "synthesis"
  | "action";

export interface CoachingTurnState {
  currentPhase: CoachingPhase;
  knownFacts: string[];
  emotionalSignals: string[];
  coreConcern: string | null;
  confirmedPatterns: string[];
  unconfirmedHypotheses: string[];
  lastCoachQuestion: string | null;
  userAnsweredLastQuestion: boolean;
  nextBestMove: string;
  evidenceQuote: string | null;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_ITEMS = 4;

const EMOTION_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "confused", pattern: /confus|uncertain|lost|迷茫|困惑|不确定|纠结/i },
  { label: "stuck", pattern: /stuck|blocked|停滞|卡住|困住|走不动/i },
  { label: "anxious", pattern: /anxious|worr|fear|scared|焦虑|担心|害怕|恐惧/i },
  { label: "surprised", pattern: /surpris|unexpected|意外|惊讶|没想到/i },
  { label: "resistant", pattern: /doesn't fit|off|wrong|不准|不对|不太像|不认可/i },
  { label: "burned_out", pattern: /burn.?out|exhaust|tired|倦怠|耗竭|累/i },
  { label: "curious", pattern: /curious|want to explore|想了解|想探索|好奇/i },
];

const CONFIRMATION_PATTERN =
  /\b(yes|yeah|right|exactly|true|that's me|makes sense)\b|对|没错|是的|确实|很准|就是我/i;

const EVASIVE_PATTERN =
  /\b(i don't know|not sure|maybe|idk)\b|不知道|不确定|说不清|可能吧/i;

function compact(text: string, max = 160): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function recentUserMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) => m.role === "user").slice(-6);
}

function latestMessage(
  messages: ChatMessage[],
  role: ChatMessage["role"],
): ChatMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === role) return messages[i];
  }
  return null;
}

function extractLastQuestion(text: string): string | null {
  const pieces = text
    .split(/(?<=[?？])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const question = [...pieces].reverse().find((p) => /[?？]\s*$/.test(p));
  return question ? compact(question, 180) : null;
}

function inferPhase(userCount: number, lastUserText: string): CoachingPhase {
  if (userCount <= 1) return "discovery";
  if (CONFIRMATION_PATTERN.test(lastUserText) && userCount >= 5) {
    return "action";
  }
  if (userCount >= 6) return "synthesis";
  if (userCount >= 4) return "tension_naming";
  return "pattern_surfacing";
}

function extractKnownFacts(userMessages: ChatMessage[]): string[] {
  const facts: string[] = [];
  for (const message of userMessages) {
    const text = compact(message.content, 220);
    if (!text) continue;
    if (
      /\b(i am|i'm|i have|i want|i feel|my|currently|recently)\b/i.test(text) ||
      /我|我的|现在|最近|想|感觉|担心|目前/.test(text)
    ) {
      facts.push(text);
    }
  }
  return facts.slice(-MAX_ITEMS);
}

function extractEmotionalSignals(text: string): string[] {
  const signals = EMOTION_PATTERNS.filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label)
    .slice(0, MAX_ITEMS);
  return [...new Set(signals)];
}

function inferCoreConcern(lastUserText: string): string | null {
  const text = compact(lastUserText, 180);
  if (!text) return null;
  if (/offer|job description|JD|职位|offer|岗位/i.test(text)) {
    return "evaluating a concrete role or offer";
  }
  if (/switch|transition|转行|换方向|换工作|离职|辞职/i.test(text)) {
    return "career transition uncertainty";
  }
  if (/ai|automation|replace|自动化|替代|取代/i.test(text)) {
    return "AI-era career anxiety";
  }
  if (/stuck|迷茫|困惑|卡住|不知道/i.test(text)) {
    return "lack of career clarity";
  }
  return text;
}

function inferConfirmedPatterns(userMessages: ChatMessage[]): string[] {
  return userMessages
    .filter((m) => CONFIRMATION_PATTERN.test(m.content))
    .map((m) => compact(m.content, 140))
    .slice(-2);
}

function inferHypotheses(state: {
  currentPhase: CoachingPhase;
  coreConcern: string | null;
  emotionalSignals: string[];
}): string[] {
  const hypotheses: string[] = [];
  if (state.coreConcern) {
    hypotheses.push(`The live issue may be ${state.coreConcern}.`);
  }
  if (state.emotionalSignals.includes("resistant")) {
    hypotheses.push("The user may be pushing back on the report, not asking for advice yet.");
  }
  if (state.emotionalSignals.includes("stuck")) {
    hypotheses.push("The user may need the hidden tension named before action planning.");
  }
  if (state.currentPhase === "action") {
    hypotheses.push("Action is appropriate only if the user confirmed the pattern.");
  }
  return hypotheses.slice(0, MAX_ITEMS);
}

function nextBestMoveFor(phase: CoachingPhase, answered: boolean): string {
  if (!answered) {
    return "Reconnect to the last question before introducing a new direction.";
  }
  switch (phase) {
    case "discovery":
      return "Listen for the user's real concern and ask one precise clarifying question.";
    case "pattern_surfacing":
      return "Reflect one pattern using the user's own words, then ask what it connects to.";
    case "tension_naming":
      return "Name the likely tension gently and invite the user to test whether it fits.";
    case "synthesis":
      return "Offer a tentative synthesis and ask for confirmation before any advice.";
    case "action":
      return "Co-create one tiny next step grounded in a pattern the user confirmed.";
  }
}

export function buildCoachingTurnState(
  messages: ChatMessage[],
): CoachingTurnState {
  const users = recentUserMessages(messages);
  const lastUser = latestMessage(messages, "user");
  const lastAssistant = latestMessage(messages, "assistant");
  const lastUserText = lastUser?.content ?? "";
  const lastQuestion = lastAssistant
    ? extractLastQuestion(lastAssistant.content)
    : null;
  const userAnsweredLastQuestion =
    !lastQuestion || (!!lastUserText && !EVASIVE_PATTERN.test(lastUserText));
  const currentPhase = inferPhase(users.length, lastUserText);
  const emotionalSignals = extractEmotionalSignals(lastUserText);
  const coreConcern = inferCoreConcern(lastUserText);

  const partial = { currentPhase, coreConcern, emotionalSignals };

  return {
    currentPhase,
    knownFacts: extractKnownFacts(users),
    emotionalSignals,
    coreConcern,
    confirmedPatterns: inferConfirmedPatterns(users),
    unconfirmedHypotheses: inferHypotheses(partial),
    lastCoachQuestion: lastQuestion,
    userAnsweredLastQuestion,
    nextBestMove: nextBestMoveFor(currentPhase, userAnsweredLastQuestion),
    evidenceQuote: lastUserText ? compact(lastUserText, 180) : null,
  };
}

export function buildCoachingTurnStatePrompt(
  state: CoachingTurnState,
  locale: string,
): string {
  const isZh = locale === "zh";
  const emptyByLocale: Record<string, string> = {
    en: "none",
    zh: "\u65e0",
  };
  const empty = emptyByLocale[locale] ?? emptyByLocale.en;
  const list = (items: string[]) => (items.length ? items.join(" | ") : empty);

  if (isZh) {
    return `## 本轮教练工作台状态（内部使用，不要逐字展示）
- currentPhase: ${state.currentPhase}
- knownFacts: ${list(state.knownFacts)}
- emotionalSignals: ${list(state.emotionalSignals)}
- coreConcern: ${state.coreConcern ?? empty}
- confirmedPatterns: ${list(state.confirmedPatterns)}
- unconfirmedHypotheses: ${list(state.unconfirmedHypotheses)}
- lastCoachQuestion: ${state.lastCoachQuestion ?? empty}
- userAnsweredLastQuestion: ${state.userAnsweredLastQuestion ? "true" : "false"}
- evidenceQuote: ${state.evidenceQuote ?? empty}
- nextBestMove: ${state.nextBestMove}

使用方式：把 evidenceQuote 作为回应锚点；如果 hypothesis 未确认，只能以试探方式提出；推进前必须写出一句自然过渡。`;
  }

  return `## Coaching Turn State (internal, do not display verbatim)
- currentPhase: ${state.currentPhase}
- knownFacts: ${list(state.knownFacts)}
- emotionalSignals: ${list(state.emotionalSignals)}
- coreConcern: ${state.coreConcern ?? empty}
- confirmedPatterns: ${list(state.confirmedPatterns)}
- unconfirmedHypotheses: ${list(state.unconfirmedHypotheses)}
- lastCoachQuestion: ${state.lastCoachQuestion ?? empty}
- userAnsweredLastQuestion: ${state.userAnsweredLastQuestion ? "true" : "false"}
- evidenceQuote: ${state.evidenceQuote ?? empty}
- nextBestMove: ${state.nextBestMove}

How to use this: anchor the reply in evidenceQuote; treat unconfirmed hypotheses as tentative; include a natural bridge sentence before moving forward.`;
}
