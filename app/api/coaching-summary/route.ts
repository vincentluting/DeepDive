// ============================================================
// POST /api/coaching-summary — Save coaching session & extract insights + memories
// Input:  { reportId?: string, messages: Array<{role, content}>, locale?: Locale }
// Output: { success: true, sessionId: string, insights?: object, memories?: MemoryEntry[] }
// ============================================================

export const maxDuration = 30;

import { type NextRequest, NextResponse } from "next/server";
import {
  getCoachingSessionForUser,
  saveCoachingSession,
  markCoachingSessionSaved,
} from "@/lib/db/coaching";
import {
  getUserProfileInsights,
  updateUserProfileInsights,
} from "@/lib/db/profiles";
import {
  getUserMemories,
  saveMemories,
  reinforceMemoryConfidence,
} from "@/lib/db/memory";

import { getCurrentUser } from "@/lib/auth";
import { callLLM } from "@/lib/ai/model-router";
import { logLLMQualityCheck } from "@/lib/db/llm-usage";
import { extractJSON } from "@/lib/ai/structured-output";
import { sanitizeField } from "@/lib/ai/prompt-sanitization";
import { enforceOutputLocale } from "@/lib/report-generation/language-guard";
import { detectLanguageMismatch } from "@/lib/i18n/language-detect";
import { checkAchievements } from "@/lib/achievements/engine";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { coachingSummarySchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import type { MemoryEntry } from "@/lib/types/memory";
import { withLogging } from "@/lib/api/with-logging";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { extractAndSaveThemes } from "@/lib/coaching/extract-themes";
import { summarizeAndStoreSession } from "@/lib/coaching/session-summary";
import { invalidateUserCache } from "@/lib/db/cached";
import { recomputeUserContext } from "@/lib/db/user-context";
import { localeLanguageNames, type Locale } from "@/lib/i18n/config";
import type { CoachingSessionState } from "@/lib/coaching/conversation-router";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  kind?: "message" | "correction";
}

interface CoachingInsight {
  insight: string;
  discoveredAt: string;
}

interface TensionUpdate {
  tension: string;
  newStatus: string;
}

interface RawMemory {
  category?: string;
  keyword?: string;
  insight?: string;
  confidence?: number;
  source?: string;
}

interface ExtractedData {
  coachingInsights?: CoachingInsight[];
  tensionUpdates?: TensionUpdate[];
  memories?: RawMemory[];
  reinforcedKeywords?: string[];
}

interface ProfileTension {
  tension: string;
  status?: string;
}

