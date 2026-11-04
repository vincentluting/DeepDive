// ============================================================
// Questionnaire Store Utilities — Pure functions & types
// Extracted from questionnaire-store.ts for single-responsibility
// ============================================================

import type { AnswerValue, ZoneTimeline } from "@/lib/types";
import {
  DDVQ21_ITEMS,
  MODULE_INFO,
  TOTAL_QUESTIONS,
  MICRO_INSIGHT_TRIGGERS,
  IPIP_60_PRESENTATION_ORDER,
  IPIP_60_ITEM_DOMAIN_MAP,
  ZONE_CONFIG,
  getZoneForModule,
} from "@/lib/questionnaire";
export { MODULE_DEPTH_COLORS } from "@/lib/questionnaire";

// ── Types ────────────────────────────────────────────────────

export type ModuleCode = "A" | "B" | "C";
export type TextTheme = "dark" | "light";

export interface ModulePhaseInfo {
  module: ModuleCode;
  name_en: string;
  name_zh: string;
  questionCount: number;
  estimatedMinutes: number;
}

export interface QuestionInfo {
  index: number;
  module: ModuleCode;
  itemId: number;
  chapter?: number;
}

export interface QuestionnaireSessionV2 {
  id: string;
  language: "en" | "zh";
  includeRIASEC: boolean;
  answers: Array<{
    questionIndex: number;
    moduleCode: ModuleCode;
    itemId: number;
    value: AnswerValue;
    responseTimeMs: number;
    timestamp: number;
    // Preserved across reconsider-flow rewrites so research analysis can use first-response time.
    firstResponseTimeMs?: number;
    revisionCount?: number;
  }>;
  startedAt: number;
  completedAt?: number;
  totalTimeMs?: number;
  currentQuestionIndex: number;
  moduleStartTimes: Record<"A" | "B" | "C", number | null>;
  triggeredBonusInsights: Set<string>;
  pacePreference: "auto" | "manual";
  zoneTimeline: ZoneTimeline;
}

// ── Constants ────────────────────────────────────────────────

export const MODULES: ModulePhaseInfo[] = [
  { module: "A", ...MODULE_INFO.A },
  { module: "B", ...MODULE_INFO.B },
  { module: "C", ...MODULE_INFO.C },
];

export const MODULE_RANGES: Record<ModuleCode, { start: number; end: number }> =
  {
    A: { start: 0, end: 5 },
    B: { start: 6, end: 25 },
    C: { start: 26, end: 85 },
  };

export { TOTAL_QUESTIONS };

// ── Pure helper functions ────────────────────────────────────

export function getModuleRanges(
  _includeRIASEC?: boolean,
): Record<ModuleCode, { start: number; end: number }> {
  return MODULE_RANGES;
}

export function getTotalQuestions(_includeRIASEC?: boolean): number {
  return TOTAL_QUESTIONS;
}

export function getModuleList(_includeRIASEC?: boolean): ModulePhaseInfo[] {
  return MODULES;
}

export function getQuestionInfo(
  globalIndex: number,
  _includeRIASEC?: boolean,
): QuestionInfo | null {
  const total = TOTAL_QUESTIONS;
  if (globalIndex < 0 || globalIndex >= total) return null;

  if (
    globalIndex >= MODULE_RANGES.A.start &&
    globalIndex <= MODULE_RANGES.A.end
  ) {
    return {
      index: globalIndex,
      module: "A",
      itemId: globalIndex - MODULE_RANGES.A.start + 1,
    };
  }

  if (
    globalIndex >= MODULE_RANGES.B.start &&
    globalIndex <= MODULE_RANGES.B.end
  ) {
    const pvqIndex = globalIndex - MODULE_RANGES.B.start;
    return {
      index: globalIndex,
      module: "B",
      itemId: DDVQ21_ITEMS[pvqIndex].id,
    };
  }

  const ipipPosition = globalIndex - MODULE_RANGES.C.start;
  const itemId = IPIP_60_PRESENTATION_ORDER[ipipPosition];
  return { index: globalIndex, module: "C", itemId };
}

export function getModuleForIndex(
  index: number,
  _includeRIASEC?: boolean,
): ModuleCode {
  if (index >= MODULE_RANGES.A.start && index <= MODULE_RANGES.A.end)
    return "A";
  if (index >= MODULE_RANGES.B.start && index <= MODULE_RANGES.B.end)
    return "B";
  return "C";
}

export function isModuleTransition(
  currentIndex: number,
  _includeRIASEC?: boolean,
): boolean {
  if (currentIndex === MODULE_RANGES.A.end) return true;
  if (currentIndex === MODULE_RANGES.B.end) return true;
  return false;
}

export function isChapterTransition(
  currentIndex: number,
  _includeRIASEC?: boolean,
): boolean {
  // v3.0 IPIP-60: chapter transitions disabled — the midpoint is handled by
  // the afterIPIP_ch2 micro-insight. IPIP_CHAPTERS data is from IPIP-NEO-120
  // and doesn't match v3.0's 60-item structure.
  void currentIndex;
  return false;
}

