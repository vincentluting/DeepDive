"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Check,
  History,
  Square,
} from "lucide-react";
import { TidalSend, NautilusSpiral } from "@/components/ui/icons";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

import { csrfFetch } from "@/lib/auth/csrf-client";
import { CoachingFeedback } from "@/components/features/coaching-feedback";
import { CoachingQuickActions } from "@/components/features/coaching-quick-actions";
import { sendAnalyticsSafely } from "@/lib/analytics/send-safely";
import { MEMORY_CATEGORY_LABELS } from "@/lib/types/memory";
import type { MemoryCategory } from "@/lib/types/memory";
import { isAiAnxietyTrigger } from "@/lib/coaching/types";
import {
  detectAiAnxietySignal,
  extractAnxietyEscalation,
} from "@/lib/coaching/anxiety-detection";
import { AiAnxietyResourcesCard } from "@/components/coaching/ai-anxiety-resources-card";
import { GracefulExitPrompt } from "@/components/coaching/graceful-exit-prompt";
import { reportClientError } from "@/lib/observability/client-error";
import type {
  CoachingCorrectionSignal,
  CoachingMode,
} from "@/lib/coaching/conversation-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Fingerprint,
  Compass,
  Activity,
  Navigation,
  Anchor,
  Flame,
  Eye,
  Sparkles,
  MessageCircle,
  ChevronDown,
  AlertTriangle,
  ShieldCheck,
  FileText,
} from "lucide-react";

const __DEV__ = process.env.NODE_ENV === "development";

// Coaching error messages are now in i18n dictionaries (en/zh coaching.json → coachingChat.*)
// Access via `ct.roundsExhausted`, `ct.timeoutError`, `ct.rateLimited`, `ct.networkError`

interface Message {
  role: "user" | "assistant";
  content: string;
  kind?: "message" | "correction";
}

type CompletionReason = "manual" | "session_limit";

interface CoachingActionDraft {
  title: string;
  actions: Array<{
    title: string;
    description?: string;
    category: "explore" | "learn" | "network" | "create" | "apply" | "reflect";
    estimatedMinutes?: number;
  }>;
}

interface RecentCoachingSession {
  id: string;
  updatedAt: string;
  status: "active" | "completed";
  mode: CoachingMode;
  messagesJson: Message[];
}

/** Memoized message bubble — prevents re-render of all messages on every SSE chunk */
const MessageBubble = React.memo(function MessageBubble({
  message,
  isFirstInBlock,
  showCursor,
}: {
  message: Message;
  isFirstInBlock: boolean;
  showCursor: boolean;
}) {
  if (message.role === "assistant") {
    return (
      <div className="coach-msg-enter flex justify-start items-end gap-2">
        {isFirstInBlock ? (
          <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 flex items-center justify-center coach-avatar-breathe">
            <NautilusSpiral className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
        ) : (
          <div className="flex-shrink-0 w-6 sm:w-7" />
        )}
        <div className="max-w-[80vw] sm:max-w-md lg:max-w-lg px-5 py-3 text-sm leading-relaxed chat-bubble-assistant coach-msg-enter">
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {showCursor && <span className="coaching-cursor" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="coach-msg-enter flex justify-end">
      <div className="max-w-[85vw] sm:max-w-md lg:max-w-lg px-5 py-3 text-sm leading-relaxed chat-bubble-user">
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </div>
  );
});

/** Extract quick reply options from AI response and strip the marker from content */
function extractQuickReplies(text: string): {
  clean: string;
  replies: string[];
} {
  const match = text.match(
    /<<QUICK_REPLIES>>\s*(\[[\s\S]*?\])\s*<<\/QUICK_REPLIES>>\s*$/,
  );
  if (!match) return { clean: text, replies: [] };
  try {
    const replies = JSON.parse(match[1]) as string[];
    const clean = text.slice(0, match.index).trimEnd();
    return {
      clean,
      replies: Array.isArray(replies)
        ? replies.filter((r) => typeof r === "string").slice(0, 4)
        : [],
    };
  } catch {
    return { clean: text, replies: [] };
  }
}

function extractActionDraft(text: string): {
  clean: string;
  draft: CoachingActionDraft | null;
} {
  const match = text.match(
    /<<ACTION_DRAFT>>\s*(\{[\s\S]*?\})\s*<<\/ACTION_DRAFT>>/,
  );
  if (!match) return { clean: text, draft: null };
  try {
    const parsed = JSON.parse(match[1]) as CoachingActionDraft;
    if (
      typeof parsed.title !== "string" ||
      !Array.isArray(parsed.actions) ||
      parsed.actions.length === 0
    ) {
      return { clean: text.replace(match[0], "").trim(), draft: null };
    }
    return {
      clean: text.replace(match[0], "").trim(),
      draft: {
        title: parsed.title.slice(0, 120),
        actions: parsed.actions.slice(0, 3),
      },
    };
  } catch {
    return { clean: text.replace(match[0], "").trim(), draft: null };
  }
}

function stripStreamingMarkers(text: string): string {
  const actionStart = text.indexOf("<<ACTION_DRAFT");
  const withoutPartialAction =
    actionStart >= 0 ? text.slice(0, actionStart) : text;
  return extractQuickReplies(withoutPartialAction).clean;
}

// ── Crisis keyword detection (client-side, supplements LLM detection) ──
const CRISIS_KEYWORDS_EN = [
  "kill myself",
  "end my life",
  "suicide",
  "want to die",
  "better off dead",
  "no reason to live",
  "self-harm",
  "hurt myself",
  "cutting myself",
];
const CRISIS_KEYWORDS_ZH = [
  "自杀",
  "不想活",
  "结束生命",
  "想死",
  "活不下去",
  "自残",
  "割腕",
  "伤害自己",
];

function detectCrisisSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    CRISIS_KEYWORDS_EN.some((k) => lower.includes(k)) ||
    CRISIS_KEYWORDS_ZH.some((k) => text.includes(k))
  );
}

/** Extract <<CRISIS_ALERT>> marker from AI response */
function extractCrisisAlert(text: string): {
  clean: string;
  isCrisis: boolean;
} {
  const match = text.match(/<<CRISIS_ALERT>>\s*$/);
  if (!match) return { clean: text, isCrisis: false };
  return { clean: text.slice(0, match.index).trimEnd(), isCrisis: true };
}

// AI-era anxiety detection helpers live in their own module so they can be
// covered by unit tests independently of the React surface. See
// lib/coaching/anxiety-detection.ts for the keyword lists and contract.

// ── Age gate persistence ──
const AGE_CONFIRMED_KEY = "deepdive_age_confirmed";

interface CoachingChatProps {
  answers: Record<string, unknown>;
  reportSummary: string | Record<string, unknown> | null;
  locale?: "en" | "zh";
  clientId: string;
  userId?: string;
  reportId?: string;
  behaviorInsight?: string;
  introContext?: string;
  /** Contextual hint about which report panel the user came from (passed to system prompt) */
  triggerContext?: string;
  /** Access level: 0=locked, 1=limited, 2=full. Default 2. */
  accessLevel?: 0 | 1 | 2;
  /** Number of coaching user turns already persisted in DB from past sessions */
  completedRounds?: number;
  /** Max total coaching rounds allowed (null = unlimited) */
  maxCoachRounds?: number | null;
  /** URL to redirect to after coaching completes (e.g., post-assessment survey) */
  returnUrl?: string;
}