function buildMergedPrompt(
  locale: string,
  existingKeywords?: string[],
): string {
  const now = new Date().toISOString();

  if (locale === "zh") {
    return `你是一位资深心理分析师。从以下教练对话中提取两部分信息。返回 JSON 格式：

{
  "coachingInsights": [
    {"insight": "对话中发现的关键洞察", "discoveredAt": "${now}"}
  ],
  "tensionUpdates": [
    {"tension": "讨论的张力名称", "newStatus": "exploring|managed"}
  ],
  "memories": [
    {
      "category": "coaching_insight",
      "keyword": "2-6字中文标签",
      "insight": "15-40字的洞察句，第三人称",
      "confidence": 0.7
    }
  ],
  "reinforcedKeywords": ["已被用户确认的记忆关键词"]
}

规则：
- coachingInsights: 提取对话中发现的关键职业洞察
- tensionUpdates: 如果对话讨论了某个张力的进展，更新其状态
- memories: 提取1-3条用户在对话中主动表达的新信息（不是报告中已有的内容）
- 标记为 [interaction correction] 的消息只表示用户希望调整当前沟通方式，不得提取为长期记忆、人格特征或职业洞察
- reinforcedKeywords: 从已有记忆关键词列表中，找出用户在对话中明确肯定、确认或深入讨论的关键词。例如用户说"对，我确实很看重这个"或"没错，这就是我"。如果没有被确认的记忆，返回空数组 []
- 如果没有新的记忆值得提取，memories 返回空数组 []
- 只返回 JSON，不要其他文字${existingKeywords && existingKeywords.length > 0 ? `\n\n用户已有以下记忆关键词，不要重复提取相似内容，但请从中识别被用户确认的关键词放入 reinforcedKeywords：\n${existingKeywords.join(", ")}` : ""}`;
  }

  if (locale !== "en") {
    const langName = localeLanguageNames[locale as Locale] ?? locale;
    const deduplicationNote =
      existingKeywords && existingKeywords.length > 0
        ? `\n\nThe user already has memories with these keywords. Do NOT extract similar or overlapping content, but DO identify confirmed keywords for reinforcedKeywords:\n${existingKeywords.join(", ")}`
        : "";

    return `You are a senior psychological analyst. Extract two types of information from this coaching conversation. Return JSON only.

## Output Language Enforcement
- Every user-visible JSON string MUST be written entirely in ${langName}.
- The coaching transcript may contain Chinese, English, Dutch, or another language. Understand it internally, then rewrite all extracted insights in natural ${langName}.
- Never mirror the user's language when it differs from ${langName}.
- Controlled enum values must remain exactly as specified: "exploring", "managed", and "coaching_insight".

{
  "coachingInsights": [
    {"insight": "Key insight discovered in ${langName}", "discoveredAt": "${now}"}
  ],
  "tensionUpdates": [
    {"tension": "Name of tension discussed in ${langName}", "newStatus": "exploring|managed"}
  ],
  "memories": [
    {
      "category": "coaching_insight",
      "keyword": "2-6 word ${langName} tag",
      "insight": "15-40 word ${langName} insight sentence, third person",
      "confidence": 0.7
    }
  ],
  "reinforcedKeywords": ["existing memory keywords confirmed by user"]
}

Rules:
- coachingInsights: Extract key career insights discovered during the conversation
- tensionUpdates: If a tension's progress was discussed, update its status
- memories: Extract 1-3 new insights the user actively shared (not content already in their report)
- Messages marked [interaction correction] only adjust the current interaction. Never extract them as long-term memories, personality traits, or career insights.
- reinforcedKeywords: From the existing memory keywords list, identify any that the user explicitly affirmed, confirmed, or discussed in depth during the conversation. If none were confirmed, return empty array []
- If no new memories worth extracting, return empty array [] for memories
- Return only JSON, no other text${deduplicationNote}`;
  }

  const deduplicationNote =
    existingKeywords && existingKeywords.length > 0
      ? `\n\nThe user already has memories with these keywords — do NOT extract similar or overlapping content:\n${existingKeywords.join(", ")}`
      : "";

  return `You are a senior psychological analyst. Extract two types of information from this coaching conversation. Return JSON only:

{
  "coachingInsights": [
    {"insight": "Key insight discovered", "discoveredAt": "${now}"}
  ],
  "tensionUpdates": [
    {"tension": "Name of tension discussed", "newStatus": "exploring|managed"}
  ],
  "memories": [
    {
      "category": "coaching_insight",
      "keyword": "2-6 word tag",
      "insight": "15-40 word insight sentence, third person",
      "confidence": 0.7
    }
  ],
  "reinforcedKeywords": ["existing memory keywords confirmed by user"]
}

Rules:
- coachingInsights: Extract key career insights discovered during the conversation
- tensionUpdates: If a tension's progress was discussed, update its status
- memories: Extract 1-3 new insights the user actively shared (not content already in their report)
- Messages marked [interaction correction] only adjust the current interaction. Never extract them as long-term memories, personality traits, or career insights.
- reinforcedKeywords: From the existing memory keywords list, identify any that the user explicitly affirmed, confirmed, or discussed in depth during the conversation. E.g. user says "Yes, that's exactly me" or "You're right, I do value that". If none were confirmed, return empty array []
- If no new memories worth extracting, return empty array [] for memories
- Return only JSON, no other text${deduplicationNote ? deduplicationNote.replace("do NOT extract similar or overlapping content:", "do NOT extract similar or overlapping content, but DO identify confirmed keywords for reinforcedKeywords:") : ""}`;
}

function validateMemories(
  rawMemories: RawMemory[],
  messageCount: number,
): MemoryEntry[] {
  return rawMemories
    .filter((m) => m.keyword && m.insight)
    .map((m) => ({
      category: "coaching_insight" as const,
      keyword: m.keyword!.slice(0, 20),
      insight: m.insight!.slice(0, 200),
      source: "coaching" as const,
      confidence:
        typeof m.confidence === "number"
          ? Math.min(0.9, Math.max(0.5, m.confidence))
          : 0.75,
      metadata: { extractedAt: new Date().toISOString(), messageCount },
    }))
    .slice(0, 3);
}