export function isBreathingMoment(
  currentIndex: number,
  _includeRIASEC?: boolean,
): boolean {
  if (currentIndex < MODULE_RANGES.C.start) return false;
  const positionInModule = currentIndex - MODULE_RANGES.C.start;
  return positionInModule === 14 || positionInModule === 44;
}

export function isMicroInsightTrigger(
  index: number,
  answers: Array<{
    questionIndex: number;
    moduleCode: string;
    itemId: number;
    value: AnswerValue;
    responseTimeMs: number;
  }>,
  triggeredInsights: Set<string>,
  _includeRIASEC?: boolean,
): string | null {
  const ranges = MODULE_RANGES;

  if (index === ranges.A.end && MICRO_INSIGHT_TRIGGERS.afterSJT)
    return "afterSJT";
  if (index === ranges.B.start + 11 && MICRO_INSIGHT_TRIGGERS.afterPVQ_item12)
    return "afterPVQ";
  // v3.0 IPIP-60 midpoint (position 30/60) — maps to afterIPIP_ch2 handler
  // which generates data-driven "halfway pattern" personality insights
  if (index === ranges.C.start + 29) return "afterIPIP_ch2";

  if (index < ranges.C.start) return null;

  if (index === 72 && !triggeredInsights.has("bonusHalfway"))
    return "bonusHalfway";

  if (index % 3 !== 0) return null;

  const ipipAnswers = answers.filter(
    (a) => a.moduleCode === "C" && a.value.type === "ipip",
  );
  if (ipipAnswers.length < 10) return null;

  if (!triggeredInsights.has("bonusStrongSignal")) {
    const domainScores: Record<string, number[]> = {};
    for (const a of ipipAnswers) {
      if (a.value.type !== "ipip") continue;
      const domain = IPIP_60_ITEM_DOMAIN_MAP[a.itemId];
      if (!domain) continue;
      if (!domainScores[domain]) domainScores[domain] = [];
      domainScores[domain].push(a.value.rating);
    }
    for (const scores of Object.values(domainScores)) {
      if (scores.length >= 6) {
        const recentSix = scores.slice(-6);
        if (recentSix.every((s) => s >= 4) || recentSix.every((s) => s <= 2))
          return "bonusStrongSignal";
      }
    }
  }

  if (
    !triggeredInsights.has("bonusInterestingContrast") &&
    ipipAnswers.length >= 20
  ) {
    const domainMeans: Record<string, number> = {};
    const domainCounts: Record<string, number> = {};
    for (const a of ipipAnswers) {
      if (a.value.type !== "ipip") continue;
      const domain = IPIP_60_ITEM_DOMAIN_MAP[a.itemId];
      if (!domain) continue;
      domainMeans[domain] = (domainMeans[domain] || 0) + a.value.rating;
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    }
    const nMean = domainCounts["N"] ? domainMeans["N"] / domainCounts["N"] : 3;
    const eMean = domainCounts["E"] ? domainMeans["E"] / domainCounts["E"] : 3;
    if (Math.abs(nMean - eMean) >= 1.8) return "bonusInterestingContrast";
  }

  if (!triggeredInsights.has("bonusSpeedCheck") && ipipAnswers.length >= 15) {
    const recentFive = ipipAnswers.slice(-5);
    if (recentFive.every((a) => a.responseTimeMs < 2000))
      return "bonusSpeedCheck";
  }

  return null;
}

// ── Zone timeline helpers ────────────────────────────────────

export function createInitialZoneTimeline(): ZoneTimeline {
  const timeline: ZoneTimeline = {};
  for (const zone of ZONE_CONFIG) {
    timeline[zone.id] = {
      startedAt: zone.moduleCode === "A" ? Date.now() : null,
      completedAt: null,
      timeSpentMs: 0,
      discoveries: [],
    };
  }
  return timeline;
}

export function getZoneIdForModule(moduleCode: ModuleCode): string | undefined {
  const zone = getZoneForModule(moduleCode);
  return zone?.id;
}

// ── Session-scoped storage helpers ────────────────────────────
//
// History: until 2026-05-18 these wrote/read localStorage. Psychometric
// answers (Big Five, Schwartz values, SJT scenarios) sitting in localStorage
// indefinitely is a real IRB exposure — anyone with physical access to the
// device, or any XSS, gets the full response set. IRB guidance from UMich /
// UCSF / etc. is explicit: research data on participant devices must either
// be encrypted at rest or session-scoped.
//
// Trade-off considered: encrypting localStorage with AES-GCM would let us
// keep cross-tab continuity, but the key has to live somewhere in the
// browser anyway, which IRB reviewers tend to read as theatre. The simpler,
// more defensible posture is "answers never persist past the tab" — session
// scope is enforced by the browser, not by our crypto.
//
// What still works: server-side `debouncedApiSave` runs every 2s, so the
// canonical copy is in Neon. A user who refreshes / closes-and-returns is
// restored via `/api/session/status` + `restoreFromDbSession`, not the
// browser. What stops working: opening the questionnaire in two tabs
// simultaneously won't see each other's progress until the next API
// roundtrip. Acceptable for the thesis recruitment phase.
//
// Function names kept (`saveToLocalStorage` / `loadFromLocalStorage`) to
// avoid churning 17 call sites; the underlying storage is `sessionStorage`.

