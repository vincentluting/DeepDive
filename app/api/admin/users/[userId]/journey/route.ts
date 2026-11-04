import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { sql } from "@/lib/db/connection";
import { RUSH_THRESHOLD_MS } from "@/lib/scoring/constants";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";

// ── Types ────────────────────────────────────────

interface TimelineEvent {
  type:
    | "visit"
    | "funnel"
    | "questionnaire_start"
    | "questionnaire_complete"
    | "report_generated"
    | "reaction"
    | "nps"
    | "coaching_start";
  timestamp: string;
  summary: string;
  metadata: Record<string, unknown>;
}

// ── Helpers ──────────────────────────────────────

function safeParseJson(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

function extractArchetypeLabel(reportJson: unknown): string | null {
  const json = safeParseJson(reportJson);
  if (!json || typeof json !== "object") return null;
  const j = json as Record<string, unknown>;

  const synthesis = j.archetype_synthesis as
    | Record<string, unknown>
    | undefined;
  if (
    synthesis?.archetypes &&
    Array.isArray(synthesis.archetypes) &&
    synthesis.archetypes[0]
  ) {
    const first = synthesis.archetypes[0] as Record<string, unknown>;
    if (first.archetype_name) return first.archetype_name as string;
  }
  if (j.archetype_label) return j.archetype_label as string;
  if (typeof j.archetype === "string") return j.archetype;
  return null;
}

function computeAnswerStats(answersJson: unknown) {
  const answers = safeParseJson(answersJson);
  if (!Array.isArray(answers))
    return {
      totalQuestions: 0,
      answeredQuestions: 0,
      rushCount: 0,
      hesitationCount: 0,
      avgResponseTimeMs: 0,
      moduleBreakdown: {},
    };

  let totalQuestions = 0;
  let answeredQuestions = 0;
  let rushCount = 0;
  let hesitationCount = 0;
  let totalResponseTimeMs = 0;
  let timedCount = 0;

  const moduleStats: Record<string, { count: number; totalTimeMs: number }> =
    {};

  for (const answer of answers) {
    const a = answer as Record<string, unknown>;
    totalQuestions++;
    if (a.value !== undefined && a.value !== null) answeredQuestions++;

    const module = (a.module as string) || "unknown";
    if (!moduleStats[module])
      moduleStats[module] = { count: 0, totalTimeMs: 0 };
    moduleStats[module].count++;

    const responseTimeMs = a.responseTimeMs as number | undefined;
    if (typeof responseTimeMs === "number" && responseTimeMs > 0) {
      totalResponseTimeMs += responseTimeMs;
      timedCount++;
      moduleStats[module].totalTimeMs += responseTimeMs;

      // Rush detection per module type
      let threshold: number;
      if (module === "A") threshold = RUSH_THRESHOLD_MS.sjt;
      else if (module === "B") threshold = RUSH_THRESHOLD_MS.pvq;
      else threshold = RUSH_THRESHOLD_MS.ipip;

      if (responseTimeMs < threshold) rushCount++;

      // Hesitation: responses taking more than 3x the threshold
      if (responseTimeMs > threshold * 3) hesitationCount++;
    }
  }

  const moduleBreakdown: Record<string, { count: number; avgTimeMs: number }> =
    {};
  for (const [mod, stats] of Object.entries(moduleStats)) {
    moduleBreakdown[mod] = {
      count: stats.count,
      avgTimeMs:
        stats.count > 0 ? Math.round(stats.totalTimeMs / stats.count) : 0,
    };
  }

  return {
    totalQuestions,
    answeredQuestions,
    rushCount,
    hesitationCount,
    avgResponseTimeMs:
      timedCount > 0 ? Math.round(totalResponseTimeMs / timedCount) : 0,
    moduleBreakdown,
  };
}

function extractAssessmentHighlights(resultJson: unknown) {
  const json = safeParseJson(resultJson) as Record<string, unknown> | null;
  if (!json) return { topRIASEC: [], topBigFive: [], topValues: [] };

  // Top RIASEC
  let topRIASEC: string[] = [];
  const riasec = json.riasec as Record<string, unknown> | undefined;
  if (riasec?.top2 && Array.isArray(riasec.top2)) {
    topRIASEC = riasec.top2.map(String);
  } else if (riasec?.scores && typeof riasec.scores === "object") {
    const scores = riasec.scores as Record<string, number>;
    topRIASEC = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([k]) => k);
  }

  // Top Big Five
  let topBigFive: string[] = [];
  const bigFive = json.bigFive as Record<string, unknown> | undefined;
  if (bigFive?.domains && typeof bigFive.domains === "object") {
    const domains = bigFive.domains as Record<string, { score?: number }>;
    topBigFive = Object.entries(domains)
      .filter(([, v]) => typeof v?.score === "number")
      .sort(([, a], [, b]) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 2)
      .map(([k]) => k);
  }

  // Top Values
  let topValues: string[] = [];
  const values = json.values as Record<string, unknown> | undefined;
  if (values?.centered && typeof values.centered === "object") {
    const centered = values.centered as Record<string, number>;
    topValues = Object.entries(centered)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([k]) => k);
  } else if (values?.scores && typeof values.scores === "object") {
    const scores = values.scores as Record<string, number>;
    topValues = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([k]) => k);
  }

  return { topRIASEC, topBigFive, topValues };
}