export const POST = withLogging(
  "/api/coaching-summary",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "ai",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, coachingSummarySchema);
      if ("error" in parsed) return parsed.error;
      const { sessionId, reportId, messages, locale } = parsed.data;

      const user = await getCurrentUser();
      const userId = user?.id ?? guard.user!.id;
      const existingSession = await getCoachingSessionForUser(
        sessionId,
        userId,
      ).catch(() => null);
      const existingState =
        existingSession?.stateJson &&
        typeof existingSession.stateJson === "object" &&
        "mode" in existingSession.stateJson
          ? (existingSession.stateJson as CoachingSessionState)
          : null;

      // Save coaching session to DB
      const userMessageCount = messages.filter(
        (m: ChatMessage) => m.role === "user",
      ).length;
      try {
        await saveCoachingSession({
          id: sessionId,
          userId,
          reportId: reportId || null,
          roundNumber: userMessageCount,
          maxRounds: 10,
          messagesJson: JSON.stringify(messages),
          sessionType: "coaching",
          mode: existingSession?.mode ?? "explore",
          stateJson: existingState,
          locale,
          status: "completed",
        });
      } catch (dbErr) {
        logApiError(
          "/api/coaching-summary",
          ApiErrorCode.DB_CONSTRAINT_FAILED,
          {
            userId,
            message: "Failed to save coaching session",
            cause: dbErr,
          },
        );
        return NextResponse.json(
          {
            success: false,
            sessionId,
            error: "Failed to save coaching session",
          },
          { status: 500 },
        );
      }

      // Extract and save coaching themes for longitudinal memory (fire-and-forget)
      if (userId) {
        void extractAndSaveThemes(userId, messages).catch(() => {});
      }

      // Track coaching completion (fire-and-forget)
      trackFunnelEvent("coaching_completed", {
        userId,
        metadata: { sessionId, reportId, rounds: userMessageCount, locale },
        idempotencyKey: `coaching_done:${sessionId}`,
      }).catch(() => {});

      // If user is logged in, update their profile with coaching insights + extract memories
      if (userId) {
        // Phase 2 quality gate observability — snapshot before LLM call.
        const qualityWindowStart = Date.now();
        try {
          const transcript = messages
            .map(
              (m: ChatMessage) =>
                `${m.role}${m.kind === "correction" ? " [interaction correction]" : ""}: ${sanitizeField(m.content)}`,
            )
            .join("\n\n");

          // Fetch existing memory keywords to avoid duplicate extraction
          const existingMemories = await getUserMemories(userId);
          const existingKeywords = existingMemories.map((m) => m.keyword);

          const responseText = await callLLM(
            "coaching-summary",
            [
              {
                role: "system",
                content: buildMergedPrompt(locale, existingKeywords),
              },
              { role: "user", content: transcript },
            ],
            { responseFormat: "json" },
          );

          const extractedRaw = extractJSON(responseText) as ExtractedData;

          // Language guard: filter out items whose text doesn't match target locale.
          // These outputs are rendered in UI (insights panel) AND persisted to DB —
          // locale-mismatched items would poison both the dashboard and subsequent
          // coaching prompts that re-ingest them.
          const extracted = await enforceOutputLocale(extractedRaw, locale, {
            taskId: "coaching-summary",
            sanitize: (output) => ({
              ...output,
              coachingInsights: (output.coachingInsights ?? []).filter(
                (ci) =>
                  typeof ci.insight === "string" &&
                  !detectLanguageMismatch(ci.insight, locale).isMismatch,
              ),
              tensionUpdates: (output.tensionUpdates ?? []).filter(
                (tu) =>
                  typeof tu.tension === "string" &&
                  !detectLanguageMismatch(tu.tension, locale).isMismatch,
              ),
              memories: (output.memories ?? []).filter((m) => {
                const combined = `${m.keyword ?? ""} ${m.insight ?? ""}`.trim();
                return (
                  combined.length > 0 &&
                  !detectLanguageMismatch(combined, locale).isMismatch
                );
              }),
              reinforcedKeywords: (output.reinforcedKeywords ?? []).filter(
                (k) =>
                  typeof k === "string" &&
                  !detectLanguageMismatch(k, locale).isMismatch,
              ),
            }),
          });

          // Phase 2 quality gate observability. coaching-summary's only
          // structural invariant is "at least one of {memories, insights}
          // survived sanitize" — anything less means the LLM produced
          // empty arrays or the language guard silent-dropped everything.
          const surviving =
            (extracted.coachingInsights?.length ?? 0) +
            (extracted.memories?.length ?? 0) +
            (extracted.tensionUpdates?.length ?? 0);
          logLLMQualityCheck({
            taskName: "coaching-summary",
            userId,
            qualityCheckResult: surviving > 0 ? "pass" : "fail-language",
            createdAfter: qualityWindowStart,
          });

          // Update user profile with coaching insights
          const profileResult = await getUserProfileInsights(userId);

          if (profileResult) {
            // insightsJson is already a normalized Record<string,unknown> from JSONB
            const currentProfile: Record<string, unknown> = {
              ...profileResult.insightsJson,
            };

            // Add coaching insights (cap at 50 most recent to prevent unbounded growth)
            const MAX_COACHING_INSIGHTS = 50;
            const merged = [
              ...((currentProfile.coachingInsights as
                | CoachingInsight[]
                | undefined) || []),
              ...(extracted.coachingInsights || []),
            ];
            currentProfile.coachingInsights = merged.slice(
              -MAX_COACHING_INSIGHTS,
            );
            currentProfile.dataSources = {
              ...(currentProfile.dataSources as
                | Record<string, unknown>
                | undefined),
              coaching: true,
            };

            // Update tension statuses
            if (extracted.tensionUpdates && currentProfile.keyTensions) {
              const keyTensions =
                currentProfile.keyTensions as ProfileTension[];
              for (const update of extracted.tensionUpdates) {
                if (!update.tension || !update.newStatus) continue;
                const tension = keyTensions.find((t: ProfileTension) =>
                  t.tension
                    ?.toLowerCase()
                    .includes(update.tension.toLowerCase()),
                );
                if (tension) {
                  tension.status = update.newStatus;
                }
              }
            }

            // Update profile insights + mark session saved (both idempotent, no transaction needed)
            await Promise.all([
              updateUserProfileInsights(userId, JSON.stringify(currentProfile)),
              markCoachingSessionSaved(sessionId),
            ]);
          }

          // Save memory entries + reinforce confirmed memories (independent, parallel)
          let savedMemories: MemoryEntry[] = [];
          const memoryOps: Promise<void>[] = [];

          if (
            extracted.memories &&
            Array.isArray(extracted.memories) &&
            extracted.memories.length > 0
          ) {
            savedMemories = validateMemories(
              extracted.memories,
              messages.length,
            );
            if (savedMemories.length > 0) {
              memoryOps.push(
                saveMemories(userId, savedMemories).then(() => {}),
              );
            }
          }

          if (
            extracted.reinforcedKeywords &&
            Array.isArray(extracted.reinforcedKeywords) &&
            extracted.reinforcedKeywords.length > 0
          ) {
            const BOOST_FACTOR = 1.15;
            const MAX_CONFIDENCE = 1.0;
            for (const keyword of extracted.reinforcedKeywords) {
              const match = existingMemories.find(
                (m) => m.keyword.toLowerCase() === keyword.toLowerCase(),
              );
              if (match) {
                const newConf = Math.min(
                  MAX_CONFIDENCE,
                  match.confidence * BOOST_FACTOR,
                );
                memoryOps.push(reinforceMemoryConfidence(match.id, newConf));
              }
            }
          }

          if (memoryOps.length > 0) await Promise.all(memoryOps);

          // Recompute user context + invalidate cache (before response)
          if (userId) {
            await recomputeUserContext(userId).catch(() => {});
            invalidateUserCache(userId);
          }

          // Check achievements (fire-and-forget)
          const reinforcedCount = extracted.reinforcedKeywords?.length ?? 0;
          void checkAchievements(userId, "coaching_completed", {
            rounds: userMessageCount,
            reinforcedCount,
          }).catch(() => {});

          // Phase 4 longitudinal memory: persist a structured session summary
          // (fire-and-forget, after extraction so it can't preempt it).
          if (userId && sessionId) {
            void summarizeAndStoreSession(
              userId,
              sessionId,
              messages,
              locale ?? "en",
            ).catch(() => {});
          }

          return NextResponse.json({
            success: true,
            sessionId,
            insights: {
              coachingInsights: extracted.coachingInsights,
              tensionUpdates: extracted.tensionUpdates,
            },
            memories: savedMemories,
          });
        } catch (aiErr) {
          logApiError("/api/coaching-summary", ApiErrorCode.AI_SERVICE_ERROR, {
            userId,
            message: "AI extraction of coaching insights failed",
            cause: aiErr,
          });
          // Still check achievements even if LLM extraction fails
          void checkAchievements(userId, "coaching_completed", {
            rounds: userMessageCount,
            reinforcedCount: 0,
          }).catch(() => {});
          return NextResponse.json({
            success: true,
            sessionId,
            insights: null,
            memories: [],
            insightExtractionFailed: true,
          });
        }
      }

      return NextResponse.json({ success: true, sessionId });
    } catch (error) {
      logApiError("/api/coaching-summary", ApiErrorCode.INTERNAL_ERROR, {
        message: "Unexpected error in coaching summary",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to save coaching summary",
        500,
      );
    }
  },
);
