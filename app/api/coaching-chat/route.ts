// ============================================================
// POST /api/coaching-chat — AI Coaching Chat Endpoint (Streaming)
// Input:  { clientId, messages, answers, reportSummary, round, maxRounds, locale }
// Output: Streaming text response
// ============================================================

export const maxDuration = 120;

import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { sql as dbSql } from "@/lib/db/connection";
import { isImmersiveExploreMode } from "@/lib/quickdive/explore-mode";
import { canAccessFeature } from "@/lib/access/check-access";
import { parseBody } from "@/lib/validation/parse-body";
import { coachingChatSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { streamLLM } from "@/lib/ai/model-router";
import { observeStreamLocale } from "@/lib/coaching/stream-language-observer";
import {
  buildCoachingSystemPromptParts,
  type BuildCoachingPromptParams,
} from "@/lib/coaching/build-system-prompt";
import { buildCoachingContextEvidencePacket } from "@/lib/coaching/context-retriever";
import { buildCoachingTurnState } from "@/lib/coaching/turn-state";
import {
  buildCoachingTurnUnderstanding,
  buildCoachingTurnUnderstandingV2,
  coachingTurnUnderstandingV2ToV1,
} from "@/lib/coaching/turn-understanding";
import { evaluateCoachingTurn } from "@/lib/coaching/turn-eval";
import {
  buildCoachingQualityRewriteInstruction,
  evaluateCoachingSpecificity,
} from "@/lib/coaching/turn-specificity";
import {
  buildLLMJudgeRewriteReasons,
  evaluateCoachingTurnWithLLMJudge,
  shouldRunLLMJudge,
} from "@/lib/coaching/llm-judge";
import {
  selectRelevantMemories,
  selectRelevantThemes,
} from "@/lib/coaching/context-selection";
import { retrieveMemoriesHybrid } from "@/lib/coaching/semantic-memory";
import {
  selectRelevantHypotheses,
  type CoachingHypothesisForPrompt,
} from "@/lib/coaching/hypothesis-memory";
import { saveCoachingTurnEval } from "@/lib/db/coaching-turn-eval";
import { enqueueCoachingReviewCandidate } from "@/lib/db/coaching-review-pool";
import { createCoachingActionForActivePlan } from "@/lib/db/action-hub";
import { buildSevenDayCoachingAction } from "@/lib/coaching/action-loop";
import { buildCoachingGovernanceState } from "@/lib/coaching/governance";
import {
  getOpenCoachingHypotheses,
  toPromptHypothesis,
} from "@/lib/db/coaching-hypotheses";
import { getUserMemories } from "@/lib/db/memory";
import { getRecentSummaries } from "@/lib/db/coaching-session-summary";
import { getProfile, getExercises } from "@/lib/db/profiles";
import { parseReportContext } from "@/lib/coaching/parse-report-context";
import { sanitizeField } from "@/lib/ai/prompt-sanitization";
import { getCoachAccessLevel } from "@/lib/coaching/get-coach-access-level";
import { getRealConditionsByUserId } from "@/lib/db/conditions";
import {
  buildRealConditionsContextBlock,
  type RealConditionsContextResult,
} from "@/lib/report-generation/real-conditions-context";
import { logLLMPromptMeta } from "@/lib/db/llm-usage";
import { defaultLocale, isValidLocale } from "@/lib/i18n/config";
import { getLocalizedField } from "@/lib/i18n/localize";
import type { UserMemory } from "@/lib/types/memory";
import type { CoachingTheme } from "@/lib/db/coaching-themes";
import type { CoachingTurnUnderstanding } from "@/lib/coaching/turn-understanding";
import {
  analyzeCoachingTurn,
  createInitialCoachingSessionState,
  type CoachingCorrectionSignal,
  type CoachingSessionState,
  type TurnUnderstanding,
} from "@/lib/coaching/conversation-router";
import { buildResumeEvidenceContext } from "@/lib/coaching/resume-evidence-context";
import { resolveCoachingV2Rollout } from "@/lib/coaching/v2-rollout";
import {
  getCoachingSessionForUser,
  saveCoachingTurnAudit,
  saveCoachingSession,
} from "@/lib/db/coaching";
import { getLatestActiveResumeMatchForUser } from "@/lib/db/resume-match";

// ── Locale helper: pick text by locale with fallback to 'en' ──
type LocaleTexts = Record<string, string>;
function L(texts: LocaleTexts, locale: string): string {
  return texts[locale] ?? texts.en;
}

type ReportContextForEvidence = ReturnType<typeof parseReportContext>;
type ProfileForEvidence = Awaited<ReturnType<typeof getProfile>>;
type ExercisesForEvidence = Awaited<ReturnType<typeof getExercises>>;
type ActionHubForEvidence = NonNullable<
  BuildCoachingPromptParams["actionHubContext"]
>;

function compactEvidenceSignal(
  value: string | null | undefined,
): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  return text ? sanitizeField(text, 280) : null;
}

function uniqueEvidenceSignals(
  values: Array<string | null | undefined>,
  limit: number,
): string[] {
  const seen = new Set<string>();
  const signals: string[] = [];
  for (const value of values) {
    const signal = compactEvidenceSignal(value);
    if (!signal || seen.has(signal)) continue;
    seen.add(signal);
    signals.push(signal);
    if (signals.length >= limit) break;
  }
  return signals;
}

