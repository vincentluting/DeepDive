// ============================================================
// Research Progress — Query research participant completion status
//
// Returns per-participant progress through the full research pipeline:
//   Pre-test → Quick Dive → Deep Dive → Report → Coaching → Post-immediate → Post-1week
//
// Only returns the CANONICAL research population: researchGroup IS NOT NULL
// AND researchConsentAt IS NOT NULL AND isAdmin = FALSE AND an active (not
// withdrawn) ConsentRecord exists — matching lib/db/research-metrics.ts.
// Users who withdrew consent disappear from progress tracking and counts.
// ============================================================

import { sql } from "./connection";

/** Safely convert a DB timestamp value to ISO string. Handles Date, string, null. */
function safeISOString(val: unknown): string | null {
  if (val == null) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return new Date(val).toISOString();
  return null;
}

export interface ParticipantProgress {
  participantId: string;
  userId: string;
  email: string;
  researchGroup: "classic" | "immersive";
  registeredAt: string;

  preTest: {
    completed: boolean;
    completedAt?: string;
    sccTotal?: number;
  } | null;
  quickDive: {
    completed: boolean;
    completedAt?: string;
    mode?: string;
    archetypeCode?: string;
  } | null;
  deepDive: {
    completed: boolean;
    completedAt?: string;
    totalTimeMs?: number;
    rushCount?: number;
  } | null;
  report: {
    generated: boolean;
    generatedAt?: string;
    reaction?: string;
    npsScore?: number;
  } | null;
  coaching: {
    started: boolean;
    sessionCount: number;
    totalRounds: number;
    feedbackRating?: string;
  } | null;
  postImmediate: {
    completed: boolean;
    completedAt?: string;
    sccTotal?: number;
  } | null;
  post1Week: {
    completed: boolean;
    completedAt?: string;
    dueDate?: string;
    sccTotal?: number;
  } | null;

  lastActivityAt: string;
  status: "complete" | "active" | "stalled" | "needs_attention";
  missingSteps: string[];

  /** Invite code this participant registered with (reverse-looked-up from InviteCode.claimedByUserIds). Null if none matched. */
  inviteCode: string | null;
  /** Admin assignment note on that invite code (e.g. who it was handed to). */
  inviteNote: string | null;
}

export interface ResearchProgressSummary {
  totalParticipants: number;
  classicCount: number;
  immersiveCount: number;
  fullyComplete: number;
  dataUsable: number;
  needsReminder: number;
}

/**
 * Get research progress for consented research participants
 * (researchGroup IS NOT NULL AND researchConsentAt IS NOT NULL).
 * Uses a single CTE-heavy query to aggregate all pipeline steps.
 */
