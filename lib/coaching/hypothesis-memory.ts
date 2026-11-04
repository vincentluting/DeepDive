// ============================================================
// Coaching hypothesis memory — prompt-safe long-term hypotheses
//
// Active hypotheses are not facts. They are tentative working reads that the
// coach may test with the user. Only confirmed hypotheses can be phrased as
// established user patterns.
// ============================================================

export type CoachingHypothesisStatus =
  | "active"
  | "confirmed"
  | "rejected"
  | "stale";

export interface CoachingHypothesisForPrompt {
  id: string;
  hypothesis: string;
  evidence: string[];
  counterEvidence: string[];
  confidence: number;
  status: CoachingHypothesisStatus;
  lastValidatedAt: string | null;
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "this",
  "that",
  "with",
  "user",
  "\u6211",
  "\u7684",
  "\u4e86",
  "\u662f",
  "\u5728",
  "\u4f1a",
  "\u5148",
  "\u7528\u6237",
]);

function tokenize(text: string): string[] {
  const latin = text.toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g);
  const cjkPhrases = text.match(/[\u4e00-\u9fff]{2,}/g) ?? [];
  const cjk = cjkPhrases.flatMap((phrase) => {
    const grams: string[] = [];
    for (let i = 0; i < phrase.length - 1; i++) {
      grams.push(phrase.slice(i, i + 2));
    }
    return grams;
  });
  return [...(latin ?? []), ...cjk].filter(
    (token) => !STOP_WORDS.has(token),
  );
}

function relevance(queryTokens: Set<string>, hypothesis: string): number {
  if (queryTokens.size === 0) return 0;
  return tokenize(hypothesis).reduce(
    (score, token) => score + (queryTokens.has(token) ? 1 : 0),
    0,
  );
}

export function selectRelevantHypotheses(
  hypotheses: CoachingHypothesisForPrompt[],
  latestUserMessage: string,
  limit = 3,
): CoachingHypothesisForPrompt[] {
  const queryTokens = new Set(tokenize(latestUserMessage));
  return hypotheses
    .filter((item) => item.status !== "rejected" && item.status !== "stale")
    .map((item) => {
      const text = [
        item.hypothesis,
        ...item.evidence,
        ...item.counterEvidence,
      ].join(" ");
      const priority =
        relevance(queryTokens, text) * 4 +
        item.confidence +
        (item.status === "confirmed" ? 1 : 0) -
        item.counterEvidence.length * 0.3;
      return { item, priority };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, Math.max(0, Math.min(limit, 3)))
    .map(({ item }) => item);
}

function formatEvidence(items: string[], empty: string): string {
  return items.length > 0 ? items.join(" | ") : empty;
}

const EMPTY_EVIDENCE_COPY = {
  zh: "\u65e0",
  en: "none",
} as const;

export function buildHypothesisContextSection(
  hypotheses: CoachingHypothesisForPrompt[],
  locale: string,
): string {
  if (hypotheses.length === 0) return "";

  const selected = hypotheses.slice(0, 3);
  const empty =
    locale === "zh" ? EMPTY_EVIDENCE_COPY.zh : EMPTY_EVIDENCE_COPY.en;
  const confirmed = selected.filter((item) => item.status === "confirmed");
  const open = selected.filter((item) => item.status === "active");

  if (locale === "zh") {
    const lines: string[] = [
      "\n## 长期教练假设记忆（内部使用，不要逐字展示）",
    ];
    if (open.length > 0) {
      lines.push(
        "规则：active 假设不能当作事实，只能说“我有个试探性理解”；用户确认后才可当作已确认模式。",
      );
    }
    for (const item of confirmed) {
      lines.push(
        `- 已确认模式: ${item.hypothesis} | evidence: ${formatEvidence(item.evidence, empty)}`,
      );
    }
    for (const item of open) {
      lines.push(
        `- 试探性理解（不能当作事实）: ${item.hypothesis} | evidence: ${formatEvidence(item.evidence, empty)} | counterEvidence: ${formatEvidence(item.counterEvidence, empty)}`,
      );
    }
    return lines.join("\n");
  }

  const lines: string[] = [
    "\n## Long-Term Coaching Hypotheses (internal, do not display verbatim)",
  ];
  if (open.length > 0) {
    lines.push(
      'Rule: active hypotheses are not facts. Phrase them as "a tentative read" until the user confirms them.',
    );
  }
  for (const item of confirmed) {
    lines.push(
      `- Confirmed pattern: ${item.hypothesis} | evidence: ${formatEvidence(item.evidence, empty)}`,
    );
  }
  for (const item of open) {
    lines.push(
      `- Tentative hypothesis (not fact): ${item.hypothesis} | evidence: ${formatEvidence(item.evidence, empty)} | counterEvidence: ${formatEvidence(item.counterEvidence, empty)}`,
    );
  }
  return lines.join("\n");
}