function buildMemoryEvidenceSignals(memories: UserMemory[]): string[] {
  return uniqueEvidenceSignals(
    memories.map(
      (memory) => `${memory.category}: ${memory.keyword} - ${memory.insight}`,
    ),
    4,
  );
}

function buildThemeEvidenceSignals(themes: CoachingTheme[]): string[] {
  return uniqueEvidenceSignals(
    themes.map((theme) =>
      theme.context ? `${theme.theme}: ${theme.context}` : theme.theme,
    ),
    3,
  );
}

function buildReportEvidenceSignals(
  reportCtx: ReportContextForEvidence,
): string[] {
  return uniqueEvidenceSignals(
    [
      reportCtx.coreInsight,
      reportCtx.sectionContext?.careerMatchSummary,
      reportCtx.sectionContext?.pathwaySummary,
      reportCtx.rawSummary,
      reportCtx.tensions?.length > 0
        ? `Tensions: ${reportCtx.tensions.join("; ")}`
        : null,
      reportCtx.topRoles?.length > 0
        ? `Roles: ${reportCtx.topRoles.join(", ")}`
        : null,
    ],
    3,
  );
}

function buildProfileEvidenceSignals(
  reportCtx: ReportContextForEvidence,
  profile: ProfileForEvidence | null,
): string[] {
  return uniqueEvidenceSignals(
    [
      reportCtx.sectionContext?.profileSummary,
      profile?.narrativeSnapshots?.identitySummary,
      profile?.narrativeSnapshots?.archetypeNarrative,
    ],
    2,
  );
}

function buildExerciseEvidenceSignals(
  exercises: ExercisesForEvidence | null,
): string[] {
  return uniqueEvidenceSignals(
    [
      exercises?.nonNegotiables?.selected?.length
        ? `Career non-negotiables: ${exercises.nonNegotiables.selected.join(", ")}`
        : null,
      exercises?.flowMoments?.moments?.length
        ? `Flow moments: ${exercises.flowMoments.moments
            .map((moment) => moment.description)
            .join("; ")}`
        : null,
      exercises?.energyLog?.entries?.length
        ? `Energy log: ${exercises.energyLog.entries
            .map(
              (entry) =>
                `energizer=${entry.energizer}; drain=${entry.drain}; energy=${entry.overallEnergy}/5`,
            )
            .join(" | ")}`
        : null,
    ],
    3,
  );
}

function buildActionHubEvidenceSignals(
  actionHubContext: ActionHubForEvidence | null,
): string[] {
  if (!actionHubContext) return [];
  return uniqueEvidenceSignals(
    [
      `Action progress: ${actionHubContext.completedItems}/${actionHubContext.totalItems} completed, ${actionHubContext.inProgressItems} in progress`,
      ...actionHubContext.topPendingActions.map(
        (action) => `pending: ${action}`,
      ),
    ],
    3,
  );
}

function buildSessionSummarySignals(
  summaries: { summary: string; openLoops: string[] }[],
): string[] {
  return summaries.map((s) => {
    const loops = s.openLoops.length
      ? ` · open loops: ${s.openLoops.join("; ")}`
      : "";
    return `${s.summary}${loops}`;
  });
}

function withCoachingTurnEval(
  response: Response,
  params: {
    userId: string | null;
    reportId?: string | null;
    round: number;
    locale: string;
    userMessage: string | null;
    turnState: ReturnType<typeof buildCoachingTurnState>;
  },
): Response {
  if (!response.body) return response;

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      chunks.push(decoder.decode(chunk, { stream: true }));
      controller.enqueue(chunk);
    },
    flush() {
      const assistantMessage = chunks.join("") + decoder.decode();
      const qualityRewrite = response.headers.get("X-Coaching-Quality-Rewrite");
      const llmJudgeStatus = response.headers.get("X-Coaching-LLM-Judge");
      const evalResult = evaluateCoachingTurn({
        userMessage: params.userMessage,
        assistantMessage,
        turnState: params.turnState,
      });
      saveCoachingTurnEval({
        userId: params.userId,
        reportId: params.reportId ?? null,
        round: params.round,
        locale: params.locale,
        phase: params.turnState.currentPhase,
        evalResult,
        stateJson: {
          ...params.turnState,
          ...buildCoachingGovernanceState(),
          userMessage: params.userMessage,
          qualityRewrite,
          llmJudgeStatus,
        },
      });
    },
  });

  return new Response(response.body.pipeThrough(transform), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function responseFromText(
  text: string,
  source: Response,
  extraHeaders?: Record<string, string>,
): Response {
  const headers = new Headers(source.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "text/plain; charset=utf-8");
  }
  for (const [key, value] of Object.entries(extraHeaders ?? {})) {
    headers.set(key, value);
  }
  return new Response(text, {
    status: source.status,
    statusText: source.statusText,
    headers,
  });
}