const MAX_ROUNDS = 10;

// ── Memory category icon map ──────────────────────────────────────
const MEMORY_ICONS: Record<
  MemoryCategory,
  React.ComponentType<{ className?: string }>
> = {
  personality: Fingerprint,
  values: Compass,
  behavior: Activity,
  career: Navigation,
  constraint: Anchor,
  motivation: Flame,
  blindspot: Eye,
  strength: Sparkles,
  coaching_insight: MessageCircle,
};

interface MemoryPreview {
  category: MemoryCategory;
  keyword: string;
}

export function CoachingChat({
  answers,
  reportSummary,
  locale = "en",
  clientId,
  userId,
  reportId,
  behaviorInsight,
  introContext,
  triggerContext,
  accessLevel = 2,
  completedRounds = 0,
  maxCoachRounds = null,
  returnUrl,
}: CoachingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<CoachingMode>("explore");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [round, setRound] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [completionReason, setCompletionReason] =
    useState<CompletionReason | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionInsights, setSessionInsights] = useState<string[]>([]);
  const [sessionMemories, setSessionMemories] = useState<
    Array<{ keyword: string; insight: string }>
  >([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showJdInput, setShowJdInput] = useState(false);
  const [jdText, setJdText] = useState("");
  const [failedUserMessage, setFailedUserMessage] = useState<string | null>(
    null,
  );
  const [actionHubCtx, setActionHubCtx] = useState<{
    totalItems: number;
    completedItems: number;
    inProgressItems: number;
    topPendingActions: string[];
  } | null>(null);
  const [memoryPreviews, setMemoryPreviews] = useState<MemoryPreview[]>([]);
  const [showMemoryExpanded, setShowMemoryExpanded] = useState(false);
  const [showQuickActionsSheet, setShowQuickActionsSheet] = useState(false);
  const [showAllQuickActions, setShowAllQuickActions] = useState(false);
  const [actionDraft, setActionDraft] = useState<CoachingActionDraft | null>(
    null,
  );
  const [isSavingActionDraft, setIsSavingActionDraft] = useState(false);
  const [actionDraftSaved, setActionDraftSaved] = useState(false);
  const [actionDraftError, setActionDraftError] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentCoachingSession[]>(
    [],
  );
  const [showHistory, setShowHistory] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem(AGE_CONFIRMED_KEY) === "true"
      : false,
  );
  const [showCrisisCard, setShowCrisisCard] = useState(false);
  const [showAnxietyResourcesCard, setShowAnxietyResourcesCard] =
    useState(false);
  const [dismissedExitR7, setDismissedExitR7] = useState(false);
  const [dismissedExitR9, setDismissedExitR9] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const initRef = useRef(false);
  // #079: set by handleResumeSession so the init effect skips exactly one
  // re-initialization (the one setSessionId triggers). Survives the effect
  // cleanup that resets initRef, so restored history is not overwritten.
  const skipNextInitRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  /** Track whether this component instance has been unmounted */
  const unmountedRef = useRef(false);
  const dict = getDictionaryClient(locale as "en" | "zh");
  const ct = dict.coachingChat;
  const a11y = dict.a11y;

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  /** Client-side timeout (ms) — must exceed the server's overall stream timeout (90s)
   *  so the server can gracefully handle timeouts and return proper errors. */
  const CLIENT_TIMEOUT_MS = 100_000;

  // State 1 round tracking: user turns in current session = round - 1 (round starts at 1 for AI greeting)
  const userTurnsInSession = round - 1;
  const totalRoundsUsed = completedRounds + userTurnsInSession;
  const remainingRounds =
    maxCoachRounds !== null ? maxCoachRounds - totalRoundsUsed : null;
  const isRoundsExhausted = remainingRounds !== null && remainingRounds <= 0;
  const isFirstRound =
    messages.length <= 1 && messages[0]?.role === "assistant";
  const quickActionOptions = isFirstRound
    ? [
        ct.qs_whyRecommended,
        ct.qs_evaluateOffer,
        ct.qs_analyzeJd,
        ct.qs_feelStuck,
        ct.qs_actionPlan,
        ct.qs_exploreMore,
        ct.qs_skillGap,
        ct.qs_resultsSurprised,
        ct.qs_burnout,
        ct.qs_careerSwitch,
      ]
    : quickReplies;
  const quickActionsTitle = isFirstRound
    ? ct.quickStartLabel
    : ct.quickRepliesLabel;
  const quickActionsDescription = isFirstRound
    ? ct.quickStartHint
    : ct.quickRepliesHint;
  const shouldShowQuickActions =
    !isLoading &&
    !isComplete &&
    !isRoundsExhausted &&
    quickActionOptions.length > 0;

  useEffect(() => {
    messagesRef.current = messages;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setShowAllQuickActions(false);
  }, [isFirstRound]);

  useEffect(() => {
    if (quickActionOptions.length === 0) {
      setShowQuickActionsSheet(false);
    }
  }, [quickActionOptions.length]);

  // Scroll to bottom when keyboard opens on mobile (VisualViewport shrinks)
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const handleResize = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    window.visualViewport.addEventListener("resize", handleResize);
    return () =>
      window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  // Best-effort save coaching messages via beacon on page close/hide
  // Only saves raw messages — LLM extraction happens when user properly ends session
  useEffect(() => {
    if (!userId || !sessionId) return;

    const beaconSave = () => {
      // Don't save if session was already properly ended or has no user messages
      if (isComplete) return;
      const currentMessages = messagesRef.current;
      const hasUserMessages = currentMessages.some((m) => m.role === "user");
      if (!hasUserMessages) return;

      sendAnalyticsSafely("/api/coaching-save-beacon", {
        sessionId,
        userId,
        reportId: reportId || null,
        messages: currentMessages,
        locale,
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") beaconSave();
    };

    window.addEventListener("beforeunload", beaconSave);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", beaconSave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId, reportId, locale, isComplete, sessionId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch("/api/coaching-sessions?limit=5")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`History request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (cancelled || !Array.isArray(data.sessions)) return;
        setRecentSessions(data.sessions as RecentCoachingSession[]);
      })
      .catch((error) => {
        reportClientError(error, {
          component: "CoachingChat",
          feature: "coaching-history",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Fetch action hub plan context (non-blocking, best-effort)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/action-hub/plan")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.plan || !data.items?.length) return;
        const items = data.items as Array<{
          status: string;
          title: string;
          priority: number;
        }>;
        const completed = items.filter((i) => i.status === "completed").length;
        const inProgress = items.filter(
          (i) => i.status === "in_progress",
        ).length;
        const topPending = items
          .filter((i) => i.status === "pending")
          .sort((a, b) => a.priority - b.priority)
          .slice(0, 3)
          .map((i) => i.title);
        setActionHubCtx({
          totalItems: items.length,
          completedItems: completed,
          inProgressItems: inProgress,
          topPendingActions: topPending,
        });
      })
      .catch(() => {
        /* silent — action hub context is optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch memory previews for context card (non-blocking, best-effort)
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetch("/api/memory")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.memories?.length) return;
        const previews: MemoryPreview[] = (
          data.memories as Array<{
            category: MemoryCategory;
            keyword: string;
            confidence: number;
          }>
        )
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 10)
          .map((m) => ({ category: m.category, keyword: m.keyword }));
        setMemoryPreviews(previews);
      })
      .catch(() => {
        /* silent — memory context card is optional */
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const initializeChat = useCallback(async () => {
    if (!sessionId) return;
    // ── DEBUG: trace every step of initialization ──
    const t0 = performance.now();
    const dbg = (tag: string, extra?: unknown) => {
      if (__DEV__)
        console.log(
          `[coach-debug][init] ${tag} +${Math.round(performance.now() - t0)}ms`,
          extra ?? "",
        );
    };

    dbg("START", { introContext: !!introContext, locale, accessLevel });

    // If we have a pre-generated intro from the report, show it immediately
    if (introContext) {
      dbg("INTRO_CONTEXT — skipping API call");
      setMessages([{ role: "assistant", content: introContext }]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Client-side timeout: abort if no complete response within CLIENT_TIMEOUT_MS
    // Uses sliding window — reset on each chunk so mid-stream stalls are caught
    let timeoutId = setTimeout(() => {
      dbg("CLIENT_TIMEOUT fired — aborting");
      controller.abort();
    }, CLIENT_TIMEOUT_MS);

    try {
      dbg("FETCH_START", {
        reportSummaryType: reportSummary ? typeof reportSummary : "null",
        reportSummarySize: reportSummary
          ? JSON.stringify(reportSummary).length
          : 0,
        answersKeys: answers ? Object.keys(answers).length : 0,
      });

      const response = await csrfFetch("/api/coaching-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          sessionId,
          reportId: reportId ?? null,
          messages: [],
          answers,
          reportSummary,
          round: 1,
          maxRounds: MAX_ROUNDS,
          locale,
          behaviorInsight,
          triggerContext,
          actionHubContext: actionHubCtx ?? undefined,
          ageConfirmed: true,
        }),
        signal: controller.signal,
      });

      dbg("FETCH_RESPONSE", {
        ok: response.ok,
        status: response.status,
        contentType: response.headers.get("content-type"),
        hasBody: !!response.body,
      });

      const responseSessionId = response.headers.get("X-Coaching-Session-Id");
      const responseMode = response.headers.get("X-Coaching-Mode");
      if (responseSessionId) setSessionId(responseSessionId);
      if (
        responseMode &&
        ["explore", "decide", "act", "support", "job_analysis"].includes(
          responseMode,
        )
      ) {
        setCurrentMode(responseMode as CoachingMode);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        dbg("FETCH_ERROR_BODY", errorData);
        if (errorData?.reason === "rounds_exhausted") {
          setMessages([
            {
              role: "assistant",
              content: (ct as Record<string, string>).roundsExhausted,
            },
          ]);
          // #121: surface the session-limit completion UI (sessionLimitTitle /
          // Subtitle exist in i18n but were unreachable). Don't call endSession —
          // that would fire an LLM summary for a capped turn.
          setCompletionReason("session_limit");
          setIsComplete(true);
          return;
        }
        if (response.status === 429) {
          throw new Error((ct as Record<string, string>).rateLimited);
        }
        const errorMsg = errorData?.error?.message || ct.errorStart;
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let chunkCount = 0;

      dbg("STREAM_START", { hasReader: !!reader });

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              dbg("STREAM_DONE", {
                totalChunks: chunkCount,
                totalChars: assistantMessage.length,
              });
              // Extract crisis alert from AI response (LLM-side detection)
              const crisisCheck = extractCrisisAlert(assistantMessage);
              if (crisisCheck.isCrisis) {
                assistantMessage = crisisCheck.clean;
                setShowCrisisCard(true);
                sendAnalyticsSafely("/api/analytics/event", {
                  event: "crisis_signal_detected",
                  userId: userId || undefined,
                  clientId,
                  metadata: { source: "llm", locale },
                });
              } else {
                // Anxiety escalation (TIER 1, yellow) — mutually exclusive
                // with crisis. Per ESCALATION SIGNALS, the LLM never emits
                // both markers in the same response, but we guard explicitly.
                const anxietyCheck = extractAnxietyEscalation(assistantMessage);
                if (anxietyCheck.isAnxietyEscalation) {
                  assistantMessage = anxietyCheck.clean;
                  setShowAnxietyResourcesCard(true);
                  sendAnalyticsSafely("/api/analytics/event", {
                    event: "ai_anxiety_signal_detected",
                    userId: userId || undefined,
                    clientId,
                    metadata: { source: "llm", locale },
                  });
                }
              }
              // Extract quick replies from completed message
              const actionResult = extractActionDraft(assistantMessage);
              if (actionResult.draft) {
                setActionDraft(actionResult.draft);
                setActionDraftSaved(false);
                setActionDraftError(null);
              }
              const { clean, replies } = extractQuickReplies(
                actionResult.clean,
              );
              if (replies.length > 0) {
                setQuickReplies(replies);
              }
              setMessages((prev) => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: clean,
                  };
                }
                return updated;
              });
              break;
            }
            chunkCount++;
            // Reset sliding-window timeout on each chunk received
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              dbg("STREAM_STALL_TIMEOUT — aborting");
              controller.abort();
            }, CLIENT_TIMEOUT_MS);
            const chunk = decoder.decode(value, { stream: true });
            assistantMessage += chunk;
            if (chunkCount <= 3 || chunkCount % 10 === 0) {
              dbg(`STREAM_CHUNK #${chunkCount}`, {
                chunkLen: chunk.length,
                totalLen: assistantMessage.length,
              });
            }
            // Strip quick reply marker from display during streaming
            const displayText = stripStreamingMarkers(assistantMessage);
            setMessages((prev) => {
              const updated = [...prev];
              if (updated[updated.length - 1]?.role === "assistant") {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: displayText,
                };
              } else {
                updated.push({ role: "assistant", content: displayText });
              }
              return updated;
            });
          }
        } catch (readErr) {
          dbg("STREAM_READ_ERROR", {
            name: (readErr as Error).name,
            message: (readErr as Error).message,
          });
          // If reader fails (e.g. abort propagated or network error), cancel it
          reader.cancel().catch(() => {});
          throw readErr;
        }
      } else {
        dbg("NO_READER — response.body is null");
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        dbg("ABORT_ERROR", { unmounted: unmountedRef.current });
        // If aborted due to cleanup (component unmounting or deps changing),
        // allow re-initialization on next mount by resetting initRef
        if (!unmountedRef.current) {
          initRef.current = false;
        }
        return;
      }
      dbg("CATCH_ERROR", {
        name: (error as Error).name,
        message: (error as Error).message,
      });
      if (__DEV__) console.error("Error initializing chat:", error);
      // Allow retry on error
      initRef.current = false;
      const isNetwork =
        (error as Error).name === "TypeError" ||
        (error as Error).message?.includes("fetch");
      setMessages([
        {
          role: "assistant",
          content: isNetwork
            ? (ct as Record<string, string>).networkError
            : (error as Error).message || ct.errorStart,
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      dbg("FINALLY — setIsLoading(false)");
      setIsLoading(false);
    }
  }, [
    introContext,
    sessionId,
    clientId,
    reportId,
    answers,
    reportSummary,
    locale,
    behaviorInsight,
    triggerContext,
    ct.errorStart,
  ]);

  useEffect(() => {
    unmountedRef.current = false;
    if (__DEV__)
      console.log(
        "[coach-debug][effect] initializeChat effect running, initRef.current =",
        initRef.current,
      );
    if (skipNextInitRef.current) {
      // #079: a resume just loaded this session's messages into state directly.
      // setSessionId recreates initializeChat and re-runs this effect; its
      // cleanup just reset initRef to false, so without this guard the effect
      // would re-init and POST, overwriting the restored history via the
      // messagesJson upsert. Consume the flag and skip exactly one init.
      //
      // ⚠️ This guard is one-shot and therefore NOT React-StrictMode-safe: under
      // reactStrictMode the effect double-invokes — invoke #1 consumes the flag
      // and the interleaved cleanup resets initRef, so invoke #2 would re-init and
      // overwrite the restored history (a latent P0). We do NOT enable StrictMode
      // (next.config.ts has no reactStrictMode), so it's inert today. If you ever
      // turn it on, harden this first — e.g. key the skip on the resumed sessionId
      // (a ref the cleanup can't defeat) rather than a one-shot boolean.
      skipNextInitRef.current = false;
      initRef.current = true;
      if (__DEV__)
        console.log("[coach-debug][effect] → SKIPPED (resume guard #079)");
    } else if (!initRef.current) {
      initRef.current = true;
      if (__DEV__)
        console.log("[coach-debug][effect] → calling initializeChat()");
      initializeChat();
    } else {
      if (__DEV__)
        console.log("[coach-debug][effect] → SKIPPED (initRef already true)");
    }
    return () => {
      if (__DEV__)
        console.log(
          "[coach-debug][effect] CLEANUP — aborting, setting unmounted=true",
        );
      unmountedRef.current = true;
      initRef.current = false; // allow re-init on next mount (React Strict Mode / Fast Refresh)
      abortControllerRef.current?.abort();
    };
  }, [initializeChat]);

  const handleSendMessage = async (
    overrideMessage?: string,
    correctionSignal?: CoachingCorrectionSignal,
  ) => {
    const messageText = overrideMessage || inputValue.trim();
    if (!messageText || isLoading || !sessionId) return;

    // Crisis detection on user message (client-side)
    const isCrisis = detectCrisisSignal(messageText);
    if (isCrisis) {
      setShowCrisisCard(true);
      sendAnalyticsSafely("/api/analytics/event", {
        event: "crisis_signal_detected",
        userId: userId || undefined,
        clientId,
        metadata: { source: "client", locale },
      });
    } else if (detectAiAnxietySignal(messageText)) {
      // AI anxiety soft escalation (yellow) — only when no crisis signal
      // (red trumps yellow per ESCALATION SIGNALS in build-system-prompt)
      setShowAnxietyResourcesCard(true);
      sendAnalyticsSafely("/api/analytics/event", {
        event: "ai_anxiety_signal_detected",
        userId: userId || undefined,
        clientId,
        metadata: { source: "client", locale },
      });
    }

    const userMessage: Message = {
      role: "user",
      content: messageText,
      kind: correctionSignal ? "correction" : "message",
    };
    const newMessages = [...messages, userMessage];
    const newRound = round + 1;
    setMessages(newMessages);
    if (!overrideMessage) setInputValue("");
    setRound(newRound);
    setIsLoading(true);
    setQuickReplies([]); // Clear previous quick replies

    // Track coaching_started on first user message
    if (round === 1) {
      sendAnalyticsSafely("/api/analytics/event", {
        event: "coaching_started",
        userId: userId || undefined,
        clientId,
        metadata: { reportId, locale },
        idempotencyKey: `coaching_start:${reportId || clientId}`,
      });
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const response = await csrfFetch("/api/coaching-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          sessionId,
          reportId: reportId ?? null,
          messages: newMessages,
          answers,
          reportSummary,
          round: newRound,
          maxRounds: MAX_ROUNDS,
          locale,
          behaviorInsight,
          triggerContext,
          correctionSignal: correctionSignal ?? null,
          actionHubContext: actionHubCtx ?? undefined,
          ageConfirmed: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.reason === "rounds_exhausted") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: (ct as Record<string, string>).roundsExhausted,
            },
          ]);
          // #121: surface the session-limit completion UI (see above).
          setCompletionReason("session_limit");
          setIsComplete(true);
          return;
        }
        if (response.status === 429) {
          throw new Error((ct as Record<string, string>).rateLimited);
        }
        const errorMsg = errorData?.error?.message || ct.errorSend;
        throw new Error(errorMsg);
      }

      const responseSessionId = response.headers.get("X-Coaching-Session-Id");
      const responseMode = response.headers.get("X-Coaching-Mode");
      if (responseSessionId) setSessionId(responseSessionId);
      if (
        responseMode &&
        ["explore", "decide", "act", "support", "job_analysis"].includes(
          responseMode,
        )
      ) {
        setCurrentMode(responseMode as CoachingMode);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let streamError: Error | null = null;

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              const actionResult = extractActionDraft(assistantMessage);
              if (actionResult.draft) {
                setActionDraft(actionResult.draft);
                setActionDraftSaved(false);
                setActionDraftError(null);
              }
              // Extract quick replies from completed message
              const { clean, replies } = extractQuickReplies(
                actionResult.clean,
              );
              if (replies.length > 0) {
                setQuickReplies(replies);
              }
              assistantMessage = clean;
              setMessages((prev) => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: clean,
                  };
                }
                return updated;
              });
              break;
            }
            // Reset sliding-window timeout on each chunk received
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
            const chunk = decoder.decode(value, { stream: true });
            assistantMessage += chunk;
            // Strip quick reply marker from display during streaming
            const displayText = stripStreamingMarkers(assistantMessage);
            setMessages((prev) => {
              const updated = [...prev];
              if (updated[updated.length - 1]?.role === "assistant") {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: displayText,
                };
              } else {
                updated.push({ role: "assistant", content: displayText });
              }
              return updated;
            });
          }
        } catch (readErr) {
          // Cancel the reader to release the connection
          reader.cancel().catch(() => {});
          streamError = readErr as Error;
        }
      }

      if (streamError) {
        const errorNotice =
          streamError.name === "AbortError"
            ? (ct as Record<string, string>).timeoutError
            : ct.errorSend;
        // Preserve partial streamed text if any was received
        if (assistantMessage.trim()) {
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[updated.length - 1]?.role === "assistant") {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: assistantMessage + "\n\n⚠️ " + errorNotice,
              };
            }
            return updated;
          });
        } else {
          setMessages((prev) => {
            const trimmed =
              prev[prev.length - 1]?.role === "assistant"
                ? prev.slice(0, -1)
                : prev;
            return [...trimmed, { role: "assistant", content: errorNotice }];
          });
        }
        setFailedUserMessage(messageText);
        if (__DEV__) console.error("Stream interrupted:", streamError);
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: (ct as Record<string, string>).timeoutError,
          },
        ]);
      } else {
        if (__DEV__) console.error("Error sending message:", error);
        const isNetwork =
          (error as Error).name === "TypeError" ||
          (error as Error).message?.includes("fetch");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: isNetwork
              ? (ct as Record<string, string>).networkError
              : (error as Error).message || ct.errorSend,
          },
        ]);
      }
      setFailedUserMessage(messageText);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleEndChat = async () => {
    const hasUserMessages = messages.some((m) => m.role === "user");
    if (hasUserMessages) {
      await endSession(messages, "manual");
    } else {
      // No user messages — just mark complete without calling summary API
      setCompletionReason("manual");
      setIsComplete(true);
      setShowFeedback(false);
    }
  };

  const endSession = async (
    finalMessages: Message[],
    reason: CompletionReason,
  ) => {
    if (!sessionId) return;
    setCompletionReason(reason);
    setIsComplete(true);
    setIsSaving(true);
    try {
      // Save coaching summary + extract memories in a single merged LLM call
      const res = await csrfFetch("/api/coaching-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          reportId,
          messages: finalMessages,
          locale,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.insights || (data.memories && data.memories.length > 0)) {
          setProfileUpdated(true);
          // Extract insight strings for end-of-session reveal
          const insightTexts: string[] = [];
          if (data.insights?.coachingInsights) {
            for (const ci of data.insights.coachingInsights) {
              if (ci.insight) insightTexts.push(ci.insight);
            }
          }
          if (insightTexts.length > 0)
            setSessionInsights(insightTexts.slice(0, 3));
          // Extract memories for "what AI now remembers" reveal
          if (Array.isArray(data.memories) && data.memories.length > 0) {
            const memoryItems = data.memories
              .filter(
                (m: { keyword?: string; insight?: string }) =>
                  typeof m?.keyword === "string" &&
                  typeof m?.insight === "string",
              )
              .map((m: { keyword: string; insight: string }) => ({
                keyword: m.keyword,
                insight: m.insight,
              }))
              .slice(0, 3);
            setSessionMemories(memoryItems);
          }
        }
      } else {
        if (__DEV__)
          console.warn("[coaching-chat] Session save failed:", res.status);
      }
    } catch (err) {
      if (__DEV__) console.error("Error saving session:", err);
    } finally {
      setIsSaving(false);
      setShowFeedback(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickActionSelect = (option: string) => {
    setQuickReplies([]);
    setShowAllQuickActions(false);
    setShowQuickActionsSheet(false);
    handleSendMessage(option);
  };

  const handleCorrection = (
    message: string,
    signal: CoachingCorrectionSignal,
  ) => {
    setQuickReplies([]);
    handleSendMessage(message, signal);
  };

  const handleConfirmActionDraft = async () => {
    if (
      !actionDraft ||
      !sessionId ||
      isSavingActionDraft ||
      !actionDraft.title.trim() ||
      actionDraft.actions.some((action) => action.title.trim().length < 2)
    ) {
      return;
    }
    setIsSavingActionDraft(true);
    setActionDraftError(null);
    try {
      const response = await csrfFetch("/api/action-hub/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          reportId: reportId ?? null,
          title: actionDraft.title.trim(),
          actions: actionDraft.actions.map((action) => ({
            ...action,
            title: action.title.trim(),
            description: action.description?.trim() ?? "",
          })),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || ct.actionDraftSaveError);
      }
      setActionDraftSaved(true);
      setActionDraftError(null);
    } catch (error) {
      reportClientError(error, {
        component: "CoachingChat",
        feature: "action-draft",
        level: "error",
      });
      setActionDraftError(
        error instanceof Error ? error.message : ct.actionDraftSaveError,
      );
    } finally {
      setIsSavingActionDraft(false);
    }
  };

  const updateActionDraftTitle = (title: string) => {
    setActionDraft((current) =>
      current ? { ...current, title: title.slice(0, 120) } : current,
    );
    setActionDraftError(null);
  };

  const updateActionDraftItem = (
    index: number,
    field: "title" | "description",
    value: string,
  ) => {
    setActionDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        actions: current.actions.map((action, actionIndex) =>
          actionIndex === index
            ? {
                ...action,
                [field]: value.slice(0, field === "title" ? 160 : 500),
              }
            : action,
        ),
      };
    });
    setActionDraftError(null);
  };

  const handleResumeSession = (session: RecentCoachingSession) => {
    abortControllerRef.current?.abort();
    // #079: messages are loaded into state below; setSessionId re-runs the init
    // effect, so flag it to skip one re-initialization (which would overwrite
    // this restored history). initRef alone is insufficient — the effect
    // cleanup resets it to false before the body checks it.
    initRef.current = true;
    skipNextInitRef.current = true;
    setSessionId(session.id);
    setMessages(
      Array.isArray(session.messagesJson) ? session.messagesJson : [],
    );
    setRound(
      (session.messagesJson ?? []).filter((message) => message.role === "user")
        .length + 1,
    );
    setCurrentMode(session.mode || "explore");
    setIsComplete(false);
    setCompletionReason(null);
    setShowFeedback(false);
    setQuickReplies([]);
    setActionDraft(null);
    setActionDraftSaved(false);
    setShowHistory(false);
  };

  const renderMessage = useCallback(
    (message: Message, idx: number) => {
      const isFirstInBlock =
        message.role === "assistant" &&
        (idx === 0 || messages[idx - 1]?.role !== "assistant");
      const showCursor =
        isLoading &&
        idx === messages.length - 1 &&
        message.role === "assistant";

      return (
        <MessageBubble
          key={idx}
          message={message}
          isFirstInBlock={isFirstInBlock}
          showCursor={showCursor}
        />
      );
    },
    [messages, isLoading],
  );

  const chatCopy = ct as Record<string, string>;
  const currentModeLabel = chatCopy[`mode_${currentMode}`] ?? currentMode;
  const memoryContextSignal =
    memoryPreviews.length > 0
      ? chatCopy.chatContextMemoryReady.replace(
          "{{count}}",
          String(memoryPreviews.length),
        )
      : chatCopy.chatContextMemoryQuiet;
  const reportContextSignal = reportId
    ? chatCopy.chatContextReportReady
    : chatCopy.chatContextReportFallback;

  // ── Age gate ──
  if (!ageConfirmed) {
    return (
      <div className="dd-coach-age-gate flex flex-col h-full bg-card rounded-2xl overflow-hidden border border-border card-shadow items-center justify-center p-8 text-center">
        <ShieldCheck className="dd-coach-age-gate__icon w-10 h-10 text-primary mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">
          {(ct as Record<string, string>).ageGateTitle}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {(ct as Record<string, string>).ageGateBody}
        </p>
        <div className="dd-coach-age-gate__actions flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="dd-coach-age-gate__secondary px-4 py-2.5 min-h-[44px] text-sm rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
          >
            {(ct as Record<string, string>).ageGateCancel}
          </button>
          <button
            onClick={() => {
              localStorage.setItem(AGE_CONFIRMED_KEY, "true");
              setAgeConfirmed(true);
            }}
            className="dd-coach-age-gate__primary px-4 py-2.5 min-h-[44px] text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {(ct as Record<string, string>).ageGateConfirm}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dd-coach-chat-frame flex flex-col h-full bg-card rounded-2xl overflow-hidden border border-border card-shadow">
      {/* Crisis resource card — shown when crisis signal detected */}
      {showCrisisCard && (
        <div className="border-b border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 px-4 sm:px-6 py-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {(ct as Record<string, string>).crisisTitle}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
                {(ct as Record<string, string>).crisisBody}
              </p>
              <div className="mt-3 space-y-1.5 text-sm text-amber-800 dark:text-amber-300">
                <p className="font-medium">
                  {(ct as Record<string, string>).crisisHotlineUS}
                </p>
                <p className="font-medium">
                  {(ct as Record<string, string>).crisisHotlineCN}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400/60">
                  {(ct as Record<string, string>).crisisHotlineIntl}
                </p>
              </div>
              <button
                onClick={() => setShowCrisisCard(false)}
                className="mt-3 text-xs text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200 min-h-[44px] flex items-center"
              >
                {(ct as Record<string, string>).crisisContinue}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI anxiety soft escalation card (yellow) — mutually exclusive with
          the red crisis card above. Surfaces when the user (or the LLM)
          signals AI-replacement despair without self-harm intent. */}
      {!showCrisisCard && showAnxietyResourcesCard && (
        <AiAnxietyResourcesCard
          dict={dict.aiAnxiety}
          onDismiss={() => setShowAnxietyResourcesCard(false)}
        />
      )}

      {/* Header */}
      <div className="dd-coach-signal-strip border-b border-border/50 glass-subtle px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <NautilusSpiral className="h-5 w-5 text-primary" />
            {ct.aiCareerCoach}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ct.deepConversation}
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary/70" />
            {(ct as Record<string, string>).aiDisclosure}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex text-xs text-muted-foreground bg-accent/70 px-2.5 py-1 rounded-full border border-border/70">
            {currentModeLabel}
          </span>
          {recentSessions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory((value) => !value)}
              aria-expanded={showHistory}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-2.5 min-h-[44px] rounded-lg border border-border hover:bg-accent transition-all duration-200"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">{ct.historyButton}</span>
            </button>
          )}
          {/* State 1: round counter */}
          {accessLevel === 1 &&
            !isComplete &&
            remainingRounds !== null &&
            remainingRounds > 0 && (
              <span className="text-xs text-muted-foreground bg-accent px-2.5 py-1 rounded-full border border-border">
                {ct.roundsRemainingLabel}: {remainingRounds}/{maxCoachRounds}
              </span>
            )}
          {!isComplete && round > 0 && (
            <button
              onClick={handleEndChat}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-2.5 min-h-[44px] rounded-lg border border-border hover:bg-accent transition-all duration-200"
            >
              {ct.endChat}
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="border-b border-border/50 bg-background/70 px-4 sm:px-6 py-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {ct.historyTitle}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => handleResumeSession(session)}
                className="min-w-48 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left hover:border-primary/30 hover:bg-accent transition-colors"
              >
                <span className="block text-sm font-medium text-foreground truncate">
                  {session.messagesJson.find(
                    (message) => message.role === "user",
                  )?.content || ct.historyUntitled}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat(locale, {
                    month: "short",
                    day: "numeric",
                  }).format(new Date(session.updatedAt))}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="dd-coach-chat-context-rail hidden xl:flex">
          <div className="dd-coach-chat-context-rail__inner">
            <p className="dd-coach-kicker">{chatCopy.chatContextTitle}</p>
            <div className="dd-coach-chat-context-row">
              <Compass className="h-4 w-4" />
              <div>
                <span>{chatCopy.chatContextModeLabel}</span>
                <strong>{currentModeLabel}</strong>
              </div>
            </div>
            <div className="dd-coach-chat-context-row">
              <Sparkles className="h-4 w-4" />
              <div>
                <span>{chatCopy.chatContextMemoryLabel}</span>
                <strong>{memoryContextSignal}</strong>
              </div>
            </div>
            <div className="dd-coach-chat-context-row">
              <FileText className="h-4 w-4" />
              <div>
                <span>{chatCopy.chatContextReportLabel}</span>
                <strong>{reportContextSignal}</strong>
              </div>
            </div>
            <p className="dd-coach-chat-context-boundary">
              <ShieldCheck className="h-4 w-4" />
              {chatCopy.chatContextBoundary}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Messages */}
          <div
            className="dd-coach-message-stage flex-1 overflow-y-auto p-4 sm:p-6 pb-2 space-y-4 coaching-chat-bg"
            role="log"
            aria-live="polite"
          >
            {/* Memory context card — shown before first message */}
            {memoryPreviews.length > 0 && (
              <div className="flex justify-center mb-1 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setShowMemoryExpanded((v) => !v)}
                  className="dd-coach-memory-card glass-subtle border border-primary/10 rounded-xl px-4 py-2.5 text-xs text-muted-foreground hover:border-primary/20 transition-all duration-200 max-w-sm w-full text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
                    <span>
                      {(ct as Record<string, string>).memoryContext?.replace(
                        "{{count}}",
                        String(memoryPreviews.length),
                      )}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-3 h-3 text-muted-foreground/50 ml-auto flex-shrink-0 transition-transform duration-200",
                        showMemoryExpanded && "rotate-180",
                      )}
                    />
                  </span>
                  {showMemoryExpanded && (
                    <div className="mt-2.5 pt-2.5 border-t border-border/50 space-y-1.5">
                      {memoryPreviews.slice(0, 5).map((m, i) => {
                        const Icon = MEMORY_ICONS[m.category];
                        const label =
                          locale === "zh"
                            ? MEMORY_CATEGORY_LABELS[m.category].zh
                            : MEMORY_CATEGORY_LABELS[m.category].en;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-muted-foreground/70"
                          >
                            <Icon className="w-3 h-3 flex-shrink-0 text-primary/40" />
                            <span className="text-[11px] text-primary/50 w-12 flex-shrink-0">
                              {label}
                            </span>
                            <span className="truncate">{m.keyword}</span>
                          </div>
                        );
                      })}
                      {memoryPreviews.length > 5 && (
                        <div className="text-[11px] text-muted-foreground/60 pl-5">
                          {(
                            ct as Record<string, string>
                          ).memoryContextMore?.replace(
                            "{{count}}",
                            String(memoryPreviews.length - 5),
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              </div>
            )}

            {messages.map(renderMessage)}

            {actionDraft && !isComplete && (
              <div className="dd-coach-action-draft ml-8 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-4 coach-msg-enter">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-primary/70">
                      {ct.actionDraftLabel}
                    </p>
                    <input
                      type="text"
                      value={actionDraft.title}
                      onChange={(event) =>
                        updateActionDraftTitle(event.target.value)
                      }
                      disabled={actionDraftSaved}
                      aria-label={ct.actionDraftLabel}
                      className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-0 py-1 text-sm font-semibold text-foreground outline-none transition-colors hover:border-border/60 focus:border-primary/40 focus:bg-background/70 focus:px-2 disabled:cursor-default"
                    />
                  </div>
                  {actionDraftSaved && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                      <Check className="h-3.5 w-3.5" />
                      {ct.actionDraftSaved}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {actionDraft.actions.map((action, index) => (
                    <div
                      key={`${action.title}-${index}`}
                      className="rounded-xl border border-border/60 bg-card/80 px-3 py-2.5"
                    >
                      <input
                        type="text"
                        value={action.title}
                        onChange={(event) =>
                          updateActionDraftItem(
                            index,
                            "title",
                            event.target.value,
                          )
                        }
                        disabled={actionDraftSaved}
                        aria-label={`${ct.actionDraftLabel} ${index + 1}`}
                        className="w-full rounded-md border border-transparent bg-transparent px-0 py-1 text-sm font-medium text-foreground outline-none transition-colors hover:border-border/60 focus:border-primary/40 focus:bg-background focus:px-2 disabled:cursor-default"
                      />
                      <textarea
                        value={action.description ?? ""}
                        onChange={(event) =>
                          updateActionDraftItem(
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                        disabled={actionDraftSaved}
                        aria-label={`${action.title} ${ct.actionDraftLabel}`}
                        rows={2}
                        className="mt-1 w-full resize-none rounded-md border border-transparent bg-transparent px-0 py-1 text-xs leading-relaxed text-muted-foreground outline-none transition-colors hover:border-border/60 focus:border-primary/40 focus:bg-background focus:px-2 disabled:cursor-default"
                      />
                    </div>
                  ))}
                </div>
                {actionDraftError && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {actionDraftError}
                  </p>
                )}
                {!actionDraftSaved && (
                  <button
                    type="button"
                    onClick={handleConfirmActionDraft}
                    disabled={
                      isSavingActionDraft ||
                      !actionDraft.title.trim() ||
                      actionDraft.actions.some(
                        (action) => action.title.trim().length < 2,
                      )
                    }
                    className="mt-3 min-h-[44px] rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSavingActionDraft
                      ? ct.actionDraftSaving
                      : actionDraftError
                        ? ct.actionDraftRetry
                        : ct.actionDraftConfirm}
                  </button>
                )}
              </div>
            )}

            {!isLoading &&
              !isComplete &&
              messages.length > 1 &&
              messages[messages.length - 1]?.role === "assistant" && (
                <div className="dd-coach-correction-row ml-8 flex max-w-xl flex-wrap gap-2">
                  {[
                    {
                      signal: "missed_point" as const,
                      label: ct.correctionMissedPoint,
                    },
                    {
                      signal: "be_direct" as const,
                      label: ct.correctionBeDirect,
                    },
                    {
                      signal: "recommend" as const,
                      label: ct.correctionRecommend,
                    },
                    {
                      signal: "not_practical" as const,
                      label: ct.correctionNotPractical,
                    },
                  ].map((item) => (
                    <button
                      key={item.signal}
                      type="button"
                      onClick={() => handleCorrection(item.label, item.signal)}
                      className="min-h-[36px] rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

            {/* Graceful Exit prompts — only inside the AI anxiety reframing
                flow. Round 7 = soft offer; round 9 = firmer "stop here for now".
                Each is dismissible; this is an invitation, not a hard limit. */}
            {isAiAnxietyTrigger(triggerContext) &&
              round >= 7 &&
              round < 9 &&
              !dismissedExitR7 && (
                <GracefulExitPrompt
                  round={7}
                  dict={dict.aiAnxiety}
                  onDismiss={() => setDismissedExitR7(true)}
                />
              )}
            {isAiAnxietyTrigger(triggerContext) &&
              round >= 9 &&
              !dismissedExitR9 && (
                <GracefulExitPrompt
                  round={9}
                  dict={dict.aiAnxiety}
                  onDismiss={() => setDismissedExitR9(true)}
                />
              )}

            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start items-end gap-2 animate-fade-in">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 flex items-center justify-center coach-avatar-breathe">
                    <NautilusSpiral className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </div>
                  <div
                    className="chat-bubble-assistant text-muted-foreground text-sm px-5 py-4"
                    role="status"
                    aria-label={ct.thinking}
                  >
                    <div
                      className="coaching-bioluminescent"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )}

            {isLoading && (
              <div className="flex justify-center py-1.5">
                <button
                  onClick={() => {
                    abortControllerRef.current?.abort();
                    setIsLoading(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl border border-border/60 bg-card/80 text-muted-foreground text-xs hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Square className="w-3 h-3 fill-current" />
                  {ct.stopGenerating}
                </button>
              </div>
            )}

            {/* Retry button — shown when last message failed */}
            {failedUserMessage && !isLoading && !isComplete && (
              <div className="flex justify-center py-2 coach-msg-enter">
                <button
                  onClick={() => {
                    const msg = failedUserMessage;
                    setFailedUserMessage(null);
                    // Remove the error message(s) and the failed user message, then resend
                    setMessages((prev) => {
                      // Remove trailing assistant error + the failed user message
                      const cleaned = [...prev];
                      if (cleaned[cleaned.length - 1]?.role === "assistant")
                        cleaned.pop();
                      if (
                        cleaned[cleaned.length - 1]?.role === "user" &&
                        cleaned[cleaned.length - 1].content === msg
                      )
                        cleaned.pop();
                      return cleaned;
                    });
                    setRound((r) => r - 1);
                    // Small delay to let state settle before resending
                    setTimeout(() => handleSendMessage(msg), 50);
                  }}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium transition-colors"
                >
                  {ct.retry}
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Completion Card */}
          {isComplete && (
            <div className="dd-coach-completion-card border-t border-border/50 glass-subtle p-6 coach-msg-enter">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {isSaving
                      ? ct.conversationComplete
                      : completionReason === "session_limit"
                        ? ct.sessionLimitTitle
                        : ct.completeTitleRemembered}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isSaving
                      ? ct.savingSession
                      : completionReason === "session_limit"
                        ? ct.sessionLimitSubtitle
                        : sessionMemories.length > 0
                          ? ct.rememberedCountSubtitle.replace(
                              "{{count}}",
                              String(sessionMemories.length),
                            )
                          : profileUpdated
                            ? ct.rememberedNoneSubtitle
                            : ct.sessionSaved}
                  </p>
                </div>
                {/* Memory reveal — show what AI now remembers about you */}
                {sessionMemories.length > 0 && !isSaving && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {ct.newlyRememberedTitle}
                    </p>
                    <ul className="space-y-1.5">
                      {sessionMemories.map((mem, i) => (
                        <li
                          key={`mem-${i}`}
                          className="text-sm text-foreground/85 leading-relaxed pl-3 border-l-2 border-primary/30"
                        >
                          <span className="font-medium text-foreground/95">
                            {mem.keyword}
                          </span>
                          <span className="text-muted-foreground/70 mx-1.5">
                            ·
                          </span>
                          <span>{mem.insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Insight reveal — extracted coaching insights */}
                {sessionInsights.length > 0 && !isSaving && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {ct.insightsRevealTitle}
                    </p>
                    <ul className="space-y-1.5">
                      {sessionInsights.map((insight, i) => (
                        <li
                          key={`ins-${i}`}
                          className="text-sm text-foreground/85 leading-relaxed pl-3 border-l-2 border-primary/30"
                        >
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Primary action — context-aware */}
                <div className="flex flex-wrap gap-3">
                  {returnUrl ? (
                    <a
                      href={returnUrl}
                      className="group inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-[0_4px_16px_rgba(var(--primary-rgb),0.25)]"
                    >
                      {ct.continueToResearchSurvey}
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </a>
                  ) : completionReason !== "session_limit" &&
                    (remainingRounds === null || remainingRounds > 0) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCompletionReason(null);
                        setIsComplete(false);
                        setIsSaving(false);
                        setShowFeedback(false);
                      }}
                      disabled={isSaving}
                      className="group inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl border border-border/60 bg-card/80 hover:bg-accent hover:border-primary/30 text-foreground text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ct.continueChattingButton}
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  ) : (
                    <a
                      href={`/${locale}`}
                      className="group inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl border border-border/60 bg-card/80 hover:bg-accent hover:border-primary/30 text-foreground text-sm font-medium transition-all duration-200"
                    >
                      {ct.comeBackLaterButton}
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </a>
                  )}
                </div>
                {/* Secondary link — Profile is now optional, not the default flow */}
                {!returnUrl && !isSaving && (
                  <p className="text-xs text-muted-foreground/80 pt-1">
                    <a
                      href={`/${locale}/profile`}
                      className="underline-offset-4 hover:underline hover:text-foreground/80 transition-colors"
                    >
                      {ct.viewProfileSecondary}
                    </a>
                  </p>
                )}
                {showFeedback && (
                  <CoachingFeedback
                    sessionId={sessionId ?? ""}
                    locale={locale as "en" | "zh"}
                    onDismiss={() => setShowFeedback(false)}
                  />
                )}
              </div>
            </div>
          )}

          {shouldShowQuickActions && (
            <div className="dd-coach-mobile-actions border-t border-border/50 glass-subtle px-4 py-3 lg:hidden">
              <button
                type="button"
                onClick={() => setShowQuickActionsSheet(true)}
                aria-expanded={showQuickActionsSheet}
                aria-haspopup="dialog"
                aria-controls="coaching-quick-actions-sheet"
                className="dd-coach-mobile-actions__trigger flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-left transition-colors hover:border-primary/20 hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {quickActionsTitle}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {quickActionsDescription}
                  </p>
                </div>
                <span className="ml-3 rounded-full border border-border/60 px-2 py-1 text-xs text-muted-foreground">
                  {quickActionOptions.length}
                </span>
              </button>
            </div>
          )}

          {/* JD Paste Area — collapsible above main input */}
          {showJdInput && !isComplete && (
            <div className="dd-coach-jd-panel border-t border-border/50 bg-accent/30 px-4 py-3">
              <div className="max-w-4xl mx-auto space-y-2">
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder={ct.jdPlaceholder}
                  maxLength={4000}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 resize-none"
                  autoFocus
                />
                <div className="flex justify-end px-1">
                  <span className="text-xs text-muted-foreground">
                    {jdText.length}/4000
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setShowJdInput(false);
                      setJdText("");
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 min-h-[44px] rounded-lg transition-colors"
                  >
                    {ct.cancelJd}
                  </button>
                  <button
                    onClick={() => {
                      if (!jdText.trim()) return;
                      const msg = `[JOB_DESCRIPTION]\n${jdText.trim()}\n[/JOB_DESCRIPTION]`;
                      setShowJdInput(false);
                      setJdText("");
                      handleSendMessage(msg);
                    }}
                    disabled={!jdText.trim() || isLoading}
                    title={!jdText.trim() ? ct.jdPlaceholder : undefined}
                    className={cn(
                      "px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-200",
                      jdText.trim()
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground cursor-not-allowed",
                    )}
                  >
                    {ct.analyzeJob}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* State 1 rounds exhausted — upgrade card */}
          {!isComplete && isRoundsExhausted && (
            <div className="dd-coach-upgrade-panel border-t border-border bg-card p-5 sm:p-6">
              <div className="max-w-xl mx-auto space-y-3">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {ct.upgradeTitle}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ct.upgradeSubtitle}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {ct.upgradeBody}
                </p>
                <a
                  href={`/${locale}/deepdive`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {ct.upgradeCtaButton}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {/* Input */}
          {!isComplete && !isRoundsExhausted && (
            <div
              className="dd-coach-composer border-t border-border bg-card p-4"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <div className="max-w-4xl mx-auto flex gap-3">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onFocus={() => {
                    // Wait for keyboard animation before scrolling
                    setTimeout(() => {
                      messagesEndRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }, 300);
                  }}
                  placeholder={ct.typeResponse}
                  aria-label={ct.typeResponse}
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[rgba(var(--primary-rgb),0.4)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.08)] disabled:opacity-50 resize-none max-h-24 overflow-y-auto transition-all duration-200"
                />
                <button
                  onClick={() => setShowJdInput(!showJdInput)}
                  aria-label={ct.pasteJd}
                  aria-pressed={showJdInput}
                  title={ct.pasteJd}
                  className={cn(
                    "px-3 min-w-[44px] min-h-[44px] rounded-xl transition-all duration-200 flex items-center justify-center gap-2",
                    showJdInput
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                >
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {ct.analyzeJob}
                  </span>
                </button>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  aria-label={ct.sendMessage}
                  className={cn(
                    "p-3 min-w-[44px] min-h-[44px] rounded-xl transition-all duration-300 flex items-center justify-center interactive-press focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
                    inputValue.trim() && !isLoading
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-sm"
                      : "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                >
                  <TidalSend className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {shouldShowQuickActions && (
          <aside
            aria-label={quickActionsTitle}
            className="dd-coach-side-panel dd-coach-chat-action-rail hidden lg:flex lg:w-[320px] lg:shrink-0 lg:flex-col lg:border-l lg:border-border/50 lg:bg-muted/20"
          >
            <CoachingQuickActions
              title={quickActionsTitle}
              description={quickActionsDescription}
              options={quickActionOptions}
              isFirstRound={isFirstRound}
              isExpanded={showAllQuickActions}
              expandLabel={ct.quickActionsShowMore}
              collapseLabel={ct.quickActionsShowLess}
              onSelect={handleQuickActionSelect}
              onToggleExpanded={() =>
                setShowAllQuickActions((current) => !current)
              }
            />
          </aside>
        )}
      </div>

      <Sheet
        open={showQuickActionsSheet}
        onOpenChange={setShowQuickActionsSheet}
      >
        <SheetContent
          id="coaching-quick-actions-sheet"
          side="bottom"
          closeLabel={a11y.close}
          className="max-h-[78dvh] rounded-t-3xl px-0"
        >
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="text-base">{quickActionsTitle}</SheetTitle>
            <SheetDescription>{quickActionsDescription}</SheetDescription>
          </SheetHeader>
          <CoachingQuickActions
            title={quickActionsTitle}
            description={quickActionsDescription}
            options={quickActionOptions}
            isFirstRound={isFirstRound}
            isExpanded={showAllQuickActions}
            showHeader={false}
            expandLabel={ct.quickActionsShowMore}
            collapseLabel={ct.quickActionsShowLess}
            className="border-t border-border/50"
            onSelect={handleQuickActionSelect}
            onToggleExpanded={() =>
              setShowAllQuickActions((current) => !current)
            }
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
