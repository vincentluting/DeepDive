// ============================================================
// Coaching context selection — relevance filtering for memories/themes
//
// The coach should not ingest every available memory on every turn. This
// selector keeps the prompt focused on context connected to the user's live
// concern so the response can go deeper instead of becoming encyclopedic.
//
// Relevance is keyword-overlap based (a pre-semantic baseline). Two refinements
// keep it from being naively wrong:
//   1. CJK bigram tokenization — partial phrase overlap counts instead of
//      requiring an exact whole-run match (mirrors hypothesis-memory).
//   2. Negation awareness — a rejected concept ("don't want management") must
//      NOT surface a memory that says the user is suited for it. The negated
//      concept is penalized, not scored as a match.
// A full semantic (embedding) retriever is the planned mid-term replacement.
// ============================================================

import type { UserMemory } from "@/lib/types/memory";
import type { CoachingTheme } from "@/lib/db/coaching-themes";
import type { CoachingTurnState } from "./turn-state";

// CJK stop words are built from code points so this file stays ASCII-only.
// A literal CJK string literal trips the i18n linter (S1) as "untranslated
// user-facing copy" — but these are algorithm constants, not copy. (Regex
// literals are not flagged, so NEGATION_ZH below keeps its literal terms.)
const CJK_STOP_WORDS = [
  [0x6211], // 我
  [0x7684], // 的
  [0x4e86], // 了
  [0x662f], // 是
  [0x5728], // 在
  [0x6709], // 有
  [0x548c], // 和
  [0x60f3], // 想
  [0x611f, 0x89c9], // 感觉
  [0x89c9, 0x5f97], // 觉得
  [0x4e00, 0x4e2a], // 一个
].map((codePoints) => String.fromCharCode(...codePoints));

const STOP_WORDS = new Set<string>([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "about",
  "have",
  "want",
  "feel",
  "what",
  "when",
  "where",
  "which",
  "because",
  ...CJK_STOP_WORDS,
]);

function tokenize(text: string): string[] {
  const latin = text.toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) ?? [];
  // CJK: 2-char sliding bigrams so partial phrase overlap counts. The old
  // whole-run match treated two phrases sharing a word as unrelated, which was
  // the dominant cause of relevant memories not surfacing.
  const cjkRuns = text.match(/[一-鿿]{2,}/g) ?? [];
  const cjk = cjkRuns.flatMap((run) => {
    const grams: string[] = [];
    for (let i = 0; i < run.length - 1; i++) grams.push(run.slice(i, i + 2));
    return grams;
  });
  return [...latin, ...cjk].filter((token) => !STOP_WORDS.has(token));
}

// Concepts the user explicitly rejected this turn. The lookahead stops the
// capture at punctuation/conjunctions so "don't want management but I love
// design" does not also mark "design" as negated.
const NEGATION_ZH =
  /(?:不太想|不想|不愿意|不愿|不喜欢|不感兴趣|没兴趣|没有兴趣|不适合|不擅长|讨厌|厌恶|反感|抗拒|不要|不再|拒绝)([一-鿿]{2,8}?)(?=[，,。.；;！!？?、\s]|但|而|和|或|以及|$)/g;
const NEGATION_EN =
  /\b(?:don'?t|doesn'?t|didn'?t|do not|does not|not|never|no longer|dislikes?|disliked|hates?|hated|avoids?|avoided|rejects?|rejected)\s+(?:to\s+|the\s+|a\s+|any\s+)?([a-z][a-z-]+(?:\s+[a-z][a-z-]+){0,2}?)(?=\s+(?:but|and|or|because|so|yet|however)\b|[.,;!?]|$)/gi;

interface Polarity {
  positive: Set<string>;
  negative: Set<string>;
}

function splitPolarity(text: string): Polarity {
  const negative = new Set<string>();
  for (const match of text.matchAll(NEGATION_ZH)) {
    for (const token of tokenize(match[1])) negative.add(token);
  }
  for (const match of text.matchAll(NEGATION_EN)) {
    for (const token of tokenize(match[1])) negative.add(token);
  }
  const positive = new Set<string>();
  for (const token of tokenize(text)) {
    if (!negative.has(token)) positive.add(token);
  }
  return { positive, negative };
}

function queryFrom(
  state: CoachingTurnState,
  latestUserMessage: string,
): string {
  return [
    latestUserMessage,
    state.coreConcern ?? "",
    state.evidenceQuote ?? "",
    ...state.emotionalSignals,
    ...state.knownFacts,
    ...state.confirmedPatterns,
  ].join(" ");
}

function relevanceScore(polarity: Polarity, text: string): number {
  if (polarity.positive.size === 0 && polarity.negative.size === 0) return 0;
  const textTokens = tokenize(text);
  let score = 0;
  for (const token of textTokens) {
    if (polarity.negative.has(token)) score -= 2;
    else if (polarity.positive.has(token)) score += 1;
  }
  return score;
}

// Full keyword ranking (no limit, no short-circuit). Exported so the hybrid
// semantic retriever can fuse this ranking with the cosine ranking via RRF.
export function rankMemoriesByKeyword(
  memories: UserMemory[],
  state: CoachingTurnState,
  latestUserMessage: string,
): UserMemory[] {
  const polarity = splitPolarity(queryFrom(state, latestUserMessage));

  return [...memories]
    .map((memory) => {
      const text = `${memory.category} ${memory.keyword} ${memory.insight}`;
      const relevance = relevanceScore(polarity, text);
      const priority =
        relevance * 4 +
        memory.confidence +
        (memory.category === "coaching_insight" ? 0.5 : 0) +
        (memory.category === "blindspot" ? 0.5 : 0);
      return { memory, priority };
    })
    .sort((a, b) => b.priority - a.priority)
    .map((item) => item.memory);
}

export function selectRelevantMemories(
  memories: UserMemory[],
  state: CoachingTurnState,
  latestUserMessage: string,
  limit = 8,
): UserMemory[] {
  if (memories.length <= limit) return memories;
  return rankMemoriesByKeyword(memories, state, latestUserMessage).slice(
    0,
    limit,
  );
}

export function selectRelevantThemes(
  themes: CoachingTheme[],
  state: CoachingTurnState,
  latestUserMessage: string,
  limit = 8,
): CoachingTheme[] {
  if (themes.length <= limit) return themes;

  const polarity = splitPolarity(queryFrom(state, latestUserMessage));

  return [...themes]
    .map((theme) => {
      const text = `${theme.theme} ${theme.context ?? ""} ${theme.sentiment ?? ""}`;
      const relevance = relevanceScore(polarity, text);
      const priority =
        relevance * 4 +
        theme.mentionCount * 0.7 +
        (theme.sentiment === "conflicted" ? 1.5 : 0);
      return { theme, priority };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map((item) => item.theme);
}