async function buildQualityGatedCoachingResponse(params: {
  coachingTask: "coaching" | "coaching-first";
  openaiMessages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  latestUserMessage: string | null;
  userId: string | null;
  reportId?: string | null;
  round: number;
  turnState: ReturnType<typeof buildCoachingTurnState>;
  turnUnderstanding: CoachingTurnUnderstanding;
  turnUnderstandingV2: Awaited<
    ReturnType<typeof buildCoachingTurnUnderstandingV2>
  >;
  targetLocale: string;
  onStreamError: (err: unknown) => void;
}): Promise<Response> {
  const first = await streamLLM(params.coachingTask, params.openaiMessages, {
    routeName: "/api/coaching-chat",
    onStreamError: params.onStreamError,
  });

  if (!first.ok || !params.latestUserMessage) {
    return first;
  }

  const firstText = await first.text();
  const turnEval = evaluateCoachingTurn({
    userMessage: params.latestUserMessage,
    assistantMessage: firstText,
    turnState: params.turnState,
  });
  const specificityEval = evaluateCoachingSpecificity({
    assistantMessage: firstText,
    turnState: params.turnState,
    understanding: params.turnUnderstanding,
  });
  const runLLMJudge = shouldRunLLMJudge({
    deterministicEval: turnEval,
    specificityEval,
    riskLevel: params.turnUnderstandingV2.riskLevel,
    sampleRate: 0.1,
  });
  const llmJudge = runLLMJudge
    ? await evaluateCoachingTurnWithLLMJudge({
        locale: params.targetLocale,
        userMessage: params.latestUserMessage,
        assistantMessage: firstText,
        turnState: params.turnState,
        understandingV1: params.turnUnderstanding,
        understandingV2: params.turnUnderstandingV2,
      })
    : null;
  const llmJudgeReasons = llmJudge ? buildLLMJudgeRewriteReasons(llmJudge) : [];
  const llmJudgeHeader = runLLMJudge
    ? llmJudge
      ? llmJudgeReasons.length > 0
        ? "fail"
        : "pass"
      : "unavailable"
    : null;
  const hasSafetyMarker =
    firstText.includes("<<CRISIS_ALERT>>") ||
    firstText.includes("<<ANXIETY_ESCALATION>>");
  const shouldRewrite =
    !hasSafetyMarker &&
    (!specificityEval.pass ||
      turnEval.genericSummaryFlag ||
      turnEval.evidenceGroundingScore <= 2 ||
      llmJudgeReasons.length > 0);

  if (!shouldRewrite) {
    return responseFromText(
      firstText,
      first,
      llmJudgeHeader ? { "X-Coaching-LLM-Judge": llmJudgeHeader } : undefined,
    );
  }

  const rewriteReasons = [
    ...turnEval.reasons,
    ...specificityEval.reasons,
    ...llmJudgeReasons,
  ].filter((reason, index, all) => all.indexOf(reason) === index);

  void enqueueCoachingReviewCandidate({
    userId: params.userId,
    reportId: params.reportId ?? null,
    round: params.round,
    locale: params.targetLocale,
    reason: rewriteReasons[0] ?? "quality-gate-failed",
    userMessage: params.latestUserMessage,
    assistantMessage: firstText,
    deterministicEval: turnEval,
    llmJudge,
  }).catch(() => {
    /* non-critical quality telemetry */
  });

  const rewriteInstruction = buildCoachingQualityRewriteInstruction({
    locale: params.targetLocale,
    reasons: rewriteReasons,
    understanding: params.turnUnderstanding,
  });

  const rewritten = await streamLLM(
    params.coachingTask,
    [...params.openaiMessages, { role: "system", content: rewriteInstruction }],
    {
      routeName: "/api/coaching-chat",
      onStreamError: params.onStreamError,
    },
  );

  if (!rewritten.ok) {
    return responseFromText(firstText, first, {
      ...(llmJudgeHeader ? { "X-Coaching-LLM-Judge": llmJudgeHeader } : {}),
      "X-Coaching-Quality-Rewrite": "failed",
    });
  }

  const rewrittenText = await rewritten.text();
  return responseFromText(rewrittenText, rewritten, {
    ...(llmJudgeHeader ? { "X-Coaching-LLM-Judge": llmJudgeHeader } : {}),
    "X-Coaching-Quality-Rewrite": "1",
  });
}

