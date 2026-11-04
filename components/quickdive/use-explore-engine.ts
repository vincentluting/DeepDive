"use client";

const __DEV__ = process.env.NODE_ENV === "development";

import { useState, useCallback, useEffect, useRef } from "react";
import { hapticSuccess } from "@/lib/haptic";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { pickLocaleText } from "@/lib/i18n/localize";
import {
  QUESTIONS,
  LABELS,
  GENERATING_STEPS,
  type RiasecKey,
  type RiasecScores,
} from "./quickdive-data";
import { MINI_IP_ITEMS } from "@/lib/assessment/mini-ip";
import type { QuickDiveResultData } from "./quickdive-data";
import { getClientId } from "@/lib/auth/client-id";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { analytics } from "@/lib/analytics/client";
import { sendAnalyticsSafely } from "@/lib/analytics/send-safely";
import { matchCareersClient } from "@/lib/career-matching/client-engine";
import {
  normalizeRiasecScores,
  buildArchetype,
} from "@/lib/scoring/riasec-utils";
import {
  QUICK_TWIVI_ITEMS,
  computeQuickValueOrientation,
} from "@/lib/assessment/twivi-quick";

export type Phase =
  | "intro"
  | "priming"
  | "playing"
  | "values-intro"
  | "values-playing"
  | "avatar"
  | "generating"
  | "result";
export type ExploreMode = "immersive" | "classic";

/** Visual-only gender for avatar rendering. Used solely to pick between
 *  "Architect-male.png" vs "Architect-female.png" — never participates
 *  in RIASEC/TwIVI scoring. */
export type AvatarGender = "male" | "female";

const QD_HISTORY_KEY = "deep-dive-quickdive-history";

interface QuickDiveHistoryEntry {
  result: QuickDiveResultData;
  scores: Record<RiasecKey, number>;
  timestamp: string;
}