function parseCoachingMessages(messagesJson: unknown) {
  const messages = safeParseJson(messagesJson);
  if (!Array.isArray(messages))
    return { messageCount: 0, userMessageCount: 0, avgUserMsgLength: 0 };

  let messageCount = 0;
  let userMessageCount = 0;
  let totalUserMsgLength = 0;

  for (const msg of messages) {
    const m = msg as Record<string, unknown>;
    messageCount++;
    if (m.role === "user") {
      userMessageCount++;
      if (typeof m.content === "string") totalUserMsgLength += m.content.length;
    }
  }

  return {
    messageCount,
    userMessageCount,
    avgUserMsgLength:
      userMessageCount > 0
        ? Math.round(totalUserMsgLength / userMessageCount)
        : 0,
  };
}

// ── Main Handler ─────────────────────────────────

export const GET = withLogging(
  "/api/admin/users/[userId]/journey",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const guard = await guardRoute(request, { tier: "admin" });
      if (guard.blocked) return guard.response;

      const { userId } = await context.params;

      // Verify user exists
      const userRows = await sql`
      SELECT "id", "email", "name", "createdAt", "registrationCountry", "careerStage", "journeyState", "cohort"
      FROM "User"
      WHERE "id" = ${userId}
    `;
      if (userRows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const user = {
        id: userRows[0].id as string,
        email: userRows[0].email as string,
        name: (userRows[0].name as string) || null,
        createdAt: String(userRows[0].createdAt),
        registrationCountry:
          (userRows[0].registrationCountry as string) || null,
        careerStage: (userRows[0].careerStage as string) || null,
        journeyState: (userRows[0].journeyState as string) || "not_started",
        cohort: (userRows[0].cohort as string) || null,
      };

      // Run all queries in parallel
      const [
        visitRows,
        sessionRows,
        assessmentRows,
        reportRows,
        reactionRows,
        npsRows,
        coachingRows,
        memoryRows,
        funnelRows,
        quickDiveRows,
        profileRows,
        personalProfileRows,
      ] = await Promise.all([
        // 1. Page visits (for discovery chapter)
        sql`
        SELECT "path", "referer", "country", "deviceType", "durationMs", "createdAt"
        FROM "PageVisit"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" ASC
        LIMIT 200
      `,
        // 2. Questionnaire sessions
        sql`
        SELECT "id", "tier", "language", "status", "startedAt", "completedAt",
               "totalTimeMs", "answerAssistantEnabled", "answersJson"
        FROM "QuestionnaireSession"
        WHERE "userId" = ${userId}
        ORDER BY "startedAt" ASC
      `,
        // 3. Assessment results
        sql`
        SELECT "id", "sessionId", "resultJson", "createdAt"
        FROM "AssessmentResult"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" ASC
      `,
        // 4. Reports
        sql`
        SELECT "id", "assessmentId", "reportJson", "generationTimeMs", "llmModel", "createdAt"
        FROM "CareerReport"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" ASC
      `,
        // 5. Reactions
        sql`
        SELECT "reportId", "reaction", "createdAt"
        FROM "ReportReaction"
        WHERE "userId" = ${userId}
      `,
        // 6. NPS
        sql`
        SELECT "reportId", "score", "feedback", "createdAt"
        FROM "ReportNPS"
        WHERE "userId" = ${userId}
      `,
        // 7. Coaching sessions
        sql`
        SELECT "id", "mode", "roundNumber", "maxRounds", "startedAt", "messagesJson"
        FROM "CoachingSession"
        WHERE "userId" = ${userId}
        ORDER BY "startedAt" ASC
      `,
        // 8. Memories
        sql`
        SELECT "category", "keyword", "insight", "source", "confidence", "createdAt"
        FROM "UserMemory"
        WHERE "userId" = ${userId} AND "isActive" = TRUE
        ORDER BY "confidence" DESC, "createdAt" DESC
      `,
        // 9. Funnel events
        sql`
        SELECT "event", "metadata", "createdAt"
        FROM "UserFunnel"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" ASC
      `,
        // 10. Quick Dive results
        sql`
        SELECT "id", "archetypeCode", "archetypeLabel", "exploreMode", "language", "createdAt"
        FROM "QuickDiveResult"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" ASC
      `,
        // 11. User profile (auth-linked)
        sql`
        SELECT "id", "isPublic", "createdAt"
        FROM "UserProfile"
        WHERE "userId" = ${userId}
      `,
        // 12. Personal profile (assessment-linked, contains profileJson)
        sql`
        SELECT "id", "profileJson", "version", "createdAt"
        FROM "PersonalProfile"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT 1
      `,
      ]);

      // ── Build Discovery Chapter ──

      const registrationDate = user.createdAt;
      const firstVisit =
        visitRows.length > 0
          ? {
              path: visitRows[0].path as string,
              referer: (visitRows[0].referer as string) || null,
              country: (visitRows[0].country as string) || null,
              deviceType: (visitRows[0].deviceType as string) || null,
              createdAt: String(visitRows[0].createdAt),
            }
          : null;

      const regTime = new Date(registrationDate).getTime();
      const preRegVisits = visitRows
        .filter((v) => new Date(String(v.createdAt)).getTime() < regTime)
        .map((v) => ({
          path: v.path as string,
          durationMs: (v.durationMs as number) || null,
          createdAt: String(v.createdAt),
        }));

      const timeToRegister = firstVisit
        ? regTime - new Date(firstVisit.createdAt).getTime()
        : null;

      const discovery = {
        firstVisit,
        registrationDate,
        timeToRegister,
        preRegVisits: preRegVisits.slice(0, 50),
      };

      // ── Build Questionnaire Chapter ──

      const sessions = sessionRows.map((s) => {
        const stats = computeAnswerStats(s.answersJson);
        return {
          id: s.id as string,
          tier: s.tier as string,
          language: s.language as string,
          status: s.status as string,
          startedAt: String(s.startedAt),
          completedAt: s.completedAt ? String(s.completedAt) : null,
          totalTimeMs: (s.totalTimeMs as number) || null,
          answerAssistantEnabled: s.answerAssistantEnabled === true,
          ...stats,
        };
      });

      // ── Build Assessment Chapter ──

      const assessments = assessmentRows.map((a) => {
        const highlights = extractAssessmentHighlights(a.resultJson);
        return {
          id: a.id as string,
          sessionId: a.sessionId as string,
          createdAt: String(a.createdAt),
          ...highlights,
        };
      });

      // ── Build Reports Chapter ──

      const reactionMap: Record<
        string,
        { reaction: string; createdAt: string }
      > = {};
      for (const r of reactionRows) {
        reactionMap[r.reportId as string] = {
          reaction: r.reaction as string,
          createdAt: String(r.createdAt),
        };
      }

      const npsMap: Record<
        string,
        { score: number; feedback: string | null; createdAt: string }
      > = {};
      for (const n of npsRows) {
        npsMap[n.reportId as string] = {
          score: n.score as number,
          feedback: (n.feedback as string) || null,
          createdAt: String(n.createdAt),
        };
      }

      const reports = reportRows.map((r) => {
        const reportId = r.id as string;
        const reaction = reactionMap[reportId] || null;
        const nps = npsMap[reportId] || null;

        return {
          id: reportId,
          assessmentId: r.assessmentId as string,
          createdAt: String(r.createdAt),
          generationTimeMs: (r.generationTimeMs as number) || null,
          llmModel: (r.llmModel as string) || null,
          archetypeLabel: extractArchetypeLabel(r.reportJson),
          reaction: reaction?.reaction || null,
          npsScore: nps?.score || null,
          npsFeedback: nps?.feedback || null,
        };
      });

      // ── Build Coaching Chapter ──

      const coachingSessions = coachingRows.map((c) => {
        const msgStats = parseCoachingMessages(c.messagesJson);
        return {
          id: c.id as string,
          mode: (c.mode as string) || "report-qa",
          roundNumber: (c.roundNumber as number) || 0,
          maxRounds: (c.maxRounds as number) || 5,
          startedAt: String(c.startedAt),
          ...msgStats,
        };
      });

      const memories = memoryRows.map((m) => ({
        category: m.category as string,
        keyword: m.keyword as string,
        insight: m.insight as string,
        source: m.source as string,
        confidence: m.confidence as number,
        createdAt: String(m.createdAt),
      }));

      const coaching = {
        totalSessions: coachingSessions.length,
        sessions: coachingSessions,
        memories,
      };

      // ── Build Timeline ──

      const timeline: TimelineEvent[] = [];

      // Visit events (sample — first visit + every 10th to avoid flooding)
      for (let i = 0; i < visitRows.length; i++) {
        if (i === 0 || i === visitRows.length - 1 || i % 10 === 0) {
          const v = visitRows[i];
          timeline.push({
            type: "visit",
            timestamp: String(v.createdAt),
            summary: `Visited ${v.path as string}`,
            metadata: { path: v.path, deviceType: v.deviceType },
          });
        }
      }

      // Funnel events
      for (const f of funnelRows) {
        timeline.push({
          type: "funnel",
          timestamp: String(f.createdAt),
          summary: `Funnel: ${f.event as string}`,
          metadata: {
            event: f.event,
            ...((safeParseJson(f.metadata) as Record<string, unknown>) || {}),
          },
        });
      }

      // Questionnaire events
      for (const s of sessions) {
        timeline.push({
          type: "questionnaire_start",
          timestamp: s.startedAt,
          summary: `Started ${s.tier === "quick" ? "Quick Dive" : "Deep Dive"} questionnaire (${s.language.toUpperCase()})`,
          metadata: { sessionId: s.id, tier: s.tier, language: s.language },
        });
        if (s.completedAt) {
          const minutes = s.totalTimeMs
            ? Math.round(s.totalTimeMs / 60000)
            : null;
          timeline.push({
            type: "questionnaire_complete",
            timestamp: s.completedAt,
            summary: `Completed ${s.tier === "quick" ? "Quick Dive" : "Deep Dive"} questionnaire${minutes ? ` (${minutes} min)` : ""}`,
            metadata: {
              sessionId: s.id,
              tier: s.tier,
              totalTimeMs: s.totalTimeMs,
            },
          });
        }
      }

      // Report events
      for (const r of reports) {
        const genSec = r.generationTimeMs
          ? Math.round(r.generationTimeMs / 1000)
          : null;
        timeline.push({
          type: "report_generated",
          timestamp: r.createdAt,
          summary: `Report generated${r.archetypeLabel ? `: ${r.archetypeLabel}` : ""}${genSec ? ` (${genSec}s)` : ""}`,
          metadata: {
            reportId: r.id,
            archetypeLabel: r.archetypeLabel,
            generationTimeMs: r.generationTimeMs,
          },
        });
      }

      // Reaction events
      for (const [reportId, r] of Object.entries(reactionMap)) {
        timeline.push({
          type: "reaction",
          timestamp: r.createdAt,
          summary: `Reacted to report: ${r.reaction}`,
          metadata: { reportId, reaction: r.reaction },
        });
      }

      // NPS events
      for (const [reportId, n] of Object.entries(npsMap)) {
        timeline.push({
          type: "nps",
          timestamp: n.createdAt,
          summary: `NPS score: ${n.score}/10${n.feedback ? ` — "${n.feedback}"` : ""}`,
          metadata: { reportId, score: n.score, feedback: n.feedback },
        });
      }

      // Coaching events
      for (const c of coachingSessions) {
        timeline.push({
          type: "coaching_start",
          timestamp: c.startedAt,
          summary: `Coaching session (${c.mode}, ${c.messageCount} messages)`,
          metadata: {
            sessionId: c.id,
            mode: c.mode,
            messageCount: c.messageCount,
          },
        });
      }

      // Sort timeline by timestamp
      timeline.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      // ── Quick Dive data ──────────────────────────
      const latestQd =
        quickDiveRows.length > 0
          ? quickDiveRows[quickDiveRows.length - 1]
          : null;
      const quickDive = latestQd
        ? {
            archetypeCode: latestQd.archetypeCode as string,
            archetypeLabel: latestQd.archetypeLabel as string,
            exploreMode: latestQd.exploreMode as string,
            language: latestQd.language as string,
            createdAt: String(latestQd.createdAt),
          }
        : null;

      // ── Journey Pipeline (uses authoritative journeyState + real tables) ──
      const js = user.journeyState;
      const JOURNEY_ORDER = [
        "not_started",
        "quick_dive_complete",
        "deep_dive_complete",
        "profile_generated",
        "report_generated",
        "coaching_unlocked",
      ];
      const journeyIdx = JOURNEY_ORDER.indexOf(js);

      const ddSession = sessions.find(
        (s) => s.tier === "deep" && s.status === "completed",
      );
      const hasCoaching = coachingSessions.length > 0;
      const latestReport =
        reports.length > 0 ? reports[reports.length - 1] : null;

      // journeyState is the SOLE authority for stage completion
      const pipeline = {
        registered: { done: true, at: user.createdAt },
        quickDive: {
          done: journeyIdx >= 1,
          at: quickDive?.createdAt || null,
          archetypeLabel: quickDive?.archetypeLabel || null,
          exploreMode: quickDive?.exploreMode || null,
        },
        deepDive: {
          done: journeyIdx >= 2,
          at: ddSession?.completedAt || null,
          timeMs: ddSession?.totalTimeMs || null,
          questions: ddSession
            ? `${ddSession.answeredQuestions}/${ddSession.totalQuestions}`
            : null,
        },
        profile: {
          done: journeyIdx >= 3,
          at:
            profileRows.length > 0
              ? String(profileRows[0].createdAt)
              : assessments.length > 0
                ? assessments[assessments.length - 1].createdAt
                : null,
        },
        report: {
          done: journeyIdx >= 4,
          at: latestReport?.createdAt || null,
          generationTimeMs: latestReport?.generationTimeMs || null,
        },
        coaching: {
          done: journeyIdx >= 5 || hasCoaching, // coaching_unlocked OR has actual sessions
          at:
            coachingSessions.length > 0 ? coachingSessions[0].startedAt : null,
          rounds: hasCoaching
            ? `${coachingSessions[coachingSessions.length - 1].roundNumber}/${coachingSessions[coachingSessions.length - 1].maxRounds}`
            : null,
        },
      };

      // ── Engagement metrics ──────────────────────
      const allRushCount = sessions.reduce((sum, s) => sum + s.rushCount, 0);
      const allAnswered = sessions.reduce(
        (sum, s) => sum + s.answeredQuestions,
        0,
      );
      const rushRatio = allAnswered > 0 ? allRushCount / allAnswered : 0;
      const totalUserMessages = coachingSessions.reduce(
        (sum, c) => sum + c.userMessageCount,
        0,
      );
      const avgCoachMsgLen =
        coachingSessions.length > 0
          ? Math.round(
              coachingSessions.reduce(
                (sum, c) => sum + c.avgUserMsgLength * c.userMessageCount,
                0,
              ) / Math.max(totalUserMessages, 1),
            )
          : 0;

      const lastActivityDates = [
        user.createdAt,
        ...sessions
          .filter((s) => s.completedAt)
          .map((s) => s.completedAt as string),
        ...reports.map((r) => r.createdAt),
        ...coachingSessions.map((c) => c.startedAt),
        ...visitRows.slice(-1).map((v) => String(v.createdAt)),
        ...quickDiveRows.map((q) => String(q.createdAt)),
      ];
      const lastActiveAt = lastActivityDates.sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      )[0];

      const engagement = {
        totalVisits: visitRows.length,
        lastActiveAt,
        rushRatio: Math.round(rushRatio * 100),
        totalUserMessages,
        avgCoachMsgLen,
        funnelEventsCount: funnelRows.length,
        hasReaction: reactionRows.length > 0,
        hasNps: npsRows.length > 0,
        quickDiveCount: quickDiveRows.length,
      };

      // ── Personal Profile data ──────────────────
      const personalProfile = (() => {
        if (personalProfileRows.length === 0) return null;
        const row = personalProfileRows[0];
        const pj = safeParseJson(row.profileJson) as Record<
          string,
          unknown
        > | null;
        if (!pj) return null;

        const archetype = pj.archetype as Record<string, unknown> | undefined;
        const collabMapping = pj.collabMapping as
          | Record<string, unknown>
          | undefined;
        const schwartzAnchors = pj.schwartzAnchors as
          | Record<string, unknown>
          | undefined;
        const socialStyle = pj.socialStyle as
          | Record<string, unknown>
          | undefined;
        const leadershipStyle = pj.leadershipStyle as
          | Record<string, unknown>
          | undefined;
        const interpersonalEnergy = pj.interpersonalEnergy as
          | Record<string, unknown>
          | undefined;
        const conflictHandling = pj.conflictHandling as
          | Record<string, unknown>
          | undefined;

        return {
          id: row.id as string,
          version: row.version as string,
          createdAt: String(row.createdAt),
          archetype: archetype
            ? {
                code: archetype.code as string,
                label_en: archetype.label_en as string,
                label_zh: archetype.label_zh as string,
                confidence: archetype.confidence as number,
                confidenceLevel: archetype.confidenceLevel as string,
              }
            : null,
          cognitiveStyleCode: (pj.cognitiveStyleCode as string) || null,
          cognitiveStyleDisplayMode:
            (pj.cognitiveStyleDisplayMode as string) || null,
          collabStyle: collabMapping
            ? {
                primary: collabMapping.primary as string,
                secondary: (collabMapping.secondary as string) || null,
              }
            : null,
          topValues: schwartzAnchors?.top3
            ? (schwartzAnchors.top3 as string[])
            : [],
          riasecScores: (pj.riasecScores as Record<string, number>) || null,
          bigFiveScores: (pj.bigFiveScores as Record<string, number>) || null,
          socialStyle: socialStyle?.style
            ? (socialStyle.style as string)
            : null,
          leadershipStyle: leadershipStyle?.primary
            ? (leadershipStyle.primary as string)
            : null,
          interpersonalEnergy: interpersonalEnergy?.quadrant
            ? (interpersonalEnergy.quadrant as string)
            : null,
          conflictHandling: conflictHandling?.primary
            ? (conflictHandling.primary as string)
            : null,
        };
      })();

      return NextResponse.json({
        user,
        discovery,
        quickDive,
        questionnaire: { sessions },
        assessment: { results: assessments },
        reports,
        coaching,
        timeline,
        pipeline,
        engagement,
        personalProfile,
      });
    } catch (error) {
      logApiError(
        "/api/admin/users/[userId]/journey",
        ApiErrorCode.INTERNAL_ERROR,
        {
          message: "Failed to fetch user journey",
          cause: error,
        },
      );
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);