export const POST = withLogging("/api/coaching-chat", async (request) => {
  try {
    const guard = await guardRoute(request, { tier: "ai", requireAuth: true });
    if (guard.blocked) return guard.response;

    // Entitlement gate — cohort access OR Stripe purchase
    const hasCoachingAccess = await canAccessFeature(
      guard.user?.id,
      guard.user?.cohort,
      "aiCoaching",
    );
    if (!hasCoachingAccess) {
      return NextResponse.json(
        {
          error: {
            code: ApiErrorCode.UNAUTHORIZED,
            message: "AI coaching requires a purchase or invite code.",
            timestamp: new Date().toISOString(),
          },
          reason: "invite_required",
        },
        { status: 403 },
      );
    }

    const parsed = await parseBody(request, coachingChatSchema);
    if ("error" in parsed) return parsed.error;
    const {
      messages,
      answers,
      reportSummary,
      reportId,
      round,
      maxRounds,
      sessionId,
      locale,
      behaviorInsight,
      triggerContext: rawTriggerContext,
      correctionSignal,
      actionHubContext,
      ageConfirmed,
    } = parsed.data;
    const targetLocale = isValidLocale(locale) ? locale : defaultLocale;

    // Age gate — require explicit confirmation for coaching access
    if (!ageConfirmed) {
      return NextResponse.json(
        {
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: "Age confirmation required for coaching.",
            timestamp: new Date().toISOString(),
          },
          reason: "age_gate",
        },
        { status: 403 },
      );
    }

    // Guard against excessive context length (100 msgs × 4000 chars = 400K potential)
    const totalContentLen = messages.reduce(
      (sum, m) => sum + m.content.length,
      0,
    );
    if (totalContentLen > 120_000) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Message history too large. Please start a new session.",
        400,
      );
    }

    // Sanitize triggerContext to prevent prompt injection (user-controllable field)
    const triggerContext = rawTriggerContext
      ? sanitizeField(rawTriggerContext, 200)
      : null;
    const turnState = buildCoachingTurnState(messages);
    const deterministicTurnUnderstanding =
      buildCoachingTurnUnderstanding(messages);
    let turnUnderstanding = deterministicTurnUnderstanding;
    const latestUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? null;

    // ── Coach access gate (authenticated users only) ──────────────────────────
    let coachState: 1 | 2 | undefined;
    let primaryRiasecType: string | null = null;
    // Remaining rounds for State 1 users — sent as X-Remaining-Rounds header
    let remainingRounds: number | null = null;
    if (guard.user?.id) {
      try {
        const access = await getCoachAccessLevel(guard.user.id, sessionId);
        if (access.level === 0) {
          return NextResponse.json(
            {
              error: {
                code: ApiErrorCode.UNAUTHORIZED,
                message: "Complete Quick Dive to unlock AI coaching.",
                timestamp: new Date().toISOString(),
              },
              reason: "quickdive_required",
              redirectTo: `/${targetLocale}/quickdive`,
            },
            { status: 403 },
          );
        }
        if (access.level === 1 && access.maxRounds !== null) {
          // completedRounds = rounds persisted from past sessions
          // round = current user turn number in the active session
          if (access.completedRounds + round > access.maxRounds) {
            return NextResponse.json(
              {
                error: {
                  code: ApiErrorCode.RATE_LIMITED,
                  message:
                    "You have used all coaching rounds available at this stage. Complete Deep Dive to unlock unlimited coaching.",
                  timestamp: new Date().toISOString(),
                },
                reason: "rounds_exhausted",
                redirectTo: `/${targetLocale}/deepdive`,
              },
              { status: 403 },
            );
          }
          // Remaining rounds after this AI response (frontend uses this to update UI)
          remainingRounds = access.maxRounds - access.completedRounds - round;
        }
        // Pass access level info to prompt builder
        coachState = access.level === 1 ? 1 : 2;
        primaryRiasecType = access.primaryRiasecType;
      } catch (accessErr) {
        logApiError("/api/coaching-chat", ApiErrorCode.INTERNAL_ERROR, {
          userId: guard.user.id,
          message: "Failed to check coach access level",
          cause: accessErr,
        });
        // Return retryable error instead of silently degrading service
        return createErrorResponse(
          ApiErrorCode.INTERNAL_ERROR,
          "Unable to verify coaching access. Please try again.",
          503,
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const turnUnderstandingV2 = await buildCoachingTurnUnderstandingV2({
      messages,
      locale: targetLocale,
      fallback: deterministicTurnUnderstanding,
    });
    turnUnderstanding = coachingTurnUnderstandingV2ToV1(
      turnUnderstandingV2,
      deterministicTurnUnderstanding,
    );

    const promptMaxRounds = coachState === 1 ? maxRounds : 1000;

    let previousSessionState: CoachingSessionState | null = null;
    if (guard.user?.id) {
      try {
        const existingSession = await getCoachingSessionForUser(
          sessionId,
          guard.user.id,
        );
        const storedState = existingSession?.stateJson;
        if (
          storedState &&
          typeof storedState === "object" &&
          "mode" in storedState
        ) {
          previousSessionState = storedState as CoachingSessionState;
        }
      } catch (stateError) {
        logApiError("/api/coaching-chat", ApiErrorCode.INTERNAL_ERROR, {
          userId: guard.user.id,
          message: "Failed to load coaching session state",
          cause: stateError,
        });
      }
    }

    const turnAnalysis = analyzeCoachingTurn({
      messages,
      previousState:
        previousSessionState ?? createInitialCoachingSessionState(),
      correctionSignal: correctionSignal ?? null,
    });
    const coachingV2Rollout = resolveCoachingV2Rollout({ sessionId });
    turnAnalysis.state.strategyVersion = coachingV2Rollout.variant;

    // Fetch user memories, profile, exercises, and reality conditions in parallel
    // All are non-blocking — fall back to defaults on failure
    let userMemories: UserMemory[] = [];
    let profileData = null;
    let exercisesData: Awaited<ReturnType<typeof getExercises>> = null;
    let rcData: Awaited<ReturnType<typeof getRealConditionsByUserId>> = null;
    let resumeMatch: Awaited<
      ReturnType<typeof getLatestActiveResumeMatchForUser>
    > = null;

    if (guard.user?.id) {
      try {
        const [memories, [profile, exercises], rc, latestResumeMatch] =
          await Promise.all([
            // Wider candidate pool (40, was 15) so selectRelevantMemories
            // below can surface high-relevance long-tail memories that a
            // Top-15 prefilter by confidence would otherwise drop.
            getUserMemories(guard.user.id, { limit: 40 }).catch(
              (err: unknown) => {
                console.warn(
                  "[coaching-chat] Failed to fetch user memories:",
                  err instanceof Error ? err.message : err,
                );
                return [] as UserMemory[];
              },
            ),
            Promise.all([
              getProfile(guard.user.id),
              getExercises(guard.user.id).catch(() => null),
            ]).catch(() => [null, null] as const),
            getRealConditionsByUserId(guard.user.id).catch(() => null),
            getLatestActiveResumeMatchForUser(guard.user.id).catch(() => null),
          ]);
        userMemories = memories;
        profileData = profile;
        exercisesData = exercises;
        rcData = rc;
        resumeMatch = latestResumeMatch;
      } catch {
        /* non-critical — all fallback to defaults */
      }
    }
    // Hybrid semantic + keyword retrieval (RRF). Falls back to keyword-only
    // selectRelevantMemories when embeddings are unavailable (kill switch, no
    // OpenAI key, pre-backfill, or API error) — semantic retrieval is additive.
    const hybridMemories = guard.user?.id
      ? await retrieveMemoriesHybrid(
          guard.user.id,
          userMemories,
          turnState,
          latestUserMessage ?? "",
          8,
        )
      : null;
    userMemories =
      hybridMemories ??
      selectRelevantMemories(
        userMemories,
        turnState,
        latestUserMessage ?? "",
        8,
      );

    // Detect reality conditions status. reportCtx.hasRealityConditions reads
    // from the snapshot stored in the report at generation time, which can be
    // stale (user may have filled or cleared RC after report was generated).
    // The LATEST rcData fetched above is the source of truth — use it to
    // override the stale flag so the prompt's "User has provided real-world
    // conditions" line is consistent with the realConditionsContext block
    // we build below. (Codex audit 2026-05-18: prompt could carry both
    // "User has NOT provided RC" and a full RC details block at once.)
    const reportCtx = parseReportContext(reportSummary ?? null, profileData);
    const hasRealityConditions = !!rcData || reportCtx.hasRealityConditions;

    // Build full reality-conditions context (visa/family/salary/location/pressure)
    // for the coaching prompt. Helper handles both populated and null cases:
    //  - populated → emits a constraint block + "ground every suggestion, never
    //    re-ask" directive so the coach uses what the user already filled.
    //  - null → emits an invitation fallback (round 1 = no probing, rounds 2-3
    //    may gently invite 1-2 questions about practical situation).
    // Wrapped in try/catch because coaching prompt construction must never
    // crash on a malformed rcData payload.
    let realConditionsContext: string | null = null;
    let rcMeta: RealConditionsContextResult | null = null;
    try {
      rcMeta = buildRealConditionsContextBlock(
        rcData,
        targetLocale,
        "coaching",
      );
      realConditionsContext = rcMeta.block;
    } catch (err) {
      console.warn(
        "[coaching-chat] Failed to build realConditionsContext:",
        err instanceof Error ? err.message : err,
      );
    }

    // Phase F observability: record RC injection state for this coaching call
    // so production SQL can verify the audit-driven prompt fix is active.
    // Split taskName by round: round 1 maps to the `coaching-first` LLM task
    // (Haiku, faster TTFB on the greeting) while rounds 2+ go through
    // `coaching` (Sonnet). Tagging them separately lets RC-injection
    // dashboards distinguish first-impression vs deepening turns.
    if (rcMeta) {
      logLLMPromptMeta({
        taskName: round === 1 ? "coaching-first" : "coaching",
        userId: guard.user?.id ?? null,
        locale: targetLocale,
        realConditionsProvided: rcMeta.provided,
        realConditionsFieldCount: rcMeta.fieldCount,
      });
    }

    // Extract Big Five facet context from profile algoSnapshot
    let facetContext: {
      top5: Array<{ facet: string; label: string; score: number }>;
      bottom5: Array<{ facet: string; label: string; score: number }>;
    } | null = null;
    if (
      profileData?.algoSnapshot?.bigFiveFacets &&
      profileData.algoSnapshot.bigFivePrecision !== "screening"
    ) {
      const facets = profileData.algoSnapshot.bigFiveFacets as Record<
        string,
        number
      >;
      const sorted = Object.entries(facets).sort((a, b) => b[1] - a[1]);
      const formatLabel = (key: string) =>
        key.replace(/^[A-Z]\d_/, "").replace(/_/g, " ");
      facetContext = {
        top5: sorted
          .slice(0, 5)
          .map(([k, v]) => ({ facet: k, label: formatLabel(k), score: v })),
        bottom5: sorted
          .slice(-5)
          .reverse()
          .map(([k, v]) => ({ facet: k, label: formatLabel(k), score: v })),
      };
    }

    // Load longitudinal coaching themes (cross-session memory)
    let themeContext = "";
    let relevantThemesForEvidence: CoachingTheme[] = [];
    let coachingHypotheses: CoachingHypothesisForPrompt[] = [];
    let personaConfig: {
      coachingStyle: "supportive" | "balanced" | "challenging";
      communicationStyle: "warm" | "professional";
      responseDetail: "brief" | "balanced" | "thorough";
    } | null = null;
    let coachUserName: string | null = null;
    if (guard.user?.id) {
      const userId = guard.user.id;
      try {
        const [{ getActiveThemes }, { buildThemeContextSection }] =
          await Promise.all([
            import("@/lib/db/coaching-themes"),
            import("@/lib/coaching/extract-themes"),
          ]);
        const themes: CoachingTheme[] = await getActiveThemes(userId, 10);
        const relevantThemes = selectRelevantThemes(
          themes,
          turnState,
          latestUserMessage ?? "",
          8,
        );
        relevantThemesForEvidence = relevantThemes;
        themeContext = buildThemeContextSection(relevantThemes, targetLocale);
      } catch {
        /* non-critical */
      }

      try {
        const hypothesisRows = await getOpenCoachingHypotheses(userId, 20);
        coachingHypotheses = selectRelevantHypotheses(
          hypothesisRows.map(toPromptHypothesis),
          latestUserMessage ?? "",
          3,
        );
      } catch {
        /* non-critical */
      }

      // Load coach persona preferences + user name
      try {
        const rows = await (
          await import("@/lib/db/connection")
        ).sql`SELECT "coachPersona", "name" FROM "User" WHERE "id" = ${userId}`;
        coachUserName = (rows[0]?.name as string) || null;
        const p = rows[0]?.coachPersona as {
          coachingStyle?: string;
          communicationStyle?: string;
          responseDetail?: string;
        } | null;
        if (p?.coachingStyle) {
          personaConfig = {
            coachingStyle:
              (p.coachingStyle as "supportive" | "balanced" | "challenging") ??
              "balanced",
            communicationStyle:
              (p.communicationStyle as "warm" | "professional") ?? "warm",
            responseDetail:
              (p.responseDetail as "brief" | "balanced" | "thorough") ??
              "balanced",
          };
        }
      } catch {
        /* non-critical */
      }
    }

    // Phase 4 longitudinal memory: inject recent session summaries so the coach
    // continues with cross-session context (the evidence packet already
    // reserves a session_summary slot). Fail-soft to [] on any error.
    const recentSummaries = guard.user?.id
      ? await getRecentSummaries(guard.user.id, 3).catch(() => [])
      : [];

    const coachingEvidencePacket = buildCoachingContextEvidencePacket({
      latestUserMessage: latestUserMessage ?? "",
      userMemorySignals: buildMemoryEvidenceSignals(userMemories),
      themeSignals: buildThemeEvidenceSignals(relevantThemesForEvidence),
      hypotheses: coachingHypotheses,
      reportSignals: buildReportEvidenceSignals(reportCtx),
      profileNarratives: buildProfileEvidenceSignals(reportCtx, profileData),
      realityConstraints:
        rcMeta?.provided && realConditionsContext
          ? [realConditionsContext]
          : [],
      exerciseSignals: buildExerciseEvidenceSignals(exercisesData),
      actionHubSignals: buildActionHubEvidenceSignals(actionHubContext ?? null),
      recentSessionSummaries: buildSessionSummarySignals(recentSummaries),
      maxItems: 14,
    });

    // Round Zero immersive completion gate — only inject companion narrative
    // context if the user actually walked the immersive ensemble. archetypeCode
    // exists for classic Quick Dive too, so it cannot be the gating signal.
    let walkedRoundZero = false;
    if (guard.user?.id) {
      try {
        const rows = await dbSql<{ exploreMode: string | null }>`
          SELECT "exploreMode" FROM "QuickDiveResult"
          WHERE "userId" = ${guard.user.id}
          ORDER BY "createdAt" DESC
          LIMIT 1
        `;
        walkedRoundZero = isImmersiveExploreMode(rows[0]?.exploreMode);
      } catch {
        /* non-critical — default to false (safe: no companion context injected) */
      }
    }

    // Build system prompt split into cached (session-stable) and volatile (per-turn) parts.
    // Anthropic caches the first system block; the second changes each turn.
    const [cachedPrefix, volatileSuffix] = buildCoachingSystemPromptParts({
      locale: targetLocale,
      round,
      maxRounds: promptMaxRounds,
      reportSummary: reportSummary ?? null,
      memories: userMemories,
      answers: (answers && !Array.isArray(answers) ? answers : null) as Record<
        string,
        unknown
      > | null,
      behaviorInsight: behaviorInsight ?? null,
      triggerContext: triggerContext ?? null,
      hasRealityConditions,
      coachState,
      primaryRiasecType,
      actionHubContext: actionHubContext ?? null,
      realConditionsContext,
      resumeEvidenceContext: buildResumeEvidenceContext(
        resumeMatch,
        targetLocale,
      ),
      exercisesContext: exercisesData
        ? {
            nonNegotiables: exercisesData.nonNegotiables
              ? { selected: exercisesData.nonNegotiables.selected }
              : null,
            flowMoments: exercisesData.flowMoments
              ? { moments: exercisesData.flowMoments.moments }
              : null,
            energyLog: exercisesData.energyLog
              ? { entries: exercisesData.energyLog.entries }
              : null,
          }
        : null,
      facetContext,
      persona: personaConfig,
      archetypeLabel: profileData?.archetype
        ? `${getLocalizedField(profileData.archetype, "label", targetLocale)}: ${getLocalizedField(
            profileData.archetype,
            "tagline",
            targetLocale,
          )}`
        : null,
      archetypeCode: profileData?.archetype?.code ?? null,
      // 2026-05-12 (codex audit fix): pass profile narrative context so the
      // coach prompt's parseReportContext call can inject identitySummary +
      // archetypeNarrative. Previously these were fetched into profileData
      // but never reached the prompt builder — only archetypeLabel made it
      // through, so the coach saw the user's archetype name but not the
      // 2-3 sentence "this is who you are" paragraph.
      profileContext: profileData
        ? {
            archetype: profileData.archetype
              ? {
                  label_en: profileData.archetype.label_en,
                  tagline_en: profileData.archetype.tagline_en,
                }
              : undefined,
            cognitiveStyleCode: profileData.cognitiveStyleCode ?? null,
            narrativeSnapshots: profileData.narrativeSnapshots
              ? {
                  archetypeNarrative:
                    profileData.narrativeSnapshots.archetypeNarrative,
                  identitySummary:
                    profileData.narrativeSnapshots.identitySummary,
                }
              : undefined,
          }
        : null,
      userName: coachUserName,
      walkedRoundZero,
      coachingTurnState: turnState,
      coachingTurnUnderstanding: turnUnderstanding,
      coachingTurnUnderstandingV2: turnUnderstandingV2,
      coachingHypotheses,
      coachingEvidencePacket,
      turnUnderstanding: turnAnalysis.understanding,
      coachingSessionState: turnAnalysis.state,
      needsConversationRepair: turnAnalysis.needsRepair,
      conversationV2Enabled: coachingV2Rollout.promptEnabled,
      careerKnowledgeVersionDate:
        process.env.COACHING_KNOWLEDGE_VERSION_DATE ?? "2026-06-10",
    });

    // Assemble message array with two system blocks for layered Anthropic caching:
    // Block 1 (cached): persona + rules + user context + theme context
    // Block 2 (not cached): round instructions + challenge gradient (changes each turn)
    const openaiMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      { role: "system", content: cachedPrefix + themeContext },
      ...(volatileSuffix
        ? [{ role: "system" as const, content: volatileSuffix }]
        : []),
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: sanitizeField(m.content, 4000),
      })),
    ];

    // For initialization (no user messages yet), add a greeting prompt
    if (messages.length === 0) {
      // When trigger context is provided (user clicked a panel CTA), include it
      const baseGreeting = L(
        {
          en: "Hi, I just finished reading my career report and would like to chat about it.",
          zh: "你好，我刚看完我的职业报告，想和你聊聊。",
          nl: "Hoi, ik heb net mijn loopbaanrapport gelezen en wil er graag over praten.",
          de: "Hallo, ich habe gerade meinen Karrierebericht gelesen und würde gerne darüber sprechen.",
          fr: "Bonjour, je viens de lire mon rapport de carrière et j'aimerais en discuter.",
          es: "Hola, acabo de leer mi informe profesional y me gustaría hablar al respecto.",
          pt: "Olá, acabei de ler meu relatório de carreira e gostaria de conversar sobre isso.",
          it: "Ciao, ho appena letto il mio report di carriera e vorrei parlarne.",
          ru: "Привет, я только что прочитал(а) свой карьерный отчёт и хотел(а) бы обсудить его.",
          ja: "こんにちは、キャリアレポートを読み終えたので、それについて話したいです。",
          ko: "안녕하세요, 방금 커리어 리포트를 다 읽었는데 이에 대해 이야기하고 싶습니다.",
        },
        targetLocale,
      );
      const greeting = triggerContext
        ? `${baseGreeting}\n\n[${triggerContext}]`
        : baseGreeting;
      openaiMessages.push({
        role: "user",
        content: greeting,
      });
    }

    // First impression quality matters more for full Deep Dive users than the
    // fastest possible TTFB: a shallow opener damages trust. Keep the cheaper
    // `coaching-first` path for limited Quick Dive users, but use the deeper
    // `coaching` task for State 2 from the first visible turn onward.
    const coachingTask =
      messages.length === 0 && coachState === 1 ? "coaching-first" : "coaching";

    const streamResponse = await buildQualityGatedCoachingResponse({
      coachingTask,
      openaiMessages,
      latestUserMessage,
      userId: guard.user?.id ?? null,
      reportId: reportId ?? null,
      round,
      turnState,
      turnUnderstanding,
      turnUnderstandingV2,
      targetLocale,
      onStreamError: (err) => {
        logApiError("/api/coaching-chat", ApiErrorCode.AI_SERVICE_ERROR, {
          message: "Stream error",
          cause: err,
        });
      },
    });

    // If the LLM returned an error response, pass it through without header manipulation
    if (!streamResponse.ok) {
      return streamResponse;
    }

    if (guard.user?.id && latestUserMessage && round === maxRounds) {
      const followUpAction = buildSevenDayCoachingAction({
        locale: targetLocale,
        latestUserMessage,
        understandingV2: turnUnderstandingV2,
      });
      void createCoachingActionForActivePlan({
        userId: guard.user.id,
        ...followUpAction,
      }).catch(() => {
        /* non-critical action-loop persistence */
      });
    }

    // Language guard (stream): tee the body and observe the first ~600 chars
    // for locale drift. Non-interfering — user tokens flow through unchanged.
    // Sentry fires a warning if the coach replies in the wrong language;
    // mid-stream regenerate is intentionally out of scope (see
    // lib/coaching/stream-language-observer.ts header for rationale).
    const observedResponse = observeStreamLocale(streamResponse, targetLocale, {
      feature: "coaching",
      taskId: coachingTask,
      routeName: "/api/coaching-chat",
    });
    const evaluatedResponse = withCoachingTurnEval(observedResponse, {
      userId: guard.user?.id ?? null,
      reportId: reportId ?? null,
      round,
      locale: targetLocale,
      userMessage: latestUserMessage,
      turnState,
    });

    const persistedResponse =
      guard.user?.id && evaluatedResponse.body
        ? persistCoachingStream({
            response: evaluatedResponse,
            sessionId,
            userId: guard.user.id,
            reportId: reportId ?? null,
            requestMessages: messages,
            state: turnAnalysis.state,
            understanding: turnAnalysis.understanding,
            correctionSignal:
              correctionSignal ??
              (turnAnalysis.needsRepair ? "message_text" : null),
            needsRepair: turnAnalysis.needsRepair,
            locale: targetLocale,
            round,
            maxRounds: promptMaxRounds,
          })
        : evaluatedResponse;

    // For State 1 users, attach remaining rounds so the frontend can update its UI
    if (remainingRounds !== null) {
      const headers = new Headers(persistedResponse.headers);
      headers.set("X-Remaining-Rounds", String(remainingRounds));
      headers.set("X-Coaching-Session-Id", sessionId);
      headers.set("X-Coaching-Mode", turnAnalysis.state.mode);
      headers.set("X-Coaching-V2-Variant", coachingV2Rollout.variant);
      return new Response(persistedResponse.body, {
        status: persistedResponse.status,
        headers,
      });
    }

    const headers = new Headers(persistedResponse.headers);
    headers.set("X-Coaching-Session-Id", sessionId);
    headers.set("X-Coaching-Mode", turnAnalysis.state.mode);
    headers.set("X-Coaching-V2-Variant", coachingV2Rollout.variant);
    return new Response(persistedResponse.body, {
      status: persistedResponse.status,
      headers,
    });
  } catch (error) {
    logApiError("/api/coaching-chat", ApiErrorCode.INTERNAL_ERROR, {
      message: "Unexpected error in coaching chat",
      cause: error,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "An unexpected error occurred. Please try again.",
      500,
    );
  }
});

