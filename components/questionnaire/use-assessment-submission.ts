// ============================================================
// useAssessmentSubmission v4.0 — Server-orchestrated pipeline
// ============================================================
// v4.0: One POST to /api/assessment/complete creates an AssessmentPipeline
// row. The cron worker then advances scoring → profile → narratives in the
// background. The client navigates to /{locale}/processing?pipelineId=…
// which polls pipeline status and routes to /profile/[id] once ready.
//
// Previous versions drove the chain from the client, which meant any transient
// failure stranded the user mid-flow (see 2026-04-21 Jacky incident). The new
// architecture makes the pipeline self-healing via the Vercel cron worker.
// ============================================================

const __DEV__ = process.env.NODE_ENV === "development";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  QuestionnaireAnswers,
  SessionMetadataV3,
} from "@/lib/scoring/index";
import type { ProfileRevealData } from "@/components/questionnaire/profile-reveal-ceremony";
import { csrfFetch } from "@/lib/auth/csrf-client";

// ============================================================
// Pipeline error with step context
// ============================================================

class PipelineError extends Error {
  constructor(
    message: string,
    public readonly step: "session" | "scoring" | "profile",
    public readonly retryable: boolean = false,
    public readonly assessmentId?: string,
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

// ============================================================
// localStorage cleanup for the v2 flow's pre-scored assessmentId.
//
// The v2 flow (resume upload between scoring and finalize) persisted the
// assessmentId so a mid-flow reload could pick up where the user left off.
// The v3 flow doesn't need that — /api/assessment/complete is idempotent
// by sessionId. But users with stale v2 keys still hit this browser, so we
// clear the key on every successful finalize to prevent drift.
// ============================================================

const ASSESSMENT_STORAGE_KEY = "deepdive_pending_assessment_v2";
const PENDING_COMPLETION_KEY = "deepdive_pending_completion_v1";
const PENDING_COMPLETION_TTL_MS = 48 * 60 * 60 * 1000;
const MAX_AUTO_RETRIES = 4;
const AUTO_RETRY_DELAYS_MS = [1200, 3000, 7000, 15000];

type AssessmentCompletionPayload = {
  sessionId: string;
  sjt: QuestionnaireAnswers["sjt"];
  pvq?: QuestionnaireAnswers["pvq"];
  values?: QuestionnaireAnswers["pvq"];
  ipip: QuestionnaireAnswers["ipip"];
  riasecNormalized?: Record<string, number>;
  metadata: SessionMetadataV3;
  locale: string;
};

type PendingCompletion = {
  payload: AssessmentCompletionPayload;
  urlLocale: string;
  createdAt: number;
};

function clearPersistedAssessmentId() {
  try {
    localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

function savePendingCompletion(record: PendingCompletion) {
  try {
    localStorage.setItem(PENDING_COMPLETION_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage failures. The in-memory retry path still works.
  }
}

function loadPendingCompletion(): PendingCompletion | null {
  try {
    const raw = localStorage.getItem(PENDING_COMPLETION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingCompletion;
    if (
      !parsed?.payload?.sessionId ||
      !parsed.payload.metadata ||
      Date.now() - parsed.createdAt > PENDING_COMPLETION_TTL_MS
    ) {
      localStorage.removeItem(PENDING_COMPLETION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearPendingCompletion(sessionId?: string) {
  try {
    if (!sessionId) {
      localStorage.removeItem(PENDING_COMPLETION_KEY);
      return;
    }
    const pending = loadPendingCompletion();
    if (pending?.payload.sessionId === sessionId) {
      localStorage.removeItem(PENDING_COMPLETION_KEY);
    }
  } catch {
    // Ignore
  }
}

// ============================================================
// Pipeline helpers
// ============================================================

async function ensureSessionInDb(
  sessionId: string,
  language: "en" | "zh",
): Promise<void> {
  const res = await csrfFetch("/api/session/ensure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, language }),
  });
  if (!res.ok) {
    throw new PipelineError("Failed to ensure session exists in DB", "session");
  }
}

// ============================================================
// Hook
// ============================================================

export function useAssessmentSubmission(
  sessionId: string | undefined,
  language: string,
  urlLocale: string,
  quickDiveData?: { riasecNormalized: Record<string, number> } | null,
) {
  const [showScoringTransition, setShowScoringTransition] = useState(false);
  const [showPreparingProfile, setShowPreparingProfile] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  const [hasPendingCompletion, setHasPendingCompletion] = useState(false);
  // Kept for backward-compat with questionnaire-shell rendering branches.
  // In the pipeline architecture these are never set — the /processing page
  // is the new reveal surface.
  const [profileRevealData] = useState<ProfileRevealData | null>(null);
  const [narrativeReady] = useState(false);
  const scoringInputRef = useRef<{
    answers: QuestionnaireAnswers;
    metadata: SessionMetadataV3;
  } | null>(null);
  const pendingAssessmentIdRef = useRef<string | null>(null);
  const completionPayloadRef = useRef<AssessmentCompletionPayload | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRetryCountRef = useRef(0);
  const restoredPendingRef = useRef(false);
  // Ref guard prevents re-entry during the async window between button click
  // and window.location.replace. State alone is not enough because setState
  // is async — two clicks within the same microtask would both pass the check.
  const isSubmittingRef = useRef(false);

  // Finalize: create server-side pipeline, then navigate to /processing.
  // Pipeline worker advances scoring/profile/narratives asynchronously.
  //
  // Resume upload used to sit between scoring and this call; it has been
  // moved to the Report depth dialog on the Profile page so users get to
  // see their algorithmic profile before deciding whether to upload.
  const finalizeAndNavigate = useCallback(async () => {
    if (!completionPayloadRef.current) {
      if (!sessionId || !scoringInputRef.current) return;
      const { answers, metadata } = scoringInputRef.current;
      // Bug-log #006 / codex final round 2 regression fix:
      // `answers.pvq` historically carried Module B answers under the legacy
      // PVQ name even though Module B is now DDVQ-21 / TwIVI-20 (20 items).
      // The strict `scoreSchema` (lib/validation/api-schemas.ts:142+) gates
      // `pvq` to exactly 21 keys and `values` to exactly 20 keys, so the
      // 20-key body must be submitted under the `values` field.
      const answersWithRemap = answers as unknown as {
        pvq?: Record<string, number>;
        [key: string]: unknown;
      };
      const { pvq: legacyPvq, ...otherAnswers } = answersWithRemap;
      const remappedAnswers =
        legacyPvq !== undefined
          ? { ...otherAnswers, values: legacyPvq }
          : otherAnswers;
      completionPayloadRef.current = {
        sessionId,
        ...remappedAnswers,
        riasecNormalized: quickDiveData?.riasecNormalized,
        metadata,
        locale: language,
      } as AssessmentCompletionPayload;
    }
    const payload = completionPayloadRef.current;

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setHasPendingCompletion(true);

    setShowScoringTransition(true);
    savePendingCompletion({
      payload,
      urlLocale,
      createdAt: Date.now(),
    });

    try {
      await ensureSessionInDb(payload.sessionId, payload.locale as "en" | "zh");
      const res = await csrfFetch("/api/assessment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          `Assessment completion failed: ${res.status} ${JSON.stringify(errBody)}`,
        );
      }
      const body = (await res.json()) as {
        pipelineId: string;
        assessmentId: string;
      };
      clearPersistedAssessmentId();
      clearPendingCompletion(payload.sessionId);
      setHasPendingCompletion(false);
      pendingAssessmentIdRef.current = body.assessmentId;
      setAssessmentId(body.assessmentId);

      // Full-page navigation to observer page. window.location.replace is
      // intentional: the questionnaire lives in (immersive) route group and
      // /processing lives in (app), so soft router navigation can silently
      // fail across groups.
      window.location.replace(
        `/${urlLocale}/processing?pipelineId=${encodeURIComponent(body.pipelineId)}`,
      );
    } catch (err) {
      if (__DEV__)
        console.error("[finalize]", err instanceof Error ? err.message : err);
      setShowScoringTransition(false);
      setShowPreparingProfile(false);
      setPipelineError(err instanceof Error ? err.message : "Pipeline failed");
      const nextAttempt = autoRetryCountRef.current + 1;
      if (nextAttempt <= MAX_AUTO_RETRIES) {
        autoRetryCountRef.current = nextAttempt;
        setRecoveryAttempt(nextAttempt);
        const delay =
          AUTO_RETRY_DELAYS_MS[
            Math.min(nextAttempt - 1, AUTO_RETRY_DELAYS_MS.length - 1)
          ];
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          void finalizeAndNavigate();
        }, delay);
      }
      // Release the guard so retry is possible. Success path doesn't reach
      // here — the page is being replaced.
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [sessionId, language, urlLocale, quickDiveData]);

  // Begin the submission pipeline (called when questionnaire is complete).
  // Goes straight to /api/assessment/complete — the pipeline worker does
  // scoring, profile, and narratives in the background while the user
  // watches the /processing reveal.
  const beginSubmission = useCallback(
    (scoringInput: {
      answers: QuestionnaireAnswers;
      metadata: SessionMetadataV3;
    }) => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
      autoRetryCountRef.current = 0;
      setRecoveryAttempt(0);
      scoringInputRef.current = scoringInput;
      completionPayloadRef.current = null;
      setPipelineError(null);
      finalizeAndNavigate();
    },
    [finalizeAndNavigate],
  );

  const retrySubmission = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
    autoRetryCountRef.current = 0;
    setRecoveryAttempt(0);
    setPipelineError(null);
    finalizeAndNavigate();
  }, [finalizeAndNavigate]);

  const buildProfileHref = useCallback(() => {
    const targetUserId = profileRevealData?.userId;
    return targetUserId
      ? `/${urlLocale}/profile/${encodeURIComponent(targetUserId)}`
      : `/${urlLocale}/profile`;
  }, [profileRevealData?.userId, urlLocale]);

  const dismissError = useCallback(() => {
    setPipelineError(null);
    window.location.href = `/${urlLocale}/dashboard`;
  }, [urlLocale]);

  useEffect(() => {
    if (restoredPendingRef.current) return;
    // Wait for the questionnaire session to be ready before deciding whether
    // to replay. Without sessionId we cannot tell if a stored payload belongs
    // to the current session.
    if (!sessionId) return;
    const pending = loadPendingCompletion();
    if (!pending) return;
    // Stale payload: belongs to a different (older) session, or a different
    // user signed in on this browser. Replaying it would either no-op (server
    // rejects) or worse, replay one user's submission as another. Drop it.
    if (pending.payload.sessionId !== sessionId) {
      clearPendingCompletion();
      return;
    }
    restoredPendingRef.current = true;
    completionPayloadRef.current = pending.payload;
    autoRetryCountRef.current = 0;
    setRecoveryAttempt(0);
    setHasPendingCompletion(true);
    setPipelineError("pending_completion");
    void finalizeAndNavigate();
  }, [sessionId, finalizeAndNavigate]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  // Full-page navigation (window.location) instead of soft router.replace().
  // The ceremony is in (immersive) route group while profile is in (app) —
  // cross-group soft navigation can silently fail in Next.js App Router.
  const navigateToProfile = useCallback(() => {
    window.location.replace(buildProfileHref());
  }, [buildProfileHref]);

  return {
    showScoringTransition,
    showPreparingProfile,
    assessmentId,
    pipelineError,
    isSubmitting,
    recoveryAttempt,
    hasPendingCompletion,
    profileRevealData,
    narrativeReady,
    beginSubmission,
    retrySubmission,
    dismissError,
    navigateToProfile,
  };
}
