// ============================================================
// Coaching Entry Context — shared types for "enter coaching from a
// specific report section" flow.
//
// The report's ChapterCard components write a CoachingEntryContext
// into URL params → the coaching page reads it → converts to a
// human-readable triggerContext string → ships to the existing
// /api/coaching-chat `triggerContext` field (no API shape change).
// ============================================================

export const REPORT_SECTION_IDS = [
  "career-anchor",
  "drain",
  "letter",
  "methodology",
  "realistic",
  "ai-era",
] as const;

export type ReportSectionId = (typeof REPORT_SECTION_IDS)[number];

export function isReportSectionId(v: unknown): v is ReportSectionId {
  return (
    typeof v === "string" &&
    (REPORT_SECTION_IDS as readonly string[]).includes(v)
  );
}

export interface CoachingEntryContext {
  enteredFrom?: ReportSectionId;
  /** Concrete concept to focus on (e.g. archetype label, drain direction). */
  focusConcept?: string;
  /**
   * Optional intent hint — used by build-system-prompt.ts to switch on
   * specialized Socratic protocols. `ai_anxiety` triggers the doomsday-
   * reframing flow. Other values are reserved for future micro-agent
   * routing and are currently informational only.
   */
  userIntent?: "explore" | "decide" | "prepare" | "ai_anxiety";
}

// ── Section labels (en/zh only — site supports en+zh) ──
const SECTION_LABELS: Record<ReportSectionId, { en: string; zh: string }> = {
  "career-anchor": { en: "Career Anchor", zh: "职业锚" },
  drain: { en: "Career Drain", zh: "职业排水" },
  letter: { en: "Letter to You", zh: "给你的信" },
  methodology: { en: "Methodology", zh: "方法论" },
  realistic: { en: "Realistic Pathway", zh: "现实路径" },
  "ai-era": { en: "AI Era Anxiety", zh: "AI 时代焦虑" },
};

/**
 * Localized human-readable label for a section, used in entry badges + trigger context.
 * Falls back to English for locales other than `zh`.
 */
export function sectionLabel(id: ReportSectionId, locale: string): string {
  const entry = SECTION_LABELS[id];
  return locale === "zh" ? entry.zh : entry.en;
}

/**
 * Convert a structured CoachingEntryContext into the plain-string
 * `triggerContext` the existing /api/coaching-chat endpoint + prompt
 * builder already understand. Kept ≤ 200 chars (matches Zod schema cap).
 *
 * The returned string is consumed by buildFirstRoundInstruction and
 * becomes a Socratic-mode phaseHint — the coach opens Phase 1 with
 * a question grounded in that chapter.
 */
export function buildTriggerContext(
  ctx: CoachingEntryContext,
  locale: string,
): string | null {
  if (!ctx.enteredFrom) return null;
  const label = sectionLabel(ctx.enteredFrom, locale);
  const focus = ctx.focusConcept?.trim();

  if (locale === "zh") {
    const base = `来自「${label}」章节`;
    return focus ? `${base}，想深入探索「${focus}」`.slice(0, 200) : base;
  }
  const base = `From the ${label} chapter`;
  return focus ? `${base}, wants to explore "${focus}"`.slice(0, 200) : base;
}

/**
 * Marker strings emitted by buildTriggerContext when the entry context
 * signals AI-era anxiety. Co-located with sectionLabel() so trigger
 * detection stays in sync with what gets emitted into prompt context.
 */
const AI_ANXIETY_MARKERS = { en: "AI Era Anxiety", zh: "AI 时代焦虑" };

/**
 * Returns true when the trigger context (or raw entry context) signals the
 * AI-era anxiety reframing flow. Consumed by build-system-prompt.ts to
 * conditionally inject the doomsday-reframing Socratic protocol.
 */
export function isAiAnxietyTrigger(
  triggerContextOrEntry: string | CoachingEntryContext | null | undefined,
): boolean {
  if (!triggerContextOrEntry) return false;
  if (typeof triggerContextOrEntry === "string") {
    return (
      triggerContextOrEntry.includes(AI_ANXIETY_MARKERS.en) ||
      triggerContextOrEntry.includes(AI_ANXIETY_MARKERS.zh)
    );
  }
  return (
    triggerContextOrEntry.enteredFrom === "ai-era" ||
    triggerContextOrEntry.userIntent === "ai_anxiety"
  );
}