function persistCoachingStream(params: {
  response: Response;
  sessionId: string;
  userId: string;
  reportId: string | null;
  requestMessages: Array<{ role: "user" | "assistant"; content: string }>;
  state: CoachingSessionState;
  understanding: TurnUnderstanding;
  correctionSignal: CoachingCorrectionSignal | "message_text" | null;
  needsRepair: boolean;
  locale: string;
  round: number;
  maxRounds: number;
}): Response {
  const reader = params.response.body!.getReader();
  const decoder = new TextDecoder();
  let assistantContent = "";

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          const hasActionDraft =
            /<<ACTION_DRAFT>>[\s\S]*?<<\/ACTION_DRAFT>>/.test(assistantContent);
          const persistedAssistantContent =
            sanitizePersistedAssistantContent(assistantContent);
          const messages = persistedAssistantContent
            ? [
                ...params.requestMessages,
                {
                  role: "assistant" as const,
                  content: persistedAssistantContent,
                },
              ]
            : params.requestMessages;
          try {
            await saveCoachingSession({
              id: params.sessionId,
              userId: params.userId,
              reportId: params.reportId,
              roundNumber: messages.filter((message) => message.role === "user")
                .length,
              maxRounds: params.maxRounds,
              messagesJson: JSON.stringify(messages),
              sessionType: "coaching",
              mode: params.state.mode,
              stateJson: params.state,
              locale: params.locale,
              status: "active",
            });
            const turnNumber = params.requestMessages.filter(
              (message) => message.role === "user",
            ).length;
            if (turnNumber > 0) {
              await saveCoachingTurnAudit({
                sessionId: params.sessionId,
                userId: params.userId,
                turnNumber,
                strategyVersion: params.state.strategyVersion,
                mode: params.state.mode,
                understanding: params.understanding,
                correctionSignal: params.correctionSignal,
                needsRepair: params.needsRepair,
                assistantResponseLength: persistedAssistantContent.length,
                hasActionDraft,
                hasRecommendation:
                  params.state.mode === "decide" &&
                  hasRecommendationSignal(persistedAssistantContent),
              });
            }
          } catch (saveError) {
            logApiError("/api/coaching-chat", ApiErrorCode.INTERNAL_ERROR, {
              userId: params.userId,
              message: "Failed to persist coaching turn",
              cause: saveError,
            });
          }
          controller.close();
          return;
        }
        if (value) {
          assistantContent += decoder.decode(value, { stream: true });
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      return reader.cancel();
    },
  });

  return new Response(body, {
    status: params.response.status,
    statusText: params.response.statusText,
    headers: params.response.headers,
  });
}

function hasRecommendationSignal(content: string): boolean {
  return /\b(?:recommend|recommendation|my view|choose|prefer|should)\b|建议|推荐|我倾向|更适合|选择|应该/iu.test(
    content,
  );
}

function sanitizePersistedAssistantContent(content: string): string {
  return content
    .replace(/<<QUICK_REPLIES>>\s*\[[\s\S]*?\]\s*<<\/QUICK_REPLIES>>/g, "")
    .replace(/<<ACTION_DRAFT>>[\s\S]*?<<\/ACTION_DRAFT>>/g, "")
    .replace(
      /<<(?:CRISIS_ALERT|ANXIETY_ESCALATION|CRISIS|AI_ANXIETY)(?:_SIGNAL)?>>/g,
      "",
    )
    .trim();
}