const STORAGE_KEY = "deep-dive-questionnaire-session-v2";

function getSessionStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Best-effort cleanup of pre-2026-05-18 localStorage answer dumps.
 * Runs once per page load; idempotent. Keeps device free of stale PII even
 * for users who haven't completed a fresh session since the migration.
 */
function purgeLegacyLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage may be unavailable
  }
}

export function saveToLocalStorage(session: QuestionnaireSessionV2 | null) {
  purgeLegacyLocalStorage();
  const store = getSessionStore();
  if (!store) return;
  try {
    if (session && !session.completedAt) {
      const serializable = {
        ...session,
        triggeredBonusInsights: Array.from(
          session.triggeredBonusInsights || [],
        ),
      };
      store.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } else {
      store.removeItem(STORAGE_KEY);
    }
  } catch {
    // sessionStorage may be unavailable (private mode quota, etc.)
  }
}

export function loadFromLocalStorage(): QuestionnaireSessionV2 | null {
  purgeLegacyLocalStorage();
  const store = getSessionStore();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session: QuestionnaireSessionV2 = {
      ...parsed,
      includeRIASEC: false,
      triggeredBonusInsights: new Set(parsed.triggeredBonusInsights || []),
      pacePreference: parsed.pacePreference || "auto",
      zoneTimeline: parsed.zoneTimeline || createInitialZoneTimeline(),
    };
    if (session.completedAt) return null;
    if (Date.now() - session.startedAt > 48 * 60 * 60 * 1000) {
      store.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// ── API save helpers ─────────────────────────────────────────

import { csrfFetch } from "@/lib/auth/csrf-client";

const __DEV__ = process.env.NODE_ENV === "development";

let apiSaveTimer: ReturnType<typeof setTimeout> | null = null;
let saveStatusResetTimer: ReturnType<typeof setTimeout> | null = null;

export function clearApiSaveTimer() {
  if (apiSaveTimer) clearTimeout(apiSaveTimer);
}

/**
 * Save session to API immediately. Returns a promise that resolves to
 * true on success, false on failure. Never rejects — safe to fire-and-forget.
 */
export function immediateApiSave(
  session: QuestionnaireSessionV2,
): Promise<boolean> {
  if (!session.id) return Promise.resolve(false);
  return csrfFetch("/api/session/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: session.id,
      answers: session.answers,
      currentModule: getModuleForIndex(session.currentQuestionIndex),
      currentQuestionIndex: session.currentQuestionIndex,
      language: session.language,
      explorationProgress: session.zoneTimeline,
    }),
  })
    .then((res) => res.ok)
    .catch(() => false);
}

export function createSessionInDb(
  session: QuestionnaireSessionV2,
  onConfirmed?: () => void,
) {
  const doCreate = () =>
    csrfFetch("/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        tier: "deep",
        language: session.language,
      }),
    }).then((res) => {
      if (res.ok) {
        onConfirmed?.();
        return;
      }
      throw new Error(`session create failed: ${res.status}`);
    });

  doCreate().catch(() => {
    setTimeout(() => {
      doCreate().catch(() => {
        setTimeout(() => {
          doCreate().catch(() => {
            if (__DEV__)
              console.warn(
                "[questionnaire-store] session creation retries exhausted — /api/score ensureSessionExists will recover",
              );
          });
        }, 4000);
      });
    }, 2000);
  });
}

export function debouncedApiSave(
  session: QuestionnaireSessionV2,
  onStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void,
) {
  if (apiSaveTimer) clearTimeout(apiSaveTimer);
  if (saveStatusResetTimer) clearTimeout(saveStatusResetTimer);
  apiSaveTimer = setTimeout(() => {
    if (!session.id) return;
    onStatusChange?.("saving");
    csrfFetch("/api/session/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        answers: session.answers,
        currentModule: getModuleForIndex(session.currentQuestionIndex),
        currentQuestionIndex: session.currentQuestionIndex,
        language: session.language,
        explorationProgress: session.zoneTimeline,
      }),
    })
      .then((res) => {
        onStatusChange?.(res.ok ? "saved" : "error");
        if (saveStatusResetTimer) clearTimeout(saveStatusResetTimer);
        saveStatusResetTimer = setTimeout(() => onStatusChange?.("idle"), 3000);
      })
      .catch(() => {
        onStatusChange?.("error");
      });
  }, 2000);
}
