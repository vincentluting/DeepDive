// ============================================================
// AI-era anxiety detection — client-side keyword + LLM marker
// helpers used by components/features/coaching-chat.tsx.
//
// Two surfaces:
//   - Keyword scan over the user's outgoing message (immediate yellow card)
//   - Marker extraction from the LLM response stream (LLM-classified yellow)
//
// Mutually exclusive with the standard CRISIS_KEYWORDS path (red card).
// Per the prompt-side ESCALATION SIGNALS contract, the LLM never emits
// <<ANXIETY_ESCALATION>> together with <<CRISIS_ALERT>>; the chat surface
// also enforces "crisis trumps anxiety" so a single user turn cannot fire
// both cards.
// ============================================================

/**
 * Two-locale keyword bank used to surface the yellow anxiety card before
 * the LLM has a chance to reply. English matches case-insensitively;
 * Chinese matches by exact substring. Shape is intentionally `{ en, zh }`
 * (data-table style) so i18n-purity-check treats this as a data block
 * rather than hardcoded UI text.
 */
export const AI_ANXIETY_ESCALATION_KEYWORDS: { en: string[]; zh: string[] } = {
  en: [
    "useless human",
    "obsolete",
    "useless class",
    "no point learning",
    "ai is smarter than me",
    "my career is over",
    "can't compete with ai",
    "replaced by ai",
  ],
  zh: [
    "我废了",
    "学什么都赶不上",
    "再努力也没用",
    "我这种人就该被淘汰",
    "未来没我位置",
    "成了无用阶级",
    "读书白读了",
  ],
};

/**
 * Returns true when the message contains an AI-replacement-despair keyword
 * (in English or Chinese). Case-insensitive for English; exact substring for
 * Chinese. Does NOT inspect for self-harm — caller must run that check first
 * and prefer the crisis path when both signals fire.
 */
export function detectAiAnxietySignal(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    AI_ANXIETY_ESCALATION_KEYWORDS.en.some((k) => lower.includes(k)) ||
    AI_ANXIETY_ESCALATION_KEYWORDS.zh.some((k) => text.includes(k))
  );
}

/**
 * Strips the trailing <<ANXIETY_ESCALATION>> marker from an LLM response and
 * reports whether it was present. Marker must be the very last non-whitespace
 * content of the message (matches the prompt contract in build-system-prompt).
 */
export function extractAnxietyEscalation(text: string): {
  clean: string;
  isAnxietyEscalation: boolean;
} {
  const match = text.match(/<<ANXIETY_ESCALATION>>\s*$/);
  if (!match) return { clean: text, isAnxietyEscalation: false };
  return {
    clean: text.slice(0, match.index).trimEnd(),
    isAnxietyEscalation: true,
  };
}