export async function getResearchParticipantProgress(): Promise<{
  participants: ParticipantProgress[];
  summary: ResearchProgressSummary;
}> {
  const rows = await sql`
    WITH research_users AS (
      SELECT
        u."id",
        u."email",
        u."researchGroup",
        u."researchParticipantId",
        u."createdAt" AS "registeredAt"
      FROM "User" u
      WHERE u."researchGroup" IS NOT NULL
        AND u."researchConsentAt" IS NOT NULL
        AND u."isAdmin" = FALSE
        AND EXISTS (
          SELECT 1 FROM "ConsentRecord" cr
          WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL
        )
    ),
    pre_test AS (
      -- T0 canonical rule: FIRST pre record (baseline must predate intervention)
      SELECT DISTINCT ON ("userId")
        "userId",
        "createdAt",
        "sccTotalScore"
      FROM "PrePostAssessment"
      WHERE "assessmentType" = 'pre'
      ORDER BY "userId", "createdAt" ASC
    ),
    post_imm AS (
      SELECT DISTINCT ON ("userId")
        "userId",
        "createdAt",
        "sccTotalScore"
      FROM "PrePostAssessment"
      WHERE "assessmentType" = 'post_immediate'
      ORDER BY "userId", "createdAt" DESC
    ),
    post_1wk AS (
      SELECT DISTINCT ON ("userId")
        "userId",
        "createdAt",
        "sccTotalScore"
      FROM "PrePostAssessment"
      WHERE "assessmentType" = 'post_1week'
      ORDER BY "userId", "createdAt" DESC
    ),
    quick_dive AS (
      SELECT DISTINCT ON ("userId")
        "userId",
        "createdAt",
        "exploreMode",
        "archetypeCode"
      FROM "QuickDiveResult"
      ORDER BY "userId", "createdAt" DESC
    ),
    deep_dive AS (
      SELECT DISTINCT ON ("userId")
        qs."userId",
        qs."completedAt",
        qs."totalTimeMs",
        ar."resultJson"
      FROM "QuestionnaireSession" qs
      LEFT JOIN "AssessmentResult" ar ON ar."sessionId" = qs."id"
      WHERE qs."tier" = 'deep' AND qs."status" = 'completed'
      ORDER BY qs."userId", qs."completedAt" DESC
    ),
    report AS (
      SELECT DISTINCT ON ("userId")
        cr."userId",
        cr."createdAt" AS "generatedAt"
      FROM "CareerReport" cr
      ORDER BY cr."userId", cr."createdAt" DESC
    ),
    reaction AS (
      SELECT DISTINCT ON ("userId")
        "userId",
        "reaction"
      FROM "ReportReaction"
      ORDER BY "userId", "createdAt" DESC
    ),
    nps AS (
      SELECT DISTINCT ON ("userId")
        "userId",
        "score"
      FROM "ReportNPS"
      ORDER BY "userId", "createdAt" DESC
    ),
    coaching_agg AS (
      -- totalRounds = SUM across sessions (matches admin-thesis-export semantics);
      -- MAX(roundNumber) would understate users with multiple sessions
      SELECT
        "userId",
        COUNT(*)::int AS "sessionCount",
        COALESCE(SUM("roundNumber"), 0)::int AS "totalRounds"
      FROM "CoachingSession"
      WHERE "userId" IS NOT NULL
      GROUP BY "userId"
    ),
    coaching_fb AS (
      SELECT DISTINCT ON ("userId")
        "userId",
        "rating"
      FROM "CoachingFeedback"
      ORDER BY "userId", "createdAt" DESC
    ),
    last_activity AS (
      SELECT
        ru."id" AS "userId",
        GREATEST(
          ru."registeredAt",
          pt."createdAt",
          qd."createdAt",
          dd."completedAt",
          rp."generatedAt",
          pi."createdAt",
          pw."createdAt"
        ) AS "lastActivityAt"
      FROM research_users ru
      LEFT JOIN pre_test pt ON pt."userId" = ru."id"
      LEFT JOIN quick_dive qd ON qd."userId" = ru."id"
      LEFT JOIN deep_dive dd ON dd."userId" = ru."id"
      LEFT JOIN report rp ON rp."userId" = ru."id"
      LEFT JOIN post_imm pi ON pi."userId" = ru."id"
      LEFT JOIN post_1wk pw ON pw."userId" = ru."id"
    )
    SELECT
      ru."id" AS "userId",
      ru."email",
      ru."researchGroup",
      ru."researchParticipantId",
      ru."registeredAt",

      pt."createdAt" AS "preTestAt",
      pt."sccTotalScore" AS "preScc",

      qd."createdAt" AS "quickDiveAt",
      qd."exploreMode",
      qd."archetypeCode",

      dd."completedAt" AS "deepDiveAt",
      dd."totalTimeMs",
      dd."resultJson",

      rp."generatedAt" AS "reportAt",
      rr."reaction",
      np."score" AS "npsScore",

      ca."sessionCount",
      ca."totalRounds",
      cf."rating" AS "coachingRating",

      pi."createdAt" AS "postImmAt",
      pi."sccTotalScore" AS "postImmScc",

      pw."createdAt" AS "post1wkAt",
      pw."sccTotalScore" AS "post1wkScc",

      la."lastActivityAt",

      inv."code" AS "inviteCode",
      inv."adminNote" AS "inviteNote"
    FROM research_users ru
    LEFT JOIN pre_test pt ON pt."userId" = ru."id"
    LEFT JOIN quick_dive qd ON qd."userId" = ru."id"
    LEFT JOIN deep_dive dd ON dd."userId" = ru."id"
    LEFT JOIN report rp ON rp."userId" = ru."id"
    LEFT JOIN reaction rr ON rr."userId" = ru."id"
    LEFT JOIN nps np ON np."userId" = ru."id"
    LEFT JOIN coaching_agg ca ON ca."userId" = ru."id"
    LEFT JOIN coaching_fb cf ON cf."userId" = ru."id"
    LEFT JOIN post_imm pi ON pi."userId" = ru."id"
    LEFT JOIN post_1wk pw ON pw."userId" = ru."id"
    LEFT JOIN last_activity la ON la."userId" = ru."id"
    LEFT JOIN LATERAL (
      SELECT ic."code", ic."adminNote"
      FROM "InviteCode" ic
      WHERE ic."claimedByUserIds" @> jsonb_build_array(ru."id")
      ORDER BY ic."createdAt" DESC
      LIMIT 1
    ) inv ON true
    ORDER BY ru."researchParticipantId" ASC NULLS LAST, ru."registeredAt" ASC
  `;

  const now = Date.now();
  const _THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const participants: ParticipantProgress[] = rows.map((r) => {
    try {
      const hasPreTest = !!r.preTestAt;
      const hasQuickDive = !!r.quickDiveAt;
      const hasDeepDive = !!r.deepDiveAt;
      const hasReport = !!r.reportAt;
      const hasCoaching = (r.sessionCount as number) > 0;
      const hasPostImm = !!r.postImmAt;
      const hasPost1wk = !!r.post1wkAt;

      // Rush count from resultJson meta
      let rushCount: number | undefined;
      if (r.resultJson) {
        const result = r.resultJson as { meta?: { rushAnswerCount?: number } };
        rushCount = result?.meta?.rushAnswerCount;
      }

      // Post-1week due date: 7 days after deep dive completion
      let post1wkDueDate: string | undefined;
      if (hasDeepDive && !hasPost1wk) {
        const deepDiveDate = new Date(safeISOString(r.deepDiveAt) || "");
        const dueDate = new Date(deepDiveDate.getTime() + SEVEN_DAYS_MS);
        post1wkDueDate = dueDate.toISOString();
      }

      // Missing steps
      const missingSteps: string[] = [];
      if (!hasPreTest) missingSteps.push("pre-test");
      if (!hasQuickDive) missingSteps.push("quick-dive");
      if (!hasDeepDive) missingSteps.push("deep-dive");
      if (!hasReport) missingSteps.push("report");
      if (!hasCoaching) missingSteps.push("coaching");
      if (!hasPostImm) missingSteps.push("post-immediate");
      if (!hasPost1wk) missingSteps.push("post-1week");

      // Status calculation
      const lastActivity = r.lastActivityAt
        ? new Date(r.lastActivityAt as string).getTime()
        : new Date(r.registeredAt as string).getTime();
      const daysSinceActivity = (now - lastActivity) / (24 * 60 * 60 * 1000);

      let status: ParticipantProgress["status"];
      if (missingSteps.length === 0) {
        status = "complete";
      } else if (daysSinceActivity > 3) {
        status = "stalled";
      } else if (
        (hasDeepDive && !hasCoaching) ||
        (hasReport && !hasPostImm) ||
        (hasPostImm &&
          hasPost1wk === false &&
          post1wkDueDate &&
          new Date(post1wkDueDate).getTime() < now)
      ) {
        status = "needs_attention";
      } else {
        status = "active";
      }

      return {
        participantId:
          (r.researchParticipantId as string) ||
          (r.userId as string).slice(0, 8),
        userId: r.userId as string,
        email: r.email as string,
        researchGroup: r.researchGroup as "classic" | "immersive",
        registeredAt: safeISOString(r.registeredAt) || new Date().toISOString(),

        preTest: hasPreTest
          ? {
              completed: true,
              completedAt: safeISOString(r.preTestAt) || "",
              sccTotal: r.preScc != null ? Number(r.preScc) : undefined,
            }
          : null,

        quickDive: hasQuickDive
          ? {
              completed: true,
              completedAt: safeISOString(r.quickDiveAt) || "",
              mode: r.exploreMode as string | undefined,
              archetypeCode: r.archetypeCode as string | undefined,
            }
          : null,

        deepDive: hasDeepDive
          ? {
              completed: true,
              completedAt: safeISOString(r.deepDiveAt) || "",
              totalTimeMs: r.totalTimeMs as number | undefined,
              rushCount,
            }
          : null,

        report: hasReport
          ? {
              generated: true,
              generatedAt: safeISOString(r.reportAt) || "",
              reaction: r.reaction as string | undefined,
              npsScore: r.npsScore != null ? Number(r.npsScore) : undefined,
            }
          : null,

        coaching: {
          started: hasCoaching,
          sessionCount: (r.sessionCount as number) || 0,
          totalRounds: (r.totalRounds as number) || 0,
          feedbackRating: r.coachingRating as string | undefined,
        },

        postImmediate: hasPostImm
          ? {
              completed: true,
              completedAt: safeISOString(r.postImmAt) || "",
              sccTotal: r.postImmScc != null ? Number(r.postImmScc) : undefined,
            }
          : null,

        post1Week: hasPost1wk
          ? {
              completed: true,
              completedAt: safeISOString(r.post1wkAt) || "",
              sccTotal: r.post1wkScc != null ? Number(r.post1wkScc) : undefined,
            }
          : !hasPost1wk && post1wkDueDate
            ? { completed: false, dueDate: post1wkDueDate }
            : null,

        lastActivityAt:
          safeISOString(r.lastActivityAt) ||
          safeISOString(r.registeredAt) ||
          new Date().toISOString(),
        status,
        missingSteps,
        inviteCode: (r.inviteCode as string) ?? null,
        inviteNote: (r.inviteNote as string) ?? null,
      };
    } catch (mapErr) {
      console.error(
        `[research-progress] Failed to map row for userId=${r.userId}:`,
        mapErr,
      );
      return {
        participantId: String(
          r.researchParticipantId || r.userId || "unknown",
        ).slice(0, 8),
        userId: String(r.userId || "unknown"),
        email: String(r.email || ""),
        researchGroup:
          (r.researchGroup as "classic" | "immersive") || "classic",
        registeredAt: safeISOString(r.registeredAt) || new Date().toISOString(),
        preTest: null,
        quickDive: null,
        deepDive: null,
        report: null,
        coaching: { started: false, sessionCount: 0, totalRounds: 0 },
        postImmediate: null,
        post1Week: null,
        lastActivityAt:
          safeISOString(r.registeredAt) || new Date().toISOString(),
        status: "needs_attention" as const,
        missingSteps: ["mapping-error"],
        inviteCode: null,
        inviteNote: null,
      };
    }
  });

  // Summary
  const totalParticipants = participants.length;
  const classicCount = participants.filter(
    (p) => p.researchGroup === "classic",
  ).length;
  const immersiveCount = participants.filter(
    (p) => p.researchGroup === "immersive",
  ).length;
  const fullyComplete = participants.filter(
    (p) => p.status === "complete",
  ).length;
  const dataUsable = participants.filter(
    (p) => p.report?.generated && p.postImmediate?.completed,
  ).length;
  const needsReminder = participants.filter(
    (p) => p.status === "stalled" || p.status === "needs_attention",
  ).length;

  return {
    participants,
    summary: {
      totalParticipants,
      classicCount,
      immersiveCount,
      fullyComplete,
      dataUsable,
      needsReminder,
    },
  };
}