function loadHistory(): QuickDiveHistoryEntry[] {
  try {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(QD_HISTORY_KEY)
        : null;
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return [];
}

function saveHistory(entries: QuickDiveHistoryEntry[]) {
  try {
    localStorage.setItem(QD_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

export function getTopRiasecKey(scores: Record<RiasecKey, number>): RiasecKey {
  let maxKey: RiasecKey = "R";
  let maxVal = -1;
  for (const [k, v] of Object.entries(scores)) {
    if (v > maxVal) {
      maxVal = v;
      maxKey = k as RiasecKey;
    }
  }
  return maxKey;
}

const RIASEC_TEASERS: Record<RiasecKey, { zh: string; en: string }> = {
  R: {
    zh: "你的选择中有一条动手实践的线索……",
    en: "A thread of hands-on action is emerging in your choices...",
  },
  I: {
    zh: "你对探索未知的兴趣开始浮现……",
    en: "Your curiosity for exploring the unknown is surfacing...",
  },
  A: {
    zh: "创造性表达在你的选择中频繁出现……",
    en: "Creative expression keeps appearing in your choices...",
  },
  S: {
    zh: "一种帮助他人的倾向正在显现……",
    en: "A tendency toward helping others is taking shape...",
  },
  E: {
    zh: "你的选择透露出一种引领方向的能量……",
    en: "Your choices reveal an energy for leading the way...",
  },
  C: {
    zh: "你对秩序和精确的偏好清晰可见……",
    en: "Your preference for order and precision is clearly visible...",
  },
};

export function getMidJourneyTeaser(
  scores: Record<RiasecKey, number>,
  locale: Locale,
): { text: string; topDimension: RiasecKey } {
  const sorted = (Object.entries(scores) as [RiasecKey, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const topKey = sorted[0][0];
  const topScore = sorted[0][1];
  const secondScore = sorted[1][1];
  const t = getDictionaryClient(locale).quickDive as Record<string, string>;

  if (topScore - secondScore <= 1) {
    return {
      text: t.midTeaserTied,
      topDimension: topKey,
    };
  }

  const teaser = RIASEC_TEASERS[topKey];
  return {
    text: pickLocaleText(teaser, locale),
    topDimension: topKey,
  };
}

export interface ExploreEngine {
  phase: Phase;
  setPhase: (p: Phase) => void;
  qIndex: number;
  scores: Record<RiasecKey, number>;
  rawScores: Record<RiasecKey, number>;
  result: QuickDiveResultData | null;
  genStep: number;
  savedReportId: string | null;
  totalQ: number;
  isZh: boolean;
  genSteps: string[];

  /** Updates scores for the current question. Does NOT advance qIndex. */
  recordAnswer: (value: 0 | 1 | 2 | 3 | 4) => void;
  /** Advances to next question or transitions to generating phase. */
  advanceQuestion: () => void;
  /** Goes back to the previous RIASEC question, undoing its score. */
  goBack: () => void;
  /** Computes the final result from accumulated scores. */
  computeResult: () => void;
  /** Starts the generation step animation, returns a cleanup function. */
  generateResult: () => () => void;
  /** Re-dive: reset state, optionally keeping history. */
  handleRedive: (mode: "keep" | "replace") => void;
  /** Fire-and-forget analytics event. */
  trackEvent: (event: string, metadata?: Record<string, unknown>) => void;
  /** Get current top RIASEC key from scores. */
  getTopRiasec: () => RiasecKey;
  /** Get current top RIASEC key from a provided scores snapshot (for inline computation). */
  getTopRiasecFrom: (s: Record<RiasecKey, number>) => RiasecKey;
  /** Wait for the save-to-DB request to complete. Returns the saved ID or null. */
  waitForSave: () => Promise<string | null>;

  // ── Values Part 2 (TwIVI 8 items) ──
  /** Current question index within the values section (0-7). */
  valueQIndex: number;
  /** Total number of value questions. */
  totalValueQ: number;
  /** Records a value question answer (1-6 Likert). Does NOT advance. */
  recordValueAnswer: (value: 1 | 2 | 3 | 4 | 5 | 6) => void;
  /** Advances to next value question or transitions to generating phase. */
  advanceValueQuestion: () => void;
  /** Goes back to the previous values question, undoing its answer. */
  goBackValue: () => void;
  /** Starts the values-playing phase from values-intro. */
  startValuesPart: () => void;

  // ── Avatar style ──
  /** User-selected avatar gender (null = skipped or not yet picked). */
  avatarGender: AvatarGender | null;
  /** Records the avatar gender selection and transitions to generating phase. */
  submitAvatarGender: (gender: AvatarGender | null) => void;
}

export function useExploreEngine(
  locale: Locale,
  exploreMode: ExploreMode,
): ExploreEngine {
  const isZh = locale === "zh";

  const [phase, setPhase] = useState<Phase>("intro");
  const [qIndex, setQIndex] = useState(0);
  const [scores, setScores] = useState<Record<RiasecKey, number>>({
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  });
  const [rawScores, setRawScores] = useState<Record<RiasecKey, number>>({
    R: 0,
    I: 0,
    A: 0,
    S: 0,
    E: 0,
    C: 0,
  });
  const [result, setResult] = useState<QuickDiveResultData | null>(null);
  const [genStep, setGenStep] = useState(0);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const savePromiseRef = useRef<Promise<string | null>>(Promise.resolve(null));
  const [itemResponses, setItemResponses] = useState<number[]>([]);

  // ── Values Part 2 state ──
  const [valueQIndex, setValueQIndex] = useState(0);
  const [valueAnswers, setValueAnswers] = useState<Record<number, number>>({});
  const totalValueQ = QUICK_TWIVI_ITEMS.length; // 8

  // ── Avatar gender state ──
  const [avatarGender, setAvatarGender] = useState<AvatarGender | null>(null);

  // Timing refs — useRef to avoid re-renders
  const sessionStartTime = useRef<number>(0);
  const currentQuestionShownAt = useRef<number>(0);
  // Granular tracking refs
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const milestonesReported = useRef<Set<number>>(new Set());
  const questionTimings = useRef<
    Array<{
      questionIndex: number;
      shownAt: number;
      answeredAt: number;
      durationMs: number;
    }>
  >([]);

  const totalQ = QUESTIONS.length;
  const genSteps = isZh ? GENERATING_STEPS.zh : GENERATING_STEPS.en;

  // ── Auto-save / auto-restore progress via localStorage ──────
  const QD_PROGRESS_KEY = "deep-dive-quickdive-progress";

  // Restore in-progress session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QD_PROGRESS_KEY);
      if (!saved) return;
      const data = JSON.parse(saved) as {
        responses: number[];
        scores: Record<RiasecKey, number>;
        rawScores: Record<RiasecKey, number>;
        qIndex: number;
        timestamp: string;
        // Values phase fields (added later — may be absent in older saves)
        phase?: Phase | "demographic";
        valueAnswers?: Record<number, number>;
        valueQIndex?: number;
      };
      if (data.phase === "avatar" || data.phase === "demographic") {
        setScores(data.scores);
        setRawScores(data.rawScores);
        setItemResponses(data.responses);
        setQIndex(data.qIndex);
        if (data.valueAnswers) setValueAnswers(data.valueAnswers);
        if (data.valueQIndex != null) setValueQIndex(data.valueQIndex);
        setPhase("avatar");
        return;
      }
      // Restore Values phase
      if (data.phase === "values-intro" || data.phase === "values-playing") {
        setScores(data.scores);
        setRawScores(data.rawScores);
        setItemResponses(data.responses);
        setQIndex(data.qIndex);
        if (data.valueAnswers) setValueAnswers(data.valueAnswers);
        if (data.valueQIndex != null) setValueQIndex(data.valueQIndex);
        setPhase(
          data.phase === "values-playing" &&
            (data.valueQIndex ?? 0) >= totalValueQ
            ? "avatar"
            : data.phase,
        );
        return;
      }
      // Restore RIASEC phase
      if (data.qIndex > 0 && data.qIndex < totalQ) {
        setScores(data.scores);
        setRawScores(data.rawScores);
        setItemResponses(data.responses);
        setQIndex(data.qIndex);
        setPhase("playing");
      }
    } catch {
      /* ignore corrupt data */
    }
    // Effect intentionally runs once on mount — deps omitted by design
  }, []);

  // Clear progress when completed or reset
  useEffect(() => {
    if (phase === "result" || phase === "intro") {
      try {
        localStorage.removeItem(QD_PROGRESS_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [phase, QD_PROGRESS_KEY]);

  // Set analytics context once on mount
  useEffect(() => {
    analytics.setContext({ anonymousId: getClientId() });
  }, []);

  const trackEvent = useCallback(
    (event: string, metadata?: Record<string, unknown>) => {
      try {
        fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, clientId: getClientId(), metadata }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Tracking failure is non-critical
      }
    },
    [],
  );

  const recordAnswer = useCallback(
    (value: 0 | 1 | 2 | 3 | 4) => {
      // Mark Quick Dive as active so login/register knows to wait for save
      try {
        sessionStorage.setItem("quickdive-active", "1");
      } catch {
        /* ignore */
      }
      const question = QUESTIONS[qIndex];
      const riasecKey = question.riasec;
      const answerScores: RiasecScores = { [riasecKey]: value }; // 0-4 per O*NET standard

      setRawScores((prev) => {
        const n = { ...prev };
        Object.entries(answerScores).forEach(([k, v]) => {
          const key = k as RiasecKey;
          n[key] = (n[key] || 0) + (v || 0);
        });
        return n;
      });

      setScores((prev) => {
        const n = { ...prev };
        Object.entries(answerScores).forEach(([k, v]) => {
          const key = k as RiasecKey;
          n[key] = (n[key] || 0) + (v || 0);
        });
        return n;
      });

      // Record response
      setItemResponses((prev) => {
        const next = [...prev];
        next[qIndex] = value;
        return next;
      });

      // Record per-item timing
      const answeredAt = Date.now();
      const durationMs = answeredAt - currentQuestionShownAt.current;
      questionTimings.current.push({
        questionIndex: qIndex,
        shownAt: currentQuestionShownAt.current,
        answeredAt,
        durationMs,
      });

      // Granular tracking: question_answered
      sendAnalyticsSafely("/api/analytics/event", {
        event: "question_answered",
        clientId: getClientId(),
        metadata: {
          questionIndex: qIndex,
          timeOnQuestionMs: durationMs,
          moduleId: "QD-RIASEC",
          questionId: question.id,
          exploreMode: exploreMode as "classic" | "immersive",
          sessionId: sessionIdRef.current,
        },
      });

      // Persist progress to localStorage for resume-on-return
      try {
        const nextResponses = [...itemResponses];
        nextResponses[qIndex] = value;
        const nextScores = { ...scores };
        const nextRawScores = { ...rawScores };
        const key = question.riasec;
        nextScores[key] = (nextScores[key] || 0) + value;
        nextRawScores[key] = (nextRawScores[key] || 0) + value;
        localStorage.setItem(
          QD_PROGRESS_KEY,
          JSON.stringify({
            responses: nextResponses,
            scores: nextScores,
            rawScores: nextRawScores,
            qIndex: qIndex + 1,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch {
        /* localStorage full or unavailable — non-critical */
      }
    },
    [qIndex, itemResponses, scores, rawScores, QD_PROGRESS_KEY],
  );

  const advanceQuestion = useCallback(() => {
    // Granular tracking: progress_milestone (across RIASEC + Values = totalQ + totalValueQ)
    const overallTotal = totalQ + totalValueQ;
    const newProgress = ((qIndex + 1) / overallTotal) * 100;
    const milestones = [25, 50, 75] as const;
    for (const m of milestones) {
      if (!milestonesReported.current.has(m) && newProgress >= m) {
        milestonesReported.current.add(m);
        sendAnalyticsSafely("/api/analytics/event", {
          event: "progress_milestone",
          clientId: getClientId(),
          metadata: {
            percentComplete: m,
            sessionId: sessionIdRef.current,
            timeElapsedMs: Date.now() - sessionStartTime.current,
            exploreMode: exploreMode as "classic" | "immersive",
          },
        });
        break;
      }
    }

    if (qIndex + 1 < totalQ) {
      setQIndex((i) => i + 1);
      currentQuestionShownAt.current = Date.now();
    } else {
      // RIASEC part complete → transition to values Part 2
      setPhase("values-intro");
      // Persist phase transition so values-intro survives refresh
      try {
        localStorage.setItem(
          QD_PROGRESS_KEY,
          JSON.stringify({
            responses: itemResponses,
            scores,
            rawScores,
            qIndex: qIndex + 1,
            phase: "values-intro" as Phase,
            valueAnswers: {},
            valueQIndex: 0,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch {
        /* non-critical */
      }
    }
  }, [
    qIndex,
    totalQ,
    totalValueQ,
    exploreMode,
    itemResponses,
    scores,
    rawScores,
    QD_PROGRESS_KEY,
  ]);

  const goBack = useCallback(() => {
    if (qIndex <= 0) return;
    const prevIndex = qIndex - 1;
    const prevQuestion = QUESTIONS[prevIndex];
    const prevValue = itemResponses[prevIndex] ?? 0;
    const key = prevQuestion.riasec;

    // Undo the score contribution
    setScores((prev) => ({ ...prev, [key]: (prev[key] || 0) - prevValue }));
    setRawScores((prev) => ({ ...prev, [key]: (prev[key] || 0) - prevValue }));

    // Clear the response
    setItemResponses((prev) => {
      const next = [...prev];
      next[prevIndex] = undefined as unknown as number;
      return next;
    });

    setQIndex(prevIndex);
    currentQuestionShownAt.current = Date.now();
  }, [qIndex, itemResponses]);

  const computeResult = useCallback(() => {
    const weightedSorted = Object.entries(scores).sort(
      (a, b) => b[1] - a[1],
    ) as [string, number][];
    // 12-type archetype from RIASEC + value orientation
    const riasecNormalized = normalizeRiasecScores(scores);
    const valueResult = computeQuickValueOrientation(valueAnswers);
    const archetype = buildArchetype(
      riasecNormalized,
      valueResult.orientation,
      valueResult.scores,
    );
    const code = archetype.code;
    // Build label from 12-type archetype data + dimension color
    const primaryDimLabel =
      LABELS.find((l) => l.code === archetype.primary) || LABELS[0];
    const label = {
      code,
      label_zh: archetype.label_zh,
      label_en: archetype.label_en,
      tagline_zh: archetype.tagline_zh,
      tagline_en: archetype.tagline_en,
      colorHex: primaryDimLabel.colorHex,
    };

    const sorted = Object.entries(rawScores).sort((a, b) => b[1] - a[1]) as [
      string,
      number,
    ][];

    // Use cosine similarity matching against 1,140 career static pool (client-safe)
    const matched = matchCareersClient(sorted, locale);

    const topScore = weightedSorted[0][1];
    const secondScore = weightedSorted[1][1];
    const scoreDiff = topScore - secondScore;

    // Mini-IP thresholds: scores per dimension range 0-20 (5 items × 0-4)
    let confidenceTier: "HC" | "MC" | "LC";
    if (scoreDiff >= 6 && topScore >= 14) {
      confidenceTier = "HC";
    } else if (scoreDiff >= 3) {
      confidenceTier = "MC";
    } else {
      confidenceTier = "LC";
    }

    const resultData: QuickDiveResultData = {
      label,
      code,
      sortedScores: sorted,
      topCareers: matched.topCareers,
      fitCareers: matched.fitCareers,
      drainCareers: matched.drainCareers,
      aiEraCareer: matched.aiEraTopPick,
      confidenceTier,
    };

    setResult(resultData);
    setPhase("result");

    // Write to localStorage history so explore-hub can detect completion status
    const history = loadHistory();
    history.unshift({
      result: resultData,
      scores,
      timestamp: new Date().toISOString(),
    });
    saveHistory(history.slice(0, 10));

    hapticSuccess();
    analytics
      .track("quickdive_completed", {
        exploreMode,
        archetypeCode: code,
        language: locale,
        timeMs: Date.now() - sessionStartTime.current,
      })
      .catch(() => {});

    // Save to DB — store the promise so callers can await it before claiming
    try {
      savePromiseRef.current = csrfFetch("/api/quickdive/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores,
          code,
          label: isZh ? label.label_zh : label.label_en,
          locale,
          exploreMode,
          anonymousId: getClientId() || undefined,
          avatarGender: avatarGender ?? undefined,
          resultData: {
            sortedScores: sorted,
            topCareers: matched.topCareers,
            fitCareers: matched.fitCareers,
            drainCareers: matched.drainCareers,
            confidenceTier,
            labelData: {
              code: label.code,
              label_zh: label.label_zh,
              label_en: label.label_en,
              tagline_zh: label.tagline_zh,
              tagline_en: label.tagline_en,
              colorHex: label.colorHex,
            },
            // Canonical RIASEC + Archetype — computed once here, downstream only reads
            computedRiasec: {
              riasecNormalized,
              archetype,
              rawScoreMax: 20,
              computedAt: new Date().toISOString(),
            },
            // Value orientation from TwIVI Part 2
            computedValues: {
              orientation: valueResult.orientation,
              confidence: valueResult.confidence,
              isBoundary: valueResult.isBoundary,
              scores: valueResult.scores,
              rawAnswers: valueAnswers,
            },
            // Research data fields — enable precise reconstruction of each session
            assessmentType: "mini-ip-30-twivi-8",
            rawResponses: itemResponses,
            scoringMethod: "sum-0-4",
            itemOrder: MINI_IP_ITEMS.map((item) => item.index),
          },
          deviceInfo: {
            type: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
              ? "mobile"
              : "desktop",
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            userAgent: navigator.userAgent,
            language: navigator.language,
          },
          timing: (() => {
            const timings = questionTimings.current;
            const durations = timings.map((t) => t.durationMs);
            const sortedDurations = [...durations].sort((a, b) => a - b);
            const mid = Math.floor(sortedDurations.length / 2);
            const medianItemDurationMs =
              sortedDurations.length === 0
                ? 0
                : sortedDurations.length % 2 !== 0
                  ? sortedDurations[mid]
                  : Math.round(
                      (sortedDurations[mid - 1] + sortedDurations[mid]) / 2,
                    );
            const now = Date.now();
            return {
              sessionStartedAt: new Date(
                sessionStartTime.current,
              ).toISOString(),
              sessionCompletedAt: new Date(now).toISOString(),
              totalDurationMs: now - sessionStartTime.current,
              perItemDurationMs: durations,
              perItemTimings: timings,
              medianItemDurationMs,
              fastResponseCount: timings.filter((t) => t.durationMs < 1000)
                .length,
            };
          })(),
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            const json = await res.json();
            if (json.id) {
              setSavedReportId(json.id);
              try {
                localStorage.setItem("deep-dive-last-quickdive-id", json.id);
              } catch {
                /* ignore */
              }
              return json.id as string;
            }
          }
          // Log non-ok responses so save failures are visible in console
          if (__DEV__) {
            console.error(
              `[QuickDive] Save failed: ${res.status} ${res.statusText}`,
            );
          }
          return null;
        })
        .catch((err) => {
          if (__DEV__) {
            console.error("[QuickDive] Save request failed:", err);
          }
          return null;
        });
    } catch (err) {
      if (__DEV__) {
        console.error("[QuickDive] Save error:", err);
      }
    }
  }, [
    scores,
    rawScores,
    isZh,
    locale,
    exploreMode,
    trackEvent,
    itemResponses,
    valueAnswers,
    avatarGender,
  ]);

  const generateResult = useCallback(() => {
    let step = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const iv = setInterval(() => {
      step++;
      setGenStep(step);
      if (step >= 5) {
        clearInterval(iv);
        timers.push(setTimeout(() => computeResultRef.current(), 600));
      }
    }, 800);
    return () => {
      clearInterval(iv);
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const computeResultRef = useRef(computeResult);
  useEffect(() => {
    computeResultRef.current = computeResult;
  }, [computeResult]);

  // Record session start time when entering playing phase
  useEffect(() => {
    if (phase === "playing") {
      sessionStartTime.current = Date.now();
      currentQuestionShownAt.current = Date.now();
    }
  }, [phase]);

  // Trigger generation when entering "generating" phase
  useEffect(() => {
    if (phase === "generating") {
      const cleanup = generateResult();
      return cleanup;
    }
  }, [phase, generateResult]);

  const handleRedive = useCallback(
    (mode: "keep" | "replace") => {
      if (result) {
        if (mode === "keep") {
          const history = loadHistory();
          history.unshift({
            result,
            scores,
            timestamp: new Date().toISOString(),
          });
          saveHistory(history.slice(0, 10));
        } else {
          saveHistory([]);
        }
      }
      setPhase("intro");
      setQIndex(0);
      setScores({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
      setRawScores({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
      setResult(null);
      setGenStep(0);
      setItemResponses([]);
      setAvatarGender(null);
      setValueQIndex(0);
      setValueAnswers({});
      questionTimings.current = [];
      sessionStartTime.current = 0;
      currentQuestionShownAt.current = 0;
      sessionIdRef.current = crypto.randomUUID();
      milestonesReported.current = new Set();
    },
    [result, scores],
  );

  const getTopRiasec = useCallback(() => getTopRiasecKey(scores), [scores]);

  const getTopRiasecFrom = useCallback(
    (s: Record<RiasecKey, number>) => getTopRiasecKey(s),
    [],
  );

  const waitForSave = useCallback(async () => {
    return savePromiseRef.current;
  }, []);

  // ── Values Part 2 methods ──

  const startValuesPart = useCallback(() => {
    setValueQIndex(0);
    setValueAnswers({});
    setPhase("values-playing");
    currentQuestionShownAt.current = Date.now();
  }, []);

  const recordValueAnswer = useCallback(
    (value: 1 | 2 | 3 | 4 | 5 | 6) => {
      const item = QUICK_TWIVI_ITEMS[valueQIndex];
      if (!item) return;
      setValueAnswers((prev) => ({ ...prev, [item.id]: value }));

      // Record per-item timing
      const answeredAt = Date.now();
      const durationMs = answeredAt - currentQuestionShownAt.current;
      questionTimings.current.push({
        questionIndex: totalQ + valueQIndex, // offset past RIASEC questions
        shownAt: currentQuestionShownAt.current,
        answeredAt,
        durationMs,
      });

      // Granular tracking: question_answered (values part)
      sendAnalyticsSafely("/api/analytics/event", {
        event: "question_answered",
        clientId: getClientId(),
        metadata: {
          questionIndex: totalQ + valueQIndex,
          timeOnQuestionMs: durationMs,
          moduleId: "QD-VALUES",
          questionId: String(item.id),
          exploreMode: exploreMode as "classic" | "immersive",
          sessionId: sessionIdRef.current,
        },
      });

      // Persist values progress to localStorage
      try {
        const nextValueAnswers = { ...valueAnswers, [item.id]: value };
        localStorage.setItem(
          QD_PROGRESS_KEY,
          JSON.stringify({
            responses: itemResponses,
            scores,
            rawScores,
            qIndex: qIndex,
            phase: "values-playing" as Phase,
            valueAnswers: nextValueAnswers,
            valueQIndex: valueQIndex + 1,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch {
        /* localStorage full or unavailable — non-critical */
      }
    },
    [
      valueQIndex,
      totalQ,
      exploreMode,
      valueAnswers,
      itemResponses,
      scores,
      rawScores,
      qIndex,
      QD_PROGRESS_KEY,
    ],
  );

  const goBackValue = useCallback(() => {
    if (valueQIndex <= 0) return;
    const prevIndex = valueQIndex - 1;
    const prevItem = QUICK_TWIVI_ITEMS[prevIndex];
    if (prevItem) {
      setValueAnswers((prev) => {
        const next = { ...prev };
        delete next[prevItem.id];
        return next;
      });
    }
    setValueQIndex(prevIndex);
    currentQuestionShownAt.current = Date.now();
  }, [valueQIndex]);

  const advanceValueQuestion = useCallback(() => {
    // Granular tracking: progress_milestone (across RIASEC + Values)
    const overallTotal = totalQ + totalValueQ;
    const newProgress = ((totalQ + valueQIndex + 1) / overallTotal) * 100;
    const milestones = [25, 50, 75] as const;
    for (const m of milestones) {
      if (!milestonesReported.current.has(m) && newProgress >= m) {
        milestonesReported.current.add(m);
        sendAnalyticsSafely("/api/analytics/event", {
          event: "progress_milestone",
          clientId: getClientId(),
          metadata: {
            percentComplete: m,
            sessionId: sessionIdRef.current,
            timeElapsedMs: Date.now() - sessionStartTime.current,
            exploreMode: exploreMode as "classic" | "immersive",
          },
        });
        break;
      }
    }

    if (valueQIndex + 1 < totalValueQ) {
      setValueQIndex((i) => i + 1);
      currentQuestionShownAt.current = Date.now();
    } else {
      // All 8 value questions complete → avatar style picker before generation.
      setPhase("avatar");
      try {
        localStorage.setItem(
          QD_PROGRESS_KEY,
          JSON.stringify({
            responses: itemResponses,
            scores,
            rawScores,
            qIndex,
            phase: "avatar" as Phase,
            valueAnswers,
            valueQIndex: totalValueQ,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch {
        /* non-critical */
      }
    }
  }, [
    valueQIndex,
    totalValueQ,
    totalQ,
    exploreMode,
    itemResponses,
    scores,
    rawScores,
    qIndex,
    valueAnswers,
    QD_PROGRESS_KEY,
  ]);

  // ── Avatar gender ───────────────────────────────────────────
  const submitAvatarGender = useCallback((g: AvatarGender | null) => {
    setAvatarGender(g);
    setPhase("generating");
  }, []);

  return {
    phase,
    setPhase,
    qIndex,
    scores,
    rawScores,
    result,
    genStep,
    savedReportId,
    totalQ,
    isZh,
    genSteps,
    recordAnswer,
    advanceQuestion,
    goBack,
    computeResult,
    generateResult,
    handleRedive,
    trackEvent,
    getTopRiasec,
    getTopRiasecFrom,
    waitForSave,
    // Values Part 2
    valueQIndex,
    totalValueQ,
    recordValueAnswer,
    advanceValueQuestion,
    goBackValue,
    startValuesPart,
    // Avatar style
    avatarGender,
    submitAvatarGender,
  };
}
